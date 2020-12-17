import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
// import Cull from "pixi-cull";
import Share from "./scripts/share";
import Game from "./scripts/Game";
import Stage from "./scripts/Stage";
import * as Stats from "stats.js";
import DOMEvents from "./scripts/DOMEvents";
import SpatialHash from "./scripts/SpatialHash";
import MobileDetect from "mobile-detect";
import "pixi-sound";
import TestWorm from "./scripts/TestWorm";
import { Cull } from "@pixi-essentials/cull";
import Socket from "./scripts/Socket";

const md = new MobileDetect(window.navigator.userAgent);
let stage = null;
Share.set("isMobile", md.mobile() ? true : false);
window.PIXI = PIXI;

// const stats = new Stats();
// stats.showPanel(0);
// stats.dom.style.position = "absolute";
// stats.dom.style.bottom = "400px";
// stats.dom.style.left = 0;
// stats.dom.style.top = null;
// document.body.append(stats.dom);
Share.set("stageSize", 30000);

Share.set("windowSize", {
  width: window.innerWidth,
  height: window.innerHeight
});
var app = new PIXI["Application"]({
  autoResize: true,
  backgroundColor: 0x222222
  // resolution : 4,
});

var viewport = new Viewport({
  screenWidth: app.view.offsetWidth,
  screenHeight: app.view.offsetHeight,
  worldWidth: Share.stageSize,
  worldHeight: Share.stageSize
});

function resize() {
  Share.set("windowSize", {
    width: window.innerWidth,
    height: window.innerHeight
  });
  app.renderer.resize(window.innerWidth, window.innerHeight);
  viewport.resize(
    app.view.offsetWidth,
    app.view.offsetHeight,
    Share.stageSize,
    Share.stageSize
  );

  if (stage) stage.resize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", resize);
window.addEventListener("load", DOMEvents.init.bind(DOMEvents));
const loader = PIXI.Loader.shared;
loader.add("oval", "./assets/oval.png");
loader.add("oval2", "./assets/oval2.png");
loader.add("glow", "./assets/glow.png");
loader.add("hex", "./assets/hex.jpg");
loader.add("pattern_1", "./assets/pattern_1.png");
loader.add("pattern_2", "./assets/pattern_2.jpg");
loader.add("pattern_3", "./assets/pattern_3.jpg");
loader.add("pattern_4", "./assets/pattern_4.jpg");
loader.add("mask", "./assets/mask.png");
loader.add("pixel", "./assets/pixel.png");
loader.add("spoqa", "./assets/spoqa.fnt");
loader.add("joystick_base", "./assets/analog_base.png");
loader.add("joystick_button", "./assets/analog_button.png");
loader.add("boost_button", "./assets/boost_button.png");

loader.add("sound_bgm", "./sound/bgm.mp3");
loader.add("sound_dash", "./sound/dash.mp3");
loader.add("sound_eat_1", "./sound/eat1.mp3");
loader.add("sound_eat_2", "./sound/eat2.mp3");
loader.add("sound_eat_3", "./sound/eat3.mp3");
loader.add("sound_gameover", "./sound/gameover.mp3");
loader.load(process);

async function process(loader, resources) {
  window.gameResources = resources;
  document.body.appendChild(app.view); // create viewport

  Share.set("wormDelay", new Set());
  Share.set("app", app);
  Share.set("viewport", viewport);
  Share.set("width", 10000);
  SpatialHash.init();
  app.stage.addChild(viewport);
  viewport.moveCenter(5000, 5000);
  var cull = new Cull({ recursive: false });
  Share.set("cull", cull);

  gameResources.sound_bgm.sound.play({ loop: true });
  stage = new Stage();
  Share.set("stage", stage);
  await Socket.getScheme();
  const game = new Game();
  resize();

  let lastCull = Date.now();
  app.ticker.add(dt => {
    const now = Date.now();
    if (now - lastCull > 1000 / 30) {
      cull.cull(app.renderer.screen);
      lastCull = now;
    }

    game.update(dt);
  });
}

Math.radians = function(degrees) {
  return (degrees * Math.PI) / 180;
}; // Converts from radians to degrees.

Math.degrees = function(radians) {
  return (radians * 180) / Math.PI;
};

Math.getAngleWithTwoPoint = function(point1, point2) {
  return Math.atan2(point2.y - point1.y, point2.x - point1.x);
};

Math.getPointWithAngleDistance = function(radian, distance) {
  return {
    x: distance * this.cos(radian),
    y: distance * this.sin(radian)
  };
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

Math.OBB = function(positionA, radiusA, positionB, radiusB) {
  const distance = Math.sqrt(
    (positionA.x - positionB.x) ** 2 + (positionA.y - positionB.y) ** 2
  );

  if (distance < radiusA + radiusB) {
    return true;
  }
  return false;
};

Math.pointInRect = function(point, bound) {
  if (
    point.x >= bound.left && // right of the left edge AND
    point.x <= bound.right && // left of the right edge AND
    point.y >= bound.top && // below the top AND
    point.y <= bound.bottom
  ) {
    return true;
  }
  return false;
};

Math.lerp = function(a, b, r) {
  return a + (b - a) * r;
};

window.getRandomColor = () => {
  var letters = "0123456789ABCDEF";
  var color = "";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

Math.AABB = function(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};
