import Player from "../entities/Player.js";
import Enemy from "../entities/Enemy.js";
import GuardEnemy from "../entities/GuardEnemy.js";
import Platform from "../entities/Platform.js";
import { aabb } from "../utils/Collision.js";
import Ball from "../entities/Ball.js";
import Trait from "../entities/Trait.js";
import Goal from "../entities/Goal.js";
import Bonus, { BonusType } from "../entities/Bonus.js";
import Levels from "../data/Levels.js";
import MenuState from "./MenuState.js";
import LeaderboardState from "./LeaderboardState.js";
import { ScoreManager } from "../utils/ScoreManager.js";
import { drawBackground } from "../utils/Theme.js";
import AudioManager from "../utils/AudioManager.js";

export default class PlayingState {
    constructor(scene) {
        this.scene = scene;
        this.currentLevel = 0;
        this.score = 0;
        this.worldWidth = 800;
        this.worldHeight = 600;
        this.reset();
    }

    reset() {
        if (this.currentLevel >= Levels.length) {
            this.currentLevel = 0;
        }

        const levelData = Levels[this.currentLevel];
        this.levelData = levelData;

        this.player = new Player(levelData.playerStart.x, levelData.playerStart.y, "yellow");
        this.enemy = new Enemy(levelData.enemy.x, levelData.enemy.y);
        this.enemy.lives = levelData.enemy.lives || 5;

        this.goal = new Goal(levelData.goal.x, levelData.goal.y);

        this.lives = 3;
        this.maxLives = 5;
        this.balls = [];
        this.playerProjectiles = [];
        this.guardEnemies = (levelData.guardEnemies || []).map(g => new GuardEnemy(g.x, g.y, g.range, g.speed));
        this.bonuses = [];
        this.invincibilityTimer = 0;
        this.freezeTimer = 0;
        this.shootKeyReleased = true;
        this.spawnTimer = 0;
        this.victory = false;
        this.bossWasAlive = true;

        this.score = this.score || 0;
        this.highScore = parseInt(localStorage.getItem("highScore")) || 0;
        this.levelStartTime = Date.now();

        const platformColor = levelData.colors.platforms;
        this.platforms = levelData.platforms.map((p, index) => new Platform(p.x, p.y, p.w, p.h, platformColor, index));

        this.stairs = levelData.stairs;
        this.gameOverProcessed = false;
    }

    update(dt, input, canvas) {
        if (this.lives <= 0 || this.victory) {
            if (!this.gameOverProcessed && this.lives <= 0) {
                AudioManager.pauseMusic();
                AudioManager.playSound("Lose", () => {
                    AudioManager.resumeMusic();
                });
                ScoreManager.addScore("Player", this.score);
                this.gameOverProcessed = true;
            }

            if (this.victory) {
                if (!this.transitionTimer) this.transitionTimer = 1.0;
                this.transitionTimer -= dt;

                if (this.transitionTimer <= 0) {
                    if (this.currentLevel < Levels.length - 1) {
                        if (input.isDown("Enter") || input.isDown("Space")) {
                            this.currentLevel++;
                            this.reset();
                        }
                    } else {
                        ScoreManager.addScore("Player", this.score);
                        AudioManager.stopMusic();
                        AudioManager.playSound("win");
                        this.scene.switchState(new LeaderboardState(this.scene, this.score));
                        return;
                    }
                }
            }

            if (input.isDown("KeyR")) {
                this.reset();
            }

            if (input.isDown("Escape") || input.isDown("KeyM")) {
                this.scene.switchState(new MenuState(this.scene));
            }
            return;
        }

        if (input.isDown("KeyM")) {
            this.scene.switchState(new MenuState(this.scene));
            return;
        }

        this.spawnTimer += dt;
        if (this.spawnTimer >= 7) {
            this.spawnTimer = 0;
            this.spawnBonus();
        }

        if (this.freezeTimer > 0) {
            this.freezeTimer -= dt;
            this.enemy.isFrozen = true;
            if (this.freezeTimer <= 0) {
                this.enemy.isFrozen = false;
            }
        }

        if (input.isDown("ArrowRight") || input.isDown("KeyD")) {
            this.player.x += 350 * dt;
            this.player.direction = 1;
        }
        if (input.isDown("ArrowLeft") || input.isDown("KeyA")) {
            this.player.x -= 350 * dt;
            this.player.direction = -1;
        }

        if (input.isDown("KeyF") || input.isDown("Enter")) {
            if (this.shootKeyReleased && this.player.ammo > 0) {
                const startX = this.player.direction === 1 ? this.player.x + this.player.w : this.player.x - 15;
                const startY = this.player.y + this.player.h / 2;
                this.playerProjectiles.push(new Trait(startX, startY, this.player.direction));
                this.player.ammo--;
                this.shootKeyReleased = false;
            }
        } else {
            this.shootKeyReleased = true;
        }

        let onStair = false;
        const playerRect = this.player.getRect();
        for (const s of this.stairs) {
            if (aabb(playerRect, s)) {
                onStair = true;
                if (input.isDown("ArrowUp") || input.isDown("KeyW")) {
                    this.player.y -= 200 * dt;
                    this.player.vy = 0;
                }
                if (input.isDown("ArrowDown") || input.isDown("KeyS")) {
                    this.player.y += 200 * dt;
                    this.player.vy = 0;
                }
                break;
            }
        }

        if (input.isDown("Space") || input.isDown("ArrowUp")) {
            if (this.player.jumpKeyReleased) {
                if (this.player.onGround || this.player.jumpCount < 2) {
                    this.player.vy = this.player.jumpPower;
                    this.player.onGround = false;
                    this.player.jumpCount++;
                    this.player.jumpKeyReleased = false;
                }
            }
        } else {
            this.player.jumpKeyReleased = true;
        }

        const prevY = this.player.y;
        if (!onStair) {
            this.player.update(dt, canvas);
        }

        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.w > this.worldWidth) this.player.x = this.worldWidth - this.player.w;

        if (this.player.y > this.worldHeight + 50) {
            this.takeDamage();
            this.player.x = this.levelData.playerStart.x;
            this.player.y = this.levelData.playerStart.y;
            this.player.vy = 0;
            this.player.onGround = false;
        }

        const isDescending = onStair && (input.isDown("ArrowDown") || input.isDown("KeyS"));

        if (!isDescending) {
            this.player.onGround = false;
            for (const p of this.platforms) {
                const plt = p.getRect();
                const pr = this.player.getRect();

                if (this.player.vy >= 0 && (prevY + this.player.h) <= plt.y && aabb(pr, plt)) {
                    this.player.y = plt.y - this.player.h;
                    this.player.vy = 0;
                    this.player.onGround = true;
                    this.player.jumpCount = 0;
                }

                if (this.player.vy < 0 && prevY >= (plt.y + plt.h) && aabb(pr, plt)) {
                    this.player.y = plt.y + plt.h;
                    this.player.vy = 0;
                }
            }
        }

        this.enemy.update(dt, this.balls);
        this.goal.update(dt);

        if (this.enemy.lives <= 0 && this.bossWasAlive) {
            this.balls = [];
            this.bossWasAlive = false;

            this.addScore(1000);

            const timeTaken = (Date.now() - this.levelStartTime) / 1000;
            const timeBonus = Math.max(0, Math.floor((300 - timeTaken) * 10));
            this.addScore(timeBonus);

            this.goal.x = this.enemy.x + this.enemy.size / 2 - this.goal.w / 2;
            this.goal.y = this.enemy.y + this.enemy.size;
        }

        this.balls.forEach(b => b.update(dt, this.player, this.stairs, this.platforms, this.freezeTimer > 0));
        this.guardEnemies.forEach(g => g.update(dt, this.platforms));
        this.playerProjectiles.forEach(p => p.update(dt));
        this.bonuses.forEach(b => b.update(dt));

        if (this.enemy.lives <= 0 && aabb(this.player.getRect(), this.goal.getRect())) {
            this.victory = true;
        }

        if (this.enemy.lives > 0 && aabb(this.player.getRect(), this.enemy.getRect())) {
            this.lives = 0;
        }

        if (this.invincibilityTimer <= 0) {
            for (let i = this.guardEnemies.length - 1; i >= 0; i--) {
                const g = this.guardEnemies[i];
                if (aabb(this.player.getRect(), g.getRect())) {
                    if (this.player.vy > 0 && this.player.y + this.player.h < g.y + g.h / 2) {
                        this.guardEnemies.splice(i, 1);
                        this.player.vy = -400;
                        this.player.jumpCount = 1;
                        this.addScore(200);
                    } else {
                        this.takeDamage(0.5);
                        break;
                    }
                }
            }
        }

        for (let i = this.bonuses.length - 1; i >= 0; i--) {
            if (aabb(this.player.getRect(), this.bonuses[i].getRect())) {
                this.handleBonus(this.bonuses[i]);
                this.bonuses.splice(i, 1);
            }
        }

        for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
            const proj = this.playerProjectiles[i];

            if (this.enemy.lives > 0 && aabb(proj.getRect(), this.enemy.getRect())) {
                this.enemy.lives--;
                this.playerProjectiles.splice(i, 1);
                continue;
            }

            for (let j = this.balls.length - 1; j >= 0; j--) {
                if (aabb(proj.getRect(), this.balls[j].getRect())) {
                    this.playerProjectiles.splice(i, 1);
                    this.balls.splice(j, 1);
                    this.addScore(50);
                    break;
                }
            }
        }

        if (this.invincibilityTimer > 0) {
            this.invincibilityTimer -= dt;
        } else {
            for (const b of this.balls) {
                if (aabb(this.player.getRect(), b.getRect())) {
                    this.takeDamage(1);
                    this.balls = this.balls.filter(ball => ball !== b);
                    break;
                }
            }
        }
    }

    handleBonus(bonus) {
        switch (bonus.type) {
            case BonusType.AMMO: this.player.ammo += 5; break;
            case BonusType.LIFE: if (this.lives < this.maxLives) this.lives++; break;
            case BonusType.FREEZE: this.freezeTimer = 5; break;
            case BonusType.SCORE: this.addScore(500); break;
        }
    }

    spawnBonus() {
        const types = [BonusType.AMMO, BonusType.LIFE, BonusType.FREEZE, BonusType.SCORE];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const plat = this.platforms[Math.floor(Math.random() * (this.platforms.length - 1)) + 1];
        const pr = plat.getRect();
        const bx = pr.x + Math.random() * (pr.w - 20);
        const by = pr.y - 25;
        this.bonuses.push(new Bonus(bx, by, randomType));
    }

    takeDamage(amount = 1) {
        this.lives -= amount;
        this.invincibilityTimer = 1.5;
        if (this.lives < 0) this.lives = 0;
    }

    addScore(points) {
        this.score += points;
        const hi = parseInt(localStorage.getItem("highScore")) || 0;
        if (this.score > hi) {
            localStorage.setItem("highScore", this.score);
        }
    }

    draw(ctx) {
        const { width, height } = ctx.canvas;
        const levelData = Levels[this.currentLevel];

        const time = Date.now() / 1000;
        drawBackground(ctx, width, height, time, "game");

        const offsetX = Math.max(0, (width - this.worldWidth) / 2);

        ctx.save();
        ctx.translate(offsetX, 0);

        this.platforms.forEach(p => p.draw(ctx));
        this.enemy.draw(ctx);
        if (this.enemy.lives <= 0) {
            this.goal.draw(ctx);
        }

        this.balls.forEach(b => b.draw(ctx));
        this.guardEnemies.forEach(g => g.draw(ctx));
        this.playerProjectiles.forEach(p => p.draw(ctx));
        this.bonuses.forEach(b => b.draw(ctx));

        if (!(this.invincibilityTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0)) {
            this.player.draw(ctx);
        }

        this.stairs.forEach(s => {
            ctx.fillStyle = "#795548";
            ctx.fillRect(s.x, s.y, 4, s.h);
            ctx.fillRect(s.x + s.w - 4, s.y, 4, s.h);
            ctx.fillStyle = "#A1887F";
            for (let y = s.y + 10; y < s.y + s.h; y += 15) {
                ctx.fillRect(s.x, y, s.w, 4);
            }
        });

        ctx.restore();

        ctx.save();
        ctx.translate(offsetX, 0);

        ctx.fillStyle = "#ffeb3b";
        ctx.font = "bold 20px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        ctx.textAlign = "left";
        ctx.shadowBlur = 4;
        ctx.shadowColor = "#000";
        ctx.fillText("LIVES", 20, 35);

        ctx.shadowBlur = 0;
        for (let i = 0; i < this.maxLives; i++) {
            const hx = 90 + i * 25;
            const hy = 25;

            ctx.fillStyle = "rgba(0,0,0,0.3)";
            this.drawHeart(ctx, hx, hy);

            const remaining = this.lives - i;
            if (remaining > 0) {
                ctx.save();
                ctx.fillStyle = "#f44336";
                if (remaining < 1) {
                    ctx.beginPath();
                    ctx.rect(hx - 15, hy - 5, 15, 25);
                    ctx.clip();
                }
                this.drawHeart(ctx, hx, hy);
                ctx.restore();
            }
        }

        ctx.fillStyle = "#4FC3F7";
        ctx.fillText(`INGREDIENTS: ${this.player.ammo}`, 20, 65);

        if (this.enemy.lives > 0) {
            ctx.fillStyle = "#FF5252";
            ctx.fillText("PLANKTON:", 20, 95);
            for (let i = 0; i < this.enemy.lives; i++) {
                ctx.fillRect(140 + i * 15, 80, 10, 15);
            }
        }

        this.stairs.forEach(s => {
            ctx.fillStyle = "#795548";
            ctx.fillRect(s.x, s.y, 4, s.h);
            ctx.fillRect(s.x + s.w - 4, s.y, 4, s.h);
            ctx.fillStyle = "#A1887F";
            for (let y = s.y + 10; y < s.y + s.h; y += 15) {
                ctx.fillRect(s.x, y, s.w, 4);
            }
        });

        ctx.fillStyle = "#ffd700";
        ctx.textAlign = "right";
        ctx.font = "bold 20px monospace";
        ctx.fillText(`SCORE: ${this.score}`, this.worldWidth - 20, 35);
        ctx.fillStyle = "#fff";
        ctx.font = "16px monospace";
        ctx.fillText(`HI: ${this.highScore}`, this.worldWidth - 20, 60);

        ctx.restore();

        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = "bold 24px monospace";
        ctx.fillText(levelData.name || `LEVEL ${this.currentLevel + 1}`, width / 2, 35);

        if (this.victory) {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = "#4CAF50";
            ctx.font = "bold 60px 'Segoe UI'";
            ctx.textAlign = "center";
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#fff";
            ctx.fillText("YOU WIN!", width / 2, height / 2 - 50);

            ctx.shadowBlur = 0;
            ctx.font = "24px monospace";
            ctx.fillStyle = "#fff";
            if (this.currentLevel < Levels.length - 1) {
                ctx.fillText("Press ENTER for Next Level", width / 2, height / 2 + 50);
                ctx.fillText("Press M to Menu", width / 2, height / 2 + 80);
            } else {
                ctx.fillText("ALL LEVELS COMPLETED!", width / 2, height / 2 + 50);
                ctx.fillText("Press R to Play Again or M for Menu", width / 2, height / 2 + 90);
            }
        } else if (this.lives <= 0) {
            ctx.fillStyle = "rgba(0,0,0,0.8)";
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = "#F44336";
            ctx.font = "bold 60px 'Segoe UI'";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", width / 2, height / 2 - 40);

            ctx.font = "bold 28px monospace";
            ctx.fillStyle = "#FFB74D";
            ctx.fillText("PLANKTON STOLE THE RECIPE!", width / 2, height / 2 + 20);

            ctx.font = "24px monospace";
            ctx.fillStyle = "#fff";
            ctx.fillText("Press R to Restart", width / 2, height / 2 + 80);
            ctx.fillText("Press M for Menu", width / 2, height / 2 + 110);
        }
    }

    drawHeart(ctx, x, y) {
        ctx.beginPath();
        ctx.moveTo(x, y + 5);
        ctx.bezierCurveTo(x - 10, y - 5, x - 15, y + 5, x, y + 15);
        ctx.bezierCurveTo(x + 15, y + 5, x + 10, y - 5, x, y + 5);
        ctx.fill();
    }
}
