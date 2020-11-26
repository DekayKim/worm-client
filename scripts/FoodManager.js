import Utility from "./Utility";
import Food from "./Food";

export default class FoodManager {
  static init() {
    this.foods = {};
  }
  static create(data) {
    this.foods[data.id] = new Food(data);
  }

  static update(dt) {
    const keys = Object.keys(this.foods);
    for (let i = 0; i < keys.length; i++) {
      if (!this.foods[keys[i]].sprite.visible) continue;
      this.foods[keys[i]].update(dt);
    }
  }

  static remove(food) {
    delete this.foods[food.id];
  }

  static removeById(foodId) {
    if (this.foods[foodId]) {
      this.foods[foodId].remove();
      delete this.foods[foodId];
    }
  }
}
