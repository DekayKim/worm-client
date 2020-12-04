import Worm from "./Worm";
import Share from "./share";
import Socket from "./Socket";

export default class WormManager {
  static init() {
    this.worms = {};
  }

  static create(data) {
    this.worms[data.id] = new Worm(data);
  }

  static update(dt) {
    const keys = Object.keys(this.worms);
    for (let i = 0; i < keys.length; i++) {
      this.worms[keys[i]].update(dt);
      if (keys[i] === Share.myId) {
        Socket.position(this.worms[keys[i]]);
      }
    }
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

  static _createBody(){
    
  }
}
