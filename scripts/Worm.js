import Share from "./share";
import { Engine, Render, World, Bodies, Body, Vector } from "matter-js";
import WormManager from "./WormManager";

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
    this.matterGroup = Body.nextGroup(true);

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

        if (keyName === "w") {
          this.angle += 10;
        } else if (keyName === "s") {
          this.angle -= 10;
        } else if (keyName === "q") {
          this.speed = 0;
        } else if (event.keyCode === 32 && this.isAI !== true) {
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

    sprite.matter = {
      body: Bodies.circle(x, y, this.radius)
    };

    sprite.matter.body._sprite = sprite;
    sprite.matter.body.class = this;
    sprite.matter.body.collisionFilter.group = this.matterGroup;
    sprite.matter.body.collisionFilter.category = 0x0100;
    sprite.matter.body.collisionFilter.mask = 0x0101;
    World.add(Share.matter.engine.world, sprite.matter.body);

    if (isHead) {
      sprite._isHead = true;
      sprite.matter.head = Bodies.circle(x, y, this.radius * 2);
      sprite.matter.head._sprite = sprite;
      sprite.matter.head.class = this;
      sprite.matter.head.collisionFilter.group = this.matterGroup;
      sprite.matter.head.collisionFilter.category = 0x0010;
      sprite.matter.head.collisionFilter.mask = 0x0001;
      World.add(Share.matter.engine.world, sprite.matter.head);
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
    const head = this.getHead();
    const distance = Math.sqrt((head.x - x) ** 2 + (head.y - y) ** 2);
    head.position.set(x, y);
    Share.cull.updateObject(head);
    Body.setPosition(head.matter.body, { x: head.x, y: head.y });
    Body.setPosition(head.matter.head, { x: head.x, y: head.y });
    this._bodiesUpdate(distance);
  }

  update(dt) {
    // const _finalAngle = 180 * Math.atan2(_mouseAngle.x - )

    if (this.isAI) {
      if (Date.now() - this._AITime > 1000) {
        this._AITime = Date.now();
        this._AIAngle += Math.random() * 90 - 45;
      }
      if (this.angle < this._AIAngle) this.angle += 1;
      else this.angle -= 1;
    } else {
      if (Share.rotateDirection === "right") this.angle += dt * 5;
      else this.angle -= dt * 5;
    }

    const head = this.getHead();
    const radian = Math.radians(this.angle - 90);
    const distance = (this.speed / 60) * dt;

    /* Head Move */
    if (this.id === Share.myId || (Share.ai && Share.ai.includes(this.id))) {
      head.x += Math.cos(radian) * distance;
      head.y += Math.sin(radian) * distance;
      head.rotation = radian + this._rotation;
      Share.cull.updateObject(head);
      Body.setPosition(head.matter.body, { x: head.x, y: head.y });
      Body.setPosition(head.matter.head, { x: head.x, y: head.y });
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

      body.rotation = radian + this._rotation;
      Share.cull.updateObject(body);
      // Body.setPosition(body.matter.body, {
      //   x: body.x,
      //   y: body.y
      // });
    }

    this.radius = 20 + this.point * 0.05;
    if (this._prevRadius !== this.radius) {
      this._prevRadius = this.radius;
      this._adjustSize();
    }

    Share.cull.updateObject(this.nickname);
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
    Body.setPosition(head.matter.body, { x: head.x, y: head.y });
    Body.setPosition(head.matter.head, { x: head.x, y: head.y });
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

      const radian = Math.getAngleWithTwoPoint(body.position, this.paths[i]);

      // const rotation = (radian + this._rotation - body.rotation) / 60;
      body.x += Math.cos(radian) * distance;
      body.y += Math.sin(radian) * distance;

      // const test = Math.sqrt((body.x - prev.x) ** 2 + (body.y - prev.y) ** 2);
      // if (test >= this._followDistance * 1.2) {
      //   body.x = this.paths[i].x;
      //   body.y = this.paths[i].y;
      // }

      body.rotation = radian + this._rotation;
      Share.cull.updateObject(body);
      Body.setPosition(body.matter.body, {
        x: body.x,
        y: body.y
      });
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
      if (i === 0)
        World.remove(Share.matter.engine.world, this.bodies[i].matter.head);
      World.remove(Share.matter.engine.world, this.bodies[i].matter.body);

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
      if (this.bodies[i].matter.body.circleRadius !== this.radius) {
        this._updateMatterRadius(this.bodies[i]);
      }
      // head이면 magnet 범위 늘려주기
      if (i === 0) {
        World.remove(Share.matter.engine.world, this.bodies[i].matter.head);
        this.bodies[i].matter.head = Bodies.circle(
          this.bodies[i].x,
          this.bodies[i].y,
          this.radius * 2
        );
        this.bodies[i].matter.head._sprite = this.bodies[i];
        this.bodies[i].matter.head.class = this;
        this.bodies[i].matter.head.collisionFilter.group = this.matterGroup;
        this.bodies[i].matter.head.collisionFilter.category = 0x0010;
        this.bodies[i].matter.head.collisionFilter.mask = 0x0001;

        World.add(Share.matter.engine.world, this.bodies[i].matter.head);
      }
    }
  }

  _adjustPosition() {
    for (let i = 1; i < this.bodies.length; i++) {
      const prev = this.bodies[i - 1];
      const current = this.bodies[i];
      // if()
    }
  }

  _updateMatterRadius(sprite) {
    World.remove(Share.matter.engine.world, sprite.matter.body);
    sprite.matter.body = Bodies.circle(sprite.x, sprite.y, this.radius);

    sprite.matter.body._sprite = sprite;
    sprite.matter.body.class = this;
    sprite.matter.body.collisionFilter.group = this.matterGroup;
    sprite.matter.body.collisionFilter.category = 0x0001;
    sprite.matter.body.collisionFilter.mask = 0x0101;
    World.add(Share.matter.engine.world, sprite.matter.body);
  }

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
    Body.setPosition(this.bodies[index].matter.body, {
      x: position.x,
      y: position.y
    });
  }

  setPoint(point) {
    this.point = point;
    this.radius = 20 + this.point * 0.05;
    this._adjustSize();
  }

  _createPhysics() {
    for (let i = 0; i < this.bodies.length; i++) {
      this.bodies[i].matter.body = Bodies.circle(
        this.bodies[i].x,
        this.bodies[i].y,
        this.radius
      );
      this.bodies[i].matter.body._sprite = this.bodies[i];
      this.bodies[i].matter.body.class = this;
      this.bodies[i].matter.body.collisionFilter.group = this.matterGroup;
      this.bodies[i].matter.body.collisionFilter.category = 0x0001;
      this.bodies[i].matter.body.collisionFilter.mask = 0x0101;
      World.add(Share.matter.engine.world, this.bodies[i].matter.body);
    }
  }
  _removePhysics() {
    for (let i = 0; i < this.bodies.length; i++) {
      World.remove(Share.matter.engine.world, this.bodies[i].matter.body);
    }
  }
}
