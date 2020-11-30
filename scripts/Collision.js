import { Events } from "matter-js";
import Share from "./share";
import Socket from "./Socket";
import DOMEvents from "./DOMEvents";

export default class Collision {
  static init() {
    // Events.on(Share.matter.engine, "collisionActive", event => {
    //   if (event.pairs[0]) {
    //     const { bodyA, bodyB } = event.pairs[0];
    //     const typeCheck = new Set();
    //     typeCheck.add(bodyA.class.type);
    //     typeCheck.add(bodyB.class.type);

    //     if (typeCheck.size === 1) {
    //       this.wormCollision(bodyA, bodyB);
    //     } else {
    //       const worm = bodyA.class.type === "worm" ? bodyA.class : bodyB.class;
    //       const food = bodyA.class.type === "food" ? bodyA.class : bodyB.class;
    //       this.foodCollision(worm, food);
    //     }
    //   }
    // });
  }

  static wormCollision(wormA, wormB) {
    if (wormA._sprite._isHead && wormB._sprite._isHead) return;
    const winner = wormA._sprite._isHead ? wormB.class : wormA.class;
    const looser = winner === wormA.class ? wormB.class : wormA.class;
    if (looser.id === Share.myId) {
      const looserBodies = looser.bodies.map(body => ({
        x: body.x,
        y: body.y
      }));
      Socket.conflict(looser.id, looserBodies);
      looser.die();
      DOMEvents.showGameOver();
    } else if (Share.ai.includes(looser.id)) {
      const looserBodies = looser.bodies.map(body => ({
        x: body.x,
        y: body.y
      }));
      Socket.conflict(looser.id, looserBodies);
      looser.die();
    }
  }

  static foodCollision(worm, food) {
    if (worm.id === Share.myId) Socket.eat(worm, food);
    food.eaten(worm);
  }
}
