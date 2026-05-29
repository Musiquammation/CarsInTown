import { CarColor } from "./CarColor";
import { Direction, getAttach, getDirectionDelta, rotateDirectionToLeft, rotateDirectionToRight } from "./Direction";
import { Game } from "./Game";
import { CAR_LINE, CAR_SIZE } from "./CAR_SIZE";
import { ImageLoader } from "../handler/ImageLoader";
import { getDanger } from "./getDanger";
import { Target } from "./Target";
import { api } from "./Api";


let nextCarId = 0;


type CarState = 'front' | 'turn-right' | 'turn-left';


function getDirectionTurn(
	origin: Direction,
	target: Direction
): CarState {
	const diff = (target - origin + 4) % 4;

	if (diff == 0 || diff == 2) return 'front';
	if (diff == 1) return 'turn-left';
	return 'turn-right';
}


export class Car {
	state: CarState = 'front';
	private direction: Direction;
	private speedLimit = 0.7;
	private realSpeed = this.speedLimit/6;
	private publicSpeed = 0;

	color: CarColor;
	frameLastPositionUpdate = -1;
	
	readonly id = nextCarId++;
	readonly pathId: number;
	
	x: number;
	y: number;
	target: Target;
	step = 0;

	private nextX = -1;
	private nextY = -1;
	private nextDir: number;

	constructor(
		x: number,
		y: number,
		target: Target,
		direction: Direction,
		pathfindingId: number,
		color: CarColor
	) {
		this.x = x;
		this.y = y;
		this.target = target;
		this.direction = direction;
		this.color = color;
		this.pathId = pathfindingId;
		this.nextDir = direction;
	}

	getCoords() {
		switch (this.state) {
		case 'front':
		{
			const a = Math.PI/2 * this.direction;
			switch (this.direction) {
			case Direction.RIGHT:
				return {
					x: this.x + this.step,
					y: this.y + .5,
					a
				};

			case Direction.LEFT:
				return {
					x: this.x + 1 - this.step,
					y: this.y + .5,
					a
				};

			case Direction.UP:
				return {
					x: this.x + .5,
					y: this.y + 1 - this.step,
					a
				};

			case Direction.DOWN:
				return {
					x: this.x + .5,
					y: this.y + this.step,
					a
				};
			}

			break;
		}

		case 'turn-right':
		{
			let {x,y} = getAttach(this.direction, true, this.step);
			const a = Math.PI/2 * (this.direction - this.step);
			x += this.x;
			y += this.y;
			return {x, y, a};
		}

		case 'turn-left':
		{
			let {x,y} = getAttach(this.direction, true, this.step);
			const a = Math.PI/2 * (this.direction + this.step);
			x += this.x;
			y += this.y;
			return {x, y, a};
		}


		}

		return {x: 0, y: 0, a: 0};
	}

	draw(ctx: CanvasRenderingContext2D, iloader: ImageLoader) {
		const {x, y, a} = this.getCoords();

		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(-a);

		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(iloader.get('car', this.color),
			-CAR_SIZE/2, -CAR_LINE/2, CAR_SIZE, CAR_LINE);

		ctx.restore();
	}


	behave(speedLimit: number, acceleration: number) {
		if (acceleration < 0) {
			this.realSpeed += acceleration;
			if (this.realSpeed < 0) {
				this.realSpeed = 0;
			}

		} else if (acceleration > 0) {
			const s = this.realSpeed;
			this.realSpeed += acceleration;
			if (this.realSpeed > speedLimit) {
				this.realSpeed = speedLimit;
			}
		}

		this.speedLimit = speedLimit;
	}
	
	move() {
		this.publicSpeed = this.realSpeed;

		this.step += this.realSpeed;

		if (this.step < 1) {
			return 0;
		}

		this.step -= 1;

		switch (this.state) {
		case 'front':
			break;

		case 'turn-right':
			this.direction = rotateDirectionToRight(this.direction);
			break;

		case 'turn-left':
			this.direction = rotateDirectionToLeft(this.direction);
			break;
		}


		const {x, y} = getDirectionDelta(this.direction);
		this.x += x;
		this.y += y;
		

		if (
			this.x === this.nextX &&
			this.y === this.nextY
		) {
			return this.appendSubTarget();
		}

		this.state = 'front';
		
		return 0;
	}

	appendSubTarget() {
		if (this.nextDir < 0) {
			// Path is finished
			this.removePath();
			this.target.absorbeCar();
			return this.target.isFinal() ? 2:1;
		}

		// Next node
		const {x, y, dir} = api.stepCar(this.pathId);
		this.state = getDirectionTurn(
			this.direction,
			this.nextDir
		);
		this.nextX = x;
		this.nextY = y;
		this.nextDir = dir;

		return 0;
	}

	getSpeedLimit() {
		return this.speedLimit;
	}

	getSpeed() {
		return this.publicSpeed;
	}

	getDirection() {
		return this.direction;
	}

	removePath() {
		api.removePath(this.pathId);
	}
}