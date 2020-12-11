import Share from "./share";

export default class SpatialHash {
  static init() {
    Share.set("cellSize", 100);
    Share.set("wormCellSize", 500);
    this.hash = {};
    this.wormHash = {};
    this.cellSize = 100;
  }
  static add(food) {
    const x = Math.round(food.sprite.x / this.cellSize) * this.cellSize;
    const y = Math.round(food.sprite.y / this.cellSize) * this.cellSize;
    var key = `${x},${y}`;
    if (this.hash[key] === undefined) this.hash[key] = {};
    this.hash[key][food.id] = food;
    food.hashKey = key;
  }

  // static hash(food) {
  //   if (food.hashKey) this.delete(food);

  //   const x = Math.round(food.sprite.x / this.cellSize) * this.cellSize;
  //   const y = Math.round(food.sprite.y / this.cellSize) * this.cellSize;
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
    x = Math.round(x / this.cellSize) * this.cellSize;
    y = Math.round(y / this.cellSize) * this.cellSize;
    return this.hash[x + "," + y] || {};
  }

  static getWormList(x, y) {
    x = Math.round(x / Share.wormCellSize) * Share.wormCellSize;
    y = Math.round(y / Share.wormCellSize) * Share.wormCellSize;
    return this.wormHash[`${x},${y}`];
  }

  static reset() {
    this.hash = {};
  }

  /* ! Worm Hash
   */
  static wormAdd(worm) {
    const head = worm.getHead();
    const x = Math.round(head.x / Share.wormCellSize) * Share.wormCellSize;
    const y = Math.round(head.y / Share.wormCellSize) * Share.wormCellSize;
    const key = x + "," + y;
    if (this.wormHash[key] === undefined) this.wormHash[key] = new Set();
    else if (this.wormHash[key].has(worm.id)) return;
    this.wormHash[key].add(worm.id);
    worm._hashes.unshift(key);
  }

  static wormDelete(worm) {
    const last = worm._hashes.pop();
    if (last) this.wormHash[last].delete(worm.id);
  }
}
