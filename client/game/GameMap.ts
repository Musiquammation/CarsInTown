import { ImageLoader } from "../handler/ImageLoader";
import { modulo } from "./modulo";
import { Car } from "./Car";
import { road_t } from "./road_t";
import { drawRoad, RoadType } from "./roadtypes";
import { roadfn } from "./roadfn";


export class GameMap {
	getIdx(x: number, y: number) {
		return y * this.size + x;
	}

	getPos(idx: number) {
		return {
			x: idx % this.size,
			y: Math.floor(idx / this.size),
		}
	}

	size: number;
	
	private cars = new Map<bigint, Car>();
	private grid: Uint16Array;

	constructor(size: number) {
		this.size = size;
		this.grid = new Uint16Array(size * size);
	}


	getRoad(x: number, y: number): road_t {
		if (x < 0 || y < 0 || x >= this.size || y >= this.size)
			return 0;
		
		const road = this.grid[this.getIdx(x, y)];
 		return road;
	}

	setRoad(x: number, y: number, road: road_t) {
		if (x < 0 || y < 0 || x >= this.size || y >= this.size)
			return;

		const currentRoad = this.getRoad(x, y);
		const currentRoadType = roadfn.getType(currentRoad);
		
		switch (currentRoadType) {
		case RoadType.SPAWNER:
		case RoadType.CONSUMER:
			return;

		case RoadType.VOID:
			if (currentRoad & (1<<3))
				return;
		}

		const idx = this.getIdx(x, y);
		this.grid[idx] = road;
	}

	


	drawGrid(ctx: CanvasRenderingContext2D, iloader: ImageLoader) {
		// Background
		ctx.fillStyle = "#333";
		ctx.fillRect(0, 0, this.size, this.size);

		// Draw roads
		for (let y = 0; y < this.size; y++) {
			for (let x = 0; x < this.size; x++) {
				const obj = this.getRoad(x, y);
				if (obj === 0)
					continue;
				
				ctx.save();
				ctx.translate(x, y);
				drawRoad(ctx, iloader, obj);
				ctx.restore();
				
			}
		}
	}

	drawCars(ctx: CanvasRenderingContext2D, iloader: ImageLoader) {
		for (const car of this.iterateCars()) {
			car.draw(ctx, iloader);
		}
	}


	


	*iterateCars() {
		for (const i of this.cars) {
			yield i[1];
		}
	}


	
	private static carKey(x: number, y: number) {
		const bx = BigInt(x >>> 0);
		const by = BigInt(y >>> 0);
		return (bx << 32n) | by;
	}

	private static decodeCarKey(k: bigint) {
		const x = Number(k >> 32n);
		const y = Number(k & 0xffffffffn);

		return { x, y };
	}

	getCar(x: number, y: number) {
		return this.cars.get(GameMap.carKey(x, y));
	}

	moveCars() {
		// Remove grid marks
		for (const [_, car] of this.cars) {
			const idx = this.getIdx(car.x, car.y);
			this.grid[idx] &= ~(1<<15);
		}

		// Move cars and place marks
		for (const [_, car] of this.cars) {
			car.move();
			const idx = this.getIdx(car.x, car.y);
			this.grid[idx] |= (1<<15);
		}

		// New map that will replace the old one
		const nextCars = new Map<bigint, Car>();

		// 2. Move cars, check for collisions, and place new marks
		for (const [_, car] of this.cars) {
			car.move();

			// Generate the new key based on the updated position
			const newKey = GameMap.carKey(car.x, car.y);

			// Collision detection
			if (nextCars.has(newKey)) {
				throw new Error(`Collision detected at ${car.x}, ${car.y}`);
			}

			// Save to the new map and update the grid
			nextCars.set(newKey, car);
			
			const idx = this.getIdx(car.x, car.y);
			this.grid[idx] |= (1 << 15);
		}

		// 3. Swap the old map with the fully updated new one
		this.cars = nextCars;
	}

	reset() {
		/// TODO: reset
	}
}
