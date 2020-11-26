import { io } from "socket.io-client";
import * as msgpack from "msgpack5";
import Utility from "./Utility";
import Share from "./share";
import WormManager from "./WormManager";
import FoodManager from "./FoodManager";
import sp from "schemapack";

const { encode, decode } = msgpack();
const serverURL = "192.168.0.90:3636";

const socketList = [
  "enter",
  "ai",
  "position",
  "point",
  "new_worm",
  "new_food",
  "delete_food",
  "connect",
  "bound_check",
  "inbound",
  "delete_worm",
  "disconnect"
];
export default class Socket {
  static init() {
    this.connection = io(`ws://${serverURL}`);
    this.connection.on("schema", data => {
      const { C2S, S2C } = data;
      this.schema = {
        S2C: Object.fromEntries(
          Object.entries(S2C).map(([name, data]) => [name, sp.build(data)])
        ),
        C2S: Object.fromEntries(
          Object.entries(C2S).map(([name, data]) => [name, sp.build(data)])
        )
      };

      console.log(this.schema);
    });

    socketList.map(key => {
      if (this[`_on_${key}`]) this._on(key, this[`_on_${key}`].bind(this));
      else console.warn(`${key} 에 대한 이벤트를 생성해주세요`);
    });

    // this.enter();
  }

  static enter(name) {
    this._emit("enter", { name }, true);
  }

  static boundCheck(requestId, position) {
    const view = Share.app.view;
    const bound = {
      x: position.x - view.offsetWidth / 2,
      y: position.y - view.offsetHeight / 2,
      width: Share.app.view.offsetWidth,
      height: Share.app.view.offsetHeight
    };
    console.log("bound check emit");
    this._emit("bound_check", { requestId, bound });
  }

  static eat(worm, food) {
    this._emit("eat", { wormId: worm.id, foodId: food.id });
  }

  static position(worm) {
    const data = worm.getInformation();
    this._emit("position", data);
  }

  static inbound(requestId, responseId, bodies, paths) {
    this._emit("inbound", {
      requestId,
      responseId,
      bodies,
      paths
    });
  }

  static conflict(id, looserBodies) {
    this._emit("conflict", { id, looserBodies });
  }

  static _on_connect() {
    if (this._connect === undefined) this._connect = true;
  }

  static _on_disconnect() {
    alert("disconnect!!");
    this._connect = false;
    location.reload();
  }

  static _on_enter(data) {
    console.log("enter", data);
    const { myId, player, food } = data;
    Share.set("myId", myId);
    let myWorm;
    for (let i = 0; i < player.length; i++) {
      const { name, id, x, y, point, isAI } = player[i];
      if (id === myId) {
        myWorm = player[i];
        continue;
      }
      WormManager.create({
        x,
        y,
        id,
        name,
        point,
        isAI
      });
    }

    for (let i = 0; i < food.length; i++) {
      FoodManager.create(food[i]);
    }

    this.boundCheck(myId, { x: myWorm.x, y: myWorm.y });
  }

  static _on_ai(data) {
    Share.set("ai", data);
  }

  static _on_position(data) {
    const worm = WormManager.get(data.id);
    if (worm) worm.setPosition(data.x, data.y);
  }

  static _on_point(data) {
    const worm = WormManager.get(data.id);
    if (worm) {
      const eatAmount = data.point - worm.point;
      if (eatAmount > 0) {
        worm.eat(eatAmount);
      }
      // worm.setPoint(data.point);
    }
  }

  static _on_new_worm(data) {
    const { name, id, x, y, point, isAI } = data;
    WormManager.create({
      x,
      y,
      id,
      name,
      point,
      isAI
    });
  }

  static _on_new_food(data) {
    FoodManager.create(data);
  }

  static _on_delete_food(data) {
    FoodManager.removeById(data);
  }

  static _on_bound_check(data) {
    const myWorms = [WormManager.get(Share.myId)];
    Share.ai.map(aiId => myWorms.push(WormManager.get(aiId)));
    for (let j = 0; j < myWorms.length; j++) {
      const myWorm = myWorms[j];
      let inbound = false;
      for (let i = 0; i < myWorm.bodies.length; i++) {
        const body = myWorm.bodies[i];
        const bodyBound = {
          x: body.x - body.width / 2,
          y: body.y - body.height / 2,
          width: body.width,
          height: body.height
        };
        if (Utility.AABB(data.bound, bodyBound)) {
          inbound = true;
          break;
        }
      }

      if (inbound) {
        this.inbound(
          data.requestId,
          myWorm.id,
          myWorm.bodies.map(body => ({ x: body.x, y: body.y })),
          myWorm.paths.slice(0, myWorm.bodies.length - 1)
        );
      }
    }
  }

  static _on_inbound(data) {
    const { responseId, bodies, paths } = data;
    WormManager.setBodiesPosition(responseId, bodies, paths);
  }

  // data = id
  static _on_delete_worm(data) {
    const worm = WormManager.get(data);
    if (worm) worm.die();
  }

  /* ------------------------------------------ */

  static _emit(key, data, force = false) {
    const schema = this.schema.C2S[key];
    this.connection.emit(key, schema.encode(data));
  }

  static _on(key, fn) {
    this.connection.on(key, data => {
      if (this.schema) {
        const schema = this.schema.S2C[key];
        const decodedData = data ? schema.decode(data) : data;
        fn(decodedData);
      }
    });
  }
}
