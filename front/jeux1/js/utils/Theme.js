
const images = {
    menu: new Image(),
    game: new Image()
};

images.menu.src = "assets/images/background1.png";
images.game.src = "assets/images/background2.png";

let useImages = true;

export function toggleTheme() {
    useImages = !useImages;
}

export function drawBackground(ctx, width, height, time = 0, type = "menu") {
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
