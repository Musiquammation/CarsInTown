import { Direction } from "./Direction";
import { CarColor } from "./CarColor";
import { ChunkMap } from "./ChunkMap";
import { Chunk } from "./Chunk";
import { roadtypes } from "./roadtypes";
import { modulo } from "./modulo";

interface CarSpawner {
	x: number;
	y: number;
	color: CarColor;
	rythm: number;
	couldown: number;
	direction: Direction;
	count: number;
	score: number;
}

interface Road {
	x: number;
	y: number;
	data: roadtypes.road_t;
}

export class MapConstructor {
	constructor();
	constructor(data: any);

	constructor(data?: any) {
		if (data) {
			this.appendJSON(data);
		}
	}

	carSpawners: CarSpawner[] = [];
	roads: Road[] = [];
	time = 0;
	width = 32;
	height = 32;

	fill(cmap: ChunkMap) {
		cmap.time = this.time;
		cmap.gameArea.x = Math.ceil(this.width/Chunk.SIZE);
		cmap.gameArea.y = Math.ceil(this.height/Chunk.SIZE);

		for (let i = 0; i < this.carSpawners.length; i++) {
			const spawner = this.carSpawners[i];

			const chunk = cmap.getChunk(
				Math.floor(spawner.x/Chunk.SIZE),
				Math.floor(spawner.y/Chunk.SIZE)
			);

			chunk.appendCarSpawner({
				x: modulo(spawner.x, Chunk.SIZE),
				y: modulo(spawner.y, Chunk.SIZE),
				color: spawner.color,
				rythm: spawner.rythm,
				startCouldown: spawner.couldown,
				couldown: spawner.couldown,
				direction: spawner.direction,
				startCount: spawner.count,
				count: spawner.count,
				score: spawner.score,
				currentId: i
			});
		}

		for (const road of this.roads) {
			cmap.setRoad(road.x, road.y, road.data);
		}

		const voidRoad = 1<<3;
		for (let i = 0; i < this.width; i++) {
			cmap.setRoad(i, 0, voidRoad);
			cmap.setRoad(i, this.height, voidRoad);
		}
		for (let i = 0; i < this.height; i++) {
			cmap.setRoad(0, i, voidRoad);
			cmap.setRoad(this.width, i, voidRoad);
		}
		cmap.setRoad(this.width, this.height, voidRoad);
	}

	appendJSON(data: any) {
		const time: number | undefined = data.time;
		if (time !== undefined)
			this.time = time;

		const width: number | undefined = data.width;
		if (width !== undefined)
			this.width = width;

		const height: number | undefined = data.height;
		if (height !== undefined)
			this.height = height;


		const spawners: CarSpawner[] | undefined = data.spawners;
		if (spawners !== undefined)
			this.carSpawners.push(...spawners);

		const roads: Road[] | undefined = data.roads;
		if (roads !== undefined)
			this.roads.push(...roads);

	}

	setCamera(camera: {x: number, y: number, z: number}) {
		camera.x = this.width/2;
		camera.y = this.height/2;
		camera.z = Math.max(this.width, this.height) * 0.8;
	}
}
