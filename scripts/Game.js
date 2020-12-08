import Worm from "./Worm";
import Food from "./Food";
import { Engine, Render, World, Bodies, Body } from "matter-js";
import Collision from "./Collision";
import FoodManager from "./FoodManager";
import Socket from "./Socket";
import WormManager from "./WormManager";
import Share from "./share";
import DOMEvents from "./DOMEvents";
import Joystick from "./Joystick";

export default class Game {
  constructor() {
    Socket.init();
    WormManager.init();
    FoodManager.init();
    Collision.init();
    new Joystick();
  }
  update(dt) {
    const hero = WormManager.get(Share.myId);
    if (hero) {
      const heroHead = hero.getHead();
      if (!this.prevPosition) {
        this.prevPosition = {
          x: heroHead.x,
          y: heroHead.y
        };
      }
      // console.log(heroHead.position);

      const movePosition = {
        x: Math.lerp(this.prevPosition.x, heroHead.x, dt),
        y: Math.lerp(this.prevPosition.y, heroHead.y, dt)
      };

      this.prevPosition = {
        x: movePosition.x,
        y: movePosition.y
      };

      Share.viewport.moveCenter(movePosition.x, movePosition.y);

      // Share.viewport.moveCenter(
      //   heroHead.x + heroHead.width / 2,
      //   heroHead.y + heroHead.height / 2
      // );
    }
    Share.set("rotateDirection", "right");
    if (Share.isMobile) {
      Share.set("rotateCount", 0);
      let mouseAngle = Share.joystickAngle;
      mouseAngle = mouseAngle > 0 ? 180 - mouseAngle : -180 - mouseAngle;

      if (hero) {
        let heroAngle = hero.angle % 360;
        if (heroAngle < 0) heroAngle += 360;
        if (heroAngle > 180) heroAngle -= 360;
        var dif = heroAngle - mouseAngle;

        // console.log(dif);
        if ((dif < 0 && dif > -180) || dif > 180) {
          if (Share.rotateDirection === "left")
            Share.set("rotateCount", Share.rotateCount + 1);
          Share.set("rotateDirection", "right");
        } else if ((dif > 0 && dif < 180) || dif < -180) {
          if (Share.rotateDirection === "right")
            Share.set("rotateCount", Share.rotateCount + 1);
          Share.set("rotateDirection", "left");
        }
      }
    } else if (Share.app.renderer.plugins.interaction.eventData.data) {
      const mouse =
        Share.app.renderer.plugins.interaction.eventData.data.global;
      if (!this.prevMouse) {
        this.prevMouse = {
          x: mouse.x,
          y: mouse.y
        };
      } else if (this.prevMouse.x !== mouse.x || this.prevMouse.y !== mouse.y) {
        this.prevMouse = {
          x: mouse.x,
          y: mouse.y
        };

        Share.set("lastMouse", Date.now());
        Share.set("rotateCount", 0);
      }

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

        // console.log(dif);
        if ((dif < 0 && dif > -180) || dif > 180) {
          if (Share.rotateDirection === "left")
            Share.set("rotateCount", Share.rotateCount + 1);
          Share.set("rotateDirection", "right");
        } else if ((dif > 0 && dif < 180) || dif < -180) {
          if (Share.rotateDirection === "right")
            Share.set("rotateCount", Share.rotateCount + 1);
          Share.set("rotateDirection", "left");
        }
      }
    }

    WormManager.update(dt);
    FoodManager.update(dt);
  }
  destroy() {}
}
