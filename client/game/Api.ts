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
	private _getDangers!: () => void;
	private _addPath!: (firstDir: number, srcX: number, srcY: number,
		dstX: number, dstY: number) => number;
	private _removePath!: (id: number) => void;
	private _setRoad!: (idx: number, road: road_t) => void;
	private _cleanup!: () => void;

	private _ready: Promise<void>;
	private _resolveReady!: () => void;

	private module: any;
	private mapPtr = -1;

	constructor() {
		this._ready = new Promise((resolve) => {
			this._resolveReady = resolve;
		});
	}

	appendModule(module: any) {
		this._init = module.cwrap("Api_init", "number", ["number"]);
		this._reserveCars = module.cwrap("Api_reserveCars", "number", ["number"]);
		this._getDangers = module.cwrap("Api_getDangers", null, []);
		this._cleanup = module.cwrap("Api_cleanup", null, []);

		this._addPath = module.cwrap("Api_addPath",
			"number", ["number","number","number","number"]);

		this._removePath = module.cwrap("Api_removePath",
			null, ["number"]);

		this._setRoad = module.cwrap("Api_setRoad",
			null, ["number", "number"]);

		this._cleanup = module.cwrap("Api_cleanup", null, []);
		
		this.module = module;

		this._resolveReady();
		console.log("WASM module loaded");
	}

	private async ready() {
		await this._ready;
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

	async getDangers(cars: Car[]) {
		await this.ready();

		const ptr = this._reserveCars(cars.length);

		const HEAP32 = this.module.HEAP32;
		const HEAPF32 = this.module.HEAPF32;

		
		// Define cars
		let offset = ptr >> 2;
		for (let i = 0; i < cars.length; i++) {
			const car = cars[i];
			HEAP32[offset++] = car.x;
			HEAP32[offset++] = car.y;
			HEAPF32[offset++] = car.step;
			HEAPF32[offset++] = car.getSpeed();
			HEAPF32[offset++] = car.getSpeedLimit();
			HEAP32[offset++] = car.getDirection();
			HEAP32[offset++] = car.pathId;
			HEAP32[offset++] = actionMap[car.state];
			HEAP32[offset++] = i;
			offset += 2; // output data
		}

		this._getDangers();

		// Behave cars cars
		offset = ptr >> 2;
		for (let i = 0; i < cars.length; i++) {
			offset += 8; // input data
			const id = HEAP32[offset++];
			const car = cars[id];
			const acc = HEAP32[offset++];
			const speedLimit = HEAP32[offset++];
			car.behave(speedLimit, acc);
		}
	}

	async addPath(
		firstDir: number,
		srcX: number, srcY: number,
		dstX: number, dstY: number
	) {
		await this.ready();
		return this._addPath(firstDir, srcX, srcY, dstX, dstY);
	}

	async removePath(id: number) {
		await this.ready();
		return this._removePath(id);
	}

	async setRoad(idx: number, road: road_t) {
		await this.ready();

		road &= ~(1<<15); // remove car mark
		this.module.HEAP16[this.mapPtr + idx] = road;
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