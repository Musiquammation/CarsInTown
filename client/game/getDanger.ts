import { Car } from "./Car";
import { CAR_LINE, CAR_SIZE } from "./CAR_SIZE";
import { Chunk } from "./Chunk";
import { ChunkMap } from "./ChunkMap";
import { Direction, getCellDist, getDirectionDelta, opposeDirection, rotateDirectionToLeft, rotateDirectionToRight } from "./Direction";
import { GridExplorer } from "./GridExplorer";
import { modulo } from "./modulo";
import { roadtypes } from "./roadtypes";
import { turnSideSelector } from "./TurnSideSelector";




function getCarsDist(dir: Direction, over: Car) {
	if (over.rotationStep < 0) {
		
	}

	switch (dir) {
	case Direction.RIGHT:
		return Math.max(0, CAR_SIZE/2 - modulo(over.x, 1));
		
	case Direction.UP:
		return Math.max(0, modulo(over.y, 1) + CAR_SIZE/2 - 1);
		
	case Direction.LEFT:
		return Math.max(0, modulo(over.x, 1) + CAR_SIZE/2 - 1);

	case Direction.DOWN:
		return Math.max(0, CAR_SIZE/2 - modulo(over.y, 1));
	}


}



const SIZE_LIM = (3 - CAR_SIZE - CAR_LINE) / 2;


class DirHelper {
	realMove: number;
	dir: Direction;
	d: {x: number, y: number};
	rdir: Direction;
	ldir: Direction;
	rd: {x: number, y: number};
	ld: {x: number, y: number};
	rop: Direction;
	lop: Direction;

	constructor(car: Car);
	constructor(original: DirHelper);

	constructor(a: Car | DirHelper) {
		if (a instanceof Car) {
			this.dir = a.direction;
			this.realMove = a.getCellDist();
	
			this.d = getDirectionDelta(this.dir);
			this.rdir = rotateDirectionToRight(this.dir);
			this.ldir = rotateDirectionToLeft(this.dir);
			this.rd = getDirectionDelta(this.rdir);
			this.ld = getDirectionDelta(this.ldir);
			this.rop = opposeDirection(this.rdir);
			this.lop = opposeDirection(this.ldir);		
		} else {
			this.realMove = a.realMove;
			this.dir = a.dir;
			this.d = a.d;
			this.rdir = a.rdir;
			this.ldir = a.ldir;
			this.rd = a.rd;
			this.ld = a.ld;
			this.rop = a.rop;
			this.lop = a.lop;
		}
	}

	turnRight() {
		this.dir = rotateDirectionToRight(this.dir);
		
		this.d = getDirectionDelta(this.dir);
		this.rdir = rotateDirectionToRight(this.dir);
		this.ldir = rotateDirectionToLeft(this.dir);
		this.rd = getDirectionDelta(this.rdir);
		this.ld = getDirectionDelta(this.ldir);
		this.rop = opposeDirection(this.rdir);
		this.lop = opposeDirection(this.ldir);
	}

	turnLeft() {
		this.dir = rotateDirectionToLeft(this.dir);
		
		this.d = getDirectionDelta(this.dir);
		this.rdir = rotateDirectionToRight(this.dir);
		this.ldir = rotateDirectionToLeft(this.dir);
		this.rd = getDirectionDelta(this.rdir);
		this.ld = getDirectionDelta(this.ldir);
		this.rop = opposeDirection(this.rdir);
		this.lop = opposeDirection(this.ldir);
	}
}

	

export function getDanger(car: Car, range: number, cmap: ChunkMap) {
	let finalSpeed = Infinity;
	const CAR_PASSAGE_LENGTH = 1 + CAR_SIZE;
	const invSpeed = 1 / car.speed;

	function limSpeed(lim: number) {
		if (lim < finalSpeed)
			finalSpeed = lim;

	}

	function limDist(dist: number) {
		let d = car.deceleration * dist;
		if (d >= 0)
			d = Math.sqrt(d);

		limSpeed(d);
	}


	


	const dir = new DirHelper(car);
	const pos = new GridExplorer(car.x, car.y, cmap);

	let fastPrioritySpeed = 0;
	let fastPriorityAcceleration = Infinity;
	let slowPrioritySpeed = Infinity;



	let willCheckPriorities = false;

	// Check cars in front
	for (let dist = 0; dist < range; dist++) {
		const road = pos.getRoad();
		const checkDir = new DirHelper(dir);
		let finish: 'continue' | 'stop' | 'consume' = 'continue';
		let checkLeft = willCheckPriorities;
		let checkRight = willCheckPriorities;
		willCheckPriorities = false;


		switch ((road & 0x7) as roadtypes.types) {
		case roadtypes.types.VOID:
			finish = 'stop';
			break;

		case roadtypes.types.ROAD:
			if (dist > 0) {checkRight = true;}
			break;

		case roadtypes.types.TURN:
		{
			if (dist > 0) {checkRight = true;}

			if (((road >> 6) & 0x3) !== dir.dir)
				break;
			

			const type = ((road >> 3) & 0x7) as roadtypes.TurnDirection;
			switch (type) {
			case roadtypes.TurnDirection.RIGHT:
				dir.turnRight();
				break;

			case roadtypes.TurnDirection.LEFT:
				dir.turnLeft();
				break;

			default:
				switch (turnSideSelector.getConfig(type - 2)[car.color]) {
				case 0:
					break;

				case -1:
					dir.turnLeft();
					break;

				case 1:
					dir.turnRight();
					break;
				}
				
				break;
			}
			break;
		}

		case roadtypes.types.PRIORITY:
			if ((road >> 6) !== dir.dir)
				break;

			if (dist > 0) {
				checkRight = true;
				checkLeft = true;
			}
			willCheckPriorities = true;
			break;

		case roadtypes.types.SPAWNER:
			if (dist > 0) {checkRight = true;}
			break;
			
		case roadtypes.types.CONSUMER:
			if (((road >> 3) & 0x7) === car.color) {
				finish = 'consume';
			}

			break;

		case roadtypes.types.LIGHT:
			if (dist <= 0)
				break;

			checkRight = true;
			if (
				(road >> 6) === dir.dir
				&& (road & (1<<3)) === 0
				&& (dist > 0 || dir.realMove >= 1 - CAR_SIZE/2)
			) {
				finish = 'stop';
			}
			
			break;

			
		case roadtypes.types.ALTERN:
			if (dist > 0) {checkRight = true;}

			if (((road >> 6) & 0x3) !== dir.dir)
				break;
			

			if (dist === 0) {
				if (car.rotationStep >= 0) {
					if (car.rotatingToRight) {
						dir.turnRight();
					} else {
						dir.turnLeft();
					}
				}

				/**
				 * If dist == 0 (ie. we are on the block),
				 * then we can't trust the block content
				 * since it has been modified by car.behave().
				 */
				break;
			}

			switch ((road >> 3) & 0x3) {
			// front
			case 0:
			case 2:
				break;

			// right
			case 1:
				dir.turnRight();
				break;

			// left
			case 3:
				dir.turnLeft();
				break;
			}
			break;

		}


		if (finish === 'stop') {
			limDist(dist - CAR_SIZE/2 - dir.realMove);
			break; // no more road to check
		}

		if (finish === 'consume')
			break;  // no more road to check


		let willBreak = false;
		if (dist > 0) {
			const over = pos.chunk.getCar(pos.x, pos.y);
			if (over === 'full') {
				limDist(dist - CAR_SIZE/2 - dir.realMove);
				break;
			}

			if (over !== 'empty') {
				const carsDist = getCarsDist(dir.dir, over);
				limDist(dist - carsDist - dir.realMove - CAR_SIZE/2);

				
				willBreak = true;
			}

			// Check left and right cars cutting the road
			if (dir.realMove < SIZE_LIM) {
				const leftPos = new GridExplorer(pos);
				leftPos.move(dir.ld, cmap);
				const leftCar = pos.chunk.getCar(leftPos.x, leftPos.y);
	
	
				if (leftCar instanceof Car && leftCar.direction === dir.rdir) {
					const subDist = getCellDist(leftCar.direction, leftCar.x, leftCar.y);
					if (subDist > SIZE_LIM) {
						limDist(dist - CAR_LINE/2 - dir.realMove);
					}
				}
	
				const rightPos = new GridExplorer(pos);
				rightPos.move(dir.rd, cmap);
				const rightCar = pos.chunk.getCar(rightPos.x, rightPos.y);
	
				if (rightCar instanceof Car && rightCar.direction === dir.ldir) {
					const subDist = getCellDist(rightCar.direction, rightCar.x, rightCar.y);
					if (subDist > SIZE_LIM) {
						limDist(dist - CAR_LINE/2 - dir.realMove);
					}
				}
			}
		}


		if (willBreak)
			break;


		if (dir.realMove >= SIZE_LIM || !checkRight && !checkLeft) {
			pos.move(dir.d, cmap);
			continue;
		}
		

		let entryDist = dist - dir.realMove - CAR_SIZE/2;
		let exitDist = entryDist + CAR_PASSAGE_LENGTH;
		if (entryDist < 0) {
			entryDist = 0;
			if (exitDist < 0) {
				exitDist = 0;
			}
		}


		const runCheck = (
			dir: Direction,
			explorer: GridExplorer,
			checkDist: number,
			forbiddenCarsFlag: number
		) => {
			const turnDir = getDirectionDelta(dir);
			const leftDir = rotateDirectionToLeft(dir);
			const rightDir = rotateDirectionToRight(dir);
			const opDir = opposeDirection(dir);

			for (; checkDist < range; checkDist++) {
				explorer.move(turnDir, cmap);
				const road = explorer.getRoad();

				const checkToLeft = (flags: number) => {
					runCheck(
						leftDir,
						new GridExplorer(explorer),
						checkDist+1,
						flags
					);
				};

				const checkToRight = (flags: number) => {
					runCheck(
						rightDir,
						new GridExplorer(explorer),
						checkDist+1,
						flags
					);
				};

				let shouldBreak = false;
				switch ((road & 0x7) as roadtypes.types) {
				case roadtypes.types.VOID:
					shouldBreak = true;
					break;

				case roadtypes.types.ROAD:
					break

				case roadtypes.types.TURN:
					const roadDir = (road >> 6);
					if (roadDir === opDir) {
						shouldBreak = true;
						break;
					}


					const type = ((road >> 3) & 0x7) as roadtypes.TurnDirection;
					switch (type) {
					case roadtypes.TurnDirection.RIGHT:
						if (roadDir === rightDir)
							checkToLeft(forbiddenCarsFlag);
						
						break;
						
						
					case roadtypes.TurnDirection.LEFT:
						if (roadDir === leftDir)
							checkToRight(forbiddenCarsFlag);

						break;


					default:
					{
						let leftFlag = forbiddenCarsFlag;
						let rightFlag = forbiddenCarsFlag;
						const arr = turnSideSelector.getConfig(type - 2);

						for (let i = 0; i < 8; i++) {
							const flag = 1<<i;
							switch (arr[i]) {
							case 0: // front
								leftFlag |= flag;
								rightFlag |= flag;
								break;

							case -1: // left
								forbiddenCarsFlag |= flag;
								rightFlag |= flag;
								break;

							case 1: // right
								forbiddenCarsFlag |= flag;
								leftFlag |= flag;
								break;
							}
						}

						// checkToLeft(leftFlag);
						checkToRight(rightFlag);
						
						break;
					}
					}

					break;
					

				case roadtypes.types.SPAWNER:
					break;

				case roadtypes.types.CONSUMER:
					forbiddenCarsFlag |= 1 >> ((road << 3) & 0x7);
					break;

				case roadtypes.types.PRIORITY:
					if ((road >> 6) === opDir) {
						shouldBreak = true;
					}
					break;

				case roadtypes.types.LIGHT:
					if ((road >> 6) == opDir && (road & (1<<3)) === 0) {
						shouldBreak = true;
					}
					break;
				}

				if (shouldBreak)
					break;

				const over = explorer.chunk.getCar(explorer.x, explorer.y);
				if (over === 'full' || over === 'empty')
					continue;

				if (over.direction !== opDir || (forbiddenCarsFlag & (1<<over.color)))
					continue;

				const over_realMove = over.getCellDist();
				let over_entryDist = checkDist - over_realMove - CAR_SIZE/2;
				let over_exitDist = over_entryDist + CAR_PASSAGE_LENGTH;
				if (over_entryDist < 0) {
					over_entryDist = 0;
					if (over_exitDist < 0) {
						over_exitDist = 0;
					}
				}

				const fastSpeed = exitDist * over.speed / over_entryDist;

				if (fastSpeed > fastPrioritySpeed) {
					fastPrioritySpeed = fastSpeed;
					fastPriorityAcceleration = .5 * (fastSpeed*fastSpeed -
						car.speed*car.speed) / exitDist;
				}


				const slowSpeed = entryDist * over.speed / over_exitDist;


				if (slowSpeed < slowPrioritySpeed)
					slowPrioritySpeed = slowSpeed;

				break;
			}
		}



		if ((window as any).fastView && car.id === 0)
			console.log(pos.x, pos.y);

		if (checkRight) {
			runCheck(checkDir.rdir, new GridExplorer(pos), 1, 0);
		}

		if (checkLeft) {
			runCheck(checkDir.ldir, new GridExplorer(pos), 1, 0);
		}

		pos.move(dir.d, cmap);
	}



	return {
		lim: finalSpeed,
		fast: fastPrioritySpeed,
		acceleration: fastPriorityAcceleration,
		slow: slowPrioritySpeed
	};
}