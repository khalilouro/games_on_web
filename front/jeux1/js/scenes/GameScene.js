import PlayingState from "../states/PlayingState.js";

export default class GameScene {
    constructor(game) {
        this.game = game;
        this.state = new PlayingState();
    }

    update(dt) {
        this.state.update(dt, this.game.input, this.game.canvas);
    }

    draw(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.state.draw(ctx);
    }
}
