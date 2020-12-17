import Worm from "./Worm";
import Share from "./share";
import Socket from "./Socket";
import DOMEvents from "./DOMEvents";

export default class WormManager {
  static init() {
    this.worms = {};
    this.bodies = [];
    this._visibleWorms = [];
    this.lastUpdate = Date.now();
    this.rank = [];
  }

  static create(data) {
    this.worms[data.id] = new Worm(data);
  }

  static _addVisibleWorms(wormId) {
    this._visibleWorms.push(wormId);
  }

  static update(dt) {
    // this.rank = [];
    const tempRank = [];
    const keys = Object.keys(this.worms);
    this._visibleWorms = [];
    for (let i = 0; i < keys.length; i++) {
      tempRank.push(this.worms[keys[i]]);
      this.worms[keys[i]].update(dt);
      // this._rank(rank, this.worms[keys[i]]);
      if (keys[i] === Share.myId) {
        // Socket.position(this.worms[keys[i]]);
        Socket.angle(this.worms[keys[i]]);
      }
    }

    tempRank.sort((a, b) => b.point - a.point);
    this.rank = tempRank;
    this.collisionUpdateAll();

    for (let i = 0; i < 10; i++) {
      if (this.rank[i]) {
        DOMEvents._setRankerContainer(
          i + 1,
          this.rank[i].name,
          this.rank[i].point,
          "#" + this.rank[i].color.toString(16)
        );
      } else {
        DOMEvents._setRankerContainer(i + 1, "", 0);
      }
    }
  }

  static collisionUpdateAll() {
    const visit = {};

    const wormsArr = Object.values(this.worms);
    wormsArr.map(worm => (visit[worm.id] = {}));

    Share.graphics1.clear();
    Share.graphics1.beginFill(0xaa4f08, 0.5);
    for (let i = 0; i < wormsArr.length; i++) {
      const my = wormsArr[i];

      if (!my._control) continue;
      for (let j = 0; j < wormsArr.length; j++) {
        if (i === j) continue;

        const other = wormsArr[j];
        if (visit[my.id][other.id] !== undefined) continue;
        if (!my.bound || !other.bound) continue;

        const hit = Math.AABB(
          my._getCalculatedBound(),
          other._getCalculatedBound()
        );

        if (hit) {
          const result = this.dieCheck(my, other);
          if (result === "my") break;
        }

        visit[my.id][other.id] = true;
        visit[other.id][my.id] = true;
      }
    }
  }

  static collisionUpdateAll2() {
    const visit = {};

    const wormsArr = this._visibleWorms;
    wormsArr.map(id => (visit[id] = {}));
    for (let i = 0; i < wormsArr.length; i++) {
      const my = this.worms[wormsArr[i]];
      // if (!my._control) continue;
      for (let j = 0; j < wormsArr.length; j++) {
        if (i === j) continue;
        const other = this.worms[wormsArr[j]];
        if (visit[my.id][other.id] !== undefined) continue;
        visit[my.id][other.id] = true;
        visit[other.id][my.id] = true;

        const circleHit = Math.OBB(
          my.bodies[0].position,
          my._followDistance * my.bodies.length,
          other.bodies[0].position,
          other._followDistance * other.bodies.length
        );
        if (circleHit) {
          const hit = Math.AABB(
            my.container.getBounds(),
            other.container.getBounds()
          );

          if (hit) {
            const result = this.dieCheck(my, other);
            if (result === "my") break;
          }
        }
      }
    }
  }

  static collisionUpdate() {
    if (this._visibleWorms.length < 2) return;
    const rectCollision = [];
    const my = this.worms[Share.myId];
    if (!my) return;
    for (let i = 0; i < this._visibleWorms.length; i++) {
      if (this._visibleWorms[i] === Share.myId) continue;
      const other = this.worms[this._visibleWorms[i]];

      const hit = Math.AABB(
        my.container.getBounds(),
        other.container.getBounds()
      );

      if (hit) {
        const head = my.getHead();
        const otherHead = other.getHead();
        for (let i = 1; i < other.bodies.length; i++) {
          const myHeadHit = Math.OBB(
            head.position,
            my.radius,
            other.bodies[i].position,
            other.radius
          );
          if (myHeadHit) {
            if (my.state === "alive") {
              const looserBodies = my.bodies.map(body => ({
                x: body.x,
                y: body.y
              }));
              Socket.conflict(my.id, looserBodies);
              my.state = "die";
            }
            return;
          }
        }
        for (let i = 1; i < my.bodies.length; i++) {
          const myHeadHit = Math.OBB(
            otherHead.position,
            other.radius,
            my.bodies[i].position,
            my.radius
          );
          if (myHeadHit) {
            if (other.state === "alive") {
              const looserBodies = other.bodies.map(body => ({
                x: body.x,
                y: body.y
              }));
              Socket.conflict(other.id, looserBodies);
              other.state = "die";
            }
            return;
          }
        }
      }
    }
  }

  static dieCheck(my, other) {
    const checkObjects = [];
    checkObjects.push([my, other]);
    checkObjects.push([other, my]);

    for (let i = 0; i < checkObjects.length; i++) {
      const [_my, _other] = checkObjects[i];
      const head = _my.getHead();
      for (let j = 1; j < _other.bodies.length; j++) {
        const myHeadHit = Math.OBB(
          head.position,
          _my.radius,
          _other.bodies[j].position,
          _other.radius
        );
        if (myHeadHit) {
          if (_my.state === "alive" && _other.state === "alive") {
            const looserBodies = _my.bodies.map(body => ({
              x: body.x,
              y: body.y
            }));
            Socket.conflict(_my.id, looserBodies);
            _my.state = "die";
            return _my === my ? "my" : "other";
          }
        }
      }
    }
    return false;
  }

  static dieCheck2(my, other) {
    const checkObjects = [];
    checkObjects.push([my, other]);
    checkObjects.push([other, my]);

    for (let i = 0; i < checkObjects.length; i++) {
      const [_my, _other] = checkObjects[i];
      const head = _my.getHead();
      for (let j = 1; j < _other.bodies.length; j++) {
        const myHeadHit = Math.OBB(
          head.position,
          _my.radius,
          _other.bodies[j].position,
          _other.radius
        );
        if (myHeadHit) {
          if (_my.state === "alive") {
            const looserBodies = _my.bodies.map(body => ({
              x: body.x,
              y: body.y
            }));
            Socket.conflict(_my.id, looserBodies);
            _my.state = "die";
          }
        }
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
    rank.push(worm);
    rank.sort((a, b) => b.point - a.point);
  }

  static _getMyRank() {
    const rank = this.rank.findIndex(worm => worm.id === Share.myId);
    return rank + 1 || 100;
  }
}
