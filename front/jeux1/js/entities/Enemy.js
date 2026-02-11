import Ball from "./Ball.js";

export default class Enemy {
    constructor(x, y, color = "brown") {
        this.x = x;
        this.y = y;
        this.size = 100;
        this.baseColor = color;
        this.freezeColor = "#00f"; // Blue when frozen
        this.isFrozen = false;
        this.lives = 3;
        this.throwTimer = 0;
        this.throwInterval = 3.0; // Seconds between throws (Slower as requested)
    }

    update(dt, balls) {
        if (this.isFrozen || this.lives <= 0) return;

        this.throwTimer += dt;
        if (this.throwTimer >= this.throwInterval) {
            this.throwTimer = 0;
            this.throwBall(balls);
        }
    }

    throwBall(balls) {
        const startX = this.x + this.size / 2;
        const startY = this.y + this.size;

        // Rage mode: 3 balls if 1 life left
        if (this.lives === 1) {
            // Straight down
            balls.push(new Ball(startX, startY, 150));
            // Slightly left/right simulated by offset
            balls.push(new Ball(startX - 40, startY, 150));
            balls.push(new Ball(startX + 40, startY, 150));
        } else {
            balls.push(new Ball(startX, startY, 150));
        }
    }

    draw(ctx) {
        if (this.lives <= 0) return;

        ctx.fillStyle = this.isFrozen ? this.freezeColor : this.baseColor;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.size, h: this.size };
    }
}
