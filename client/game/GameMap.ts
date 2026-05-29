import { ImageLoader } from "../handler/ImageLoader";
import { modulo } from "./modulo";
import { Car } from "./Car";
import { road_t } from "./road_t";
import { drawRoad, RoadType } from "./roadtypes";
import { roadfn } from "./roadfn";
import { Target } from "./Target";
import { Direction, getDirectionDelta } from "./Direction";
import { api } from "./Api";


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

	static readonly LIGHT_COULDOWN = 75;

	size: number;
	carsToEnterGoal = 0;
	enteredCars = 0;
	
	private grid: Uint16Array;
	private cars = new Array<Car>();
	private targets = new Map<bigint, Target>();
	private lightTick = 0;
	private lightTickCooldown = 0;

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
		this.grid[idx] = road;
		api.setRoad(idx, road);
	}

	forceRoad(x: number, y: number, road: road_t) {
		if (x < 0 || y < 0 || x >= this.size || y >= this.size)
			return;

		const idx = this.getIdx(x, y);
		this.grid[idx] = road;
		api.setRoad(idx, road);
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
				drawRoad(ctx, iloader, obj, this.lightTick);
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

			const code = car.move();
			if (code >= 1) {
				if (code >= 2) {
					this.enteredCars++;
				}
				this.cars.splice(i, 1);
				continue;
			}

			const idx = this.getIdx(car.x, car.y);

			if (this.grid[idx] & (1 << 15)) {
				throw new Error(`Collision detected at (${car.x}, ${car.y})`);
			}

			this.grid[idx] |= (1<<15);
		}
	}
	

	addTarget(target: Target) {
		this.targets.set(GameMap.mapKey(target.x, target.y), target);
	}

	runLightTick() {
		this.lightTickCooldown++;
		if (this.lightTickCooldown >= GameMap.LIGHT_COULDOWN) {
			this.lightTickCooldown -= GameMap.LIGHT_COULDOWN;
			this.lightTick = (this.lightTick + 1) % 8;
		}
	}


	private searchTargetSpawner(
		srcX: number, srcY: number,
		dstX: number, dstY: number
	) {

		type Candidate = {
			dir: Direction;
			sx: number;
			sy: number;
			dist: number;
		};

		const DIRS: Direction[] = [
			Direction.RIGHT,
			Direction.UP,
			Direction.LEFT,
			Direction.DOWN
		];

		const manhattan = (x: number, y: number) =>
			Math.abs(x - dstX) + Math.abs(y - dstY);

		const candidates: Candidate[] = DIRS.map(dir => {
			const delta = getDirectionDelta(dir);
			const sx = srcX + delta.x;
			const sy = srcY + delta.y;

			return {
				dir,
				sx,
				sy,
				dist: manhattan(sx, sy),
			};
		}).sort((a, b) => a.dist - b.dist);

		for (const c of candidates) {
			const road = this.getRoad(c.sx, c.sy);
			if (
				roadfn.getType(road) !== RoadType.ROAD ||
				((road & (1 << 15)) !== 0)
			) {continue;}

			const pathId = api.addPath(
				c.dir, c.sx, c.sy, dstX, dstY);

			if (pathId >= 0) {
				return {
					sx: c.sx,
					sy: c.sy,
					pathId,
					dir: c.dir
				};
			}
		}

		// fallback si aucune direction valide
		return null;
	}

	updateTargets() {
		for (const [_, target] of this.targets) {
			if (!target.desiresSpawn())
				continue;
			

			const dst = target.spawn();
			if (dst === null)
				continue;

			const spawner = this.searchTargetSpawner(
				target.x, target.y, dst.x, dst.y);

			if (spawner === null) {
				target.absorbeCar(); // failed to place car
				continue;
			}

			const car = new Car(
				spawner.sx,
				spawner.sy,
				dst,
				spawner.dir,
				spawner.pathId,
				target.color,
			);


			if (car.appendSubTarget() >= 2) {
				throw new Error("Car spawned and immediately reached its target");
			}

			this.cars.push(car);
		}
	}

	apiSetupCars() {
		api.setupCars(this.cars);
	}
	
	apiCleanupCars() {
		api.cleanupCars();
	}

	updateCars() {
		api.getDangers(this.cars, this.lightTick);
	}

	reset() {
		// Reset cars
		for (const car of this.cars) {
			car.removePath();
			this.grid[this.getIdx(car.x, car.y)] &= ~(1<<15);
		}

		this.cars.length = 0;


		// Reset targets
		for (const [_, target] of this.targets) {
			target.reset();
		}

		this.lightTick = 0;
		this.lightTickCooldown = 0;
		this.enteredCars = 0;

	}

	getLightTick() {
		return this.lightTick;
	}
}
