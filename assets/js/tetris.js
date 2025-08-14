// Tetris integrated into MixedFood collection
(function(){
  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 30; // logical px
  const CANVAS_WIDTH = COLS * BLOCK_SIZE; // 300
  const CANVAS_HEIGHT = ROWS * BLOCK_SIZE; // 600

  const COLOR_BY_TYPE = {
    I: '#5bd1ff', J: '#6b8cff', L: '#f7a44a', O: '#f2e94e', S: '#6cef8a', T: '#c77dff', Z: '#ff6b6b',
    GHOST: 'rgba(0,0,0,0.18)'
  };
  const SCORE_FOR_LINES = { 1: 100, 2: 300, 3: 500, 4: 800 };
  const SOFT_DROP_POINT_PER_CELL = 1;
  const HARD_DROP_POINT_PER_CELL = 2;
  const baseDropMs = 1000;
  const levelToDropMs = (level) => Math.max(60, Math.floor(baseDropMs * Math.pow(0.85, level - 1)));

  const SHAPES = {
    I: [
      [ [ -1, 0 ], [ 0, 0 ], [ 1, 0 ], [ 2, 0 ] ],
      [ [ 1, -1 ], [ 1, 0 ], [ 1, 1 ], [ 1, 2 ] ],
      [ [ -1, 1 ], [ 0, 1 ], [ 1, 1 ], [ 2, 1 ] ],
      [ [ 0, -1 ], [ 0, 0 ], [ 0, 1 ], [ 0, 2 ] ]
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
  const KICK_TESTS = [[0,0],[1,0],[-1,0],[2,0],[-2,0],[0,-1]];

  // State
  let canvas, ctx, nextCtxs = [], nextCanvases = [];
  let board, activePiece, nextQueue, bag;
  let score, linesClearedTotal, level;
  let dropTimerMs, dropIntervalMs, lastTime;
  let isRunning, isGameOver;

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function shade(hex, amount){
    const num = parseInt(hex.slice(1), 16);
    const r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
    const t = (v) => clamp(Math.round(v + (amount >= 0 ? (255 - v) * amount : v * amount)), 0, 255);
    const toHex = (v) => v.toString(16).padStart(2, '0');
    return `#${toHex(t(r))}${toHex(t(g))}${toHex(t(b))}`;
  }

  function init(){
    canvas = document.getElementById('tetris-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    // next canvases - only one preview now
    const c = document.getElementById('tetris-next0');
    nextCanvases[0] = c;
    nextCtxs[0] = c.getContext('2d');
    c.width = 60; c.height = 60;

    document.getElementById('tetris-newgame').addEventListener('click', startTetris);
    document.getElementById('tetris-pause').addEventListener('click', togglePause);
    document.getElementById('tetris-reset').addEventListener('click', resetTetris);
    const bindPress = (id, fn) => {
      const el = document.getElementById(id);
      if (!el) return;
      const handler = () => { if (isGameOver) return; if (!isRunning) startTetris(); fn(); };
      el.addEventListener('click', handler);
      el.addEventListener('touchstart', (e)=>{ e.preventDefault(); handler(); }, {passive:false});
    };
    bindPress('tetris-left', ()=> tryMove(-1,0));
    bindPress('tetris-right', ()=> tryMove(1,0));
    bindPress('tetris-down', ()=> softDrop());
    bindPress('tetris-rotate', ()=> rotate(+1));
    bindPress('tetris-drop', ()=> hardDrop());

    window.addEventListener('keydown', (e) => {
      if (window.currentGame !== 'tetris') return;
      if (isGameOver) {
        if (e.code === 'KeyR') { resetTetris(); e.preventDefault(); }
        return;
      }
      if (e.code === 'KeyP') { togglePause(); e.preventDefault(); return; }
      if (!isRunning) return;
      switch (e.code) {
        case 'ArrowLeft': tryMove(-1,0); e.preventDefault(); break;
        case 'ArrowRight': tryMove(1,0); e.preventDefault(); break;
        case 'ArrowDown': softDrop(); e.preventDefault(); break;
        case 'ArrowUp': rotate(+1); e.preventDefault(); break;
        case 'Space': hardDrop(); e.preventDefault(); break;
      }
    });

    window.addEventListener('resize', resizeCanvasForDPR);

    // swipe gesture on canvas
    bindSwipe(canvas);

    resetTetris();
    draw();
  }

  function resizeCanvasForDPR(){
    // Fit by both width (92vw) and height (~56vh) to avoid overlong layout on mobile
    const maxWidth = window.innerWidth * 0.92;
    const maxHeight = Math.max(260, Math.min(window.innerHeight * 0.56, CANVAS_HEIGHT));
    // start from height cap
    let cssHeight = maxHeight;
    let cssWidth = cssHeight * (CANVAS_WIDTH / CANVAS_HEIGHT);
    if (cssWidth > maxWidth){
      cssWidth = maxWidth;
      cssHeight = cssWidth * (CANVAS_HEIGHT / CANVAS_WIDTH);
    }
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    const ratio = cssWidth / CANVAS_WIDTH;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(CANVAS_WIDTH * dpr * ratio);
    canvas.height = Math.round(CANVAS_HEIGHT * dpr * ratio);
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr * ratio, dpr * ratio);
    resizePreviews();
  }

  function startTetris(){
    if (isGameOver) resetTetris();
    if (!isRunning){
      isRunning = true;
      hideOverlay();
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }
  }

  function togglePause(){
    if (isGameOver) return;
    isRunning = !isRunning;
    if (isRunning){
      hideOverlay();
      lastTime = performance.now();
      requestAnimationFrame(loop);
    } else {
      showOverlay('暂停中 (P继续)');
    }
  }

  function resetTetris(){
    board = Array.from({length: ROWS}, () => Array(COLS).fill(null));
    activePiece = null;
    nextQueue = [];
    bag = [];
    score = 0; linesClearedTotal = 0; level = 1;
    dropTimerMs = 0; dropIntervalMs = levelToDropMs(level);
    isRunning = false; isGameOver = false;
    refillQueue();
    spawnPiece();
    updateSidebar();
    drawNext();
    showOverlay('点击开始或按P开始');
    resizeCanvasForDPR();
  }

  function refillQueue(){
    while (nextQueue.length < 5){
      if (bag.length === 0) bag = shuffle(['I','J','L','O','S','T','Z']);
      nextQueue.push(bag.pop());
    }
  }
  function shuffle(arr){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }

  function spawnPiece(){
    const type = nextQueue.shift();
    refillQueue();
    activePiece = { type, rotation:0, x:4, y:1 };
    if (collides(activePiece,0,0,0)) setGameOver();
    drawNext();
  }

  function getBlocks(p){
    const shape = SHAPES[p.type][p.rotation];
    return shape.map(([dx,dy])=>({x:p.x+dx, y:p.y+dy}));
  }
  function collides(p, dx=0, dy=0, newRot=p.rotation){
    const shape = SHAPES[p.type][newRot];
    for (const [sx,sy] of shape){
      const x = p.x + sx + dx;
      const y = p.y + sy + dy;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && board[y][x]) return true;
    }
    return false;
  }
  function tryMove(dx,dy){
    if (!activePiece) return false;
    if (!collides(activePiece, dx, dy)){
      activePiece.x += dx; activePiece.y += dy; draw(); return true;
    }
    return false;
  }
  function rotate(dir){
    if (!activePiece) return false;
    const newR = (activePiece.rotation + (dir>0?1:3)) % 4;
    for (const [kx,ky] of KICK_TESTS){
      if (!collides(activePiece, kx, ky, newR)){
        activePiece.rotation = newR; activePiece.x += kx; activePiece.y += ky; draw(); return true;
      }
    }
    return false;
  }
  function softDrop(){ if (tryMove(0,1)){ score += SOFT_DROP_POINT_PER_CELL; updateSidebar(); } else { lockPiece(); } }
  function hardDrop(){ if (!activePiece) return; const d = hardDropDistance(); if (d>0){ activePiece.y += d; score += d*HARD_DROP_POINT_PER_CELL; lockPiece(); } }
  function hardDropDistance(){ let d=0; while(!collides(activePiece,0,d+1)) d++; return d; }

  function lockPiece(){
    for (const {x,y} of getBlocks(activePiece)){
      if (y<0) continue;
      if (x>=0 && x<COLS && y>=0 && y<ROWS){ board[y][x] = { type: activePiece.type, color: COLOR_BY_TYPE[activePiece.type] }; }
    }
    const cleared = clearLines();
    if (cleared>0){
      score += (SCORE_FOR_LINES[cleared]||0);
      linesClearedTotal += cleared;
      const newLevel = Math.floor(linesClearedTotal/10)+1;
      if (newLevel !== level){ level = newLevel; dropIntervalMs = levelToDropMs(level); }
    }
    spawnPiece();
    updateSidebar();
    draw();
  }
  function clearLines(){
    let c=0;
    for (let y=ROWS-1;y>=0;y--){
      if (board[y].every(cell=>cell!==null)){
        board.splice(y,1); board.unshift(Array(COLS).fill(null)); c++; y++;
      }
    }
    return c;
  }

  function loop(ts){
    if (!isRunning) return;
    const delta = ts - lastTime; lastTime = ts;
    dropTimerMs += delta;
    if (dropTimerMs >= dropIntervalMs){ if (!tryMove(0,1)) lockPiece(); dropTimerMs = 0; }
    draw();
    requestAnimationFrame(loop);
  }

  function draw(){
    ctx.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
    drawGrid();
    for (let y=0;y<ROWS;y++) for (let x=0;x<COLS;x++){ const cell=board[y][x]; if(cell) drawBlock(x,y,cell.color); }
    if (activePiece){ const d = hardDropDistance(); drawPiece({...activePiece, y:activePiece.y+d}, COLOR_BY_TYPE.GHOST); drawPiece(activePiece, COLOR_BY_TYPE[activePiece.type]); }
  }
  function drawGrid(){
    ctx.save();
    ctx.fillStyle = '#f6faff';
    ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
    ctx.strokeStyle = 'rgba(123,176,255,0.22)';
    ctx.lineWidth = 1;
    for (let x=0;x<=COLS;x++){ const px=x*BLOCK_SIZE; ctx.beginPath(); ctx.moveTo(px+0.5,0); ctx.lineTo(px+0.5,CANVAS_HEIGHT); ctx.stroke(); }
    for (let y=0;y<=ROWS;y++){ const py=y*BLOCK_SIZE; ctx.beginPath(); ctx.moveTo(0,py+0.5); ctx.lineTo(CANVAS_WIDTH,py+0.5); ctx.stroke(); }
    ctx.restore();
  }
  function drawBlock(x,y,color){
    const px=x*BLOCK_SIZE, py=y*BLOCK_SIZE;
    const grad = ctx.createLinearGradient(px,py,px,py+BLOCK_SIZE);
    const top = shade(color, 0.14), bottom = shade(color, -0.1);
    ctx.fillStyle = grad; grad.addColorStop(0, top); grad.addColorStop(1, bottom);
    ctx.fillRect(px+1,py+1,BLOCK_SIZE-2,BLOCK_SIZE-2);
    ctx.strokeStyle = shade(color, -0.35); ctx.lineWidth=2; ctx.strokeRect(px+1,py+1,BLOCK_SIZE-2,BLOCK_SIZE-2);
  }
  function drawPiece(p, color){
    const shape = SHAPES[p.type][p.rotation];
    for (const [dx,dy] of shape){ const x=p.x+dx, y=p.y+dy; if (y<0) continue; if (x>=0&&x<COLS&&y>=0&&y<ROWS) drawBlock(x,y,color); }
  }

  function drawNext(){
    const ctxN = nextCtxs[0]; const c = nextCanvases[0]; if (!ctxN || !c) return;
    ctxN.clearRect(0,0,c.width,c.height);
    const type = nextQueue[0]; if(!type) return;
    const cell = Math.max(10, Math.min(14, Math.floor(c.width/4) - 2));
    const offX = Math.floor((c.width - cell*4)/2), offY = Math.floor((c.height - cell*4)/2);
    const shape = SHAPES[type][0];
    for (const [dx,dy] of shape){ const x=dx+2, y=dy+2; drawMini(ctxN, offX+x*cell, offY+y*cell, cell, COLOR_BY_TYPE[type]); }
  }
  function drawMini(ctxN, px, py, size, color){
    const grad = ctxN.createLinearGradient(px,py,px,py+size);
    grad.addColorStop(0, shade(color,0.18)); grad.addColorStop(1, shade(color,-0.12));
    ctxN.fillStyle = grad; ctxN.fillRect(px+1,py+1,size-2,size-2);
    ctxN.strokeStyle = shade(color,-0.35); ctxN.lineWidth=2; ctxN.strokeRect(px+1,py+1,size-2,size-2);
  }

  function updateSidebar(){
    const s = document.getElementById('tetris-score'); if (s) s.textContent = String(score);
    const l = document.getElementById('tetris-lines'); if (l) l.textContent = String(linesClearedTotal);
    const lv = document.getElementById('tetris-level'); if (lv) lv.textContent = String(level);
  }

  function showOverlay(msg){ const el=document.getElementById('tetris-overlay'); if (!el) return; el.textContent=msg; el.style.display='grid'; }
  function hideOverlay(){ const el=document.getElementById('tetris-overlay'); if (!el) return; el.style.display='none'; }
  function setGameOver(){ isRunning=false; isGameOver=true; showOverlay('游戏结束 (R重置)'); }

  function resizePreviews(){
    const wrap = document.getElementById('tetris-next-wrap');
    if (!wrap) return;
    const c = nextCanvases[0]; if (!c) return;
    c.style.width = '60px';
    c.style.height = '60px';
    c.width = 60; c.height = 60;
  }

  // Simple swipe: horizontal -> move, vertical down -> soft drop, tap -> rotate, long press -> hard drop
  function bindSwipe(target){
    let startX=0, startY=0, startT=0, longPressTimer=null, moved=false;
    const threshold = 20; // px
    target.addEventListener('touchstart', (e)=>{
      if (window.currentGame !== 'tetris') return;
      const t = e.changedTouches[0]; startX=t.clientX; startY=t.clientY; startT=Date.now(); moved=false;
      clearTimeout(longPressTimer);
      longPressTimer = setTimeout(()=>{ if (!moved) hardDrop(); }, 500);
    }, {passive:true});
    target.addEventListener('touchmove', (e)=>{
      if (window.currentGame !== 'tetris') return;
      const t = e.changedTouches[0]; const dx=t.clientX-startX; const dy=t.clientY-startY;
      if (Math.abs(dx) > Math.abs(dy)){
        if (Math.abs(dx) > threshold){ moved=true; if (dx>0) tryMove(1,0); else tryMove(-1,0); startX=t.clientX; startY=t.clientY; }
      } else {
        if (dy > threshold){ moved=true; softDrop(); startX=t.clientX; startY=t.clientY; }
      }
    }, {passive:true});
    target.addEventListener('touchend', (e)=>{
      if (window.currentGame !== 'tetris') return;
      clearTimeout(longPressTimer);
      const dt = Date.now()-startT; const t = e.changedTouches[0]; const dx=t.clientX-startX; const dy=t.clientY-startY;
      if (!moved && dt < 250 && Math.abs(dx)<10 && Math.abs(dy)<10){ rotate(+1); }
    }, {passive:true});
  }

  document.addEventListener('DOMContentLoaded', init);
})();