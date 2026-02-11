import Player from "../entities/Player.js";
import Enemy from "../entities/Enemy.js";
import Platform from "../entities/Platform.js";
import { aabb } from "../utils/Collision.js";
import Ball from "../entities/Ball.js";
import Trait from "../entities/Trait.js";
import Goal from "../entities/Goal.js";
import Bonus, { BonusType } from "../entities/Bonus.js";

export default class PlayingState {
    constructor() {
        this.reset();
    }

    reset() {
        this.player = new Player(390, 520, "yellow");
        this.enemy = new Enemy(50, 50); // Boss at top far left
        this.goal = new Goal(730, 110); // Goal at top far right
        this.lives = 3;
        this.maxLives = 5;
        this.balls = [];
        this.playerProjectiles = [];
        this.bonuses = [];
        this.invincibilityTimer = 0;
        this.freezeTimer = 0;
        this.shootKeyReleased = true;
        this.spawnTimer = 0;
        this.victory = false;
        this.bossWasAlive = true; // Tracking boss state

        this.platforms = [
            new Platform(0, 550, 800, 50),
            new Platform(100, 450, 600, 20),
            new Platform(100, 350, 600, 20),
            new Platform(100, 250, 600, 20),
            new Platform(0, 150, 800, 20)
        ];

        this.stairs = [
            { x: 120, y: 450, w: 40, h: 100 },
            { x: 640, y: 350, w: 40, h: 100 },
            { x: 120, y: 250, w: 40, h: 100 },
            { x: 640, y: 150, w: 40, h: 100 }
        ];
    }

    update(dt, input, canvas) {
        if (this.lives <= 0 || this.victory) {
            if (input.isDown("KeyR")) {
                this.reset();
            }
            return;
        }

        // Spawning Logic
        this.spawnTimer += dt;
        if (this.spawnTimer >= 7) {
            this.spawnTimer = 0;
            this.spawnBonus();
        }

        // Freeze Timer logic
        if (this.freezeTimer > 0) {
            this.freezeTimer -= dt;
            this.enemy.isFrozen = true;
            if (this.freezeTimer <= 0) {
                this.enemy.isFrozen = false;
            }
        }

        // Horizontal Movement
        if (input.isDown("ArrowRight") || input.isDown("KeyD")) {
            this.player.x += 350 * dt;
            this.player.direction = 1;
        }
        if (input.isDown("ArrowLeft") || input.isDown("KeyA")) {
            this.player.x -= 350 * dt;
            this.player.direction = -1;
        }

        // Shooting
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

        // Stairs
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

        // Jumping
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
        if (this.player.x + this.player.w > canvas.width) this.player.x = canvas.width - this.player.w;

        // Platform collisions (Skip if on stair and pressing down)
        const isDescending = onStair && (input.isDown("ArrowDown") || input.isDown("KeyS"));

        if (!isDescending) {
            this.player.onGround = false;
            for (const p of this.platforms) {
                const plt = p.getRect();
                if (this.player.vy >= 0 && (prevY + this.player.h) <= plt.y && aabb(this.player.getRect(), plt)) {
                    this.player.y = plt.y - this.player.h;
                    this.player.vy = 0;
                    this.player.onGround = true;
                    this.player.jumpCount = 0;
                }
            }
        }

        // Entity Updates
        this.enemy.update(dt, this.balls);
        this.goal.update(dt);

        // Handle Boss Death Event
        if (this.enemy.lives <= 0 && this.bossWasAlive) {
            this.balls = []; // Clear all red balls when boss dies
            this.bossWasAlive = false;
        }

        this.balls.forEach(b => b.update(dt, this.player, this.stairs, this.platforms, this.freezeTimer > 0));
        this.playerProjectiles.forEach(p => p.update(dt));
        this.bonuses.forEach(b => b.update(dt));

        // Goal Collision (Only if boss is dead)
        if (this.enemy.lives <= 0 && aabb(this.player.getRect(), this.goal.getRect())) {
            this.victory = true;
        }

        // Collision: Player vs Enemy (INSTANT DEATH)
        if (this.enemy.lives > 0 && aabb(this.player.getRect(), this.enemy.getRect())) {
            this.lives = 0; // Lose all lives on contact
        }

        // Bonus Collection
        for (let i = this.bonuses.length - 1; i >= 0; i--) {
            if (aabb(this.player.getRect(), this.bonuses[i].getRect())) {
                this.handleBonus(this.bonuses[i]);
                this.bonuses.splice(i, 1);
            }
        }

        // Trait vs Ball Collisions
        for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
            const proj = this.playerProjectiles[i];

            // Trait vs Enemy
            if (this.enemy.lives > 0 && aabb(proj.getRect(), this.enemy.getRect())) {
                this.enemy.lives--;
                this.playerProjectiles.splice(i, 1);
                continue;
            }

            // Trait vs Ball
            for (let j = this.balls.length - 1; j >= 0; j--) {
                if (aabb(proj.getRect(), this.balls[j].getRect())) {
                    this.playerProjectiles.splice(i, 1);
                    this.balls.splice(j, 1);
                    break;
                }
            }
        }

        // Ball vs Player Collisions
        if (this.invincibilityTimer > 0) {
            this.invincibilityTimer -= dt;
        } else {
            for (const b of this.balls) {
                if (aabb(this.player.getRect(), b.getRect())) {
                    this.takeDamage();
                    this.balls = this.balls.filter(ball => ball !== b);
                    break;
                }
            }
        }
    }

    handleBonus(bonus) {
        switch (bonus.type) {
            case BonusType.AMMO: this.player.ammo += 3; break;
            case BonusType.LIFE: if (this.lives < this.maxLives) this.lives++; break;
            case BonusType.FREEZE: this.freezeTimer = 5; break;
        }
    }

    spawnBonus() {
        const types = [BonusType.AMMO, BonusType.LIFE, BonusType.FREEZE];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const plat = this.platforms[Math.floor(Math.random() * (this.platforms.length - 1)) + 1];
        const pr = plat.getRect();
        const bx = pr.x + Math.random() * (pr.w - 20);
        const by = pr.y - 25;
        this.bonuses.push(new Bonus(bx, by, randomType));
    }

    takeDamage() {
        this.lives--;
        this.invincibilityTimer = 1.5;
    }

    draw(ctx) {
        const { width, height } = ctx.canvas;
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, width, height);

        this.platforms.forEach(p => p.draw(ctx));
        this.enemy.draw(ctx);
        // Only show Goal if boss is dead
        if (this.enemy.lives <= 0) {
            this.goal.draw(ctx);
        }
        this.balls.forEach(b => b.draw(ctx));
        this.playerProjectiles.forEach(p => p.draw(ctx));
        this.bonuses.forEach(b => b.draw(ctx));

        if (!(this.invincibilityTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0)) {
            this.player.draw(ctx);
        }

        // HUD - Red square hearts
        ctx.fillStyle = "#fff";
        ctx.font = "16px monospace";
        ctx.textAlign = "left";
        ctx.fillText("LIVES:", 20, 35);
        for (let i = 0; i < this.lives; i++) {
            ctx.fillStyle = "#f00";
            ctx.fillRect(80 + i * 20, 20, 15, 15);
        }

        // Stairs (Simple grey blocks)
        ctx.fillStyle = "#666";
        this.stairs.forEach(s => {
            ctx.fillRect(s.x, s.y, s.w, s.h);
        });

        ctx.fillStyle = "#fff";
        ctx.fillText(`AMMO: ${this.player.ammo}`, 20, 65);

        if (this.enemy.lives > 0) {
            ctx.fillStyle = "#fff";
            ctx.fillText("BOSS:", 20, 95);
            for (let i = 0; i < this.enemy.lives; i++) {
                ctx.fillStyle = "#f00";
                ctx.fillRect(80 + i * 20, 80, 15, 15);
            }
        }

        if (this.victory) {
            ctx.fillStyle = "rgba(0,100,0,0.8)";
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = "#0f0";
            ctx.font = "bold 50px monospace";
            ctx.textAlign = "center";
            ctx.fillText("YOU WIN!", width / 2, height / 2);
            ctx.font = "20px monospace";
            ctx.fillStyle = "#fff";
            ctx.fillText("Press R to play again", width / 2, height / 2 + 50);
        } else if (this.lives <= 0) {
            ctx.fillStyle = "rgba(100,0,0,0.8)";
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = "#f00";
            ctx.font = "bold 50px monospace";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", width / 2, height / 2);
            ctx.font = "20px monospace";
            ctx.fillStyle = "#fff";
            ctx.fillText("Press R to restart", width / 2, height / 2 + 50);
        }
    }
}
