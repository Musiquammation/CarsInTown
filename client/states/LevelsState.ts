import { CarColor } from "../game/CarColor";
import { Direction } from "../game/Direction";
import { Game } from "../game/Game";
import { MapConstructor } from "../game/MapConstructor";
import { roadtypes } from "../game/roadtypes";
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

function c(x: number, y: number, color: CarColor) {
	return {x, y, data: roadtypes.types.CONSUMER | (color << 3)};
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
		width: 31,
		height: 31,
		spawners: [
			{
				x: 13,
				y: 22,
				color: CarColor.RED,
				rythm: 45,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 20
			},

			{
				x: 16,
				y: 8,
				color: CarColor.YELLOW,
				rythm: 45,
				couldown: 1,
				direction: Direction.DOWN,
				count: Infinity,
				score: 20
			},

			{
				x: 20,
				y: 15,
				color: CarColor.GREEN,
				rythm: 45,
				couldown: 1,
				direction: Direction.LEFT,
				count: Infinity,
				score: 20
			}

			
		],

		roads: [
			c(13, 10, CarColor.RED),
			c(1, 7, CarColor.YELLOW),
			c(10, 15, CarColor.GREEN),
			...rect(13,10,1,12,1),
			...rect(16,9,1,8,1),
			...rect(10,15,10,1,1)
		]
	}),

	// Level 1
	new MapConstructor({
		time: 100*60,
		width: 31,
		height: 31,
		spawners: [
			{
				x: 1,
				y: 5,
				color: CarColor.RED,
				rythm: 	22,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 10,
				color: CarColor.BLUE,
				rythm: 	22,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 20,
				y: 30,
				color: CarColor.CYAN,
				rythm: 	120,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 10
			}
		],
		roads: [
			c(30, 5, CarColor.RED),

			c(20, 1, CarColor.CYAN),

			c(30, 10, CarColor.BLUE),
		]
	}),

	// Level 2
	new MapConstructor({
		time: 100*60,
		width: 31,
		height: 31,
		spawners: [
			{
				x: 1,
				y: 5,
				color: CarColor.RED,
				rythm: 	22,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 10,
				color: CarColor.BLUE,
				rythm: 	22,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 20,
				y: 30,
				color: CarColor.CYAN,
				rythm: 	120,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 10
			},
		],
		roads: [
			c(30, 5, CarColor.BLUE),

			c(20, 1, CarColor.CYAN),

			c(30, 10, CarColor.RED),
		]
	}),

	// Level 3
	new MapConstructor({
		time: 100*60,
		width: 31,
		height: 31,
		spawners: [
			{
				x: 1,
				y: 5,
				color: CarColor.RED,
				rythm: 	25,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 7,
				color: CarColor.RED,
				rythm: 	25,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 9,
				color: CarColor.RED,
				rythm: 	25,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 5,
				y: 1,
				color: CarColor.RED,
				rythm: 	25,
				couldown: 1,
				direction: Direction.DOWN,
				count: Infinity,
				score: 1
			},

			{
				x: 7,
				y: 1,
				color: CarColor.RED,
				rythm: 	25,
				couldown: 1,
				direction: Direction.DOWN,
				count: Infinity,
				score: 1
			},

			{
				x: 9,
				y: 1,
				color: CarColor.RED,
				rythm: 	25,
				couldown: 1,
				direction: Direction.DOWN,
				count: Infinity,
				score: 1
			},

			{
				x: 20,
				y: 1,
				color: CarColor.BLUE,
				rythm: 	90,
				couldown: 1,
				direction: Direction.DOWN,
				count: Infinity,
				score: 15
			},

			{
				x: 1,
				y: 20,
				color: CarColor.CYAN,
				rythm: 	90,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 15
			},

			
		],

			
		roads: [
			c(30, 20, CarColor.CYAN),

			c(20, 30, CarColor.BLUE),

			c(26, 27, CarColor.RED),
			c(28, 27, CarColor.RED),
		]
	}),

	// Level 4
	new MapConstructor({
		time: 100*60,
		width: 32,
		height: 32,
		spawners: [
			
			{
				x: 1,
				y: 5,
				color: CarColor.RED,
				rythm: 	60,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 7,
				color: CarColor.YELLOW,
				rythm: 	60,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 9,
				color: CarColor.BLUE,
				rythm: 	60,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 11,
				color: CarColor.CYAN,
				rythm: 	60,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 21,
				color: CarColor.RED,
				rythm: 	60,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 23,
				color: CarColor.YELLOW,
				rythm: 	60,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 25,
				color: CarColor.BLUE,
				rythm: 	60,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 27,
				color: CarColor.CYAN,
				rythm: 	60,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 31,
				y: 16,
				color: CarColor.PINK,
				rythm: 	360,
				couldown: 1,
				direction: Direction.LEFT,
				count: Infinity,
				score: 5
			},

			{
				x: 31,
				y: 15,
				color: CarColor.PINK,
				rythm: 	360,
				couldown: 180,
				direction: Direction.LEFT,
				count: Infinity,
				score: 5
			},
			
		],

			
		roads: [
			b(16, 0), b(16, 1), b(16, 2), b(16, 3), 
			b(16, 4), b(16, 5), b(16, 6), b(16, 7), 
			b(16, 8), b(16, 9), b(16, 10), b(16, 11), 
			b(16, 12), b(16, 13), b(16, 14), 
			b(16, 19), b(16, 20), b(16, 21), 
			b(16, 22), b(16, 23), b(16, 24), b(16, 25), 
			b(16, 26), b(16, 27), b(16, 28), b(16, 29), 
			b(16, 30), b(16, 31), 
			
			b(17, 0), b(17, 1), b(17, 2), b(17, 3), 
			b(17, 4), b(17, 5), b(17, 6), b(17, 7), 
			b(17, 8), b(17, 9), b(17, 10), b(17, 11), 
			b(17, 12), b(17, 13), b(17, 14), 
			b(17, 19), b(17, 20), b(17, 21), 
			b(17, 22), b(17, 23), b(17, 24), b(17, 25), 
			b(17, 26), b(17, 27), b(17, 28), b(17, 29), 
			b(17, 30), b(17, 31), 


			c(28, 2, CarColor.RED),
			c(28, 9, CarColor.YELLOW),
			c(28, 23, CarColor.BLUE),
			c(28, 30, CarColor.CYAN),
			c(1, 17, CarColor.PINK),
		]
	}),

	// Level 5
	new MapConstructor({
		time: 150*60,
		width: 31,
		height: 31,
		spawners: [
			// Red
			{
				x: 1,
				y: 16,
				color: CarColor.RED,
				rythm: 	15,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 17,
				color: CarColor.RED,
				rythm: 	15,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			// Yellow
			{
				x: 30,
				y: 14,
				color: CarColor.YELLOW,
				rythm: 	15,
				couldown: 1,
				direction: Direction.LEFT,
				count: Infinity,
				score: 1
			},

			{
				x: 30,
				y: 15,
				color: CarColor.YELLOW,
				rythm: 	15,
				couldown: 1,
				direction: Direction.LEFT,
				count: Infinity,
				score: 1
			},


			// Blue
			{
				x: 14,
				y: 1,
				color: CarColor.BLUE,
				rythm: 	15,
				couldown: 1,
				direction: Direction.DOWN,
				count: Infinity,
				score: 1
			},

			{
				x: 15,
				y: 1,
				color: CarColor.BLUE,
				rythm: 	15,
				couldown: 1,
				direction: Direction.DOWN,
				count: Infinity,
				score: 1
			},

			// Cyan
			{
				x: 16,
				y: 30,
				color: CarColor.GREEN,
				rythm: 	15,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},

			{
				x: 17,
				y: 30,
				color: CarColor.GREEN,
				rythm: 	15,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},

			// Green
			{
				x: 3,
				y: 2,
				color: CarColor.CYAN,
				rythm: 	60,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 20
			},

			// White
			{
				x: 2,
				y: 3,
				color: CarColor.WHITE,
				rythm: 	60,
				couldown: 1,
				direction: Direction.DOWN,
				count: Infinity,
				score: 20
			},

			// Pink
			{
				x: 5,
				y: 5,
				color: CarColor.PINK,
				rythm: 	60,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 30
			},
		],

		roads: [
			c(30, 16, CarColor.RED),
			c(30, 17, CarColor.RED),
			c( 1, 14, CarColor.YELLOW),
			c( 1, 15, CarColor.YELLOW),
			c(14, 30, CarColor.BLUE),
			c(15, 30, CarColor.BLUE),
			c(16,  1, CarColor.GREEN),
			c(17,  1, CarColor.GREEN),

			c(29, 29, CarColor.PINK),
			c(29,  2, CarColor.CYAN),
			c( 2, 29, CarColor.WHITE),
		]
	}),


	// Level 6
	new MapConstructor({
		time: 200*60,
		width: 31,
		height: 31,
		spawners: [
			// Top left
			{
				x: 1,
				y: 3,
				color: CarColor.RED,
				rythm: 25,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 5,
				color: CarColor.YELLOW,
				rythm: 25,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			// Bottom left
			{
				x: 5,
				y: 30,
				color: CarColor.BLUE,
				rythm: 25,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},

			{
				x: 3,
				y: 30,
				color: CarColor.YELLOW,
				rythm: 25,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},
			
			// Bottom right
			{
				x: 30,
				y: 28,
				color: CarColor.BLUE,
				rythm: 25,
				couldown: 1,
				direction: Direction.LEFT,
				count: Infinity,
				score: 1
			},

			{
				x: 30,
				y: 26,
				color: CarColor.GREEN,
				rythm: 25,
				couldown: 1,
				direction: Direction.LEFT,
				count: Infinity,
				score: 1
			},

			// Top right
			{
				x: 28,
				y: 1,
				color: CarColor.GREEN,
				rythm: 25,
				couldown: 1,
				direction: Direction.DOWN,
				count: Infinity,
				score: 1
			},

			{
				x: 26,
				y: 1,
				color: CarColor.RED,
				rythm: 25,
				couldown: 1,
				direction: Direction.DOWN,
				count: Infinity,
				score: 1
			},

		],

		roads: [
			...rect(15, 1, 2, 10),
			...rect(15, 21, 2, 10),
			...rect(1, 15, 10, 2),
			...rect(21, 15, 10, 2),

			...rect(13, 13, 6, 6),


			c(3, 1, CarColor.GREEN),
			c(5, 1, CarColor.BLUE),
			c(1, 26, CarColor.GREEN),
			c(1, 28, CarColor.RED),
			c(26, 30, CarColor.RED),
			c(28, 30, CarColor.YELLOW),
			c(30, 3, CarColor.BLUE),
			c(30, 5, CarColor.YELLOW),

		]
	}),

	// Level 7
	new MapConstructor({
		time: 100*60,
		width: 31,
		height: 31,
		spawners: [
			// Bottom line
			{
				x: 21,
				y: 30,
				color: CarColor.RED,
				rythm: 20,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},

			{
				x: 23,
				y: 30,
				color: CarColor.YELLOW,
				rythm: 60,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 7
			},

			{
				x: 24,
				y: 30,
				color: CarColor.RED,
				rythm: 20,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},

			{
				x: 22,
				y: 29,
				color: CarColor.WHITE,
				rythm: 40,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 3
			},

			{
				x: 30,
				y: 10,
				color: CarColor.PINK,
				rythm: 90,
				couldown: 1,
				direction: Direction.LEFT,
				count: Infinity,
				score: 20
			},
		],

		roads: [
			c(23, 1, CarColor.RED),
			c(24, 1, CarColor.WHITE),
			c(25, 1, CarColor.RED),
			c(1, 10, CarColor.PINK),
			c(1, 9, CarColor.YELLOW),
		]
	}),

	// Level 8
	new MapConstructor({
		time: 200*60,
		width: 31,
		height: 31,
		spawners: [
			// Right side
			{
				x: 7,
				y: 1,
				color: CarColor.BLUE,
				rythm: 20,
				couldown: 1,
				direction: Direction.DOWN,
				count: Infinity,
				score: 1
			},

			{
				x: 8,
				y: 1,
				color: CarColor.GREEN,
				rythm: 60,
				couldown: 1,
				direction: Direction.DOWN,
				count: Infinity,
				score: 7
			},

			{
				x: 10,
				y: 1,
				color: CarColor.BLUE,
				rythm: 20,
				couldown: 1,
				direction: Direction.DOWN,
				count: Infinity,
				score: 1
			},

			{
				x: 9,
				y: 2,
				color: CarColor.GRAY,
				rythm: 40,
				couldown: 1,
				direction: Direction.LEFT,
				count: Infinity,
				score: 3
			},

			{
				x: 1,
				y: 21,
				color: CarColor.CYAN,
				rythm: 90,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 20
			},



			// Right side
			{
				x: 21,
				y: 30,
				color: CarColor.RED,
				rythm: 20,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},

			{
				x: 23,
				y: 30,
				color: CarColor.YELLOW,
				rythm: 60,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 7
			},

			{
				x: 24,
				y: 30,
				color: CarColor.RED,
				rythm: 20,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},

			{
				x: 22,
				y: 29,
				color: CarColor.WHITE,
				rythm: 40,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 3
			},

			{
				x: 30,
				y: 10,
				color: CarColor.PINK,
				rythm: 90,
				couldown: 1,
				direction: Direction.LEFT,
				count: Infinity,
				score: 20
			},
		],

		roads: [
			// Left side
			c(6, 30, CarColor.BLUE),
			c(7, 30, CarColor.GRAY),
			c(8, 30, CarColor.BLUE),
			c(30, 21, CarColor.CYAN),
			c(30, 22, CarColor.GREEN),

			// Right side
			c(23, 1, CarColor.RED),
			c(24, 1, CarColor.WHITE),
			c(25, 1, CarColor.RED),
			c(1, 10, CarColor.PINK),
			c(1, 9, CarColor.YELLOW),
		]
	}),

	// Level 9
	new MapConstructor({
		time: 100*60,
		width: 31,
		height: 31,
		spawners: [
			...Array.from({ length: 7 }, (_, i) => ({
				x: 7 + 3*i,
				y: 30,
				color: CarColor.RED,
				rythm: 15,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			})),

			{
				x: 1,
				y: 8,
				color: CarColor.YELLOW,
				rythm: 50,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 20
			}
		],

		roads: [
			...Array.from({ length: 7 }, (_, i) => c(
				7 + 3*i, 1, CarColor.RED
			)),

			...Array.from({ length: 7 }).flatMap((_, i) => rect(
				7 + 3*i, 1, 1, 30, 1
			)),


			c(30, 8, CarColor.YELLOW),

		]
	}),

	// Level 10
	new MapConstructor({
		time: 100*60,
		width: 31,
		height: 31,
		spawners: [
			{
				x: 15,
				y: 30,
				color: CarColor.RED,
				rythm: 30,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},
			{
				x: 16,
				y: 30,
				color: CarColor.RED,
				rythm: 30,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},
			{
				x: 17,
				y: 30,
				color: CarColor.RED,
				rythm: 30,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},
			{
				x: 13,
				y: 28,
				color: CarColor.GREEN,
				rythm: 90,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 7
			},
			{
				x: 19,
				y: 28,
				color: CarColor.YELLOW,
				rythm: 75,
				couldown: 1,
				direction: Direction.LEFT,
				count: Infinity,
				score: 7
			},

			{
				x: 30,
				y: 10,
				color: CarColor.PINK,
				rythm: 120,
				couldown: 1,
				direction: Direction.LEFT,
				count: Infinity,
				score: 30
			}
		],

		roads: [
			...rect(12, 28, 1, 4),
			...rect(20, 28, 1, 4),
			...rect(12, 27, 3, 1),
			...rect(18, 27, 3, 1),

			c(1, 5, CarColor.YELLOW),
			c(30, 5, CarColor.GREEN),
			c(1, 10, CarColor.PINK),
			c(15, 1, CarColor.RED),
			c(16, 1, CarColor.RED),
			c(17, 1, CarColor.RED),
		]
	}),

	// Level 11
	new MapConstructor({
		time: 100*60,
		width: 31,
		height: 31,
		spawners: [
			{
				x: 8,
				y: 15,
				color: CarColor.RED,
				rythm: 30,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},
			{
				x: 23,
				y: 15,
				color: CarColor.YELLOW,
				rythm: 30,
				couldown: 1,
				direction: Direction.LEFT,
				count: Infinity,
				score: 1
			},
		],
		roads: [
			...rect(15, 1, 2, 14),
			...rect(15, 16, 2, 15),

			c(23, 14, CarColor.RED),
			c(8, 14, CarColor.YELLOW),
		]
	}),


	// Level 12
	new MapConstructor({
		time: 100*60,
		width: 31,
		height: 31,
		spawners: [
			{
				x: 16,
				y: 30,
				color: CarColor.RED,
				rythm: 50,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},

			{
				x: 15,
				y: 1,
				color: CarColor.BLUE,
				rythm: 50,
				couldown: 1,
				direction: Direction.DOWN,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 16,
				color: CarColor.YELLOW,
				rythm: 50,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 30,
				y: 15,
				color: CarColor.GREEN,
				rythm: 60,
				couldown: 1,
				direction: Direction.LEFT,
				count: Infinity,
				score: 1
			},
		],

		roads: [
			c(16, 14, CarColor.RED),
			c(15, 17, CarColor.BLUE),
			c(14, 15, CarColor.GREEN),
			c(17, 16, CarColor.YELLOW),
		]
	}),

	// Level 13
	new MapConstructor({
		time: 100*60,
		width: 31,
		height: 31,
		spawners: [
			{
				x: 16,
				y: 30,
				color: CarColor.RED,
				rythm: 60,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},

			{
				x: 15,
				y: 1,
				color: CarColor.BLUE,
				rythm: 60,
				couldown: 1,
				direction: Direction.DOWN,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 16,
				color: CarColor.YELLOW,
				rythm: 60,
				couldown: 1,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 30,
				y: 15,
				color: CarColor.GREEN,
				rythm: 60,
				couldown: 1,
				direction: Direction.LEFT,
				count: Infinity,
				score: 1
			},

			{
				x: 28,
				y: 28,
				color: CarColor.PINK,
				rythm: 120,
				couldown: 1,
				direction: Direction.UP,
				count: Infinity,
				score: 13

			}
		],

		roads: [
			c(16, 14, CarColor.RED),
			c(15, 17, CarColor.BLUE),
			c(14, 15, CarColor.GREEN),
			c(17, 16, CarColor.YELLOW),
			c(2, 2, CarColor.PINK)
		]
	}),

	// Level 14
	new MapConstructor({
		time: 100*60,
		width: 31,
		height: 31,
		spawners: [
			{
				x: 13,
				y: 30,
				color: CarColor.RED,
				rythm: 90,
				couldown: 10,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},

			{
				x: 14,
				y: 30,
				color: CarColor.YELLOW,
				rythm: 90,
				couldown: 20,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},

			{
				x: 15,
				y: 30,
				color: CarColor.BLUE,
				rythm: 90,
				couldown: 30,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},

			{
				x: 16,
				y: 30,
				color: CarColor.GREEN,
				rythm: 90,
				couldown: 40,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},

			{
				x: 17,
				y: 30,
				color: CarColor.CYAN,
				rythm: 90,
				couldown: 50,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},

			{
				x: 18,
				y: 30,
				color: CarColor.PINK,
				rythm: 90,
				couldown: 60,
				direction: Direction.UP,
				count: Infinity,
				score: 1
			},
		],

		roads: [
			c(13, 1, CarColor.PINK),
			c(14, 1, CarColor.CYAN),
			c(15, 1, CarColor.GREEN),
			c(16, 1, CarColor.BLUE),
			c(17, 1, CarColor.YELLOW),
			c(18, 1, CarColor.RED),

			...rect(13, 1, 6, 30, 1)
		]
	}),

	
	// Level 15
	new MapConstructor({
		time: 100*60,
		width: 31,
		height: 31,
		spawners: [
			{
				x: 1,
				y: 1,
				color: CarColor.RED,
				rythm: 30,
				couldown: 10,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 1
			},

			{
				x: 1,
				y: 2,
				color: CarColor.PINK,
				rythm: 180,
				couldown: 10,
				direction: Direction.RIGHT,
				count: Infinity,
				score: 30
			},

			{
				x: 30,
				y: 1,
				color: CarColor.GREEN,
				rythm: 30,
				couldown: 10,
				direction: Direction.LEFT,
				count: Infinity,
				score: 1
			},

			{
				x: 30,
				y: 2,
				color: CarColor.CYAN,
				rythm: 180,
				couldown: 10,
				direction: Direction.LEFT,
				count: Infinity,
				score: 30
			},
		],

		roads: [
			c(6, 5, CarColor.CYAN),
			c(25, 5, CarColor.PINK),
			c(16, 30, CarColor.GREEN),
			c(15, 30, CarColor.RED),

			...rect(12, 8, 1, 24),
			...rect(15, 0, 2, 24),
			...rect(19, 8, 1, 24),
		]
	})




];

