import Socket from "./Socket";
import WormManager from "./WormManager";
import FoodManager from "./FoodManager";
import SpatialHash from "./SpatialHash";
import Share from "./share";
import emojiRegex from "emoji-regex";

export default class DOMEvents {
  static init() {
    this.titleDiv = this._get("title");
    this.ingameDiv = this._get("ingame");
    this.gameOverDiv = this._get("gameover");
    this.soundDiv = this._get("sound");
    this.rankerContainers = document.getElementsByClassName("ranker-container");

    for (let i = 0; i < 10; i++) {
      const container = this.rankerContainers[i];
      container.style.opacity = 1 - i * 0.08;
    }
    this.sound();
    this.title();
    this.gameOver();
  }

  static sound() {
    const sound = localStorage.getItem("sound") === "true";

    const soundON = () => {
      this._get("icon").classList.remove("sound-off");
      this._get("icon").classList.add("sound-on");
      this._get("sound-state").textContent = "Sound\nON";
      Share.set("sound", true);
      localStorage.setItem("sound", true);
      if (Share.bgm) {
        if (!Share.bgm.isPlaying) Share.bgm.play();
        Share.bgm.volume = 1;
      }
    };

    const soundOFF = () => {
      this._get("icon").classList.remove("sound-on");
      this._get("icon").classList.add("sound-off");
      this._get("sound-state").textContent = "Sound\nOFF";
      Share.set("sound", false);
      localStorage.setItem("sound", false);
      if (Share.bgm) Share.bgm.volume = 0;
    };

    if (sound) soundON();
    else soundOFF();

    Share.set("sound", sound);
    this._get("sound").onclick = () => {
      const icon = this._get("icon");
      if (icon.classList.contains("sound-on")) {
        soundOFF();
      } else {
        soundON();
      }
    };
  }

  static titleSetting() {
    if (Share.login) {
      if (Share.login !== "guest") {
        const { nickname } = Share.login;
        this._get("nickname").value = nickname;
        this._get("nickname").disabled = true;
      }
    }
  }

  static title() {
    this.titleSetting();
    Share.login = "guest";
    /* start button - click */
    this._get("start-button").addEventListener("click", () => {
      // toggleFullScreen();
      // requestFullScreen(document.body);
      // if (Share.joystick) Share.joystick.show();
      if (Share.login) {
        this._hide(this._get("title"));
        this.showIngame();
        let userId = 0;
        if (Share.login !== "guest") userId = Share.login.userIdx;
        Socket.enter(this._get("nickname").value, userId);
      }
    });

    /* input edit */
    const regex = new emojiRegex();
    this._get("nickname").addEventListener("input", e => {
      const { value } = e.target;
      if (value.length > 15) e.target.value = value.substring(0, 15);

      const result = regex.exec(e.target.value);
      if (result) {
        e.target.value = value.replace(regex, "");
      }
    });
  }

  static gameOver() {
    this._get("restart").addEventListener("click", () => {
      this._removeAllRankItems(this._get("my-rank"));
      this._removeAllRankItems(this._get("my-best"));
      this._removeAllRankItems(this._get("all-rank"));
      this._hide(this._get("gameover"));
      this.showIngame();

      let userId = 0;
      if (Share.login !== "guest") userId = Share.login.userIdx;

      Socket.enter(this._get("nickname").value, userId);
    });
  }

  static showIngame() {
    this._get("my-score").textContent = 0;
    this._show(this.ingameDiv);
    this._hide(this.soundDiv);
    if (Share.joystick) Share.joystick.show();
  }

  static hideInGame() {
    this._hide(this.ingameDiv);
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
    if (color !== null) container.childNodes[3].style.color = color;
  }

  static showGameOver() {
    this._show(this.soundDiv);
    if (Share.sound) gameResources.sound_gameover.sound.play();
    if (Share.joystick) Share.joystick.hide();


    const { rank, name, point } = Share.dieInfo;
    this.makeRankItem(rank, name, point, this._get("my-rank"));
    // this.makeRankItem(5000, "hello", 1000, this._get("my-best"));
    // this.makeRankItem(5000, "hello", 1000, this._get("all-rank"));

    this._hide(this.titleDiv);
    this._show(this.gameOverDiv);
    this.gameOverDiv.style.opacity = 0;
    this.transitionStartTime = Date.now();
    this._get("restart").disabled = true;
    this.transitionId = setInterval(() => {
      const elapsedTime = Date.now() - this.transitionStartTime;
      let progress = elapsedTime / 3000;
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
    containerDOM.classList.add("rank-list");
    containerDOM.style.width = "90%";
    containerDOM.style.padding = "0px 5%";
    containerDOM.style.height = "5rem";
    containerDOM.style.display = "flex";
    containerDOM.style.justifyContent = "space-between";
    containerDOM.style.alignItems = "center";

    const valueDOM = document.createElement("span");
    valueDOM.style.width = "20%";
    valueDOM.innerText = "# " + value.toLocaleString();
    containerDOM.appendChild(valueDOM);

    const nicknameDOM = document.createElement("span");
    nicknameDOM.style.width = "30%";
    nicknameDOM.innerText = nickname + "";
    containerDOM.appendChild(nicknameDOM);

    const scoreDOM = document.createElement("span");
    scoreDOM.style.width = "30%";
    scoreDOM.style.textAlign = "right";
    scoreDOM.innerText = score.toLocaleString();
    containerDOM.appendChild(scoreDOM);

    parent.appendChild(containerDOM);
  }

  static _removeAllRankItems(container) {
    while (container.hasChildNodes()) {
      container.removeChild(container.firstChild);
    }
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

function requestFullScreen(element) {
  // Supports most browsers and their versions.
  var requestMethod =
    element.requestFullScreen ||
    element.webkitRequestFullScreen ||
    element.mozRequestFullScreen ||
    element.msRequestFullScreen;

  if (requestMethod) {
    // Native full screen.
    requestMethod.call(element);
  } else if (typeof window.ActiveXObject !== "undefined") {
    // Older IE.
    var wscript = new ActiveXObject("WScript.Shell");
    if (wscript !== null) {
      wscript.SendKeys("{F11}");
    }
  }
}


function toggleFullScreen() {
  var doc = window.document;
  var docEl = doc.documentElement;

  var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

  if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl);
  }
  else {
    cancelFullScreen.call(doc);
  }
}