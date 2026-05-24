import { modulo } from "./modulo";

export enum Direction {
	RIGHT,
	UP,
	LEFT,
	DOWN,
};

export function rotateDirectionToLeft(dir: Direction): Direction {
	switch (dir) {
		case Direction.RIGHT: return Direction.UP;
		case Direction.UP: return Direction.LEFT;
		case Direction.LEFT: return Direction.DOWN;
		case Direction.DOWN: return Direction.RIGHT;
	}
}

export function rotateDirectionToRight(dir: Direction): Direction {
	switch (dir) {
		case Direction.RIGHT: return Direction.DOWN;
		case Direction.DOWN: return Direction.LEFT;
		case Direction.LEFT: return Direction.UP;
		case Direction.UP: return Direction.RIGHT;
	}
}

export function opposeDirection(dir: Direction): Direction {
	switch (dir) {
		case Direction.RIGHT: return Direction.LEFT;
		case Direction.UP: return Direction.DOWN;
		case Direction.LEFT: return Direction.RIGHT;
		case Direction.DOWN: return Direction.UP;
	}
}


export function getAttach(direction: Direction, rotatingToRight: boolean, step: number) {
    step = Math.max(0, Math.min(1, step));

    let cx = 0, cy = 0;
    let startAngle = 0;
    let endAngle = 0;
    const radius = 0.5;

	switch (direction) {
		case Direction.UP:
			if (rotatingToRight) {
				cx = 1; cy = 1;
				startAngle = Math.PI;        // (0.5, 1)
				endAngle = 3*Math.PI/2;     // (1, 0.5)  -- décroissant, correct
			} else {
				cx = 0; cy = 1;
				startAngle = 0;
				endAngle = -Math.PI / 2;
			}
			break;
		case Direction.RIGHT:
			if (rotatingToRight) {
				cx = 0; cy = 1;
				startAngle = -Math.PI / 2;   // (0, 0.5)
				endAngle = 0;                // (0.5, 1)
			} else {
				cx = 0; cy = 0;
				startAngle = Math.PI / 2;    // (0, 0.5)
				endAngle = 0;                // (0.5, 0)
			}
			break;
		case Direction.DOWN:
			if (rotatingToRight) {
				cx = 0; cy = 0;
				startAngle = 0;              // (0.5, 0)
				endAngle = Math.PI / 2;      // (0, 0.5)
			} else {
				cx = 1; cy = 0;
				startAngle = Math.PI;        // (0.5, 0)
				endAngle = Math.PI / 2;      // (1, 0.5)
			}
			break;
		case Direction.LEFT:
			if (rotatingToRight) {
				cx = 1; cy = 0;
				startAngle = Math.PI / 2;    // (1, 0.5)
				endAngle = Math.PI;          // (0.5, 0)
			} else {
				cx = 1; cy = 1;
				startAngle = 3*Math.PI / 2;
				endAngle = Math.PI;
			}
			break;
	}
	
    const angle = startAngle + (endAngle - startAngle) * step;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    return { x, y, angle };
}

export function getDirectionDelta(direction: Direction) {
	let x = 0;
	let y = 0;
	switch (direction) {
	case Direction.RIGHT:
		x = +1;
		break;

	case Direction.UP:
		y = -1;
		break;

	case Direction.LEFT:
		x = -1;
		break;

	case Direction.DOWN:
		y = +1;
		break;
	}

	return {x, y};
}


export function getCellDist(direction: Direction, x: number, y: number) {
	let realMove;
	switch (direction) {
	case Direction.RIGHT:
		realMove = modulo(x, 1);
		break;

	case Direction.UP:
		realMove = 1 - modulo(y, 1);
		break;

	case Direction.LEFT:
		realMove = 1 - modulo(x, 1);
		break;
		
	case Direction.DOWN:
		realMove = modulo(y, 1);
		break;
	}

	return realMove;
}