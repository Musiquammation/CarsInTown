const GAME_WIDTH = 1600;
const GAME_HEIGHT = 900;
class Keydown {
  constructor() {
    this.turnLeft = false;
    this.turnRight = false;
    this.yieldIns = false;
    this.light = false;
    this.fastView = false;
    this.altern = false;
  }
}
class KeyboardCollector {
  constructor() {
    this.turnLeft = 0;
    this.turnRight = 0;
    this.yieldIns = 0;
    this.light = 0;
    this.fastView = 0;
    this.altern = 0;
  }
}
const _InputHandler = class _InputHandler {
  constructor(mode) {
    this.collectedKeys = new KeyboardCollector();
    this.keysDown = new Keydown();
    this.firstPress = new Keydown();
    this.killedPress = new Keydown();
    this.onMouseUp = (e) => {
    };
    this.onMouseDown = (e) => {
    };
    this.onMouseMove = (e) => {
    };
    this.onScroll = (e) => {
    };
    this.onTouchStart = (e) => {
    };
    this.onTouchEnd = (e) => {
    };
    this.onTouchMove = (e) => {
    };
    this.onKeydown = (event) => {
      const e = event;
      const control = this.keyMap[e.code];
      if (control) {
        this.applyKeydown(control);
      }
    };
    this.onKeyup = (event) => {
      const e = event;
      const control = this.keyMap[e.code];
      if (control) {
        this.applyKeyup(control);
      }
    };
    this.onButtonTouchStart = (control, element) => {
      element.classList.add("high");
      if (control === "special") {
        return;
      }
      switch (this.collectedKeys[control]) {
        case 0:
          this.collectedKeys[control] = 1;
          break;
        case 1:
          break;
        case 2:
          this.collectedKeys[control] = 4;
          break;
        case 3:
          this.collectedKeys[control] = 4;
          break;
        case 4:
          this.collectedKeys[control] = 4;
          break;
      }
    };
    this.onButtonTouchEnd = (control, element) => {
      element.classList.remove("high");
      if (control === "special") {
        return;
      }
      switch (this.collectedKeys[control]) {
        case 0:
          this.collectedKeys[control] = 2;
          break;
        case 1:
          this.collectedKeys[control] = 3;
          break;
        case 2:
          break;
        case 3:
          this.collectedKeys[control] = 3;
          break;
        case 4:
          this.collectedKeys[control] = 3;
          break;
      }
    };
    this.keyMap = _InputHandler.KEYBOARDS[mode];
  }
  applyKeydown(control) {
    switch (this.collectedKeys[control]) {
      case 0:
        this.collectedKeys[control] = 1;
        break;
      case 1:
        break;
      case 2:
        this.collectedKeys[control] = 4;
        break;
      case 3:
        this.collectedKeys[control] = 4;
        break;
      case 4:
        this.collectedKeys[control] = 4;
        break;
    }
  }
  applyKeyup(control) {
    switch (this.collectedKeys[control]) {
      case 0:
        this.collectedKeys[control] = 2;
        break;
      case 1:
        this.collectedKeys[control] = 3;
        break;
      case 2:
        break;
      case 3:
        this.collectedKeys[control] = 3;
        break;
      case 4:
        this.collectedKeys[control] = 3;
        break;
    }
  }
  startKeydownListeners(target) {
    target.addEventListener("keydown", this.onKeydown);
    target.addEventListener("keyup", this.onKeyup);
  }
  startMouseListeners(target) {
    target.addEventListener("mouseup", (e) => {
      this.onMouseUp(e);
    });
    target.addEventListener("mousedown", (e) => {
      this.onMouseDown(e);
    });
    target.addEventListener("mousemove", (e) => {
      this.onMouseMove(e);
    });
    target.addEventListener("wheel", (e) => {
      const we = e;
      if (we.ctrlKey) {
        we.preventDefault();
      }
      this.onScroll(we);
    }, { passive: false });
    target.addEventListener("touchstart", (e) => {
      this.onTouchStart(e);
    });
    target.addEventListener("touchend", (e) => {
      this.onTouchEnd(e);
    });
    target.addEventListener("touchmove", (e) => {
      this.onTouchMove(e);
    });
  }
  removeListeners(target) {
    target.removeEventListener("keydown", this.onKeydown);
    target.removeEventListener("keyup", this.onKeyup);
  }
  update() {
    for (const control of _InputHandler.CONTROLS) {
      this.play(control, this.collectedKeys[control]);
      this.collectedKeys[control] = 0;
    }
  }
  play(control, action) {
    switch (action) {
      case 0:
        this.firstPress[control] = false;
        this.killedPress[control] = false;
        break;
      case 1:
        if (this.keysDown[control]) {
          this.firstPress[control] = false;
        } else {
          this.firstPress[control] = true;
          this.keysDown[control] = true;
        }
        this.killedPress[control] = false;
        break;
      case 2:
        if (this.keysDown[control]) {
          this.firstPress[control] = false;
          this.keysDown[control] = false;
          this.killedPress[control] = true;
        } else {
          this.firstPress[control] = false;
          this.killedPress[control] = false;
        }
        break;
      case 3:
        if (this.keysDown[control]) {
          this.firstPress[control] = false;
          this.keysDown[control] = false;
        } else {
          this.firstPress[control] = true;
        }
        this.killedPress[control] = true;
        break;
      case 4:
        if (this.keysDown[control]) {
          this.firstPress[control] = false;
          this.keysDown[control] = false;
          this.killedPress[control] = true;
        } else {
          this.firstPress[control] = false;
          this.killedPress[control] = false;
        }
        if (this.keysDown[control]) {
          this.firstPress[control] = false;
        } else {
          this.firstPress[control] = true;
          this.keysDown[control] = true;
        }
        this.killedPress[control] = false;
        break;
    }
  }
  press(control) {
    return this.firstPress[control] || this.keysDown[control];
  }
  first(control) {
    return this.firstPress[control];
  }
  killed(control) {
    return this.killedPress[control];
  }
  kill(control, removeFirstPress = false) {
    this.keysDown[control] = false;
    if (removeFirstPress) {
      this.firstPress[control] = false;
    }
  }
};
_InputHandler.CONTROLS = ["turnLeft", "turnRight", "yieldIns", "light", "fastView", "altern"];
_InputHandler.CONTROL_STACK_SIZE = 256;
_InputHandler.KEYBOARDS = {
  zqsd: {
    KeyE: "turnLeft",
    KeyR: "turnRight",
    KeyP: "yieldIns",
    KeyL: "light",
    KeyC: "fastView",
    KeyS: "altern"
  },
  wasd: {
    KeyE: "turnLeft",
    KeyR: "turnRight",
    KeyP: "yieldIns",
    KeyL: "light",
    KeyC: "fastView",
    KeyS: "altern"
  }
};
let InputHandler = _InputHandler;
class ImageLoader {
  constructor(pathRoot) {
    this.folders = {};
    this.loadedCount = 0;
    this.totalCount = 0;
    this.pathRoot = pathRoot;
    const size = 2;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "violet";
    ctx.fillRect(0, 0, size / 2, size / 2);
    ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
    ctx.fillStyle = "white";
    ctx.fillRect(size / 2, 0, size / 2, size / 2);
    ctx.fillRect(0, size / 2, size / 2, size / 2);
    this.placeholder = canvas;
  }
  hexToRgb(hex) {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b2 = parseInt(clean.substring(4, 6), 16);
    return [r, g, b2];
  }
  recolorImage(img, checked, target) {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0);
    const [cr, cg, cb] = this.hexToRgb(checked);
    const [tr, tg, tb] = this.hexToRgb(target);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === cr && data[i + 1] === cg && data[i + 2] === cb) {
        data[i] = tr;
        data[i + 1] = tg;
        data[i + 2] = tb;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  async load(list) {
    this.totalCount = Object.keys(list).length;
    this.loadedCount = 0;
    const promises = [];
    for (const [name, path] of Object.entries(list)) {
      const p = (async () => {
        try {
          const res = await fetch(this.pathRoot + path);
          if (!res.ok) throw new Error("Failed to fetch " + path);
          const blob = await res.blob();
          const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = (e) => reject(e);
            i.src = URL.createObjectURL(blob);
          });
          if (!this.folders["default"])
            this.folders["default"] = {};
          if (!this.folders["default"][name])
            this.folders["default"][name] = [];
          this.folders["default"][name].push(img);
          this.loadedCount++;
        } catch (err) {
          console.warn("Error with:", path);
          console.error(err);
          this.loadedCount++;
        }
      })();
      promises.push(p);
    }
    await Promise.all(promises);
  }
  async loadWithColors(checked, colors, list) {
    this.totalCount += Object.keys(list).length;
    const promises = [];
    for (const [name, path] of Object.entries(list)) {
      const p = (async () => {
        try {
          const res = await fetch(this.pathRoot + path);
          if (!res.ok) throw new Error("Failed to fetch " + path);
          const blob = await res.blob();
          const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = (e) => reject(e);
            i.src = URL.createObjectURL(blob);
          });
          if (!this.folders["colored"])
            this.folders["colored"] = {};
          if (!this.folders["colored"][name])
            this.folders["colored"][name] = [];
          for (const color of colors) {
            const recolored = this.recolorImage(img, checked, color);
            this.folders["colored"][name].push(recolored);
          }
          this.loadedCount++;
        } catch (err) {
          console.warn("Error with:", path);
          console.error(err);
          this.loadedCount++;
        }
      })();
      promises.push(p);
    }
    await Promise.all(promises);
  }
  isLoaded() {
    return this.loadedCount === this.totalCount;
  }
  get(name, color = -1) {
    if (name === null)
      return this.placeholder;
    if (color >= 0) {
      const folder2 = this.folders["colored"];
      if (folder2 && folder2[name] && folder2[name][color] !== void 0)
        return folder2[name][color];
      return this.placeholder;
    }
    const folder = this.folders["default"];
    if (folder && folder[name] && folder[name][0])
      return folder[name][0];
    return this.placeholder;
  }
  getFolders() {
    return this.folders;
  }
}
var CarColor = /* @__PURE__ */ ((CarColor2) => {
  CarColor2[CarColor2["RED"] = 0] = "RED";
  CarColor2[CarColor2["YELLOW"] = 1] = "YELLOW";
  CarColor2[CarColor2["BLUE"] = 2] = "BLUE";
  CarColor2[CarColor2["GREEN"] = 3] = "GREEN";
  CarColor2[CarColor2["CYAN"] = 4] = "CYAN";
  CarColor2[CarColor2["PINK"] = 5] = "PINK";
  CarColor2[CarColor2["WHITE"] = 6] = "WHITE";
  CarColor2[CarColor2["GRAY"] = 7] = "GRAY";
  return CarColor2;
})(CarColor || {});
class GameState {
}
var states;
((states2) => {
  class Home extends GameState {
    enter(data, input) {
      input.onMouseUp = (e) => {
      };
      input.onMouseDown = (e) => {
      };
      input.onMouseMove = (e) => {
      };
      input.onScroll = (e) => {
      };
      input.onTouchStart = (e) => {
      };
      input.onTouchEnd = (e) => {
      };
      input.onTouchMove = (e) => {
      };
    }
    frame(game) {
      return null;
    }
    draw(args) {
    }
    exit() {
    }
    getCamera() {
      return null;
    }
  }
  states2.Home = Home;
})(states || (states = {}));
var roadfn;
((roadfn2) => {
  function getType(road) {
    return road & 7;
  }
  roadfn2.getType = getType;
  function setType(type) {
    return type & 7;
  }
  roadfn2.setType = setType;
})(roadfn || (roadfn = {}));
var Direction = /* @__PURE__ */ ((Direction2) => {
  Direction2[Direction2["RIGHT"] = 0] = "RIGHT";
  Direction2[Direction2["UP"] = 1] = "UP";
  Direction2[Direction2["LEFT"] = 2] = "LEFT";
  Direction2[Direction2["DOWN"] = 3] = "DOWN";
  return Direction2;
})(Direction || {});
function rotateDirectionToLeft(dir) {
  switch (dir) {
    case 0:
      return 1;
    case 1:
      return 2;
    case 2:
      return 3;
    case 3:
      return 0;
  }
}
function rotateDirectionToRight(dir) {
  switch (dir) {
    case 0:
      return 3;
    case 3:
      return 2;
    case 2:
      return 1;
    case 1:
      return 0;
  }
}
function getAttach(direction, rotatingToRight, step) {
  step = Math.max(0, Math.min(1, step));
  let cx = 0, cy = 0;
  let startAngle = 0;
  let endAngle = 0;
  const radius = 0.5;
  switch (direction) {
    case 1:
      {
        cx = 1;
        cy = 1;
        startAngle = Math.PI;
        endAngle = 3 * Math.PI / 2;
      }
      break;
    case 0:
      {
        cx = 0;
        cy = 1;
        startAngle = -Math.PI / 2;
        endAngle = 0;
      }
      break;
    case 3:
      {
        cx = 0;
        cy = 0;
        startAngle = 0;
        endAngle = Math.PI / 2;
      }
      break;
    case 2:
      {
        cx = 1;
        cy = 0;
        startAngle = Math.PI / 2;
        endAngle = Math.PI;
      }
      break;
  }
  const angle = startAngle + (endAngle - startAngle) * step;
  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);
  return { x, y, angle };
}
function getDirectionDelta(direction) {
  let x = 0;
  let y = 0;
  switch (direction) {
    case 0:
      x = 1;
      break;
    case 1:
      y = -1;
      break;
    case 2:
      x = -1;
      break;
    case 3:
      y = 1;
      break;
  }
  return { x, y };
}
var HandSelection = /* @__PURE__ */ ((HandSelection2) => {
  HandSelection2[HandSelection2["NONE"] = 0] = "NONE";
  HandSelection2[HandSelection2["ROAD"] = 1] = "ROAD";
  HandSelection2[HandSelection2["ERASE"] = 2] = "ERASE";
  HandSelection2[HandSelection2["ROTATE"] = 3] = "ROTATE";
  HandSelection2[HandSelection2["MOVE"] = 4] = "MOVE";
  HandSelection2[HandSelection2["TURN"] = 5] = "TURN";
  HandSelection2[HandSelection2["YIELD"] = 6] = "YIELD";
  HandSelection2[HandSelection2["LIGHT"] = 7] = "LIGHT";
  return HandSelection2;
})(HandSelection || {});
const zoomContainerHtml = document.getElementById("zoomContainer");
const HAND_SELECTION_ICONS = [
  "icon_none",
  "icon_road",
  "icon_erase",
  "icon_rotate",
  "icon_move",
  "turn_turn",
  "yield",
  "light_green"
];
class HandSelector {
  constructor(panelDiv) {
    this.currentMode = 0;
    this.panelDiv = panelDiv;
  }
  getDiv(idx) {
    return this.panelDiv.children[idx].children[0];
  }
  setMode(idx) {
    this.panelDiv.children[this.currentMode].classList.remove("selected");
    this.panelDiv.children[idx].classList.add("selected");
    this.currentMode = idx;
    if (idx === 4) {
      zoomContainerHtml.classList.remove("hidden");
    } else {
      zoomContainerHtml.classList.add("hidden");
    }
  }
  getMode() {
    return this.currentMode;
  }
  appendDivList() {
    const length = Object.values(HandSelection).length / 2;
    for (let i = 0; i < length; i++) {
      const div = document.createElement("div");
      const subDiv = document.createElement("div");
      div.appendChild(subDiv);
      this.panelDiv.appendChild(div);
      const idx = i;
      div.addEventListener("click", () => this.setMode(idx));
      div.addEventListener("touchstart", () => this.setMode(idx));
    }
    this.panelDiv.children[0].classList.add("selected");
  }
  showPanel() {
    this.panelDiv.classList.remove("hidden");
  }
  hidePanel() {
    this.setMode(
      0
      /* NONE */
    );
  }
}
const handSelector = new HandSelector(document.getElementById("handPanel"));
handSelector.appendDivList();
function produceStatsPanel(map) {
  const panel = document.createElement("div");
  panel.textContent = "No data...";
  return panel;
}
var RoadType = /* @__PURE__ */ ((RoadType2) => {
  RoadType2[RoadType2["VOID"] = 0] = "VOID";
  RoadType2[RoadType2["ROAD"] = 1] = "ROAD";
  RoadType2[RoadType2["TARGET"] = 2] = "TARGET";
  RoadType2[RoadType2["DIRECTION"] = 3] = "DIRECTION";
  RoadType2[RoadType2["YIELD"] = 4] = "YIELD";
  RoadType2[RoadType2["LIGHT"] = 5] = "LIGHT";
  return RoadType2;
})(RoadType || {});
function drawDirection(ctx, road, drawImage) {
  const side0 = road >> 4 & 7;
  const side1 = road >> 7 & 7;
  const dir0 = road >> 10 & 3;
  const dir1 = road >> 12 & 3;
  if (side0 === 0 && side1 === 0) {
    ctx.fillStyle = "#ddd";
    ctx.fillRect(0, 0, 1, 1);
    return;
  }
  let uniqueSide = -1;
  let uniqueDir = -1;
  if (side0 === 0 && side1 !== 0) {
    uniqueSide = side1;
    uniqueDir = dir1;
  } else if (side0 !== 0 && side1 === 0) {
    uniqueSide = side0;
    uniqueDir = dir0;
  }
  if (uniqueSide < 0) {
    drawImage(null, 0);
    return;
  }
  const angle = Math.PI / 2 * uniqueDir;
  switch (uniqueSide) {
    case 1:
      drawImage("turn_front", angle);
      break;
    case 2:
      drawImage("turn_turn", angle, { x: false, y: false });
      break;
    case 3:
      drawImage("turn_turn", angle, { x: false, y: true });
      break;
    case 4:
      drawImage("turn_both", angle, { x: false, y: false });
      break;
    case 5:
      drawImage("turn_both", angle, { x: false, y: true });
      break;
    case 6:
      drawImage("turn_split", angle);
      break;
    case 7:
      drawImage("turn_all", angle);
      break;
  }
}
function drawRoad(ctx, iloader, road, lightStep) {
  function drawImage(name, angle, data = { x: false, y: false }) {
    ctx.save();
    ctx.translate(0.5, 0.5);
    ctx.rotate(-angle);
    ctx.scale(data.x ? -1 : 1, data.y ? -1 : 1);
    ctx.imageSmoothingEnabled = false;
    const color = data.color === void 0 ? -1 : data.color;
    const img = iloader.get(name, color);
    const decalage = data.decalage;
    if (decalage) {
      ctx.drawImage(
        img,
        decalage.x * decalage.w,
        decalage.y * decalage.h,
        decalage.w,
        decalage.h,
        -0.5,
        -0.5,
        1,
        1
      );
    } else {
      ctx.drawImage(img, -0.5, -0.5, 1, 1);
    }
    ctx.restore();
  }
  switch (roadfn.getType(road)) {
    case 0:
      if (road & 1 << 3) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 1, 1);
        return;
      }
      return;
    case 1: {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 1, 1);
      return;
    }
    case 3: {
      drawDirection(ctx, road, drawImage);
      return;
    }
    case 4: {
      drawImage("yield", Math.PI / 2 * (road >> 6 & 3));
      break;
    }
    case 5: {
      const green = road & 1 << lightStep + 4;
      drawImage(
        green ? "light_green" : "light_red",
        Math.PI / 2 * (road >> 12 & 3)
      );
      break;
    }
    case 2: {
      const color = road >> 4 & 7;
      const symbol = road >> 7 & 31;
      drawImage(
        "consumers",
        0,
        { x: false, y: false, color, decalage: {
          x: symbol,
          y: 0,
          w: 16,
          h: 16
        } }
      );
      break;
    }
    default:
      throw new Error("Invalid road type");
  }
}
function onRoadRotation(road) {
  switch (roadfn.getType(road)) {
    case 4: {
      let dir = road >> 6 & 3;
      dir++;
      dir &= 3;
      road = road & -193 | dir << 6;
      return road;
    }
    case 3: {
      return null;
    }
    case 5: {
      let dir = road >> 12 & 3;
      dir++;
      dir &= 3;
      road = road & -12289 | dir << 12;
      return road;
    }
    case 2: {
      return "target";
    }
    default:
      return null;
  }
}
function onRoadEdit(road) {
  switch (roadfn.getType(road)) {
    case 5:
      return "light";
    case 3:
      return "direction";
    default:
      return null;
  }
}
const DIRECTIONS$1 = [
  { value: 0, label: "RIGHT" },
  { value: 1, label: "UP" },
  { value: 2, label: "LEFT" },
  { value: 3, label: "DOWN" }
];
class LightSelector {
  constructor(parent) {
    this.callback = null;
    this.currentBits = 0;
    this.isMouseDown = false;
    this.paintValue = false;
    this.parent = parent;
    this.parent.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    this.parent.querySelector("#ls-ok").addEventListener("click", () => this.confirm());
    this.parent.querySelector("#ls-cancel").addEventListener("click", () => this.cancel());
    document.addEventListener("mouseup", () => {
      this.isMouseDown = false;
    });
  }
  take(data, callback) {
    this.currentBits = data >> 4 & 255;
    const direction = data >> 12 & 3;
    this.callback = callback;
    this.parent.classList.remove("hidden");
    this.buildUI(this.currentBits, direction);
  }
  buildUI(bits, direction) {
    const container = this.parent.querySelector(".ls-dots");
    container.innerHTML = "";
    for (let i = 0; i < 8; i++) {
      const dot = document.createElement("div");
      dot.className = "ls-dot";
      dot.dataset.index = String(i);
      dot.classList.toggle("ls-dot--on", (bits >> i & 1) === 1);
      dot.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.isMouseDown = true;
        this.paintValue = !dot.classList.contains("ls-dot--on");
        this.applyDot(dot, i);
      });
      dot.addEventListener("mouseenter", () => {
        if (!this.isMouseDown) return;
        this.applyDot(dot, i);
      });
      container.appendChild(dot);
    }
    const select = this.parent.querySelector("#ls-direction");
    select.innerHTML = "";
    for (const d of DIRECTIONS$1) {
      const opt = document.createElement("option");
      opt.value = String(d.value);
      opt.textContent = d.label;
      opt.selected = d.value === direction;
      select.appendChild(opt);
    }
  }
  applyDot(dot, index) {
    dot.classList.toggle("ls-dot--on", this.paintValue);
    if (this.paintValue) {
      this.currentBits |= 1 << index;
    } else {
      this.currentBits &= ~(1 << index);
    }
  }
  confirm() {
    const select = this.parent.querySelector("#ls-direction");
    const direction = parseInt(select.value);
    const result = this.currentBits << 4 | direction << 12;
    this.close(result);
  }
  cancel() {
    this.close(null);
  }
  close(result) {
    this.parent.classList.add("hidden");
    if (this.callback) {
      this.callback(result);
      this.callback = null;
    }
  }
}
const lightSelector = new LightSelector(
  document.getElementById("lightSelector")
);
const actionMap = {
  "front": 0,
  "turn-right": 1,
  "turn-left": 2
};
class Api {
  constructor() {
    this.module = null;
    this.mapPtr = -1;
    this.carsPtr = -1;
    this._ready = new Promise((resolve) => {
      this._resolveReady = resolve;
    });
  }
  appendModule(module) {
    this._init = module.cwrap("Api_init", "number", ["number"]);
    this._reserveCars = module.cwrap("Api_reserveCars", "number", ["number"]);
    this._getDangers = module.cwrap("Api_getDangers", "number", ["number"]);
    this._cleanup = module.cwrap("Api_cleanup", null, []);
    this._addPath = module.cwrap(
      "Api_addPath",
      "number",
      ["number", "number", "number", "number"]
    );
    this._removePath = module.cwrap(
      "Api_removePath",
      null,
      ["number"]
    );
    this._movePath = module.cwrap(
      "Api_movePath",
      "number",
      ["number"]
    );
    this._cleanup = module.cwrap("Api_cleanup", null, []);
    this._setupCars = module.cwrap("Api_setupCars", null, []);
    this._cleanupCars = module.cwrap("Api_cleanupCars", null, []);
    this.module = module;
    this._resolveReady();
    console.log("WASM module loaded");
  }
  async ready() {
    await this._ready;
  }
  enshure() {
    if (this.module === null) {
      throw new Error("Module is not loaded");
    }
  }
  async init(mapSize) {
    await this.ready();
    this.mapPtr = this._init(mapSize) >> 1;
    console.log("Map initialized");
  }
  async cleanup() {
    await this.ready();
    console.log("Map clean");
    this._cleanup();
  }
  setupCars(cars) {
    this.enshure();
    const ptr = this._reserveCars(cars.length);
    this.carsPtr = ptr;
    const HEAP32 = this.module.HEAP32;
    const HEAPF32 = this.module.HEAPF32;
    let offset = ptr >> 2;
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      let dir = car.getDirection();
      if (car.state == "turn-left") {
        dir = (dir + 1) % 4;
      } else if (car.state === "turn-right") {
        dir = (dir + 3) % 4;
      }
      HEAP32[offset++] = car.x;
      HEAP32[offset++] = car.y;
      HEAPF32[offset++] = car.step;
      HEAPF32[offset++] = car.getSpeed();
      HEAPF32[offset++] = car.getSpeedLimit();
      HEAP32[offset++] = dir;
      HEAP32[offset++] = car.pathId;
      HEAP32[offset++] = actionMap[car.state];
      HEAP32[offset++] = i;
      offset += 2;
    }
    this._setupCars();
  }
  cleanupCars() {
    this.enshure();
    this._cleanupCars();
  }
  getDangers(cars, lightStep) {
    this.enshure();
    const error = this._getDangers(lightStep);
    if (error) {
      throw new Error("getDangers exited " + error);
    }
    const HEAP32 = this.module.HEAP32;
    const HEAPF32 = this.module.HEAPF32;
    let offset = this.carsPtr >> 2;
    for (let i = 0; i < cars.length; i++) {
      offset += 8;
      const id = HEAP32[offset++];
      const car = cars[id];
      const acc = HEAPF32[offset++];
      const speedLimit = HEAPF32[offset++];
      try {
        car.behave(speedLimit, acc);
      } catch (e) {
        console.log(id, cars.length);
        console.error(e);
      }
    }
  }
  addPath(firstDir, srcX, srcY, dstX, dstY) {
    this.enshure();
    return this._addPath(firstDir, srcX, srcY, dstX, dstY);
  }
  removePath(id) {
    this.enshure();
    return this._removePath(id);
  }
  setRoad(idx, road) {
    this.ready().then(() => {
      road &= -32769;
      this.module.HEAP16[this.mapPtr + idx] = road;
    });
  }
  stepCar(id) {
    this.enshure();
    const ptr = this._movePath(id);
    let offset = ptr >> 2;
    const x = this.module.HEAP32[offset++];
    const y = this.module.HEAP32[offset++];
    const dir = this.module.HEAP32[offset++];
    return { x, y, dir };
  }
}
const api = new Api();
import(
  /* @vite-ignore */
  window.WASM_PATH
).then(({ default: createModule }) => {
  createModule().then((instance) => {
    api.appendModule(instance);
  });
});
function getSide(data, direction) {
  const dir1 = data >> 10 & 3;
  const dir2 = data >> 12 & 3;
  const side1 = data >> 4 & 7;
  const side2 = data >> 7 & 7;
  if (side1 !== 0 && dir1 === direction) return side1;
  if (side2 !== 0 && dir2 === direction) return side2;
  return 0;
}
function setSide(data, direction, value) {
  const dir1 = data >> 10 & 3;
  const dir2 = data >> 12 & 3;
  const side1 = data >> 4 & 7;
  const side2 = data >> 7 & 7;
  if (side1 !== 0 && dir1 === direction) {
    data &= -113;
    data |= (value & 7) << 4;
    return data;
  }
  if (side2 !== 0 && dir2 === direction) {
    data &= -897;
    data |= (value & 7) << 7;
    return data;
  }
  if (side1 === 0) {
    data &= -113;
    data &= -3073;
    data |= (value & 7) << 4;
    data |= (direction & 3) << 10;
    return data;
  }
  if (side2 === 0) {
    data &= -897;
    data &= -12289;
    data |= (value & 7) << 7;
    data |= (direction & 3) << 12;
    return data;
  }
  return 0;
}
const DIRECTIONS = [
  { value: 0, label: "RIGHT" },
  { value: 1, label: "UP" },
  { value: 2, label: "LEFT" },
  { value: 3, label: "DOWN" }
];
const SUB_OPTIONS = [
  { key: "front", label: "Front" },
  { key: "right", label: "Right" },
  { key: "left", label: "Left" }
];
function bitsToValue(front, right, left) {
  if (front && right && left) return 7;
  if (right && left) return 6;
  if (front && left) return 5;
  if (front && right) return 4;
  if (left) return 3;
  if (right) return 2;
  if (front) return 1;
  return 0;
}
function valueToBits(v) {
  return {
    front: v === 1 || v === 4 || v === 5 || v === 7,
    right: v === 2 || v === 4 || v === 6 || v === 7,
    left: v === 3 || v === 5 || v === 6 || v === 7
  };
}
function findDirections(data) {
  const used = [];
  for (const d of [0, 1, 2, 3]) {
    if (getSide(data, d) !== 0) used.push(d);
  }
  const dir0 = used[0] ?? 0;
  const dir1 = used[1] ?? [0, 1, 2, 3].find((d) => d !== dir0);
  return [dir0, dir1];
}
class TurnSelector {
  constructor(parent) {
    this.callback = null;
    this.currentData = 0;
    parent.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    this.parent = parent;
    this.parent.querySelector("#ts-ok").addEventListener("click", () => this.confirm());
    this.parent.querySelector("#ts-cancel").addEventListener("click", () => this.cancel());
  }
  // Open the selector with the given data, call callback with updated data or null on cancel
  take(data, callback) {
    this.currentData = data;
    this.callback = callback;
    this.parent.classList.remove("hidden");
    this.buildUI(data);
  }
  // Build both rows from the current data
  buildUI(data) {
    const [dir0, dir1] = findDirections(data);
    this.buildRow(0, dir0, dir1, data);
    this.buildRow(1, dir1, dir0, data);
  }
  // Build a single direction row (select + checkboxes)
  buildRow(rowIndex, direction, otherDirection, data) {
    const row = this.parent.querySelector(`#ts-row-${rowIndex}`);
    row.innerHTML = "";
    const lbl = document.createElement("label");
    lbl.textContent = rowIndex === 0 ? "1st direction" : "2nd direction";
    row.appendChild(lbl);
    const select = document.createElement("select");
    for (const d of DIRECTIONS) {
      if (d.value === otherDirection) continue;
      const opt = document.createElement("option");
      opt.value = String(d.value);
      opt.textContent = d.label;
      opt.selected = d.value === direction;
      select.appendChild(opt);
    }
    row.appendChild(select);
    const checkDiv = document.createElement("div");
    checkDiv.className = "ts-checkboxes";
    const currentValue = getSide(data, direction);
    const bits = valueToBits(currentValue);
    for (const sub of SUB_OPTIONS) {
      const lbl2 = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.dataset.key = sub.key;
      cb.checked = bits[sub.key];
      lbl2.appendChild(cb);
      lbl2.append(" " + sub.label);
      checkDiv.appendChild(lbl2);
    }
    row.appendChild(checkDiv);
    select.addEventListener("change", () => this.onDirectionChange(rowIndex));
  }
  // Handle direction change: resolve conflicts and rebuild both rows
  onDirectionChange(changedRow) {
    const otherRow = changedRow === 0 ? 1 : 0;
    const changedSelect = this.parent.querySelector(
      `#ts-row-${changedRow} select`
    );
    const otherSelect = this.parent.querySelector(
      `#ts-row-${otherRow} select`
    );
    const newDir = parseInt(changedSelect.value);
    const currentOther = parseInt(otherSelect.value);
    if (newDir === currentOther) {
      const fallback = [0, 1, 2, 3].find((d) => d !== newDir);
      this.buildRow(changedRow, newDir, fallback, this.currentData);
      this.buildRow(otherRow, fallback, newDir, this.currentData);
    } else {
      this.buildRow(changedRow, newDir, currentOther, this.currentData);
      this.buildRow(otherRow, currentOther, newDir, this.currentData);
    }
  }
  // Read the current state of both rows
  readRows() {
    return [0, 1].map((rowIndex) => {
      const select = this.parent.querySelector(
        `#ts-row-${rowIndex} select`
      );
      const checkDiv = this.parent.querySelector(
        `#ts-row-${rowIndex} .ts-checkboxes`
      );
      const dir = parseInt(select.value);
      let front = false, right = false, left = false;
      checkDiv.querySelectorAll("input[type=checkbox]").forEach((cb) => {
        if (cb.dataset.key === "front") front = cb.checked;
        if (cb.dataset.key === "right") right = cb.checked;
        if (cb.dataset.key === "left") left = cb.checked;
      });
      return { dir, value: bitsToValue(front, right, left) };
    });
  }
  // Apply the selected values to data and call the callback
  confirm() {
    const rows = this.readRows();
    let data = this.currentData;
    for (const d of [0, 1, 2, 3]) {
      if (d !== rows[0].dir && d !== rows[1].dir) {
        const result = setSide(data, d, 0);
        if (result !== 0) data = result;
      }
    }
    for (const { dir, value } of rows) {
      const result = setSide(data, dir, value);
      if (result !== 0) data = result;
    }
    this.close(data);
  }
  cancel() {
    this.close(null);
  }
  close(result) {
    this.parent.classList.add("hidden");
    if (this.callback) {
      this.callback(result);
      this.callback = null;
    }
  }
}
const turnSelector = new TurnSelector(
  document.getElementById("turnSelector")
);
const timeLeftDiv = document.getElementById("timeLeft");
const scoreDiv = document.getElementById("score");
const mousePosDiv = document.getElementById("mousePos");
const lightTurnDiv = document.getElementById("lightTurn");
const FAST_TIMES = 4;
class Game extends GameState {
  constructor() {
    super(...arguments);
    this.camera = { x: 0, y: 0, z: 20 };
    this.gameMap = null;
    this.carFrame = 0;
    this.runningCars = false;
    this.score = 0;
    this.lastMouseX = 0;
    this.lastScreenMouseX = NaN;
    this.lastScreenMouseY = NaN;
    this.lastMouseY = 0;
    this.running = true;
  }
  placeRoad(x, y) {
    const map = this.gameMap;
    if (!map)
      return;
    const neighbors = [
      map.getRoad(x + 1, y),
      map.getRoad(x, y - 1),
      map.getRoad(x - 1, y),
      map.getRoad(x, y + 1)
    ];
    const alive = [];
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
      {
        const dr = getDirectionDelta(rotateDirectionToRight(dir));
        const xr = xp + dr.x;
        const yr = yp + dr.y;
        roadfn.getType(map.getRoad(xr, yr));
        const dl = getDirectionDelta(rotateDirectionToLeft(dir));
        const xl = xp + dl.x;
        const yl = yp + dl.y;
        roadfn.getType(map.getRoad(xl, yl));
      }
      map.setRoad(x, y, road);
      return;
    }
    if (alive.length === 2) {
      map.setRoad(x, y, RoadType.ROAD);
      return;
    }
    map.setRoad(x, y, RoadType.ROAD);
  }
  test() {
    if (!window.DEBUG)
      return;
  }
  getMousePosition(mouseX, mouseY) {
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
  restart() {
    this.score = 0;
    this.carFrame = 0;
    this.runningCars = false;
    this.running = true;
    if (this.gameMap) {
      this.gameMap.reset();
    }
    document.getElementById("pause")?.togglePause(false);
    lightTurnDiv.textContent = "00";
  }
  handleHTML() {
    document.getElementById("gameView")?.classList.remove("hidden");
    const pause = document.getElementById("pause");
    if (pause) {
      pause.classList.add("inPause");
      pause.onclick = () => {
        this.runningCars = !this.runningCars;
        pause.togglePause(this.runningCars);
      };
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
  getRoadRotation(road, x, y) {
    const r = onRoadRotation(road);
    if (r === "target") {
      const t = this.gameMap.getTarget(x, y);
      if (t) {
        const list = t.directions.map((i) => `(${i.x}, ${i.y})`);
        const msg = list.join(", ");
        console.log(msg);
        alert("Targets: " + msg);
      }
      return null;
    }
    return r;
  }
  enter(data, input) {
    const mapConstructor = data;
    api.init(mapConstructor.size);
    const gmap = mapConstructor.create();
    this.gameMap = gmap;
    mapConstructor.setCamera(this.camera);
    const panel = produceStatsPanel();
    document.body.appendChild(panel);
    this.statsPanel = panel;
    this.test();
    this.handleHTML();
    const updateMouse = (x, y) => {
      mousePosDiv.innerText = `(${x.toFixed(1)},${y.toFixed(1)})`;
      this.lastMouseX = x;
      this.lastMouseY = y;
    };
    const runMode = (smode, x, y, moving, click, mouseScreenX, mouseScreenY) => {
      let roadtype = null;
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      if (moving && Math.floor(this.lastMouseX) === ix && Math.floor(this.lastMouseY) === iy) {
        return;
      }
      const applyEdit = (road, ix2, iy2) => {
        const next = onRoadEdit(road);
        if (next === null) {
          const rotated = this.getRoadRotation(road, ix2, iy2);
          if (rotated) {
            gmap.setRoad(ix2, iy2, rotated);
          }
          return;
        }
        if (next === "light") {
          this.setLight(ix2, iy2);
          return;
        }
        if (next === "direction") {
          this.setDirection(ix2, iy2);
          return;
        }
        gmap.setRoad(ix2, iy2, next);
      };
      if (click === "right") {
        applyEdit(gmap.getRoad(ix, iy), ix, iy);
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
        case HandSelection.ROTATE: {
          const road = this.getRoadRotation(
            gmap.getRoad(ix, iy),
            ix,
            iy
          );
          if (road !== null) {
            gmap.setRoad(ix, iy, road);
          }
          break;
        }
        case HandSelection.MOVE: {
          if (isNaN(this.lastScreenMouseX) || isNaN(this.lastScreenMouseY))
            break;
          const dx = (this.lastScreenMouseX - mouseScreenX) * (4 / this.camera.z);
          const dy = (this.lastScreenMouseY - mouseScreenY) * (4 / this.camera.z);
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
          if (click === "left") {
            const rotated = this.getRoadRotation(road, ix, iy);
            if (rotated) {
              gmap.setRoad(ix, iy, rotated);
            }
          } else {
            applyEdit(road, ix, iy);
          }
        } else {
          gmap.setRoad(ix, iy, roadtype);
        }
      }
      updateMouse(x, y);
    };
    const mouseUp = (clientX, clientY) => {
      this.lastScreenMouseX = NaN;
      this.lastScreenMouseY = NaN;
      const { x, y } = this.getMousePosition(clientX, clientY);
      updateMouse(x, y);
    };
    const mouseDown = (clientX, clientY, buttons, shiftKey) => {
      this.lastScreenMouseX = NaN;
      this.lastScreenMouseY = NaN;
      const { x, y } = this.getMousePosition(clientX, clientY);
      const leftDown = (buttons & 1) !== 0;
      const rightDown = (buttons & 2) !== 0;
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const smode = handSelector.getMode();
      if (leftDown) {
        if (shiftKey) {
          gmap.setRoad(ix, iy, RoadType.VOID);
        } else if (smode) {
          runMode(smode, ix, iy, false, "left", clientX, clientY);
        } else {
          this.placeRoad(ix, iy);
        }
      } else if (rightDown) {
        if (smode) {
          runMode(smode, ix, iy, false, "right", clientX, clientY);
        } else {
          const newRoad = this.getRoadRotation(
            gmap.getRoad(ix, iy),
            ix,
            iy
          );
          if (newRoad !== null)
            gmap.setRoad(ix, iy, newRoad);
        }
      }
      updateMouse(x, y);
    };
    const mouseMove = (clientX, clientY, buttons, shiftKey) => {
      let { x, y } = this.getMousePosition(clientX, clientY);
      const { leftDown, rightDown, middleDown } = (() => {
        if (buttons === "mobile") {
          return { leftDown: true, rightDown: false, middleDown: false };
        }
        const leftDown2 = (buttons & 1) !== 0;
        const rightDown2 = (buttons & 2) !== 0;
        const middleDown2 = (buttons & 4) !== 0;
        return { leftDown: leftDown2, rightDown: rightDown2, middleDown: middleDown2 };
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
      const leftClick = buttons === "mobile" ? "mobile" : "left";
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
    input.onMouseUp = (e) => mouseUp(e.clientX, e.clientY);
    input.onMouseDown = (e) => mouseDown(e.clientX, e.clientY, e.buttons, e.shiftKey);
    input.onMouseMove = (e) => mouseMove(e.clientX, e.clientY, e.buttons, e.shiftKey);
    input.onTouchStart = (e) => {
      this.lastScreenMouseX = NaN;
      this.lastScreenMouseY = NaN;
    };
    input.onTouchMove = (e) => mouseMove(e.touches[0].clientX, e.touches[0].clientY, "mobile", false);
    input.onScroll = (e) => {
      let { x, y } = this.getMousePosition(e.clientX, e.clientY);
      this.camera.z -= this.camera.z * e.deltaY / 1e3;
      updateMouse(x, y);
    };
    {
      handSelector.showPanel();
    }
  }
  runCars() {
    const gmap = this.gameMap;
    if (!gmap)
      return;
    gmap.apiSetupCars();
    gmap.updateCars();
    gmap.updateTargets();
    gmap.removeCarMarks();
    gmap.apiCleanupCars();
    gmap.moveCars();
    if (this.running) {
      this.carFrame++;
    }
  }
  placeKeyboardRoads(input) {
    const gmap = this.gameMap;
    if (!gmap)
      return;
    const x = Math.floor(this.lastMouseX);
    const y = Math.floor(this.lastMouseY);
    if (input.first("turnRight")) ;
    else if (input.first("turnLeft")) ;
    else if (input.first("yieldIns")) {
      const road = RoadType.YIELD;
      gmap.setRoad(x, y, road);
    } else if (input.first("light")) {
      const road = RoadType.LIGHT;
      gmap.setRoad(x, y, road);
    }
  }
  frame(game) {
    window.fastView = game.inputHandler.first("fastView");
    let times = game.inputHandler.press("fastView") ? FAST_TIMES : 1;
    this.placeKeyboardRoads(game.inputHandler);
    const cmap = this.gameMap;
    for (let i = 0; i < times; i++) {
      if (this.runningCars) {
        if (cmap) {
          cmap.runLightTick();
        }
        this.runCars();
        window.fastView = false;
      }
    }
    if (cmap && this.running && cmap.enteredCars >= cmap.carsToEnterGoal) {
      this.running = false;
      const msg = "Score: " + this.formatTime();
      alert(msg);
      console.log(msg);
    }
    return null;
  }
  setLight(x, y) {
    const gmap = this.gameMap;
    if (!gmap)
      return;
    const road = gmap.getRoad(x, y);
    if (roadfn.getType(road) === RoadType.LIGHT) {
      lightSelector.take(road, (data) => {
        if (data !== null) {
          console.log("set", data | RoadType.LIGHT);
          gmap.setRoad(x, y, data | RoadType.LIGHT);
        }
      });
    }
  }
  setDirection(x, y) {
    const gmap = this.gameMap;
    if (!gmap)
      return;
    const road = gmap.getRoad(x, y);
    if (roadfn.getType(road) === RoadType.DIRECTION) {
      turnSelector.take(road, (data) => {
        if (data) {
          gmap.setRoad(x, y, data | RoadType.DIRECTION);
        }
      });
    }
  }
  formatTime() {
    const time = this.carFrame;
    const totalSeconds = Math.floor(time / 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(time % 60 / 6);
    return `${minutes.toString().padStart(1, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds}`;
  }
  drawStats(ctx) {
    const gmap = this.gameMap;
    if (!gmap) {
      timeLeftDiv.innerText = "0:00.0";
      scoreDiv.innerText = "0";
      return;
    }
    const left = gmap.carsToEnterGoal - gmap.enteredCars;
    scoreDiv.innerText = left.toString();
    timeLeftDiv.innerText = this.formatTime();
    lightTurnDiv.textContent = gmap.getLightTick().toString().padStart(2, "0");
  }
  draw(args) {
    const gmap = this.gameMap;
    if (!gmap)
      return;
    {
      args.ctx.fillStyle = "#261f19";
      args.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
    args.followCamera();
    gmap.drawGrid(args.ctx, args.imageLoader);
    gmap.drawCars(args.ctx, args.imageLoader);
    args.unfollowCamera();
    this.drawStats(args.ctx);
  }
  exit() {
    document.getElementById("gameView")?.classList.add("hidden");
    if (this.statsPanel) {
      this.statsPanel.remove();
    }
    api.cleanup();
    return { score: this.score };
  }
  getCamera() {
    return this.camera;
  }
}
const CAR_SIZE = 0.9;
const CAR_LINE = 0.6;
let nextCarId = 0;
function getDirectionTurn(origin, target) {
  const diff = (target - origin + 4) % 4;
  if (diff == 0 || diff == 2) return "front";
  if (diff == 1) return "turn-left";
  return "turn-right";
}
class Car {
  constructor(x, y, target, direction, pathfindingId, color) {
    this.state = "front";
    this.speedLimit = 0.7;
    this.realSpeed = this.speedLimit / 6;
    this.publicSpeed = 0;
    this.frameLastPositionUpdate = -1;
    this.id = nextCarId++;
    this.step = 0;
    this.nextX = -1;
    this.nextY = -1;
    this.x = x;
    this.y = y;
    this.target = target;
    this.direction = direction;
    this.color = color;
    this.pathId = pathfindingId;
    this.nextDir = direction;
  }
  getCoords() {
    switch (this.state) {
      case "front": {
        const a = Math.PI / 2 * this.direction;
        switch (this.direction) {
          case Direction.RIGHT:
            return {
              x: this.x + this.step,
              y: this.y + 0.5,
              a
            };
          case Direction.LEFT:
            return {
              x: this.x + 1 - this.step,
              y: this.y + 0.5,
              a
            };
          case Direction.UP:
            return {
              x: this.x + 0.5,
              y: this.y + 1 - this.step,
              a
            };
          case Direction.DOWN:
            return {
              x: this.x + 0.5,
              y: this.y + this.step,
              a
            };
        }
        break;
      }
      case "turn-right": {
        let { x, y } = getAttach(this.direction, true, this.step);
        const a = Math.PI / 2 * (this.direction - this.step);
        x += this.x;
        y += this.y;
        return { x, y, a };
      }
      case "turn-left": {
        let { x, y } = getAttach(this.direction, true, this.step);
        const a = Math.PI / 2 * (this.direction + this.step);
        x += this.x;
        y += this.y;
        return { x, y, a };
      }
    }
    return { x: 0, y: 0, a: 0 };
  }
  draw(ctx, iloader) {
    const { x, y, a } = this.getCoords();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-a);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      iloader.get("car", this.color),
      -CAR_SIZE / 2,
      -CAR_LINE / 2,
      CAR_SIZE,
      CAR_LINE
    );
    ctx.restore();
  }
  behave(speedLimit, acceleration) {
    if (acceleration < 0) {
      this.realSpeed += acceleration;
      if (this.realSpeed < 0) {
        this.realSpeed = 0;
      }
    } else if (acceleration > 0) {
      this.realSpeed;
      this.realSpeed += acceleration;
      if (this.realSpeed > speedLimit) {
        this.realSpeed = speedLimit;
      }
    }
    this.speedLimit = speedLimit;
  }
  move() {
    this.publicSpeed = this.realSpeed;
    this.step += this.realSpeed;
    if (this.step < 1) {
      return 0;
    }
    this.step -= 1;
    switch (this.state) {
      case "front":
        break;
      case "turn-right":
        this.direction = rotateDirectionToRight(this.direction);
        break;
      case "turn-left":
        this.direction = rotateDirectionToLeft(this.direction);
        break;
    }
    const { x, y } = getDirectionDelta(this.direction);
    this.x += x;
    this.y += y;
    if (this.x === this.nextX && this.y === this.nextY) {
      return this.appendSubTarget();
    }
    this.state = "front";
    return 0;
  }
  appendSubTarget() {
    if (this.nextDir < 0) {
      this.removePath();
      this.target.absorbeCar();
      return this.target.isFinal() ? 2 : 1;
    }
    const { x, y, dir } = api.stepCar(this.pathId);
    this.state = getDirectionTurn(
      this.direction,
      this.nextDir
    );
    this.nextX = x;
    this.nextY = y;
    this.nextDir = dir;
    return 0;
  }
  getSpeedLimit() {
    return this.speedLimit;
  }
  getSpeed() {
    return this.publicSpeed;
  }
  getDirection() {
    return this.direction;
  }
  removePath() {
    api.removePath(this.pathId);
  }
}
const _GameMap = class _GameMap {
  constructor(size) {
    this.carsToEnterGoal = 0;
    this.enteredCars = 0;
    this.cars = new Array();
    this.targets = new Array();
    this.lightTick = 0;
    this.lightTickCooldown = 0;
    this.size = size;
    this.grid = new Uint16Array(size * size);
  }
  getIdx(x, y) {
    return y * this.size + x;
  }
  getPos(idx) {
    return {
      x: idx % this.size,
      y: Math.floor(idx / this.size)
    };
  }
  getRoad(x, y) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size)
      return 0;
    const road = this.grid[this.getIdx(x, y)];
    return road;
  }
  setRoad(x, y, road) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size)
      return;
    const currentRoad = this.getRoad(x, y);
    const currentRoadType = roadfn.getType(currentRoad);
    switch (currentRoadType) {
      case RoadType.TARGET:
        return;
      case RoadType.VOID:
        if (currentRoad & 1 << 3)
          return;
    }
    const idx = this.getIdx(x, y);
    this.grid[idx] = road;
    api.setRoad(idx, road);
  }
  forceRoad(x, y, road) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size)
      return;
    const idx = this.getIdx(x, y);
    this.grid[idx] = road;
    api.setRoad(idx, road);
  }
  drawGrid(ctx, iloader) {
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, this.size, this.size);
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const obj = this.getRoad(x, y);
        if (obj === 0)
          continue;
        ctx.save();
        ctx.translate(x, y);
        drawRoad(ctx, iloader, obj, this.lightTick);
        ctx.restore();
      }
    }
  }
  drawCars(ctx, iloader) {
    for (const car of this.iterateCars()) {
      car.draw(ctx, iloader);
    }
  }
  *iterateCars() {
    for (const i of this.cars) {
      yield i;
    }
  }
  static mapKey(x, y) {
    const bx = BigInt(x >>> 0);
    const by = BigInt(y >>> 0);
    return bx << 32n | by;
  }
  removeCarMarks() {
    for (const car of this.cars) {
      const idx = this.getIdx(car.x, car.y);
      this.grid[idx] &= -32769;
    }
  }
  moveCars() {
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i];
      const code = car.move();
      if (code >= 1) {
        if (code >= 2) {
          this.enteredCars++;
        }
        this.cars.splice(i, 1);
        continue;
      }
      const idx = this.getIdx(car.x, car.y);
      if (this.grid[idx] & 1 << 15) {
        throw new Error(`Collision detected at (${car.x}, ${car.y})`);
      }
      this.grid[idx] |= 1 << 15;
    }
  }
  addTarget(target) {
    this.targets.push(target);
  }
  getTarget(x, y) {
    for (const target of this.targets) {
      if (target.x === x && target.y === y) {
        return target;
      }
    }
    return null;
  }
  runLightTick() {
    this.lightTickCooldown++;
    if (this.lightTickCooldown >= _GameMap.LIGHT_COULDOWN) {
      this.lightTickCooldown -= _GameMap.LIGHT_COULDOWN;
      this.lightTick = (this.lightTick + 1) % 8;
    }
  }
  searchTargetSpawner(srcX, srcY, dstX, dstY) {
    const DIRS = [
      Direction.RIGHT,
      Direction.UP,
      Direction.LEFT,
      Direction.DOWN
    ];
    const manhattan = (x, y) => Math.abs(x - dstX) + Math.abs(y - dstY);
    const candidates = DIRS.map((dir) => {
      const delta = getDirectionDelta(dir);
      const sx = srcX + delta.x;
      const sy = srcY + delta.y;
      return {
        dir,
        sx,
        sy,
        dist: manhattan(sx, sy)
      };
    }).sort((a, b2) => a.dist - b2.dist);
    for (const c of candidates) {
      const road = this.getRoad(c.sx, c.sy);
      if (roadfn.getType(road) !== RoadType.ROAD || (road & 1 << 15) !== 0) {
        continue;
      }
      const pathId = api.addPath(
        c.dir,
        c.sx,
        c.sy,
        dstX,
        dstY
      );
      if (pathId >= 0) {
        return {
          sx: c.sx,
          sy: c.sy,
          pathId,
          dir: c.dir
        };
      }
    }
    return null;
  }
  updateTargets() {
    for (const target of this.targets) {
      if (!target.desiresSpawn())
        continue;
      const dst = target.spawn();
      if (dst === null)
        continue;
      const spawner = this.searchTargetSpawner(
        target.x,
        target.y,
        dst.x,
        dst.y
      );
      if (spawner === null) {
        target.absorbeCar();
        continue;
      }
      const car = new Car(
        spawner.sx,
        spawner.sy,
        dst,
        spawner.dir,
        spawner.pathId,
        target.color
      );
      if (car.appendSubTarget() >= 2) {
        throw new Error("Car spawned and immediately reached its target");
      }
      this.cars.push(car);
    }
  }
  apiSetupCars() {
    api.setupCars(this.cars);
  }
  apiCleanupCars() {
    api.cleanupCars();
  }
  updateCars() {
    api.getDangers(this.cars, this.lightTick);
  }
  reset() {
    for (const car of this.cars) {
      car.removePath();
      this.grid[this.getIdx(car.x, car.y)] &= -32769;
    }
    this.cars.length = 0;
    for (const target of this.targets) {
      target.reset();
    }
    this.lightTick = 0;
    this.lightTickCooldown = 0;
    this.enteredCars = 0;
  }
  getLightTick() {
    return this.lightTick;
  }
};
_GameMap.LIGHT_COULDOWN = 75;
let GameMap = _GameMap;
class Target {
  constructor(x, y, spawnCount, spawnDelay, color) {
    this.directions = [];
    this.step = 0;
    this.x = x;
    this.y = y;
    this.color = color;
    this.spawnCount = spawnCount;
    this.spawnDelay = spawnDelay;
    this.spawnCooldown = spawnDelay;
    this.spawnLeft = spawnCount;
  }
  desiresSpawn() {
    if (this.spawnLeft <= 0)
      return false;
    this.spawnCooldown--;
    if (this.spawnCooldown > 0)
      return false;
    return true;
  }
  spawn() {
    if (this.isFinal())
      return null;
    this.spawnCooldown = this.spawnDelay;
    this.spawnLeft--;
    return this.makeSpawn();
  }
  absorbeCar() {
    this.spawnLeft++;
  }
  makeSpawn() {
    if (this.directions.length <= 0)
      return null;
    const p = this.directions[this.step];
    this.step++;
    if (this.step >= this.directions.length) {
      this.step -= this.directions.length;
    }
    return p;
  }
  reset() {
    this.step = 0;
    this.spawnLeft = this.spawnCount;
    this.spawnCooldown = this.spawnDelay;
  }
  isFinal() {
    return this.directions.length <= 0;
  }
}
class MapConstructor {
  constructor(data) {
    this.roads = [];
    this.targets = [];
    this.size = 32;
    if (data) {
      this.appendJSON(data);
    }
  }
  create() {
    const cmap = new GameMap(this.size);
    for (const road of this.roads) {
      cmap.setRoad(road.x, road.y, road.data);
    }
    const targets = /* @__PURE__ */ new Map();
    for (const i of this.targets) {
      targets.set(i.label, new Target(
        i.x,
        i.y,
        i.spawnCount,
        i.spawnDelay,
        i.color
      ));
      cmap.carsToEnterGoal += i.spawnCount;
    }
    for (const i of this.targets) {
      const t = targets.get(i.label);
      t.directions = i.targets.map((label) => {
        const value = targets.get(label);
        if (!value) {
          console.log(label);
          throw new Error("Cannot find label: '" + label + "'");
        }
        return value;
      });
      let symbol = 22;
      if (i.label.length === 2) {
        const c = i.label.charCodeAt(1);
        if (c >= 65 && c <= 90) {
          symbol = c - 65;
        } else if (c >= 97 && c <= 122) {
          symbol = c - 97;
        } else if (c >= 48 && c <= 53) {
          symbol = 26 + (c - 48);
        } else if (c === 43) {
          symbol = 24;
        } else if (c === 45) {
          symbol = 23;
        } else if (c === 95) {
          symbol = 22;
        }
      }
      cmap.addTarget(t);
      cmap.setRoad(
        t.x,
        t.y,
        RoadType.TARGET | i.color << 4 | symbol << 7
      );
    }
    const voidRoad = 1 << 3;
    const n = this.size - 1;
    for (let i = 0; i < n; i++) {
      cmap.setRoad(i, 0, voidRoad);
      cmap.setRoad(i, n, voidRoad);
      cmap.setRoad(0, i, voidRoad);
      cmap.setRoad(n, i, voidRoad);
    }
    cmap.setRoad(n, n, voidRoad);
    return cmap;
  }
  appendJSON(data) {
    const size = data.size;
    if (size !== void 0)
      this.size = size;
    const roads = data.roads;
    if (roads !== void 0)
      this.roads.push(...roads);
    const targets = data.targets;
    if (targets !== void 0)
      this.targets.push(...targets);
    for (const i of this.targets) {
      if (i.color === void 0) {
        const firstChar = i.label[0]?.toLowerCase();
        switch (firstChar) {
          case "r":
            i.color = CarColor.RED;
            break;
          case "y":
            i.color = CarColor.YELLOW;
            break;
          case "b":
            i.color = CarColor.BLUE;
            break;
          case "g":
            i.color = CarColor.GREEN;
            break;
          case "c":
            i.color = CarColor.CYAN;
            break;
          case "p":
            i.color = CarColor.PINK;
            break;
          case "w":
            i.color = CarColor.WHITE;
            break;
          case "x":
            i.color = CarColor.GRAY;
            break;
          default:
            throw new Error("Cannot deduce color from " + data.label);
        }
      }
    }
  }
  setCamera(camera) {
    camera.x = this.size / 2;
    camera.y = this.size / 2;
    camera.z = this.size * 0.8;
  }
}
class LevelsState extends GameState {
  constructor() {
    super();
  }
  enter(data, input) {
    input.onMouseUp = (e) => {
    };
    input.onMouseDown = (e) => {
    };
    input.onMouseMove = (e) => {
    };
    input.onScroll = (e) => {
    };
    input.onTouchStart = (e) => {
    };
    input.onTouchEnd = (e) => {
    };
    input.onTouchMove = (e) => {
    };
  }
  frame(game) {
    return new Game();
  }
  draw(args) {
  }
  exit() {
    if (window.DEBUG) {
      return LEVELS[0];
    } else {
      const v = prompt(`Level? [1 to ${LEVELS.length - 1}]`);
      if (v !== null)
        return LEVELS[+v];
    }
  }
  getCamera() {
    return null;
  }
}
function b(x, y, data = 8) {
  return { x, y, data };
}
function rect(x, y, w, h, data = 8) {
  const arr = [];
  for (let i = x; i < x + w; i++) {
    for (let j = y; j < y + h; j++) {
      arr.push(b(i, j, data));
    }
  }
  return arr;
}
const LEVELS = [
  // Debug
  new MapConstructor({
    size: 32,
    roads: [
      ...rect(6, 1, 2, 1, 1),
      ...rect(8, 2, 1, 6, 1),
      ...rect(8, 8, 5, 1, 1),
      ...rect(1, 6, 12, 1, 1),
      { x: 8, y: 1, data: 3 | 2 << 4 | 3 << 12 },
      { x: 8, y: 5, data: 4 | 3 << 6 },
      { x: 7, y: 6, data: 1365 }
    ],
    targets: [
      {
        label: "r+",
        x: 6,
        y: 1,
        spawnCount: 50,
        spawnDelay: 10,
        color: CarColor.RED,
        targets: ["rA"]
      },
      {
        label: "rA",
        x: 8,
        y: 8,
        spawnCount: 0,
        spawnDelay: 15,
        color: CarColor.RED,
        targets: ["r-"]
      },
      {
        label: "r-",
        x: 13,
        y: 8,
        spawnCount: 0,
        spawnDelay: 15,
        color: CarColor.RED,
        targets: []
      },
      {
        label: "y+",
        x: 1,
        y: 6,
        spawnCount: 50,
        spawnDelay: 30,
        color: CarColor.YELLOW,
        targets: ["y-"]
      },
      {
        label: "y-",
        x: 13,
        y: 6,
        spawnCount: 0,
        spawnDelay: 1,
        color: CarColor.YELLOW,
        targets: []
      }
    ]
  }),
  // Level 1
  new MapConstructor({
    size: 32,
    roads: [],
    targets: [
      {
        label: "rA",
        x: 1,
        y: 15,
        spawnCount: 30,
        spawnDelay: 30,
        targets: ["rB"]
      },
      {
        label: "rB",
        x: 30,
        y: 15,
        spawnCount: 0,
        spawnDelay: 20,
        targets: ["rC"]
      },
      {
        label: "rC",
        x: 15,
        y: 20,
        spawnCount: 0,
        spawnDelay: 60,
        targets: []
      },
      {
        label: "c+",
        x: 16,
        y: 1,
        spawnCount: 10,
        spawnDelay: 60,
        targets: ["c-"]
      },
      {
        label: "c-",
        x: 16,
        y: 30,
        spawnCount: 0,
        spawnDelay: 20,
        targets: []
      }
    ]
  }),
  // Level 2
  new MapConstructor({
    size: 32,
    roads: [],
    targets: [
      {
        label: "rA",
        x: 1,
        y: 20,
        spawnCount: 33,
        spawnDelay: 30,
        targets: ["rB"]
      },
      {
        label: "rB",
        x: 12,
        y: 20,
        spawnCount: 0,
        spawnDelay: 20,
        targets: ["rC"]
      },
      {
        label: "rC",
        x: 20,
        y: 20,
        spawnCount: 5,
        spawnDelay: 20,
        targets: ["rD"]
      },
      {
        label: "rD",
        x: 30,
        y: 20,
        spawnCount: 0,
        spawnDelay: 20,
        targets: ["rE"]
      },
      {
        label: "rE",
        x: 30,
        y: 10,
        spawnCount: 5,
        spawnDelay: 20,
        targets: ["rF"]
      },
      {
        label: "rF",
        x: 20,
        y: 10,
        spawnCount: 0,
        spawnDelay: 20,
        targets: ["rG"]
      },
      {
        label: "rG",
        x: 12,
        y: 10,
        spawnCount: 0,
        spawnDelay: 20,
        targets: ["r-"]
      },
      {
        label: "r-",
        x: 1,
        y: 10,
        spawnCount: 0,
        spawnDelay: 300,
        targets: []
      },
      {
        label: "c+",
        x: 16,
        y: 1,
        spawnCount: 18,
        spawnDelay: 60,
        targets: ["c-"]
      },
      {
        label: "c-",
        x: 16,
        y: 30,
        spawnCount: 0,
        spawnDelay: 20,
        targets: []
      },
      {
        label: "g0",
        x: 6,
        y: 6,
        spawnCount: 19,
        spawnDelay: 90,
        targets: ["g1"]
      },
      {
        label: "g1",
        x: 6,
        y: 24,
        spawnCount: 0,
        spawnDelay: 60,
        targets: ["g2"]
      },
      {
        label: "g2",
        x: 24,
        y: 24,
        spawnCount: 2,
        spawnDelay: 60,
        targets: ["g-"]
      },
      {
        label: "g-",
        x: 24,
        y: 6,
        spawnCount: 0,
        spawnDelay: 60,
        targets: []
      }
    ]
  }),
  // Level 3
  new MapConstructor({
    size: 32,
    roads: [],
    targets: [
      {
        label: "r+",
        x: 1,
        y: 16,
        spawnCount: 40,
        spawnDelay: 20,
        targets: ["rA", "rB", "rA", "rB", "rA", "rB", "rC", "r-"]
      },
      {
        label: "rA",
        x: 10,
        y: 10,
        spawnCount: 0,
        spawnDelay: 5,
        targets: ["r-"]
      },
      {
        label: "rB",
        x: 10,
        y: 22,
        spawnCount: 0,
        spawnDelay: 5,
        targets: ["rI", "r-"]
      },
      {
        label: "rC",
        x: 10,
        y: 30,
        spawnCount: 0,
        spawnDelay: 5,
        targets: ["r-"]
      },
      {
        label: "rI",
        x: 20,
        y: 5,
        spawnCount: 0,
        spawnDelay: 5,
        targets: ["r-"]
      },
      {
        label: "r-",
        x: 30,
        y: 10,
        spawnCount: 0,
        spawnDelay: 30,
        targets: []
      }
    ]
  })
];
const GAME_COLORS = [
  "#ac3232",
  "#fbf236",
  "#5b6ee1",
  "#6abe30",
  "#5fcde4",
  "#d77bba",
  "#f0f8ed",
  "#6e6e6e"
];
function setElementAsBackground(element, div) {
  if (element instanceof HTMLCanvasElement) {
    element.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      div.style.backgroundImage = `url(${url})`;
    });
  } else {
    div.style.backgroundImage = `url(${element.src})`;
  }
}
class GameHandler {
  constructor(keyboardMode, mouseEventTarget, keydownEventTarget) {
    this.imgLoader = new ImageLoader(window.IMG_ROOT_PATH);
    this.inputHandler = new InputHandler(keyboardMode);
    this.inputHandler.startKeydownListeners(keydownEventTarget);
    this.inputHandler.startMouseListeners(mouseEventTarget);
    this.state = new LevelsState();
    this.state.enter(void 0, this.inputHandler);
    this.imgLoader.load({
      resume: "assets/resume.png",
      pause: "assets/pause.png",
      restart: "assets/restart.png"
    }).then(() => {
      const pauseElement = document.getElementById("pause");
      setElementAsBackground(this.imgLoader.get("resume"), pauseElement);
      pauseElement.togglePause = (pause) => {
        if (pause) {
          pauseElement.classList.add("inPause");
          setElementAsBackground(this.imgLoader.get("pause"), pauseElement);
        } else {
          pauseElement.classList.remove("inPause");
          setElementAsBackground(this.imgLoader.get("resume"), pauseElement);
        }
      };
      setElementAsBackground(
        this.imgLoader.get("restart"),
        document.getElementById("restart")
      );
    });
    this.imgLoader.load({
      turn_turn: "assets/turn/turn.png",
      turn_front: "assets/turn/front.png",
      turn_both: "assets/turn/both.png",
      turn_all: "assets/turn/all.png",
      turn_split: "assets/turn/split.png",
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
      icon_rotate: "assets/icons/rotate.png"
    }).then(() => {
      for (const i of Object.values(HandSelection)) {
        if (typeof i !== "number") {
          continue;
        }
        setElementAsBackground(
          this.imgLoader.get(HAND_SELECTION_ICONS[i]),
          handSelector.getDiv(i)
        );
      }
    });
    this.imgLoader.load({
      zoomInc: "assets/icons/zoomInc.png",
      zoomDec: "assets/icons/zoomDec.png"
    }).then(() => {
      setElementAsBackground(
        this.imgLoader.get("zoomInc"),
        document.getElementById("zoomInc")
      );
      setElementAsBackground(
        this.imgLoader.get("zoomDec"),
        document.getElementById("zoomDec")
      );
    });
    this.imgLoader.loadWithColors(
      "#ac3232",
      GAME_COLORS,
      {
        consumers: "assets/consumers.png",
        spawner: "assets/spawner.png",
        car: "assets/car.png"
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
  gameDraw(ctx, canvasWidth, canvasHeight, drawMethod) {
    const scaleX = canvasWidth / GAME_WIDTH;
    const scaleY = canvasHeight / GAME_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (canvasWidth - GAME_WIDTH * scale) / 2;
    const offsetY = (canvasHeight - GAME_HEIGHT * scale) / 2;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
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
    };
    const unfollowCamera = () => {
      ctx.restore();
    };
    drawMethod(ctx, followCamera, unfollowCamera);
    ctx.restore();
    ctx.fillStyle = "black";
    if (offsetY > 0) ctx.fillRect(0, 0, canvasWidth, offsetY);
    if (offsetY > 0) ctx.fillRect(0, canvasHeight - offsetY, canvasWidth, offsetY);
    if (offsetX > 0) ctx.fillRect(0, 0, offsetX, canvasHeight);
    if (offsetX > 0) ctx.fillRect(canvasWidth - offsetX, 0, offsetX, canvasHeight);
  }
  drawMethod(ctx, followCamera, unfollowCamera) {
    this.state.draw({ ctx, imageLoader: this.imgLoader, followCamera, unfollowCamera });
  }
}
window.game = null;
window.running = false;
window.useRequestAnimationFrame = true;
window.startGame = startGame;
function startGame() {
  const FPS_FREQUENCY = 4;
  const EXCESS_COUNT = 70;
  const EXCESS_LIM = 4 * FPS_FREQUENCY;
  let countedFps = 0;
  let excessCount = 0;
  setInterval(() => {
    const e = document.getElementById("fps");
    const count = countedFps * FPS_FREQUENCY;
    if (excessCount >= 0) {
      if (count > EXCESS_COUNT) {
        excessCount++;
        if (excessCount >= EXCESS_LIM) {
          window.useRequestAnimationFrame = false;
          excessCount = -1;
        }
      } else {
        excessCount = 0;
      }
    }
    if (e) {
      let text = count + "fps";
      if (!window.useRequestAnimationFrame) {
        text += " (async)";
      }
      e.textContent = text;
    }
    countedFps = 0;
  }, 1e3 / FPS_FREQUENCY);
  const canvas = document.getElementById("gameCanvas");
  canvas.oncontextmenu = (e) => {
    e.preventDefault();
  };
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  const keyboardMode = localStorage.getItem("keyboardMode");
  let realKeyboardMode;
  if (keyboardMode !== "zqsd" && keyboardMode !== "wasd") {
    realKeyboardMode = "wasd";
  } else {
    realKeyboardMode = keyboardMode;
  }
  const canvasContext = canvas.getContext("2d");
  const game = new GameHandler(
    realKeyboardMode,
    canvas,
    document
  );
  function runGameLoop() {
    game.gameLogic();
    game.gameDraw(
      canvasContext,
      canvas.width,
      canvas.height,
      (ctx, followCamera, unfollowCamera) => {
        game.drawMethod(ctx, followCamera, unfollowCamera);
      }
    );
    if (window.running) {
      if (window.useRequestAnimationFrame) {
        requestAnimationFrame(runGameLoop);
      } else if (window.SLOW_FPS) {
        setTimeout(runGameLoop, 1e3 / 10);
      } else {
        setTimeout(runGameLoop, 1e3 / 60);
      }
    }
    countedFps++;
  }
  window.game = game;
  window.running = true;
  runGameLoop();
}
