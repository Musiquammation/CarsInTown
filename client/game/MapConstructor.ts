import { Direction } from "./Direction";
import { CarColor } from "./CarColor";
import { GameMap } from "./GameMap";
import { modulo } from "./modulo";
import { road_t } from "./road_t";

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
	data: road_t;
}

export class MapConstructor {
	constructor();
	constructor(data: any);

	constructor(data?: any) {
		if (data) {
			this.appendJSON(data);
		}
	}

	roads: Road[] = [];
	time = 0;
	size = 32;

	create() {
		const cmap = new GameMap(this.size);

		for (const road of this.roads) {
			cmap.setRoad(road.x, road.y, road.data);
		}

		const voidRoad = 1<<3;
		const n = this.size-1;
		for (let i = 0; i < n; i++) {
			cmap.setRoad(i, 0, voidRoad);
			cmap.setRoad(i, n, voidRoad);
			cmap.setRoad(0, i, voidRoad);
			cmap.setRoad(n, i, voidRoad);
		}

		cmap.setRoad(n, n, voidRoad);


		return cmap;
	}

	appendJSON(data: any) {
		const time: number | undefined = data.time;
		if (time !== undefined)
			this.time = time;

		const size: number | undefined = data.size;
		if (size !== undefined)
			this.size = size;

		const roads: Road[] | undefined = data.roads;
		if (roads !== undefined)
			this.roads.push(...roads);

	}

	setCamera(camera: {x: number, y: number, z: number}) {
		camera.x = this.size/2;
		camera.y = this.size/2;
		camera.z = this.size * .8;
	}
}
