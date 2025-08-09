let moleGame = {
    score: 0,
    highscore: 0,
    time: 30,
    timer: null,
    molePos: -1,
    running: false,
    holes: 9,
};

const moleCanvas = document.getElementById('mole-canvas');
const moleCtx = moleCanvas ? moleCanvas.getContext('2d') : null;

function drawMoleField() {
    if (!moleCtx) return;
    moleCtx.clearRect(0, 0, 400, 400);
    for (let i = 0; i < moleGame.holes; i++) {
        let x = (i % 3) * 130 + 35;
        let y = Math.floor(i / 3) * 130 + 35;
        // 洞
        moleCtx.beginPath();
        moleCtx.arc(x, y, 40, 0, Math.PI * 2);
        moleCtx.fillStyle = '#a0522d';
        moleCtx.fill();
        // 地鼠
        if (i === moleGame.molePos) {
            moleCtx.beginPath();
            moleCtx.arc(x, y, 30, 0, Math.PI * 2);
            moleCtx.fillStyle = '#888';
            moleCtx.fill();
            moleCtx.beginPath();
            moleCtx.arc(x - 10, y - 10, 5, 0, Math.PI * 2);
            moleCtx.arc(x + 10, y - 10, 5, 0, Math.PI * 2);
            moleCtx.fillStyle = '#fff';
            moleCtx.fill();
        }
    }
}

function randomMole() {
    let pos = Math.floor(Math.random() * moleGame.holes);
    moleGame.molePos = pos;
    drawMoleField();
}

function moleClick(e) {
    if (!moleGame.running) return;
    const rect = moleCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (let i = 0; i < moleGame.holes; i++) {
        let cx = (i % 3) * 130 + 35;
        let cy = Math.floor(i / 3) * 130 + 35;
        if (Math.hypot(x - cx, y - cy) < 40) {
            if (i === moleGame.molePos) {
                moleGame.score++;
                document.getElementById('mole-status').textContent = '得分：' + moleGame.score;
                randomMole();
            }
            break;
        }
    }
}

function startMole() {
    moleGame.score = 0;
    moleGame.time = 30;
    moleGame.running = true;
    document.getElementById('mole-status').textContent = '得分：0';
    document.getElementById('mole-highscore').textContent = '最高分：' + (moleGame.highscore || 0);
    randomMole();
    if (moleGame.timer) clearInterval(moleGame.timer);
    moleGame.timer = setInterval(() => {
        moleGame.time--;
        if (moleGame.time <= 0) {
            clearInterval(moleGame.timer);
            moleGame.running = false;
            if (moleGame.score > moleGame.highscore) {
                moleGame.highscore = moleGame.score;
                document.getElementById('mole-highscore').textContent = '最高分：' + moleGame.highscore;
            }
            document.getElementById('mole-status').textContent = '游戏结束，得分：' + moleGame.score;
        } else {
            randomMole();
        }
    }, 800);
}

if (moleCanvas) {
    moleCanvas.addEventListener('click', moleClick);
}

// QWE/ASD/ZXC九宫格键盘操作支持
const keyToHoleIdx = {
    'q': 0, 'w': 1, 'e': 2,
    'a': 3, 's': 4, 'd': 5,
    'z': 6, 'x': 7, 'c': 8
};
function moleKeydown(e) {
    if (!moleGame.running) return;
    const key = e.key.toLowerCase();
    if (key in keyToHoleIdx) {
        const idx = keyToHoleIdx[key];
        if (idx === moleGame.molePos) {
            moleGame.score++;
            document.getElementById('mole-status').textContent = '得分：' + moleGame.score;
            randomMole();
        }
    }
}
window.addEventListener('keydown', moleKeydown);

drawMoleField(); 