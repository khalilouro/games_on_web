export default class Trait {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.w = 15;
        this.h = 4;
        this.speed = 600;
        this.direction = direction; // 1 for right, -1 for left
        this.color = "#fff";
    }

    update(dt) {
        this.x += this.direction * this.speed * dt;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
