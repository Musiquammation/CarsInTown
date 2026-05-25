import { ImageLoader } from "../handler/ImageLoader";
import { modulo } from "./modulo";
import { Car } from "./Car";
import { road_t } from "./road_t";
import { drawRoad, RoadType } from "./roadtypes";
import { roadfn } from "./roadfn";
import { Target } from "./Target";
import { Direction, getDirectionDelta } from "./Direction";


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
	private cars = new Array<Car>();
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
			yield i;
		}
	}


	
	private static mapKey(x: number, y: number) {
		const bx = BigInt(x >>> 0);
		const by = BigInt(y >>> 0);
		return (bx << 32n) | by;
	}


	removeCarMarks() {
		for (const car of this.cars) {
			const idx = this.getIdx(car.x, car.y);
			this.grid[idx] &= ~(1<<15);
		}
	}


	moveCars() {
		// Move cars and place marks
		for (let i = this.cars.length - 1; i >= 0; i--) {
			const car = this.cars[i];

			if (car.move()) {
				this.cars.splice(i, 1);
				continue;
			}

			const idx = this.getIdx(car.x, car.y);

			if (this.grid[idx] & (1 << 15)) {
				throw new Error(`Collision detected at (${car.x}, ${car.y})`);
			}

			this.grid[idx] |= (1 << 15);
		}
	}
	

	addTarget(target: Target) {
		this.targets.set(GameMap.mapKey(target.x, target.y), target);
	}

	moveLightStep() {
		this.lightCooldown++;
		if (this.lightCooldown >= GameMap.LIGHT_COULDOWN) {
			this.lightCooldown -= GameMap.LIGHT_COULDOWN;
			this.lightStep = (this.lightStep + 1) % 8;
		}
	}

	private searchTargetSpawner(x: number, y: number) {
		const check = (road: number) => 
			(roadfn.getType(road) === RoadType.ROAD) &&
			((road & (1<<15)) === 0);
		

		if (check(this.getRoad(x+1, y)))
			return Direction.RIGHT;

		if (check(this.getRoad(x, y-1)))
			return Direction.UP;
		
		if (check(this.getRoad(x-1, y)))
			return Direction.LEFT;

		if (check(this.getRoad(x, y+1)))
			return Direction.DOWN;

		return null;
	}

	updateTargets() {
		for (const [_, target] of this.targets) {
			if (!target.desiresSpawn())
				continue;


			const dir = this.searchTargetSpawner(target.x, target.y);
			if (dir === null)
				continue;
			
			const delta = getDirectionDelta(dir);

			const dst = target.spawn();
			if (dst === null)
				continue;

			this.cars.push(new Car(
				target.x + delta.x,
				target.y + delta.y,
				dst, dir,
				target.color
			));
		}
	}

	reset() {

		/// TODO: reset
	}
}
