import { Direction } from "./Direction";

type Node = {
	x: number;
	y: number;
	g: number;
	h: number;
	f: number;
	parent: Node | null;
	dirFromParent: Direction | null; // direction depuis le parent
};

export function findPath(
	startX: number,
	startY: number,
	aimX: number,
	aimY: number,
	getNeighboors: (x: number, y: number) => { x: number; y: number; dir: Direction }[]
): Direction[] | null {
	const open: Node[] = [];
	const closed: Set<number> = new Set();

	const key = (x: number, y: number) => (x << 16) ^ y;

	const heuristic = (x: number, y: number) =>
		Math.abs(x - aimX) + Math.abs(y - aimY);

	const startNode: Node = {
		x: startX,
		y: startY,
		g: 0,
		h: heuristic(startX, startY),
		f: heuristic(startX, startY),
		parent: null,
		dirFromParent: null
	};
	open.push(startNode);

	while (open.length > 0) {
		open.sort((a, b) => a.f - b.f);
		const current = open.shift()!;
		closed.add(key(current.x, current.y));

		if (current.x === aimX && current.y === aimY) {
			const path: Direction[] = [];
			let node: Node | null = current;
			while (node?.parent) {
				path.push(node.dirFromParent!);
				node = node.parent;
			}
			return path.reverse();
		}

		const neighbors = getNeighboors(current.x, current.y);
		for (const n of neighbors) {
			const nKey = key(n.x, n.y);
			if (closed.has(nKey)) continue;

			const gTentative = current.g + 1;

			let neighborNode = open.find(node => node.x === n.x && node.y === n.y);
			if (!neighborNode) {
				neighborNode = {
					x: n.x,
					y: n.y,
					g: gTentative,
					h: heuristic(n.x, n.y),
					f: gTentative + heuristic(n.x, n.y),
					parent: current,
					dirFromParent: n.dir
				};
				open.push(neighborNode);
			} else if (gTentative < neighborNode.g) {
				neighborNode.g = gTentative;
				neighborNode.f = gTentative + neighborNode.h;
				neighborNode.parent = current;
				neighborNode.dirFromParent = n.dir;
			}
		}
	}

	return null;
}
