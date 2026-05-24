export class HoleArray<T> {
	private items: (T | null)[];

	constructor() {
		this.items = Array(32).fill(null);
	}

	get(idx: number): T | null {
		if (idx < 0 || idx >= this.items.length) {
			throw new Error("Index out of bounds");
		}
		return this.items[idx];
	}

	append(obj: T): number {
		const idx = this.items.findIndex(item => item === null);
		if (idx === -1) {
			throw new Error("Array is full");
		}
		this.items[idx] = obj;
		return idx;
	}

	pop(obj: T): number {
		const idx = this.items.findIndex(item => item === obj);
		if (idx === -1) return -1;
		this.items[idx] = null;
		return idx;
	}

	remove(idx: number) {
		this.items[idx] = null;
	}

	*[Symbol.iterator](): IterableIterator<[number, T]> {
		for (let i = 0; i < this.items.length; i++) {
			const item = this.items[i];
			if (item !== null) yield [i, item];
		}
	}
}
