import { Game } from "../game/Game";
import { GAME_HEIGHT, GAME_WIDTH } from "../handler/dimensions";
import { GameHandler } from "../handler/GameHandler";
import { InputHandler } from "../handler/InputHandler";
import { DrawStateData, GameState } from "../handler/states";
import { Vector3 } from "../handler/Vector3";
import { LevelsState } from "./LevelsState";

const BACKGROUND_APPEAR = 120;
const BACKGROUND_ALPHA = .85;

export class TransitionState extends GameState {
	game: Game;
	timer = 0;
	score = 0;
	stop = false;

	constructor(game: Game) {
		super();
		this.game = game;
	}

	enter(data: any, input: InputHandler): void {
		const score: number = data.score;
		this.score = score;

		input.onMouseUp = e => {};
		input.onMouseDown = e => {};
		input.onMouseMove = e => {};
		input.onScroll = e => {};
		input.onTouchStart = e => {};
		input.onTouchEnd = e => {};
		input.onTouchMove = e => {};
	}

	frame(game: GameHandler): GameState | null {
		this.game.frame(game);
		this.timer++;

		if (this.stop) {
			return new LevelsState();
		}

		return null;
	}

	draw(args: DrawStateData): void {
		// Draw game in backgroud
		this.game.draw(args);
		
		const ctx = args.ctx;
		const timer = Math.min(this.timer, BACKGROUND_APPEAR)/BACKGROUND_APPEAR;
		ctx.fillStyle = `rgba(0,0,0,${timer*BACKGROUND_ALPHA})`;
		ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

		ctx.fillStyle = "white";
		ctx.font = "100px arial";
		ctx.fillText("score: " + this.score, GAME_WIDTH/2 - 200, GAME_HEIGHT/2);
	}

	exit() {
		
	}

	getCamera(): Vector3 | null {
		return this.game.getCamera();
	}
}