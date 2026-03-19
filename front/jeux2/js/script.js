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
    3: { image: 'asset/image/image3.png', title: "Niveau 3" }
};

/* --- SYSTÈME DE PROGRESSION --- */
const ProgressManager = {
    get() {
        const saved = localStorage.getItem('puzzleProgress');
        return saved ? JSON.parse(saved) : { currentLevel: 1, revealedCards: 0 };
    },
    save(progress) {
        localStorage.setItem('puzzleProgress', JSON.stringify(progress));
    },
    revealNext() {
        let p = this.get();
        p.revealedCards++;
        if (p.revealedCards >= 9) {
            p.revealedCards = 0;
            p.currentLevel = (p.currentLevel % 3) + 1; // Tourne entre 1, 2, 3
        }
        this.save(p);
    }
};

/* --- SYSTÈME DE MENU --- */
function initLandingGrid() {
    const landingGrid = document.getElementById('landing-grid');
    if (!landingGrid) return;

    const progress = ProgressManager.get();
    const img = levels[progress.currentLevel].image;
    const positions = [
        "0% 0%", "50% 0%", "100% 0%",
        "0% 50%", "50% 50%", "100% 50%",
        "0% 100%", "50% 100%", "100% 100%"
    ];

    landingGrid.innerHTML = "";
    positions.forEach((pos, index) => {
        const piece = document.createElement('div');
        piece.className = 'landing-piece';

        // Si la carte est révélée, on affiche l'image, sinon un fond sombre/masqué
        if (index < progress.revealedCards) {
            piece.style.backgroundImage = `url('${img}')`;
            piece.style.backgroundPosition = pos;
            piece.classList.add('revealed');
        } else {
            piece.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
            piece.style.border = "1px solid rgba(255, 255, 255, 0.1)";
            piece.classList.add('hidden-card');
        }

        landingGrid.appendChild(piece);
    });
}

function startGame() {
    const progress = ProgressManager.get();
    currentImage = levels[progress.currentLevel].image;
    document.getElementById('level-title').innerText = `Niveau ${progress.revealedCards + 1}`;

    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    // Grilles aléatoires (3x3 minimum pour correspondre à l'accueil)
    const possibleGrids = [
        { r: 3, c: 3 },
        { r: 3, c: 4 },
        { r: 4, c: 3 }
    ];
    const chosen = possibleGrids[Math.floor(Math.random() * possibleGrids.length)];

    const grid = document.getElementById('puzzle-grid');
    grid.style.gridTemplateColumns = `repeat(${chosen.c}, 150px)`;
    grid.style.gridTemplateRows = `repeat(${chosen.r}, 150px)`;

    initPuzzle(chosen.r, chosen.c);
}

function goToHome() {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');
    initLandingGrid();
}

window.addEventListener('DOMContentLoaded', initLandingGrid);
window.startGame = startGame;
window.goToHome = goToHome;

/* --- INITIALISATION --- */
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
            correctPositions.push(`${posX}% ${posY}%`);
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
        cell.onclick = function () { handleInteraction(this, cols, rows); };
        grid.appendChild(cell);
        cells.push(cell);
    }
    checkFusion(cols, rows);
}

/* --- LOGIQUE DE JEU --- */
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
    cells.forEach(c => snapshot.set(c, c.style.backgroundPosition));

    let displaced = targets.filter(t => !firstGroup.includes(t));
    let displacedImgs = displaced.map(t => snapshot.get(t));

    firstGroup.forEach((s, i) => targets[i].style.backgroundPosition = snapshot.get(s));

    // Remplir les cases vidées par les images déplacées
    let vacated = firstGroup.filter(s => !targets.includes(s));
    vacated.forEach((v, i) => v.style.backgroundPosition = displacedImgs.shift());
}

/* --- FUSION ET GROUPES --- */
function isMatch(c1, c2, dx, dy, cols, rows) {
    let p1 = c1.style.backgroundPosition.split(" ").map(parseFloat);
    let p2 = c2.style.backgroundPosition.split(" ").map(parseFloat);

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
    const correctPositions = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            let posX = (x / (cols - 1)) * 100;
            let posY = (y / (rows - 1)) * 100;
            correctPositions.push(`${posX}% ${posY}%`);
        }
    }

    if (cells.every((c, i) => {
        let pos = c.style.backgroundPosition.replace(/ /g, " ").trim();
        return pos === correctPositions[i];
    })) {
        ProgressManager.revealNext(); // Mettre à jour la progression !
        setTimeout(() => {
            alert("Bravo ! Vous avez révélé une nouvelle carte ! 🎉");
            goToHome();
        }, 300);
    }
}