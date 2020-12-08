import Utility from "./Utility";
import Food from "./Food";
import SpatialHash from "./SpatialHash";

export default class FoodManager {
  static init() {
    this.foods = {};
    this.foodSprites = [];
  }
  static create(data) {
    this.foods[data.id] = new Food(data);
  }

  static get(id) {
    return this.foods[id];
  }

  static getAll() {
    return Object.values(this.foods);
  }

  static update(dt) {
    const keys = Object.keys(this.foods);
    for (let i = 0; i < keys.length; i++) {
      if (!this.foods[keys[i]].sprite.visible) {
        this.foods[keys[i]].outsideTargetUpdate();
      } else {
        this.foods[keys[i]].update(dt);
      }
    }
  }

  static remove(food) {
    SpatialHash.delete(food);
    delete this.foods[food.id];
    food.target = null;
    food = null;
  }

  static removeById(foodId) {
    if (this.foods[foodId]) {
      SpatialHash.delete(this.foods[foodId]);
      this.foods[foodId].remove();
      delete this.foods[foodId];
    }
  }

  static reset() {
    const foods = this.getAll();
    for (let i = 0; i < foods.length; i++) {
      foods[i].remove();
    }
    this.foods = {};
  }

  static _createSprite() {
    const glow = new PIXI.Sprite(gameResources.glow.texture);
    const sprite = new PIXI.Sprite(gameResources.oval.texture);
    // sprite.position.set(x, y);
    sprite.anchor.set(0.5, 0.5);
    // sprite.width = sprite.height = radius * 2;
    sprite.zIndex = -99999;
    sprite.alpha = 0;
    // sprite.tint = parseInt(color, 16);

    glow.anchor.set(0.5, 0.5);
    sprite.addChild(glow);
    sprite._glow = glow;

    // glow.addChild(sprite);
    // glow._glow = glow;

    this.foodSprites.push(sprite);
    // this.glow = glow;
  }

  static borrowSprite() {
    if (this.foodSprites.length === 0) this._createSprite();
    const sprite = this.foodSprites.pop();
    return sprite;
  }

  static returnSprite(sprite) {
    this.foodSprites.push(sprite);
  }
}
