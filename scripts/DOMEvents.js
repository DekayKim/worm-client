import Socket from "./Socket";
import WormManager from "./WormManager";
import FoodManager from "./FoodManager";
import SpatialHash from "./SpatialHash";

export default class DOMEvents {
  static init() {
    this.titleDiv = this._get("title");
    this.ingameDiv = this._get("ingame");
    this.gameOverDiv = this._get("gameover");
    this.rankerContainers = document.getElementsByClassName("ranker-container");

    for (let i = 0; i < this.rankerContainers.length; i++) {
      const container = this.rankerContainers[i];
      container.style.opacity = 1 - i * 0.08;
    }
    this.title();
    this.gameOver();
    this._hide(this.gameOverDiv);

    this._setRankerContainer(1, "지금", 5000, "#ff0000");
  }

  static title() {
    /* start button - click */
    this._get("start-button").addEventListener("click", () => {
      this._hide(this._get("title"));

      Socket.enter(this._get("nickname").value);
      this.showIngame();
    });

    /* input edit */
    this._get("nickname").addEventListener("input", e => {
      // const translate = inko.ko2en(e.target.value);
      // e.target.value = translate;
    });
  }

  static gameOver() {
    this.makeRankItem(5000, "hello", 1000, this._get("my-rank"));
    this.makeRankItem(5000, "hello", 1000, this._get("my-best"));
    this.makeRankItem(5000, "hello", 1000, this._get("all-rank"));

    this._get("restart").addEventListener("click", () => {
      this._hide(this._get("gameover"));
      Socket.enter(this._get("nickname").value);
    });
  }

  static showIngame() {
    this._show(this.ingameDiv);
  }

  static _setRankerContainer(
    rank = null,
    name = null,
    score = null,
    color = null
  ) {
    const container = this.rankerContainers[rank - 1];
    if (name !== null) container.childNodes[3].textContent = name;
    if (score !== null)
      container.childNodes[5].textContent = score.toLocaleString();
    if (color !== null) container.style.color = color;
  }

  static showGameOver() {
    this._hide(this.titleDiv);
    this._show(this.gameOverDiv);
    this.gameOverDiv.style.opacity = 0;
    this.transitionStartTime = Date.now();
    this._get("restart").disabled = true;
    this.transitionId = setInterval(() => {
      const elapsedTime = Date.now() - this.transitionStartTime;
      let progress = elapsedTime / 1000;
      if (progress > 1) progress = 1;

      this.gameOverDiv.style.opacity = progress;

      if (progress === 1) {
        clearInterval(this.transitionId);

        /* done */
        WormManager.reset();
        FoodManager.reset();
        SpatialHash.reset();
        this._get("restart").disabled = false;
      }
    }, 1000 / 60);
  }

  static makeRankItem(value, nickname, score, parent) {
    const containerDOM = document.createElement("div");
    containerDOM.style.width = "90%";
    containerDOM.style.padding = "0px 5%";
    containerDOM.style.height = "5rem";
    containerDOM.style.display = "flex";
    containerDOM.style.justifyContent = "space-between";
    containerDOM.style.alignItems = "center";

    const valueDOM = document.createElement("span");
    valueDOM.style.width = "20%";
    valueDOM.innerText = value.toLocaleString() + " 위";
    containerDOM.appendChild(valueDOM);

    const nicknameDOM = document.createElement("span");
    nicknameDOM.style.width = "30%";
    nicknameDOM.innerText = nickname + "";
    containerDOM.appendChild(nicknameDOM);

    const scoreDOM = document.createElement("span");
    scoreDOM.style.width = "30%";
    scoreDOM.style.textAlign = "right";
    scoreDOM.innerText = score.toLocaleString() + " 점";
    containerDOM.appendChild(scoreDOM);

    parent.appendChild(containerDOM);
  }

  static _get(id) {
    return document.getElementById(id);
  }

  static _hide(element) {
    element.style.display = "none";
  }

  static _show(element) {
    element.style.display = "flex";
  }
}
