export default class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.color = "#0f0"; // Green
    }

    update(dt) {
        // No pulse requested
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.size, h: this.size };
    }
}
