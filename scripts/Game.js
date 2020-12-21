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
import SpatialHash from "./SpatialHash";

export default class Game {
  constructor() {
    Socket.init();
    WormManager.init();
    FoodManager.init();
    Collision.init();
    if (Share.isMobile) {
      const joystick = new Joystick();
      Share.set("joystick", joystick);
    }
    this.adjustPositionTime = Date.now();

    this.prevVisibles = [];
  }
  update(dt) {
    const hero = WormManager.get(Share.myId);
    if (hero) {
      const heroHead = hero.getHead();
      // this.cull(hero);
      if (!this.prevPosition) {
        this.prevPosition = {
          x: heroHead.x,
          y: heroHead.y
        };
      }

      const movePosition = {
        x: Math.lerp(this.prevPosition.x, heroHead.x, dt / 2),
        y: Math.lerp(this.prevPosition.y, heroHead.y, dt / 2)
      };

      this.prevPosition = {
        x: movePosition.x,
        y: movePosition.y
      };

      Share.viewport.moveCenter(heroHead.x, heroHead.y);
      Share.stage.setTilePosition(heroHead.x, heroHead.y);
    }

    Share.set("rotateDirection", "right");
    if (Share.isMobile) {
      if (this._prevAngle !== Share.joystickAngle) Share.set("rotateCount", 0);
      let mouseAngle = Share.joystickAngle;
      mouseAngle = mouseAngle > 0 ? 180 - mouseAngle : -180 - mouseAngle;

      if (hero) {
        let heroAngle = hero.angle % 360;
        if (heroAngle < 0) heroAngle += 360;
        if (heroAngle > 180) heroAngle -= 360;
        var dif = heroAngle - mouseAngle;

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
      this._prevAngle = Share.joystickAngle;
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

    if (hero) {
      const now = Date.now();

      if (now - this.adjustPositionTime > 1000) {
        this.adjustPositionTime = now;
        Socket.requestPositionAll();
      }
    }
  }
  destroy() { }

  cull(hero) {
    for (let i = 0; i < this.prevVisibles.length; i++) {
      const worm = WormManager.get(this.prevVisibles[i]);
      if (worm) worm.container.visible = false;
    }
    const head = hero.getHead();
    const start = {
      x: head.x - Share.windowSize.width / 1.5,
      y: head.y - Share.windowSize.height / 1.5
    };

    const end = {
      x: head.x + Share.windowSize.width / 1.5,
      y: head.y + Share.windowSize.height / 1.5
    };

    const visibleWorms = [];
    for (let x = start.x; x < end.x; x += Share.wormCellSize) {
      for (let y = start.y; y < end.y; y += Share.wormCellSize) {
        const list = SpatialHash.getWormList(x, y);
        if (list !== undefined) {
          const values = Array.from(list.values());
          for (let key in values) {
            visibleWorms.push(values[key]);
            this.cullDetail(values[key]);
          }
        }
        // const list = Object.values(SpatialHash.getList(x, y));
        // for (let i = 0; i < list.length; i++) visibleWorms.push(list[i]);
      }
    }
    this.prevVisibles = [...visibleWorms];
  }

  cullDetail(id) {
    const worm = WormManager.get(id);
    if (worm) worm.container.visible = true;
  }
}
