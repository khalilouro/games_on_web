export default class Platform {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    draw(ctx) {
        ctx.fillStyle = "#8d6e63"; // Brownish color
        ctx.fillRect(this.x, this.y, this.w, this.h);

        // Add some "girder" lines for the Donkey Kong feel
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.w, this.h);

        for (let i = 20; i < this.w; i += 40) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y);
            ctx.lineTo(this.x + i + 20, this.y + this.h);
            ctx.stroke();
        }
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
