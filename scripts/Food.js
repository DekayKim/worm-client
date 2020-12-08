import { Engine, Render, World, Bodies, Body, Vector } from "matter-js";
import Share from "./share";
import FoodManager from "./FoodManager";
import SpatialHash from "./SpatialHash";
import Socket from "./Socket";

const MAGNET_TIME = 500;
export default class Food {
  constructor(data) {
    const { x, y, id, amount, color } = data;
    this.id = id;
    this.origin = { x, y };
    this.type = "food";
    this.amount = amount;
    const radius = (15 + amount * 2) / 2;
    this.radius = radius;
    this.sprite = FoodManager.borrowSprite();
    this.sprite.position.set(x, y);
    this.sprite.width = this.sprite.height = radius * 2;
    this.sprite.alpha = 0;
    this.sprite.tint = parseInt(color, 16);

    // glow.anchor.set(0.5, 0.5);
    this.glow = this.sprite._glow;
    // this.sprite.addChild(glow);

    this._glowSwitch = 0;
    this._glowTime = Math.random() * 1;
    this._glowAmount = 0.2;
    // this.glow.tint = 0xff0000;

    this._updateTime = Math.random() * 1000;

    SpatialHash.add(this);
    Share.viewport.addChild(this.sprite);
    Share.cull.add(this.sprite);
  }

  eaten(worm) {
    /* 네트워크로 지우는 명령어 전달 */

    if (worm.id === Share.myId) {
      const soundIndex = Math.floor(Math.random() * 3) + 1;
      gameResources[`sound_eat_${soundIndex}`].sound.play();
    }
    if (worm.id === Share.myId || (Share.ai && Share.ai.includes(worm.id)))
      Socket.eat(worm, this);
    SpatialHash.delete(this);
    this.eatenTime = Date.now();
    this.target = worm;
    this.from = { x: this.sprite.x, y: this.sprite.y };
  }

  remove() {
    Share.cull.remove(this.sprite);
    Share.viewport.removeChild(this.sprite);
    // this.sprite.destroy({ children: true });
    // this.sprite = null;
    FoodManager.returnSprite(this.sprite);
    FoodManager.remove(this);
  }

  removeById() {
    Share.cull.remove(this.sprite);
    Share.viewport.removeChild(this.sprite);
    this.sprite = null;
  }

  outsideTargetUpdate() {
    if (this.target) {
      this.target.eat(this.amount);
      this.remove();
    }
  }

  update(dt) {
    this._updateTime += dt / 60;
    this._glowTime += dt / 60;

    if (this.sprite.alpha < 1) this.sprite.alpha += 0.01;

    if (this.target) {
      const elapsedTime = Date.now() - this.eatenTime;
      const progress =
        elapsedTime / MAGNET_TIME > 1 ? 1 : elapsedTime / MAGNET_TIME;

      const head = this.target.getHead();

      if (head === null || head === undefined) {
        this.remove();
        return;
      }
      const gap = {
        x: head.x - this.from.x,
        y: head.y - this.from.y
      };
      this.sprite.position.set(
        this.from.x + gap.x * progress,
        this.from.y + gap.y * progress
      );

      if (progress === 1) {
        this.target.eat(this.amount);
        this.remove();
        return;
      }
    } else {
      const move = (this._updateTime % 1) * Math.PI * 2;
      const direction = Math.floor(this._updateTime) % 2 === 0 ? 1 : -1;

      this.sprite.x = this.origin.x + (move * 2 - Math.PI * 2) * direction;
      this.sprite.y = this.origin.y + Math.sin(move) * 3;
    }

    let scale = this._glowSwitch
      ? this._glowTime * this._glowAmount
      : this._glowAmount - this._glowTime * this._glowAmount;

    this.glow.scale.set(0.3 + scale);

    if (this._glowTime > 1) {
      this._glowTime = 0;
      this._glowSwitch = !this._glowSwitch;
    }

    // Body.setPosition(this.matter.body, {
    //   x: this.matter.body.position.x + 0.1,
    //   y: this.matter.body.position.y
    // });
  }
}

// Sin 그래프 통해서 8자 움직임 구현
// 매니저 필요하고
// origin 생성 좌표 필요 > 이거 위주로 8자 구현
// target 생기면 거기로 무조건 날라가기 > wg.action 과 동일하게 구현 시간으로
