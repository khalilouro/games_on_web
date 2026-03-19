export default class Ecouteurs {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};

        window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
        window.addEventListener("keyup", (e) => (this.keys[e.code] = false));

        window.addEventListener("resize", () => this.resize());
        this.resize();
    }

    isDown(code) {
        return !!this.keys[code];
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}
