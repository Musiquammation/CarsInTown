import { Game } from "../game/Game";
import { MapConstructor } from "../game/MapConstructor";
import { GameHandler } from "../handler/GameHandler";
import { InputHandler } from "../handler/InputHandler";
import { DrawStateData, GameState } from "../handler/states";
import { Vector3 } from "../handler/Vector3";


declare global {
	interface Window {
		DEBUG: boolean;
	}
}

export class LevelsState extends GameState {
	constructor() {
		super();
	}


	enter(data: any, input: InputHandler): void {
		input.onMouseUp = e => {};
		input.onMouseDown = e => {};
		input.onMouseMove = e => {};
		input.onScroll = e => {};
		input.onTouchStart = e => {};
		input.onTouchEnd = e => {};
		input.onTouchMove = e => {};

	}

	frame(game: GameHandler): GameState | null {
		return new Game();
	}

	draw(args: DrawStateData): void {
		
	}

	exit() {
		if (window.DEBUG) {
			return LEVELS[0];
			
		} else {
			const v = prompt(`Level? [1 to ${LEVELS.length-1}]`);
			if (v !== null)
				return LEVELS[+v];

		}

	}

	getCamera(): Vector3 | null {
		return null;
	}
}



function b(x: number, y: number, data = 8) {
	return {x, y, data};
}

function rect(x: number, y: number, w: number, h: number, data=8) {
	const arr = [];
	for (let i = x; i < x + w; i++) {
		for (let j = y; j < y + h; j++) {
			arr.push(b(i, j, data));
		}
	}
	return arr;
}


const LEVELS: MapConstructor[] = [
	new MapConstructor({
		time: 100*60,
		size: 32,
		

		roads: [
			...rect(10,15,10,1,1)
		],

		targets: [
			{
				label: "rA",
				x: 3, y: 3,
				targets: ["rB"]
			},

			{
				label: "rB",
				x: 8, y: 3,
				targets: ["rC"]
			},
			
			{
				label: "rC",
				x: 8, y: 8,
				targets: []
			},
		]
	})
];

