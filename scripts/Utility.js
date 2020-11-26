export default class Utility {
  static getUniqueId() {
    return (
      "_" +
      Math.random()
        .toString(36)
        .substr(2, 9)
    );
  }

  static AABB(rectA, rectB) {
    if (
      rectA.x < rectB.x + rectB.width &&
      rectA.x + rectA.width > rectB.x &&
      rectA.y < rectB.y + rectB.height &&
      rectA.y + rectA.height > rectB.y
    ) {
      return true;
    } else {
      return false;
    }
  }
}
