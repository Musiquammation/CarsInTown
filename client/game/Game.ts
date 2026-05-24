import { GAME_HEIGHT, GAME_WIDTH } from "../handler/dimensions";
import { isTouchDevice } from "../handler/isTouchDevice";
import { GameHandler } from "../handler/GameHandler";
import { DrawStateData, GameState } from "../handler/states";
import { Vector3 } from "../handler/Vector3";
import { Chunk } from "./Chunk";
import { ChunkMap } from "./ChunkMap";
import { roadtypes } from "./roadtypes";
import { Direction, getDirectionDelta, rotateDirectionToLeft, rotateDirectionToRight } from "./Direction";
import { InputHandler } from "../handler/InputHandler";
import { ImageLoader } from "../handler/ImageLoader";
import { modulo } from "./modulo";
import { lightSizeEditor } from "../handler/LightSizeEditor";
import { TransitionState } from "../states/TransitionState";
import { MapConstructor } from "./MapConstructor";
import { PauseElement } from "../handler/PauseElement";
import { GridExplorer } from "./GridExplorer";
import { HandSelection, handSelector } from "./HandSelector";
import { produceStatsPanel } from "./produceStatsPanel";


const timeLeftDiv = document.getElementById("timeLeft")!;
const scoreDiv = document.getElementById("score")!;
const mousePosDiv = document.getElementById("mousePos")!;
const lightTurnDiv = document.getElementById("lightTurn")!;

const FAST_TIMES = 4;
const LIGHT_TICK = 45;


export class Game extends GameState {
	private camera: Vector3 = {x: 0, y: 0, z: 20};

	chunkMap = new ChunkMap();
	private carFrame = 0;
	private runningCars = false;
	private score = 0;
	private lastMouseX = 0;
	private lastScreenMouseX = NaN;
	private lastScreenMouseY = NaN;
	private lastMouseY = 0;
	private lightTick = 0;
	private lightTickCouldown = 0;
	private statsPanel?: HTMLDivElement;



	private placeRoad(x: number, y: number) {
		const cmap = this.chunkMap;

		const neighbors = [
			cmap.getRoad(x+1, y),
			cmap.getRoad(x, y-1),
			cmap.getRoad(x-1, y),
			cmap.getRoad(x, y+1)
		];

		const alive: Direction[] = [];
		for (let i = 0; i < 4; i++)
			if (neighbors[i] & 0x7)
				alive.push(i);


		if (alive.length === 0) {
			cmap.setRoad(x, y, roadtypes.types.ROAD);
			return;
		}

		if (alive.length === 1) {
			const dir = alive[0];
			if ((neighbors[dir] & 0x7) != roadtypes.types.ROAD) {
				cmap.setRoad(x, y, roadtypes.types.ROAD);
				return;
			}

			let road = roadtypes.types.ROAD;

			const mdir = getDirectionDelta(dir);
			const pos = new GridExplorer(x, y, cmap);
			pos.move(mdir, cmap);
			
			let hasRight;
			let hasLeft;
			
			// Check for turn
			{
				const rpos = new GridExplorer(pos);
				rpos.move(getDirectionDelta(rotateDirectionToRight(dir)), cmap);
				hasRight = rpos.getRoad() & 0x7;
	
				const lpos = new GridExplorer(pos);
				lpos.move(getDirectionDelta(rotateDirectionToLeft(dir)), cmap);
				hasLeft = lpos.getRoad() & 0x7;
			}


			if (hasRight && !hasLeft) {
				pos.setRoad(roadtypes.types.TURN |
					(roadtypes.TurnDirection.LEFT  << 3) |
					(rotateDirectionToLeft(dir) << 6));


			} else if (!hasRight && hasLeft) {
				pos.setRoad(roadtypes.types.TURN |
					(roadtypes.TurnDirection.RIGHT  << 3) |
					(rotateDirectionToRight(dir) << 6));

			}


			cmap.setRoad(x, y, road);
			return;
		}

		if (alive.length === 2) {
			cmap.setRoad(x, y, roadtypes.types.ROAD);
			return;
		}

		cmap.setRoad(x, y, roadtypes.types.ROAD);
	}

	
	private test() {
		if (!window.DEBUG)
			return;


		// this.chunkMap.setRoad(x, y, roadtypes.types.ROAD);

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
		this.chunkMap.reset();
		this.lightTick = 0;
		this.lightTickCouldown = 0;

		(document.getElementById("pause") as PauseElement|null)?.togglePause(false);
		lightTurnDiv.textContent = this.lightTick.toString().padStart(2, '0');
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
		mapConstructor.fill(this.chunkMap);
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
			mouseScreenX: number,
			mouseScreenY: number,
		) => {
			let roadtype: roadtypes.types | null = null;

			if (
				moving &&
				Math.floor(this.lastMouseX) === Math.floor(x) &&
				Math.floor(this.lastMouseY) === Math.floor(y)
			) {
				return;
			}

			switch (smode) {
			case HandSelection.NONE:
				break;

			case HandSelection.ERASE:
				this.chunkMap.setRoad(x, y, roadtypes.types.VOID);
				break;

			case HandSelection.ROAD:
				this.placeRoad(x, y);
				break;

			case HandSelection.ROTATE:
			{
				const road = roadtypes.onRotation(
					this.chunkMap.getRoad(x, y));

				if (road !== null) {
					this.chunkMap.setRoad(x, y, road);
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
				roadtype = roadtypes.types.TURN;
				break;

			case HandSelection.PRIORITY:
				roadtype = roadtypes.types.PRIORITY;
				break;

			case HandSelection.LIGHT:
				roadtype = roadtypes.types.LIGHT;
				break;

			case HandSelection.ALTERN:
				roadtype = roadtypes.types.ALTERN;
				break;

			}

			if (roadtype !== null) {
				const road = this.chunkMap.getRoad(x, y);
				if ((road & 0x7) === roadtype) {
					const next = roadtypes.onScroll(road, -1);
					if (next === null) {
						const rotated = roadtypes.onRotation(road);

						if (rotated !== null) {
							this.chunkMap.setRoad(x, y, rotated);
						}

					} else if (next === 'light') {
						this.setLight(x, y, road);
						
					} else {
						this.chunkMap.setRoad(x, y, next);
					}
				} else {
					this.chunkMap.setRoad(x, y, roadtype);
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

			const smode = handSelector.getMode();
			if (smode) {
				runMode(smode, x, y, false, clientX, clientY);
				return;
			}

			const leftDown   = (buttons & 1) !== 0;
			const rightDown  = (buttons & 2) !== 0;
			const middleDown = (buttons & 4) !== 0;

			if (leftDown) {
				if (shiftKey) {
					this.chunkMap.setRoad(x, y, roadtypes.types.VOID);
				} else {
					this.placeRoad(x, y);
				}
			}

			if (rightDown) {
				const newRoad = roadtypes.onRotation(
					this.chunkMap.getRoad(x, y));

				if (newRoad !== null)
					this.chunkMap.setRoad(x, y, newRoad);

			}

			updateMouse(x, y);
		}
		
		const mouseMove = (
			clientX: number,
			clientY: number,
			buttons: number,
			shiftKey: boolean
		) => {
			let {x,y} = this.getMousePosition(clientX, clientY);
						
			const leftDown   = (buttons & 1) !== 0;
			const rightDown  = (buttons & 2) !== 0;
			const middleDown = (buttons & 4) !== 0;

			if (middleDown) {
				this.camera.x += this.lastMouseX - x;
				this.camera.y += this.lastMouseY - y;

				const c = this.getMousePosition(clientX, clientY);
				x = c.x;
				y = c.y;
			}



			const smode = handSelector.getMode();
			if (smode && leftDown) {
				runMode(smode, x, y, true, clientX, clientY);
				this.lastScreenMouseX = clientX;
				this.lastScreenMouseY = clientY;

				return;
			}

			if (leftDown) {
				if (shiftKey) {
					this.chunkMap.setRoad(x, y, roadtypes.types.VOID);
				} else {
					this.placeRoad(x, y);
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
			mouseMove(e.touches[0].clientX, e.touches[0].clientY, 1, false);
		

		input.onScroll = e => {
			let {x,y} = this.getMousePosition(e.clientX, e.clientY);
						
			const leftDown   = (e.buttons & 1) !== 0;
			const rightDown  = (e.buttons & 2) !== 0;
			const middleDown = (e.buttons & 4) !== 0;

			const road = this.chunkMap.getRoad(x, y);
			if (rightDown) {
				let type = ((road & 0x7) + 1);
				if (type >= roadtypes.types.SPAWNER) {
					type = 1;
				}

				const nextRoad = (road & ~0x7) | type;
				this.chunkMap.setRoad(x, y, nextRoad);
				return;
			}

			const roadScroll = roadtypes.onScroll(road, e.deltaY);
			if (roadScroll === 'light') {
				this.setLight(x, y, road);

			} else if (roadScroll) {
				this.chunkMap.setRoad(x, y, roadScroll);
			} else if (!leftDown && !rightDown) {
				this.camera.z -= this.camera.z * e.deltaY / 1000;
			}

			updateMouse(x, y);
		}



		// Handle handPanel
		if (isTouchDevice()) {
			handSelector.showPanel();
		} else {
			handSelector.hidePanel();
		}

	}

	runCars() {
		// Behave cars
		for (let {car, chunk} of this.chunkMap.iterateCars()) {
			if (!car.alive)
				continue;

			const x = modulo(Math.floor(car.x), Chunk.SIZE);
			const y = modulo(Math.floor(car.y), Chunk.SIZE);
			const road = chunk.getRoad(x, y);
			const behave = car.behave(road, this);
			if (typeof behave === 'number') {
				chunk.setRoad(x, y, behave);
			} else {
				switch (behave) {
				case "alive":
					break;

				case "won":
					this.score += car.score;
				case "killed":
					car.alive = false;
					break;
				}
			}
		}


		// Move cars
		for (let {car} of this.chunkMap.iterateCars()) {
			car.move();
		}


		this.chunkMap.updateCarGrid(this.carFrame);

		this.carFrame++;
	}

	placeKeyboardRoads(input: InputHandler) {
		const x = Math.floor(this.lastMouseX);
		const y = Math.floor(this.lastMouseY);
		const current = this.chunkMap.getRoad(x, y);
		
		if (input.first('turnRight')) {
			const road = roadtypes.types.TURN | 
				(roadtypes.TurnDirection.RIGHT << 3) |
				(current & (3<<6));

			this.chunkMap.setRoad(x, y, road);	

		} else if (input.first('turnLeft')) {
			const road = roadtypes.types.TURN | 
				(roadtypes.TurnDirection.LEFT << 3) |
				(current & (3<<6));

			this.chunkMap.setRoad(x, y, road);
			
		} else if (input.first('yieldIns')) {
			const road = roadtypes.types.PRIORITY | 
				(current & (3<<6));

			this.chunkMap.setRoad(x, y, road);

		} else if (input.first('light')) {
			const road = roadtypes.types.LIGHT | 
				(current & (3<<6));

			this.chunkMap.setRoad(x, y, road);

		} else if (input.first('altern')) {
			const road = roadtypes.types.ALTERN | 
				(current & (3<<6));

			this.chunkMap.setRoad(x, y, road);

		}
	}

	runLightTicks() {
		this.lightTickCouldown++;
		if (this.lightTickCouldown >= LIGHT_TICK) {
			this.lightTickCouldown -= LIGHT_TICK;
			this.lightTick++;
			if (this.lightTick >= 32) {
				this.lightTick -= 32;
			}
			lightTurnDiv.textContent = this.lightTick.toString().padStart(2, '0');
		}
	}

	frame(game: GameHandler) {
		(window as any).fastView = game.inputHandler.first('fastView');

		let times = game.inputHandler.press('fastView') ? FAST_TIMES : 1;
		this.placeKeyboardRoads(game.inputHandler);

		for (let i = 0; i < times; i++) {
			if (this.runningCars) {
				this.runLightTicks();

				for (let [_, chunk] of this.chunkMap) {
					chunk.runEvents(this.lightTick);
				}

				this.runCars();
				(window as any).fastView = false;
			}
	
			if (this.carFrame >= this.chunkMap.time)
				return new TransitionState(this);
		}
	
		return null;
	}


	private setLight(x: number, y: number, road: roadtypes.road_t) {
		const light = this.chunkMap.getLight(x, y);
		if (light) {
			lightSizeEditor.get(light.flag, (road >> 4) & 0x3).then(o => {
				light.flag = o.flag;

				let nextRoad = roadtypes.types.LIGHT;
				nextRoad |= road & (3<<6); // direction
				nextRoad |= o.cycleSize << 4;
				this.chunkMap.setRoad(x, y, nextRoad);
			});
			
		}
	}


	private drawGrid(ctx: CanvasRenderingContext2D, iloader: ImageLoader) {
		for (let [_, chunk] of this.chunkMap) {
			ctx.save();
			ctx.translate(chunk.x * Chunk.SIZE, chunk.y * Chunk.SIZE);
			const drawBackground = (
				chunk.x >= 0 && chunk.x < this.chunkMap.gameArea.x &&
				chunk.y >= 0 && chunk.y < this.chunkMap.gameArea.y
			);
			chunk.drawGrid(ctx, iloader, drawBackground);
			ctx.restore();
		}
	}

	private drawCars(ctx: CanvasRenderingContext2D, iloader: ImageLoader) {
		for (let [_, chunk] of this.chunkMap) {
			chunk.drawCars(ctx, iloader);
		}
	}

	private drawStats(ctx: CanvasRenderingContext2D) {
		// time at format mm:ss.u
		let leftTime: string = (() => {
			const time = Math.max(this.chunkMap.time - this.carFrame, 0);
			const totalSeconds = Math.floor(time / 60);
			const minutes = Math.floor(totalSeconds / 60);
			const seconds = totalSeconds % 60;
			const milliseconds = Math.floor((time % 60) / 6);
			return `${minutes.toString().padStart(1, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
		})();

		timeLeftDiv.innerText = leftTime;
		scoreDiv.innerText = this.score.toString().padStart(5, "0");
	}

	draw(args: DrawStateData): void {
		{
			// Background
			args.ctx.fillStyle = "#261f19";
			args.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

		}
		// Draw game
		args.followCamera();
		this.drawGrid(args.ctx, args.imageLoader);
		this.drawCars(args.ctx, args.imageLoader);
		args.unfollowCamera();


		// Draw stats
		this.drawStats(args.ctx);
	}

	exit() {
		document.getElementById("gameView")?.classList.add("hidden");
		
		if (this.statsPanel) {
			this.statsPanel.remove();
		}

		return {score: this.score};	
	}

	getCamera() {
		return this.camera;
	}
}


