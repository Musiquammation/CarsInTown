import { CarColor } from "./CarColor";

export class Target {
	readonly x: number;
	readonly y: number;
	readonly spawnCount: number;
	readonly spawnDelay: number;
	readonly color: CarColor;
	directions: Target[] = [];
	private step = 0;
	private spawnLeft: number;
	private spawnCooldown: number;


	constructor(
		x: number, y: number,
		spawnCount: number,
		spawnDelay: number,
		color: CarColor
	) {
		this.x = x;
		this.y = y;
		this.color = color;

		this.spawnCount = spawnCount;
		this.spawnDelay = spawnDelay;
		this.spawnCooldown = spawnDelay;
		this.spawnLeft = spawnCount;
	}

	desiresSpawn() {
		if (this.spawnLeft <= 0)
			return false;

		this.spawnCooldown--;
		if (this.spawnCooldown > 0)
			return false;

		return true;
	}

	spawn() {
		if (this.isFinal())
			return null;

		this.spawnCooldown = this.spawnDelay;
		this.spawnLeft--;
		return this.makeSpawn();

	}

	absorbeCar() {
		this.spawnLeft++;
	}

	private makeSpawn() {
		if (this.directions.length <= 0)
			return null;

		return this.directions[this.step];
	}

	toNextStep() {
		this.step++;
		if (this.step >= this.directions.length) {
			this.step -= this.directions.length;
		}
	}


	reset() {
		this.step = 0;

		this.spawnLeft = this.spawnCount;
		this.spawnCooldown = this.spawnDelay;
	}

	isFinal() {
		return this.directions.length <= 0;
	}
}