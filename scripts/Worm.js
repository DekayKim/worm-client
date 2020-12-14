import Share from "./share";
import WormManager from "./WormManager";
import Socket from "./Socket";
import SpatialHash from "./SpatialHash";
import { GlowFilter } from "@pixi/filter-glow";
import DOMEvents from "./DOMEvents";

const defaultOptions = {
  x: 0,
  y: 0,
  color: 0xffffff
};

const DEFAULT_SPEED = 200;
const BOOST_SPEED = 400;

export default class Worm {
  constructor(userOptions) {
    this.options = Object.assign({}, defaultOptions, userOptions);
    this.speed = DEFAULT_SPEED;
    this.angle = 110;
    this.radius = 20;
    this._prevRadius = 20;
    this.bodies = [];
    this.paths = [{ x: this.options.x, y: this.options.y }];
    this.pathAngles = [0];
    this.type = "worm";
    this.state = "alive";
    this.point = this.options.point;
    this.id = this.options.id;
    this.name = this.options.name;
    this.isAI = this.options.isAI;
    this.glow = new GlowFilter();
    this.boost = false;
    this.boostEffect = false;
    this.color = parseInt(this.options.color, 16);
    this.zoom = 1;
    this.targetZoom = 1;
    this._rotateCount = 0;
    this._control = false;
    this._hashes = [];
    this.container = new PIXI.Container();
    this.container.sortableChildren = true;
    this.container.visible = true;
    // this.container.getBounds = this._getBounds.bind(this);

    Share.viewport.addChild(this.container);
    Share.cull.add(this.container);

    if (this.isAI) {
      this._AITime = Date.now();
      this._AIAngle = 110;
    }

    this._rotation = Math.radians(180);
    this._followDistance = this.radius / 2;
    this._spriteIndex = 0;

    const head = this._createSprite(this.options.x, this.options.y, true);
    // head.alpha = 0.2;

    const nickname = new PIXI.Text(userOptions.name, {
      fontFamily: "Noto Sans KR",
      fontSize: 25,
      fill: "white"
    });
    nickname.anchor.set(0.5);
    Share.cull.add(nickname);
    Share.viewport.addChild(nickname);
    this.nickname = nickname;

    this._addBody(head);

    const bodyLength = Math.floor(this.point / 5);
    for (let i = 0; i < 10 + bodyLength; i++) {
      this._increase();
    }

    this.keyState = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false
    };

    if (this.id === Share.myId) {
      this._control = true;
      document.addEventListener(
        "keydown",
        event => {
          const keyName = event.key;

          if (keyName === "w") {
            // this.angle += 10;
          } else if (keyName === "s") {
            // this.angle -= 10;
          } else if (keyName === "q") {
            // this.speed = 0;
          } else if (event.keyCode === 32 && !this.boost) {
            this.boosterStart();
            // gameResources.sound_dash.sound.play();
          }

          // if (keyName === "ArrowUp") this.keyState.ArrowUp = true;
          // if (keyName === "ArrowDown") this.keyState.ArrowDown = true;
          // if (keyName === "ArrowLeft") this.keyState.ArrowLeft = true;
          // if (keyName === "ArrowRight") this.keyState.ArrowRight = true;
        },
        false
      );

      document.addEventListener("keyup", event => {
        if (event.keyCode === 32) {
          this.boosterEnd();
        }
      });
    }

    this._adjustSize();
  }

  _createSprite(x, y, isHead = false) {
    const sprite = WormManager.borrowBody();
    sprite.tint = this.color;
    sprite.position.set(x, y);
    sprite.width = this.radius * 2;
    sprite.height = this.radius * 2;
    sprite.prev = { x, y };
    sprite.zIndex = this._spriteIndex--;
    sprite._dataPosition = { x, y };
    sprite._class = this;

    if (this.boostEffect) {
      // sprite.filters = [this.glow];
    }

    if (isHead) {
      sprite._isHead = true;
      this.eye = {
        left: {
          white: this._createEyeWhite(sprite, "left")
          // black: this._createEyeBlack(sprite, "left")
        },
        right: {
          white: this._createEyeWhite(sprite, "right")
          // black: this._createEyeBlack(sprite, "right")
        }
      };
      this.eye.left.black = this._createEyeBlack(this.eye.left.white, "left");
      this.eye.right.black = this._createEyeBlack(
        this.eye.right.white,
        "right"
      );
    }

    return sprite;
  }

  _createEyeWhite(head, direction) {
    const sprite = new PIXI.Sprite(gameResources.oval.texture);
    sprite.anchor.set(0.5, 0.5);
    sprite.scale.set(0.3);
    if (direction === "left") sprite.position.set(-10, 20);
    else sprite.position.set(-10, -20);
    head.addChild(sprite);
    return sprite;
  }

  _createEyeBlack(head, direction) {
    const sprite = new PIXI.Sprite(gameResources.oval.texture);
    sprite.anchor.set(0.5, 0.5);
    sprite.scale.set(0.5);
    sprite.tint = 0;
    sprite.position.set(-20, 0);
    head.addChild(sprite);
    return sprite;
  }

  _increase() {
    const prevTail = this.getTail();
    const newTail = this._createSprite(prevTail.x, prevTail.y);

    this._addBody(newTail);
    Share.viewport.sortableChildren = true;
  }

  _decrease() {
    const tail = this.bodies.pop();
    // Share.viewport.removeChild(tail);
    // Share.cull.remove(tail);
    this.container.removeChild(tail);
    tail.filters = [];
    WormManager.returnBody(tail);
  }

  _addBody(sprite) {
    this.bodies.push(sprite);
    this.container.addChild(sprite);
    SpatialHash.wormAdd(this);

    // Share.viewport.addChild(sprite);
    // Share.cull.add(sprite);
  }

  getHead() {
    return this.bodies[0];
  }

  getTail() {
    return this.bodies[this.bodies.length - 1];
  }

  _positionUpdate(dt, isVisible = true) {
    SpatialHash.wormDelete(this);
    const head = this.getHead();
    const radian = Math.radians(this.angle - 90);
    let distance = (this.speed / 60) * dt;

    head.x += Math.cos(radian) * distance;
    head.y += Math.sin(radian) * distance;
    SpatialHash.wormAdd(this);

    const distanceWithPrev = Math.sqrt(
      (head.x - head.prev.x) ** 2 + (head.y - head.prev.y) ** 2
    );

    let progress = distanceWithPrev / this._followDistance;

    if (progress > 1) progress = 1;

    const bound = {
      left: head.x,
      right: head.x,
      top: head.y,
      bottom: head.y
    };

    for (let i = 1; i < this.bodies.length; i++) {
      const body = this.bodies[i];
      const goal = this.paths[i - 1];
      const prevGoal = this.paths[i];
      if (prevGoal === undefined) continue;

      // const goalDistance = {
      //   x: (goal.x - prevGoal.x) * progress,
      //   y: (goal.y - prevGoal.y) * progress
      // };

      if (this.paths[i - 1].distance === undefined) {
        const goalDistance = {
          x: goal.x - prevGoal.x,
          y: goal.y - prevGoal.y
        };

        this.paths[i - 1].distance = goalDistance;
      }

      body.x = prevGoal.x + this.paths[i - 1].distance.x * progress;
      body.y = prevGoal.y + this.paths[i - 1].distance.y * progress;
      this._boundUpdate(bound, body.position);
    }

    this.paths.splice(this.bodies.length + 1);
    this.bound = bound;

    if (distanceWithPrev > this._followDistance) {
      const angle = Math.atan2(head.y - head.prev.y, head.x - head.prev.x);
      const path = {
        x: head.prev.x + Math.cos(angle) * this._followDistance,
        y: head.prev.y + Math.sin(angle) * this._followDistance
      };

      head.prev.x = head.x;
      head.prev.y = head.y;
      this.pathAngles.unshift(Math.getAngleWithTwoPoint(path, this.paths[0]));
      this.paths.unshift(path);
    }

    this.nickname.position.set(
      head.x,
      head.y - this.radius - this.nickname.height / 2
    );
  }

  _getCalculatedBound() {
    return {
      x: this.bound.left - this.radius,
      y: this.bound.top - this.radius,
      width: this.bound.right - this.bound.left + this.radius * 2,
      height: this.bound.bottom - this.bound.top + this.radius * 2
    };
  }

  _getBounds() {
    if (this.bound) {
      return {
        x: this.bound.left,
        y: this.bound.top,
        width: this.bound.right - this.bound.left,
        height: this.bound.bottom - this.bound.top,
        left: this.bound.left,
        top: this.bound.top,
        right: this.bound.right,
        bottom: this.bound.bottom
      };
    } else {
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    }
  }

  _boundUpdate(bound, position) {
    if (position.x < bound.left) bound.left = position.x;
    if (position.x > bound.right) bound.right = position.x;
    if (position.y < bound.top) bound.top = position.y;
    if (position.y > bound.bottom) bound.bottom = position.y;
  }

  _visibleUpdate(dt) {
    WormManager._addVisibleWorms(this.id);
    this._positionUpdate(dt);

    const head = this.getHead();
    const radian = Math.radians(this.angle - 90);
    head.rotation = radian + this._rotation;
    // this.nickname =

    for (let i = 1; i < this.bodies.length; i++) {
      if (!this.pathAngles[i]) break;
      this.bodies[i].rotation = this.pathAngles[i];
      // this._adjustDistanceWithFront(i);
    }
  }

  _collisionUpdate(dt) {
    const head = this.getHead();
    const start = {
      x: head.x - Share.windowSize.width / 10,
      y: head.y - Share.windowSize.height / 10
    };

    const end = {
      x: head.x + Share.windowSize.width / 10,
      y: head.y + Share.windowSize.height / 10
    };

    const collisionFoods = [];

    let count = 0;
    for (let x = start.x; x < end.x; x += Share.cellSize) {
      for (let y = start.y; y < end.y; y += Share.cellSize) {
        count += 1;
        const list = SpatialHash.getList(x, y);
        for (let key in list) {
          collisionFoods.push(list[key]);
        }
        // const list = Object.values(SpatialHash.getList(x, y));
        // for (let i = 0; i < list.length; i++) collisionFoods.push(list[i]);
      }
    }

    for (let i = 0; i < collisionFoods.length; i++) {
      const collision = Math.OBB(
        head.position,
        this.radius * 2,
        collisionFoods[i].sprite.position,
        collisionFoods[i].radius
      );
      if (collision) collisionFoods[i].eaten(this);
    }
  }

  update(dt) {
    const now = Date.now();
    // const _finalAngle = 180 * Math.atan2(_mouseAngle.x - )
    if (this.boostEffect) {
      if (this.glow.outerStrength < 3) {
        this.glow.outerStrength += 0.1;
        this.effectFlag = true;
      } else if (this.effectFlag) {
        if (this.glow.outerStrength < 7) {
          this.glow.outerStrength += 0.1;
        } else {
          this.effectFlag = false;
        }
      } else {
        if (this.glow.outerStrength > 3) {
          this.glow.outerStrength -= 0.1;
        } else {
          this.effectFlag = true;
        }
      }
    }

    // if (this._control) {
    //   this.AIUpdate();
    // }

    // if (this.id !== Share.myId) return;
    if (this.id === Share.myId) {
      // Share.stage.setTilePosition(this.bodies[0].x, this.bodies[0].y);

      this.zoom = Math.lerp(this.zoom, this.targetZoom, dt / 100);
      // Share.viewport.setZoom(this.zoom);
      // Share.stage.setTileScale(this.targetZoom);

      if (this.boost && now - this.lastDecreaseTime > 300) {
        this.lastDecreaseTime = now;
        const tail = this.getTail();
        Socket.boost_ing({
          x: tail.x,
          y: tail.y
        });
      }

      if (Share.rotateCount < 5) {
        if (Share.rotateDirection === "right") {
          this.angle += dt * 5;
        } else this.angle -= dt * 5;
      }
    }

    if (this.container.visible) this._visibleUpdate(dt);
    else {
      this._positionUpdate(dt, false);
      // if (this._control) this._collisionUpdate(dt);
    }
    if (this._control) {
      this._collisionUpdate(dt);
    }
    return;

    this.nickname.position.set(
      head.x,
      head.y - this.radius - this.nickname.height / 2
    );
  }

  _adjustDistanceWithFront(index, isDataUpdate) {
    const front = this.bodies[index - 1];
    const back = this.bodies[index];
    if (front && back) {
      let backPosition = back;
      if (isDataUpdate) {
        backPosition = back._dataPosition;
      }
      const distance = Math.getDistance(front, backPosition);
      const angle = Math.getAngleWithTwoPoint(front, backPosition);
      const diff = this._followDistance + 1 - distance;
      const diffPoint = Math.getPointWithAngleDistance(angle, diff);
      backPosition.x += diffPoint.x;
      backPosition.y += diffPoint.y;
    }
  }

  _hitCheck(worm) {
    const head = this.getHead();
    for (let i = 0; i < worm.bodies.length; i++) {
      const dx = head.x - worm.bodies[i].x;
      const dy = head.y - worm.bodies[i].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const looserBodies = this.bodies.map(body => ({
        x: body.x,
        y: body.y
      }));

      if (distance < this.radius + worm.bodies[i]._class.radius) {
        if (this.state === "alive") {
          Socket.conflict(this.id, looserBodies);
          this.state = "die";
        }
      }
    }
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  boosterStart() {
    if (this.point <= 0) return;
    if (this.id === Share.myId) gameResources.sound_dash.sound.play();
    this.boost = true;
    const now = Date.now();
    this.boosterStartTime = now;
    this.lastDecreaseTime = now;
    this.speed = BOOST_SPEED;
    this.boosterEffectOn();
    if (this.id === Share.myId) Socket.boost_start();
  }

  boosterEffectOn() {
    this.boostEffect = true;
    if (this.glow) {
      this.glow.outerStrength = 0;
      this.container.filters = [this.glow];
      for (let i = 0; i < this.bodies.length; i++) {
        // this.bodies[i].filters = [this.glow];
      }
    }
  }

  boosterEffectOff() {
    this.boostEffect = false;
    this.container.filters = [];

    // for (let i = 0; i < this.bodies.length; i++) {
    //   this.bodies[i].filters = [];
    // }
  }

  boosterEnd() {
    this.boost = false;
    const useBoosterTime = Date.now() - this.boosterStartTime;
    this.speed = DEFAULT_SPEED;
    this.boosterEffectOff();
    if (this.id === Share.myId) Socket.boost_end();
  }

  addPoint(point) {
    return;
    const prevCount = Math.floor(this.point / 5);
    this.point += point;
    if (this.point <= 0 && this.boost) {
      this.boosterEnd();
    }
    const addBodyCount = Math.floor(this.point / 5) - prevCount;
    if (addBodyCount > 0) {
      for (let i = 0; i < addBodyCount; i++) {
        this._increase();
      }
    } else if (addBodyCount < 0) {
      for (let i = 0; i < Math.abs(addBodyCount); i++) {
        this._decrease();
      }
    }
    this._adjustSize();
  }

  setPoint(point) {
    if (this.point === point) return;
    if (point <= 0 && this.boost) {
      this.boosterEnd();
    }
    const prevCount = Math.floor(this.point / 5);
    this.point = point;
    const addBodyCount = Math.floor(this.point / 5) - prevCount;
    if (addBodyCount > 0) {
      for (let i = 0; i < addBodyCount; i++) {
        this._increase();
      }
    } else if (addBodyCount < 0) {
      for (let i = 0; i < Math.abs(addBodyCount); i++) {
        this._decrease();
      }
    }
    this._adjustSize();

    if (this.id === Share.myId) {
      this.rankerContainers = document.getElementsByClassName(
        "ranker-container"
      )[10];

      this.rankerContainers.children[2].textContent = point.toLocaleString();
    }
  }

  // ! legacy remove !
  // remove() {
  //   for (let i = 0; i < this.bodies.length; i++) {
  //     Share.cull.remove(this.bodies[i]);
  //     Share.viewport.removeChild(this.bodies[i]);
  //     for (let i = 0; i < this.bodies[i].children.length; i++) {
  //       this.bodies[i].children[i].destroy({ children: true });
  //     }
  //     this.bodies[i].filters = [];
  //     WormManager.returnBody(this.bodies[i]);
  //     // this.bodies[i].destroy({ children: true });
  //     // this.bodies[i] = null;
  //   }
  //   this.bodies = [];
  //   this.glow = null;
  //   Share.cull.remove(this.nickname);
  //   Share.viewport.removeChild(this.nickname);
  //   this.nickname.destroy();
  //   this.nickname = null;

  //   WormManager.remove(this);
  // }

  remove() {
    Share.cull.remove(this.container);
    Share.viewport.removeChild(this.container);
    for (let i = 0; i < this.bodies.length; i++) {
      if (i === 0) this.bodies[i].removeChildren();
      WormManager.returnBody(this.bodies[i]);
    }
    this.bodies = [];
    this.glow = null;
    Share.cull.remove(this.nickname);
    Share.viewport.removeChild(this.nickname);
    this.nickname.destroy();
    this.nickname = null;

    WormManager.remove(this);
  }

  die() {
    if (this.id === Share.myId) {
      const rank = WormManager._getMyRank();
      Share.set("dieInfo", {
        rank,
        name: this.name,
        point: this.point
      });
    }

    this.remove();

    if (this.id === Share.myId) {
      Share.stage.stopDrawMinimap();
      DOMEvents.hideInGame();
      DOMEvents.showGameOver();
    }
  }

  _adjustSize() {
    // point 10 = radius 20
    this.radius = 20 + this.point * 0.02;
    this._followDistance = this.radius / 1.5;
    for (let i = 0; i < this.bodies.length; i++) {
      this.bodies[i].width = this.bodies[i].height = this.radius * 2;
    }

    this.targetZoom = 1 - this.point / 5000;
  }

  setPaths(paths) {
    this.paths = paths;
  }

  setAngle(angle) {
    this.angle = angle;
  }
}
