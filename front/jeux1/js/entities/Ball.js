export default class Ball {
    constructor(x, y, speed = 150) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.speed = speed;
        this.vx = 0;
        this.vy = 0;
        this.color = "#f00";
        this.onGround = false;
        this.gravity = 500;
    }

    update(dt, player, stairs, platforms, isFrozen) {
        if (isFrozen) return;

        // Simple AI: Seek player
        // 1. Check if we need to take a stair
        let takingStair = false;
        const ballRect = this.getRect();

        // If player is on a different level (Y significantly different)
        const yDiff = player.y - this.y;

        if (Math.abs(yDiff) > 20) {
            // Find closest stair
            let closestStair = null;
            let minDist = Infinity;

            for (const s of stairs) {
                const dist = Math.abs(s.x + s.w / 2 - this.x);
                if (dist < minDist) {
                    minDist = dist;
                    closestStair = s;
                }
            }

            if (closestStair) {
                // Move towards stair horizontally
                if (this.x < closestStair.x) this.vx = this.speed;
                else if (this.x > closestStair.x + closestStair.w) this.vx = -this.speed;
                else {
                    // We are at the stair
                    this.vx = 0;
                    takingStair = true;
                    // Move vertically towards player
                    if (yDiff > 0) this.y += this.speed * dt;
                    else this.y -= this.speed * dt;
                    this.vy = 0;
                }
            }
        } else {
            // Player is on same level, move towards player X
            if (this.x < player.x) this.vx = this.speed;
            else if (this.x > player.x + player.w) this.vx = -this.speed;
            else this.vx = 0;
        }

        if (!takingStair) {
            this.vy += this.gravity * dt;
            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // Collision with platforms
            this.onGround = false;
            for (const p of platforms) {
                const pr = p.getRect();
                if (this.vy >= 0 && this.y + this.radius <= pr.y + 10 && this.y + this.radius + this.vy * dt >= pr.y &&
                    this.x > pr.x && this.x < pr.x + pr.w) {
                    this.y = pr.y - this.radius;
                    this.vy = 0;
                    this.onGround = true;
                }
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Add a little "eye" to make it look like it's seeking
        ctx.fillStyle = "white";
        ctx.fillRect(this.x - 4, this.y - 4, 3, 3);
        ctx.fillRect(this.x + 1, this.y - 4, 3, 3);
    }

    getRect() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            w: this.radius * 2,
            h: this.radius * 2
        };
    }
}
