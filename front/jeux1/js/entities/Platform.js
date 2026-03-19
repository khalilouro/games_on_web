export default class Platform {
    constructor(x, y, w, h, color = "#8d6e63", type = 0) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
        this.type = type;
    }

    draw(ctx) {
        ctx.save();
        ctx.imageSmoothingEnabled = true;

        ctx.beginPath();
        ctx.rect(this.x, this.y, this.w, this.h);
        ctx.clip();

        if (this.type === 0) {
            const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
            grad.addColorStop(0, "#FFF9C4");
            grad.addColorStop(0.2, "#F9E79F");
            grad.addColorStop(1, "#D4AC0D");
            ctx.fillStyle = grad;
            ctx.fillRect(this.x, this.y, this.w, this.h);

            ctx.strokeStyle = "rgba(183, 149, 11, 0.15)";
            ctx.lineWidth = 1;
            for (let j = 5; j < this.h; j += 15) {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + j);
                for (let i = 0; i <= this.w; i += 20) {
                    ctx.quadraticCurveTo(this.x + i + 10, this.y + j + 5, this.x + i + 20, this.y + j);
                }
                ctx.stroke();
            }

            ctx.fillStyle = "rgba(125, 102, 8, 0.2)";
            const seed = (this.x + this.y) % 1000;
            for (let i = 0; i < this.w; i += 6) {
                for (let j = 0; j < this.h; j += 6) {
                    const hash = Math.sin(seed + i * 0.1 + j * 0.7) * 10000;
                    if ((hash - Math.floor(hash)) > 0.8) {
                        ctx.fillRect(this.x + i, this.y + j, 1.5, 1.5);
                    }
                }
            }

            for (let i = 10; i < this.w; i += 30) {
                const height = 15 + Math.sin(i) * 5;
                ctx.fillStyle = i % 2 === 0 ? "#229954" : "#27AE60";
                ctx.beginPath();
                ctx.moveTo(this.x + i, this.y);
                ctx.quadraticCurveTo(this.x + i - 5, this.y - height / 2, this.x + i, this.y - height);
                ctx.quadraticCurveTo(this.x + i + 5, this.y - height / 2, this.x + i, this.y);
                ctx.fill();
            }

            for (let i = 40; i < this.w; i += 100) {
                this.drawSkyFlower(ctx, this.x + i, this.y + this.h / 2, 12, "rgba(255, 105, 180, 0.5)");
            }

        } else if (this.type === 1) {
            ctx.fillStyle = "#4A235A";
            ctx.fillRect(this.x, this.y, this.w, this.h);

            ctx.strokeStyle = "rgba(0,0,0,0.3)";
            ctx.lineWidth = 1;
            for (let i = 0; i < this.w; i += 40) {
                for (let j = 0; j < this.h; j += 30) {
                    ctx.beginPath();
                    ctx.moveTo(this.x + i, this.y + j);
                    ctx.lineTo(this.x + i + 20, this.y + j + 10);
                    ctx.lineTo(this.x + i + 5, this.y + j + 25);
                    ctx.closePath();
                    ctx.fillStyle = `rgba(142, 68, 173, ${0.3 + Math.random() * 0.4})`;
                    ctx.fill();
                    ctx.stroke();
                }
            }

            ctx.fillStyle = "#1D8348";
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            for (let i = 0; i <= this.w; i += 8) {
                const dy = Math.sin(i * 0.5) * 4 + 6;
                ctx.lineTo(this.x + i, this.y + dy);
            }
            ctx.lineTo(this.x + this.w, this.y);
            ctx.fill();

            ctx.shadowBlur = 8;
            ctx.shadowColor = "#58D68D";
            ctx.fillStyle = "#ABEBC6";
            for (let i = 15; i < this.w; i += 50) {
                ctx.beginPath();
                ctx.arc(this.x + i, this.y + this.h - 10, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;

            ctx.strokeStyle = "#145A32";
            ctx.lineWidth = 2;
            for (let i = 20; i < this.w; i += 60) {
                ctx.beginPath();
                ctx.moveTo(this.x + i, this.y + this.h);
                ctx.bezierCurveTo(this.x + i - 10, this.y + this.h + 10, this.x + i + 10, this.y + this.h + 20, this.x + i, this.y + this.h + 35);
                ctx.stroke();
            }

        } else {
            const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.w, this.y + this.h);
            grad.addColorStop(0, "#2C3E50");
            grad.addColorStop(0.5, "#95A5A6");
            grad.addColorStop(1, "#2C3E50");
            ctx.fillStyle = grad;
            ctx.fillRect(this.x, this.y, this.w, this.h);

            ctx.fillStyle = "rgba(255,255,255,0.15)";
            ctx.beginPath();
            ctx.moveTo(this.x + this.w * 0.2, this.y);
            ctx.lineTo(this.x + this.w * 0.4, this.y);
            ctx.lineTo(this.x + this.w * 0.1, this.y + this.h);
            ctx.lineTo(this.x - this.w * 0.1, this.y + this.h);
            ctx.fill();

            for (let i = 10; i < this.w; i += 40) {
                this.drawBolt(ctx, this.x + i, this.y + 8);
                this.drawBolt(ctx, this.x + i, this.y + this.h - 8);
            }

            ctx.fillStyle = "#F1C40F";
            for (let i = -20; i < this.w; i += 40) {
                ctx.beginPath();
                ctx.moveTo(this.x + i, this.y);
                ctx.lineTo(this.x + i + 20, this.y);
                ctx.lineTo(this.x + i, this.y + 12);
                ctx.lineTo(this.x + i - 20, this.y + 12);
                ctx.fill();
            }
            ctx.strokeStyle = "rgba(0,0,0,0.4)";
            ctx.lineWidth = 1;
            for (let i = 0; i < this.w; i += 25) {
                ctx.beginPath();
                ctx.moveTo(this.x + i, this.y + 2);
                ctx.lineTo(this.x + i + 5, this.y + 8);
                ctx.stroke();
            }

            ctx.fillStyle = "rgba(231, 76, 60, 0.4)";
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                ctx.fillRect(this.x, this.y, 4, this.h);
                ctx.fillRect(this.x + this.w - 4, this.y, 4, this.h);
            }
        }

        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 1, this.y + 1, this.w - 2, this.h - 2);
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.strokeRect(this.x, this.y, this.w, this.h);

        ctx.restore();
    }

    drawSkyFlower(ctx, x, y, radius, color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.translate(x, y);
        for (let i = 0; i < 5; i++) {
            ctx.rotate((Math.PI * 2) / 5);
            ctx.beginPath();
            ctx.ellipse(radius, 0, radius, radius * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawBolt(ctx, x, y) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.arc(x + 1, y + 1, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#BDC3C7";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.arc(x - 1, y - 1, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
