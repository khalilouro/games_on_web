import { BonusType } from "../entities/Bonus.js";

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

export default Levels;
