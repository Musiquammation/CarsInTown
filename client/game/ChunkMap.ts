import { Car } from "./Car";
import { Chunk } from "./Chunk";
import { roadtypes } from "./roadtypes";
import { Direction, getCellDist, getDirectionDelta, opposeDirection, rotateDirectionToLeft, rotateDirectionToRight } from "./Direction";
import { modulo } from "./modulo";
import { Vector2 } from "../handler/Vector2";


function produceChunkKey(x: number, y: number) {
	return (x << 16) ^ y;
}



export class ChunkMap {
	static getPoint(x: number, y: number) {
		const cx = Math.floor(x / Chunk.SIZE);
		const cy = Math.floor(y / Chunk.SIZE);
		const rx = modulo(Math.floor(x), Chunk.SIZE);
		const ry = modulo(Math.floor(y), Chunk.SIZE);

		return {cx, cy, rx, ry};
	}

	private chunks = new Map<number, Chunk>();
	gameArea: Vector2 = {x: 0, y: 0};
	time = 0;





	getChunk(x: number, y: number) {
		const key = produceChunkKey(x, y);
		const chunk = this.chunks.get(key);
		if (chunk)
			return chunk;

		const newChunk = new Chunk(x, y);
		this.chunks.set(key, newChunk);
		return newChunk;
	}

	tryGetChunk(x: number, y: number) {
		return this.chunks.get(produceChunkKey(x, y));
	}

	[Symbol.iterator]() {
		return this.chunks[Symbol.iterator]();
	}

	*iterateCars() {
		for (const [_, chunk] of this.chunks)
			for (const car of chunk.iterateCars())
				yield {car, chunk};
				
	}


	getRoad(x: number, y: number) {
		const p = ChunkMap.getPoint(x, y);
		const c = this.getChunk(p.cx, p.cy);
		return c.getRoad(p.rx, p.ry);
	}

	setRoad(x: number, y: number, road: roadtypes.road_t) {
		const p = ChunkMap.getPoint(x, y);
		const c = this.getChunk(p.cx, p.cy);
		c.setRoad(p.rx, p.ry, road);
	}

	getLight(x: number, y: number) {
		const p = ChunkMap.getPoint(x, y);
		const c = this.getChunk(p.cx, p.cy);
		return c.getLight(p.rx, p.ry);
	}



	private getPathLength(ox: number, oy: number, dir: Direction, lim: number) {
		const d = getDirectionDelta(dir);
		const oppositeDir = opposeDirection(dir);

		let stop = false;
		for (let length = 1; length < lim; length++) {
			const road = this.getRoad(ox + d.x*length, oy + d.y*length);

			switch (road & 0x7) {
			case roadtypes.types.VOID:
				stop = true;
				break;

			case roadtypes.types.PRIORITY:
				if ((road >> 6) !== oppositeDir) {
					stop = true;
				}
				break;
			}


			if (stop) {
				return length-1;
			}
		}

		return lim;
	}




	

	


	updateCarGrid(frameCount: number) {
		const carsChangingChunk: Car[] = [];

		// Reset grid and move cars in the same chunk
		for (let [_, chunk] of this.chunks) {
			chunk.updateCarGrid(carsChangingChunk, frameCount);
		}

		// Add missing cars
		for (let car of carsChangingChunk) {
			const cx = Math.floor(car.x / Chunk.SIZE);
			const cy = Math.floor(car.y / Chunk.SIZE);
			const x = modulo(Math.floor(car.x), Chunk.SIZE);
			const y = modulo(Math.floor(car.y), Chunk.SIZE);

			const chunk = this.getChunk(cx, cy);
			chunk.appendCar(car, x, y);
		}
	}


	reset() {
		for (let [_, chunk] of this.chunks) {
			chunk.reset();
		}
	}
	
}




