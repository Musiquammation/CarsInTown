import { CarColor } from "../game/CarColor";
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
			return LEVELS[1];
			
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
	// Debug
	new MapConstructor({
		size: 32,
		

		roads: [
			...rect(6, 1, 2, 1, 1),
			...rect(8, 2, 1, 6, 1),
			...rect(8, 8, 5, 1, 1),
			...rect(1, 6, 12, 1, 1),
			{x: 8, y: 1, data: 3 | (2<<4) | (3<<12)},
			{x: 8, y: 5, data: 4 | (3<<6)},
			{x: 7, y: 6, data: 1365}

		],

		targets: [
			{
				label: "r+",
				x: 6, y: 1,
				spawnCount: 50,
				spawnDelay: 10,
				color: CarColor.RED,
				targets: ["rA"]
			},

			{
				label: "rA",
				x: 8, y: 8,
				spawnCount: 0,
				spawnDelay: 15,
				color: CarColor.RED,
				targets: ["r-"]
			},
			
			{
				label: "r-",
				x: 13, y: 8,
				spawnCount: 0,
				spawnDelay: 15,
				color: CarColor.RED,
				targets: []
			},

			{
				label: "y+",
				x: 1, y: 6,
				spawnCount: 50,
				spawnDelay: 30,
				color: CarColor.YELLOW,
				targets: ["y-"]
			},

			{
				label: "y-",
				x: 13, y: 6,
				spawnCount: 0,
				spawnDelay: 1,
				color: CarColor.YELLOW,
				targets: []
			}
		]
	}),


	// Level 1
	new MapConstructor({
		size: 32,

		roads: [],

		targets: [
			{
				label: "rA",
				x: 1, y: 15,
				spawnCount: 40,
				spawnDelay: 30,
				targets: ["rB"]
			},

			{
				label: "rB",
				x: 30, y: 15,
				spawnCount: 0,
				spawnDelay: 12000000,
				targets: ["rC"]
			},

			{
				label: "rC",
				x: 15, y: 20,
				spawnCount: 10,
				spawnDelay: 60,
				targets: []
			},

			{
				label: "c+",
				x: 16, y: 1,
				spawnCount: 100,
				spawnDelay: 60,
				targets: ["c-"]
			},

			{
				label: "c-",
				x: 16, y: 30,
				spawnCount: 100,
				spawnDelay: 20,
				targets: []
			},
		]
	})
];

