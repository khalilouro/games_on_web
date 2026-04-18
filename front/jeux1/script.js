function aabb(r1, r2) {
    return r1.x < r2.x + r2.w &&
        r1.x + r1.w > r2.x &&
        r1.y < r2.y + r2.h &&
        r1.y + r1.h > r2.y;
}
class AudioManager {
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

new AudioManager();
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

const images = {
    menu: new Image(),
    game: new Image()
};

images.menu.src = "assets/images/background1.png";
images.game.src = "assets/images/background2.png";

let useImages = true;

function toggleTheme() {
    useImages = !useImages;
}

function drawBackground(ctx, width, height, time = 0, type = "menu") {
    const img = type === "menu" ? images.menu : images.game;

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
            { x: width * 0.2, y: height * 0.9, size: 50, color: "rgba(255, 235, 59, 0.15)", rot: -0.1 }
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
class Ecouteurs {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};

        window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
        window.addEventListener("keyup", (e) => (this.keys[e.code] = false));

        window.addEventListener("resize", () => this.resize());
        this.resize();
    }

    isDown(code) {
        return !!this.keys[code];
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}


const Levels = [
    {
        name: "Bikini Bottom Beach",

        playerStart: { x: 400, y: 490 },
        enemy: { x: 350, y: 50, lives: 3 },
        goal: { x: 375, y: 70 },

        colors: {
            background: "#4fc3f7",
            platforms: "#F4D03F",
            text: "#fff"
        },

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
            { x: 100, y: 440, w: 30, h: 120 },
            { x: 670, y: 440, w: 30, h: 120 },
            { x: 260, y: 340, w: 30, h: 120 },
            { x: 510, y: 340, w: 30, h: 120 },
            { x: 260, y: 240, w: 30, h: 120 },
            { x: 510, y: 240, w: 30, h: 120 },
            { x: 210, y: 140, w: 30, h: 120 },
            { x: 560, y: 140, w: 30, h: 120 }
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

        colors: {
            background: "#1B5E20",
            platforms: "#8E44AD",
            text: "#C8E6C9"
        },

        platforms: [
            { x: 0, y: 580, w: 250, h: 50, type: 1 },
            { x: 550, y: 580, w: 250, h: 50, type: 1 },
            { x: 50, y: 480, w: 200, h: 50, type: 1 },
            { x: 350, y: 430, w: 200, h: 50, type: 1 },
            { x: 500, y: 330, w: 250, h: 50, type: 1 },
            { x: 150, y: 300, w: 250, h: 50, type: 1 },
            { x: 50, y: 200, w: 700, h: 50, type: 1 },
            { x: 300, y: 100, w: 400, h: 50, type: 1 }
        ],

        stairs: [
            { x: 100, y: 470, w: 30, h: 120 },
            { x: 450, y: 420, w: 30, h: 170 },
            { x: 600, y: 320, w: 30, h: 120 },
            { x: 200, y: 290, w: 30, h: 150 },
            { x: 100, y: 190, w: 30, h: 120 },
            { x: 400, y: 90, w: 30, h: 120 }
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

        colors: {
            background: "#212121",
            platforms: "#546E7A",
            text: "#FF5252"
        },

        platforms: [
            { x: 0, y: 580, w: 800, h: 30, type: 2 },
            { x: 50, y: 480, w: 200, h: 30, type: 2 },
            { x: 550, y: 480, w: 200, h: 30, type: 2 },
            { x: 200, y: 380, w: 400, h: 30, type: 2 },
            { x: 0, y: 280, w: 300, h: 30, type: 2 },
            { x: 500, y: 280, w: 300, h: 30, type: 2 },
            { x: 100, y: 180, w: 600, h: 30, type: 2 },
            { x: 0, y: 100, w: 200, h: 30, type: 2 },
            { x: 600, y: 100, w: 200, h: 30, type: 2 }
        ],

        stairs: [
            { x: 100, y: 470, w: 30, h: 120 },
            { x: 670, y: 470, w: 30, h: 120 },
            { x: 385, y: 370, w: 30, h: 220 },
            { x: 250, y: 270, w: 30, h: 120 },
            { x: 520, y: 270, w: 30, h: 120 },
            { x: 150, y: 170, w: 30, h: 120 },
            { x: 620, y: 170, w: 30, h: 120 },
            { x: 100, y: 90, w: 30, h: 100 }
        ],

        guardEnemies: [
            { x: 350, y: 340, range: 50, speed: 150 },
            { x: 50, y: 240, range: 100, speed: 130 },
            { x: 650, y: 240, range: 100, speed: 130 }
        ]
    }
];

Levels;
class Trait {
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
class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 180;
        this.h = 180;
        this.pulse = 0;
        this.image = new Image();
        this.image.src = "assets/images/maison.png";
    }

    update(dt) {
        this.pulse += dt * 3;
    }

    draw(ctx) {
        ctx.save();
        const centerX = this.x + this.w / 2;
        const bottomY = this.y;

        ctx.translate(centerX, bottomY);
        const scale = 1 + Math.sin(this.pulse) * 0.05;
        ctx.scale(scale, scale);

        if (this.image.complete && this.image.naturalWidth !== 0) {
            ctx.drawImage(this.image, -this.w / 2, -this.h, this.w, this.h);
        } else {
            ctx.fillStyle = "#FF9800";
            ctx.beginPath();
            ctx.ellipse(0, -this.h / 2, this.w / 3, this.h / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    getRect() {
        return { x: this.x, y: this.y - this.h, w: this.w, h: this.h };
    }
}
const BonusType = {
    AMMO: "AMMO",
    LIFE: "LIFE",
    FREEZE: "FREEZE",
    SCORE: "SCORE"
};

class Bonus {
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


class Enemy {
    constructor(x, y, color = "brown") {
        this.x = x;
        this.y = y;
        this.size = 100;
        this.baseColor = color;
        this.freezeColor = "#00f";
        this.isFrozen = false;
        this.lives = 3;
        this.throwTimer = 0;
        this.throwInterval = 8.0;
    }

    update(dt, balls) {
        if (this.isFrozen || this.lives <= 0) return;

        this.throwTimer += dt;
        if (this.throwTimer >= this.throwInterval) {
            this.throwTimer = 0;
            this.throwBall(balls);
        }
    }

    throwBall(balls) {
        const startX = this.x + this.size / 2;
        const startY = this.y + this.size;

    }

    draw(ctx) {
        if (this.lives <= 0) return;

        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        const time = Date.now() * 0.005;
        const hover = Math.sin(time) * 5;
        ctx.translate(0, hover);

        ctx.fillStyle = this.isFrozen ? this.freezeColor : "#1D8348";
        ctx.beginPath();
        ctx.roundRect(-20, -30, 40, 60, 15);
        ctx.fill();

        ctx.strokeStyle = this.isFrozen ? this.freezeColor : "#1D8348";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-10, -30); ctx.lineTo(-20, -50);
        ctx.moveTo(10, -30); ctx.lineTo(20, -50);
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(0, -10, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f00";
        ctx.beginPath();
        const pupilX = Math.sin(time) * 3;
        ctx.arc(pupilX, -10, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ff0";
        ctx.fillRect(pupilX - 2, -12, 4, 4);

        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, 15);
        ctx.quadraticCurveTo(0, 5, 10, 15);
        ctx.stroke();

        ctx.restore();
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.size, h: this.size };
    }
}


class GuardEnemy {
    constructor(x, y, range = 100, speed = 100) {
        this.x = x;
        this.y = y;
        this.w = 40;
        this.h = 40;
        this.speed = speed;
        this.direction = 1;
        this.startX = x;
        this.range = range;
        this.vy = 0;
        this.gravity = 500;
        this.onGround = false;
    }

    update(dt, platforms) {
        const nextX = this.x + this.speed * this.direction * dt;

        if (this.range > 0) {
            if (Math.abs(nextX - this.startX) > this.range) {
                this.direction *= -1;
            }
        }

        if (this.onGround) {
            let platformBeneath = false;
            const checkX = this.direction > 0 ? nextX + this.w : nextX;
            const checkY = this.y + this.h + 5;

            for (const p of platforms) {
                const pr = p.getRect();
                if (checkX >= pr.x && checkX <= pr.x + pr.w &&
                    checkY >= pr.y && checkY <= pr.y + pr.h) {
                    platformBeneath = true;
                    break;
                }
            }

            if (!platformBeneath) {
                this.direction *= -1;
            }
        }

        this.x += this.speed * this.direction * dt;

        this.vy += this.gravity * dt;
        this.y += this.vy * dt;

        this.onGround = false;
        for (const p of platforms) {
            const pr = p.getRect();
            const gr = this.getRect();

            if (this.vy >= 0 &&
                this.y + this.h - this.vy * dt <= pr.y &&
                aabb(gr, pr)) {
                this.y = pr.y - this.h;
                this.vy = 0;
                this.onGround = true;
                break;
            }
        }

        if (this.x < 0 || this.x + this.w > 800) {
            this.direction *= -1;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

        const wobble = Math.sin(Date.now() * 0.01) * 3;
        ctx.rotate(wobble * 0.05);

        ctx.fillStyle = "#9C27B0";
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);

        ctx.fillStyle = "white";
        ctx.fillRect(-15, -10, 8, 8);
        ctx.fillRect(5, -10, 8, 8);
        ctx.fillStyle = "black";
        ctx.fillRect(this.direction > 0 ? -11 : -14, -8, 4, 4);
        ctx.fillRect(this.direction > 0 ? 9 : 6, -8, 4, 4);

        ctx.strokeStyle = "#7B1FA2";
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            const lx = -15 + i * 15;
            ctx.beginPath();
            ctx.moveTo(lx, this.h / 2);
            ctx.lineTo(lx + Math.sin(Date.now() * 0.01 + i) * 5, this.h / 2 + 10);
            ctx.stroke();
        }

        ctx.restore();
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}
class Platform {
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
class Player {
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
class Ball {
    constructor(x, y, speed = 150) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.speed = speed;
        this.vx = 0;
        this.vy = 0;
        this.color = "#f00";
        this.onGround = false;
        this.gravity = 500;
    }

    update(dt, player, stairs, platforms, isFrozen) {
        if (isFrozen) return;

        this.vx = 0;
        let takingStair = false;
        const yDiff = player.y - this.y;
        const xDiff = player.x - this.x;

        let currentStair = null;
        for (const s of stairs) {
            if (this.x + 10 > s.x && this.x - 10 < s.x + s.w) {
                currentStair = s;
                break;
            }
        }

        if (Math.abs(yDiff) > 80 && stairs.length > 0) {
            if (currentStair) {
                takingStair = true;
                this.vx = 0;
                this.x = currentStair.x + currentStair.w / 2;
                if (yDiff > 0) this.y += this.speed * dt;
                else this.y -= this.speed * dt;
                this.vy = 0;
            } else {
                let closestStair = null;
                let minDist = Infinity;
                for (const s of stairs) {
                    const dist = Math.abs(s.x + s.w / 2 - this.x);
                    if (dist < minDist) {
                        minDist = dist;
                        closestStair = s;
                    }
                }
                if (closestStair) {
                    if (this.x < closestStair.x + closestStair.w / 2 - 5) this.vx = this.speed;
                    else if (this.x > closestStair.x + closestStair.w / 2 + 5) this.vx = -this.speed;
                    else this.vx = 0;
                } else {
                    if (this.x < player.x) this.vx = this.speed;
                    else if (this.x > player.x + player.w) this.vx = -this.speed;
                }
            }
        } else {
            if (this.x < player.x) this.vx = this.speed;
            else if (this.x > player.x + player.w) this.vx = -this.speed;
            else this.vx = 0;
        }

        if (!takingStair) {
            this.vy += this.gravity * dt;
            this.x += this.vx * dt;
            this.y += this.vy * dt;

            this.onGround = false;
            for (const p of platforms) {
                const pr = p.getRect();
                if (this.vy >= 0 &&
                    this.y + this.radius <= pr.y + 15 &&
                    this.y + this.radius + this.vy * dt >= pr.y &&
                    this.x + this.radius > pr.x &&
                    this.x - this.radius < pr.x + pr.w) {

                    this.y = pr.y - this.radius;
                    this.vy = 0;
                    this.onGround = true;
                }
            }
        }

        if (this.x < 0) this.x = 0;
        if (this.x > 800) this.x = 800;
    }

    draw(ctx) {
        ctx.save();
        const time = Date.now() * 0.005;
        const pulse = Math.sin(time) * 2;

        ctx.fillStyle = "#FF80AB";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + pulse, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = "#BA68C8";
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 4, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 4, this.y - 6, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#FF80AB";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = -1; i <= 1; i++) {
            const tx = this.x + i * 5;
            ctx.moveTo(tx, this.y);
            const wave = Math.sin(time * 2 + i) * 5;
            ctx.bezierCurveTo(tx + wave, this.y + 5, tx - wave, this.y + 10, tx, this.y + 15);
        }
        ctx.stroke();
        ctx.restore();
    }

    getRect() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            w: this.radius * 2,
            h: this.radius * 2
        };
    }
}



class GameScene {
    constructor(game) {
        this.game = game;
        this.state = new MenuState(this);
    }

    switchState(newState) {
        this.state = newState;
    }

    update(dt) {
        this.state.update(dt, this.game.input, this.game.canvas);
    }

    draw(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.state.draw(ctx);
    }
}




class LeaderboardState {
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





class MenuState {
    constructor(scene) {
        this.scene = scene;
        this.bubbles = [];
        this.pulse = 0;
        this.toggleCooldown = 0;
        this.logoIcon = new Image();
        this.logoIcon.src = "assets/images/logo_icon.png";
    }

    update(dt, input, canvas) {
        if (input.isDown("Enter") || input.isDown("Space") || input.isDown("KeyT") || input.isDown("KeyH")) {
            AudioManager.startPlaylist();
        }

        this.pulse += dt * 5;
        if (this.toggleCooldown > 0) this.toggleCooldown -= dt;

        if (input.isDown("KeyT") && this.toggleCooldown <= 0) {
            toggleTheme();
            this.toggleCooldown = 0.5;
        }

        if (input.isDown("KeyH") && this.toggleCooldown <= 0) {
            this.scene.switchState(new LeaderboardState(this.scene));
            this.toggleCooldown = 0.5;
        }

        if (input.isDown("Enter") || input.isDown("Space")) {
            AudioManager.startPlaylist();
            this.scene.switchState(new PlayingState(this.scene));
        }
    }

    draw(ctx) {
        const { width, height } = ctx.canvas;
        drawBackground(ctx, width, height, this.pulse, "menu");

        ctx.save();
        ctx.textAlign = "center";

        const titleY = height / 3;
        ctx.font = "bold 80px 'Arial Black', Gadget, sans-serif";
        ctx.fillStyle = "#ffeb3b";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 8;
        ctx.strokeText("SAVE THE RECIPE", width / 2, titleY);
        ctx.fillText("SAVE THE RECIPE", width / 2, titleY);

        ctx.font = "bold 30px 'Arial Black'";
        ctx.fillStyle = "#FF5252";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 4;
        ctx.strokeText("SQUAREPANTS EDITION", width / 2, titleY + 60);
        ctx.fillText("SQUAREPANTS EDITION", width / 2, titleY + 60);


        // Logo Icon
        if (this.logoIcon.complete) {
            const iconSize = 120;
            ctx.drawImage(this.logoIcon, width / 2 - iconSize / 2, titleY - 200, iconSize, iconSize);
        }

        // Instructions
        ctx.restore();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";

        const startY = height / 2 + 50;
        const scale = 1 + Math.sin(this.pulse * 2) * 0.05;

        ctx.save();
        ctx.translate(width / 2, startY);
        ctx.scale(scale, scale);
        ctx.fillStyle = "#FFEB3B";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FFEB3B";
        ctx.fillText("PRESS ENTER TO START", 0, 0);
        ctx.restore();

        ctx.font = "16px monospace";
        ctx.fillText("T: Theme  H: Leaderboard  UP/SPACE: Jump  F: Shoot", width / 2, height - 50);

        const highScore = localStorage.getItem("highScore") || 0;
        ctx.fillStyle = "#ffd700";
        ctx.fillText(`BEST SCORE: ${highScore}`, width / 2, height - 20);
    }

    drawHouse(ctx, type, x, y) {
        if (type === "rock") {
            ctx.fillStyle = "#795548";
            ctx.beginPath();
            ctx.arc(x, y + 50, 60, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = "#ffeb3b";
            ctx.fillRect(x - 5, y - 20, 10, 20);
        } else if (type === "tiki") {
            ctx.fillStyle = "#546e7a";
            ctx.fillRect(x - 40, y, 80, 150);
            ctx.fillStyle = "#ffeb3b";
            ctx.beginPath();
            ctx.arc(x - 20, y + 40, 15, 0, Math.PI * 2);
            ctx.arc(x + 20, y + 40, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#37474f";
            ctx.fillRect(x - 15, y + 60, 30, 40);
            ctx.fillRect(x - 25, y + 110, 50, 10);
        } else if (type === "pineapple") {
            ctx.fillStyle = "#ff9800";
            ctx.beginPath();
            ctx.ellipse(x, y + 50, 70, 100, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#e65100";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 50, y); ctx.lineTo(x + 50, y + 100);
            ctx.moveTo(x + 50, y); ctx.lineTo(x - 50, y + 100);
            ctx.stroke();

            ctx.fillStyle = "#4caf50";
            ctx.beginPath();
            ctx.moveTo(x, y - 50);
            ctx.lineTo(x - 40, y - 100);
            ctx.lineTo(x, y - 80);
            ctx.lineTo(x + 40, y - 100);
            ctx.fill();

            ctx.fillStyle = "#90a4ae";
            ctx.beginPath();
            ctx.arc(x, y + 100, 40, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = "#1e88e5";
            ctx.beginPath();
            ctx.arc(x + 30, y, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
















class PlayingState {
    constructor(scene) {
        this.scene = scene;
        this.currentLevel = 0;
        this.score = 0;
        this.worldWidth = 800;
        this.worldHeight = 600;
        this.krabbyPattyIcon = new Image();
        this.krabbyPattyIcon.src = "assets/images/krabby_patty.png";
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
        if (this.krabbyPattyIcon.complete) {
            ctx.drawImage(this.krabbyPattyIcon, 160, 48, 20, 20);
        }
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



class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.input = new Ecouteurs(canvas);
        this.scene = new GameScene(this);
        this.lastTime = 0;
    }

    start() {
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.scene.update(dt);
        this.scene.draw(this.ctx);

        requestAnimationFrame(this.loop.bind(this));
    }
}


const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const game = new Game(canvas, ctx);
game.start();
