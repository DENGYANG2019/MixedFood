// Quantum Attack Game
// A game where players defend against quantum particles using quantum mechanics

class QuantumAttack {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameRunning = false;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.particles = [];
        this.player = null;
        this.quantumFields = [];
        this.lasers = [];
        this.powerUps = [];
        this.animationId = null;
        this.keys = {};
        this.lastTime = 0;
        this.spawnTimer = 0;
        this.fieldTimer = 0;
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.highScore = parseInt(localStorage.getItem('quantum-attack-highscore') || '0');
        
        // Quantum states
        this.quantumStates = ['spin-up', 'spin-down', 'superposition', 'entangled'];
        this.playerState = 'superposition';
        
        // Game settings
        this.settings = {
            particleSpeed: 2,
            spawnRate: 2000, // milliseconds
            fieldDuration: 5000,
            laserSpeed: 8,
            playerSpeed: 5
        };
    }

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize player
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 30,
            height: 30,
            state: 'superposition',
            energy: 100
        };
        
        this.setupEventListeners();
        this.gameLoop();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (this.gameState === 'playing') {
                switch(e.code) {
                    case 'Space':
                        e.preventDefault();
                        this.fireLaser();
                        break;
                    case 'KeyQ':
                        this.changeQuantumState('spin-up');
                        break;
                    case 'KeyW':
                        this.changeQuantumState('spin-down');
                        break;
                    case 'KeyE':
                        this.changeQuantumState('superposition');
                        break;
                    case 'KeyR':
                        this.changeQuantumState('entangled');
                        break;
                    case 'KeyF':
                        this.createQuantumField();
                        break;
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Touch controls for mobile/iPad
        this.setupTouchControls();
    }

    setupTouchControls() {
        // Touch/swipe handling for player movement
        let touchStartX = 0;
        let touchStartY = 0;
        let isTouching = false;

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameState !== 'playing') return;
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            touchStartX = touch.clientX - rect.left;
            touchStartY = touch.clientY - rect.top;
            isTouching = true;
            
            // Fire laser on tap
            this.fireLaser();
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.gameState !== 'playing' || !isTouching) return;
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const currentX = touch.clientX - rect.left;
            const currentY = touch.clientY - rect.top;
            
            // Move player based on touch position
            const canvasX = currentX * (this.canvas.width / rect.width);
            this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, canvasX - this.player.width / 2));
            
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            isTouching = false;
        }, { passive: false });

        // Virtual button handlers
        this.setupVirtualButtons();
    }

    setupVirtualButtons() {
        // Add event listeners for virtual buttons when they're created
        const addButtonListener = (id, action) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (this.gameState === 'playing') {
                        action();
                    }
                }, { passive: false });
                
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.gameState === 'playing') {
                        action();
                    }
                });
            }
        };

        // Wait for DOM to be ready and add listeners
        setTimeout(() => {
            addButtonListener('quantum-fire-btn', () => this.fireLaser());
            addButtonListener('quantum-field-btn', () => this.createQuantumField());
            addButtonListener('quantum-state-up', () => this.changeQuantumState('spin-up'));
            addButtonListener('quantum-state-down', () => this.changeQuantumState('spin-down'));
            addButtonListener('quantum-state-super', () => this.changeQuantumState('superposition'));
            addButtonListener('quantum-state-entangled', () => this.changeQuantumState('entangled'));
        }, 100);
    }

    start() {
        this.gameState = 'playing';
        this.gameRunning = true;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.particles = [];
        this.lasers = [];
        this.quantumFields = [];
        this.powerUps = [];
        this.spawnTimer = 0;
        this.fieldTimer = 0;
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 50;
        this.player.energy = 100;
        this.playerState = 'superposition';
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

    changeQuantumState(newState) {
        if (this.player.energy >= 10) {
            this.playerState = newState;
            this.player.state = newState;
            this.player.energy -= 10;
        }
    }

    createQuantumField() {
        if (this.player.energy >= 30 && this.quantumFields.length < 3) {
            this.quantumFields.push({
                x: this.player.x,
                y: this.player.y - 50,
                radius: 0,
                maxRadius: 80,
                duration: this.settings.fieldDuration,
                type: this.playerState,
                alpha: 0.7
            });
            this.player.energy -= 30;
        }
    }

    fireLaser() {
        if (this.player.energy >= 5) {
            this.lasers.push({
                x: this.player.x,
                y: this.player.y,
                width: 4,
                height: 15,
                speed: this.settings.laserSpeed,
                state: this.playerState
            });
            this.player.energy -= 5;
        }
    }

    spawnParticle() {
        const states = this.quantumStates;
        const state = states[Math.floor(Math.random() * states.length)];
        
        this.particles.push({
            x: Math.random() * (this.canvas.width - 20),
            y: -20,
            width: 15,
            height: 15,
            speed: this.settings.particleSpeed + Math.random() * 2,
            state: state,
            health: state === 'entangled' ? 3 : 1,
            oscillation: Math.random() * Math.PI * 2
        });
    }

    spawnPowerUp() {
        if (Math.random() < 0.3) {
            this.powerUps.push({
                x: Math.random() * (this.canvas.width - 20),
                y: -20,
                width: 12,
                height: 12,
                speed: 1,
                type: Math.random() < 0.5 ? 'energy' : 'life'
            });
        }
    }

    update(deltaTime) {
        if (!this.gameRunning) return;

        // Update player movement
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x = Math.max(0, this.player.x - this.settings.playerSpeed);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + this.settings.playerSpeed);
        }

        // Regenerate energy slowly
        if (this.player.energy < 100) {
            this.player.energy += deltaTime * 0.02;
            this.player.energy = Math.min(100, this.player.energy);
        }

        // Spawn particles
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.settings.spawnRate) {
            this.spawnParticle();
            this.spawnTimer = 0;
            
            // Occasionally spawn power-ups
            if (Math.random() < 0.2) {
                this.spawnPowerUp();
            }
        }

        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.y += particle.speed;
            particle.oscillation += deltaTime * 0.003;
            
            // Quantum superposition effect
            if (particle.state === 'superposition') {
                particle.x += Math.sin(particle.oscillation) * 0.5;
            }
            
            // Remove particles that are off screen
            if (particle.y > this.canvas.height + 20) {
                this.lives--;
                if (this.lives <= 0) {
                    this.stop();
                }
                return false;
            }
            
            return true;
        });

        // Update lasers
        this.lasers = this.lasers.filter(laser => {
            laser.y -= laser.speed;
            return laser.y > -laser.height;
        });

        // Update quantum fields
        this.quantumFields = this.quantumFields.filter(field => {
            field.duration -= deltaTime;
            field.radius = Math.min(field.maxRadius, field.radius + deltaTime * 0.1);
            field.alpha = Math.max(0, field.duration / this.settings.fieldDuration * 0.7);
            return field.duration > 0;
        });

        // Update power-ups
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.y += powerUp.speed;
            return powerUp.y < this.canvas.height + 20;
        });

        // Check collisions
        this.checkCollisions();

        // Level progression
        if (this.score > this.level * 1000) {
            this.level++;
            this.settings.particleSpeed += 0.5;
            this.settings.spawnRate = Math.max(1000, this.settings.spawnRate - 100);
        }

        this.updateUI();
    }

    checkCollisions() {
        // Laser vs Particles
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            
            for (let j = this.particles.length - 1; j >= 0; j--) {
                const particle = this.particles[j];
                
                if (this.isColliding(laser, particle)) {
                    // Quantum mechanics: matching states do double damage
                    let damage = 1;
                    if (laser.state === particle.state) {
                        damage = 2;
                        this.score += 50; // Bonus for quantum resonance
                    }
                    
                    particle.health -= damage;
                    this.score += 10;
                    
                    if (particle.health <= 0) {
                        this.particles.splice(j, 1);
                        this.score += 20;
                    }
                    
                    this.lasers.splice(i, 1);
                    break;
                }
            }
        }

        // Quantum Field vs Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            for (const field of this.quantumFields) {
                const dx = particle.x - field.x;
                const dy = particle.y - field.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < field.radius) {
                    if (field.type === particle.state || field.type === 'superposition') {
                        this.particles.splice(i, 1);
                        this.score += 30;
                        break;
                    }
                }
            }
        }

        // Player vs PowerUps
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            
            if (this.isColliding(this.player, powerUp)) {
                if (powerUp.type === 'energy') {
                    this.player.energy = Math.min(100, this.player.energy + 30);
                } else if (powerUp.type === 'life') {
                    this.lives = Math.min(5, this.lives + 1);
                }
                this.powerUps.splice(i, 1);
            }
        }

        // Player vs Particles (collision damage)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            if (this.isColliding(this.player, particle)) {
                // Quantum state matching reduces damage
                if (this.playerState === particle.state) {
                    this.score += 10; // Bonus for quantum harmony
                } else {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.stop();
                        return;
                    }
                }
                this.particles.splice(i, 1);
            }
        }
    }

    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameState === 'menu') {
            this.renderMenu();
            return;
        }

        if (this.gameState === 'gameOver') {
            this.renderGameOver();
            return;
        }

        // Draw quantum fields
        for (const field of this.quantumFields) {
            this.ctx.save();
            this.ctx.globalAlpha = field.alpha;
            this.ctx.strokeStyle = this.getStateColor(field.type);
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }

        // Draw particles
        for (const particle of this.particles) {
            this.ctx.fillStyle = this.getStateColor(particle.state);
            
            if (particle.state === 'superposition') {
                // Flickering effect for superposition
                this.ctx.globalAlpha = 0.5 + 0.5 * Math.sin(particle.oscillation * 10);
            } else {
                this.ctx.globalAlpha = 1;
            }
            
            this.ctx.fillRect(particle.x, particle.y, particle.width, particle.height);
            
            // Draw quantum state symbol
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.getStateSymbol(particle.state), 
                particle.x + particle.width/2, particle.y + particle.height/2 + 3);
        }

        // Draw lasers
        this.ctx.globalAlpha = 1;
        for (const laser of this.lasers) {
            this.ctx.fillStyle = this.getStateColor(laser.state);
            this.ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
        }

        // Draw power-ups
        for (const powerUp of this.powerUps) {
            this.ctx.fillStyle = powerUp.type === 'energy' ? '#00ff00' : '#ff00ff';
            this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(powerUp.type === 'energy' ? 'E' : '+', 
                powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + 2);
        }

        // Draw player
        this.ctx.fillStyle = this.getStateColor(this.playerState);
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Player state indicator
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.getStateSymbol(this.playerState), 
            this.player.x + this.player.width/2, this.player.y + this.player.height/2 + 4);

        // Energy bar
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(this.player.x - 5, this.player.y - 15, 40, 8);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(this.player.x - 5, this.player.y - 15, 40 * (this.player.energy / 100), 8);

        if (this.gameState === 'paused') {
            this.renderPause();
        }
    }

    renderMenu() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Quantum Attack', this.canvas.width/2, this.canvas.height/2 - 50);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Controls:', this.canvas.width/2, this.canvas.height/2 - 10);
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Arrow Keys: Move', this.canvas.width/2, this.canvas.height/2 + 10);
        this.ctx.fillText('Space: Fire Laser', this.canvas.width/2, this.canvas.height/2 + 25);
        this.ctx.fillText('Q/W/E/R: Change Quantum State', this.canvas.width/2, this.canvas.height/2 + 40);
        this.ctx.fillText('F: Create Quantum Field', this.canvas.width/2, this.canvas.height/2 + 55);
    }

    renderGameOver() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over', this.canvas.width/2, this.canvas.height/2 - 30);
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width/2, this.canvas.height/2);
        this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width/2, this.canvas.height/2 + 20);
    }

    renderPause() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width/2, this.canvas.height/2);
    }

    getStateColor(state) {
        switch(state) {
            case 'spin-up': return '#ff0000';
            case 'spin-down': return '#0000ff';
            case 'superposition': return '#ffff00';
            case 'entangled': return '#ff00ff';
            default: return '#ffffff';
        }
    }

    getStateSymbol(state) {
        switch(state) {
            case 'spin-up': return '↑';
            case 'spin-down': return '↓';
            case 'superposition': return '⟡';
            case 'entangled': return '∞';
            default: return '?';
        }
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
                statusElement.textContent = `${labels.score}: ${this.score} | ${this.getLevelText()}: ${this.level} | ${this.getLivesText()}: ${this.lives}`;
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

    getLivesText() {
        const lang = window.currentLang || 'zh';
        switch(lang) {
            case 'en': return 'Lives';
            case 'ja': return 'ライフ';
            default: return '生命';
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
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
