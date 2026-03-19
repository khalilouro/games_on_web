import { drawBackground } from "../utils/Theme.js";
import { ScoreManager } from "../utils/ScoreManager.js";
import MenuState from "./MenuState.js";

export default class LeaderboardState {
    constructor(scene, recentScore = -1) {
        this.scene = scene;
        this.recentScore = recentScore;
        this.scores = ScoreManager.getScores();
        this.pulse = 0;
    }

    update(dt, input, canvas) {
        this.pulse += dt * 5;

        if (input.isDown("Enter") || input.isDown("Space") || input.isDown("Escape")) {
            this.scene.switchState(new MenuState(this.scene));
        }
    }

    draw(ctx) {
        const { width, height } = ctx.canvas;
        drawBackground(ctx, width, height, this.pulse, "menu");

        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, width, height);

        ctx.textAlign = "center";

        ctx.font = "bold 50px 'Arial Black'";
        ctx.fillStyle = "#FFEB3B";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FFEB3B";
        ctx.fillText("TOP 10 SCORES", width / 2, 70);
        ctx.shadowBlur = 0;

        ctx.font = "bold 24px monospace";
        ctx.fillStyle = "#4FC3F7";
        ctx.textAlign = "left";
        const startX = width / 2 - 200;
        ctx.fillText("RANK", startX, 130);
        ctx.fillText("NAME", startX + 100, 130);
        ctx.fillText("SCORE", startX + 300, 130);

        ctx.strokeStyle = "#FFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, 140);
        ctx.lineTo(startX + 400, 140);
        ctx.stroke();

        ctx.font = "20px monospace";
        this.scores.forEach((s, i) => {
            const y = 175 + i * 35;

            if (this.recentScore === s.score) {
                ctx.fillStyle = "rgba(255, 235, 59, 0.3)";
                ctx.fillRect(startX - 10, y - 20, 420, 30);
                ctx.fillStyle = "#FFEB3B";
            } else {
                ctx.fillStyle = "#FFF";
            }

            ctx.fillText(`${i + 1}.`, startX, y);
            ctx.fillText(s.name, startX + 100, y);
            ctx.textAlign = "right";
            ctx.fillText(s.score.toLocaleString(), startX + 400, y);
            ctx.textAlign = "left";
        });

        ctx.textAlign = "center";
        ctx.fillStyle = "#FFF";
        ctx.font = "18px monospace";
        const scale = 1 + Math.sin(this.pulse * 2) * 0.05;
        ctx.save();
        ctx.translate(width / 2, height - 60);
        ctx.scale(scale, scale);
        ctx.fillText("PRESS ENTER TO MAIN MENU", 0, 0);
        ctx.restore();
    }
}
