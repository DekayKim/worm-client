import Share from "./share";

export default class TestWorm {
  static init() {
    const container = new PIXI.Container();
    const sprite = new PIXI.Sprite(gameResources.oval.texture);
    sprite.position.set(5000, 5000);
    sprite.width = 500;
    sprite.height = 500;
    container.addChild(sprite);

    const sprite2 = new PIXI.Sprite(gameResources.oval.texture);
    sprite2.position.set(5500, 5500);
    sprite2.width = 50;
    sprite2.height = 50;
    sprite2.tint = 0xdf0732;
    container.addChild(sprite2);
    Share.viewport.addChild(container);
    Share.cull.add(container);

    this.container = container;
    this.container.visible = false;
    window.t = this;
  }

  static update(x, y) {
    this.container.position.set(x, y);
  }
}
