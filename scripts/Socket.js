import Share from "./share";
import WormManager from "./WormManager";
import FoodManager from "./FoodManager";
import sp from "schemapack";
import DOMEvents from "./DOMEvents";

// const serverURL = "192.168.0.71:3636";
// const serverURL = "118.128.86.111:3636";
// const serverURL = "ec2-13-124-27-164.ap-northeast-2.compute.amazonaws.com:3636";
const serverURL = "worm.among.live:3636";

export default class Socket {
  static init() {
    const ws = new WebSocket(`wss://${serverURL}`);
    this.ws = ws;
    ws.binaryType = "arraybuffer";
    ws.onmessage = this._on.bind(this);

    // this.connection = io(`ws://${serverURL}`);
    // this.connection.on("schema", data => {
    //   const { C2S, S2C } = data;
    //   console.log(data);
    //   this.schema = {
    //     S2C: Object.fromEntries(
    //       Object.entries(S2C).map(([name, data]) => [name, sp.build(data)])
    //     ),
    //     C2S: Object.fromEntries(
    //       Object.entries(C2S).map(([name, data]) => [name, sp.build(data)])
    //     )
    //   };
    // });

    this.prevAI = [];
  }

  static enter(name, userId) {
    this._emit(
      "enter",
      { userId, name, color: getRandomColor(), isMobile: Share.isMobile },
      true
    );
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
    this._emit("position", {
      x: worm.bodies[0].x,
      y: worm.bodies[0].y,
      angle: worm.angle
    });
  }

  static angle(worm) {
    this._emit("angle", worm.angle);
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

  static boost_start() {
    this._emit("boost_start");
  }

  static boost_end() {
    this._emit("boost_end");
  }

  static boost_ing(position) {
    this._emit("boost_ing", position);
  }

  static tail_position(id) {
    const worm = WormManager.get(id);
    if (worm) {
      const tail = worm.getTail();
      if (tail) this._emit("tail_position", { id, x: tail.x, y: tail.y });
    }
  }

  static requestPositionAll() {
    this._emit("position_all");
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
    const { myId, player, food } = data;
    Share.set("myId", myId);
    for (let i = 0; i < player.length; i++) {
      const { name, id, x, y, point, isAI, color } = player[i];
      WormManager.create({
        x,
        y,
        id,
        name,
        point,
        color,
        isAI
      });
    }

    for (let i = 0; i < food.length; i++) {
      FoodManager.create(food[i]);
    }

    Share.stage.startDrawMinimap();
    this.requestPositionAll();

    // this.boundCheck(myId, { x: myWorm.x, y: myWorm.y });
  }

  static _on_ai(data) {
    // console.log("ai", data);
    // Share.set("ai", data);
    document.getElementById("AI").innerText = "AI : " + data.length;
    for (let i = 0; i < this.prevAI; i++) {
      const id = data[i];
      const worm = WormManager.get(id);
      if (worm) worm._control = false;
    }

    this.prevAI = data;

    for (let i = 0; i < data.length; i++) {
      const id = data[i];
      const worm = WormManager.get(id);
      if (worm) worm._control = true;
    }
  }

  static _on_position(data) {
    const worm = WormManager.get(data.id);
    if (worm) worm.setPosition(data.x, data.y);
  }

  static _on_angle_all(data) {
    for (let i = 0; i < data.length; i++) {
      const { id, angle, point, x, y } = data[i];
      const worm = WormManager.get(id);

      if (worm) {
        worm.getHead().position.set(x, y);
        if (id !== Share.myId) {
          worm.setAngle(angle);
        }
        worm.setPoint(point);
      }
    }
  }

  static _on_position_all(data) {
    return;
    // console.log("position_all", data);
    for (let i = 0; i < data.length; i++) {
      const worm = WormManager.get(data[i].id);
      if (data[i].id === Share.myId) continue;
      if (worm) {
        console.log(data[i].x, data[i].y, "ff");
        worm.getHead().position.set(data[i].x, data[i].y);
      }
    }
  }

  static _on_point(data) {
    console.log(data, "on_point");
    // const worm = WormManager.get(data.id);
    // if (worm) {
    //   const eatAmount = data.point - worm.point;
    //   if (eatAmount > 0) {
    //     worm.eat(eatAmount);
    //   }
    //   // worm.setPoint(data.point);
    // }
  }

  static _on_new_worm(data) {
    for (let i = 0; i < data.length; i++) {
      const { name, id, x, y, point, isAI, color, delay } = data[i];
      // console.log(id);
      if (delay) {
        const timeoutId = setTimeout(() => {
          WormManager.create({
            x,
            y,
            id,
            name,
            point,
            isAI,
            color
          });
          Share.wormDelay.delete(timeoutId);
        }, Math.min(delay - 100, delay));
        Share.wormDelay.add(timeoutId);
      } else {
        WormManager.create({
          x,
          y,
          id,
          name,
          point,
          isAI,
          color
        });
      }
    }
  }

  static _on_new_food(data) {
    for (let i = 0; i < data.length; i++) {
      FoodManager.create(data[i]);
    }
  }

  static _on_delete_food(data) {
    for (let i = 0; i < data.length; i++) {
      const { foodId, wormId } = data[i];
      if (wormId !== "n") {
        const food = FoodManager.get(foodId);
        const worm = WormManager.get(wormId);
        if (food && worm) food.eaten(worm);
      } else {
        FoodManager.removeById(foodId);
      }
    }
  }

  static _on_bound_check(data) {
    // const myWorms = [WormManager.get(Share.myId)];
    // Share.ai.map(aiId => myWorms.push(WormManager.get(aiId)));
    // for (let j = 0; j < myWorms.length; j++) {
    //   const myWorm = myWorms[j];
    //   let inbound = false;
    //   for (let i = 0; i < myWorm.bodies.length; i++) {
    //     const body = myWorm.bodies[i];
    //     const bodyBound = {
    //       x: body.x - body.width / 2,
    //       y: body.y - body.height / 2,
    //       width: body.width,
    //       height: body.height
    //     };
    //     if (Utility.AABB(data.bound, bodyBound)) {
    //       inbound = true;
    //       break;
    //     }
    //   }
    //   if (inbound) {
    //     this.inbound(
    //       data.requestId,
    //       myWorm.id,
    //       myWorm.bodies.map(body => ({ x: body.x, y: body.y })),
    //       myWorm.paths.slice(0, myWorm.bodies.length - 1)
    //     );
    //   }
    // }
  }

  static _on_boost_start(data) {
    const worm = WormManager.get(data.id);
    if (worm) {
      // worm.boosterEffectOn();
      worm.boosterStart();
    }
  }

  static _on_boost_end(data) {
    const worm = WormManager.get(data.id);
    if (worm) {
      // worm.boosterEffectOff();
      worm.boosterEnd();
    }
  }

  static _on_inbound(data) {
    const { responseId, bodies, paths } = data;
    WormManager.setBodiesPosition(responseId, bodies, paths);
  }

  // data = id
  static _on_delete_worm(data) {
    const worm = WormManager.get(data);
    if (worm) {
      // console.log(worm.nickname.text);
      worm.die();
    } else {
      console.warn(data, "없음");
    }
  }

  static _on_tail_position(data) {
    // console.log("tail_poistion", data);
    const { id } = data;
    this.tail_position(id);
  }

  static _on_record(data) {
    const { best, world } = data;
    const myBestDiv = DOMEvents._get("my-best");
    DOMEvents.makeRankItem(best.rank, best.name, best.point, myBestDiv);

    const worldRecordDiv = DOMEvents._get("all-rank");
    for (let i = 0; i < world.length; i++) {
      const { name, rank, point } = world[i];
      DOMEvents.makeRankItem(rank, name, point, worldRecordDiv);
    }
  }

  /* ------------------------------------------ */

  static _emit(key, data = null, force = false) {
    const { C2S, events } = this.schema;
    const schema = C2S[key];
    const keyBinary = new Uint8Array([events.indexOf(key)]);
    let convertedData;
    if (data) {
      const dataBinary = schema.encode(data);
      convertedData = new Uint8Array(keyBinary.length + dataBinary.length);
      convertedData.set(keyBinary, 0);
      convertedData.set(dataBinary, keyBinary.length);
    } else {
      convertedData = keyBinary;
    }
    this.ws.send(convertedData.buffer);
  }

  static _on(message) {
    if (message.constructor !== MessageEvent) {
      console.warn("잘못된 형식의 message 입니다", message);
      return;
    }

    const { S2C, events } = this.schema;
    const keyInt = new Uint8Array(message.data, 0, 1);
    const key = events[keyInt];
    if (this[`_on_${key}`]) {
      const dataBinary = new Uint8Array(message.data, 1);
      const schema = S2C[key];
      const data = schema.decode(dataBinary);
      this[`_on_${key}`](data);
    } else {
      console.warn(key, "event가 없습니다");
    }
  }

  static async getScheme() {
    const response = await fetch(`https://${serverURL}/scheme`, {
      headers: { "Content-Type": "application/json" }
    });
    const schema = await response.json();
    const { S2C, C2S, events } = schema;
    this.schema = {
      events,
      S2C: Object.fromEntries(
        Object.entries(S2C).map(([name, data]) => [name, sp.build(data)])
      ),
      C2S: Object.fromEntries(
        Object.entries(C2S).map(([name, data]) => [name, sp.build(data)])
      )
    };
  }
}
