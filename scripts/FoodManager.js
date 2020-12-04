import Utility from "./Utility";
import Food from "./Food";
import SpatialHash from "./SpatialHash";

export default class FoodManager {
  static init() {
    this.foods = {};
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
      if (!this.foods[keys[i]].sprite.visible) continue;
      this.foods[keys[i]].update(dt);
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
}
