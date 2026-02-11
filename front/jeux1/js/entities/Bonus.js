export const BonusType = {
    AMMO: "AMMO",
    LIFE: "LIFE",
    FREEZE: "FREEZE"
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
            case BonusType.LIFE: this.color = "#f00"; break; // Raw red for hearts
            case BonusType.FREEZE: this.color = "#0ff"; break;
        }
    }

    update(dt) { }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);

        // Simple label without fancy fonts
        ctx.fillStyle = "#000";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        let label = this.type[0]; // A, L, or F
        ctx.fillText(label, this.x + this.w / 2, this.y + this.h / 2 + 3);
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
