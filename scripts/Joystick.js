import Share from "./share";
import WormManager from "./WormManager";

export default class Joystick {
  constructor() {
    this.angle = 0;

    const min = Math.min(Share.windowSize.width, Share.windowSize.height);

    const base = new PIXI.Sprite(gameResources.joystick_base.texture);
    base.anchor.set(0.5, 0.5);
    const margin = min * 0.1 + base.width / 2;
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
    boostButton.interactive = true;
    boostButton.position.set(Share.windowSize.width - margin, base.y);
    boostButton.on("pointerdown", this._boosterStart.bind(this));
    boostButton.on("pointerup", this._boosterEnd.bind(this));
    boostButton.on("pointerupoutside", this._boosterEnd.bind(this));
    Share.app.stage.addChild(boostButton);

    Share.set("joystickAngle", 0);
  }

  _pointerDown() {
    this.joystickDown = true;
  }

  _pointerMove(e) {
    if (this.joystickDown) {
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
