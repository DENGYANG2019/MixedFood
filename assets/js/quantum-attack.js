// Quantum Attack - Block Puzzle Game
// A game where players control two frames to swap blocks and clear lines

class QuantumAttack {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameRunning = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameState = 'title'; // title, playing, paused, gameOver
        this.highScore = parseInt(localStorage.getItem('quantum-attack-highscore') || '0');
        
        // Game grid
        this.gridWidth = 8;
        this.gridHeight = 16;
        this.grid = [];
        this.blockSize = 25;
        
        // Two frames for block swapping (side by side)
        this.frameX = 2; // horizontal position (0-6)
        this.frameY = 10; // vertical position (0-14)
        this.activeFrame = 0; // 0 = left frame, 1 = right frame
        
        // Block types with quantum logic gates (lighter colors)
        this.blockTypes = [
            { color: '#ff8888', symbol: '●', value: 1, quantumGate: '＋' }, // Light Red - CNOT Gate
            { color: '#8888ff', symbol: '■', value: 2, quantumGate: 'H' }, // Light Blue - Hadamard Gate
            { color: '#ffff88', symbol: '◆', value: 3, quantumGate: 'S' }, // Light Yellow - S Gate
            { color: '#ff88ff', symbol: '▲', value: 4, quantumGate: 'T' }, // Light Magenta - T Gate
            { color: '#88ff88', symbol: '★', value: 5, quantumGate: 'Z' }, // Light Green - Pauli-Z Gate
            { color: '#ffaa88', symbol: '♦', value: 6, quantumGate: 'Y' }  // Light Orange - Pauli-Y Gate
        ];
        
        // Game timing
        this.dropTimer = 0;
        this.dropInterval = 1000; // milliseconds
        this.lastTime = 0;
        
        this.animationId = null;
        this.keys = {};
    }

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize grid
        this.initGrid();
        this.setupEventListeners();
        this.gameLoop();
    }

    initGrid() {
        this.grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = 0; // 0 = empty
            }
        }
        
        // Add some initial random quantum gate blocks at the bottom
        for (let y = this.gridHeight - 4; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (Math.random() < 0.7) {
                    this.grid[y][x] = Math.floor(Math.random() * this.blockTypes.length) + 1;
                }
            }
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (this.gameState === 'title' && e.code === 'Space') {
                this.start();
                e.preventDefault();
                return;
            }
            
            if (this.gameState === 'playing') {
                switch(e.code) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.moveFrameHorizontal(-1);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.moveFrameHorizontal(1);
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        this.moveFrameVertical(-1);
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        this.moveFrameVertical(1);
                        break;
                    case 'KeyA':
                        e.preventDefault();
                        this.switchFrame();
                        break;
                    case 'Space':
                        e.preventDefault();
                        this.swapBlocks();
                        break;
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Touch controls
        this.setupTouchControls();
    }

    setupTouchControls() {
        // Canvas touch handling
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState === 'title') {
                this.start();
                return;
            }
            
            if (this.gameState !== 'playing') return;
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            // Determine action based on touch position
            const offsetX = 50;
            const offsetY = 50;
            const framePixelX = offsetX + this.frameX * this.blockSize;
            const framePixelY = offsetY + this.frameY * this.blockSize;
            
            if (x >= framePixelX && x <= framePixelX + this.blockSize * 2 && 
                y >= framePixelY && y <= framePixelY + this.blockSize) {
                // Touched the frame area - swap blocks
                this.swapBlocks();
            } else if (x < this.canvas.width / 3) {
                // Left area - move left
                this.moveFrameHorizontal(-1);
            } else if (x > this.canvas.width * 2 / 3) {
                // Right area - move right
                this.moveFrameHorizontal(1);
            } else if (y < this.canvas.height / 2) {
                // Top area - move up
                this.moveFrameVertical(-1);
            } else {
                // Bottom area - move down
                this.moveFrameVertical(1);
            }
        }, { passive: false });

        // Virtual button handlers
        this.setupVirtualButtons();
    }

    setupVirtualButtons() {
        const addButtonListener = (id, action) => {
            const button = document.getElementById(id);
            if (button) {
                const handler = (e) => {
                    e.preventDefault();
                    if (this.gameState === 'playing') {
                        action();
                    }
                };
                
                button.addEventListener('touchstart', handler, { passive: false });
                button.addEventListener('click', handler);
            }
        };

        setTimeout(() => {
            addButtonListener('quantum-move-up', () => this.moveFrameVertical(-1));
            addButtonListener('quantum-move-down', () => this.moveFrameVertical(1));
            addButtonListener('quantum-move-left', () => this.moveFrameHorizontal(-1));
            addButtonListener('quantum-move-right', () => this.moveFrameHorizontal(1));
            addButtonListener('quantum-switch-frame', () => this.switchFrame());
            addButtonListener('quantum-swap-blocks', () => this.swapBlocks());
        }, 100);
    }

    start() {
        this.gameState = 'playing';
        this.gameRunning = true;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.frameX = 2;
        this.frameY = 10;
        this.activeFrame = 0;
        this.dropTimer = 0;
        this.initGrid();
        this.updateUI();
    }

    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.gameRunning = false;
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.gameRunning = true;
        }
    }

    stop() {
        this.gameState = 'gameOver';
        this.gameRunning = false;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('quantum-attack-highscore', this.highScore.toString());
        }
        this.updateUI();
    }

    moveFrameHorizontal(direction) {
        this.frameX = Math.max(0, Math.min(this.gridWidth - 2, this.frameX + direction));
    }

    moveFrameVertical(direction) {
        this.frameY = Math.max(0, Math.min(this.gridHeight - 2, this.frameY + direction));
    }

    switchFrame() {
        this.activeFrame = this.activeFrame === 0 ? 1 : 0;
    }

    swapBlocks() {
        const leftX = this.frameX;
        const rightX = this.frameX + 1;
        const y = this.frameY;
        
        // Always swap the two adjacent blocks horizontally (left square with right square)
        if (leftX >= 0 && rightX < this.gridWidth && y >= 0 && y < this.gridHeight) {
            const temp = this.grid[y][leftX];
            this.grid[y][leftX] = this.grid[y][rightX];
            this.grid[y][rightX] = temp;
            
            // Check for matches after swap
            setTimeout(() => this.checkMatches(), 100);
        }
    }



    checkMatches() {
        let hasMatches = false;
        const toRemove = [];
        
        // Check vertical matches (3 or more in a column)
        for (let x = 0; x < this.gridWidth; x++) {
            let count = 1;
            let currentType = this.grid[this.gridHeight - 1][x];
            
            for (let y = this.gridHeight - 2; y >= 0; y--) {
                if (this.grid[y][x] === currentType && currentType !== 0) {
                    count++;
                } else {
                    if (count >= 3 && currentType !== 0) {
                        // Mark blocks for removal
                        for (let i = 0; i < count; i++) {
                            toRemove.push({x: x, y: y + 1 + i});
                        }
                        hasMatches = true;
                    }
                    count = 1;
                    currentType = this.grid[y][x];
                }
            }
            
            // Check the last sequence
            if (count >= 3 && currentType !== 0) {
                for (let i = 0; i < count; i++) {
                    toRemove.push({x: x, y: i});
                }
                hasMatches = true;
            }
        }
        
        // Remove matched blocks
        if (hasMatches) {
            toRemove.forEach(pos => {
                this.grid[pos.y][pos.x] = 0;
            });
            
            this.score += toRemove.length * 100;
            this.lines += Math.floor(toRemove.length / 3);
            
            // Drop blocks down
            setTimeout(() => {
                this.dropBlocks();
                // Check for chain reactions
                setTimeout(() => this.checkMatches(), 200);
            }, 300);
        }
    }

    dropBlocks() {
        for (let x = 0; x < this.gridWidth; x++) {
            // Collect non-empty blocks from bottom to top
            const column = [];
            for (let y = this.gridHeight - 1; y >= 0; y--) {
                if (this.grid[y][x] !== 0) {
                    column.push(this.grid[y][x]);
                }
            }
            
            // Clear the column
            for (let y = 0; y < this.gridHeight; y++) {
                this.grid[y][x] = 0;
            }
            
            // Place blocks from bottom
            for (let i = 0; i < column.length; i++) {
                this.grid[this.gridHeight - 1 - i][x] = column[i];
            }
        }
    }

    addNewRow() {
        // Check if game over (top row has blocks)
        for (let x = 0; x < this.gridWidth; x++) {
            if (this.grid[0][x] !== 0) {
                this.stop();
                return;
            }
        }
        
        // Shift all rows up
        for (let y = 0; y < this.gridHeight - 1; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = this.grid[y + 1][x];
            }
        }
        
        // Add new bottom row
        for (let x = 0; x < this.gridWidth; x++) {
            if (Math.random() < 0.8) {
                this.grid[this.gridHeight - 1][x] = Math.floor(Math.random() * this.blockTypes.length) + 1;
            } else {
                this.grid[this.gridHeight - 1][x] = 0;
            }
        }
    }

    update(deltaTime) {
        if (!this.gameRunning) return;

        // Add new rows periodically
        this.dropTimer += deltaTime;
        if (this.dropTimer >= this.dropInterval) {
            this.addNewRow();
            this.dropTimer = 0;
            
            // Increase speed with level
            if (this.lines >= this.level * 10) {
                this.level++;
                this.dropInterval = Math.max(500, this.dropInterval - 50);
            }
        }

        this.updateUI();
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameState === 'title') {
            this.renderTitle();
            return;
        }

        if (this.gameState === 'gameOver') {
            this.renderGameOver();
            return;
        }

        // Draw grid
        const offsetX = 50;
        const offsetY = 50;
        
        // Draw blocks
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const blockType = this.grid[y][x];
                if (blockType > 0) {
                    const block = this.blockTypes[blockType - 1];
                    this.ctx.fillStyle = block.color;
                    this.ctx.fillRect(
                        offsetX + x * this.blockSize,
                        offsetY + y * this.blockSize,
                        this.blockSize - 1,
                        this.blockSize - 1
                    );
                    
                    // Draw quantum gate symbol
                    this.ctx.fillStyle = '#000000';
                    this.ctx.font = 'bold 12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(
                        block.quantumGate,
                        offsetX + x * this.blockSize + this.blockSize / 2,
                        offsetY + y * this.blockSize + this.blockSize / 2 + 4
                    );
                }
            }
        }
        
        // Draw grid lines
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(offsetX + x * this.blockSize, offsetY);
            this.ctx.lineTo(offsetX + x * this.blockSize, offsetY + this.gridHeight * this.blockSize);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(offsetX, offsetY + y * this.blockSize);
            this.ctx.lineTo(offsetX + this.gridWidth * this.blockSize, offsetY + y * this.blockSize);
            this.ctx.stroke();
        }

        // Draw frames - two adjacent squares
        const framePixelX = offsetX + this.frameX * this.blockSize;
        const framePixelY = offsetY + this.frameY * this.blockSize;
        
        // Draw left square frame
        this.ctx.strokeStyle = this.activeFrame === 0 ? '#00ff00' : '#888888';
        this.ctx.lineWidth = this.activeFrame === 0 ? 4 : 2;
        this.ctx.strokeRect(framePixelX, framePixelY, this.blockSize, this.blockSize);
        
        // Draw right square frame (adjacent to left)
        this.ctx.strokeStyle = this.activeFrame === 1 ? '#00ff00' : '#888888';
        this.ctx.lineWidth = this.activeFrame === 1 ? 4 : 2;
        this.ctx.strokeRect(framePixelX + this.blockSize, framePixelY, this.blockSize, this.blockSize);
        
        // Draw connecting line between frames
        this.ctx.strokeStyle = '#88ff88';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(framePixelX + this.blockSize, framePixelY + this.blockSize / 4);
        this.ctx.lineTo(framePixelX + this.blockSize, framePixelY + this.blockSize * 3 / 4);
        this.ctx.stroke();
        
        // Draw frame indicators
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        
        // Active frame indicator
        if (this.activeFrame === 0) {
            this.ctx.fillText('L', framePixelX + this.blockSize / 2, framePixelY - 5);
        } else {
            this.ctx.fillText('R', framePixelX + this.blockSize * 1.5, framePixelY - 5);
        }
        
        // Swap arrow indicator
        this.ctx.font = '14px Arial';
        this.ctx.fillText('⇄', framePixelX + this.blockSize, framePixelY - 8);

        if (this.gameState === 'paused') {
            this.renderPause();
        }
    }

    renderTitle() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('クアントアタック', this.canvas.width/2, this.canvas.height/2 - 60);
        
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Quantum Gate Puzzle', this.canvas.width/2, this.canvas.height/2 - 20);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Press SPACE or TAP to Start', this.canvas.width/2, this.canvas.height/2 + 20);
        
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Arrange quantum gates, clear vertical lines!', this.canvas.width/2, this.canvas.height/2 + 50);
        this.ctx.fillText('Gates: ＋ H S T Z Y - Move & swap to match!', this.canvas.width/2, this.canvas.height/2 + 70);
    }

    renderGameOver() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width/2, this.canvas.height/2 - 30);
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width/2, this.canvas.height/2);
        this.ctx.fillText(`Lines: ${this.lines}`, this.canvas.width/2, this.canvas.height/2 + 20);
        this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width/2, this.canvas.height/2 + 40);
    }

    renderPause() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width/2, this.canvas.height/2);
    }

    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    updateUI() {
        const lang = window.currentLang || 'zh';
        const labels = window.langMap[lang].labels;
        
        const statusElement = document.getElementById('quantum-status');
        if (statusElement) {
            if (this.gameState === 'playing') {
                statusElement.textContent = `${labels.score}: ${this.score} | ${this.getLevelText()}: ${this.level} | ${this.getLinesText()}: ${this.lines}`;
            } else if (this.gameState === 'gameOver') {
                statusElement.textContent = `${labels.gameOver} ${labels.score}: ${this.score}`;
            }
        }

        const highScoreElement = document.getElementById('quantum-highscore');
        if (highScoreElement) {
            highScoreElement.textContent = `${labels.highScore}: ${this.highScore}`;
        }
    }

    getLevelText() {
        const lang = window.currentLang || 'zh';
        switch(lang) {
            case 'en': return 'Level';
            case 'ja': return 'レベル';
            default: return '等级';
        }
    }

    getLinesText() {
        const lang = window.currentLang || 'zh';
        switch(lang) {
            case 'en': return 'Lines';
            case 'ja': return 'ライン';
            default: return '行数';
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Global game instance
let quantumGame = null;

function startQuantumAttack() {
    if (!quantumGame) {
        quantumGame = new QuantumAttack();
        quantumGame.init('quantum-canvas');
    }
    quantumGame.start();
}

function pauseQuantumAttack() {
    if (quantumGame) {
        quantumGame.pause();
    }
}

function resetQuantumAttack() {
    if (quantumGame) {
        quantumGame.stop();
        quantumGame.start();
    }
}