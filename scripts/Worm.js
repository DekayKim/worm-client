import Share from "./share";
import WormManager from "./WormManager";
import Socket from "./Socket";

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
    this.paths = [];
    this.type = "worm";
    this.state = "alive";
    this.point = this.options.point;
    this.id = this.options.id;
    this.name = this.options.name;
    this.isAI = this.options.isAI;
    if (this.isAI) {
      this._AITime = Date.now();
      this._AIAngle = 110;
    }

    this._rotation = Math.radians(180);
    this._followDistance = this.radius / 2;
    this._spriteIndex = 0;

    const head = this._createSprite(this.options.x, this.options.y, true);

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

    document.addEventListener(
      "keydown",
      event => {
        const keyName = event.key;

        if (this.id !== Share.myId) return;

        if (keyName === "w") {
          this.angle += 10;
        } else if (keyName === "s") {
          this.angle -= 10;
        } else if (keyName === "q") {
          this.speed = 0;
        } else if (event.keyCode === 32) {
          this.boosterStart();
        }

        // if (keyName === "ArrowUp") this.keyState.ArrowUp = true;
        // if (keyName === "ArrowDown") this.keyState.ArrowDown = true;
        // if (keyName === "ArrowLeft") this.keyState.ArrowLeft = true;
        // if (keyName === "ArrowRight") this.keyState.ArrowRight = true;
      },
      false
    );

    // document.addEventListener(
    //   "keyup",
    //   event => {
    //     const keyName = event.key;

    //     if (keyName === "ArrowUp") this.keyState.ArrowUp = false;
    //     if (keyName === "ArrowDown") this.keyState.ArrowDown = false;
    //     if (keyName === "ArrowLeft") this.keyState.ArrowLeft = false;
    //     if (keyName === "ArrowRight") this.keyState.ArrowRight = false;
    //   },
    //   false
    // );

    document.addEventListener("keyup", event => {
      if (event.keyCode === 32) {
        this.boosterEnd();
      }
    });
  }

  // _keyUpdate() {
  //   const { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } = this.keyState;
  //   if (ArrowUp && ArrowRight) {
  //     this._adjustAngle(45);
  //   } else if (ArrowRight && ArrowDown) {
  //     this._adjustAngle(135);
  //   }
  // }

  _adjustAngle(targetAngle) {}

  _createSprite(x, y, isHead = false) {
    const sprite = new PIXI.Sprite(gameResources.oval2.texture);
    sprite.tint = this.options.color;
    sprite.position.set(x, y);
    sprite.anchor.set(0.5, 0.5);
    sprite.width = this.radius * 2;
    sprite.height = this.radius * 2;
    sprite.prev = { x, y };
    sprite.tint = 0x92c731;
    sprite.zIndex = this._spriteIndex--;
    sprite._dataPosition = { x, y };
    sprite._class = this;

    if (isHead) {
      sprite._isHead = true;
    }

    return sprite;
  }

  _increase() {
    const prevTail = this.getTail();
    const newTail = this._createSprite(prevTail.x, prevTail.y);

    this._addBody(newTail);
    Share.viewport.sortableChildren = true;
  }

  _addBody(sprite) {
    this.bodies.push(sprite);
    Share.viewport.addChild(sprite);
    Share.cull.add(sprite);
  }

  _setting() {}

  getHead() {
    return this.bodies[0];
  }

  getTail() {
    return this.bodies[this.bodies.length - 1];
  }

  getInformation() {
    const head = this.getHead();
    return {
      id: this.id,
      x: head.x,
      y: head.y,
      radius: this.radius
    };
  }

  setPosition(x, y) {
    this._dataUpdate(x, y);
    // Share.cull.updateObject(head);
    // this._bodiesUpdate(distance);
  }

  _spriteUpdate(sprite, position) {
    sprite.position.set(position.x, position.y);
    Share.cull.updateObject(sprite);
  }

  /* 
    Socket - Position 을 통해 받은 다른 지렁이의 위치 조정
    특이사항 - 데이터만 수정
  */
  _dataUpdate(x, y) {
    const head = this.getHead();
    const distance = Math.getDistance(head._dataPosition, { x, y });
    head._dataPosition = { x, y };
    this._spriteUpdate(head, head._dataPosition);

    // const distanceWithPrev = Math.sqrt(
    //   (head.x - head.prev.x) ** 2 + (head.y - head.prev.y) ** 2
    // );

    const distanceWithPrev = Math.getDistance(head._dataPosition, head.prev);
    if (distanceWithPrev > this._followDistance) {
      const angle = Math.getAngleWithTwoPoint(head.prev, head._dataPosition);
      const path = {
        x: head.prev.x + Math.cos(angle) * this._followDistance,
        y: head.prev.y + Math.sin(angle) * this._followDistance
      };

      head.prev.x = head._dataPosition.x;
      head.prev.y = head._dataPosition.y;
      this.paths.unshift(path);
    }

    const bound = {
      left: head._dataPosition.x,
      right: head._dataPosition.x,
      top: head._dataPosition.y,
      bottom: head._dataPosition.y
    };

    for (let i = 1; i < this.bodies.length; i++) {
      if (!this.paths[i - 1]) {
        break;
      }

      // 최초에 데이터가 없을 때
      if (this.bodies[i]._dataPosition === undefined) {
        this.bodies[i]._dataPosition = {
          x: this.bodies[i].x,
          y: this.bodies[i].y
        };
      }

      const radian = Math.getAngleWithTwoPoint(
        this.bodies[i]._dataPosition,
        this.paths[i - 1]
      );

      this.bodies[i]._dataPosition = {
        x: this.bodies[i]._dataPosition.x + Math.cos(radian) * distance,
        y: this.bodies[i]._dataPosition.y + Math.sin(radian) * distance
      };
      this._spriteUpdate(this.bodies[i], this.bodies[i]._dataPosition);

      // console.log(this.bodies[i]._dataPosition);

      this._boundUpdate(bound, this.bodies[i]._dataPosition);
    }
    this.bound = bound;

    // Share.graphics.clear();
    // Share.graphics.beginFill(this._boundColor);
    // Share.graphics.alpha = 0.5;
    // Share.graphics.drawRect(
    //   bound.left - this.radius,
    //   bound.top - this.radius,
    //   Math.abs(bound.right - bound.left) + this.radius * 2,
    //   Math.abs(bound.bottom - bound.top) + this.radius * 2
    // );
    // Share.graphics.endFill();
    // console.log(this.bound);
  }

  _boundUpdate(bound, position) {
    if (position.x < bound.left) bound.left = position.x;
    if (position.x > bound.right) bound.right = position.x;
    if (position.y < bound.top) bound.top = position.y;
    if (position.y > bound.bottom) bound.bottom = position.y;
  }

  AIUpdate(dt) {
    const head = this.getHead();
    const second = this.bodies[1];
    const angle = Math.getAngleWithTwoPoint(second.position, head.position);
    const linePoint = {
      x: Math.cos(angle) * (this.radius + 50),
      y: Math.sin(angle) * (this.radius + 50)
    };

    // Share.graphics1.clear();
    // Share.graphics1.lineStyle(1, 0xffd900, 1);
    // Share.graphics1.moveTo(head.x, head.y);
    // Share.graphics1.lineTo(head.x + linePoint.x, head.y + linePoint.y);

    const worms = WormManager.getAll();
    for (let i = 0; i < worms.length; i++) {
      const worm = worms[i];
      if (worm.id === this.id) continue;

      if (worm.bound) {
        const hit = Math.lineRect(
          head.x,
          head.y,
          head.x + linePoint.x,
          head.y + linePoint.y,
          worm.bound.left - worm.radius,
          worm.bound.top - worm.radius,
          Math.abs(worm.bound.right - worm.bound.left) + worm.radius * 2,
          Math.abs(worm.bound.bottom - worm.bound.top) + worm.radius * 2
        );

        if (hit) {
          // console.log(worm.id, "hit--");
          this._hitCheck(worm);
          // worm._boundColor = 0x00ff00;
        } else {
          // worm._boundColor = 0xff0000;
        }
      }
    }
  }

  update(dt) {
    // const _finalAngle = 180 * Math.atan2(_mouseAngle.x - )

    if (Share.ai && Share.ai.includes(this.id)) {
      this.AIUpdate();
    }
    if (this.id !== Share.myId) return;

    if (Share.rotateDirection === "right") this.angle += dt * 5;
    else this.angle -= dt * 5;

    const head = this.getHead();
    const radian = Math.radians(this.angle - 90);
    const distance = (this.speed / 60) * dt;

    const prevHeadPosition = {
      x: head.x,
      y: head.y
    };
    /* Head Move */
    // if (this.id === Share.myId) {
    head.x += Math.cos(radian) * distance;
    head.y += Math.sin(radian) * distance;
    head.rotation = radian + this._rotation;
    Share.cull.updateObject(head);

    const lineAngle = Math.getAngleWithTwoPoint(
      prevHeadPosition,
      head.position
    );
    const linePoint = {
      x: Math.cos(lineAngle) * (this.radius + 50),
      y: Math.sin(lineAngle) * (this.radius + 50)
    };

    Share.graphics1.clear();
    Share.graphics1.lineStyle(1, 0xffd900, 1);
    Share.graphics1.moveTo(head.x, head.y);
    Share.graphics1.lineTo(head.x + linePoint.x, head.y + linePoint.y);
    // }

    const worms = WormManager.getAll();
    for (let i = 0; i < worms.length; i++) {
      const worm = worms[i];
      if (worm.id === Share.myId) continue;

      if (worm.bound) {
        const hit = Math.lineRect(
          head.x,
          head.y,
          head.x + linePoint.x,
          head.y + linePoint.y,
          worm.bound.left - worm.radius,
          worm.bound.top - worm.radius,
          Math.abs(worm.bound.right - worm.bound.left) + worm.radius * 2,
          Math.abs(worm.bound.bottom - worm.bound.top) + worm.radius * 2
        );

        if (hit) {
          console.log(worm.id, "hit");
          this._hitCheck(worm);
          // worm._boundColor = 0x00ff00;
        } else {
          // worm._boundColor = 0xff0000;
        }
      }
    }

    this.nickname.position.set(
      head.x,
      head.y - this.radius - this.nickname.height / 2
    );

    /* Bodies Move */
    const distanceWithPrev = Math.sqrt(
      (head.x - head.prev.x) ** 2 + (head.y - head.prev.y) ** 2
    );
    if (distanceWithPrev > this._followDistance) {
      const angle = Math.atan2(head.y - head.prev.y, head.x - head.prev.x);
      const path = {
        x: head.prev.x + Math.cos(angle) * this._followDistance,
        y: head.prev.y + Math.sin(angle) * this._followDistance
      };

      head.prev.x = head.x;
      head.prev.y = head.y;
      this.paths.unshift(path);
    }

    const bound = {
      left: head.x,
      right: head.x,
      top: head.y,
      bottom: head.y
    };

    for (let i = 0; i < this.paths.length; i++) {
      const body = this.bodies[i + 1];
      if (body === undefined) {
        // this.paths.splice(i);
        break;
      }

      const radian = Math.getAngleWithTwoPoint(body.position, this.paths[i]);

      // const rotation = (radian + this._rotation - body.rotation) / 60;
      body.x += Math.cos(radian) * distance;
      body.y += Math.sin(radian) * distance;

      // console.log(this.bodies[i]._dataPosition);

      this._boundUpdate(bound, body.position);
      this.bound = bound;

      // body.rotation = radian + this._rotation;
      Share.cull.updateObject(body);
    }

    this.radius = 20 + this.point * 0.05;
    if (this._prevRadius !== this.radius) {
      this._prevRadius = this.radius;
      this._adjustSize();
    }

    Share.cull.updateObject(this.nickname);
  }

  _hitCheck(worm) {
    const head = this.getHead();
    for (let i = 0; i < worm.bodies.length; i++) {
      const dx = head.x - worm.bodies[i].x;
      const dy = head.y - worm.bodies[i].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.radius + worm.bodies[i]._class.radius) {
        if (this.state === "alive") {
          Socket.conflict(this.id, this.bodies);
          console.log("die");
          this.state = "die";
        }
      }
    }
  }

  _headUpdate(dt) {
    const head = this.getHead();
    const radian = Math.radians(this.angle - 90);
    const distance = (this.speed / 60) * dt;

    /* Head Move */
    head.x += Math.cos(radian) * distance;
    head.y += Math.sin(radian) * distance;
    head.rotation = radian + this._rotation;
    Share.cull.updateObject(head);
  }

  _bodiesUpdate(distance) {
    const head = this.getHead();

    /* Bodies Move */
    const distanceWithPrev = Math.sqrt(
      (head.x - head.prev.x) ** 2 + (head.y - head.prev.y) ** 2
    );
    if (distanceWithPrev > this._followDistance) {
      const angle = Math.atan2(head.y - head.prev.y, head.x - head.prev.x);
      const path = {
        x: head.prev.x + Math.cos(angle) * this._followDistance,
        y: head.prev.y + Math.sin(angle) * this._followDistance
      };

      head.prev.x = head.x;
      head.prev.y = head.y;
      this.paths.unshift(path);
    }

    for (let i = 0; i < this.paths.length; i++) {
      const body = this.bodies[i + 1];
      const prev = this.bodies[i];
      if (body === undefined) {
        // this.paths.splice(i);
        break;
      }

      const distanceToPath = Math.sqrt(
        (this.paths[i].x - body.x) ** 2 + (this.paths[i].y - body.y) ** 2
      );
      const radian = Math.getAngleWithTwoPoint(body.position, this.paths[i]);
      const moveAmount = Math.min(distanceToPath, distance);
      // const rotation = (radian + this._rotation - body.rotation) / 60;
      body.x += Math.cos(radian) * moveAmount;
      body.y += Math.sin(radian) * moveAmount;

      // const test = Math.sqrt((body.x - prev.x) ** 2 + (body.y - prev.y) ** 2);
      // if (test >= this._followDistance * 1.2) {
      //   body.x = this.paths[i].x;
      //   body.y = this.paths[i].y;
      // }

      // body.rotation = radian + this._rotation;
      Share.cull.updateObject(body);
    }
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  boosterStart() {
    this.boosterStartTime = Date.now();
    this.speed = BOOST_SPEED;
  }

  boosterEnd() {
    const useBoosterTime = Date.now() - this.boosterStartTime;
    this.speed = DEFAULT_SPEED;
  }

  eat(amount) {
    const prevCount = Math.floor(this.point / 5);
    this.point += amount;
    const addBodyCount = Math.floor(this.point / 5) - prevCount;
    for (let i = 0; i < addBodyCount; i++) {
      this._increase();
    }
    this._adjustSize();
  }

  die() {
    for (let i = 0; i < this.bodies.length; i++) {
      Share.cull.remove(this.bodies[i]);
      Share.viewport.removeChild(this.bodies[i]);
      this.bodies[i] = null;
    }
    Share.cull.remove(this.nickname);
    Share.viewport.removeChild(this.nickname);
    this.nickname = null;

    WormManager.remove(this);
  }

  _adjustSize() {
    // point 10 = radius 20
    // this.radius = 20 + this.point * 0.05;
    this._followDistance = this.radius / 2;
    for (let i = 0; i < this.bodies.length; i++) {
      this.bodies[i].width = this.bodies[i].height = this.radius * 2;
    }
  }

  _adjustPosition() {
    for (let i = 1; i < this.bodies.length; i++) {
      const prev = this.bodies[i - 1];
      const current = this.bodies[i];
      // if()
    }
  }

  _updateMatterRadius(sprite) {}

  _matterPosition() {
    const head = this.getHead();
    return {
      x: head.x + head.width / 2,
      y: head.y + head.height / 2
    };
  }

  setPaths(paths) {
    this.paths = paths;
  }

  setBodyPosition(index, position) {
    console.log(this.id);
    if (this.bodies[index] === undefined || this.bodies[index] === null) {
      this._increase();
    }
    this.bodies[index].position.set(position.x, position.y);
    Share.cull.updateObject(this.bodies[index]);
  }

  setPoint(point) {
    this.point = point;
    this.radius = 20 + this.point * 0.05;
    this._adjustSize();
  }
}
