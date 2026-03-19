import PlayingState from "../states/PlayingState.js";
import MenuState from "../states/MenuState.js";

export default class GameScene {
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
