import { Car } from "./Car";

const actionMap = {
	'front': 0,
	'turn-right': 1,
	'turn-left': 2,
};

class Api {
	private _init!: (mapSize: number) => number;
	private _reserveCars!: (length: number) => number;
	private _getDangers!: () => void;
	private _addPath!: (srcX: number, srcY: number,
		dstX: number, dstY: number) => number;
	private _removePath!: (id: number) => void;
	private _cleanup!: () => void;

	private _ready: Promise<void>;
	private _resolveReady!: () => void;

	private module: any;

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

		this._cleanup = module.cwrap("Api_cleanup", null, ["number"]);
		
		this.module = module;

		this._resolveReady();
		console.log("WASM module loaded");
	}

	private async ready() {
		await this._ready;
	}

	async init(mapSize: number) {
		await this.ready();
		return this._init(mapSize);
	}

	async cleanup() {
		await this.ready();
		return this._cleanup();
	}

	async getDangers(cars: Car[]) {
		await this.ready();

		const ptr = this._reserveCars(cars.length);

		const HEAP32 = this.module.HEAP32;
		const HEAPF32 = this.module.HEAPF32;

		
		// Define cars
		let offset = ptr >> 2;
		for (const car of cars) {
			HEAP32[offset++] = car.x;
			HEAP32[offset++] = car.y;
			HEAPF32[offset++] = car.step;
			HEAPF32[offset++] = car.getSpeed();
			HEAPF32[offset++] = car.getSpeedLimit();
			HEAP32[offset++] = car.getDirection();
			HEAP32[offset++] = car.pathId;
			HEAP32[offset++] = actionMap[car.state];
			offset += 2; // output data
		}

		this._getDangers();

		// Behave cars cars
		offset = ptr >> 2;
		for (const car of cars) {
			offset += 8; // input data
			const acc = HEAP32[offset++];
			const speedLimit = HEAP32[offset++];
			car.behave(speedLimit, acc);
		}
	}

	async addPath(
		srcX: number, srcY: number,
		dstX: number, dstY: number
	) {
		await this.ready();
		return this._addPath(srcX, srcY, dstX, dstY);
	}

	async removePath(id: number) {
		await this.ready();
		return this._removePath(id);
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