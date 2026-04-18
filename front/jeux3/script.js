const FINISH_LINE_Z = 5000;
const TRACK_LENGTH = FINISH_LINE_Z + 500;
const TRACK_WIDTH = 60;

const COUNTDOWN_START = 3;

const CAR_DIMENSIONS = {
    width: 3,
    height: 1.5,
    depth: 4.5,
    scaling: 0.55,
    modelOffsetY: -0.75,
    halfWidth: 1.5,
    groundOffset: 0.75
};

const BOT_DATA = [
    { x: -10, z: 24, maxSpeed: 2.3, color: new BABYLON.Color3(1, 0.5, 0) }, // Orange (Poss 1)
    { x:  10, z: 12, maxSpeed: 2.45, color: new BABYLON.Color3(1, 0, 1) },  // Violet (Poss 2)
    { x: -10, z: 0, maxSpeed: 2.15, color: new BABYLON.Color3(0, 1, 0) }    // Vert (Poss 3)
];
function getTrackX(z) {
    if (z < 100) return 0; // Départ droit
    let factor = (z - 100) / 200; // Transition douce
    if (factor > 1) factor = 1;
    return factor * (Math.sin(z / 400) * 150 + Math.sin(z / 200) * 80);
}

function getTrackY(z) {
    if (z < 300) return 0; // Départ plat
    let factor = (z - 300) / 300;
    if (factor > 1) factor = 1;
    // Grandes pentes et vallées (oscillations sur l'axe Y)
    return factor * (Math.sin(z / 500) * 60 + Math.cos(z / 250) * 20);
}
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// Ambiance de jour (Ciel très clair façon ciel d'été)
scene.clearColor = new BABYLON.Color4(0.5, 0.85, 1, 1); // Ciel bleu clair d'été
scene.fogEnabled = true;
scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
scene.fogStart = 700;
scene.fogEnd = 2200;
scene.fogColor = new BABYLON.Color3(0.52, 0.78, 0.92);

// ========== LUMIÈRE ==========
// Soleil directionnel pour bien éclairer la ville et l'eau
const sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-1, -2, -0.5), scene);
sun.intensity = 1.6;
sun.diffuse = new BABYLON.Color3(1, 0.92, 0.78); // Lumière chaude méditerranéenne

const light = new BABYLON.PointLight("light", new BABYLON.Vector3(0, 20, 0), scene);
light.intensity = 0.4;
light.diffuse = new BABYLON.Color3(1, 1, 1);

const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
ambientLight.intensity = 0.6;

// Caméra qui suit la voiture
const camera = new BABYLON.FollowCamera("camera", new BABYLON.Vector3(0, 15, -25), scene);
camera.radius = 20;
camera.heightOffset = 10;
camera.rotationOffset = 180;
camera.cameraAcceleration = 0.05;
camera.maxCameraSpeed = 20;

// EFFET GLOW (Pour le style Asphalt Legends)
const glowLayer = new BABYLON.GlowLayer("glow", scene);
glowLayer.intensity = 0.8;
class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.ctx = BABYLON.Engine.audioEngine?.audioContext || new (window.AudioContext || window.webkitAudioContext)();
        this.isInitialized = false;

        // Paramètres Moteur S58 (depuis le fichier HTML)
        this.MAX_RPM = 7600;
        this.curRpm = 700;
        this.curLoad = 0.2;
        this.curExh = 0.4;
        this.oscs = [];
    }

    _makeDistCurve(k) {
        const N = 512, c = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            const x = i * 2 / N - 1;
            c[i] = (Math.PI + k) * x / (Math.PI + k * Math.abs(x));
        }
        return c;
    }

    _rpmFund(rpm) { return (rpm / 60) * 1.5; }

    _targetVol() {
        if (!this.isInitialized) return 0;
        const base = 0.15 + (this.curRpm / this.MAX_RPM) * 0.55;
        const vol = Math.min(0.9, base * (0.65 + this.curLoad * 0.5) * (0.7 + this.curExh * 0.6));
        // Volume réduit à 10% de sa force brute d'origine
        return vol * 0.10;
    }

    init() {
        if (this.isInitialized) return;
        
        if (BABYLON.Engine.audioEngine) BABYLON.Engine.audioEngine.unlock();
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();

        // --- CONSTRUCTION DU GRAPHE AUDIO S58 ---
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0;

        this.preGain = this.ctx.createGain();
        this.preGain.gain.value = 1;

        this.distNode = this.ctx.createWaveShaper();
        this.distNode.curve = this._makeDistCurve(120);
        this.distNode.oversample = '4x';

        this.hp = this.ctx.createBiquadFilter();
        this.hp.type = 'highpass';
        this.hp.frequency.value = 60;
        this.hp.Q.value = 0.7;

        this.lp = this.ctx.createBiquadFilter();
        this.lp.type = 'lowpass';
        this.lp.frequency.value = 3200;
        this.lp.Q.value = 0.5;

        this.mid = this.ctx.createBiquadFilter();
        this.mid.type = 'peaking';
        this.mid.frequency.value = 580;
        this.mid.gain.value = 10;
        this.mid.Q.value = 1.1;

        this.comp = this.ctx.createDynamicsCompressor();
        this.comp.threshold.value = -14;
        this.comp.knee.value = 8;
        this.comp.ratio.value = 5;
        this.comp.attack.value = 0.002;
        this.comp.release.value = 0.12;

        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.value = -1;
        this.limiter.ratio.value = 20;
        this.limiter.attack.value = 0.001;
        this.limiter.release.value = 0.05;

        this.masterGain.connect(this.preGain);
        this.preGain.connect(this.distNode);
        this.distNode.connect(this.hp);
        this.hp.connect(this.mid);
        this.mid.connect(this.lp);
        this.lp.connect(this.comp);
        this.comp.connect(this.limiter);
        this.limiter.connect(this.ctx.destination);

        const fund = this._rpmFund(this.curRpm);
        const hDefs = [
            { m: 0.5,  t: 'sawtooth', g: 0.85 }, 
            { m: 1,    t: 'sawtooth', g: 1.00 }, 
            { m: 1.5,  t: 'square',   g: 0.60 }, 
            { m: 2,    t: 'sawtooth', g: 0.70 }, 
            { m: 2.5,  t: 'sawtooth', g: 0.35 },
            { m: 3,    t: 'square',   g: 0.45 },
            { m: 4,    t: 'sawtooth', g: 0.28 },
            { m: 5,    t: 'sawtooth', g: 0.16 },
            { m: 6,    t: 'square',   g: 0.12 },
            { m: 8,    t: 'sawtooth', g: 0.07 },
            { m: 0.33, t: 'sawtooth', g: 0.50 }, 
            { m: 0.25, t: 'sawtooth', g: 0.30 },
        ];

        this.oscs = hDefs.map(({ m, t, g }) => {
            const o  = this.ctx.createOscillator();
            const og = this.ctx.createGain();
            o.type = t;
            o.frequency.value = fund * m;
            og.gain.value = g * 0.07;
            o.connect(og);
            og.connect(this.masterGain);
            o.start();
            return { o, og, m };
        });

        this.noiseOsc  = this.ctx.createOscillator();
        this.noiseGain = this.ctx.createGain();
        this.noiseOsc.type = 'sawtooth';
        this.noiseOsc.frequency.value = fund * 2.1;
        this.noiseGain.gain.value = 0.04;
        this.noiseOsc.connect(this.noiseGain);
        this.noiseGain.connect(this.masterGain);
        this.noiseOsc.start();

        this.isInitialized = true;
        this.masterGain.gain.setTargetAtTime(this._targetVol(), this.ctx.currentTime, 0.5);
    }

    updateEngine(velocity, isBoost, isShockwave) {
        if (!this.isInitialized) return;

        let v = Math.abs(velocity);
        const now  = this.ctx.currentTime;

        // Vitesse max en jeu ~ 350 -> 600 boost -> 1000+ Shockwave
        // On mappe la vitesse sur l'amplitude normale des tours minutes
        let targetRpm = 700 + (v / 400) * (this.MAX_RPM - 700);

        if (isBoost) targetRpm += 1500;
        if (isShockwave) targetRpm += 2500;
        
        targetRpm = Math.min(this.MAX_RPM, targetRpm);

        // Simulation de la charge et de l'échappement comme dans ton slider (0 à 100%)
        this.curLoad = 0.2 + Math.min(v / 300, 1.0) * 0.8;
        this.curExh = 0.4 + Math.min(v / 300, 1.0) * 0.6;
        
        if (isBoost || isShockwave) { 
            this.curLoad = 1.0; 
            this.curExh = 1.0; 
        }

        // Algorithme d'interpolation de ton HTML (StartLoop)
        const diff = targetRpm - this.curRpm;
        this.curRpm += diff > 0 ? Math.min(diff, 80) : Math.max(diff, -55);
        this.curRpm = Math.max(700, Math.min(this.MAX_RPM, this.curRpm));

        const fund = this._rpmFund(this.curRpm);
        const tc   = 0.07; // Ta constante de temps originelle

        // Application sur les oscillateurs (Identique à ton code)
        this.oscs.forEach(({ o, m }) => o.frequency.setTargetAtTime(fund * m, now, tc));
        this.noiseOsc.frequency.setTargetAtTime(fund * 2.1, now, tc);

        this.distNode.curve = this._makeDistCurve(80 + this.curLoad * 180);
        this.hp.frequency.setTargetAtTime(55 + this.curExh * 30, now, 0.1);
        this.lp.frequency.setTargetAtTime(2000 + this.curRpm * 0.18 + this.curExh * 1400, now, 0.1);
        this.mid.frequency.setTargetAtTime(400 + this.curRpm * 0.065 + this.curExh * 200, now, 0.1);
        this.mid.gain.setTargetAtTime(6 + this.curLoad * 10 + this.curExh * 6, now, 0.1);
        
        // Target volume originel (sans baisses de volume bizarres)
        this.masterGain.gain.setTargetAtTime(this._targetVol(), now, 0.1);
    }

    playBoostSound() {
        this._playSweep(200, 800, 0.3, 'sine', 0.1);
    }

    playShockwaveSound() {
        this._playSweep(100, 1500, 0.5, 'square', 0.3);
        this.playCrashSound(0.5);
    }

    playCrashSound(volume = 0.2) {
        if (!this.isInitialized) return;
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.5);
        const gainObj = this.ctx.createGain();
        gainObj.gain.setValueAtTime(volume, this.ctx.currentTime);
        gainObj.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        noise.connect(filter);
        filter.connect(gainObj);
        gainObj.connect(this.ctx.destination);
        noise.start();
    }

    playTakedownSound() {
        this.playCrashSound(0.6);
        this._playSweep(800, 200, 0.4, 'sawtooth', 0.4);
    }

    _playSweep(startFreq, endFreq, duration, type = 'sine', volume = 0.1) {
        if (!this.isInitialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
}



function initMinimap() {
    const minimap = document.getElementById("minimap");
    const ctxMap = minimap.getContext("2d");
    return { minimap, ctxMap };
}

function updateMinimap(ctxMap, car, bots) {
    ctxMap.clearRect(0, 0, 150, 300);

    // Tracé de la piste globale au crayon blanc
    ctxMap.beginPath();
    ctxMap.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctxMap.lineWidth = 3;
    for (let mz = 0; mz <= FINISH_LINE_Z; mz += 100) {
        let mx = getTrackX(mz);
        let pxlX = ((mx + 250) / 500) * 150;
        let pxlY = 300 - (mz / FINISH_LINE_Z) * 300;
        if (mz === 0) ctxMap.moveTo(Math.floor(pxlX), Math.floor(pxlY));
        else ctxMap.lineTo(Math.floor(pxlX), Math.floor(pxlY));
    }
    ctxMap.stroke();

    // Bots
    bots.forEach(bot => {
        let bx = ((bot.mesh.position.x + 250) / 500) * 150;
        let by = 300 - (bot.mesh.position.z / FINISH_LINE_Z) * 300;
        ctxMap.fillStyle = bot.colorBase ? bot.colorBase.toHexString() : "#ffffff";
        ctxMap.beginPath();
        ctxMap.arc(Math.floor(bx), Math.floor(by), 4, 0, Math.PI * 2);
        ctxMap.fill();
    });

    // Joueur
    let plrX = ((car.position.x + 250) / 500) * 150;
    let plrY = 300 - (car.position.z / FINISH_LINE_Z) * 300;
    ctxMap.fillStyle = "#00ffff";
    ctxMap.beginPath();
    ctxMap.arc(Math.floor(plrX), Math.floor(plrY), 6, 0, Math.PI * 2);
    ctxMap.fill();
    ctxMap.strokeStyle = "#ffffff";
    ctxMap.lineWidth = 2;
    ctxMap.stroke();
}

function updateHUD(speed, distance, currentPlace, botsCount, boostEnergy, boostActive, isDrifting, isDriftMode) {
    document.getElementById("distance").textContent = `POS: ${currentPlace}/${botsCount + 1} | DIST: ${distance}M / ${FINISH_LINE_Z}M`;

    // UI Boost
    document.getElementById("boostBar").style.width = `${boostEnergy}%`;

    let driftText = "";
    if (isDrifting) driftText = " <span style='font-size:14px; color:#ffaa00;'>DRIFTING</span>";
    else if (isDriftMode) driftText = " <span style='font-size:14px; color:#ff5500;'>DRIFT MODE</span>";

    const speedEl = document.getElementById("speedometer");
    speedEl.innerHTML = `${speed}<span>KM/H</span>${driftText}`;

    if (boostActive) {
        document.getElementById("boostLabel").textContent = "BOOSTING 🔥";
        document.getElementById("boostLabel").classList.add("boostTextActive");
        speedEl.style.color = "#ff006e";
        speedEl.style.textShadow = "0 0 25px rgba(255, 0, 110, 0.8)";
    } else {
        let statusText = boostEnergy >= 100 ? "READY TO BOOST (SPACE)" : "NITRO RECHARGING";
        document.getElementById("boostLabel").textContent = statusText;
        document.getElementById("boostLabel").classList.remove("boostTextActive");
        speedEl.style.color = isDrifting ? "#ffaa00" : "#00ffff";
        speedEl.style.textShadow = "0 0 20px rgba(0, 255, 255, 0.5)";
    }

    if (distance > FINISH_LINE_Z - 500 && distance < FINISH_LINE_Z) {
        document.getElementById("finishWarning").style.display = "block";
    } else {
        document.getElementById("finishWarning").style.display = "none";
    }
}

function showGameOver(finished, place, distance) {
    document.getElementById("gameOver").style.display = "block";
    const gameResultEl = document.getElementById("gameResult");
    const gameOverEl = document.getElementById("gameOver");
    const finalInfoEl = document.getElementById("finalInfo");

    if (finished) {
        if (place === 1) {
            gameResultEl.textContent = "YOU WIN! 🥇";
            gameResultEl.style.color = "#ffff00";
            gameOverEl.style.borderColor = "#ffff00";
        } else {
            gameResultEl.textContent = `FINISHED ${place}${place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'} 🥈`;
            gameResultEl.style.color = "#ffaa00";
            gameOverEl.style.borderColor = "#ffaa00";
        }
        finalInfoEl.textContent = `VITESSE ET STYLE AU TOP !`;
    } else {
        // En mode sans timer, ceci ne devrait plus arriver via le temps
        gameResultEl.textContent = "GAME OVER!";
        gameResultEl.style.color = "#ff0000";
        gameOverEl.style.borderColor = "#ff0000";
        finalInfoEl.textContent = `DISTANCE PARCOURUE : ${Math.floor(distance)}M`;
    }
}

function startCountdown(onComplete) {
    let countdownValue = 3;
    const countdownEl = document.getElementById("countdownDisplay");
    let countdownInterval = setInterval(() => {
        countdownValue--;
        if (countdownValue > 0) {
            countdownEl.textContent = countdownValue;
            countdownEl.style.transform = "translate(-50%, -50%) scale(1.8)";
            countdownEl.style.opacity = "1";
            setTimeout(() => {
                countdownEl.style.transform = "translate(-50%, -50%) scale(1)";
            }, 200);
        } else if (countdownValue === 0) {
            countdownEl.textContent = "GO!";
            countdownEl.style.color = "#00ff88";
            countdownEl.style.textShadow = "0 0 60px #00ff88, 0 0 20px #ffffff";
            countdownEl.style.transform = "translate(-50%, -50%) scale(2)";
            onComplete();
        } else {
            countdownEl.style.opacity = "0";
            countdownEl.style.transform = "translate(-50%, -50%) scale(5)";
            clearInterval(countdownInterval);
        }
    }, 1000);
}

function takePhoto(engine, camera) {
    BABYLON.Tools.CreateScreenshotAsync(engine, camera, { width: 1920, height: 1080 }).then((screenshot) => {
        const apiUrl = window.location.port === '5500' ? 'http://localhost:3000/api/save-photo' : '/api/save-photo';

        // Send to server
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: screenshot }),
        })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log('Photo saved:', data);
            })

            .catch(error => {
                console.error('Error saving photo:', error);
                if (window.location.port === '5500') {
                    console.warn("ASTUCE : Live Server (5500) ne peut pas enregistrer de fichiers. Utilisez http://localhost:3000 pour que l'API fonctionne.");
                }
            });
    });
}


function initDriftParticles(car) {
    const driftParticles = new BABYLON.ParticleSystem("drift", 500, scene);
    const smokeTex = new BABYLON.DynamicTexture("smokeTex", 64, scene);
    const ctx = smokeTex.getContext();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
    smokeTex.update();
    driftParticles.particleTexture = smokeTex;

    const emitter = new BABYLON.TransformNode("emitter", scene);
    emitter.parent = car;
    emitter.position = new BABYLON.Vector3(0, -0.7, -2); // A ras du sol sous l'arrière de la voiture
    driftParticles.emitter = emitter;

    driftParticles.minEmitBox = new BABYLON.Vector3(-1.5, 0, 0);
    driftParticles.maxEmitBox = new BABYLON.Vector3(1.5, 0, 0);
    driftParticles.color1 = new BABYLON.Color4(0.8, 0.8, 0.8, 0.5); // Fumée de pneu grise
    driftParticles.colorDead = new BABYLON.Color4(0.1, 0.1, 0.1, 0.0);
    driftParticles.minLifeTime = 0.2;
    driftParticles.maxLifeTime = 0.4;
    driftParticles.emitRate = 0; // Éteint par défaut
    driftParticles.minEmitPower = 5;
    driftParticles.maxEmitPower = 10;
    driftParticles.updateSpeed = 0.02;
    driftParticles.start();

    return driftParticles;
}



class CoteAzur {
    constructor(scene) {
        this.scene = scene;
        this.materials = {};
        this.initMaterials();
    }

    initMaterials() {
        // --- MATÉRIAUX URBAINS ---
        this.materials.asphalte = new BABYLON.StandardMaterial("asphalte", this.scene);
        this.materials.asphalte.diffuseTexture = new BABYLON.Texture("./texture/asphalt_texture.jpg", this.scene);
        this.materials.asphalte.diffuseTexture.uScale = 6;
        this.materials.asphalte.diffuseTexture.vScale = 200;
        this.materials.asphalte.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
        this.materials.asphalte.specularPower = 20;

        this.materials.trottoirMat = new BABYLON.StandardMaterial("trottoirMat", this.scene);
        this.materials.trottoirMat.diffuseTexture = new BABYLON.Texture("./texture/sidewalk_texture.jpg", this.scene);
        this.materials.trottoirMat.diffuseTexture.uScale = 3;
        this.materials.trottoirMat.diffuseTexture.vScale = 150;
        this.materials.trottoirMat.diffuseColor = new BABYLON.Color3(0.80, 0.10, 0.08); // Rouge brique méditerranéen
        this.materials.trottoirMat.specularColor = new BABYLON.Color3(0.1, 0.05, 0.05);

        this.materials.sableMat = new BABYLON.StandardMaterial("sableMat", this.scene);
        this.materials.sableMat.diffuseTexture = new BABYLON.Texture("./texture/nice_pebbles.png", this.scene);
        this.materials.sableMat.diffuseTexture.uScale = 20;
        this.materials.sableMat.diffuseTexture.vScale = 3;
        this.materials.sableMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
        this.materials.sableMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

        this.materials.eauMat = new BABYLON.StandardMaterial("eauMat", this.scene);
        this.materials.eauMat.diffuseTexture = new BABYLON.Texture("./texture/water_texture.png", this.scene);
        this.materials.eauMat.diffuseTexture.uScale = 20;
        this.materials.eauMat.diffuseTexture.vScale = 20;
        this.materials.eauMat.diffuseColor = new BABYLON.Color3(0.05, 0.15, 0.4);
        this.materials.eauMat.specularColor = new BABYLON.Color3(0.1, 0.2, 0.5);
        this.materials.eauMat.specularPower = 16;

        this.materials.herbeMat = new BABYLON.StandardMaterial("herbeMat", this.scene);
        this.materials.herbeMat.diffuseTexture = new BABYLON.Texture("./texture/grass_texture.jpg", this.scene);
        this.materials.herbeMat.diffuseTexture.uScale = 25;
        this.materials.herbeMat.diffuseTexture.vScale = 250;

        this.materials.falaiseMat = new BABYLON.StandardMaterial("falaiseMat", this.scene);
        this.materials.falaiseMat.diffuseTexture = new BABYLON.Texture("texture/cliff_rock.png", this.scene);
        this.materials.falaiseMat.diffuseTexture.uScale = 20;
        this.materials.falaiseMat.diffuseTexture.vScale = 1;
        this.materials.falaiseMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        this.materials.falaiseMat.roughness = 0.9;
    }

    initTrack() {
        const roadPath1 = []; const roadPath2 = [];
        const tLeft1 = []; const tLeft2 = [];
        const tRight1 = []; const tRight2 = [];
        const cliffTop = []; const cliffBottom = [];
        const beach1 = []; const beach2 = [];
        const ocean1 = []; const ocean2 = [];
        const grass1 = []; const grass2 = [];

        const SEA_LEVEL = -80;

        for (let z = -200; z < TRACK_LENGTH; z += 10) {
            const x = getTrackX(z);
            const y = getTrackY(z);

            roadPath1.push(new BABYLON.Vector3(x - 30, y, z));
            roadPath2.push(new BABYLON.Vector3(x + 30, y, z));

            tLeft1.push(new BABYLON.Vector3(x - 40, y + 0.3, z));
            tLeft2.push(new BABYLON.Vector3(x - 30, y + 0.3, z));
            tRight1.push(new BABYLON.Vector3(x + 30, y + 0.3, z));
            tRight2.push(new BABYLON.Vector3(x + 40, y + 0.3, z));

            // FALAISES (Paroi verticale du trottoir au niveau de la mer)
            cliffTop.push(new BABYLON.Vector3(x - 45, y + 0.3, z));
            cliffBottom.push(new BABYLON.Vector3(x - 45, SEA_LEVEL, z));

            // PLAGE (Pente du pied de la falaise vers le large)
            beach2.push(new BABYLON.Vector3(x - 45, SEA_LEVEL, z));
            beach1.push(new BABYLON.Vector3(-280, SEA_LEVEL, z));

            // OCÉAN (Horizon fixe)
            ocean1.push(new BABYLON.Vector3(-4000, SEA_LEVEL, z));
            ocean2.push(new BABYLON.Vector3(-280, SEA_LEVEL, z));

            grass1.push(new BABYLON.Vector3(x + 40, y + 0.2, z));
            grass2.push(new BABYLON.Vector3(x + 2000, y + 0.2, z));
        }

        const opt = { sideOrientation: BABYLON.Mesh.DOUBLESIDE };

        const road = BABYLON.MeshBuilder.CreateRibbon("road", { pathArray: [roadPath1, roadPath2], ...opt }, this.scene);
        road.material = this.materials.asphalte;

        const lTrot = BABYLON.MeshBuilder.CreateRibbon("lTrot", { pathArray: [tLeft1, tLeft2], ...opt }, this.scene);
        lTrot.material = this.materials.trottoirMat;

        const rTrot = BABYLON.MeshBuilder.CreateRibbon("rTrot", { pathArray: [tRight1, tRight2], ...opt }, this.scene);
        rTrot.material = this.materials.trottoirMat;

        const cliff = BABYLON.MeshBuilder.CreateRibbon("cliff", { pathArray: [cliffTop, cliffBottom], ...opt }, this.scene);
        cliff.material = this.materials.falaiseMat;

        const beach = BABYLON.MeshBuilder.CreateRibbon("beach", { pathArray: [beach1, beach2], ...opt }, this.scene);
        beach.material = this.materials.sableMat;

        const ocean = BABYLON.MeshBuilder.CreateRibbon("ocean", { pathArray: [ocean1, ocean2], ...opt }, this.scene);
        ocean.material = this.materials.eauMat;

        const grass = BABYLON.MeshBuilder.CreateRibbon("grass", { pathArray: [grass1, grass2], ...opt }, this.scene);
        grass.material = this.materials.herbeMat;
    }

    initBuildings() {
        // Palette méditerranéenne Riviera / Côte d'Azur
        const medColors = [
            new BABYLON.Color3(0.98, 0.96, 0.90), // Blanc cassé
            new BABYLON.Color3(0.94, 0.91, 0.79), // Crème
            new BABYLON.Color3(0.96, 0.90, 0.73), // Sable doré
            new BABYLON.Color3(0.88, 0.80, 0.68), // Beige méditerranéen
            new BABYLON.Color3(0.87, 0.72, 0.58), // Terracotta claire
            new BABYLON.Color3(0.86, 0.91, 0.96), // Blanc bleué Riviera
            new BABYLON.Color3(1.00, 0.95, 0.85), // Ivoire chaud
        ];

        const baseMats = [
            new BABYLON.StandardMaterial("baseB1", this.scene),
            new BABYLON.StandardMaterial("baseB2", this.scene)
        ];
        baseMats[0].diffuseTexture = new BABYLON.Texture("texture/building_facade.png", this.scene);
        baseMats[1].diffuseTexture = new BABYLON.Texture("texture/nice_building.png", this.scene);

        const SLOT = 32; // espacement fixe entre bâtiments

        for (let bz = -100; bz < TRACK_LENGTH; bz += SLOT) {
            const trackX = getTrackX(bz);
            const nextX  = getTrackX(bz + SLOT);
            const trackY = getTrackY(bz);
            // Angle basé sur toute la longueur du slot pour une meilleure continuité
            const angle  = Math.atan2(nextX - trackX, SLOT);

            // BÂTIMENT PRINCIPAL --- largeur = slot - 1u de gap (garantit l'alignement)
            const bWidth  = SLOT - 1;              // 31 u fixe : s'emboîte parfaitement
            const bHeight = 22 + Math.random() * 32;  // 22 à 54 u
            const bDepth  = 18 + Math.random() * 14;  // 18 à 32 u

            const building = BABYLON.MeshBuilder.CreateBox("build" + bz, {
                width: bWidth, height: bHeight, depth: bDepth, wrap: true
            }, this.scene);
            // Centré au milieu du slot en Z
            const midZ  = bz + SLOT / 2;
            const midX  = getTrackX(midZ);
            const midY  = getTrackY(midZ);
            building.position = new BABYLON.Vector3(midX + 52 + bWidth / 2, midY + bHeight / 2, midZ);
            building.rotation.y = angle;

            const bMat = baseMats[Math.floor(Math.random() * baseMats.length)].clone("bMat" + bz);
            bMat.diffuseColor = medColors[Math.floor(Math.random() * medColors.length)];
            if (bMat.diffuseTexture) {
                bMat.diffuseTexture = bMat.diffuseTexture.clone();
                bMat.diffuseTexture.uScale = bWidth / 8;
                bMat.diffuseTexture.vScale = bHeight / 10;
            }
            building.material = bMat;

            // PENTHOUSE (60% des bâtiments)
            if (Math.random() > 0.4) {
                const phW = bWidth * (0.35 + Math.random() * 0.3);
                const phH = 5 + Math.random() * 10;
                const penthouse = BABYLON.MeshBuilder.CreateBox("pent" + bz, {
                    width: phW, height: phH, depth: bDepth * 0.65
                }, this.scene);
                penthouse.parent = building;
                penthouse.position.y = bHeight / 2 + phH / 2;
                penthouse.position.x = (Math.random() - 0.5) * (bWidth - phW) * 0.4;
                const pMat = new BABYLON.StandardMaterial("pMat" + bz, this.scene);
                pMat.diffuseColor = medColors[Math.floor(Math.random() * medColors.length)];
                penthouse.material = pMat;
            }

            // CHEMINÉE (40% des bâtiments)
            if (Math.random() > 0.6) {
                const chimneyH = 4 + Math.random() * 6;
                const chimney = BABYLON.MeshBuilder.CreateBox("chimney" + bz, {
                    width: 1.2, height: chimneyH, depth: 1.2
                }, this.scene);
                chimney.parent = building;
                chimney.position.y = bHeight / 2 + chimneyH / 2;
                chimney.position.x = (Math.random() - 0.5) * bWidth * 0.5;
                chimney.position.z = (Math.random() - 0.5) * bDepth * 0.4;
                const cMat = new BABYLON.StandardMaterial("chimMat" + bz, this.scene);
                cMat.diffuseColor = new BABYLON.Color3(0.52, 0.35, 0.22);
                chimney.material = cMat;
            }

            // BÂTIMENT DEUXIÈME PLAN (50% des cases)
            if (Math.random() > 0.5) {
                const b2W = SLOT - 1;
                const b2H = 14 + Math.random() * 28;
                const building2 = BABYLON.MeshBuilder.CreateBox("build2_" + bz, {
                    width: b2W, height: b2H, depth: 16
                }, this.scene);
                building2.position = new BABYLON.Vector3(
                    midX + 52 + bWidth + b2W / 2 + 5,
                    midY + b2H / 2, midZ
                );
                building2.rotation.y = angle;
                const b2Mat = new BABYLON.StandardMaterial("b2Mat" + bz, this.scene);
                b2Mat.diffuseColor = medColors[Math.floor(Math.random() * medColors.length)];
                building2.material = b2Mat;
            }
        }
    }

    initFinishLine() {
        const finishX = getTrackX(FINISH_LINE_Z);
        const finishY = getTrackY(FINISH_LINE_Z);
        
        // Groupe pour l'arche
        const gate = new BABYLON.TransformNode("finishGate", this.scene);
        gate.position = new BABYLON.Vector3(finishX, finishY, FINISH_LINE_Z);

        // Piliers
        const pillarMat = new BABYLON.StandardMaterial("pillarMat", this.scene);
        pillarMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        pillarMat.metallic = 1;

        [-35, 35].forEach(sideX => {
            const p = BABYLON.MeshBuilder.CreateBox("pillar", { width: 4, height: 40, depth: 4 }, this.scene);
            p.parent = gate;
            p.position.x = sideX;
            p.position.y = 20;
            p.material = pillarMat;
            
            // Neon sur le pilier
            const neon = BABYLON.MeshBuilder.CreateBox("neon", { width: 1, height: 38, depth: 1.1 }, this.scene);
            neon.parent = p;
            neon.position.x = sideX > 0 ? -2.1 : 2.1;
            const neonMat = new BABYLON.StandardMaterial("neonMat", this.scene);
            neonMat.emissiveColor = new BABYLON.Color3(1, 0, 0.5); // Magenta/Neon
            neon.material = neonMat;
        });

        // Arche transversale
        const bar = BABYLON.MeshBuilder.CreateBox("archBar", { width: 74, height: 8, depth: 6 }, this.scene);
        bar.parent = gate;
        bar.position.y = 40;
        bar.material = pillarMat;

        // Texte FINISH (emissive)
        const finishBanner = BABYLON.MeshBuilder.CreatePlane("banner", { width: 40, height: 6 }, this.scene);
        finishBanner.parent = bar;
        finishBanner.position.z = -3.1;
        const bannerMat = new BABYLON.StandardMaterial("bannerMat", this.scene);
        const bannerTex = new BABYLON.DynamicTexture("bannerTex", 512, this.scene);
        bannerTex.drawText("FINISH", null, null, "bold 140px Orbitron", "#ffffff", "#ff006e", true);
        bannerMat.emissiveTexture = bannerTex;
        finishBanner.material = bannerMat;

        // Sol Damier
        const checker = BABYLON.MeshBuilder.CreatePlane("checker", { width: 60, height: 10 }, this.scene);
        checker.parent = gate;
        checker.rotation.x = Math.PI / 2;
        checker.position.y = 0.1;
        const checkerMat = new BABYLON.StandardMaterial("checkerMat", this.scene);
        checkerMat.diffuseTexture = new BABYLON.Texture("https://raw.githubusercontent.com/Khaled-Rahmouni/JeuKhalilRiham/main/front/texture/asphalt_texture.jpg", this.scene); // Placeholder
        checkerMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        // On simule un damier avec une texture de grille ou DynamicTexture
        const dynamicChecker = new BABYLON.DynamicTexture("checkTex", 512, this.scene);
        const ctx = dynamicChecker.getContext();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0,0,512,512);
        ctx.fillStyle = "#000000";
        for(let i=0; i<8; i++) for(let j=0; j<8; j++) if((i+j)%2===0) ctx.fillRect(i*64, j*64, 64, 64);
        dynamicChecker.update();
        checkerMat.diffuseTexture = dynamicChecker;
        checker.material = checkerMat;

        return gate;
    }

    // ========== GLISSIÈRES DE SÉCURITÉ ==========
    initBarriers() {
        const barrierMat = new BABYLON.StandardMaterial("barrierMat", this.scene);
        barrierMat.diffuseColor = new BABYLON.Color3(0.88, 0.88, 0.88);
        barrierMat.specularColor = new BABYLON.Color3(1, 1, 1);
        barrierMat.specularPower = 80;

        const stripeMat = new BABYLON.StandardMaterial("barrierStripe", this.scene);
        stripeMat.emissiveColor = new BABYLON.Color3(0.9, 0.1, 0.05);
        stripeMat.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.05);

        const lBot = [], lTop = [], rBot = [], rTop = [];
        for (let z = -200; z < TRACK_LENGTH; z += 10) {
            const x = getTrackX(z), y = getTrackY(z);
            lBot.push(new BABYLON.Vector3(x - 40, y + 0.3, z));
            lTop.push(new BABYLON.Vector3(x - 40, y + 1.3, z));
            rBot.push(new BABYLON.Vector3(x + 40, y + 0.3, z));
            rTop.push(new BABYLON.Vector3(x + 40, y + 1.3, z));
        }

        const opt = { sideOrientation: BABYLON.Mesh.DOUBLESIDE };
        BABYLON.MeshBuilder.CreateRibbon("lBarrier", { pathArray: [lBot, lTop], ...opt }, this.scene).material = barrierMat;
        BABYLON.MeshBuilder.CreateRibbon("rBarrier", { pathArray: [rBot, rTop], ...opt }, this.scene).material = barrierMat;

        // Poteaux rouges tous les 80 unités
        for (let z = 0; z < TRACK_LENGTH; z += 80) {
            const x = getTrackX(z), y = getTrackY(z);
            [x - 40, x + 40].forEach((px, side) => {
                const post = BABYLON.MeshBuilder.CreateBox("post" + z + "_" + side, { width: 0.35, height: 1.3, depth: 0.35 }, this.scene);
                post.position = new BABYLON.Vector3(px, y + 0.65, z);
                post.material = stripeMat;
            });
        }
    }


    // ========== LAMPADAIRES ==========
    initStreetLights() {
        const poleMat = new BABYLON.StandardMaterial("poleMat", this.scene);
        poleMat.diffuseColor = new BABYLON.Color3(0.3, 0.32, 0.38);
        poleMat.specularColor = new BABYLON.Color3(0.7, 0.7, 0.7);
        poleMat.specularPower = 40;

        const bulbMat = new BABYLON.StandardMaterial("bulbMat", this.scene);
        bulbMat.emissiveColor = new BABYLON.Color3(1, 0.93, 0.62);
        bulbMat.diffuseColor = new BABYLON.Color3(1, 0.93, 0.62);

        for (let z = 40; z < TRACK_LENGTH; z += 130) {
            const x = getTrackX(z), y = getTrackY(z);

            const pole = BABYLON.MeshBuilder.CreateCylinder("lpole" + z, {
                diameter: 0.35, height: 12, tessellation: 6
            }, this.scene);
            pole.position = new BABYLON.Vector3(x + 45, y + 6, z);
            pole.material = poleMat;

            const arm = BABYLON.MeshBuilder.CreateCylinder("larm" + z, {
                diameter: 0.18, height: 5, tessellation: 5
            }, this.scene);
            arm.parent = pole;
            arm.position = new BABYLON.Vector3(-2.5, 5.5, 0);
            arm.rotation.z = Math.PI / 2;
            arm.material = poleMat;

            // Ampoule — brille grâce au GlowLayer existant
            const bulb = BABYLON.MeshBuilder.CreateSphere("lbulb" + z, {
                diameter: 1.1, segments: 5
            }, this.scene);
            bulb.parent = pole;
            bulb.position = new BABYLON.Vector3(-5, 5.5, 0);
            bulb.material = bulbMat;
        }
    }

    // ========== MARQUAGES AU SOL ==========
    initRoadMarkings() {
        const markMat = new BABYLON.StandardMaterial("markMat", this.scene);
        markMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
        markMat.emissiveColor = new BABYLON.Color3(0.12, 0.12, 0.12);

        for (let z = 40; z < TRACK_LENGTH; z += 28) {
            const x = getTrackX(z), y = getTrackY(z);
            const slope  = -Math.atan((getTrackY(z + 5) - getTrackY(z)) / 5);
            const yAngle =  Math.atan2(getTrackX(z + 5) - getTrackX(z), 5);

            const mark = BABYLON.MeshBuilder.CreateBox("mark" + z, {
                width: 0.5, height: 0.06, depth: 10
            }, this.scene);
            mark.position = new BABYLON.Vector3(x, y + 0.09, z);
            mark.rotation.x = slope;
            mark.rotation.y = yAngle;
            mark.material = markMat;
        }
    }

    // ========== SOLEIL GÉANT ==========
    initSun() {
        const sunMat = new BABYLON.StandardMaterial("sunSphereMat", this.scene);
        sunMat.emissiveColor = new BABYLON.Color3(1, 0.88, 0.38);
        sunMat.diffuseColor  = new BABYLON.Color3(0, 0, 0);

        const sunMesh = BABYLON.MeshBuilder.CreateSphere("sunSphere", {
            diameter: 160, segments: 8
        }, this.scene);
        sunMesh.position = new BABYLON.Vector3(-2800, 480, 2500);
        sunMesh.material = sunMat;

        // Halo autour du soleil (sphère plus grande, semi-transparente)
        const haloMat = new BABYLON.StandardMaterial("haloMat", this.scene);
        haloMat.emissiveColor = new BABYLON.Color3(1, 0.7, 0.2);
        haloMat.diffuseColor  = new BABYLON.Color3(0, 0, 0);
        haloMat.alpha = 0.18;
        const halo = BABYLON.MeshBuilder.CreateSphere("sunHalo", { diameter: 280, segments: 6 }, this.scene);
        halo.position = sunMesh.position.clone();
        halo.material = haloMat;
    }
}




function initBoosters() {
    const boosterFiles = [];

    // Matériau partagé pour la peau Nitro
    const nitroSkinPath = "texture/nitro_skin.png";

    const boosterPositions = [400, 800, 1200, 1600, 2000, 2400, 2800, 3200, 3600, 4000, 4400, 4800];

    for (let i = 0; i < boosterPositions.length; i++) {
        const isSuper = (i % 3 === 0);
        const bottleColor = isSuper ? "blue" : "yellow";
        
        // Création de la bouteille
        const bottle = BABYLON.MeshBuilder.CreateCylinder("nitro" + i, { diameter: 1.6, height: 2.8, tessellation: 12 }, scene);
        const neck = BABYLON.MeshBuilder.CreateCylinder("neck" + i, { diameter: 0.9, height: 0.8, tessellation: 8 }, scene);
        neck.parent = bottle;
        neck.position.y = 1.8;

        const bottleMat = new BABYLON.StandardMaterial("bottleMat" + i, scene);
        const tex = new BABYLON.Texture(nitroSkinPath, scene);
        bottleMat.diffuseTexture = tex;
        bottleMat.emissiveTexture = tex;
        // Tint pour le bleu si nécessaire
        if (isSuper) {
            bottleMat.diffuseColor = new BABYLON.Color3(0, 0.5, 1);
            bottleMat.emissiveColor = new BABYLON.Color3(0, 0.5, 1);
        } else {
            bottleMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
            bottleMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        }
        bottleMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        
        bottle.material = bottleMat;
        neck.material = bottleMat;

        const cz = boosterPositions[i];
        bottle.position.z = cz;
        bottle.position.x = getTrackX(cz) + (Math.random() - 0.5) * 15;
        bottle.position.y = getTrackY(cz) + 2.0;
        bottle.nitroType = bottleColor;
        bottle.userData = { offset: Math.random() * Math.PI * 2 };
        
        boosterFiles.push(bottle);
    }
    return boosterFiles;
}

function initRamps() {
    const ramps = [];

    
    // Matériau Carbone Fumé / Verre sombre (Translucide)
    const carbonGlassMat = new BABYLON.StandardMaterial("carbonGlassMat", scene);
    carbonGlassMat.diffuseColor = new BABYLON.Color3(0.01, 0.01, 0.01);
    carbonGlassMat.specularColor = new BABYLON.Color3(1, 1, 1);
    carbonGlassMat.alpha = 0.8;
    carbonGlassMat.backFaceCulling = false;

    // Couleurs Néon
    const neonCyan = new BABYLON.Color3(0, 1, 1);
    const neonPurple = new BABYLON.Color3(1, 0, 1);

    const rampPositions = [600, 1400, 2200, 3000, 3800, 4600];

    for (let i = 0; i < rampPositions.length; i++) {
        const isBarrel = (i % 2 === 1); // Alternance: Saut droit / Tonneau
        const color = isBarrel ? neonPurple : neonCyan;
        
        const rz = rampPositions[i];
        const rx = getTrackX(rz);
        const ry = getTrackY(rz);

        // --- GÉNÉRATION DU RUBAN (RIBBON) ---
        const pathLen = 12;
        const width = 16;
        const paths = [];
        
        // On crée un ruban en définissant les points de chaque côté
        const leftPath = [];
        const rightPath = [];
        
        for (let j = 0; j <= pathLen; j++) {
            const z = (j / pathLen) * 10;
            const progress = j / pathLen;
            
            // Parabole pour la hauteur
            const h = Math.pow(progress, 2) * 4;
            
            // Torsion pour le Barrel Roll (Spiral)
            let twist = 0;
            if (isBarrel) {
                twist = progress * Math.PI / 4; // Rotation de 45 deg max
            }
            
            // Calcul des positions locales (V-Wing style)
            const ly = h + Math.sin(twist) * (width / 2);
            const lx = - (width / 2) * Math.cos(twist);
            
            const ry_pt = h - Math.sin(twist) * (width / 2);
            const rx_pt = (width / 2) * Math.cos(twist);

            leftPath.push(new BABYLON.Vector3(lx, ly, z));
            rightPath.push(new BABYLON.Vector3(rx_pt, ry_pt, z));
        }
        paths.push(leftPath);
        paths.push(rightPath);

        const ribbon = BABYLON.MeshBuilder.CreateRibbon("rampRibbon" + i, { pathArray: paths }, scene);
        ribbon.position = new BABYLON.Vector3(rx, ry, rz);
        ribbon.material = carbonGlassMat;
        ribbon.isBarrel = isBarrel;

        // Surface de flèches (Neon Grid)
        const scrollMat = new BABYLON.StandardMaterial("scrollMat" + i, scene);
        const tex = new BABYLON.Texture("texture/ramp_arrow.png", scene);
        tex.vScale = 4.0; // Plus de petites flèches
        scrollMat.diffuseTexture = tex;
        scrollMat.emissiveTexture = tex;
        scrollMat.emissiveColor = color;
        scrollMat.diffuseTexture.hasAlpha = true;
        scrollMat.useAlphaFromDiffuseTexture = true;
        ribbon.material = scrollMat; // Toute la surface est active
        ribbon.userData = { material: scrollMat };

        // --- LISERÉS NÉON (Tubes fins sur les bords) ---
        const tubeL = BABYLON.MeshBuilder.CreateTube("tubeL" + i, { path: leftPath, radius: 0.15, tessellation: 6 }, scene);
        tubeL.parent = ribbon;
        const tubeR = BABYLON.MeshBuilder.CreateTube("tubeR" + i, { path: rightPath, radius: 0.15, tessellation: 6 }, scene);
        tubeR.parent = ribbon;
        
        const neonTubeMat = new BABYLON.StandardMaterial("neonTubeMat" + i, scene);
        neonTubeMat.emissiveColor = color;
        neonTubeMat.diffuseColor = new BABYLON.Color3(0, 0, 0);
        tubeL.material = neonTubeMat;
        tubeR.material = neonTubeMat;

        // Inclinaison ajustée à la route
        const slope = (getTrackY(rz + 5) - getTrackY(rz)) / 5;
        ribbon.rotation.x = -Math.atan(slope);

        ramps.push(ribbon);
    }
    return ramps;
}


function initTrackScreens() {
    const screens = [];
    const screenPositions = [500, 1500, 2500, 3500, 4500];
    
    for (let i = 0; i < screenPositions.length; i++) {
        const z = screenPositions[i];
        const x = getTrackX(z) - 50;
        const y = getTrackY(z) + 15;

        const frame = BABYLON.MeshBuilder.CreateBox("screenFrame" + i, { width: 42, height: 26, depth: 2 }, scene);
        frame.position = new BABYLON.Vector3(x, y, z);
        frame.rotation.y = Math.PI / 4;
        
        const frameMat = new BABYLON.StandardMaterial("frameMat", scene);
        frameMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        frame.material = frameMat;

        const support = BABYLON.MeshBuilder.CreateBox("screenSupport" + i, { width: 2, height: y, depth: 2 }, scene);
        support.position = new BABYLON.Vector3(x, y / 2, z);
        support.material = frameMat;

        const screen = BABYLON.MeshBuilder.CreatePlane("trackScreen" + i, { width: 40, height: 24 }, scene);
        screen.parent = frame;
        screen.position.z = -1.1;
        
        // --- TEXTURE FIXE "NITRO SERIES" (Fini les ricochets) ---
        const screenMat = new BABYLON.StandardMaterial("screenMat" + i, scene);
        const tex = new BABYLON.Texture("texture/nitro_blue.png", scene);
        screenMat.diffuseTexture = tex;
        screenMat.emissiveTexture = tex;
        screenMat.emissiveColor = new BABYLON.Color3(0.5, 0.5, 1);
        screen.material = screenMat;
        
        screens.push(screen);
    }
    return screens;
}
//bmw m4



class Car {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        // --- ÉTAT ---
        this.velocity = 0;
        this.velocityY = 0;
        this.angle = 0;
        this.visualAngle = 0;
        this.boostEnergy = 0;
        this.boostActive = false;
        this.shockwaveActive = false;
        this.isDrifting = false;
        this.isDrafting = false;

        this.gravity = 0.04;
        this.targetBodyRoll = 0;
        this.targetBodyPitch = 0;

        // --- MESH ---
        this.mesh = BABYLON.MeshBuilder.CreateBox("car", {
            width: CAR_DIMENSIONS.width,
            height: CAR_DIMENSIONS.height,
            depth: CAR_DIMENSIONS.depth
        }, this.scene);
        this.mesh.position = new BABYLON.Vector3(10, 0.75, -12);
        this.mesh.isVisible = false;

        // Cible de Caméra Stable (pour éviter que la cam tourne en tonneau)
        this.camTarget = new BABYLON.TransformNode("camTarget", this.scene);
        this.camera.lockedTarget = this.camTarget;

        // Modèle 3D Réel
        this.realCarMesh = null;
        this.loadModel();

        // --- OMBRE ---
        this.createShadow();
    }


    createShadow() {
        this.shadow = BABYLON.MeshBuilder.CreatePlane("carShadow", { width: 3.5, height: 6 }, this.scene);
        this.shadow.rotation.x = Math.PI / 2;
        this.shadow.isPickable = false;

        const dynamicTexture = new BABYLON.DynamicTexture("shadowTex", 128, this.scene);
        const context = dynamicTexture.getContext();
        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, "rgba(0,0,0,0.7)");
        gradient.addColorStop(0.8, "rgba(0,0,0,0.2)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);
        dynamicTexture.update();

        const shadowMat = new BABYLON.StandardMaterial("shadowMat", this.scene);
        shadowMat.diffuseTexture = dynamicTexture;
        shadowMat.useAlphaFromDiffuseTexture = true;
        shadowMat.specularColor = new BABYLON.Color3(0, 0, 0);
        shadowMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
        this.shadow.material = shadowMat;
        this.shadow.position.y = 0.1;
    }

    loadModel() {
        // ... (Code de chargement GLB inchangé)
        BABYLON.SceneLoader.ImportMeshAsync("", "./", "bmw_m4.glb", this.scene).then((result) => {
            console.log("M4 Classe Car chargée !");
            this.realCarMesh = result.meshes[0];
            this.realCarMesh.parent = this.mesh;
            this.realCarMesh.scaling = new BABYLON.Vector3(CAR_DIMENSIONS.scaling, CAR_DIMENSIONS.scaling, CAR_DIMENSIONS.scaling);
            this.realCarMesh.rotationQuaternion = null;
            this.realCarMesh.position.y = CAR_DIMENSIONS.modelOffsetY;

            result.meshes.forEach(m => {
                if (m.material) {
                    m.material.albedoColor = new BABYLON.Color3(0.04, 0.04, 0.04);
                    m.material.metallic = 0.6;
                    m.material.roughness = 0.6;
                }
            });
        });
    }

    update(keys, inputState, isRacing, ramps, boosterCubes, photoCallback) {
        if (!isRacing) {
            this.velocity = 0;
            this.boostActive = false;
            return;
        }

        this.isDrifting = false;
        this.visualAngle = this.angle;

        // --- ALIGNEMENT AUTO ---
        const nextZ = this.mesh.position.z + 15;
        const trackAngle = Math.atan2(getTrackX(nextZ) - getTrackX(this.mesh.position.z), 15);

        // --- BOOST & SHOCKWAVE (DOUBLE TAP SPACE) ---
        if (keys[' ']) {
            if (!this.wasSpacePressed) {
                const now = Date.now();
                if (now - (this.lastSpacePress || 0) < 300 && this.boostEnergy >= 95) {
                    this.shockwaveActive = true;
                    // TODO: trigger shockwave sound
                }
                this.lastSpacePress = now;
            }
            this.wasSpacePressed = true;

            if (this.boostEnergy > 0) {
                this.boostActive = true;
                this.boostEnergy = Math.max(this.boostEnergy - (this.shockwaveActive ? 1.5 : 0.6), 0);
            } else {
                this.boostActive = false;
                this.shockwaveActive = false;
            }
        } else {
            this.boostActive = false;
            this.shockwaveActive = false;
            this.wasSpacePressed = false;
        }

        // --- PHYSIQUE ---
        let targetMax = this.boostActive ? (this.shockwaveActive ? 650 : 550) : 350;
        let accel = this.boostActive ? (this.shockwaveActive ? 25 : 15) : 4.5;
        if (this.shockwaveActive) targetMax = 1000;

        if (keys['ArrowUp']) this.velocity = Math.min(this.velocity + accel, targetMax);
        else if (keys['ArrowDown']) this.velocity = Math.max(this.velocity - 5, -50);
        else {
            if (this.velocity > 0) this.velocity = Math.max(this.velocity - 0.8, 0);
            else if (this.velocity < 0) this.velocity = Math.min(this.velocity + 1.5, 0);
        }

        if (inputState.isDriftMode && this.velocity > 80 && (keys['ArrowLeft'] || keys['ArrowRight'])) {
            this.isDrifting = true;
        }

        let turnSpeed = this.boostActive ? 0.025 : 0.055;
        if (this.isDrifting) turnSpeed = 0.06;

        this.targetBodyRoll = 0;
        this.targetBodyPitch = 0;

        if (keys['ArrowLeft']) {
            this.angle -= turnSpeed;
            this.targetBodyRoll = 0.15;
            if (this.isDrifting) this.visualAngle = this.angle - 0.25;
        } else if (keys['ArrowRight']) {
            this.angle += turnSpeed;
            this.targetBodyRoll = -0.15;
            if (this.isDrifting) this.visualAngle = this.angle + 0.25;
        } else {
            // FINI l'assistance ! La voiture garde son angle.
            // On ne la force plus à "se remettre droite" (trackAngle)
        }

        if (this.isDrifting) this.targetBodyRoll *= 2.0;
        if (keys['ArrowUp'] || this.boostActive) this.targetBodyPitch = -0.05;
        else if (keys['ArrowDown']) this.targetBodyPitch = 0.08;

        // --- MOUVEMENT ---
        let moveStep = ((this.velocity / 3.6) / 60) * 1.2;
        this.mesh.position.x += Math.sin(this.angle) * moveStep;
        this.mesh.position.z += Math.cos(this.angle) * moveStep;
        this.mesh.rotation.y = this.visualAngle;

        // --- MISE À JOUR CIBLE CAMÉRA (STABILISATION) ---
        // On suit la position mais on lisse les rotations et le tangage
        this.camTarget.position.x = this.mesh.position.x;
        this.camTarget.position.y = this.mesh.position.y + 1.5; // Offset vertical pour éviter que la cam passe sous le sol
        this.camTarget.position.z = this.mesh.position.z;
        this.camTarget.rotation.y = this.angle;

        // --- GRAVITÉ ET SOL ---
        this.velocityY -= this.gravity;
        this.mesh.position.y += this.velocityY;

        const groundY = getTrackY(this.mesh.position.z);
        const standY = groundY + 0.75;

        if (this.mesh.position.y <= standY) {
            if (this.velocityY < -0.1) {
                this.camera.radius += Math.abs(this.velocityY) * 5;
                if (this.realCarMesh) this.realCarMesh.position.y = -0.4;
            }
            this.mesh.position.y = standY;
            this.velocityY = 0;

            const slope = (getTrackY(this.mesh.position.z + 5) - getTrackY(this.mesh.position.z)) / 5;
            const targetRotX = -Math.atan(slope) + this.targetBodyPitch;
            this.mesh.rotation.x = BABYLON.Scalar.Lerp(this.mesh.rotation.x, targetRotX, 0.12);

            const currentZ = this.mesh.rotation.z;
            const nearestFullRotation = Math.round(currentZ / (Math.PI * 2)) * (Math.PI * 2);
            const targetZ = nearestFullRotation + this.targetBodyRoll;
            this.mesh.rotation.z = BABYLON.Scalar.Lerp(currentZ, targetZ, 0.15);
        } else {
            // Anticipation de l'atterrissage (si très proche du sol, on commence à redresser)
            if (this.mesh.position.y < standY + 3) {
                const nearestFullRotation = Math.round(this.mesh.rotation.z / (Math.PI * 2)) * (Math.PI * 2);
                this.mesh.rotation.z = BABYLON.Scalar.Lerp(this.mesh.rotation.z, nearestFullRotation, 0.1);
            } else if (Math.abs(this.mesh.rotation.z % (Math.PI * 2)) > 0.1) {
                this.mesh.rotation.z += 0.12;
            }
        }

        if (this.realCarMesh && this.realCarMesh.position.y < 0) {
            this.realCarMesh.position.y = BABYLON.Scalar.Lerp(this.realCarMesh.position.y, 0, 0.1);
        }

        // --- SENSATION DE VITESSE (CAMÉRA) ---
        this.camera.radius = BABYLON.Scalar.Lerp(this.camera.radius, 20, 0.05);

        const baseFov = 0.8;
        const maxFov = 1.35; // Le champ de vision s'élargit avec la vitesse
        const targetFov = baseFov + (Math.max(0, this.velocity) / 800) * (maxFov - baseFov);
        this.camera.fov = BABYLON.Scalar.Lerp(this.camera.fov || baseFov, targetFov, 0.08);

        // Légères vibrations pour l'immersion à plus de 200 km/h
        if (this.velocity > 200) {
            const shake = (this.velocity - 200) / 600 * 0.15;
            this.camTarget.position.x += (Math.random() - 0.5) * shake;
            this.camTarget.position.y += (Math.random() - 0.5) * shake;
        }

        // --- RAMPES ---
        for (const r of ramps) {
            if (this.mesh.position.y <= standY + 1.0 && this.velocity > 50) {
                if (Math.abs(this.mesh.position.x - r.position.x) < 8.5 && Math.abs(this.mesh.position.z - r.position.z) < 5) {
                    this.velocityY = Math.max(0.7, (this.velocity / 350));
                    this.mesh.position.y += 0.5;
                    this.mesh.rotation.x = -0.3;
                    if (r.isBarrel) this.mesh.rotation.z += 0.2;
                }
            }
        }

        // --- MISE À JOUR OMBRE ---
        const heightAboveGround = this.mesh.position.y - groundY - 0.75;
        
        if (this.shadow) {
            this.shadow.position.x = this.mesh.position.x;
            this.shadow.position.z = this.mesh.position.z;
            this.shadow.position.y = groundY + 0.1;
            this.shadow.rotation.y = this.visualAngle;
            
            // L'ombre s'estompe et s'agrandit avec la hauteur
            const alpha = Math.max(0, 0.7 - heightAboveGround / 15);
            this.shadow.material.alpha = alpha;
            const scale = 1 + heightAboveGround * 0.15;
            this.shadow.scaling = new BABYLON.Vector3(scale, scale, 1);
        }
    }
}


function initPlayer(scene, camera) {
    return new Car(scene, camera);
}

function setupInputs() {
    const keys = {};
    const inputState = { isDriftMode: false };
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if (e.key.toLowerCase() === 'f') inputState.isDriftMode = !inputState.isDriftMode;
        if (e.key === ' ') inputState.isDriftMode = false;
    });
    window.addEventListener('keyup', (e) => { keys[e.key] = false; });
    return { keys, inputState };
}



function initBots() {
    const bots = [];

    // Créer les boîtes de collision en premier
    BOT_DATA.forEach((data, index) => {
        const botMesh = BABYLON.MeshBuilder.CreateBox("bot" + index, {
            width: CAR_DIMENSIONS.width,
            height: CAR_DIMENSIONS.height,
            depth: CAR_DIMENSIONS.depth
        }, scene);
        botMesh.position = new BABYLON.Vector3(data.x, 0.75, data.z);
        botMesh.isVisible = false;
        bots.push({
            mesh: botMesh,
            maxSpeed: data.maxSpeed,
            currentSpeed: 0,
            colorBase: data.color,
            boostTimer: 0,
            boostCooldown: Math.floor(Math.random() * 180) + 120, // Démarrage décalé entre bots
            wobble: Math.random() * Math.PI * 2,                  // Phase de trajectoire aléatoire
            laneOffset: data.x,                                   // Cible la ligne de départ de config.js
            shadow: createBotShadow(botMesh, scene)
        });
    });

    function createBotShadow(mesh, scene) {
        const shadow = BABYLON.MeshBuilder.CreatePlane("botShadow", { width: 3.5, height: 6 }, scene);
        shadow.rotation.x = Math.PI / 2;
        shadow.isPickable = false;
        const shadowMat = new BABYLON.StandardMaterial("botShadowMat", scene);
        const dynamicTexture = new BABYLON.DynamicTexture("botShadowTex", 64, scene);
        const context = dynamicTexture.getContext();
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, "rgba(0,0,0,0.7)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        dynamicTexture.update();
        shadowMat.diffuseTexture = dynamicTexture;
        shadowMat.useAlphaFromDiffuseTexture = true;
        shadowMat.specularColor = new BABYLON.Color3(0, 0, 0);
        shadow.material = shadowMat;
        return shadow;
    }


    // Charger le modèle BMW M4 UNE SEULE FOIS, puis instancier pour chaque bot
    BABYLON.SceneLoader.LoadAssetContainerAsync("", "bmw_m4.glb", scene).then(container => {
        BOT_DATA.forEach((data, index) => {
            const entries = container.instantiateModelsToScene(
                name => `bot${index}_${name}`,
                false
            );

            const rootNode = entries.rootNodes[0];
            rootNode.parent = bots[index].mesh;
            rootNode.scaling = new BABYLON.Vector3(CAR_DIMENSIONS.scaling, CAR_DIMENSIONS.scaling, CAR_DIMENSIONS.scaling);
            rootNode.rotationQuaternion = null;
            rootNode.rotation.y = 0;
            rootNode.position.y = CAR_DIMENSIONS.modelOffsetY;

            // Appliquer la couleur unique à chaque bot
            rootNode.getChildMeshes().forEach(mesh => {
                if (mesh.material) {
                    const mat = mesh.material.clone(`botMat${index}_${mesh.name}`);
                    mat.albedoColor = data.color;
                    mat.metallic = 0.9;
                    mat.roughness = 0.1;
                    mesh.material = mat;
                }
            });
        });
    });

    return bots;
}











// ========== VARIABLES DU JEU ==========
let gameActive = true;
let isRacing = false;
let photoCooldown = 0;

// Initialisation
const circuit = new CoteAzur(scene);
circuit.initTrack();
circuit.initBuildings();
circuit.initBarriers();
circuit.initStreetLights();
circuit.initRoadMarkings();
circuit.initSun();
const finishLine = circuit.initFinishLine();
const boosterCubes = initBoosters();
const ramps = initRamps();
const trackScreens = initTrackScreens();
const bots = initBots();

const playerCar = initPlayer(scene, camera);
const driftParticles = initDriftParticles(playerCar.mesh);
const { keys, inputState } = setupInputs();
const { ctxMap } = initMinimap();

const photoButton = document.getElementById('photoButton');
if (photoButton) photoButton.addEventListener('click', () => takePhoto(engine, camera));

// Moteur Audio
const audio = new AudioManager(scene);
const startAudio = () => { 
    audio.init(); 
    window.removeEventListener('keydown', startAudio); 
    window.removeEventListener('click', startAudio);
};
window.addEventListener('keydown', startAudio);
window.addEventListener('click', startAudio);

startCountdown(() => { isRacing = true; });

// Ul pour Takedown
const takedownUI = document.createElement("div");
takedownUI.style = "position:absolute; top:30%; left:50%; transform:translate(-50%,-50%) scale(0); color:#ff00ff; font-family:'Impact', sans-serif; font-size:100px; text-shadow:0 0 20px #ff00ff, 0 0 50px #fff; transition:transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity:0; pointer-events:none; z-index:1000;";
takedownUI.innerText = "TAKEDOWN !";
document.body.appendChild(takedownUI);

function triggerTakedownMsg() {
    takedownUI.style.opacity = "1";
    takedownUI.style.transform = "translate(-50%, -50%) scale(1)";
    setTimeout(() => {
        takedownUI.style.opacity = "0";
        takedownUI.style.transform = "translate(-50%, -50%) scale(1.5)";
    }, 1500);
}

// ========== BOUCLE DE RENDU ==========
engine.runRenderLoop(() => {
    if (!gameActive) {
        driftParticles.emitRate = 0;
        scene.render();
        return;
    }

    // Mise à jour de la voiture
    playerCar.update(keys, inputState, isRacing, ramps, boosterCubes, () => {
        if (photoCooldown <= 0) { takePhoto(engine, camera); photoCooldown = 300; }
    });
    
    // Particules de Drift
    driftParticles.emitRate = playerCar.isDrifting ? 80 : 0;

    // --- BOOSTERS (COLLECTE) ---
    for (let i = boosterCubes.length - 1; i >= 0; i--) {
        const bottle = boosterCubes[i];
        bottle.rotation.y += 0.04;
        const offset = bottle.userData ? bottle.userData.offset : 0;
        bottle.position.y += Math.sin(Date.now() / 200 + offset) * 0.01;

        if (BABYLON.Vector3.Distance(playerCar.mesh.position, bottle.position) < 4.0) {
            const reward = bottle.nitroType === "blue" ? 60 : 25;
            playerCar.boostEnergy = Math.min(playerCar.boostEnergy + reward, 100);
            bottle.dispose();
            boosterCubes.splice(i, 1);
        }
    }

    // --- COLLISIONS MURS ---
    const trackCenterX = getTrackX(playerCar.mesh.position.z);
    const roadLeft = trackCenterX - 30;
    const roadRight = trackCenterX + 30;
    const sidewalkLeft = trackCenterX - 40;
    const sidewalkRight = trackCenterX + 40;

    // On ne gère les collisions murs que si on est proche du sol
    const groundY = getTrackY(playerCar.mesh.position.z);
    if (playerCar.mesh.position.y < groundY + 2.5) {
        if (playerCar.mesh.position.x < roadLeft && playerCar.mesh.position.x >= sidewalkLeft) {
            playerCar.mesh.position.x = roadLeft;
            playerCar.velocity = Math.max(playerCar.velocity * 0.95, 0);
        } else if (playerCar.mesh.position.x < sidewalkLeft) {
            playerCar.mesh.position.x = sidewalkLeft;
            playerCar.angle = Math.PI - playerCar.angle; // Rebond
            playerCar.velocity = Math.max(playerCar.velocity * 0.6, 0);
            if (photoCooldown <= 0) { takePhoto(engine, camera); photoCooldown = 300; }
        }

        if (playerCar.mesh.position.x > roadRight && playerCar.mesh.position.x <= sidewalkRight) {
            playerCar.mesh.position.x = roadRight;
            playerCar.velocity = Math.max(playerCar.velocity * 0.95, 0);
        } else if (playerCar.mesh.position.x > sidewalkRight) {
            playerCar.mesh.position.x = sidewalkRight;
            playerCar.angle = Math.PI - playerCar.angle;
            playerCar.velocity = Math.max(playerCar.velocity * 0.6, 0);
            if (photoCooldown <= 0) { takePhoto(engine, camera); photoCooldown = 300; }
        }
    }

    if (photoCooldown > 0) photoCooldown--;

    // --- BOTS (IA AMÉLIORÉE) ---
    bots.forEach((bot, idx) => {
        if (bot.isDestroyed) return; // Ne bouge plus s'il est détruit

        if (isRacing && bot.mesh.position.z < FINISH_LINE_Z + 200) {

            // 1. SYSTÈME DE BOOST ALÉATOIRE
            if (bot.boostTimer > 0) {
                bot.boostTimer--;
            } else if (bot.boostCooldown > 0) {
                bot.boostCooldown--;
            } else {
                // Déclenche un boost de 2 à 4 secondes
                bot.boostTimer = 120 + Math.floor(Math.random() * 120);
                // Prochain boost dans 5 à 10 secondes
                bot.boostCooldown = 300 + Math.floor(Math.random() * 300);
            }

            const isBoosting = bot.boostTimer > 0;
            let botMaxKmh = bot.maxSpeed * 100 * (isBoosting ? 1.4 : 1.0);
            let botAccel   = isBoosting ? 4 : 2;
            bot.currentSpeed = Math.min(bot.currentSpeed + botAccel, botMaxKmh);
            let botMoveStep = (bot.currentSpeed / 3.6) / 60;
            bot.mesh.position.z += botMoveStep;

            // 2. TRAJECTOIRE IMPARFAITE (oscillation pour ressembler à un humain)
            bot.wobble += 0.018;
            const wobbleOffset = Math.sin(bot.wobble) * 3;

            const offset = bot.laneOffset + wobbleOffset;
            const targetX = getTrackX(bot.mesh.position.z) + offset;
            const targetY = getTrackY(bot.mesh.position.z) + 0.75;
            bot.mesh.position.x += (targetX - bot.mesh.position.x) * 0.15;
            bot.mesh.position.y = targetY;

            const nextZ = bot.mesh.position.z + 10;
            bot.mesh.rotation.y = Math.atan2(getTrackX(nextZ) + offset - bot.mesh.position.x, 10);
            bot.mesh.rotation.x = -Math.atan((getTrackY(nextZ) - getTrackY(bot.mesh.position.z)) / 10);

            // Mise à jour visuels (Ombre)
            if (bot.shadow) {
                bot.shadow.position.x = bot.mesh.position.x;
                bot.shadow.position.z = bot.mesh.position.z;
                bot.shadow.position.y = targetY - 0.65; // Ajusté pour le sol
                bot.shadow.rotation.y = bot.mesh.rotation.y;
            }
        }
    });

    // 3. COLLISIONS JOUEUR <-> BOTS (Aspiration + Takedown)
    playerCar.isDrafting = false;
    bots.forEach(bot => {
        if (bot.isDestroyed) return;

        const dx = playerCar.mesh.position.x - bot.mesh.position.x;
        const dz = playerCar.mesh.position.z - bot.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // ASPIRATION (Drafting) : On est juste derrière le bot
        if (dz < -5 && dz > -40 && Math.abs(dx) < 3.5) {
            playerCar.isDrafting = true;
            if (playerCar.boostEnergy < 100) playerCar.boostEnergy += 0.2; // Remplissage gratuit
        }

        // COLLISION
        if (dist < 5.5 && dist > 0.01) {
            if (playerCar.boostActive || playerCar.shockwaveActive) {
                // TAKEDOWN !
                bot.isDestroyed = true;
                bot.mesh.getChildMeshes().forEach(m => m.dispose()); // Fait disparaître le modèle
                if (bot.shadow) bot.shadow.dispose();
                playerCar.boostEnergy = 100; // Refill complet
                triggerTakedownMsg();
                audio.playTakedownSound();
            } else {
                // Choc normal
                const push = (5.5 - dist) / 5.5;
                playerCar.mesh.position.x += (dx / dist) * push * 2.5;
                playerCar.velocity = Math.max(playerCar.velocity * (1 - push * 0.3), 0);
                audio.playCrashSound(0.2);
            }
        }
    });

    // Mise à jour de l'audio procédural
    audio.updateEngine(playerCar.velocity, playerCar.boostActive, playerCar.shockwaveActive);

    // --- CAMÉRA & LUMIERE ---
    light.position.x = playerCar.mesh.position.x;
    light.position.y = playerCar.mesh.position.y + 20;
    light.position.z = playerCar.mesh.position.z;

    // --- UI & HUD ---
    updateMinimap(ctxMap, playerCar.mesh, bots);

    let currentPlace = 1;
    bots.forEach(b => { if (b.mesh.position.z > playerCar.mesh.position.z) currentPlace++; });

    updateHUD(
        Math.floor(Math.abs(playerCar.velocity)),
        Math.max(0, Math.floor(playerCar.mesh.position.z)),
        currentPlace,
        bots.length,
        playerCar.boostEnergy,
        playerCar.boostActive,
        playerCar.isDrifting,
        inputState.isDriftMode
    );

    // --- FINISH ---
    if (playerCar.mesh.position.z >= FINISH_LINE_Z) {
        endGame(true, currentPlace);
    }

    // --- ANIMATION EAU (scroll de texture) ---
    const eauTex = circuit.materials.eauMat.diffuseTexture;
    if (eauTex) {
        eauTex.uOffset += 0.00018;
        eauTex.vOffset += 0.00012;
    }

    scene.render();
});

function endGame(finished, place = 1) {
    gameActive = false;
    showGameOver(finished, place, playerCar.mesh.position.z);
}

window.addEventListener("resize", () => { engine.resize(); });


