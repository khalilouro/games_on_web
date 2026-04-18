let firstPivotCell = null;
let firstGroup = null;
let cells = [];
let currentImage = '';
const correct = [
    "0% 0%", "33.3333% 0%", "66.6667% 0%", "100% 0%",
    "0% 50%", "33.3333% 50%", "66.6667% 50%", "100% 50%",
    "0% 100%", "33.3333% 100%", "66.6667% 100%", "100% 100%"
];

const levels = {
    1: { image: 'asset/image/image1.jpg', title: "Niveau 1" },
    2: { image: 'asset/image/image2.png', title: "Niveau 2" },
    3: { image: 'asset/image/image3.png', title: "Niveau 3" },
    4: { image: 'asset/image/image5.png', title: "Niveau 4 - Sous l'OcÃ©an" },
    5: { image: 'asset/image/image6.png', title: "Niveau 5 - Cosmos" },
    6: { image: 'asset/image/image7.png', title: "Niveau 6 - ForÃªt Magique" },
    7: { image: 'asset/image/image8.png', title: "Niveau 7 - Pyramides" },
    8: { image: 'asset/image/image9.png', title: "Niveau 8 - Cyberpunk" },
    9: { image: 'asset/image/image10.png', title: "Niveau 9 - Repaire du Dragon" }
};
const ProgressManager = {
    get() {
        const saved = localStorage.getItem('puzzleProgress');
        const defaultState = { currentLevel: 1, unlockedLevels: [1], revealedPieces: 0 };
        if (!saved) return defaultState;
        
        try {
            const parsed = JSON.parse(saved);
            // On s'assure que unlockedLevels existe bien (fusion avec l'Ã©tat par dÃ©faut)
            return { 
                currentLevel: parsed.currentLevel || 1, 
                unlockedLevels: parsed.unlockedLevels || [1], 
                revealedPieces: parsed.revealedPieces || 0 
            };
        } catch(e) {
            return defaultState;
        }
    },
    save(progress) {
        localStorage.setItem('puzzleProgress', JSON.stringify(progress));
    },
    completeLevel(level) {
        let p = this.get();
        if (p.revealedPieces < 9) {
            p.revealedPieces++;
        }
        const nextLevel = level + 1;
        if (levels[nextLevel]) {
            // SÃ©curitÃ© supplÃ©mentaire au cas oÃ¹ unlockedLevels ne serait pas un tableau
            if (!Array.isArray(p.unlockedLevels)) {
                p.unlockedLevels = [1];
            }
            if (!p.unlockedLevels.includes(nextLevel)) {
                p.unlockedLevels.push(nextLevel);
            }
            p.currentLevel = nextLevel;
        }
        this.save(p);
    }
};
function initPuzzle(rows, cols) {
    const grid = document.getElementById('puzzle-grid');
    grid.innerHTML = "";
    grid.style.backgroundImage = "none";

    const bgSize = `${cols * 100}% ${rows * 100}%`;

    const correctPositions = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            let posX = cols > 1 ? (x / (cols - 1)) * 100 : 0;
            let posY = rows > 1 ? (y / (rows - 1)) * 100 : 0;
            // On arrondit pour Ã©viter les problÃ¨mes de prÃ©cision flottante
            const posString = `${posX.toFixed(4)}% ${posY.toFixed(4)}%`;
            correctPositions.push(posString);
        }
    }

    let images = [...correctPositions];
    for (let i = images.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [images[i], images[j]] = [images[j], images[i]];
    }

    cells = [];
    for (let i = 0; i < rows * cols; i++) {
        let cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.backgroundImage = `url('${currentImage}')`;
        cell.style.backgroundSize = bgSize;
        cell.style.backgroundPosition = images[i];
        cell.dataset.pos = images[i]; // Stockage fiable pour la vÃ©rification
        cell.onclick = function () { handleInteraction(this, cols, rows); };
        grid.appendChild(cell);
        cells.push(cell);
    }
    checkFusion(cols, rows);
}

function handleInteraction(clickedCell, cols, rows) {
    if (firstGroup === null) {
        firstGroup = getGroup(clickedCell, cols, rows);
        firstPivotCell = clickedCell;
        firstGroup.forEach(c => c.style.outline = "4px solid yellow");
    } else {
        let secondPivotCell = clickedCell;
        let secondGroup = getGroup(clickedCell, cols, rows);

        if (secondGroup.some(c => firstGroup.includes(c))) {
            firstGroup.forEach(c => c.style.outline = "none");
            firstGroup = null;
            return;
        }

        executeMove(firstPivotCell, secondPivotCell, cols, rows);
        firstGroup.forEach(c => c.style.outline = "none");
        firstGroup = null;
        checkFusion(cols, rows);
        checkWin(cols, rows);
    }
}

function executeMove(p1, p2, cols, rows) {
    let idx1 = cells.indexOf(p1);
    let idx2 = cells.indexOf(p2);
    let dx = (idx2 % cols) - (idx1 % cols);
    let dy = Math.floor(idx2 / cols) - Math.floor(idx1 / cols);

    let targets = firstGroup.map(s => {
        let sIdx = cells.indexOf(s);
        let tx = (sIdx % cols) + dx;
        let ty = Math.floor(sIdx / cols) + dy;
        return (tx >= 0 && tx < cols && ty >= 0 && ty < rows) ? cells[ty * cols + tx] : null;
    });

    if (targets.includes(null)) return;

    let snapshot = new Map();
    cells.forEach(c => snapshot.set(c, c.dataset.pos));

    let displaced = targets.filter(t => !firstGroup.includes(t));
    let displacedImgs = displaced.map(t => snapshot.get(t));

    firstGroup.forEach((s, i) => {
        const newPos = snapshot.get(s);
        targets[i].style.backgroundPosition = newPos;
        targets[i].dataset.pos = newPos;
    });

    let vacated = firstGroup.filter(s => !targets.includes(s));
    vacated.forEach((v, i) => {
        const newPos = displacedImgs.shift();
        v.style.backgroundPosition = newPos;
        v.dataset.pos = newPos;
    });
}

function isMatch(c1, c2, dx, dy, cols, rows) {
    let p1 = c1.dataset.pos.split(" ").map(parseFloat);
    let p2 = c2.dataset.pos.split(" ").map(parseFloat);

    let stepX = 100 / (cols - 1);
    let stepY = 100 / (rows - 1);

    if (dx !== 0) return Math.abs(p1[1] - p2[1]) < 0.1 && Math.abs((p2[0] - p1[0]) - stepX) < 0.5;
    if (dy !== 0) return Math.abs(p1[0] - p2[0]) < 0.1 && Math.abs((p2[1] - p1[1]) - stepY) < 0.5;
    return false;
}

function checkFusion(cols, rows) {
    cells.forEach(c => c.classList.remove('merged-right', 'merged-left', 'merged-top', 'merged-bottom'));
    for (let i = 0; i < cells.length; i++) {
        let x = i % cols, y = Math.floor(i / cols);
        if (x < cols - 1 && isMatch(cells[i], cells[i + 1], 1, 0, cols, rows)) {
            cells[i].classList.add('merged-right');
            cells[i + 1].classList.add('merged-left');
        }
        if (y < rows - 1 && isMatch(cells[i], cells[i + cols], 0, 1, cols, rows)) {
            cells[i].classList.add('merged-bottom');
            cells[i + cols].classList.add('merged-top');
        }
    }
}

function getGroup(cell, cols, rows) {
    let group = [], stack = [cell];
    while (stack.length > 0) {
        let curr = stack.pop();
        if (group.includes(curr)) continue;
        group.push(curr);
        let idx = cells.indexOf(curr);
        if (curr.classList.contains('merged-right')) stack.push(cells[idx + 1]);
        if (curr.classList.contains('merged-left')) stack.push(cells[idx - 1]);
        if (curr.classList.contains('merged-bottom')) stack.push(cells[idx + cols]);
        if (curr.classList.contains('merged-top')) stack.push(cells[idx - cols]);
    }
    return group;
}

function checkWin(cols, rows) {
    const isWin = cells.every((cell, i) => {
        const currentPos = cell.dataset.pos.split(" ").map(parseFloat);
        const targetX = (i % cols) / (cols - 1) * 100;
        const targetY = Math.floor(i / cols) / (rows - 1) * 100;
        const matchX = Math.abs(currentPos[0] - targetX) < 0.1;
        const matchY = Math.abs(currentPos[1] - targetY) < 0.1;
        return matchX && matchY;
    });

    if (isWin) {
        const progress = ProgressManager.get();
        const levelFinished = progress.currentLevel;
        ProgressManager.completeLevel(levelFinished);

        setTimeout(() => {
            const updatedProgress = ProgressManager.get();
            if (updatedProgress.revealedPieces >= 9 && levelFinished === 9) {
                triggerVictory();
            } else {
                // Utilisation de guillemets simples pour Ã©viter les bugs d'encodage selon le navigateur
                alert('Bravo ! Niveau ' + levelFinished + ' terminÃ©. Une nouvelle partie de la photo est rÃ©vÃ©lÃ©e !');
                goToHome();
            }
        }, 300);
    }
}
function initLandingGrid() {
    const landingGrid = document.getElementById('landing-grid');
    if (!landingGrid) return;

    const progress = ProgressManager.get();
    const secretImg = 'asset/image/image4.png';
    const positions = [
        "0% 0%", "50% 0%", "100% 0%",
        "0% 50%", "50% 50%", "100% 50%",
        "0% 100%", "50% 100%", "100% 100%"
    ];

    landingGrid.innerHTML = "";
    positions.forEach((pos, index) => {
        const piece = document.createElement('div');
        piece.className = 'landing-piece';

        if (index < progress.revealedPieces) {
            piece.style.backgroundImage = `url('${secretImg}')`;
            piece.style.backgroundPosition = pos;
            piece.classList.add('revealed');
        } else {
            piece.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
            piece.style.border = "1px solid rgba(255, 255, 255, 0.1)";
            piece.classList.add('hidden-card');
        }

        landingGrid.appendChild(piece);
    });

    const playBtn = document.getElementById('main-play-btn');
    if (playBtn) {
        playBtn.innerText = `Jouer au Niveau ${progress.currentLevel}`;
    }
}

function startGame() {
    const progress = ProgressManager.get();
    const levelData = levels[progress.currentLevel];
    currentImage = levelData.image;
    document.getElementById('level-title').innerText = levelData.title;

    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    let gridSize;
    if (progress.currentLevel <= 2) {
        gridSize = { r: 3, c: 3 };
    } else if (progress.currentLevel <= 4) {
        gridSize = { r: 3, c: 4 };
    } else if (progress.currentLevel <= 6) {
        gridSize = { r: 4, c: 4 };
    } else if (progress.currentLevel <= 8) {
        gridSize = { r: 4, c: 5 };
    } else {
        gridSize = { r: 5, c: 5 };
    }

    const grid = document.getElementById('puzzle-grid');
    grid.style.gridTemplateColumns = `repeat(${gridSize.c}, 150px)`;
    grid.style.gridTemplateRows = `repeat(${gridSize.r}, 150px)`;

    initPuzzle(gridSize.r, gridSize.c);
}

function goToHome() {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');
    initLandingGrid();
}

window.addEventListener('DOMContentLoaded', initLandingGrid);
window.startGame = startGame;
window.goToHome = goToHome;
function triggerVictory() {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.remove('hidden');
    createConfetti();
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#6366f1', '#c084fc', '#f43f5e', '#fbbf24', '#10b981'];

    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 8 + 6 + 'px';
        confetti.style.height = confetti.style.width;
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;
        confetti.style.animationDuration = duration + 's';
        confetti.style.animationDelay = delay + 's';
        container.appendChild(confetti);
        setTimeout(() => confetti.remove(), (duration + delay) * 1000);
    }
}

function restartGame() {
    if (confirm("Voulez-vous vraiment recommencer l'aventure depuis le dÃ©but ?")) {
        localStorage.removeItem('puzzleProgress');
        document.getElementById('victory-screen').classList.add('hidden');
        document.getElementById('home-screen').classList.remove('hidden');
        initLandingGrid();
    }
}

window.restartGame = restartGame;
