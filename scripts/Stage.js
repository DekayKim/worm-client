import Share from "./share";

export default class Stage {
  constructor() {
    // const graphics = new PIXI.Graphics();
    // graphics.zIndex = -999999;
    // const gap = 100;
    // graphics.lineStyle(1, 0x97e9f2);
    // for (let i = 0; i < Share.width / gap; i++) {
    //   graphics.moveTo(0, i * gap);
    //   graphics.lineTo(Share.width, i * gap);

    //   graphics.moveTo(i * gap, 0);
    //   graphics.lineTo(i * gap, Share.width);
    // }

    const tilingSprite = new PIXI.TilingSprite(
      gameResources.hex.texture,
      10000,
      10000
    );
    tilingSprite.zIndex = -999999999;

    Share.viewport.addChild(tilingSprite);
  }
}
