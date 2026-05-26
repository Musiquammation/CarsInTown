class Api {
	private _init!: (mapSize: number) => number;
	private _reserveCars!: (length: number) => number;
	private _getDangers!: () => void;
	private _cleanup!: () => void;

	private _ready: Promise<void>;
	private _resolveReady!: () => void;

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

	async reserveCars(length: number) {
		await this.ready();
		return this._reserveCars(length);
	}

	async getDangers() {
		await this.ready();
		return this._getDangers();
	}
}


export const api = new Api();


declare global {
	interface Window {
		WASM_PATH: string;
	}
}

console.log(window.WASM_PATH);

import(window.WASM_PATH).then(({ default: createModule }) => {
	createModule().then((instance: any) => {
		api.appendModule(instance);
	});
});