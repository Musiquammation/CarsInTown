import { ImageLoader } from "../handler/ImageLoader";
import { CarColor } from "./CarColor";
import { ChunkMap } from "./ChunkMap";
import {Direction} from "./Direction"
import { lightSizeEditor, LightSizeEditor } from "./LightSizeEditor";

export namespace roadtypes {
	export type road_t = number;

	/**
	 * [+0,+1,+2]: type
	 * [+3,+4,+5,+6,+7]: data
	 */
	export enum types {
		/**
		 * [+3]: locked
		 */
		VOID = 0,

		/**
		 * No data
		 */
		ROAD,

		/**
		 * [+3,+4,+5]: type
		 * [+6, +7]: origin direction
		*/
		TURN,
		
		
		/**
		 * [+6, +7]: origin direction
		 */
		PRIORITY,


		/**
		 * [+3]: 1=green ; 0=red
		 * [+4, +5]: cycle size {00=4, 01=8, 10=16, 11=32}
		 * [+6, +7]: origin direction
		 */
		LIGHT,

		/**
		 * [+3, +4]: code {00=front, 01=right, 10=front, 11=left}
		 * [+5]: share
		 * [+6, +7]: origin direction
		 */
		ALTERN,

		/**
		 * [+3,+4,+5]: color
		 * [+6,+7]: direction
		 */
		SPAWNER,

		/**
		 * [+3,+4,+5]: color
		 */
		CONSUMER,
	}

	export enum TurnDirection {
		RIGHT,
		LEFT,
		ALL_0,
		ALL_1,
		ALL_2,
		ALL_3,
		ALL_4,
		ALL_5,
	}




	export function generateExtraData(road: road_t): any {
		switch (road & 0x7) {
		case types.VOID:
			return null;
		
		case types.ROAD:
			return null;

		case types.TURN:
			return null;

		default:
			throw new Error("Invalid road type");
		}
	}

	
	export function draw(ctx: CanvasRenderingContext2D, iloader: ImageLoader, road: road_t) {
		function drawImage(name: string, angle: number, flip = {x: false, y: false, color: -1}) {
			ctx.save();
			ctx.translate(0.5, 0.5);
			ctx.rotate(-angle);
			ctx.scale(flip.x ? -1 : 1, flip.y ? -1 : 1);
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(iloader.get(name, flip.color), -0.5, -0.5, 1, 1);
			ctx.restore();
		}


		switch (road & 0x7) {
		case types.VOID:
			if (road & (1<<3)) {
				ctx.fillStyle = "black";
				ctx.fillRect(0, 0, 1, 1);
				return;
			}
			
			return;

		case types.ROAD:
		{
			ctx.fillStyle = "#877";
			ctx.fillRect(0, 0, 1, 1);
			return;
		}

		case types.TURN:
		{
			const type: TurnDirection = (road >> 3) & 0x7;
			const direction = Math.PI/2 * ((road >> 6) & 0x3);

			switch (type) {
			case TurnDirection.RIGHT:
				drawImage('turn', direction);
				break;

			case TurnDirection.LEFT:
				drawImage('turn', direction, {x: false, y: true, color: -1});
				break;
				
			case TurnDirection.ALL_0:
			case TurnDirection.ALL_1:
			case TurnDirection.ALL_2:
			case TurnDirection.ALL_3:
			case TurnDirection.ALL_4:
			case TurnDirection.ALL_5:
				drawImage('all' + (type - TurnDirection.ALL_0), direction);
				break;

			}

			return;
		}

		case types.PRIORITY:
		{
			drawImage('yield', Math.PI/2 * ((road >> 6) & 0x3));
			break;
		}

		case types.LIGHT:
		{
			drawImage(road & (1<<3) ? 'light_green' : 'light_red',
				Math.PI/2 * ((road >> 6) & 0x3));
			break;
		}

		case types.ALTERN:
		{
			let path = (road & (1 << 5)) ? 'filter_share_' : 'filter_';
			let flip = false;

			switch ((road >> 3) & 0x3) {
			case 0:
			case 2:
				path += 'front';
				flip = false;
				break;

			case 1:
				path += 'turn';
				flip = false;
				break;

			case 3:
				path += 'turn';
				flip = true;
				break;

			}
			const direction: Direction = (road >> 6) & 0x3;
			drawImage(path, direction * Math.PI/2, {x: false, y: flip, color: -1});
			break;
		}

		case types.SPAWNER:
		{
			const color: CarColor = (road >> 3) & 0x7;
			const direction: Direction = (road >> 6) & 0x3;
			drawImage('spawner', direction * Math.PI/2, {x: false, y: false, color: color});
			break;
		}

		case types.CONSUMER:
		{
			const color: CarColor = (road >> 3) & 0x7;
			drawImage('consumer', 0, {x: false, y: false, color: color});
			break;
		}

		default:
			throw new Error("Invalid road type");
		}
	}


	export function onRotation(road: road_t): road_t | null {
		switch (road & 0x7) {
		case types.TURN:
		case types.PRIORITY:
		case types.LIGHT:
		case types.ALTERN:
		{
			let dir = (road >> 6) & 0x3;
			dir++;
			dir &= 0x3;

			road = (road & ~(0x3 << 6)) | (dir << 6);
			return road;
		}


		default:
			return null;
		}
	}


	export function onScroll(road: road_t, delta: number): road_t | 'light' | null {
		switch (road & 0x7) {
		case types.TURN:
		{
			let type = (road >> 3) & 0x7;
			if (delta > 0) {
				type--;
				if (type < 0) {
					type = 7;
				}
			} else {
				type++;
				if (type >= 8) {
					type = 0;
				}
			}

			road = (road & ~(0x7 << 3)) | ((type << 3));
			return road;
		}

		case types.ALTERN:
			return road ^ (1<<5); // toggle share

		case types.LIGHT:
			return 'light';

		default:
			return null;
		}
	}
}

