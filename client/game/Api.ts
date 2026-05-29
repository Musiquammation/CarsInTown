import { Car } from "./Car";
import { road_t } from "./road_t";

const actionMap = {
	'front': 0,
	'turn-right': 1,
	'turn-left': 2,
};

class Api {
	private _init!: (mapSize: number) => number;
	private _reserveCars!: (length: number) => number;
	private _getDangers!: (lightStep: number) => number;
	private _addPath!: (firstDir: number, srcX: number, srcY: number,
		dstX: number, dstY: number) => number;
	private _removePath!: (id: number) => void;
	private _movePath!: (id: number) => number;
	private _cleanup!: () => void;

	private _ready: Promise<void>;
	private _resolveReady!: () => void;

	private module: any = null;
	private mapPtr = -1;

	constructor() {
		this._ready = new Promise((resolve) => {
			this._resolveReady = resolve;
		});
	}

	appendModule(module: any) {
		this._init = module.cwrap("Api_init", "number", ["number"]);
		this._reserveCars = module.cwrap("Api_reserveCars", "number", ["number"]);
		this._getDangers = module.cwrap("Api_getDangers", "number", ["number"]);
		this._cleanup = module.cwrap("Api_cleanup", null, []);

		this._addPath = module.cwrap("Api_addPath",
			"number", ["number","number","number","number"]);

		this._removePath = module.cwrap("Api_removePath",
			null, ["number"]);

		this._movePath = module.cwrap("Api_movePath",
			"number", ["number"]);

		this._cleanup = module.cwrap("Api_cleanup", null, []);
		
		this.module = module;

		this._resolveReady();
		console.log("WASM module loaded");
	}

	private async ready() {
		await this._ready;
	}

	private enshure() {
		if (this.module === null) {
			throw new Error("Module is not loaded");
		}
	}

	async init(mapSize: number) {
		await this.ready();
		this.mapPtr = this._init(mapSize) >> 1;
		console.log("Map initialized");
	}
	
	async cleanup() {
		await this.ready();
		console.log("Map clean");
		this._cleanup();
	}

	getDangers(cars: Car[], lightStep: number) {

		this.enshure();

		const ptr = this._reserveCars(cars.length);

		let HEAP32 = this.module.HEAP32;
		let HEAPF32 = this.module.HEAPF32;

		
		// Define cars
		let offset = ptr >> 2;
		for (let i = 0; i < cars.length; i++) {
			const car = cars[i];

			// Get useful direction
			let dir = car.getDirection();
			if (car.state == 'turn-left') {
				dir = (dir+1)%4;
			} else if (car.state === 'turn-right') {
				dir = (dir+3)%4;
			}

			HEAP32[offset++] = car.x;
			HEAP32[offset++] = car.y;
			HEAPF32[offset++] = car.step;
			HEAPF32[offset++] = car.getSpeed();
			HEAPF32[offset++] = car.getSpeedLimit();
			HEAP32[offset++] = dir;
			HEAP32[offset++] = car.pathId;
			HEAP32[offset++] = actionMap[car.state];
			HEAP32[offset++] = i;
			offset += 2; // output data
		}


		const error = this._getDangers(lightStep);

		if (error) {
			throw new Error("getDangers exited " + error);
		}

		HEAP32 = this.module.HEAP32;
		HEAPF32 = this.module.HEAPF32;


		// Behave cars cars
		offset = ptr >> 2;
		for (let i = 0; i < cars.length; i++) {
			offset += 8; // input data
			const id = HEAP32[offset++];
			const car = cars[id];
			const acc = HEAPF32[offset++];
			const speedLimit = HEAPF32[offset++];

			// Misterious bug
			try {
				car.behave(speedLimit, acc);
			} catch (e) {
				console.log(id, cars.length);
				console.error(e);
			}
		}

	}

	addPath(
		firstDir: number,
		srcX: number, srcY: number,
		dstX: number, dstY: number
	) {
		this.enshure();
		return this._addPath(firstDir, srcX, srcY, dstX, dstY);
	}

	removePath(id: number) {
		this.enshure();
		return this._removePath(id);
	}

	setRoad(idx: number, road: road_t) {
		this.ready().then(() => {
			road &= ~(1<<15); // remove car mark
			this.module.HEAP16[this.mapPtr + idx] = road;
		});

	}

	stepCar(id: number) {
		this.enshure();

		const ptr = this._movePath(id);

		let offset = ptr >> 2;
		const x = this.module.HEAP32[offset++];
		const y = this.module.HEAP32[offset++];
		const dir = this.module.HEAP32[offset++];

		return {x, y, dir};
	}
}


export const api = new Api();


declare global {
	interface Window {
		WASM_PATH: string;
	}
}


import(/* @vite-ignore */window.WASM_PATH).then(({ default: createModule }) => {
	createModule().then((instance: any) => {
		api.appendModule(instance);
	});
});