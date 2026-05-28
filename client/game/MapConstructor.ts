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
	spawnCount: number;
	spawnDelay: number;
	label: string;
	spawner?: number;
	color: CarColor;
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
			targets.set(i.label, new Target(
				i.x, i.y,
				i.spawnCount,
				i.spawnDelay,
				i.color
			));

			cmap.carsToEnterGoal += i.spawnCount;
		}
		
		// Add targets
		for (const i of this.targets) {
			const t = targets.get(i.label)!;
			t.directions = i.targets.map(label => {
				const value = targets.get(label);
				if (!value) {
					throw new Error("Cannot find key: " + value);
				}

				return value;
			});


			let symbol = 22;
			if (i.label.length === 2) {
				const c = i.label.charCodeAt(1);

				if (c >= 65 && c <= 90) { // A-Z
					symbol = c - 65;
				} else if (c >= 97 && c <= 122) { // a-z
					symbol = c - 97;
				} else if (c >= 48 && c <= 53) { // number
					symbol = 26 + (c - 48);
				} else if (c === 43) { // +
					symbol = 24;
				} else if (c === 45) { // -
					symbol = 23;
				} else if (c === 95) { // _
					symbol = 22;
				}
			}

			cmap.addTarget(t);
			cmap.setRoad(
				t.x,
				t.y,
				RoadType.TARGET | (i.color<<4) | (symbol<<7));
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
