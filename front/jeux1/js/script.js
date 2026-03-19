/**
 * PIXEL CHASE - SpongeBob Edition
 * Single file version to avoid ES Module import issues on some hosts.
 */

// ==========================================
// 1. UTILS & CONSTANTS
// ==========================================

function aabb(r1, r2) {
    return r1.x < r2.x + r2.w &&
        r1.x + r1.w > r2.x &&
        r1.y < r2.y + r2.h &&
        r1.y + r1.h > r2.y;
}

const ScoreManager = {
    SAVE_KEY: "pixel_chase_scores",

    getScores() {
        const raw = localStorage.getItem(this.SAVE_KEY);
        if (!raw) return [];
        try {
            return JSON.parse(raw).sort((a, b) => b.score - a.score);
        } catch (e) {
            console.error("Error parsing scores", e);
            return [];
        }
    },

    addScore(name, score) {
        let scores = this.getScores();
        scores.push({
            name: name || "Anonymous",
            score: score,
            date: Date.now()
        });

        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 10);

        localStorage.setItem(this.SAVE_KEY, JSON.stringify(scores));

        const currentHi = parseInt(localStorage.getItem("highScore")) || 0;
        if (score > currentHi) {
            localStorage.setItem("highScore", score);
        }

        return scores;
    },

    isHighScore(score) {
        if (score <= 0) return false;
        const scores = this.getScores();
        if (scores.length < 10) return true;
        return score > scores[scores.length - 1].score;
    }
};

// ==========================================
// 2. THEME & GRAPHICS
// ==========================================

const themeImages = {
    menu: new Image(),
    game: new Image()
};

themeImages.menu.src = "assets/images/background1.png";
themeImages.game.src = "assets/images/background2.png";

let useImages = true;

function toggleTheme() {
    useImages = !useImages;
}

function drawFlower(ctx, x, y, size, color, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = color;

    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(0, -size / 2, size / 3, size / 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.rotate((Math.PI * 2) / 5);
    }

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(0, 0, size / 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawBackground(ctx, width, height, time = 0, type = "menu") {
    const img = type === "menu" ? themeImages.menu : themeImages.game;

    if (useImages && img.complete && img.naturalWidth !== 0) {
        ctx.drawImage(img, 0, 0, width, height);
    } else {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, "#4fc3f7");
        grad.addColorStop(1, "#0288d1");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        const flowers = [
            { x: width * 0.1, y: height * 0.2, size: 60, color: "rgba(255, 255, 255, 0.4)", rot: 0.1 },
            { x: width * 0.8, y: height * 0.15, size: 80, color: "rgba(187, 222, 251, 0.4)", rot: -0.2 },
            { x: width * 0.4, y: height * 0.6, size: 100, color: "rgba(76, 175, 80, 0.15)", rot: 0.05 },
            { x: width * 0.9, y: height * 0.8, size: 70, color: "rgba(233, 30, 99, 0.15)", rot: 0.3 },
            { x: width * 0.2, y: height * 0.9, size: 50, color: "rgba(255, 235, 59, 0.15)", rot: -1 }
        ];

        ctx.save();
        flowers.forEach(f => {
            drawFlower(ctx, f.x, f.y, f.size, f.color, time * f.rot);
        });
        ctx.restore();
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    for (let i = 0; i < 10; i++) {
        const speed = (i + 1) * 20;
        const yOffset = (time * speed) % (height + 50);
        const y = height + 25 - yOffset;
        const x = (width / 10) * i + Math.sin(time + i) * 20;
        const r = 5 + (i % 3) * 3;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ==========================================
// 3. AUDIO MANAGER
// ==========================================

class AudioManagerClass {
    constructor() {
        this.currentMusic = null;
        this.musicVolume = 0.5;
        this.musicKey = null;
        this.playlist = ["sponge1", "sponge2", "sponge3"];
        this.currentIndex = 0;
        this.isPlaylistPlaying = false;
        this.maxDuration = 60;
    }

    startPlaylist() {
        if (this.isPlaylistPlaying) {
            this.resumeMusic();
            return;
        }
        this.isPlaylistPlaying = true;
        this.playCurrentInPlaylist();
    }

    playCurrentInPlaylist() {
        if (!this.isPlaylistPlaying) return;

        const key = this.playlist[this.currentIndex];
        this.playMusic(key, false);

        if (this.currentMusic) {
            this.currentMusic.onended = () => this.nextTrack();

            this.currentMusic.ontimeupdate = () => {
                if (this.currentMusic && this.currentMusic.currentTime >= this.maxDuration) {
                    this.nextTrack();
                }
            };
        }
    }

    nextTrack() {
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        this.playCurrentInPlaylist();
    }

    playMusic(key, loop = true) {
        if (this.musicKey === key && this.currentMusic && !this.currentMusic.paused) return;

        this.stopMusic();

        const path = `assets/musique/${key}.mp3`;
        this.currentMusic = new Audio(path);
        this.currentMusic.loop = loop;
        this.currentMusic.volume = this.musicVolume;
        this.musicKey = key;

        this.currentMusic.play().catch(e => {
            const retry = () => {
                if (this.currentMusic) this.currentMusic.play();
                window.removeEventListener("click", retry);
                window.removeEventListener("keydown", retry);
            };
            window.addEventListener("click", retry);
            window.addEventListener("keydown", retry);
        });
    }

    pauseMusic() {
        if (this.currentMusic && !this.currentMusic.paused) {
            this.currentMusic.pause();
        }
    }

    resumeMusic() {
        if (this.currentMusic && this.currentMusic.paused) {
            this.currentMusic.play().catch(e => console.log("Resume blocked:", e));
        } else if (!this.currentMusic && this.isPlaylistPlaying) {
            this.playCurrentInPlaylist();
        }
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.onended = null;
            this.currentMusic.ontimeupdate = null;
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
            this.musicKey = null;
        }
    }

    playSound(key, onEnded = null) {
        const path = `assets/musique/${key}.mp3`;
        const sound = new Audio(path);
        sound.volume = 0.7;
        if (onEnded) {
            sound.onended = onEnded;
        }
        sound.play().catch(e => {
            console.log("Sound effect blocked:", e);
            if (onEnded) onEnded();
        });
    }
}

const AudioManager = new AudioManagerClass();

// ==========================================
// 4. DATA & LEVELS
// ==========================================

const BonusType = {
    AMMO: "AMMO",
    LIFE: "LIFE",
    FREEZE: "FREEZE",
    SCORE: "SCORE"
};

const Levels = [
    {
        name: "Bikini Bottom Beach",
        playerStart: { x: 400, y: 490 },
        enemy: { x: 350, y: 50, lives: 3 },
        goal: { x: 375, y: 70 },
        colors: { background: "#4fc3f7", platforms: "#F4D03F", text: "#fff" },
        platforms: [
            { x: 0, y: 550, w: 800, h: 50, type: 0 },
            { x: 50, y: 450, w: 250, h: 30, type: 0 },
            { x: 500, y: 450, w: 250, h: 30, type: 0 },
            { x: 250, y: 350, w: 300, h: 30, type: 0 },
            { x: 50, y: 250, w: 250, h: 30, type: 0 },
            { x: 500, y: 250, w: 250, h: 30, type: 0 },
            { x: 200, y: 150, w: 400, h: 30, type: 0 }
        ],
        stairs: [
            { x: 100, y: 440, w: 30, h: 120 }, { x: 670, y: 440, w: 30, h: 120 },
            { x: 260, y: 340, w: 30, h: 120 }, { x: 510, y: 340, w: 30, h: 120 },
            { x: 260, y: 240, w: 30, h: 120 }, { x: 510, y: 240, w: 30, h: 120 },
            { x: 210, y: 140, w: 30, h: 120 }, { x: 560, y: 140, w: 30, h: 120 }
        ],
        guardEnemies: [
            { x: 200, y: 410, range: 100, speed: 80 },
            { x: 400, y: 210, range: 150, speed: 100 }
        ]
    },
    {
        name: "The Kelp Forest",
        playerStart: { x: 50, y: 500 },
        enemy: { x: 550, y: 0, lives: 5 },
        goal: { x: 650, y: 20 },
        colors: { background: "#1B5E20", platforms: "#8E44AD", text: "#C8E6C9" },
        platforms: [
            { x: 0, y: 580, w: 250, h: 50, type: 1 }, { x: 550, y: 580, w: 250, h: 50, type: 1 },
            { x: 50, y: 480, w: 200, h: 50, type: 1 }, { x: 350, y: 430, w: 200, h: 50, type: 1 },
            { x: 500, y: 330, w: 250, h: 50, type: 1 }, { x: 150, y: 300, w: 250, h: 50, type: 1 },
            { x: 50, y: 200, w: 700, h: 50, type: 1 }, { x: 300, y: 100, w: 400, h: 50, type: 1 }
        ],
        stairs: [
            { x: 100, y: 470, w: 30, h: 120 }, { x: 450, y: 420, w: 30, h: 170 },
            { x: 600, y: 320, w: 30, h: 120 }, { x: 200, y: 290, w: 30, h: 150 },
            { x: 100, y: 190, w: 30, h: 120 }, { x: 400, y: 90, w: 30, h: 120 }
        ],
        guardEnemies: [
            { x: 400, y: 390, range: 100, speed: 120 },
            { x: 200, y: 260, range: 80, speed: 90 },
            { x: 500, y: 60, range: 0, speed: 100 }
        ]
    },
    {
        name: "Plankton's Lair",
        playerStart: { x: 390, y: 510 },
        enemy: { x: 375, y: 80, lives: 8 },
        goal: { x: 50, y: 20 },
        colors: { background: "#212121", platforms: "#546E7A", text: "#FF5252" },
        platforms: [
            { x: 0, y: 580, w: 800, h: 30, type: 2 }, { x: 50, y: 480, w: 200, h: 30, type: 2 },
            { x: 550, y: 480, w: 200, h: 30, type: 2 }, { x: 200, y: 380, w: 400, h: 30, type: 2 },
            { x: 0, y: 280, w: 300, h: 30, type: 2 }, { x: 500, y: 280, w: 300, h: 30, type: 2 },
            { x: 100, y: 180, w: 600, h: 30, type: 2 }, { x: 0, y: 100, w: 200, h: 30, type: 2 },
            { x: 600, y: 100, w: 200, h: 30, type: 2 }
        ],
        stairs: [
            { x: 100, y: 470, w: 30, h: 120 }, { x: 670, y: 470, w: 30, h: 120 },
            { x: 385, y: 370, w: 30, h: 220 }, { x: 250, y: 270, w: 30, h: 120 },
            { x: 520, y: 270, w: 30, h: 120 }, { x: 150, y: 170, w: 30, h: 120 },
            { x: 620, y: 170, w: 30, h: 120 }, { x: 100, y: 90, w: 30, h: 100 }
        ],
        guardEnemies: [
            { x: 350, y: 340, range: 50, speed: 150 },
            { x: 50, y: 240, range: 100, speed: 130 },
            { x: 650, y: 240, range: 100, speed: 130 }
        ]
    }
];

// ==========================================
// 5. ENTITIES
// ==========================================

class Platform {
    constructor(x, y, w, h, color = "#8d6e63", type = 0) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.color = color; this.type = type;
    }
    draw(ctx) {
        ctx.save();
        ctx.beginPath(); ctx.rect(this.x, this.y, this.w, this.h); ctx.clip();
        if (this.type === 0) {
            const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
            grad.addColorStop(0, "#FFF9C4"); grad.addColorStop(0.2, "#F9E79F"); grad.addColorStop(1, "#D4AC0D");
            ctx.fillStyle = grad; ctx.fillRect(this.x, this.y, this.w, this.h);
        } else if (this.type === 1) {
            ctx.fillStyle = "#4A235A"; ctx.fillRect(this.x, this.y, this.w, this.h);
        } else {
            ctx.fillStyle = "#2C3E50"; ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        ctx.restore();
    }
    getRect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}

class Trait {
    constructor(x, y, direction) {
        this.x = x; this.y = y; this.w = 30; this.h = 20;
        this.speed = 600; this.direction = direction;
        this.type = Math.floor(Math.random() * 5);
    }
    update(dt) { this.x += this.direction * this.speed * dt; }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.rotate(Date.now() * 0.01 * this.direction);
        ctx.fillStyle = "#FFC107";
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }
    getRect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}

class Ball {
    constructor(x, y, speed = 150) {
        this.x = x; this.y = y; this.radius = 10;
        this.speed = speed; this.vx = 0; this.vy = 0;
        this.color = "#f00"; this.gravity = 500;
    }
    update(dt, player, stairs, platforms, isFrozen) {
        if (isFrozen) return;
        this.vy += this.gravity * dt;
        this.y += this.vy * dt;
        this.x += (player.x > this.x ? 1 : -1) * this.speed * dt;
        platforms.forEach(p => {
            const pr = p.getRect();
            if (this.vy >= 0 && this.y + this.radius >= pr.y && this.y < pr.y && this.x > pr.x && this.x < pr.x + pr.w) {
                this.y = pr.y - this.radius; this.vy = 0;
            }
        });
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
    }
    getRect() { return { x: this.x - this.radius, y: this.y - this.radius, w: this.radius * 2, h: this.radius * 2 }; }
}

class Player {
    constructor(x, y, color = "#ff0") {
        this.x = x; this.y = y; this.w = 60; this.h = 60;
        this.color = color; this.vy = 0; this.gravity = 1500;
        this.jumpPower = -350; this.onGround = false; this.jumpCount = 0;
        this.direction = 1; this.ammo = 5;
        this.image = new Image(); this.image.src = "assets/images/spongebob.png";
    }
    update(dt) { this.vy += this.gravity * dt; this.y += this.vy * dt; }
    draw(ctx) {
        if (this.image.complete) {
            ctx.save(); ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
            ctx.scale(this.direction, 1);
            ctx.drawImage(this.image, -this.w / 2, -this.h / 2, this.w, this.h);
            ctx.restore();
        } else {
            ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.w, this.h);
        }
    }
    getRect() { return { x: this.x + 10, y: this.y + 5, w: this.w - 20, h: this.h - 5 }; }
}

class Enemy {
    constructor(x, y, color = "brown") {
        this.x = x; this.y = y; this.size = 100;
        this.isFrozen = false; this.lives = 3;
        this.throwTimer = 0; this.throwInterval = 8.0;
    }
    update(dt, balls) {
        if (this.isFrozen || this.lives <= 0) return;
        this.throwTimer += dt;
        if (this.throwTimer >= this.throwInterval) {
            this.throwTimer = 0;
            balls.push(new Ball(this.x + this.size / 2, this.y + this.size));
        }
    }
    draw(ctx) {
        if (this.lives <= 0) return;
        ctx.fillStyle = this.isFrozen ? "blue" : "green";
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
    getRect() { return { x: this.x, y: this.y, w: this.size, h: this.size }; }
}

class GuardEnemy {
    constructor(x, y, range = 100, speed = 100) {
        this.x = x; this.y = y; this.w = 40; this.h = 40;
        this.speed = speed; this.direction = 1; this.startX = x; this.range = range;
        this.vy = 0; this.gravity = 500;
    }
    update(dt, platforms) {
        this.x += this.speed * this.direction * dt;
        if (Math.abs(this.x - this.startX) > this.range) this.direction *= -1;
        this.vy += this.gravity * dt; this.y += this.vy * dt;
        platforms.forEach(p => {
            const pr = p.getRect();
            if (this.vy >= 0 && this.y + this.h >= pr.y && this.y < pr.y && aabb(this.getRect(), pr)) {
                this.y = pr.y - this.h; this.vy = 0;
            }
        });
    }
    draw(ctx) { ctx.fillStyle = "purple"; ctx.fillRect(this.x, this.y, this.w, this.h); }
    getRect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}

class Goal {
    constructor(x, y) {
        this.x = x; this.y = y; this.w = 180; this.h = 180;
        this.image = new Image(); this.image.src = "assets/images/maison.png";
    }
    update(dt) {}
    draw(ctx) {
        if (this.image.complete) ctx.drawImage(this.image, this.x, this.y - this.h, this.w, this.h);
        else { ctx.fillStyle = "orange"; ctx.fillRect(this.x, this.y - this.h, this.w, this.h); }
    }
    getRect() { return { x: this.x, y: this.y - this.h, w: this.w, h: this.h }; }
}

class Bonus {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type; this.w = 15; this.h = 15;
        this.color = type === BonusType.LIFE ? "red" : "gold";
    }
    update(dt) {}
    draw(ctx) { ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.w, this.h); }
    getRect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
}

// ==========================================
// 6. STATES
// ==========================================

class MenuState {
    constructor(scene) { this.scene = scene; this.pulse = 0; }
    update(dt, input) {
        this.pulse += dt;
        if (input.isDown("Enter") || input.isDown("Space")) {
            AudioManager.startPlaylist();
            this.scene.switchState(new PlayingState(this.scene));
        }
    }
    draw(ctx) {
        drawBackground(ctx, ctx.canvas.width, ctx.canvas.height, this.pulse, "menu");
        ctx.fillStyle = "white"; ctx.font = "40px Arial"; ctx.textAlign = "center";
        ctx.fillText("SAVE THE RECIPE", ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.font = "20px Arial"; ctx.fillText("PRESS ENTER TO START", ctx.canvas.width / 2, ctx.canvas.height / 2 + 50);
    }
}

class PlayingState {
    constructor(scene) { this.scene = scene; this.currentLevel = 0; this.score = 0; this.reset(); }
    reset() {
        const data = Levels[this.currentLevel];
        this.player = new Player(data.playerStart.x, data.playerStart.y);
        this.enemy = new Enemy(data.enemy.x, data.enemy.y);
        this.goal = new Goal(data.goal.x, data.goal.y);
        this.platforms = data.platforms.map(p => new Platform(p.x, p.y, p.w, p.h, data.colors.platforms, p.type));
        this.stairs = data.stairs;
        this.lives = 3; this.balls = []; this.playerProjectiles = []; this.victory = false;
        this.guardEnemies = data.guardEnemies.map(g => new GuardEnemy(g.x, g.y, g.range, g.speed));
    }
    update(dt, input, canvas) {
        if (this.lives <= 0 || this.victory) {
            if (input.isDown("KeyR")) this.reset();
            return;
        }
        if (input.isDown("ArrowRight")) { this.player.x += 300 * dt; this.player.direction = 1; }
        if (input.isDown("ArrowLeft")) { this.player.x -= 300 * dt; this.player.direction = -1; }
        if (input.isDown("Space") && this.player.onGround) { this.player.vy = this.player.jumpPower; this.player.onGround = false; }
        
        this.player.update(dt);
        this.player.onGround = false;
        this.platforms.forEach(p => {
            const pr = p.getRect(); const plr = this.player.getRect();
            if (this.player.vy >= 0 && plr.x < pr.x + pr.w && plr.x + plr.w > pr.x && plr.y + plr.h >= pr.y && plr.y < pr.y) {
                this.player.y = pr.y - this.player.h; this.player.vy = 0; this.player.onGround = true;
            }
        });

        this.enemy.update(dt, this.balls);
        this.balls.forEach(b => b.update(dt, this.player, this.stairs, this.platforms, false));
        this.guardEnemies.forEach(g => g.update(dt, this.platforms));
        
        this.balls.forEach(b => { if (aabb(this.player.getRect(), b.getRect())) this.lives--; });
        if (this.enemy.lives > 0 && aabb(this.player.getRect(), this.enemy.getRect())) this.lives = 0;
        if (this.enemy.lives <= 0 && aabb(this.player.getRect(), this.goal.getRect())) this.victory = true;
    }
    draw(ctx) {
        drawBackground(ctx, ctx.canvas.width, ctx.canvas.height, 0, "game");
        this.platforms.forEach(p => p.draw(ctx));
        this.player.draw(ctx); this.enemy.draw(ctx); this.balls.forEach(b => b.draw(ctx));
        this.guardEnemies.forEach(g => g.draw(ctx));
        if (this.enemy.lives <= 0) this.goal.draw(ctx);
        ctx.fillStyle = "white"; ctx.fillText(`LIVES: ${this.lives}  SCORE: ${this.score}`, 50, 50);
        if (this.victory) ctx.fillText("YOU WIN!", ctx.canvas.width / 2, ctx.canvas.height / 2);
        if (this.lives <= 0) ctx.fillText("GAME OVER", ctx.canvas.width / 2, ctx.canvas.height / 2);
    }
}

class LeaderboardState {
    constructor(scene) { this.scene = scene; this.pulse = 0; }
    update(dt, input) { if (input.isDown("Enter")) this.scene.switchState(new MenuState(this.scene)); }
    draw(ctx) {
        ctx.fillStyle = "black"; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = "yellow"; ctx.fillText("LEADERBOARD", ctx.canvas.width / 2, 100);
        ctx.fillText("PRESS ENTER FOR MENU", ctx.canvas.width / 2, ctx.canvas.height - 50);
    }
}

// ==========================================
// 7. CORE ENGINE
// ==========================================

class Ecouteurs {
    constructor(canvas) {
        this.keys = {};
        window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
        window.addEventListener("keyup", (e) => (this.keys[e.code] = false));
        window.addEventListener("resize", () => this.resize(canvas));
        this.resize(canvas);
    }
    isDown(code) { return !!this.keys[code]; }
    resize(canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
}

class GameScene {
    constructor(game) { this.game = game; this.state = new MenuState(this); }
    switchState(newState) { this.state = newState; }
    update(dt) { this.state.update(dt, this.game.input, this.game.canvas); }
    draw(ctx) { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); this.state.draw(ctx); }
}

class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas; this.ctx = ctx;
        this.input = new Ecouteurs(canvas);
        this.scene = new GameScene(this);
        this.lastTime = 0;
    }
    start() { requestAnimationFrame(this.loop.bind(this)); }
    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;
        this.scene.update(dt); this.scene.draw(this.ctx);
        requestAnimationFrame(this.loop.bind(this));
    }
}

// ==========================================
// 8. INITIALIZATION
// ==========================================

(function() {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const game = new Game(canvas, ctx);
    game.start();
})();
