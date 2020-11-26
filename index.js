import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import Cull from "pixi-cull";
import Matter from "matter-js";
import Share from "./scripts/share";
import Game from "./scripts/Game";
import Stage from "./scripts/Stage";
import * as Stats from "stats.js";
import DOMEvents from "./scripts/DOMEvents";

window.PIXI = PIXI;

const stats = new Stats();
stats.showPanel(0);
document.body.append(stats.dom);
const matter = {};
console.log(Matter);
matter.engine = Matter.Engine.create(); // matter.render = Render.create({
//   element: document.body,
//   engine: matter.engine,
//   options: {
//     width: window.innerWidth,
//     height: window.innerHeight
//   }
// });
// matter.render.canvas.style.position = "absolute";
// matter.render.canvas.style.opacity = "0.7";
// Render.run(matter.render);

matter.engine.world.gravity.y = 0; // Engine.run(matter.engine);

Share.set("matter", matter);
Share.set("foodGroup", Matter.Body.nextGroup(true));
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
  new PIXI["BitmapFont"].from("nickname", {
    fontFamily: "spoqa",
    fontSize: 24,
    fill: "white"
  });
  new PIXI["BitmapFont"].from("nickname", {
    fontFamily: "spoqa",
    fontSize: 24,
    fill: "white"
  });
  const stage = new Stage();
  const game = new Game();
  resize(); // matter.render.canvas.style.background =
  //   "0% 0% / contain rgba(15, 15, 19,0.5)";

  app.ticker.add(dt => {
    Matter.Engine.update(matter.engine);
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
