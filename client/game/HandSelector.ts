export enum HandSelection {
	NONE,
	ROAD,
	ERASE,
	ROTATE,
	MOVE,

	TURN,
	PRIORITY,
	LIGHT,
	ALTERN
};

const zoomContainerHtml = document.getElementById("zoomContainer")!;


export const HAND_SELECTION_ICONS = [
	'icon_none',
	'icon_road',
	'icon_erase',
	'icon_rotate',
	'icon_move',

	'turn',
	'yield',
	'light_green',
	'filter_front'
];

class HandSelector {
	private panelDiv: HTMLElement;
	private currentMode = HandSelection.NONE;

	constructor(panelDiv: HTMLElement) {
		this.panelDiv = panelDiv;
	}



	getDiv(idx: HandSelection) {
		return this.panelDiv.children[idx].children[0];
	}

	private setMode(idx: HandSelection) {
		this.panelDiv.children[this.currentMode].classList.remove('selected');
		this.panelDiv.children[idx].classList.add('selected');
		
		this.currentMode = idx;

		if (idx === HandSelection.MOVE) {
			zoomContainerHtml.classList.remove("hidden");
		} else {
			zoomContainerHtml.classList.add("hidden");
	}
	}

	getMode() {
		return this.currentMode;
	}

	appendDivList() {
		const length = Object.values(HandSelection).length/2;
		for (let i = 0; i < length; i++) {
			const div = document.createElement("div");
			
			const subDiv = document.createElement("div");
			div.appendChild(subDiv);
			this.panelDiv.appendChild(div);

			const idx = i;
			div.addEventListener('click', () => this.setMode(idx));
			div.addEventListener('touchstart', () => this.setMode(idx));
		}

		this.panelDiv.children[0].classList.add('selected');
	}

	showPanel() {
		this.panelDiv.classList.remove('hidden');
	}
	
	hidePanel() {
		// this.panelDiv.classList.add('hidden');
		this.setMode(HandSelection.NONE);
	}
}


export const handSelector = new HandSelector(document.getElementById("handPanel")!);
handSelector.appendDivList();
