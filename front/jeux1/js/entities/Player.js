export default class Player {
    constructor(x, y, color = "#ff0") {
        this.x = x; this.y = y;
        this.w = 20; this.h = 30; // Smaller size
        this.color = color;
        this.vy = 0;
        this.gravity = 1500;
        this.jumpPower = -350; // Smaller jump
        this.onGround = false;
        this.jumpCount = 0;
        this.jumpKeyReleased = true;
        this.direction = 1; // 1 for right, -1 for left
        this.ammo = 3;
    }

    update(dt, canvas) {
        this.vy += this.gravity * dt;
        this.y += this.vy * dt;

        const ground = canvas.height - this.h - 50;
        if (this.y >= ground) {
            this.y = ground;
            this.vy = 0;
            this.onGround = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        // Head
        ctx.fillRect(this.x + 5, this.y, 10, 10);
        // Body
        ctx.fillRect(this.x, this.y + 10, 20, 15);
        // Legs
        ctx.fillRect(this.x, this.y + 25, 5, 5);
        ctx.fillRect(this.x + 15, this.y + 25, 5, 5);
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
