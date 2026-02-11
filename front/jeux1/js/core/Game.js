import Ecouteurs from "./Ecouteurs.js";
import GameScene from "../scenes/GameScene.js";

export default class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.input = new Ecouteurs(canvas);
        this.scene = new GameScene(this);
        this.lastTime = 0;
    }

    start() {
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.scene.update(dt);
        this.scene.draw(this.ctx);

        requestAnimationFrame(this.loop.bind(this));
    }
}
