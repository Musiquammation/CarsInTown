import { ImageLoader } from "../handler/ImageLoader";
import { modulo } from "./modulo";
import { Car } from "./Car";
import { CarColor } from "./CarColor";
import { roadtypes } from "./roadtypes";
import { Direction } from "./Direction";

interface CarSpawner {
	x: number;
	y: number;
	color: CarColor;
	rythm: number;
	startCouldown: number;
	couldown: number;
	direction: Direction;
	startCount: number;
	count: number;
	currentId: number;
	score: number;
}


interface Light {
	flag: number;
};

export class Chunk {
	static SIZE = 16;

	static getIdx(x: number, y: number) {
		return y * Chunk.SIZE + x;
	}

	static getPos(idx: number) {
		return {
			x: idx % Chunk.SIZE,
			y: Math.floor(idx / Chunk.SIZE),
		}
	}

	x: number;
	y: number;
	
	private nextCarSlot = 0;
	private cars: Car[][] = Array(254).fill(null).map(() => []);
	private grid = new Uint8Array(Chunk.SIZE * Chunk.SIZE);
	private carGrid = new Uint8Array(Chunk.SIZE * Chunk.SIZE).fill(255);
	private carSpawners = new Map<number, CarSpawner>();
	private lights = new Map<number, Light>();

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}


	getRoad(x: number, y: number): roadtypes.road_t {
		const road = this.grid[Chunk.getIdx(x, y)];
 		return road;
	}

	setRoad(x: number, y: number, road: roadtypes.road_t) {
		const currentRoad = this.getRoad(x, y);
		const currentRoadType = currentRoad & 0x7;
		
		switch (currentRoadType) {
		case roadtypes.types.SPAWNER:
		case roadtypes.types.CONSUMER:
			return;

		case roadtypes.types.VOID:
			if (currentRoad & (1<<3))
				return;
		}

		if (currentRoadType === roadtypes.types.LIGHT) {
			if ((road & 0x7) !== roadtypes.types.LIGHT) {
				// Remove light
				this.removeLight(x, y);
			}
		} else if ((road & 0x7) === roadtypes.types.LIGHT) {
			// Append light
			this.appendLight({flag: 0}, x, y);
		}

		const idx = Chunk.getIdx(x, y);
		this.grid[idx] = road;
	}


	drawGrid(ctx: CanvasRenderingContext2D, iloader: ImageLoader, drawBackground: boolean) {
		// Background
		if (drawBackground) {
			ctx.fillStyle = "white";
			ctx.fillRect(0, 0, Chunk.SIZE, Chunk.SIZE);
		}

		// Draw roads
		for (let y = 0; y < Chunk.SIZE; y++) {
			for (let x = 0; x < Chunk.SIZE; x++) {
				const obj = this.getRoad(x, y);
				if (obj === 0)
					continue;
				
				ctx.save();
				ctx.translate(x, y);
				roadtypes.draw(ctx, iloader, obj);
				ctx.restore();
				
			}
		}
	}

	drawCars(ctx: CanvasRenderingContext2D, iloader: ImageLoader) {
		for (const car of this.iterateCars()) {
			const x = modulo(Math.floor(car.x), Chunk.SIZE);
			const y = modulo(Math.floor(car.y), Chunk.SIZE);

			const road = this.getRoad(x, y);
			car.draw(ctx, road, iloader);
		}
	}


	runEvents(lightTick: number) {
		// Run car spawners
		for (const [idx, spawner] of this.carSpawners) {
			spawner.couldown--;
			if (spawner.couldown <= 0) {
				const car = new Car(
					this.x * Chunk.SIZE + spawner.x + .5,
					this.y * Chunk.SIZE + spawner.y + .5,
					spawner.currentId,
					spawner.direction,
					spawner.color,
					spawner.score
				);

				spawner.currentId++;

				if (this.appendCar(car, spawner.x, spawner.y)) {
					spawner.count--;
					if (spawner.count <= 0) {
						this.carSpawners.delete(idx);
					}

				}
				
				spawner.couldown += spawner.rythm;
			}
		}

		// Run lights
		const frameCountMod = [
			Math.floor(lightTick)%4,
			Math.floor(lightTick)%8,
			Math.floor(lightTick)%16,
			Math.floor(lightTick)
		];

		for (const [idx, light] of this.lights) {
			const flag = light.flag;

			const pos = Chunk.getPos(idx);
			const road = this.getRoad(pos.x, pos.y);

			// Check type
			if ((road & 0x7) !== roadtypes.types.LIGHT) {
				this.lights.delete(idx);
				continue;
			}

			const sizeSlot = frameCountMod[(road >> 4) & 0x3];
			const now = !!(flag & (1 << sizeSlot));

			this.setRoad(pos.x, pos.y,
				now ? (road | (1<<3)) : (road & ~(1<<3)));

		}
	}



	appendCarSpawner(spawner: CarSpawner) {
		const x = spawner.x;
		const y = spawner.y;
		
		this.carSpawners.set(Chunk.getIdx(x, y), spawner);
		const road = roadtypes.types.SPAWNER |
			((spawner.color & 0x7) << 3) |
			(spawner.direction << 6);

			
		this.setRoad(x, y, road);
	}

	private appendLight(light: Light, x: number, y: number) {
		this.lights.set(Chunk.getIdx(x, y), light);
	}

	private removeLight(x: number, y: number) {
		this.lights.delete(Chunk.getIdx(x, y));
	}


	*iterateCars() {
		for (const car of this.cars) {
			yield* car;
		}
	}


	appendCar(car: Car, x: number, y: number) {
		const idx = y * Chunk.SIZE + x;
		if (this.carGrid[idx] !== 255) {
			console.warn("Failed to push car");
			return false;
		}
		
		this.carGrid[idx] = this.nextCarSlot;
		this.cars[this.nextCarSlot].push(car);
		this.nextCarSlot++;

		if (this.nextCarSlot >= 254)
			this.nextCarSlot = 0;

		return true;
	}

	updateCarGrid(carsToMove: Car[], frameCount: number) {
		this.carGrid.fill(255);

		for (let id = 0; id < 254; id++) {
			const cars = this.cars[id];

			for (let i = cars.length - 1; i >= 0; i--) {
				const car = cars[i];

				if (car.frameLastPositionUpdate === frameCount)
					continue;

				if (!car.alive) {
					cars.splice(i, 1);
				}

				const cx = Math.floor(car.x / Chunk.SIZE);
				const cy = Math.floor(car.y / Chunk.SIZE);

				if (cx !== this.x || cy !== this.y) {
					cars.splice(i, 1);
					carsToMove.push(car);
					continue;
				}

				const x = modulo(Math.floor(car.x), Chunk.SIZE);
				const y = modulo(Math.floor(car.y), Chunk.SIZE);
				const idx = y * Chunk.SIZE + x;

				if (this.carGrid[idx] !== 255) {
					this.carGrid[idx] = 254;
				} else {
					this.carGrid[idx] = id;
				}
				
				car.frameLastPositionUpdate = frameCount; // frame already handled
			}
		}
	}

	getCar(x: number, y: number): Car | 'empty' | 'full' {
		const idx = this.carGrid[y * Chunk.SIZE + x];
		if (idx === 255)
			return 'empty';

		if (idx === 254)
			return 'full';

		for (const car of this.cars[idx]) {
			const carX = modulo(Math.floor(car.x), Chunk.SIZE);
			const carY = modulo(Math.floor(car.y), Chunk.SIZE);

			if (carX === x && carY === y)
				return car;
		}

		return 'empty';
	}

	getLight(x: number, y: number) {
		return this.lights.get(Chunk.getIdx(x, y));
	}


	reset() {
		this.nextCarSlot = 0;

		for (let i = 0; i < this.cars.length; i++) {
			this.cars[i].length = 0;
		}

		this.carGrid.fill(255);

		for (const spawner of this.carSpawners.values()) {
			spawner.couldown = spawner.startCouldown;
			spawner.count = spawner.startCount;
		}
	}
}
