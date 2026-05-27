import { ImageLoader } from "../handler/ImageLoader";
import { CarColor } from "./CarColor";
import { Direction } from "./Direction"
import { road_t } from "./road_t"
import { roadfn } from "./roadfn";


export enum RoadType {
	/**
	 * +00: (type)
	 * +04: code
	 * +15: (taken)
	 */
	VOID,

	/**
	 * +00: (type)
	 * +04: right?
	 * +05: up?
	 * +06: left?
	 * +07: down?
	 * +08: weight [in range 0-125]
	 * +15: (taken)
	 */
	ROAD,

	/**
	 * +00: (type)
	 * +04: color
	 * +07: symbol
	 * +12: (empty)
	 * +15: (taken)
	 */
	TARGET,

	/**
	 * +00: (type)
	 * +04: first:  side
	 * +07: second: side
	 * +10: first:  direction
	 * +12: second: direction
	 * +14: (empty)
	 * +15: (taken)
	 * 
	 * 
	 * for side:
	 *   0: nothing
	 *   1: front
	 *   2: right
	 *   3: left
	 *   4: front-right
	 *   5: front-left
	 *   6: left-right
	 *   7: all
	 */
	DIRECTION,

	/**
	 * +00: (type)
	 * +04: (empty)
	 * +06: direction
	 * +08: (empty)
	 * +15: (taken)
	 */
	YIELD,

	/**
	 * +00: (type)
	 * +04: bits
	 * +12: direction
	 * +14: (empty)
	 * +15: (taken)
	 */
	LIGHT,
}


export function drawRoad(
	ctx: CanvasRenderingContext2D,
	iloader: ImageLoader,
	road: road_t,
	lightStep: number
) {
	function drawImage(name: string, angle: number, flip = {x: false, y: false, color: -1}) {
		ctx.save();
		ctx.translate(0.5, 0.5);
		ctx.rotate(-angle);
		ctx.scale(flip.x ? -1 : 1, flip.y ? -1 : 1);
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(iloader.get(name, flip.color), -0.5, -0.5, 1, 1);
		ctx.restore();
	}


	switch (roadfn.getType(road)) {
	case RoadType.VOID:
		if (road & (1<<3)) {
			ctx.fillStyle = "black";
			ctx.fillRect(0, 0, 1, 1);
			return;
		}
		
		return;

	case RoadType.ROAD:
	{
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, 1, 1);
		return;
	}

	case RoadType.DIRECTION:
	{
		ctx.fillStyle = "#f00";
		ctx.fillRect(0, 0, 1, 1);
		return;
	}

	case RoadType.YIELD:
	{
		drawImage('yield', Math.PI/2 * ((road >> 6) & 0x3));
		break;
	}

	case RoadType.LIGHT:
	{
		const green = road & (1<<(lightStep+4));
		drawImage(green ? 'light_green' : 'light_red',
			Math.PI/2 * ((road >> 12) & 0x3));
		break;
	}

	case RoadType.TARGET:
	{
		const color: CarColor = (road >> 4) & 0x7;
		const direction: Direction = (road >> 6) & 0x3;
		drawImage('consumer', direction * Math.PI/2, {x: false, y: false, color: color});
		break;
	}


	default:
		throw new Error("Invalid road type");
	}
}


export function onRoadRotation(road: road_t): road_t | null {
	switch (roadfn.getType(road)) {
	case RoadType.YIELD: {
		let dir = (road >> 6) & 0x3;
		dir++;
		dir &= 0x3;

		road = (road & ~(0x3 << 6)) | (dir << 6);
		return road;
	}

	case RoadType.DIRECTION: {
		/// TODO: direction rotation
		return null;
	}

	case RoadType.LIGHT: {
		let dir = (road >> 12) & 0x3;
		dir++;
		dir &= 0x3;

		road = (road & ~(0x3 << 12)) | (dir << 12);
		return road;
	}


	default:
		return null;
	}
}


export function onRoadEdit(road: road_t):
	road_t | 'light' | 'direction' | null
{
	switch (roadfn.getType(road)) {
	case RoadType.LIGHT:
		return 'light';

	case RoadType.DIRECTION:
		return 'direction';

	default:
		return null;
	}
}


