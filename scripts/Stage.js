import Share from "./share";
import WormManager from "./WormManager";

export default class Stage {
  constructor() {
    const graphics = new PIXI.Graphics();
    graphics.zIndex = 999999;
    Share.set("graphics", graphics);

    const graphics1 = new PIXI.Graphics();
    graphics1.zIndex = 999999;
    Share.set("graphics1", graphics1);

    const minimap = new PIXI.Graphics();
    minimap.zIndex = 999999;
    Share.set("minimap", minimap);
    this.minimap = minimap;
    // const gap = 100;
    // graphics.lineStyle(1, 0x97e9f2);
    // for (let i = 0; i < Share.width / gap; i++) {
    //   graphics.moveTo(0, i * gap);
    //   graphics.lineTo(Share.width, i * gap);

    //   graphics.moveTo(i * gap, 0);
    //   graphics.lineTo(i * gap, Share.width);
    // }

    const tilingSprite = new PIXI.TilingSprite(
      gameResources.pattern_4.texture,
      Share.windowSize.width,
      Share.windowSize.height
    );
    tilingSprite.roundPixels = true;
    tilingSprite.tint = 0x777777;
    this.tilingSprite = tilingSprite;
    tilingSprite.zIndex = -999999999;
    // tilingSprite.cacheAsBitmap = true;
    PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH;

    // Share.viewport.addChild(tilingSprite);
    Share.app.stage.sortableChildren = true;
    if (!Share.isMobile || true) Share.app.stage.addChild(tilingSprite);
    Share.viewport.addChild(graphics);
    Share.viewport.addChild(graphics1);
    Share.app.stage.addChild(minimap);

    // graphics.beginFill(0x000000, 0.5);
    graphics.lineStyle(5, 0xffffff, 1);
    graphics.drawRect(0, 0, Share.stageSize, Share.stageSize);
  }

  resize(width, height) {
    this.tilingSprite.width = width;
    this.tilingSprite.height = height;
  }

  setTilePosition(x, y) {
    this.tilingSprite.tilePosition.set(
      -x % this.tilingSprite.texture.orig.width,
      -y % this.tilingSprite.texture.orig.height
    );
  }

  setTileScale(scale) {
    this.tilingSprite.tileScale.set(scale);
  }

  startDrawMinimap() {
    this.drawMinimap();
    this.drawMinimapId = setInterval(() => this.drawMinimap(), 1000);
  }

  stopDrawMinimap() {
    this.minimap.clear();

    clearInterval(this.drawMinimapId);
  }

  drawMinimap() {
    const min = Math.min(Share.windowSize.width, Share.windowSize.height);
    const size = min / 5;
    const start = {
      // x: Share.windowSize.width - size,
      // y: Share.windowSize.height - size
      x: min * 0.02,
      y: min * 0.02
    };
    this.minimap.clear();
    this.minimap.beginFill(0x000000, 0.5);
    this.minimap.lineStyle(3, 0xffffff, 1);
    this.minimap.drawRect(start.x, start.y, size, size);

    this.minimap.lineStyle(0, 0xffffff, 1);
    const worms = WormManager.getAll();
    this.minimap.beginFill(0xffffff, 0.8);
    for (let i = 0; i < worms.length; i++) {
      if (worms[i]) {
        const head = worms[i].getHead();
        this.minimap.drawCircle(
          start.x + (head.x / Share.stageSize) * size,
          start.y + (head.y / Share.stageSize) * size,
          3
        );
      }
    }

    const myWorm = WormManager.get(Share.myId);
    if (myWorm) {
      this.minimap.beginFill(0xffffff, 1);
      this.minimap.lineStyle(3, 0xff0000, 0.5);
      const head = myWorm.getHead();
      this.minimap.drawCircle(
        start.x + (head.x / Share.stageSize) * size,
        start.y + (head.y / Share.stageSize) * size,
        5
      );
    }
  }
}
