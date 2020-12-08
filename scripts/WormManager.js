import Worm from "./Worm";
import Share from "./share";
import Socket from "./Socket";
import DOMEvents from "./DOMEvents";

export default class WormManager {
  static init() {
    this.worms = {};
    this.bodies = [];
    this.lastUpdate = Date.now();
    this.rank = null;
  }

  static create(data) {
    this.worms[data.id] = new Worm(data);
  }

  static update(dt) {
    const rank = [];
    const keys = Object.keys(this.worms);
    for (let i = 0; i < keys.length; i++) {
      this.worms[keys[i]].update(dt);
      if (keys[i] === Share.myId) {
        // const now = Date.now();
        // if (now - this.lastUpdate > (1 / 30) * 1000) {
        //   this.lastUpdate = now;
        Socket.position(this.worms[keys[i]]);
        // }
      }
      this._rank(rank, this.worms[keys[i]]);
    }
    for (let i = 0; i < rank.length; i++) {
      DOMEvents._setRankerContainer(
        i + 1,
        rank[i].name,
        rank[i].point,
        "#" + rank[i].color.toString(16)
      );
    }
    // if (this.rank) {
    //   for (let i = 0; i < 10; i++) {
    //     if (this.rank[i] !== rank[i]) {
    //       this.rank[i] = rank[i];
    //       DOMEvents._setRankerContainer(
    //         i + 1,
    //         this.rank[i].name,
    //         this.rank[i].point,
    //         "#" + this.rank[i].color.toString(16)
    //       );
    //     }
    //   }
    // } else {
    //   if (rank.length === 0) return;
    //   this.rank = rank;
    //   for (let i = 0; i < 10; i++) {
    //     DOMEvents._setRankerContainer(
    //       i + 1,
    //       this.rank[i].name,
    //       this.rank[i].point,
    //       "#" + this.rank[i].color.toString(16)
    //     );
    //   }
    // }
  }

  static remove(worm) {
    delete this.worms[worm.id];
  }

  static get(id) {
    return this.worms[id];
  }

  static getAll() {
    return Object.values(this.worms);
  }

  static setBodiesPosition(id, bodies, paths) {
    this.worms[id].setPaths(paths);
    for (let i = 0; i < bodies.length; i++) {
      this.worms[id].setBodyPosition(i, bodies[i]);
      // this.worms[id].bodies[i].position.set(bodies[i].x, bodies[i].y);
    }
  }

  static reset() {
    const worms = this.getAll();
    for (let i = 0; i < worms.length; i++) {
      worms[i].remove();
    }
    this.worms = {};
  }

  static _createBody() {
    const sprite = new PIXI.Sprite(gameResources.oval2.texture);
    sprite.anchor.set(0.5, 0.5);
    // sprite.tint = this.color;
    // sprite.position.set(x, y);
    // sprite.width = this.radius * 2;
    // sprite.height = this.radius * 2;
    this.bodies.push(sprite);
    // sprite.prev = { x, y };
    // sprite.zIndex = this._spriteIndex--;
    // sprite._dataPosition = { x, y };
    // sprite._class = this;
  }

  static borrowBody() {
    if (this.bodies.length === 0) this._createBody();
    const sprite = this.bodies.pop();
    return sprite;
  }

  static returnBody(sprite) {
    this.bodies.push(sprite);
  }

  static _rank(rank, worm) {
    if (rank.length < 10) {
      rank.push(worm);
    } else if (rank[9].point < worm.point) {
      rank[9] = worm;
    }
    rank.sort((a, b) => b.point - a.point);
  }
}
