import Worm from "./Worm";
import Food from "./Food";
import { Engine, Render, World, Bodies, Body } from "matter-js";
import Collision from "./Collision";
import FoodManager from "./FoodManager";
import Socket from "./Socket";
import WormManager from "./WormManager";
import Share from "./share";
import DOMEvents from "./DOMEvents";

export default class Game {
  constructor() {
    Socket.init();
    WormManager.init();
    FoodManager.init();
    Collision.init();

    setTimeout(() => {
      // DOMEvents.showGameOver();
    }, 6000);
  }
  update(dt) {
    const hero = WormManager.get(Share.myId);
    if (hero) {
      const heroHead = hero.getHead();
      Share.viewport.moveCenter(
        heroHead.x + heroHead.width / 2,
        heroHead.y + heroHead.height / 2
      );

      // Render.lookAt(Share.matter.render, hero._matterPosition(), {
      //   x: window.innerWidth / 2,
      //   y: window.innerHeight / 2
      // });
    }

    const mouse = Share.app.renderer.plugins.interaction.mouse.global;

    let mouseAngle =
      (180 *
        Math.atan2(
          mouse.x - Share.windowSize.width / 2,
          mouse.y - Share.windowSize.height / 2
        )) /
      Math.PI;
    mouseAngle = mouseAngle > 0 ? 180 - mouseAngle : -180 - mouseAngle;
    if (hero) {
      let heroAngle = hero.angle % 360;
      if (heroAngle < 0) heroAngle += 360;
      if (heroAngle > 180) heroAngle -= 360;
      var dif = heroAngle - mouseAngle;

      if ((dif < 0 && dif > -180) || dif > 180) {
        Share.set("rotateDirection", "right");
      } else if ((dif > 0 && dif < 180) || dif < -180) {
        Share.set("rotateDirection", "left");
      }
    }

    WormManager.update(dt);
    FoodManager.update(dt);
  }
  destroy() {}
}
