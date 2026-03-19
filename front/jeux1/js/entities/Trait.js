export default class Trait {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.w = 30;
        this.h = 20;
        this.speed = 600;
        this.direction = direction;
        this.type = Math.floor(Math.random() * 5);
    }

    update(dt) {
        this.x += this.direction * this.speed * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.rotate(Date.now() * 0.01 * this.direction);

        switch (this.type) {
            case 0:
                ctx.fillStyle = "#D7B16E";
                ctx.beginPath(); ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "rgba(0,0,0,0.1)";
                ctx.beginPath(); ctx.ellipse(0, 4, 13, 8, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#FFF9C4";
                for (let i = 0; i < 6; i++) {
                    const sx = Math.sin(i * 2) * 8;
                    const sy = Math.cos(i * 3) * 5 - 2;
                    ctx.beginPath(); ctx.ellipse(sx, sy, 1.5, 2.5, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
                }
                break;
            case 1:
                ctx.fillStyle = "#5D4037";
                ctx.beginPath(); ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "#4E342E";
                ctx.lineWidth = 2;
                for (let i = -10; i <= 10; i += 5) {
                    ctx.beginPath(); ctx.moveTo(i, -4); ctx.lineTo(i + 2, 4); ctx.stroke();
                }
                break;
            case 2:
                ctx.fillStyle = "#8BC34A";
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const r = 10 + Math.sin(i * 4) * 3;
                    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
                }
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = "#7CB342";
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -10); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, 5); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, 5); ctx.stroke();
                break;
            case 3:
                ctx.fillStyle = "#F44336";
                ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#FF8A80";
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    ctx.beginPath(); ctx.arc(Math.cos(angle) * 6, Math.sin(angle) * 6, 2.5, 0, Math.PI * 2); ctx.fill();
                }
                break;
            case 4:
                ctx.fillStyle = "#FFC107";
                ctx.fillRect(-14, -11, 28, 22);
                ctx.fillStyle = "#FFA000";
                ctx.beginPath(); ctx.arc(-6, -4, 3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(7, 5, 2.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(-2, 6, 2, 0, Math.PI * 2); ctx.fill();
                break;
        }
        ctx.restore();
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
