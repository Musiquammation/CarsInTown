import { GameState, states } from "./states";
import {GAME_WIDTH, GAME_HEIGHT} from "./dimensions";
import { PauseElement } from "./PauseElement";
import {InputHandler} from "./InputHandler";
import { ImageLoader } from "./ImageLoader";
import { LevelsState } from "../states/LevelsState";
import { HAND_SELECTION_ICONS, HandSelection, handSelector } from "../game/HandSelector";
import { GAME_COLORS } from "./GAME_COLORS";

declare global {
	interface Window {
		IMG_ROOT_PATH: string;
	}
}

function setElementAsBackground(
	element: HTMLCanvasElement | HTMLImageElement,
	div: HTMLElement
): void {
	if (element instanceof HTMLCanvasElement) {
		element.toBlob(blob => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);
			div.style.backgroundImage = `url(${url})`;
		});
	} else {
		div.style.backgroundImage = `url(${element.src})`;
	}
}

export class GameHandler {
	private state: GameState;

	inputHandler: InputHandler;
	imgLoader = new ImageLoader(window.IMG_ROOT_PATH);

	constructor(
		keyboardMode: "zqsd" | "wasd",
		mouseEventTarget: EventTarget,
		keydownEventTarget: EventTarget,
	) {
		this.inputHandler = new InputHandler(keyboardMode);
		this.inputHandler.startKeydownListeners(keydownEventTarget);
		this.inputHandler.startMouseListeners(mouseEventTarget);

		this.state = new LevelsState();
		this.state.enter(undefined, this.inputHandler);

		// Load panels
		this.imgLoader.load({
			resume: "assets/resume.png",
			pause: "assets/pause.png",
			restart: "assets/restart.png",
		}).then(() => {
			const pauseElement = document.getElementById("pause")! as PauseElement;
			setElementAsBackground(this.imgLoader.get('resume'), pauseElement);

			pauseElement.togglePause = pause => {
				if (pause) {
					pauseElement.classList.add("inPause");
					setElementAsBackground(this.imgLoader.get('pause'), pauseElement);
				} else {
					pauseElement.classList.remove("inPause");
					setElementAsBackground(this.imgLoader.get('resume'), pauseElement);
				}
			};

			setElementAsBackground(
				this.imgLoader.get('restart'),
				document.getElementById("restart")!
			);
		});		

		// Load game assets
		this.imgLoader.load({
			turn: "assets/turn/turn.png",
			all0: "assets/turn/all0.png",
			all1: "assets/turn/all1.png",
			all2: "assets/turn/all2.png",
			all3: "assets/turn/all3.png",
			all4: "assets/turn/all4.png",
			all5: "assets/turn/all5.png",
			yield: "assets/yield.png",
			light_red: "assets/lights/red.png",
			light_orange: "assets/lights/orange.png",
			light_green: "assets/lights/green.png",
			filter_front: "assets/filter/front.png",
			filter_turn: "assets/filter/turn.png",
			filter_share_front: "assets/filter/share-front.png",
			filter_share_turn: "assets/filter/share-turn.png",
			icon_none: "assets/icons/none.png",
			icon_move: "assets/icons/move.png",
			icon_erase: "assets/icons/erase.png",
			icon_road: "assets/icons/road.png",
			icon_rotate: "assets/icons/rotate.png",
		}).then(() => {

			// Place hand panel
			for (const i of Object.values(HandSelection)) {
				if (typeof i !== "number") {
					continue;
				}

				setElementAsBackground(
					this.imgLoader.get(HAND_SELECTION_ICONS[i]),
					handSelector.getDiv(i) as HTMLElement
				);
			}
		});

		
		// Load zoom +/-
		this.imgLoader.load({
			zoomInc: "assets/icons/zoomInc.png",
			zoomDec: "assets/icons/zoomDec.png",
		}).then(() => {
			setElementAsBackground(
				this.imgLoader.get('zoomInc'),
				document.getElementById("zoomInc")!
			);

			setElementAsBackground(
				this.imgLoader.get('zoomDec'),
				document.getElementById("zoomDec")!
			);

		});


		this.imgLoader.loadWithColors(
			"#ac3232",
			GAME_COLORS,
			{
				consumer: "assets/consumer.png",
				spawner: "assets/spawner.png",
				car: 'assets/car.png'
			}
		);
	}
	

	gameLogic() {
		this.inputHandler.update();
		const next = this.state.frame(this);

		if (next) {
			const data = this.state.exit();
			this.state = next;
			next.enter(data, this.inputHandler);
		}
	}

	gameDraw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, drawMethod: 
		(ctx: CanvasRenderingContext2D, followCamera: (()=>void), unfollowCamera: (()=>void)) => void
	) {
		const scaleX = canvasWidth / GAME_WIDTH;
		const scaleY = canvasHeight / GAME_HEIGHT;
		const scale = Math.min(scaleX, scaleY);
		const offsetX = (canvasWidth - GAME_WIDTH * scale) / 2;
		const offsetY = (canvasHeight - GAME_HEIGHT * scale) / 2;

		ctx.save();
		ctx.translate(offsetX, offsetY);
		ctx.scale(scale, scale);

		// Draw background
		const camera = this.state.getCamera();
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);


		const followCamera = () => {
			ctx.save();
			if (camera) {
				ctx.translate(GAME_WIDTH / 2, GAME_HEIGHT / 2);
				ctx.scale(camera.z, camera.z);
				ctx.translate(-camera.x, -camera.y);
			}
		}

		const unfollowCamera = () => {
			ctx.restore();
		}
		
		drawMethod(ctx, followCamera, unfollowCamera);
		
		
		ctx.restore();

		
		
		// Make borders dark
		ctx.fillStyle = "black";
		if (offsetY > 0) ctx.fillRect(0, 0, canvasWidth, offsetY);
		if (offsetY > 0) ctx.fillRect(0, canvasHeight - offsetY, canvasWidth, offsetY);
		if (offsetX > 0) ctx.fillRect(0, 0, offsetX, canvasHeight);
		if (offsetX > 0) ctx.fillRect(canvasWidth - offsetX, 0, offsetX, canvasHeight);
	}
	
	drawMethod(ctx: CanvasRenderingContext2D, followCamera: (()=>void), unfollowCamera: (()=>void)) {
		this.state.draw({ctx, imageLoader: this.imgLoader, followCamera, unfollowCamera});
	}
}

