import { Chunk } from "./Chunk";
import { ChunkMap } from "./ChunkMap";
import { modulo } from "./modulo";
import { roadtypes } from "./roadtypes";

export class GridExplorer {
	x: number;
	y: number;
	cx: number;
	cy: number;
	chunk: Chunk;

	constructor(x: number, y: number, cmap: ChunkMap);
	constructor(other: GridExplorer);

	constructor(
		a: number | GridExplorer,
		b?: number,
		cmap?: ChunkMap
	) {
		if (a instanceof GridExplorer) {
			this.x = a.x;
			this.y = a.y;
			this.cx = a.cx;
			this.cy = a.cy;
			this.chunk = a.chunk;
			return;
		}

		if (typeof a === "number" && b !== undefined && cmap) {
			const initX = Math.floor(a / Chunk.SIZE);
			const initY = Math.floor(b / Chunk.SIZE);

			this.x = modulo(Math.floor(a), Chunk.SIZE);
			this.y = modulo(Math.floor(b), Chunk.SIZE);
			this.cx = initX;
			this.cy = initY;
			this.chunk = cmap.getChunk(initX, initY);
			return;
		}

		throw new TypeError("Invalid constructor parameters");
	}



	move(d: {x: number, y: number}, cmap: ChunkMap) {
		this.x += d.x;
		this.y += d.y;

		// Update chunk
		if (this.x >= Chunk.SIZE) {
			this.x -= Chunk.SIZE;
			this.cx++;
			this.chunk = cmap.getChunk(this.cx, this.cy);
		}
		
		if (this.y >= Chunk.SIZE) {
			this.y -= Chunk.SIZE;
			this.cy++;
			this.chunk = cmap.getChunk(this.cx, this.cy);
		}

		if (this.x < 0) {
			this.x += Chunk.SIZE;
			this.cx--;
			this.chunk = cmap.getChunk(this.cx, this.cy);
		}

		if (this.y < 0) {
			this.y += Chunk.SIZE;
			this.cy--;
			this.chunk = cmap.getChunk(this.cx, this.cy);
		}
	}

	getRoad() {
		return this.chunk.getRoad(this.x, this.y);
	}

   	setRoad(road: roadtypes.road_t) {
        return this.chunk.setRoad(this.x, this.y, road);
    }

}