const ROWS = 9;
const COLS = 9;
const MINES = 10;
let minefield = [];
let revealed = [];
let flagged = [];
let gameOver = false;
let startTime = 0;
let bestTime = localStorage.getItem('minesweeperBestTime') ? parseFloat(localStorage.getItem('minesweeperBestTime')) : null;
let firstClick = true;

function startGame() {
    minefield = createMinefield(ROWS, COLS, MINES);
    revealed = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    flagged = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    gameOver = false;
    startTime = Date.now();
    firstClick = true;
    document.getElementById('status').textContent = '';
    setGameStatus();
    renderMinefield();
    renderBestTime();
    saveGame();
}

function createMinefield(rows, cols, mines) {
    let field = Array.from({length: rows}, () => Array(cols).fill(0));
    let placed = 0;
    while (placed < mines) {
        let r = Math.floor(Math.random() * rows);
        let c = Math.floor(Math.random() * cols);
        if (field[r][c] === 'M') continue;
        field[r][c] = 'M';
        placed++;
    }
    // 填充数字
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (field[r][c] === 'M') continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    let nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && field[nr][nc] === 'M') count++;
                }
            }
            field[r][c] = count;
        }
    }
    return field;
}

function renderMinefield() {
    const container = document.getElementById('minefield');
    container.innerHTML = '';
    let flagCount = 0;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (revealed[r][c]) {
                cell.classList.add('open');
                if (minefield[r][c] === 'M') {
                    cell.classList.add('mine');
                    cell.textContent = '💣';
                } else if (minefield[r][c] > 0) {
                    cell.textContent = minefield[r][c];
                }
            } else if (flagged[r][c]) {
                cell.classList.add('flag');
                cell.textContent = '🚩';
                flagCount++;
            }
            cell.onclick = () => handleCellClick(r, c);
            cell.oncontextmenu = (e) => { e.preventDefault(); handleFlag(r, c); };
            // 移动端：轻点翻开，长按插旗
            let touchTimer = null;
            let startX = 0, startY = 0, moved = false, didLongPress = false;
            cell.addEventListener('touchstart', (e) => {
                if (gameOver) return;
                if (!e.touches || e.touches.length === 0) return;
                const t = e.touches[0];
                startX = t.clientX; startY = t.clientY; moved = false; didLongPress = false;
                // 450ms 长按判定为插旗
                touchTimer = setTimeout(() => {
                    didLongPress = true;
                    handleFlag(r, c);
                }, 450);
            }, { passive: true });
            cell.addEventListener('touchmove', (e) => {
                if (!e.touches || e.touches.length === 0) return;
                const t = e.touches[0];
                const dx = t.clientX - startX, dy = t.clientY - startY;
                if (Math.hypot(dx, dy) > 12) { moved = true; if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; } }
            }, { passive: true });
            const finishTouch = (e) => {
                if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; }
                // 阻止生成点击事件，避免和 onclick 重复
                e.preventDefault();
                if (!didLongPress && !moved) {
                    handleCellClick(r, c);
                }
            };
            cell.addEventListener('touchend', finishTouch, { passive: false });
            cell.addEventListener('touchcancel', () => { if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; } }, { passive: true });
            container.appendChild(cell);
        }
    }
    // 实时显示旗标数量（多语言）
    const lang = window.currentLang || 'zh';
    const flagsLabel = (window.langMap && window.langMap[lang] && window.langMap[lang].labels.flags) || '旗标';
    document.getElementById('status').textContent = `${flagsLabel}：${flagCount} / ${MINES}` + (gameOver ? (document.getElementById('status').textContent ? ' ' + document.getElementById('status').textContent : '') : '');
}

function renderBestTime() {
    let el = document.getElementById('minesweeper-besttime');
    if (!el) {
        el = document.createElement('span');
        el.id = 'minesweeper-besttime';
        document.getElementById('status').parentNode.appendChild(el);
    }
    const lang = window.currentLang || 'zh';
    const bestLabel = (window.langMap && window.langMap[lang] && window.langMap[lang].labels.bestTime) || '最快时间';
    if (bestTime !== null) {
        el.textContent = ` ${bestLabel}：${bestTime.toFixed(1)}秒`;
    } else {
        el.textContent = '';
    }
}

function handleCellClick(r, c) {
    if (gameOver || revealed[r][c] || flagged[r][c]) return;
    // 第一点击不能踩雷
    if (firstClick) {
        while (minefield[r][c] === 'M') {
            minefield = createMinefield(ROWS, COLS, MINES);
        }
        firstClick = false;
    }
    revealed[r][c] = true;
    if (minefield[r][c] === 'M') {
        gameOver = true;
        setGameStatus('fail', true);
        const lang = window.currentLang || 'zh';
        const gameOverText = (window.langMap && window.langMap[lang] && window.langMap[lang].labels.gameOver) || '游戏失败！';
        document.getElementById('status').textContent = gameOverText;
        revealAll();
        saveGame();
        return;
    }
    if (minefield[r][c] === 0) {
        floodFill(r, c);
    }
    if (checkWin()) {
        gameOver = true;
        const used = (Date.now() - startTime) / 1000;
        if (bestTime === null || used < bestTime) {
            bestTime = used;
            localStorage.setItem('minesweeperBestTime', bestTime);
        }
        setGameStatus('win', true);
        const lang = window.currentLang || 'zh';
        const winPrefix = (window.langMap && window.langMap[lang] && window.langMap[lang].labels.winUseTime) || '恭喜通关！用时：';
        document.getElementById('status').textContent = `${winPrefix}${used.toFixed(1)}秒`;
        renderBestTime();
    }
    renderMinefield();
    saveGame();
}

function handleFlag(r, c) {
    if (gameOver || revealed[r][c]) return;
    flagged[r][c] = !flagged[r][c];
    renderMinefield();
    // 检查旗标和地雷是否完全一致
    if (checkFlagWin()) {
        gameOver = true;
        const used = (Date.now() - startTime) / 1000;
        if (bestTime === null || used < bestTime) {
            bestTime = used;
            localStorage.setItem('minesweeperBestTime', bestTime);
        }
        setGameStatus('win', true);
        const lang = window.currentLang || 'zh';
        const winFlagPrefix = (window.langMap && window.langMap[lang] && window.langMap[lang].labels.winFlagAllUseTime) || '恭喜通关！（旗标全部正确）用时：';
        document.getElementById('status').textContent = `${winFlagPrefix}${used.toFixed(1)}秒`;
        renderBestTime();
        revealAll();
        saveGame();
        return;
    }
    saveGame();
}

function floodFill(r, c) {
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !revealed[nr][nc] && minefield[nr][nc] !== 'M') {
                revealed[nr][nc] = true;
                if (minefield[nr][nc] === 0) floodFill(nr, nc);
            }
        }
    }
}

function revealAll() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            revealed[r][c] = true;
        }
    }
    renderMinefield();
}

function checkWin() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (minefield[r][c] !== 'M' && !revealed[r][c]) return false;
        }
    }
    return true;
}

function checkFlagWin() {
    let flagCount = 0;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (flagged[r][c]) {
                flagCount++;
                if (minefield[r][c] !== 'M') return false;
            }
        }
    }
    // 旗标数量必须等于地雷数
    return flagCount === MINES;
}

function setGameStatus(type, flash) {
    const status = document.getElementById('status');
    const minefield = document.getElementById('minefield');
    status.classList.remove('win','fail','flash');
    minefield.classList.remove('win','fail','flash');
    if(type==='win'){
        status.classList.add('win');
        minefield.classList.add('win');
    } else if(type==='fail'){
        status.classList.add('fail');
        minefield.classList.add('fail');
    }
    if(flash){
        status.classList.add('flash');
        minefield.classList.add('flash');
        setTimeout(()=>{status.classList.remove('flash');minefield.classList.remove('flash');}, 1200);
    }
}

// --- txt存储接口 ---
function saveGame() {
    // 这里只是示例，实际Web端无法直接写txt，需后端配合
    // 可用fetch('/save', {method:'POST', body: JSON.stringify({minefield, revealed, flagged, gameOver})})
}

function loadGame() {
    // 这里只是示例，实际Web端无法直接读txt，需后端配合
    // 可用fetch('/load').then(...)
}

// 页面加载自动开始
window.onload = startGame; 