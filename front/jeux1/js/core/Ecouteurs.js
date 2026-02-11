export default class Ecouteurs {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};

        // Keyboard listeners
        window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
        window.addEventListener("keyup", (e) => (this.keys[e.code] = false));

        // Resize listener
        window.addEventListener("resize", () => this.resize());
        this.resize(); // Initial call
    }

    isDown(code) {
        return !!this.keys[code];
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}
