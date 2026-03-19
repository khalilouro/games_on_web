import { aabb } from "../utils/Collision.js";

export default class GuardEnemy {
    constructor(x, y, range = 100, speed = 100) {
        this.x = x;
        this.y = y;
        this.w = 40;
        this.h = 40;
        this.speed = speed;
        this.direction = 1;
        this.startX = x;
        this.range = range;
        this.vy = 0;
        this.gravity = 500;
        this.onGround = false;
    }

    update(dt, platforms) {
        const nextX = this.x + this.speed * this.direction * dt;

        if (this.range > 0) {
            if (Math.abs(nextX - this.startX) > this.range) {
                this.direction *= -1;
            }
        }

        if (this.onGround) {
            let platformBeneath = false;
            const checkX = this.direction > 0 ? nextX + this.w : nextX;
            const checkY = this.y + this.h + 5;

            for (const p of platforms) {
                const pr = p.getRect();
                if (checkX >= pr.x && checkX <= pr.x + pr.w &&
                    checkY >= pr.y && checkY <= pr.y + pr.h) {
                    platformBeneath = true;
                    break;
                }
            }

            if (!platformBeneath) {
                this.direction *= -1;
            }
        }

        this.x += this.speed * this.direction * dt;

        this.vy += this.gravity * dt;
        this.y += this.vy * dt;

        this.onGround = false;
        for (const p of platforms) {
            const pr = p.getRect();
            const gr = this.getRect();

            if (this.vy >= 0 &&
                this.y + this.h - this.vy * dt <= pr.y &&
                aabb(gr, pr)) {
                this.y = pr.y - this.h;
                this.vy = 0;
                this.onGround = true;
                break;
            }
        }

        if (this.x < 0 || this.x + this.w > 800) {
            this.direction *= -1;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

        const wobble = Math.sin(Date.now() * 0.01) * 3;
        ctx.rotate(wobble * 0.05);

        ctx.fillStyle = "#9C27B0";
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);

        ctx.fillStyle = "white";
        ctx.fillRect(-15, -10, 8, 8);
        ctx.fillRect(5, -10, 8, 8);
        ctx.fillStyle = "black";
        ctx.fillRect(this.direction > 0 ? -11 : -14, -8, 4, 4);
        ctx.fillRect(this.direction > 0 ? 9 : 6, -8, 4, 4);

        ctx.strokeStyle = "#7B1FA2";
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            const lx = -15 + i * 15;
            ctx.beginPath();
            ctx.moveTo(lx, this.h / 2);
            ctx.lineTo(lx + Math.sin(Date.now() * 0.01 + i) * 5, this.h / 2 + 10);
            ctx.stroke();
        }

        ctx.restore();
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
