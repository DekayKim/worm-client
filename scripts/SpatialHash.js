import Share from "./share";

export default class SpatialHash {
  static init() {
    Share.set("cellSize", 100);
    this.hash = {};
  }
  static add(food) {
    const x = Math.round(food.sprite.x / Share.cellSize) * Share.cellSize;
    const y = Math.round(food.sprite.y / Share.cellSize) * Share.cellSize;
    var key = `${x},${y}`;
    if (this.hash[key] === undefined) this.hash[key] = {};
    this.hash[key][food.id] = food;
    food.hashKey = key;
  }

  // static hash(food) {
  //   if (food.hashKey) this.delete(food);

  //   const x = Math.round(food.sprite.x / Share.cellSize) * Share.cellSize;
  //   const y = Math.round(food.sprite.y / Share.cellSize) * Share.cellSize;
  //   var key = `${x},${y}`;
  //   if (this.hash[key] === undefined) this.hash[key] = {};
  //   this.hash[key][food.id] = food;
  //   food.hashKey = key;
  // }

  static delete(food) {
    if (food.hashKey) {
      delete this.hash[food.hashKey][food.id];
      food.hashKey = null;
    }
  }

  static getList(x, y) {
    x = Math.round(x / Share.cellSize) * Share.cellSize;
    y = Math.round(y / Share.cellSize) * Share.cellSize;
    return this.hash[`${x},${y}`] || {};
  }

  static reset() {
    this.hash = {};
  }
}
