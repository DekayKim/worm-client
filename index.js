import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import Cull from "pixi-cull";
import Share from "./scripts/share";
import Game from "./scripts/Game";
import Stage from "./scripts/Stage";
import * as Stats from "stats.js";
import DOMEvents from "./scripts/DOMEvents";

window.PIXI = PIXI;

const stats = new Stats();
stats.showPanel(0);
document.body.append(stats.dom);

var app = new PIXI["Application"]({
  autoResize: true,
  resolution: devicePixelRatio
});
var viewport = new Viewport({
  screenWidth: app.view.offsetWidth,
  screenHeight: app.view.offsetHeight,
  worldWidth: 10000,
  worldHeight: 10000
});
console.log(viewport);

function resize() {
  Share.set("windowSize", {
    width: window.innerWidth,
    height: window.innerHeight
  });
  app.renderer.resize(window.innerWidth, window.innerHeight);
  viewport.resize(app.view.offsetWidth, app.view.offsetHeight, 10000, 1000);
}

window.addEventListener("resize", resize);
window.addEventListener("load", DOMEvents.init.bind(DOMEvents));
const loader = PIXI.Loader.shared;
loader.add("oval", "./assets/oval.png");
loader.add("oval2", "./assets/oval2.png");
loader.add("glow", "./assets/glow.png");
loader.add("hex", "./assets/hex.jpg");
loader.add("spoqa", "./assets/spoqa.fnt");
loader.load((loader, resources) => {
  window.gameResources = resources;
  document.body.appendChild(app.view); // create viewport

  Share.set("app", app);
  Share.set("viewport", viewport);
  Share.set("width", 10000);
  app.stage.addChild(viewport);
  viewport.moveCenter(5000, 5000);
  var cull = new Cull.Simple();
  Share.set("cull", cull);
  cull.cull(viewport.getVisibleBounds());

  const stage = new Stage();
  const game = new Game();
  resize(); // matter.render.canvas.style.background =
  //   "0% 0% / contain rgba(15, 15, 19,0.5)";

  app.ticker.add(dt => {
    stats.begin();

    if (viewport.dirty) {
      cull.cull(viewport.getVisibleBounds());
      viewport.dirty = false;
    }

    game.update(dt);
    stats.end();
  });
});

Math.radians = function(degrees) {
  return (degrees * Math.PI) / 180;
}; // Converts from radians to degrees.

Math.degrees = function(radians) {
  return (radians * 180) / Math.PI;
};

Math.getAngleWithTwoPoint = function(point1, point2) {
  return Math.atan2(point2.y - point1.y, point2.x - point1.x);
};

Math.angleDiff = function(radianA, radianB) {
  return this.degrees(radianA) + 360 - (this.degrees(radianB) + 360);
};

Math.getDistance = function(pointA, pointB) {
  return Math.sqrt((pointA.x - pointB.x) ** 2 + (pointA.y - pointB.y) ** 2);
};

Math.lineLine = function(x1, y1, x2, y2, x3, y3, x4, y4) {
  // calculate the direction of the lines
  const uA =
    ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) /
    ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
  const uB =
    ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) /
    ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

  // if uA and uB are between 0-1, lines are colliding
  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    // optionally, draw a circle where the lines meet

    /*
      !Draw!
      const intersectionX = x1 + uA * (x2 - x1);
      const intersectionY = y1 + uA * (y2 - y1);
      fill(255, 0, 0);
      noStroke();
      ellipse(intersectionX, intersectionY, 20, 20);
    */

    return true;
  }
  return false;
};

Math.lineRect = function(x1, y1, x2, y2, rx, ry, rw, rh) {
  // check if the line has hit any of the rectangle's sides
  // uses the Line/Line function below
  const left = this.lineLine(x1, y1, x2, y2, rx, ry, rx, ry + rh);
  const right = this.lineLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
  const top = this.lineLine(x1, y1, x2, y2, rx, ry, rx + rw, ry);
  const bottom = this.lineLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);

  // if ANY of the above are true, the line
  // has hit the rectangle
  if (left || right || top || bottom) {
    return true;
  }
  return false;
};
