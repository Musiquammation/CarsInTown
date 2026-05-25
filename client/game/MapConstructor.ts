import { Direction } from "./Direction";
import { CarColor } from "./CarColor";
import { GameMap } from "./GameMap";
import { road_t } from "./road_t";
import { Target } from "./Target";
import { RoadType } from "./roadtypes";

interface Road {
	x: number;
	y: number;
	data: road_t;
}


interface TargetProto {
	x: number;
	y: number;
	label: string;
	spawner?: number;
	targets: string[];
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
	targets: TargetProto[] = [];
	time = 0;
	size = 32;

	create() {
		const cmap = new GameMap(this.size);

		// Set roads
		for (const road of this.roads) {
			cmap.setRoad(road.x, road.y, road.data);
		}


		// Set targets
		const targets = new Map<string, Target>();
		for (const i of this.targets) {
			targets.set(i.label, new Target(i.x, i.y));
		}
		
		for (const i of this.targets) {
			const t = targets.get(i.label)!;
			t.directions = i.targets.map(label => {
				const value = targets.get(label);
				if (!value) {
					throw new Error("Cannot find key: " + value);
				}

				return value;
			});

			cmap.addTarget(t);
			cmap.setRoad(t.x, t.y, RoadType.TARGET);
		}

		

		


		// Set void roads
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

		const targets: TargetProto[] | undefined = data.targets;
		if (targets !== undefined)
			this.targets.push(...targets);

	}

	setCamera(camera: {x: number, y: number, z: number}) {
		camera.x = this.size/2;
		camera.y = this.size/2;
		camera.z = this.size * .8;
	}
}
