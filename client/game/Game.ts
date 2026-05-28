import { GAME_HEIGHT, GAME_WIDTH } from "../handler/dimensions";
import { isTouchDevice } from "../handler/isTouchDevice";
import { GameHandler } from "../handler/GameHandler";
import { DrawStateData, GameState } from "../handler/states";
import { Vector3 } from "../handler/Vector3";
import { GameMap } from "./GameMap";
import { roadfn } from "./roadfn";
import { Direction, getDirectionDelta, rotateDirectionToLeft, rotateDirectionToRight } from "./Direction";
import { InputHandler } from "../handler/InputHandler";
import { MapConstructor } from "./MapConstructor";
import { PauseElement } from "../handler/PauseElement";
import { HandSelection, handSelector } from "./HandSelector";
import { produceStatsPanel } from "./produceStatsPanel";
import { onRoadRotation, onRoadEdit, RoadType } from "./roadtypes";
import { lightSelector } from "../handler/lightSelector";
import { api } from "./Api";
import { turnSelector } from "./turnSelector";


const timeLeftDiv = document.getElementById("timeLeft")!;
const scoreDiv = document.getElementById("score")!;
const mousePosDiv = document.getElementById("mousePos")!;
const lightTurnDiv = document.getElementById("lightTurn")!;

const FAST_TIMES = 4;
const LIGHT_TICK = 45;


export class Game extends GameState {
	private camera: Vector3 = {x: 0, y: 0, z: 20};

	gameMap: GameMap | null = null;
	private carFrame = 0;
	private runningCars = false;
	private score = 0;
	private lastMouseX = 0;
	private lastScreenMouseX = NaN;
	private lastScreenMouseY = NaN;
	private lastMouseY = 0;
	private statsPanel?: HTMLDivElement;
	private running = true;



	private placeRoad(x: number, y: number) {
		const map = this.gameMap;
		if (!map)
			return;

		const neighbors = [
			map.getRoad(x+1, y),
			map.getRoad(x, y-1),
			map.getRoad(x-1, y),
			map.getRoad(x, y+1)
		];

		const alive: Direction[] = [];
		for (let i = 0; i < 4; i++)
			if (roadfn.getType(neighbors[i]))
				alive.push(i);


		if (alive.length === 0) {
			map.setRoad(x, y, RoadType.ROAD);
			return;
		}

		if (alive.length === 1) {
			const dir = alive[0];
			if (roadfn.getType(neighbors[dir]) != RoadType.ROAD) {
				map.setRoad(x, y, RoadType.ROAD);
				return;
			}

			let road = RoadType.ROAD;

			const mdir = getDirectionDelta(dir);
			const xp = x + mdir.x;
			const yp = y + mdir.y;
			
			let hasRight;
			let hasLeft;
			
			// Check for turn
			{
				const dr = getDirectionDelta(rotateDirectionToRight(dir));
				const xr = xp + dr.x;
				const yr = yp + dr.y;
				hasRight = roadfn.getType(map.getRoad(xr, yr));
	
				const dl = getDirectionDelta(rotateDirectionToLeft(dir));
				const xl = xp + dl.x;
				const yl = yp + dl.y;
				hasLeft = roadfn.getType(map.getRoad(xl, yl));
			}


			/// TODO: automatic directions


			map.setRoad(x, y, road);
			return;
		}

		if (alive.length === 2) {
			map.setRoad(x, y, RoadType.ROAD);
			return;
		}

		map.setRoad(x, y, RoadType.ROAD);
	}

	
	private test() {
		if (!window.DEBUG)
			return;


		// this.gameMap.setRoad(x, y, RoadType.ROAD);

	}



	getMousePosition(mouseX: number, mouseY: number) {
		const scaleX = innerWidth / GAME_WIDTH;
		const scaleY = innerHeight / GAME_HEIGHT;
		const scale = Math.min(scaleX, scaleY);

		const offsetX = (innerWidth - GAME_WIDTH * scale) / 2;
		const offsetY = (innerHeight - GAME_HEIGHT * scale) / 2;

		let x = mouseX - offsetX;
		let y = mouseY - offsetY;

		x /= scale;
		y /= scale;

		x -= GAME_WIDTH / 2;
		y -= GAME_HEIGHT / 2;

		x /= this.camera.z;
		y /= this.camera.z;

		x += this.camera.x;
		y += this.camera.y;

		return { x, y };
	}

	private restart() {
		this.score = 0;
		this.carFrame = 0;
		this.runningCars = false;
		this.running = true;

		if (this.gameMap) {this.gameMap.reset();}


		(document.getElementById("pause") as PauseElement|null)?.togglePause(false);
		lightTurnDiv.textContent = "00";
	}

	private handleHTML() {
		document.getElementById("gameView")?.classList.remove("hidden");

		const pause = document.getElementById("pause") as PauseElement;
		if (pause) {
			pause.classList.add("inPause");
			pause.onclick = () => {
				this.runningCars = !this.runningCars;
				pause.togglePause(this.runningCars);
			}
		}

		const restart = document.getElementById("restart");
		if (restart) {
			restart.onclick = () => {
				this.restart();
			};
		}


		const zoomInc = document.getElementById("zoomInc");
		if (zoomInc) {
			zoomInc.onclick = () => this.camera.z *= 1.3;
		}

		const zoomDec = document.getElementById("zoomDec");
		if (zoomDec) {
			zoomDec.onclick = () => this.camera.z /= 1.3;
		}		
	}

	enter(data: any, input: InputHandler): void {
		const mapConstructor = data as MapConstructor;
		api.init(mapConstructor.size);
		const gmap = mapConstructor.create();
		this.gameMap = gmap;

		mapConstructor.setCamera(this.camera);

		const panel = produceStatsPanel(mapConstructor);
		document.body.appendChild(panel);
		this.statsPanel = panel;



		this.test();

		this.handleHTML();


		const updateMouse = (x: number, y: number) => {
			mousePosDiv.innerText = `(${x.toFixed(1)},${y.toFixed(1)})`;
			this.lastMouseX = x;
			this.lastMouseY = y;
		}

		const runMode = (
			smode: HandSelection,
			x: number, y: number,
			moving: boolean,
			click: 'left' | 'right' | 'mobile',
			mouseScreenX: number,
			mouseScreenY: number,
		) => {
			let roadtype: RoadType | null = null;
			let extraData = 0;

			const ix = Math.floor(x);
			const iy = Math.floor(y);

			if (
				moving &&
				Math.floor(this.lastMouseX) === ix &&
				Math.floor(this.lastMouseY) === iy
			) {
				return;
			}


			const applyEdit = (road: number) => {
				const next = onRoadEdit(road);

				if (next === null) {
					const rotated = onRoadRotation(road);
					if (rotated) {
						gmap.setRoad(ix, iy, rotated);
					}

					return;
				}

				if (next === 'light') {
					this.setLight(ix, iy);
					return;
				}

				if (next === 'direction') {
					this.setDirection(ix, iy);
					return;
				}

				gmap.setRoad(ix, iy, next);
			}

			if (click === 'right') {
				applyEdit(gmap.getRoad(ix, iy));
				return;
			}


			switch (smode) {
			case HandSelection.NONE:
				break;

			case HandSelection.ROAD:
				this.placeRoad(ix, iy);
				break;

			case HandSelection.ERASE:
				gmap.setRoad(ix, iy, RoadType.VOID);
				break;

			case HandSelection.ROTATE:
			{
				const road = onRoadRotation(
					gmap.getRoad(ix, iy));

				if (road !== null) {
					gmap.setRoad(ix, iy, road);
				}

				break;
			}

			case HandSelection.MOVE:
			{
				if (isNaN(this.lastScreenMouseX) || isNaN(this.lastScreenMouseY))
					break;

				const dx = (this.lastScreenMouseX - mouseScreenX) * (4/this.camera.z);
				const dy = (this.lastScreenMouseY - mouseScreenY) * (4/this.camera.z);
				this.camera.x += dx;
				this.camera.y += dy;
				break;
			}

			case HandSelection.TURN:
				roadtype = RoadType.DIRECTION;
				break;

			case HandSelection.YIELD:
				roadtype = RoadType.YIELD;
				break;

			case HandSelection.LIGHT:
				roadtype = RoadType.LIGHT;
				break;
			}

			if (roadtype !== null) {
				const road = gmap.getRoad(ix, iy);
				if (roadfn.getType(road) === roadtype) {
					if (click === 'left') {
						const rotated = onRoadRotation(road);
						if (rotated) {
							gmap.setRoad(ix, iy, rotated);
						}

					} else {
						applyEdit(road);
					}

				} else {
					gmap.setRoad(ix, iy, roadtype);
				}
			}

			updateMouse(x, y);
		};

		const mouseUp = (clientX: number, clientY: number) => {
			this.lastScreenMouseX = NaN;
			this.lastScreenMouseY = NaN;

			const {x,y} = this.getMousePosition(clientX, clientY);
			updateMouse(x, y);

		}

		const mouseDown = (
			clientX: number,
			clientY: number,
			buttons: number,
			shiftKey: boolean
		) => {
			this.lastScreenMouseX = NaN;
			this.lastScreenMouseY = NaN;

			const {x,y} = this.getMousePosition(clientX, clientY);

			const leftDown   = (buttons & 1) !== 0;
			const rightDown  = (buttons & 2) !== 0;
			const middleDown = (buttons & 4) !== 0;

			const ix = Math.floor(x);
			const iy = Math.floor(y);

			const smode = handSelector.getMode();
			if (leftDown) {
				if (shiftKey) {
					gmap.setRoad(ix, iy, RoadType.VOID);
				} else if (smode) {
					runMode(smode, ix, iy, false, 'left', clientX, clientY);
				} else {
					this.placeRoad(ix, iy);
				}

			} else if (rightDown) {
				if (smode) {
					runMode(smode, ix, iy, false, 'right', clientX, clientY);

				} else {
					const newRoad = onRoadRotation(
						gmap.getRoad(ix, iy));
	
					if (newRoad !== null)
						gmap.setRoad(ix, iy, newRoad);
				}

			}

			updateMouse(x, y);
		}
		
		const mouseMove = (
			clientX: number,
			clientY: number,
			buttons: number | 'mobile',
			shiftKey: boolean
		) => {
			let {x,y} = this.getMousePosition(clientX, clientY);
			
			const {leftDown, rightDown, middleDown} = (()=>{
				if (buttons === 'mobile') {
					return {leftDown: true, rightDown: false, middleDown: false};
				}

				const leftDown   = (buttons & 1) !== 0;
				const rightDown  = (buttons & 2) !== 0;
				const middleDown = (buttons & 4) !== 0;
				return {leftDown, rightDown, middleDown};
			})();

			if (middleDown) {
				this.camera.x += this.lastMouseX - x;
				this.camera.y += this.lastMouseY - y;

				const c = this.getMousePosition(clientX, clientY);
				x = c.x;
				y = c.y;
			}


			const ix = Math.floor(x);
			const iy = Math.floor(y);

			const leftClick = buttons === 'mobile' ?
				'mobile' : 'left';

			if (leftDown) {
				const smode = handSelector.getMode();
				if (shiftKey) {
					gmap.setRoad(ix, iy, RoadType.VOID);
				} else if (smode) {
					runMode(smode, ix, iy, true, leftClick, clientX, clientY);
					this.lastScreenMouseX = clientX;
					this.lastScreenMouseY = clientY;
				} else {
					this.placeRoad(ix, iy);
				}
			}


			updateMouse(x, y);
			this.lastScreenMouseX = clientX;
			this.lastScreenMouseY = clientY;

		};

		input.onMouseUp = e => mouseUp(e.clientX, e.clientY);
		input.onMouseDown = e => mouseDown(e.clientX, e.clientY, e.buttons, e.shiftKey);
		input.onMouseMove = e => mouseMove(e.clientX, e.clientY, e.buttons, e.shiftKey);

		input.onTouchStart = e => {
			this.lastScreenMouseX = NaN;
			this.lastScreenMouseY = NaN;
		};

		input.onTouchMove = e =>
			mouseMove(e.touches[0].clientX, e.touches[0].clientY, 'mobile', false);
		

		input.onScroll = e => {
			let {x,y} = this.getMousePosition(e.clientX, e.clientY);
			this.camera.z -= this.camera.z * e.deltaY / 1000;
			updateMouse(x, y);
		}



		// Handle handPanel
		if (isTouchDevice()) {
			handSelector.showPanel();
		} else {
			handSelector.hidePanel();
		}

	}

	async runCars() {
		const gmap = this.gameMap;
		if (!gmap)
			return;

		// Behave cars
		gmap.updateCars();

		await gmap.updateTargets();
		gmap.removeCarMarks();
		gmap.moveCars();


		
		if (this.running) {
			this.carFrame++;
		}
	}

	placeKeyboardRoads(input: InputHandler) {
		const gmap = this.gameMap;
		if (!gmap)
			return;

		const x = Math.floor(this.lastMouseX);
		const y = Math.floor(this.lastMouseY);
		
		if (input.first('turnRight')) {
			/// TODO: turn right

		} else if (input.first('turnLeft')) {
			/// TODO: turn left
			
		} else if (input.first('yieldIns')) {
			const road = RoadType.YIELD;
			gmap.setRoad(x, y, road);

		} else if (input.first('light')) {
			const road = RoadType.LIGHT;
			gmap.setRoad(x, y, road);

		}
	}

	
	frame(game: GameHandler) {
		(window as any).fastView = game.inputHandler.first('fastView');

		let times = game.inputHandler.press('fastView') ? FAST_TIMES : 1;
		this.placeKeyboardRoads(game.inputHandler);


		const cmap = this.gameMap;

		for (let i = 0; i < times; i++) {
			if (this.runningCars) {
				if (cmap) {
					cmap.runLightTick();
				}

				this.runCars();
				(window as any).fastView = false;
			}
		}

		// End of game
		if (
			cmap && this.running &&
			cmap.enteredCars >= cmap.carsToEnterGoal
		) {
			this.running = false;
			const msg = "Score: " + this.formatTime();
			alert(msg);
			console.log(msg)
		}
	
		return null;
	}


	private setLight(x: number, y: number) {
		const gmap = this.gameMap;
		if (!gmap)
			return;

		const road = gmap.getRoad(x, y);
		if (roadfn.getType(road) === RoadType.LIGHT) {
			lightSelector.take(road, data => {
				if (data !== null) {
					console.log("set", data | RoadType.LIGHT);
					gmap.setRoad(x, y, data | RoadType.LIGHT);
				}
			});
			
		}
	}

	private setDirection(x: number, y: number) {
		const gmap = this.gameMap;
		if (!gmap)
			return;

		const road = gmap.getRoad(x, y);
		if (roadfn.getType(road) === RoadType.DIRECTION) {
			turnSelector.take(road, data => {
				if (data) {
					gmap.setRoad(x, y, data | RoadType.DIRECTION);
				}
			});
			
		}
	}

	private formatTime() {
		const time = this.carFrame;
		const totalSeconds = Math.floor(time / 60);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		const milliseconds = Math.floor((time % 60) / 6);
		return `${minutes.toString().padStart(1, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;

	}

	private drawStats(ctx: CanvasRenderingContext2D) {
		const gmap = this.gameMap;
		if (!gmap) {
			timeLeftDiv.innerText = "0:00.0";
			scoreDiv.innerText = (0).toString().padStart(3, "0");
			return;
		}

		const left = gmap.carsToEnterGoal - gmap.enteredCars;
		scoreDiv.innerText =  left.toString().padStart(3, "0");
		timeLeftDiv.innerText = this.formatTime();

		lightTurnDiv.textContent = gmap.getLightTick()
			.toString().padStart(2, "0");
	}

	draw(args: DrawStateData): void {
		const gmap = this.gameMap;
		if (!gmap)
			return;

		{
			// Background
			args.ctx.fillStyle = "#261f19";
			args.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
		}

		// Draw game
		args.followCamera();
		gmap.drawGrid(args.ctx, args.imageLoader);
		gmap.drawCars(args.ctx, args.imageLoader);
		args.unfollowCamera();


		// Draw stats
		this.drawStats(args.ctx);
	}

	exit() {
		document.getElementById("gameView")?.classList.add("hidden");
		
		if (this.statsPanel) {
			this.statsPanel.remove();
		}


		api.cleanup();
		return {score: this.score};	
	}

	getCamera() {
		return this.camera;
	}
}


