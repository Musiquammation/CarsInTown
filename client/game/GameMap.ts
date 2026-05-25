import { ImageLoader } from "../handler/ImageLoader";
import { modulo } from "./modulo";
import { Car } from "./Car";
import { road_t } from "./road_t";
import { drawRoad, RoadType } from "./roadtypes";
import { roadfn } from "./roadfn";
import { Target } from "./Target";


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

	static readonly LIGHT_COULDOWN = 180;

	size: number;
	
	private grid: Uint16Array;
	private cars = new Map<bigint, Car>();
	private targets = new Map<bigint, Target>();
	private lightStep = 0;
	private lightCooldown = 0;

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
		case RoadType.TARGET:
			return;

		case RoadType.VOID:
			if (currentRoad & (1<<3))
				return;
		}

		const idx = this.getIdx(x, y);
		if (this.grid[idx] & (1<<15)) {
			this.grid[idx] = road | (1<<15);
		} else {
			this.grid[idx] = road & ~(1<<15);
		}
	}

	forceRoad(x: number, y: number, road: road_t) {
		if (x < 0 || y < 0 || x >= this.size || y >= this.size)
			return;

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
				drawRoad(ctx, iloader, obj, this.lightStep);
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


	
	private static mapKey(x: number, y: number) {
		const bx = BigInt(x >>> 0);
		const by = BigInt(y >>> 0);
		return (bx << 32n) | by;
	}


	getCar(x: number, y: number) {
		return this.cars.get(GameMap.mapKey(x, y));
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
			const newKey = GameMap.mapKey(car.x, car.y);

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
	

	addTarget(x: number, y: number, target: Target) {
		this.targets.set(GameMap.mapKey(x, y), target);
	}

	moveLightStep() {
		this.lightCooldown++;
		if (this.lightCooldown >= GameMap.LIGHT_COULDOWN) {
			this.lightCooldown -= GameMap.LIGHT_COULDOWN;
			this.lightStep = (this.lightStep + 1) % 8;
		}
	}

	reset() {
		/// TODO: reset
	}
}
