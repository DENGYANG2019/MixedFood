/*
  Tetris implemented with HTML Canvas
  - 10x20 playfield
  - 7-bag randomizer
  - Soft/Hard drop, rotate, pause/reset
  - Scoring and level progression
*/

/** Utility functions */
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Constants */
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // px
const CANVAS_WIDTH = COLS * BLOCK_SIZE;
const CANVAS_HEIGHT = ROWS * BLOCK_SIZE;

/** Colors per tetromino type */
const COLOR_BY_TYPE = {
  I: '#5bd1ff',
  J: '#6b8cff',
  L: '#f7a44a',
  O: '#f2e94e',
  S: '#6cef8a',
  T: '#c77dff',
  Z: '#ff6b6b',
  GHOST: 'rgba(255,255,255,0.2)'
};

/** Scoring */
const SCORE_FOR_LINES = { 1: 100, 2: 300, 3: 500, 4: 800 };
const SOFT_DROP_POINT_PER_CELL = 1;
const HARD_DROP_POINT_PER_CELL = 2;

/** Level speed (ms per cell drop). Faster as level increases */
const baseDropMs = 1000;
const levelToDropMs = (level) => Math.max(60, Math.floor(baseDropMs * Math.pow(0.85, level - 1)));

/** Shapes defined as rotation states (each is an array of [x,y] relative blocks) */
const SHAPES = {
  I: [
    [ [ -1, 0 ], [ 0, 0 ], [ 1, 0 ], [ 2, 0 ] ], // 0 deg
    [ [ 1, -1 ], [ 1, 0 ], [ 1, 1 ], [ 1, 2 ] ], // 90
    [ [ -1, 1 ], [ 0, 1 ], [ 1, 1 ], [ 2, 1 ] ], // 180
    [ [ 0, -1 ], [ 0, 0 ], [ 0, 1 ], [ 0, 2 ] ]  // 270
  ],
  J: [
    [ [ -1, -1 ], [ -1, 0 ], [ 0, 0 ], [ 1, 0 ] ],
    [ [ 0, -1 ], [ 1, -1 ], [ 0, 0 ], [ 0, 1 ] ],
    [ [ -1, 0 ], [ 0, 0 ], [ 1, 0 ], [ 1, 1 ] ],
    [ [ 0, -1 ], [ 0, 0 ], [ -1, 1 ], [ 0, 1 ] ]
  ],
  L: [
    [ [ 1, -1 ], [ -1, 0 ], [ 0, 0 ], [ 1, 0 ] ],
    [ [ 0, -1 ], [ 0, 0 ], [ 0, 1 ], [ 1, 1 ] ],
    [ [ -1, 0 ], [ 0, 0 ], [ 1, 0 ], [ -1, 1 ] ],
    [ [ -1, -1 ], [ 0, -1 ], [ 0, 0 ], [ 0, 1 ] ]
  ],
  O: [
    [ [ 0, -1 ], [ 1, -1 ], [ 0, 0 ], [ 1, 0 ] ],
    [ [ 0, -1 ], [ 1, -1 ], [ 0, 0 ], [ 1, 0 ] ],
    [ [ 0, -1 ], [ 1, -1 ], [ 0, 0 ], [ 1, 0 ] ],
    [ [ 0, -1 ], [ 1, -1 ], [ 0, 0 ], [ 1, 0 ] ]
  ],
  S: [
    [ [ 0, -1 ], [ 1, -1 ], [ -1, 0 ], [ 0, 0 ] ],
    [ [ 0, -1 ], [ 0, 0 ], [ 1, 0 ], [ 1, 1 ] ],
    [ [ 0, 0 ], [ 1, 0 ], [ -1, 1 ], [ 0, 1 ] ],
    [ [ -1, -1 ], [ -1, 0 ], [ 0, 0 ], [ 0, 1 ] ]
  ],
  T: [
    [ [ 0, -1 ], [ -1, 0 ], [ 0, 0 ], [ 1, 0 ] ],
    [ [ 0, -1 ], [ 0, 0 ], [ 1, 0 ], [ 0, 1 ] ],
    [ [ -1, 0 ], [ 0, 0 ], [ 1, 0 ], [ 0, 1 ] ],
    [ [ 0, -1 ], [ -1, 0 ], [ 0, 0 ], [ 0, 1 ] ]
  ],
  Z: [
    [ [ -1, -1 ], [ 0, -1 ], [ 0, 0 ], [ 1, 0 ] ],
    [ [ 1, -1 ], [ 0, 0 ], [ 1, 0 ], [ 0, 1 ] ],
    [ [ -1, 0 ], [ 0, 0 ], [ 0, 1 ], [ 1, 1 ] ],
    [ [ 0, -1 ], [ -1, 0 ], [ 0, 0 ], [ -1, 1 ] ]
  ]
};

/** Kick tests for basic wall-kick behavior */
const KICK_TESTS = [
  [0, 0], [1, 0], [-1, 0], [2, 0], [-2, 0], [0, -1]
];

/** Game state */
let canvas, ctx;
let nextCanvases = [];
let nextCtxs = [];

let board; // ROWS x COLS, each cell null or { type, color }
let activePiece = null; // { type, rotation, x, y }
let holdLocked = false; // (not used now, reserved)
let nextQueue = [];
let bag = [];

let score = 0;
let linesClearedTotal = 0;
let level = 1;

let dropTimerMs = 0;
let dropIntervalMs = levelToDropMs(1);
let lastTime = 0;
let isRunning = false;
let isGameOver = false;

/** Initialization */
function setup() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  // Ensure canvas size constants match attributes
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  for (let i = 0; i < 3; i++) {
    const c = document.getElementById(`next${i}`);
    nextCanvases[i] = c;
    nextCtxs[i] = c.getContext('2d');
    // crisp drawing
    c.width = 96; c.height = 96;
  }

  bindUI();
  resetGame();
  draw();
}

function bindUI() {
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('pauseBtn').addEventListener('click', togglePause);
  document.getElementById('resetBtn').addEventListener('click', resetGame);

  window.addEventListener('keydown', (e) => {
    if (isGameOver) return;

    if (e.code === 'KeyP') {
      togglePause();
      e.preventDefault();
      return;
    }
    if (e.code === 'KeyR') {
      resetGame();
      e.preventDefault();
      return;
    }
    if (!isRunning) return;

    switch (e.code) {
      case 'ArrowLeft':
        tryMove(-1, 0);
        e.preventDefault();
        break;
      case 'ArrowRight':
        tryMove(1, 0);
        e.preventDefault();
        break;
      case 'ArrowDown':
        softDrop();
        e.preventDefault();
        break;
      case 'ArrowUp':
        rotate(+1);
        e.preventDefault();
        break;
      case 'Space':
        hardDrop();
        e.preventDefault();
        break;
      default:
        break;
    }
  });
}

/** Game control */
function startGame() {
  if (isGameOver) resetGame();
  if (!isRunning) {
    isRunning = true;
    hideOverlay();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
}

function togglePause() {
  if (isGameOver) return;
  isRunning = !isRunning;
  if (isRunning) {
    hideOverlay();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  } else {
    showOverlay('一時停止中 (Pで再開)');
  }
}

function resetGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  activePiece = null;
  nextQueue = [];
  bag = [];
  score = 0;
  linesClearedTotal = 0;
  level = 1;
  dropTimerMs = 0;
  dropIntervalMs = levelToDropMs(level);
  isGameOver = false;
  isRunning = false;
  refillQueue();
  spawnPiece();
  updateSidebar();
  drawNextPreview();
  showOverlay('スタートを押してください');
}

/** Piece generation */
function refillQueue() {
  while (nextQueue.length < 5) {
    if (bag.length === 0) bag = shuffle(['I','J','L','O','S','T','Z']);
    nextQueue.push(bag.pop());
  }
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function spawnPiece() {
  const type = nextQueue.shift();
  refillQueue();
  const rotation = 0;
  const x = 4; // spawn near center
  const y = 1; // a bit down so O fits
  activePiece = { type, rotation, x, y };
  if (collides(activePiece, 0, 0, rotation)) {
    // immediate collision -> game over
    setGameOver();
  }
  drawNextPreview();
}

/** Collision & movement */
function getBlocks(piece) {
  const shape = SHAPES[piece.type][piece.rotation];
  return shape.map(([dx, dy]) => ({ x: piece.x + dx, y: piece.y + dy }));
}

function collides(piece, dx = 0, dy = 0, newRotation = piece.rotation) {
  const shape = SHAPES[piece.type][newRotation];
  for (const [sx, sy] of shape) {
    const x = piece.x + sx + dx;
    const y = piece.y + sy + dy;
    if (x < 0 || x >= COLS || y >= ROWS) return true;
    if (y >= 0 && board[y][x]) return true;
  }
  return false;
}

function tryMove(dx, dy) {
  if (!activePiece) return false;
  if (!collides(activePiece, dx, dy)) {
    activePiece.x += dx;
    activePiece.y += dy;
    draw();
    return true;
  }
  return false;
}

function rotate(dir) {
  if (!activePiece) return;
  const newRotation = (activePiece.rotation + (dir > 0 ? 1 : 3)) % 4;
  // try kicks
  for (const [kx, ky] of KICK_TESTS) {
    if (!collides(activePiece, kx, ky, newRotation)) {
      activePiece.rotation = newRotation;
      activePiece.x += kx;
      activePiece.y += ky;
      draw();
      return true;
    }
  }
  return false;
}

function softDrop() {
  if (!activePiece) return;
  if (tryMove(0, 1)) {
    score += SOFT_DROP_POINT_PER_CELL;
    updateSidebar();
  } else {
    lockPiece();
  }
}

function computeHardDropDistance() {
  let distance = 0;
  while (!collides(activePiece, 0, distance + 1)) {
    distance += 1;
  }
  return distance;
}

function hardDrop() {
  if (!activePiece) return;
  const dist = computeHardDropDistance();
  if (dist > 0) {
    activePiece.y += dist;
    score += dist * HARD_DROP_POINT_PER_CELL;
    lockPiece();
  }
}

function lockPiece() {
  for (const { x, y } of getBlocks(activePiece)) {
    if (y < 0) continue; // above field
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
      board[y][x] = { type: activePiece.type, color: COLOR_BY_TYPE[activePiece.type] };
    }
  }
  const cleared = clearLines();
  if (cleared > 0) {
    score += SCORE_FOR_LINES[cleared] || 0;
    linesClearedTotal += cleared;
    const newLevel = Math.floor(linesClearedTotal / 10) + 1;
    if (newLevel !== level) {
      level = newLevel;
      dropIntervalMs = levelToDropMs(level);
    }
  }
  spawnPiece();
  updateSidebar();
  draw();
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    const full = board[y].every(cell => cell !== null);
    if (full) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared += 1;
      y += 1; // stay on same y index after shifting
    }
  }
  return cleared;
}

/** Game loop */
function gameLoop(timestamp) {
  if (!isRunning) return; // paused
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  dropTimerMs += delta;
  if (dropTimerMs >= dropIntervalMs) {
    if (!tryMove(0, 1)) {
      lockPiece();
    }
    dropTimerMs = 0;
  }

  draw();
  requestAnimationFrame(gameLoop);
}

/** Rendering */
function draw() {
  // clear
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // draw background grid
  drawGrid();

  // draw locked blocks
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = board[y][x];
      if (cell) drawBlock(x, y, cell.color);
    }
  }

  // draw ghost
  if (activePiece) {
    const dist = computeHardDropDistance();
    drawPiece({ ...activePiece, y: activePiece.y + dist }, COLOR_BY_TYPE.GHOST);
  }

  // draw active piece
  if (activePiece) drawPiece(activePiece, COLOR_BY_TYPE[activePiece.type]);
}

function drawGrid() {
  ctx.save();
  ctx.fillStyle = '#0b0f23';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = '#1a2244';
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) {
    const px = x * BLOCK_SIZE;
    ctx.beginPath();
    ctx.moveTo(px + 0.5, 0);
    ctx.lineTo(px + 0.5, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    const py = y * BLOCK_SIZE;
    ctx.beginPath();
    ctx.moveTo(0, py + 0.5);
    ctx.lineTo(CANVAS_WIDTH, py + 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBlock(x, y, color) {
  const px = x * BLOCK_SIZE;
  const py = y * BLOCK_SIZE;
  ctx.save();
  // main
  const grad = ctx.createLinearGradient(px, py, px, py + BLOCK_SIZE);
  grad.addColorStop(0, shade(color, 0.18));
  grad.addColorStop(1, shade(color, -0.12));
  ctx.fillStyle = grad;
  ctx.fillRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
  // border
  ctx.strokeStyle = shade(color, -0.35);
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
  ctx.restore();
}

function drawPiece(piece, color) {
  const shape = SHAPES[piece.type][piece.rotation];
  for (const [dx, dy] of shape) {
    const x = piece.x + dx;
    const y = piece.y + dy;
    if (y < 0) continue;
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
      drawBlock(x, y, color);
    }
  }
}

function shade(hex, amount) {
  // hex like #rrggbb, amount in [-1,1]
  const num = parseInt(hex.slice(1), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const t = (v) => clamp(Math.round(v + (amount >= 0 ? (255 - v) * amount : v * amount)), 0, 255);
  const toHex = (v) => v.toString(16).padStart(2, '0');
  return `#${toHex(t(r))}${toHex(t(g))}${toHex(t(b))}`;
}

/** Sidebar */
function updateSidebar() {
  document.getElementById('score').textContent = String(score);
  document.getElementById('lines').textContent = String(linesClearedTotal);
  document.getElementById('level').textContent = String(level);
}

function drawNextPreview() {
  for (let i = 0; i < 3; i++) {
    const ctxN = nextCtxs[i];
    const canvasN = nextCanvases[i];
    ctxN.clearRect(0, 0, canvasN.width, canvasN.height);
    const type = nextQueue[i];
    if (!type) continue;

    // center the piece inside 4x4 grid scaled
    const cell = 20; // preview cell size
    const offsetX = Math.floor((canvasN.width - cell * 4) / 2);
    const offsetY = Math.floor((canvasN.height - cell * 4) / 2);

    const shape = SHAPES[type][0];
    for (const [dx, dy] of shape) {
      const x = dx + 2; // shift to center of 4x4
      const y = dy + 2;
      drawMiniBlock(ctxN, offsetX + x * cell, offsetY + y * cell, cell, COLOR_BY_TYPE[type]);
    }
  }
}

function drawMiniBlock(context, px, py, size, color) {
  const grad = context.createLinearGradient(px, py, px, py + size);
  grad.addColorStop(0, shade(color, 0.18));
  grad.addColorStop(1, shade(color, -0.12));
  context.fillStyle = grad;
  context.fillRect(px + 1, py + 1, size - 2, size - 2);
  context.strokeStyle = shade(color, -0.35);
  context.lineWidth = 2;
  context.strokeRect(px + 1, py + 1, size - 2, size - 2);
}

/** Overlay */
function showOverlay(message) {
  const el = document.getElementById('overlay');
  el.textContent = message;
  el.classList.remove('hidden');
}
function hideOverlay() {
  const el = document.getElementById('overlay');
  el.classList.add('hidden');
}

function setGameOver() {
  isGameOver = true;
  isRunning = false;
  showOverlay('ゲームオーバー\nRでリセット');
}

// Start
window.addEventListener('DOMContentLoaded', setup);