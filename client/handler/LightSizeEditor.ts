export class LightSizeEditor {
	private element: HTMLElement;
	private flag = 0;
	private cycleSize = 0;
	private _initialFlag = 0;
	private _initialCycleSize = 0;
	private _resolve: ((result: { flag: number; cycleSize: number }) => void) | null = null;

	private select: HTMLSelectElement;
	private bitsContainer: HTMLElement;

	constructor(element: HTMLElement) {
		this.element = element;

		this.select = element.querySelector('#lightSizeEditor__select')!;
		this.bitsContainer = element.querySelector('#lightSizeEditor__bits')!;

		this.select.addEventListener('change', () => {
			const newCycleSize = parseInt(this.select.value);
			this.resizeBits(newCycleSize);
			this.renderBits();
		});

		element.querySelector('#lightSizeEditor__confirm')!
			.addEventListener('click', () => this.confirm());

		element.querySelector('#lightSizeEditor__cancel')!
			.addEventListener('click', () => this.cancel());
	}

	private cycleSizeToLength(cycleSize: number): number {
		return 4 << cycleSize;
	}

	private resizeBits(newCycleSize: number): void {
		const oldLength = this.cycleSizeToLength(this.cycleSize);
		const newLength = this.cycleSizeToLength(newCycleSize);

		if (newLength > oldLength) {
			const ratio = newLength / oldLength;
			let newFlag = 0;
			for (let i = 0; i < oldLength; i++) {
				const bit = (this.flag >> i) & 1;
				const block = (1 << ratio) - 1;
				if (bit) {
					newFlag |= block << (i * ratio);
				}
			}
			this.flag = newFlag;
		} else if (newLength < oldLength) {
			const ratio = oldLength / newLength;
			let newFlag = 0;
			for (let i = 0; i < newLength; i++) {
				const bit = (this.flag >> (i * ratio)) & 1;
				if (bit) {
					newFlag |= 1 << i;
				}
			}
			this.flag = newFlag;
		}

		this.cycleSize = newCycleSize;
	}

	private renderBits(): void {
		const length = this.cycleSizeToLength(this.cycleSize);
		this.bitsContainer.innerHTML = '';

		for (let i = 0; i < length; i++) {
			const bit = (this.flag >> i) & 1;
			const el = document.createElement('div');
			el.className = `lightSizeEditor__bit ${bit ? 'lightSizeEditor__bit--on' : 'lightSizeEditor__bit--off'}`;
			el.title = `Bit ${i} : ${bit}`;

			el.addEventListener('click', () => {
				this.flag ^= (1 << i);
				const newBit = (this.flag >> i) & 1;
				el.className = `lightSizeEditor__bit ${newBit ? 'lightSizeEditor__bit--on' : 'lightSizeEditor__bit--off'}`;
				el.title = `Bit ${i} : ${newBit}`;
			});

			this.bitsContainer.appendChild(el);
		}
	}

	private confirm(): void {
		this.hide();
	}

	private cancel(): void {
		this.flag = this._initialFlag;
		this.cycleSize = this._initialCycleSize;
		this.hide();
	}

	show(flag: number, cycleSize: number): void {
		this.flag = flag;
		this.cycleSize = cycleSize;
		this._initialFlag = flag;
		this._initialCycleSize = cycleSize;

		this.select.value = String(cycleSize);
		this.renderBits();
		this.element.classList.remove('hidden');
	}

	hide(): { flag: number; cycleSize: number } {
		this.element.classList.add('hidden');
		const result = { flag: this.flag, cycleSize: this.cycleSize };
		if (this._resolve) {
			this._resolve(result);
			this._resolve = null;
		}
		return result;
	}

	get(flag: number, cycleSize: number): Promise<{ flag: number; cycleSize: number }> {
		return new Promise((resolve) => {
			this.show(flag, cycleSize);
			this._resolve = resolve;
		});
	}
}


export const lightSizeEditor = new LightSizeEditor(document.getElementById("lightSizeEditor")!);