import { CarColor } from "./CarColor";
import { Direction, getAttach } from "./Direction";
import { Game } from "./Game";
import { CAR_LINE, CAR_SIZE } from "./CAR_SIZE";
import { ImageLoader } from "../handler/ImageLoader";
import { road_t } from "./road_t";
import { getDanger } from "./getDanger";


const RENDER_DISTANCE = 32;

let nextCarId = 0;


type CarState = 'front' | 'turn-right' | 'turn-left' |
	'won' | 'waiting' | 'killed';


export class Car {
	state: CarState = 'front';
	private direction: Direction;
	private speedLimit = .2;
	private realSpeed = 0;
	private publicSpeed = 0;

	color: CarColor;
	frameLastPositionUpdate = -1;
	
	readonly id = nextCarId++;
	
	x: number;
	y: number;
	step = 0;
	score: number;

	constructor(
		x: number,
		y: number,
		direction: Direction,
		color: CarColor,
		score: number
	) {
		this.x = x;
		this.y = y;
		this.direction = direction;
		this.color = color;
		this.score = score;
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
			const {x,y} = getAttach(this.direction, true, this.step);
			const a = Math.PI/2 * (this.direction + this.step);
			return {x, y, a};
		}

		case 'turn-left':
		{
			const {x,y} = getAttach(this.direction, true, this.step);
			const a = Math.PI/2 * (this.direction - this.step);
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

		ctx.fillStyle = "black";
		ctx.font = "1px consolas";

		ctx.restore();
	}

	behave(game: Game) {
		const {speedLimit, acceleration} = getDanger(
			this, RENDER_DISTANCE, game.gameMap!
		);

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
		
	}
}