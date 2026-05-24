import { Vector2 } from "../handler/Vector2";
import { CarColor } from "./CarColor";
import { ChunkMap } from "./ChunkMap";
import { Direction, getAttach, getCellDist, rotateDirectionToLeft, rotateDirectionToRight } from "./Direction";
import { Game } from "./Game";
import { roadtypes } from "./roadtypes";
import { CAR_LINE, CAR_SIZE } from "./CAR_SIZE";
import { modulo } from "./modulo";
import { getDanger } from "./getDanger";
import { ImageLoader } from "../handler/ImageLoader";
import { turnSideSelector } from "./TurnSideSelector";


const RENDER_DISTANCE = 32;

let nextCarId = 0;



export class Car {
	direction: Direction;
	acceleration = .003;
	deceleration = .008;
	speedLimit = .2;
	speed = this.speedLimit;
	nextSpeed = this.speedLimit;
	rotationStep = -1;
	rotatingToRight = false;
	color: CarColor;
	frameLastPositionUpdate = -1;
	alive = true;
	
	readonly id = nextCarId++;
	
	x: number;
	y: number;
	lastBlockX: number;
	lastBlockY: number;
	score: number;

	constructor(
		x: number,
		y: number,
		spawnerId: number,
		direction: Direction,
		color: CarColor,
		score: number
	) {
		this.x = x;
		this.y = y;
		this.lastBlockX = Math.floor(x);
		this.lastBlockY = Math.floor(y);

		this.direction = direction;
		this.color = color;
		this.score = score;
	}



	getCellDist() {
		if (this.rotationStep >= 0)
			return Math.min(this.rotationStep, 1);

		return getCellDist(this.direction, this.x, this.y);
	}

	draw(ctx: CanvasRenderingContext2D, road: roadtypes.road_t, iloader: ImageLoader) {
		let x: number;
		let y: number;
		let angle: number;

		switch (road & 0x7) {
		case roadtypes.types.VOID:
		case roadtypes.types.ROAD:
			x = this.x;
			y = this.y;
			angle = Math.PI/2 * this.direction;
			break;
	
		case roadtypes.types.TURN:
		case roadtypes.types.ALTERN:
		{
			if (this.rotationStep >= 0) {
				const m = getAttach(this.direction, this.rotatingToRight, this.rotationStep);
				x = Math.floor(this.x) + m.x;
				y = Math.floor(this.y) + m.y;


				angle = Math.PI/2 * (this.direction + (this.rotatingToRight?-1:1) * this.rotationStep);

			} else {
				x = this.x;
				y = this.y;
				angle = Math.PI/2 * this.direction;
			}
			break;
		}

		default:
			x = this.x;
			y = this.y;
			angle = Math.PI/2 * this.direction;
		}


		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(-angle);

		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(iloader.get('car', this.color),
			-CAR_SIZE/2, -CAR_LINE/2, CAR_SIZE, CAR_LINE);

		ctx.fillStyle = "black";
		ctx.font = "1px consolas";

		ctx.restore();
	}

	behave(road: roadtypes.road_t, game: Game):
		'alive' | 'won' | 'killed' | roadtypes.road_t

	{
		let roadToReturn: roadtypes.road_t | null = null;
		let speedTarget = this.speedLimit;
		let alive: 'alive' | 'won' | 'killed' = 'alive';

		const px = Math.floor(this.x);
		const py = Math.floor(this.y);

		// Entry in a new block
		if (px != this.lastBlockX || py != this.lastBlockY) {
			this.rotationStep = -1;

			switch (road & 0x7) {
			case roadtypes.types.VOID:
				alive = 'killed';
				break;

			case roadtypes.types.ROAD:
			case roadtypes.types.PRIORITY:
			case roadtypes.types.SPAWNER:
				break;

			case roadtypes.types.TURN:
			{
				const direction: Direction = ((road >> 6) & 0x3);
				if (this.direction !== direction)
					break;
				
				const type: roadtypes.TurnDirection = (road >> 3) & 0x7;

				switch (type) {
				case roadtypes.TurnDirection.RIGHT:
					this.rotatingToRight = true;
					this.rotationStep = 0;
					break;

				case roadtypes.TurnDirection.LEFT:
					this.rotatingToRight = false;
					this.rotationStep = 0;
					break;

				default:
					switch (turnSideSelector.getConfig(type - 2)[this.color]) {
					case 0: // front
						break;

					case -1: // left
						this.rotatingToRight = false;
						this.rotationStep = 0;
						break;

					case 1:
						this.rotatingToRight = true;
						this.rotationStep = 0;
						break;
					}

					break;
					
				}

				break;
			}

			case roadtypes.types.ALTERN:
			{
				const direction: Direction = ((road >> 6) & 0x3);
				if (this.direction !== direction)
					break;

				let code = (road >> 3) & 0x3;
				
				switch (code) {
				case 0: // front
					code = 1;
					break;

				case 1: // right
					this.rotatingToRight = true;
					this.rotationStep = 0;
					code = 2;
					break;

				case 2: // front
					code = 3;
					break;

				case 3: // left
					this.rotatingToRight = false;
					this.rotationStep = 0;
					code = road & (1<<5) ? 1 : 0;
					break;
				}

				roadToReturn = (road & ~(0x3 << 3)) | ((code & 0x3) << 3);
				break;
			}


			case roadtypes.types.CONSUMER:
			{
				const color = road >> 3;
				if (this.color === color) {
					alive = 'won';
				}
				break;
			}
			}


			this.lastBlockX = px;
			this.lastBlockY = py;
		}


		// Update speed limit
		if ((road & 0x7) === roadtypes.types.VOID) {
			alive = 'killed';
		} else {
			const speed = getDanger(this, RENDER_DISTANCE, game.chunkMap);
			if (speed.lim < speedTarget) {
				speedTarget = speed.lim;
			}

			if ((speed.fast > speedTarget || speed.acceleration > this.acceleration)
				&& speed.slow < speedTarget
			) {
				speedTarget = speed.slow;
			}


			if (this.id === 0 && (window as any).stopFirst) {
				speedTarget = 0;
			}

			if (speedTarget < 0)
				speedTarget = 0;


		}


		// Adapt speed to speedTarget
		let speed = this.speed;
		if (speed < speedTarget) {
			speed += this.acceleration;
			if (speed > speedTarget) {
				speed = speedTarget;
			}
			
		} else if (speed > speedTarget) {
			speed = speedTarget;
		}

		this.nextSpeed = speed;


		if (alive === 'alive' && roadToReturn !== null) {
			return roadToReturn;
		}
		
		return alive;
	}
	
	move() {
		this.speed = this.nextSpeed;

		if (this.rotationStep < 0) {
			switch (this.direction) {
			case Direction.RIGHT:
				this.x += this.speed;
				break;
	
			case Direction.UP:
				this.y -= this.speed;
				break;
	
			case Direction.LEFT:
				this.x -= this.speed;
				break;
	
			case Direction.DOWN:
				this.y += this.speed;
				break;
			}
			
			return;
		}

		this.rotationStep += this.speed;

		if (this.rotationStep >= 1) {
			const nextDir = this.rotatingToRight ?
				rotateDirectionToRight(this.direction) :
				rotateDirectionToLeft(this.direction);

			let dx;
			let dy;
			switch (nextDir) {
			case Direction.RIGHT:
				dx = 1.01;
				dy = .5;
				break;

			case Direction.UP:
				dx = .5;
				dy = -.01;
				break;

			case Direction.LEFT:
				dx = -.01;
				dy = .5;
				break;

			case Direction.DOWN:
				dx = .5
				dy = 1.01;
				break;
			}

			
			this.x = Math.floor(this.x) + dx;
			this.y = Math.floor(this.y) + dy;
			this.direction = nextDir;
			this.rotationStep = -1;
		}
	}
}