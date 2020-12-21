import Share from "./share";
import WormManager from "./WormManager";

export default class Joystick {
  constructor() {
    this.angle = 0;

    const min = Math.min(Share.windowSize.width, Share.windowSize.height);

    const base = new PIXI.Sprite(gameResources.joystick_base.texture);
    base.anchor.set(0.5, 0.5);
    const margin = min * 0.12 + base.width / 2;
    base.x = margin;
    base.y = Share.windowSize.height - margin;
    base.interactive = true;
    base.on("pointerdown", this._pointerDown.bind(this));
    base.on("pointermove", this._pointerMove.bind(this));
    base.on("pointerup", this._pointerUp.bind(this));
    base.on("pointerupoutside", this._pointerUp.bind(this));
    this.base = base;

    const joystickButton = new PIXI.Sprite(
      gameResources.joystick_button.texture
    );
    joystickButton.anchor.set(0.5, 0.5);
    this.joystickButton = joystickButton;
    base.addChild(joystickButton);
    Share.app.stage.addChild(base);

    const boostButton = new PIXI.Sprite(gameResources.boost_button.texture);
    boostButton.anchor.set(0.5, 0.5);
    boostButton.scale.set(1.4);
    boostButton.interactive = true;
    boostButton.position.set(Share.windowSize.width - margin + 40, base.y);
    boostButton.on("pointerdown", this._boosterStart.bind(this));
    boostButton.on("pointerup", this._boosterEnd.bind(this));
    boostButton.on("pointerupoutside", this._boosterEnd.bind(this));
    this.boostButton = boostButton;
    Share.app.stage.addChild(boostButton);

    Share.set("joystickAngle", 0);
    this.hide();
  }

  show() {
    this.base.visible = true;
    this.boostButton.visible = true;

    const min = Math.min(Share.windowSize.width, Share.windowSize.height);
    const margin = min * 0.08 + this.base.width / 2;
    this.base.x = margin;
    this.base.y = Share.windowSize.height - margin;
    this.boostButton.position.set(Share.windowSize.width - margin + 40, this.base.y);
  }

  hide() {
    this.base.visible = false;
    this.boostButton.visible = false;
  }

  _pointerDown(e) {
    this.joystickDown = true;
    this.identifier = e.data.identifier;
    document.getElementById("IDENTIFIER1").textContent = e.data.identifier;
  }

  _pointerMove(e) {
    document.getElementById("IDENTIFIER2").textContent = e.data.identifier;
    if (this.joystickDown) {
      if (e.data.identifier !== this.identifier) return;
      const lengthFromCenter = Math.getDistance(
        this.base.position,
        e.data.global
      );
      const angle = Math.getAngleWithTwoPoint(
        this.base.position,
        e.data.global
      );

      const subAngle =
        (180 *
          Math.atan2(
            e.data.global.x - this.base.position.x,
            e.data.global.y - this.base.position.y
          )) /
        Math.PI;
      Share.set("joystickAngle", subAngle);
      if (lengthFromCenter > this.base.width / 2) {
        // 길이 초과
        const buttonPosition = Math.getPointWithAngleDistance(
          angle,
          this.base.width / 2
        );
        this.joystickButton.position.set(buttonPosition.x, buttonPosition.y);
      } else {
        const buttonPosition = Math.getPointWithAngleDistance(
          angle,
          lengthFromCenter
        );
        this.joystickButton.position.set(buttonPosition.x, buttonPosition.y);
      }
    }
  }

  _pointerUp() {
    this.joystickButton.position.set(0, 0);
    this.joystickDown = false;
  }

  _boosterStart() {
    const worm = WormManager.get(Share.myId);
    if (worm) worm.boosterStart();
  }

  _boosterEnd() {
    const worm = WormManager.get(Share.myId);
    if (worm) worm.boosterEnd();
  }
}
