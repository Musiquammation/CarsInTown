import { GAME_COLORS } from '../handler/GAME_COLORS';

const DIRECTIONS = ["Front", "Right", "Left"];
const COLOR_NAMES = ["red", "yellow", "blue", "green", "cyan", "pink", "white", "black"];

// Direction values: 0 = front, 1 = right, -1 = left
type Direction = 0 | 1 | -1;
type Config = Direction[]; // One direction per color (8 colors)

// Cycle order: front -> right -> left -> front
const DIRECTION_CYCLE: Direction[] = [0, 1, -1];
const DIRECTION_LABELS: Record<Direction, string> = { 0: "Front", 1: "Right", "-1": "Left" };

class TurnSideSelector {
	private configs: Config[];
	private activationDiv: HTMLDivElement;
	private panel: HTMLDivElement;
	private backdrop: HTMLDivElement;
	private activeConfigIndex: number;
	private buttons: HTMLButtonElement[][];

	constructor(div: HTMLDivElement) {
		this.activationDiv = div;
		this.activeConfigIndex = 0;
		this.buttons = [];

		// Initialize 8 configs, each with 8 directions defaulting to front (0)
		this.configs = Array.from({ length: 6 }, () =>
			Array(8).fill(0) as Config
		);

		const { panel, backdrop } = this.buildPanel();
		this.panel = panel;
		this.backdrop = backdrop;

		document.body.appendChild(backdrop);
		document.body.appendChild(panel);
	}

	show() {
		this.backdrop.classList.add('turn-selector-visible');
		this.panel.classList.add('turn-selector-visible');
	}

	hide() {
		this.backdrop.classList.remove('turn-selector-visible');
		this.panel.classList.remove('turn-selector-visible');
	}

	getHtmlDiv() {
		return this.activationDiv;
	}

	getConfig(idx: number): Config {
		return this.configs[idx];
	}

	// Build the full panel and backdrop, wire up all interactivity
	private buildPanel(): { panel: HTMLDivElement; backdrop: HTMLDivElement } {
		// --- Backdrop ---
		const backdrop = document.createElement('div');
		backdrop.classList.add('turn-selector-backdrop');
		backdrop.addEventListener('click', () => this.hide());

		// --- Main panel ---
		const panel = document.createElement('div');
		panel.classList.add('turn-selector-panel');

		// Prevent clicks inside the panel from closing via backdrop
		panel.addEventListener('click', (e) => e.stopPropagation());

		// Title
		const title = document.createElement('div');
		title.classList.add('turn-selector-title');
		title.textContent = "Turn Selector";
		panel.appendChild(title);

		// Config selector (dropdown 1..6)
		const selectorRow = document.createElement('div');
		selectorRow.classList.add('turn-selector-row');

		const selectorLabel = document.createElement('label');
		selectorLabel.textContent = "Config:";
		selectorLabel.classList.add('turn-selector-label');

		const select = document.createElement('select');
		select.classList.add('turn-selector-select');
		for (let i = 1; i <= 6; i++) {
			const option = document.createElement('option');
			option.value = String(i - 1);
			option.textContent = String(i);
			select.appendChild(option);
		}
		select.addEventListener('change', () => {
			this.activeConfigIndex = parseInt(select.value);
			this.refreshButtons();
		});

		selectorRow.appendChild(selectorLabel);
		selectorRow.appendChild(select);
		panel.appendChild(selectorRow);

		// Color/direction table
		const table = document.createElement('table');
		table.classList.add('turn-selector-table');
		this.buttons = [];

		for (let i = 0; i < 8; i++) {
			const row = document.createElement('tr');

			// Color header cell
			const colorCell = document.createElement('th');
			colorCell.classList.add('turn-selector-color-cell');
			colorCell.style.backgroundColor = GAME_COLORS[i];
			// Use dark text on light colors, white on dark
			colorCell.style.color = this.isDark(GAME_COLORS[i]) ? '#fff' : '#111';
			colorCell.textContent = COLOR_NAMES[i].toUpperCase();
			row.appendChild(colorCell);

			// Direction button cell
			const btnCell = document.createElement('td');
			btnCell.classList.add('turn-selector-btn-cell');

			const btn = document.createElement('button');
			btn.classList.add('turn-selector-dir-btn');
			btn.textContent = DIRECTION_LABELS[0];
			btn.dataset.colorIndex = String(i);

			btn.addEventListener('click', () => {
				const colorIdx = parseInt(btn.dataset.colorIndex!);
				const current = this.configs[this.activeConfigIndex][colorIdx];
				const cycleIdx = DIRECTION_CYCLE.indexOf(current);
				const next = DIRECTION_CYCLE[(cycleIdx + 1) % DIRECTION_CYCLE.length];
				this.configs[this.activeConfigIndex][colorIdx] = next;
				btn.textContent = DIRECTION_LABELS[next];
				btn.dataset.direction = String(next);
				this.updateButtonStyle(btn, next);
			});

			this.buttons.push([btn]);
			btnCell.appendChild(btn);
			row.appendChild(btnCell);
			table.appendChild(row);
		}

		panel.appendChild(table);

		// Done button
		const doneBtn = document.createElement('button');
		doneBtn.classList.add('turn-selector-done-btn');
		doneBtn.textContent = "Done";
		doneBtn.addEventListener('click', () => this.hide());
		panel.appendChild(doneBtn);

		return { panel, backdrop };
	}

	// Refresh all button labels when the active config changes
	private refreshButtons() {
		const config = this.configs[this.activeConfigIndex];
		for (let i = 0; i < 8; i++) {
			const btn = this.buttons[i][0];
			const dir = config[i];
			btn.textContent = DIRECTION_LABELS[dir];
			btn.dataset.direction = String(dir);
			this.updateButtonStyle(btn, dir);
		}
	}

	// Apply a CSS class to visually distinguish directions
	private updateButtonStyle(btn: HTMLButtonElement, dir: Direction) {
		btn.classList.remove('dir-front', 'dir-right', 'dir-left');
		if (dir === 0)  btn.classList.add('dir-front');
		if (dir === 1)  btn.classList.add('dir-right');
		if (dir === -1) btn.classList.add('dir-left');
	}

	// Determine if a hex color is perceptually dark
	private isDark(hex: string): boolean {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		// Perceived luminance
		return (0.299 * r + 0.587 * g + 0.114 * b) < 140;
	}
}


function generateSideSelectorDivOpener(): HTMLDivElement {
	const main = document.createElement('div');
	main.classList.add('turn-selector-opener');
	main.textContent = "Turn Selector";
	return main;
}

const opener = generateSideSelectorDivOpener();

export const turnSideSelector = new TurnSideSelector(opener);

opener.addEventListener('click', () => {
	turnSideSelector.show();
});


console.log(turnSideSelector);