export const BonusType = {
    AMMO: "AMMO",
    LIFE: "LIFE",
    FREEZE: "FREEZE",
    SCORE: "SCORE"
};

export default class Bonus {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.w = 15;
        this.h = 15;

        switch (type) {
            case BonusType.AMMO: this.color = "#fff"; break;
            case BonusType.LIFE: this.color = "#f00"; break;
            case BonusType.FREEZE: this.color = "#0ff"; break;
            case BonusType.SCORE: this.color = "#ffd700"; break;
        }
    }

    update(dt) { }

    draw(ctx) {
        ctx.save();
        const time = Date.now() * 0.005;
        const hover = Math.sin(time * 2) * 3;

        ctx.translate(this.x + this.w / 2, this.y + this.h / 2 + hover);

        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.fillStyle = this.color;
        if (this.type === BonusType.LIFE) {
            ctx.beginPath();
            ctx.moveTo(0, 5);
            ctx.bezierCurveTo(-10, -5, -15, 5, 0, 15);
            ctx.bezierCurveTo(15, 5, 10, -5, 0, 5);
            ctx.fill();
        } else if (this.type === BonusType.AMMO) {
            ctx.fillStyle = "#D7B16E";
            ctx.beginPath();
            ctx.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(0,0,0,0.1)";
            ctx.beginPath(); ctx.ellipse(0, 2, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#FFF9C4";
            for (let i = 0; i < 5; i++) {
                const sx = Math.sin(i * 3) * 6;
                const sy = Math.cos(i * 2) * 4 - 2;
                ctx.beginPath(); ctx.ellipse(sx, sy, 1, 2, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
            }
        } else if (this.type === BonusType.SCORE) {
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#B8860B";
            ctx.font = "bold 12px serif";
            ctx.textAlign = "center";
            ctx.fillText("$", 0, 4);
        } else if (this.type === BonusType.FREEZE) {
            ctx.fillStyle = "#E1F5FE";
            ctx.beginPath();
            ctx.moveTo(-7, 8);
            ctx.lineTo(7, 8);
            ctx.lineTo(7, -5);
            ctx.lineTo(3, -10);
            ctx.lineTo(3, -15);
            ctx.lineTo(-3, -15);
            ctx.lineTo(-3, -10);
            ctx.lineTo(-7, -5);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#0288D1";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = "#B3E5FC";
            ctx.beginPath();
            ctx.moveTo(-5, 6);
            ctx.lineTo(5, 6);
            ctx.lineTo(5, 0);
            ctx.lineTo(-5, 0);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "#0288D1";
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                ctx.moveTo(0, 0);
                const angle = (i * Math.PI) / 3;
                ctx.lineTo(Math.cos(angle) * 4, Math.sin(angle) * 4);
            }
            ctx.stroke();
        } else {
            ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        }

        ctx.restore();
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
