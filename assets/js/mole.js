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

function getHoleCenter(index) {
    const cols = 3;
    const col = index % cols;
    const row = Math.floor(index / cols);
    const holeRadius = 40;
    const canvasPadding = 20; // 让圆圈与画布边框留出空隙
    const gapX = (moleCanvas.width - 2 * canvasPadding - 2 * holeRadius) / (cols - 1);
    const gapY = (moleCanvas.height - 2 * canvasPadding - 2 * holeRadius) / (cols - 1);
    const x = canvasPadding + holeRadius + col * gapX;
    const y = canvasPadding + holeRadius + row * gapY;
    return { x, y, holeRadius };
}

function drawMoleField() {
    if (!moleCtx) return;
    moleCtx.clearRect(0, 0, moleCanvas.width, moleCanvas.height);
    for (let i = 0; i < moleGame.holes; i++) {
        const { x, y, holeRadius } = getHoleCenter(i);
        // 洞
        moleCtx.beginPath();
        moleCtx.arc(x, y, holeRadius, 0, Math.PI * 2);
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
        const { x: cx, y: cy, holeRadius } = getHoleCenter(i);
        if (Math.hypot(x - cx, y - cy) < holeRadius) {
            if (i === moleGame.molePos) {
                moleGame.score++;
                const lang = window.currentLang || 'zh';
                const scoreLabel = (window.langMap && window.langMap[lang] && window.langMap[lang].labels.score) || '得分';
                document.getElementById('mole-status').textContent = scoreLabel + '：' + moleGame.score;
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
    const lang = window.currentLang || 'zh';
    const scoreLabel = (window.langMap && window.langMap[lang] && window.langMap[lang].labels.score) || '得分';
    const highLabel = (window.langMap && window.langMap[lang] && window.langMap[lang].labels.highScore) || '最高分';
    document.getElementById('mole-status').textContent = scoreLabel + '：0';
    document.getElementById('mole-highscore').textContent = highLabel + '：' + (moleGame.highscore || 0);
    randomMole();
    if (moleGame.timer) clearInterval(moleGame.timer);
    moleGame.timer = setInterval(() => {
        moleGame.time--;
        if (moleGame.time <= 0) {
            clearInterval(moleGame.timer);
            moleGame.running = false;
            if (moleGame.score > moleGame.highscore) {
                moleGame.highscore = moleGame.score;
                document.getElementById('mole-highscore').textContent = highLabel + '：' + moleGame.highscore;
            }
            const overText = (window.langMap && window.langMap[lang] && window.langMap[lang].labels.gameOver) || '游戏失败！';
            document.getElementById('mole-status').textContent = overText.replace('！', '') + '，' + scoreLabel + '：' + moleGame.score;
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
            const lang2 = window.currentLang || 'zh';
            const scoreLabel2 = (window.langMap && window.langMap[lang2] && window.langMap[lang2].labels.score) || '得分';
            document.getElementById('mole-status').textContent = scoreLabel2 + '：' + moleGame.score;
            randomMole();
        }
    }
}
window.addEventListener('keydown', moleKeydown);

drawMoleField(); 