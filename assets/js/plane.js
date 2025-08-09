// 飞机大战
const PLANE_WIDTH = 40;
const PLANE_HEIGHT = 40;
const BULLET_WIDTH = 6;
const BULLET_HEIGHT = 16;
const ENEMY_WIDTH = 36;
const ENEMY_HEIGHT = 36;
const PLANE_CANVAS_W = 400;
const PLANE_CANVAS_H = 500;
let plane, bullets, enemies, planeScore, planeGameOver, planeTimer, planeHighScore;
let playerPlaneImg, enemyPlaneImg, bulletImg, explosionImg;

// 创建贴图
function createTextures() {
    // 玩家飞机贴图
    const playerCanvas = document.createElement('canvas');
    playerCanvas.width = PLANE_WIDTH;
    playerCanvas.height = PLANE_HEIGHT;
    const playerCtx = playerCanvas.getContext('2d');
    
    // 机身
    const gradient1 = playerCtx.createLinearGradient(0, 0, 0, PLANE_HEIGHT);
    gradient1.addColorStop(0, '#4a90e2');
    gradient1.addColorStop(0.5, '#357abd');
    gradient1.addColorStop(1, '#2d5c88');
    playerCtx.fillStyle = gradient1;
    playerCtx.beginPath();
    playerCtx.moveTo(PLANE_WIDTH/2, 0);
    playerCtx.lineTo(PLANE_WIDTH*0.15, PLANE_HEIGHT*0.6);
    playerCtx.lineTo(PLANE_WIDTH*0.85, PLANE_HEIGHT*0.6);
    playerCtx.lineTo(PLANE_WIDTH, PLANE_HEIGHT);
    playerCtx.lineTo(0, PLANE_HEIGHT);
    playerCtx.closePath();
    playerCtx.fill();
    
    // 机翼
    playerCtx.fillStyle = '#2d5c88';
    playerCtx.fillRect(-5, PLANE_HEIGHT*0.25, 10, 12);
    playerCtx.fillRect(PLANE_WIDTH-5, PLANE_HEIGHT*0.25, 10, 12);
    
    // 驾驶舱
    playerCtx.fillStyle = '#87ceeb';
    playerCtx.beginPath();
    playerCtx.arc(PLANE_WIDTH/2, PLANE_HEIGHT*0.35, 8, 0, 2*Math.PI);
    playerCtx.fill();
    playerCtx.strokeStyle = '#2d5c88';
    playerCtx.lineWidth = 1;
    playerCtx.stroke();
    
    // 引擎尾焰
    playerCtx.fillStyle = '#ff4500';
    playerCtx.beginPath();
    playerCtx.moveTo(PLANE_WIDTH*0.25, PLANE_HEIGHT);
    playerCtx.lineTo(PLANE_WIDTH*0.35, PLANE_HEIGHT + 10);
    playerCtx.lineTo(PLANE_WIDTH*0.65, PLANE_HEIGHT + 10);
    playerCtx.lineTo(PLANE_WIDTH*0.75, PLANE_HEIGHT);
    playerCtx.closePath();
    playerCtx.fill();
    
    playerPlaneImg = playerCanvas;
    
    // 敌机贴图
    const enemyCanvas = document.createElement('canvas');
    enemyCanvas.width = ENEMY_WIDTH;
    enemyCanvas.height = ENEMY_HEIGHT;
    const enemyCtx = enemyCanvas.getContext('2d');
    
    // 敌机机身
    const gradient2 = enemyCtx.createLinearGradient(0, 0, 0, ENEMY_HEIGHT);
    gradient2.addColorStop(0, '#dc143c');
    gradient2.addColorStop(0.5, '#b22222');
    gradient2.addColorStop(1, '#8b0000');
    enemyCtx.fillStyle = gradient2;
    enemyCtx.beginPath();
    enemyCtx.moveTo(ENEMY_WIDTH/2, ENEMY_HEIGHT);
    enemyCtx.lineTo(ENEMY_WIDTH*0.15, ENEMY_HEIGHT*0.4);
    enemyCtx.lineTo(ENEMY_WIDTH*0.85, ENEMY_HEIGHT*0.4);
    enemyCtx.lineTo(0, 0);
    enemyCtx.lineTo(ENEMY_WIDTH, 0);
    enemyCtx.closePath();
    enemyCtx.fill();
    
    // 敌机装饰
    enemyCtx.fillStyle = '#8b0000';
    enemyCtx.fillRect(ENEMY_WIDTH/2 - 4, ENEMY_HEIGHT*0.3, 8, 15);
    
    // 敌机眼睛
    enemyCtx.fillStyle = '#fff';
    enemyCtx.beginPath();
    enemyCtx.arc(ENEMY_WIDTH*0.25, ENEMY_HEIGHT*0.5, 4, 0, 2*Math.PI);
    enemyCtx.arc(ENEMY_WIDTH*0.75, ENEMY_HEIGHT*0.5, 4, 0, 2*Math.PI);
    enemyCtx.fill();
    enemyCtx.fillStyle = '#000';
    enemyCtx.beginPath();
    enemyCtx.arc(ENEMY_WIDTH*0.25, ENEMY_HEIGHT*0.5, 2, 0, 2*Math.PI);
    enemyCtx.arc(ENEMY_WIDTH*0.75, ENEMY_HEIGHT*0.5, 2, 0, 2*Math.PI);
    enemyCtx.fill();
    
    enemyPlaneImg = enemyCanvas;
    
    // 子弹贴图
    const bulletCanvas = document.createElement('canvas');
    bulletCanvas.width = BULLET_WIDTH;
    bulletCanvas.height = BULLET_HEIGHT;
    const bulletCtx = bulletCanvas.getContext('2d');
    
    const gradient3 = bulletCtx.createRadialGradient(BULLET_WIDTH/2, BULLET_HEIGHT/2, 0, BULLET_WIDTH/2, BULLET_HEIGHT/2, BULLET_WIDTH/2);
    gradient3.addColorStop(0, '#fff');
    gradient3.addColorStop(0.3, '#ffd700');
    gradient3.addColorStop(0.7, '#ff8c00');
    gradient3.addColorStop(1, '#ff4500');
    bulletCtx.fillStyle = gradient3;
    bulletCtx.beginPath();
    bulletCtx.arc(BULLET_WIDTH/2, BULLET_HEIGHT/2, BULLET_WIDTH/2, 0, 2*Math.PI);
    bulletCtx.fill();
    
    // 子弹光晕
    bulletCtx.strokeStyle = '#ffd700';
    bulletCtx.lineWidth = 2;
    bulletCtx.beginPath();
    bulletCtx.arc(BULLET_WIDTH/2, BULLET_HEIGHT/2, BULLET_WIDTH/2 + 1, 0, 2*Math.PI);
    bulletCtx.stroke();
    
    bulletImg = bulletCanvas;
}

function startPlane() {
    plane = { x: PLANE_CANVAS_W/2 - PLANE_WIDTH/2, y: PLANE_CANVAS_H - PLANE_HEIGHT - 10 };
    bullets = [];
    enemies = [];
    planeScore = 0;
    planeGameOver = false;
    document.getElementById('plane-status').textContent = '';
    clearInterval(planeTimer);
    updatePlaneHighScore();
    createTextures(); // 创建贴图
    drawPlaneGame();
    planeTimer = setInterval(planeGameLoop, 20);
}

function planeGameLoop() {
    // 敌机生成
    if (Math.random() < 0.025) {
        let ex = Math.random() * (PLANE_CANVAS_W - ENEMY_WIDTH);
        enemies.push({x: ex, y: -ENEMY_HEIGHT});
    }
    // 敌机移动
    for (let e of enemies) e.y += 2.5;
    // 子弹移动
    for (let b of bullets) b.y -= 8;
    // 碰撞检测
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        // 敌机撞到飞机
        if (rectHit(e, ENEMY_WIDTH, ENEMY_HEIGHT, plane, PLANE_WIDTH, PLANE_HEIGHT)) {
            endPlane('游戏失败！');
            return;
        }
        // 敌机被子弹击中
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (rectHit(e, ENEMY_WIDTH, ENEMY_HEIGHT, b, BULLET_WIDTH, BULLET_HEIGHT)) {
                enemies.splice(i, 1);
                bullets.splice(j, 1);
                planeScore++;
                updatePlaneHighScore();
                break;
            }
        }
        // 敌机飞出底部
        if (e.y > PLANE_CANVAS_H) enemies.splice(i, 1);
    }
    // 子弹飞出顶部
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i].y < -BULLET_HEIGHT) bullets.splice(i, 1);
    }
    drawPlaneGame();
}

function drawPlaneGame() {
    const canvas = document.getElementById('plane-canvas');
    const ctx = canvas.getContext('2d');
    // 根据 CSS 宽度在移动端提高清晰度
    const cssWidth = Math.min(window.innerWidth * 0.92, PLANE_CANVAS_W);
    const ratio = cssWidth / PLANE_CANVAS_W;
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = Math.round(PLANE_CANVAS_H * ratio) + 'px';
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(PLANE_CANVAS_W * dpr * ratio);
    canvas.height = Math.round(PLANE_CANVAS_H * dpr * ratio);
    ctx.setTransform(dpr * ratio, 0, 0, dpr * ratio, 0, 0);
    ctx.clearRect(0, 0, PLANE_CANVAS_W, PLANE_CANVAS_H);
    
    // 画玩家飞机贴图
    ctx.drawImage(playerPlaneImg, plane.x, plane.y);
    
    // 画子弹贴图
    for (let b of bullets) {
        ctx.drawImage(bulletImg, b.x, b.y);
    }
    
    // 画敌机贴图
    for (let e of enemies) {
        ctx.drawImage(enemyPlaneImg, e.x, e.y);
    }
    
    // 显示分数
    const lang = window.currentLang || 'zh';
    const scoreLabel = (window.langMap && window.langMap[lang] && window.langMap[lang].labels.score) || '得分';
    document.getElementById('plane-status').textContent = scoreLabel + '：' + planeScore;
}

function endPlane(msg) {
    clearInterval(planeTimer);
    planeGameOver = true;
    const lang = window.currentLang || 'zh';
    const scoreLabel = (window.langMap && window.langMap[lang] && window.langMap[lang].labels.score) || '得分';
    document.getElementById('plane-status').textContent = msg + ' ' + scoreLabel + '：' + planeScore;
    updatePlaneHighScore();
}

function rectHit(a, aw, ah, b, bw, bh) {
    return a.x < b.x + bw && a.x + aw > b.x && a.y < b.y + bh && a.y + ah > b.y;
}

function updatePlaneHighScore() {
    let high = localStorage.getItem('planeHighScore') || 0;
    if (planeScore > high) {
        high = planeScore;
        localStorage.setItem('planeHighScore', high);
    }
    const lang = window.currentLang || 'zh';
    const highLabel = (window.langMap && window.langMap[lang] && window.langMap[lang].labels.highScore) || '最高分';
    document.getElementById('plane-highscore').textContent = ' ' + highLabel + '：' + high;
}

window.addEventListener('keydown', function(e) {
    if (document.getElementById('plane-section').style.display === 'none') return;
    if (planeGameOver) return;
    if (e.key === 'ArrowLeft') {
        plane.x -= 18;
        if (plane.x < 0) plane.x = 0;
    }
    if (e.key === 'ArrowRight') {
        plane.x += 18;
        if (plane.x > PLANE_CANVAS_W - PLANE_WIDTH) plane.x = PLANE_CANVAS_W - PLANE_WIDTH;
    }
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault(); // 阻止空格键触发页面滚动或按钮点击
        // 发射子弹
        bullets.push({x: plane.x + PLANE_WIDTH/2 - BULLET_WIDTH/2, y: plane.y - BULLET_HEIGHT});
    }
}, { passive: false }); 