import { Direction, getDirectionDelta } from "./Direction";
import { GameMap } from "./GameMap";
import { road_t } from "./road_t";
import { RoadType } from "./roadtypes";

interface Spy {
	x: number;
	y: number;
	dx: number;
	dy: number;
	dirFlag: road_t;
	nright: road_t;
	nup: road_t;
	nleft: road_t;
	ndown: road_t;
}

function moveSpy(map: GameMap, spy: Spy) {
	spy.x += spy.dx;
	spy.y += spy.dy;

	if (spy.x < 0 || spy.y < 0 || spy.x >= map.size || spy.y >= map.size)
		return true;

	spy.nright = map.getRoad(spy.x + 1, spy.y);
	spy.nup = map.getRoad(spy.x, spy.y + 1);
	spy.nleft = map.getRoad(spy.x - 1, spy.y);
	spy.ndown = map.getRoad(spy.x, spy.y - 1);
	return false;
}

function createSpy(map: GameMap, x: number, y: number, direction: Direction) {
	const delta = getDirectionDelta(direction);

	const nright = map.getRoad(x + 1, y);
	const nup = map.getRoad(x, y + 1);
	const nleft = map.getRoad(x - 1, y);
	const ndown = map.getRoad(x, y - 1);

	const spy: Spy = {
		x: x,
		y: y,
		dx: delta.x,
		dy: delta.y,
		dirFlag: 1 << (direction+4),
		nright,
		nup,
		nleft,
		ndown
	};

	return spy;
}

function appendSpy(spies: (Spy|null)[], spy: Spy) {
	for (let i = 0; i < spies.length; i++) {
		if (spies[i] === null) {
			spies[i] = spy;
			return;
		}
	}

	spies.push(spy);
}



/**
 * @return 1<<4 for right, 1<<5 for up, 1<<6 for left, 1<<7 for down
 */
function getDirections(map: GameMap, x: number, y: number) {
	const cell = map.getRoad(x, y);
	switch ((cell & 0xf) as RoadType) {
		case RoadType.VOID: {
			return 0;
		}

		case RoadType.ROAD: {
			return cell;
		}

		case RoadType.TARGET: {
			return cell & (1<<12) ?
				~0 : // spawner
				0; // not a spawner
		}

		case RoadType.DIRECTION: {
			return 0;
		}

		case RoadType.YIELD: {
			return 0;
		}

		case RoadType.LIGHT: {
			return 0;
		}

	}
}


function appendDirection(map: GameMap, x: number, y: number, dir: Direction) {
	const cell = map.getRoad(x, y);
	switch ((cell & 0xf) as RoadType) {
		case RoadType.ROAD: {
			break;
		}

		case RoadType.DIRECTION: {
			break;
		}

		default:
			break;
	}
}


export namespace roadfn {
	export function getType(road: road_t) {
		return (road & 0xf) as RoadType;
	}

	export function setType(type: RoadType) {
		return (type & 0xf) as road_t;
	}


	export function deleteRoad(map: GameMap, originX: number, originY: number) {

	}

	export function placeRoad(map: GameMap, originX: number, originY: number) {
		// Add direction block
		{
			interface Neighboor {
				dir: Direction;
				x: number;
				y: number;
			}

			const neighboors: Neighboor[] = [];
			for (let dir = 0; dir < 4; dir++) {
				const {x, y} = getDirectionDelta(dir);
				const flag = getDirections(map, originX - x, originY - y);

				if (flag) {
					neighboors.push({dir, x, y});
				}
			}

			if (neighboors.length === 1) {
				const n = neighboors[0];
				appendDirection(map, n.x, n.y, n.dir);
			}
		}

		const spies: (Spy | null)[] = [
			Direction.RIGHT, Direction.UP,
			Direction.LEFT, Direction.DOWN
		].filter(dir => {
			const {x, y} = getDirectionDelta(dir);
			const flag = getDirections(map, originX - x, originY - y);
			return (flag & (1 << (dir+4)));
		}).map(dir => createSpy(map, originX, originY, dir));




		let count = spies.length;
		while (count > 0) {
			count = spies.length;

			for (let i = 0; i < spies.length; i++) {
				const spy = spies[i];
				if (spy === null) {count--; continue;}
	
	
				function killSpy() {
					spies[i] = null;
					count--;
				}
				
				const cell = map.getRoad(spy.x, spy.y);
				switch ((cell & 0xf) as RoadType) {
					case RoadType.VOID: {
						// Kill spy
						killSpy();
						break;
					}
	
					case RoadType.ROAD: {
						map.setRoad(spy.x, spy.y, cell | spy.dirFlag)
						break;
					}
	
					case RoadType.TARGET:
					case RoadType.DIRECTION:
					case RoadType.YIELD:
					case RoadType.LIGHT:
						break;
				}
	
				console.log(spy);
	
				// For next iteration
				if (moveSpy(map, spy)) {
					killSpy(); // spy out of bounds
				}
			}
		}
	}
}