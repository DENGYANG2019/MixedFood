// 纯canvas Q版贪吃蛇
const SNAKE_SIZE = 24;
const SNAKE_ROWS = 20;
const SNAKE_COLS = 20;
const SNAKE_CANVAS_W = SNAKE_COLS * SNAKE_SIZE; // 480
const SNAKE_CANVAS_H = SNAKE_ROWS * SNAKE_SIZE; // 480
let snake, foods, direction, nextDirection, snakeTimer, snakeScore, snakeGameOver;

function initSnakeGame() {
    const canvas = document.getElementById('snake-canvas');
    // 依据 CSS 缩放宽度，按比例设置实际像素，提升移动端清晰度
    const cssWidth = Math.min(window.innerWidth * 0.92, SNAKE_CANVAS_W);
    const ratio = cssWidth / SNAKE_CANVAS_W;
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssWidth + 'px';
    canvas.width = Math.round(SNAKE_CANVAS_W * window.devicePixelRatio * ratio);
    canvas.height = Math.round(SNAKE_CANVAS_H * window.devicePixelRatio * ratio);
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio * ratio, window.devicePixelRatio * ratio);
    // 检查canvas实际尺寸和逻辑尺寸是否一致
    // 移动端适配后不再需要该警告
    startSnake();
}

function startSnake() {
    snake = [{x: 9, y: 9}];
    direction = 'right';
    nextDirection = 'right';
    foods = randomFoods(); // 生成1~3个苹果
    snakeScore = 0;
    snakeGameOver = false;
    document.getElementById('snake-status').textContent = '';
    clearInterval(snakeTimer);
    drawSnake();
    snakeTimer = setInterval(moveSnake, 100);
}

function randomFoods() {
    // 统计所有空余格子
    const empty = [];
    for (let x = 0; x < SNAKE_COLS; x++) {
        for (let y = 0; y < SNAKE_ROWS; y++) {
            if (!snake || !snake.some(seg => seg.x === x && seg.y === y)) {
                if (x >= 0 && x < SNAKE_COLS && y >= 0 && y < SNAKE_ROWS) {
                    empty.push({x, y});
                }
            }
        }
    }
    if (empty.length === 0) {
        endSnake('恭喜通关!');
        return [];
    }
    // 随机数量
    const count = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1, empty.length));
    const result = [];
    for (let i = 0; i < count && empty.length > 0; i++) {
        const idx = Math.floor(Math.random() * empty.length);
        result.push(empty[idx]);
        empty.splice(idx, 1);
    }
    return result;
}

function addRandomFoods(n) {
    // 统计所有空余格子
    const empty = [];
    for (let x = 0; x < SNAKE_COLS; x++) {
        for (let y = 0; y < SNAKE_ROWS; y++) {
            if (!snake.some(seg => seg.x === x && seg.y === y) && !foods.some(f => f.x === x && f.y === y)) {
                empty.push({x, y});
            }
        }
    }
    for (let i = 0; i < n && foods.length < 10 && empty.length > 0; i++) {
        const idx = Math.floor(Math.random() * empty.length);
        foods.push(empty[idx]);
        empty.splice(idx, 1);
    }
}

function moveSnake() {
    if (snakeGameOver) return;
    direction = nextDirection;
    const head = {...snake[0]};
    if (direction === 'up') head.y--;
    if (direction === 'down') head.y++;
    if (direction === 'left') head.x--;
    if (direction === 'right') head.x++;
    // 撞墙（提前判断，未unshift前）
    if (head.x < 0 || head.x >= SNAKE_COLS || head.y < 0 || head.y >= SNAKE_ROWS) {
        endSnake('游戏失败!');
        return;
    }
    // 自咬
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        endSnake('游戏失败!');
        return;
    }
    // 只有没出界才unshift
    snake.unshift(head);
    // 吃到食物
    let ate = false;
    for (let i = 0; i < foods.length; i++) {
        if (head.x === foods[i].x && head.y === foods[i].y) {
            snakeScore++;
            foods.splice(i, 1);
            ate = true;
            break;
        }
    }
    if (ate) {
        // 随机生成1~3个新苹果，最多不超过10个
        const n = Math.floor(Math.random() * 3) + 1;
        addRandomFoods(n);
    } else {
        snake.pop();
    }
    drawSnake();
}

function drawSnake() {
    const canvas = document.getElementById('snake-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 背景
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // 网格线
    ctx.strokeStyle = 'rgba(123, 176, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < SNAKE_COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * SNAKE_SIZE, 0);
        ctx.lineTo(i * SNAKE_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < SNAKE_ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * SNAKE_SIZE);
        ctx.lineTo(canvas.width, i * SNAKE_SIZE);
        ctx.stroke();
    }
    // 画蛇身
    for (let i = snake.length - 1; i >= 0; i--) {
        const seg = snake[i];
        if (seg.x < 0 || seg.x >= SNAKE_COLS || seg.y < 0 || seg.y >= SNAKE_ROWS) continue;
        const px = seg.x * SNAKE_SIZE;
        const py = seg.y * SNAKE_SIZE;
        if (i === 0) {
            // 蛇头：蓝色椭圆+大眼睛+红色小舌头
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.18)';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.ellipse(px + SNAKE_SIZE/2, py + SNAKE_SIZE/2, SNAKE_SIZE/2, SNAKE_SIZE/2-2, 0, 0, 2*Math.PI);
            ctx.fillStyle = '#1976d2';
            ctx.fill();
            ctx.restore();
            // 眼白
            ctx.save();
            ctx.beginPath();
            ctx.arc(px + SNAKE_SIZE/2 - 6, py + SNAKE_SIZE/2 - 4, 4, 0, 2*Math.PI);
            ctx.arc(px + SNAKE_SIZE/2 + 6, py + SNAKE_SIZE/2 - 4, 4, 0, 2*Math.PI);
            ctx.fillStyle = '#fff';
            ctx.fill();
            // 眼珠
            ctx.beginPath();
            ctx.arc(px + SNAKE_SIZE/2 - 6, py + SNAKE_SIZE/2 - 3, 2, 0, 2*Math.PI);
            ctx.arc(px + SNAKE_SIZE/2 + 6, py + SNAKE_SIZE/2 - 3, 2, 0, 2*Math.PI);
            ctx.fillStyle = '#222';
            ctx.fill();
            ctx.restore();
            // 小舌头
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(px + SNAKE_SIZE/2, py + SNAKE_SIZE/2 + 8);
            ctx.lineTo(px + SNAKE_SIZE/2 - 2, py + SNAKE_SIZE/2 + 14);
            ctx.lineTo(px + SNAKE_SIZE/2 + 2, py + SNAKE_SIZE/2 + 14);
            ctx.closePath();
            ctx.fillStyle = '#e53935';
            ctx.fill();
            ctx.restore();
        } else {
            // 蛇身：emoji🟢贴图
            ctx.save();
            ctx.font = `${SNAKE_SIZE-2}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🟢', px + SNAKE_SIZE/2, py + SNAKE_SIZE/2);
            ctx.restore();
        }
    }
    // 画所有苹果
    for (const food of foods) {
        if (food.x < 0 || food.x >= SNAKE_COLS || food.y < 0 || food.y >= SNAKE_ROWS) continue;
        const foodPx = food.x * SNAKE_SIZE;
        const foodPy = food.y * SNAKE_SIZE;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(foodPx + SNAKE_SIZE/2, foodPy + SNAKE_SIZE/2, SNAKE_SIZE/2 - 2, 0, 2*Math.PI);
        ctx.fillStyle = '#ff6b6b';
        ctx.fill();
        // 高光
        ctx.beginPath();
        ctx.arc(foodPx + SNAKE_SIZE/2 - 4, foodPy + SNAKE_SIZE/2 - 4, SNAKE_SIZE/6, 0, 2*Math.PI);
        ctx.fillStyle = '#fff8';
        ctx.fill();
        // 叶子
        ctx.beginPath();
        ctx.ellipse(foodPx + SNAKE_SIZE/2, foodPy + 6, 3, 7, -0.5, 0, 2*Math.PI);
        ctx.fillStyle = '#4caf50';
        ctx.fill();
        ctx.restore();
    }
    // 显示分数
    const lang = window.currentLang || 'zh';
    const scoreLabel = (window.langMap && window.langMap[lang] && window.langMap[lang].labels.score) || '得分';
    document.getElementById('snake-status').textContent = scoreLabel + '：' + snakeScore;

    // 画深色外边框
    ctx.save();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

function endSnake(msg) {
    clearInterval(snakeTimer);
    snakeGameOver = true;
    drawSnake(); // 游戏结束时再画一次，保证不会显示出界蛇头
    const lang = window.currentLang || 'zh';
    const scoreLabel = (window.langMap && window.langMap[lang] && window.langMap[lang].labels.score) || '得分';
    document.getElementById('snake-status').textContent = msg + ' ' + scoreLabel + '：' + snakeScore;
    updateSnakeHighScore();
}

function updateSnakeHighScore() {
    let high = localStorage.getItem('snakeHighScore') || 0;
    if (snakeScore > high) {
        high = snakeScore;
        localStorage.setItem('snakeHighScore', high);
    }
    const lang = window.currentLang || 'zh';
    const highLabel = (window.langMap && window.langMap[lang] && window.langMap[lang].labels.highScore) || '最高分';
    document.getElementById('snake-highscore').textContent = ' ' + highLabel + '：' + high;
}

window.addEventListener('keydown', function(e) {
    if (document.getElementById('snake-section') && document.getElementById('snake-section').style.display === 'none') return;
    if (snakeGameOver) return;
    if (e.key === 'ArrowUp' && direction !== 'down') nextDirection = 'up';
    if (e.key === 'ArrowDown' && direction !== 'up') nextDirection = 'down';
    if (e.key === 'ArrowLeft' && direction !== 'right') nextDirection = 'left';
    if (e.key === 'ArrowRight' && direction !== 'left') nextDirection = 'right';
}, { passive: false });

// 自动初始化（可在index.html的snake-section显示时调用initSnakeGame）

// 移动端：在画布上支持滑动控制方向
(function setupSnakeTouchControls() {
    const canvas = document.getElementById('snake-canvas');
    if (!canvas) return;
    let startX = 0, startY = 0;
    canvas.addEventListener('touchstart', function(e) {
        if (document.getElementById('snake-section') && document.getElementById('snake-section').style.display === 'none') return;
        if (!e.touches || e.touches.length === 0) return;
        const t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
    }, { passive: true });
    canvas.addEventListener('touchend', function(e) {
        if (document.getElementById('snake-section') && document.getElementById('snake-section').style.display === 'none') return;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        const absX = Math.abs(dx), absY = Math.abs(dy);
        const threshold = 20; // 滑动阈值
        if (absX < threshold && absY < threshold) return;
        if (absX > absY) {
            if (dx < 0 && direction !== 'right') nextDirection = 'left';
            else if (dx > 0 && direction !== 'left') nextDirection = 'right';
        } else {
            if (dy < 0 && direction !== 'down') nextDirection = 'up';
            else if (dy > 0 && direction !== 'up') nextDirection = 'down';
        }
    }, { passive: true });
})();
