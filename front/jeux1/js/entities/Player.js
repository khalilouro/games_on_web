export default class Player {
    constructor(x, y, color = "#ff0") {
        this.x = x; this.y = y;
        this.w = 60; this.h = 60;
        this.color = color;
        this.vy = 0;
        this.gravity = 1500;
        this.jumpPower = -350;
        this.onGround = false;
        this.jumpCount = 0;
        this.jumpKeyReleased = true;
        this.direction = 1;
        this.ammo = 5;
        this.image = new Image();
        this.image.src = "assets/images/spongebob.png";
    }

    update(dt, canvas) {
        this.vy += this.gravity * dt;
        this.y += this.vy * dt;
    }

    draw(ctx) {
        if (this.image.complete && this.image.naturalWidth !== 0) {
            ctx.save();
            ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
            ctx.scale(this.direction, 1);

            ctx.drawImage(this.image, -this.w / 2, -this.h / 2, this.w, this.h);
            ctx.restore();
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x + 5, this.y, 10, 10);
            ctx.fillRect(this.x, this.y + 10, 20, 15);
            ctx.fillRect(this.x, this.y + 25, 5, 5);
            ctx.fillRect(this.x + 15, this.y + 25, 5, 5);
        }
    }

    getRect() {
        return {
            x: this.x + 10,
            y: this.y + 5,
            w: this.w - 20,
            h: this.h - 5
        };
    }
}
