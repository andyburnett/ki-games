/**
 * Custom Web Component Definition: ki-games-invaders
 * This file defines the entire Space Invaders game logic and registers the custom element.
 * It is designed to be loaded dynamically by ki-games-loader.js.
 */

// --- GAME CONSTANTS ---
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const INVADER_SPEED_X = 1;
const INVADER_SPEED_Y = 15;
const INVADER_COLS = 10;
const INVADER_ROWS = 4;
const INVADER_SIZE = 20;
const INVADER_PADDING = 10;
const INVADER_OFFSET_TOP = 40;
const INVADER_OFFSET_LEFT = 30;
const INVADER_FIRE_RATE = 0.99; // Chance (0 to 1) of an invader *not* firing per update

// --- KI GAMES INVADERS WEB COMPONENT CLASS ---
class KIGamesInvaders extends HTMLElement {
    constructor() {
        super();
        // 1. Create Shadow DOM for encapsulation
        this.attachShadow({ mode: 'open' });
        this.state = {
            player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30, width: 30, height: 10, lives: 3 },
            bullets: [],
            invaders: [],
            invaderBullets: [],
            keys: {},
            gameLoop: null,
            score: 0,
            isPaused: false,
            invaderDirection: 1, // 1 for right, -1 for left
            updateCounter: 0, // Used to slow down invader movement
            isGameOver: false,
        };

        // Bind event handlers
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
    }

    // Called when the element is added to the document's DOM
    connectedCallback() {
        this.render();
        this.initGame();
        this.setupEventListeners();
        this.state.gameLoop = requestAnimationFrame(this.gameLoop);
    }

    // Called when the element is removed from the document's DOM
    disconnectedCallback() {
        cancelAnimationFrame(this.state.gameLoop);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }

    // --- INITIALIZATION & RENDERING ---

    render() {
        // Inject CSS styles into the Shadow DOM
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: ${GAME_WIDTH}px;
                    height: ${GAME_HEIGHT}px;
                    border: 2px solid #00ff00;
                    background-color: #000000;
                    font-family: 'Courier New', Courier, monospace;
                    position: relative;
                }
                canvas {
                    display: block;
                }
                #overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    color: #00ff00;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    font-size: 24px;
                }
                #overlay button {
                    padding: 10px 20px;
                    margin-top: 20px;
                    background: #00ff00;
                    border: none;
                    color: #000000;
                    font-size: 20px;
                    cursor: pointer;
                }
            </style>
            <canvas id="gameCanvas" width="${GAME_WIDTH}" height="${GAME_HEIGHT}"></canvas>
            <div id="overlay" style="display: none;"></div>
        `;
        this.canvas = this.shadowRoot.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = this.shadowRoot.getElementById('overlay');
    }

    initGame() {
        this.state.player.x = GAME_WIDTH / 2;
        this.state.player.lives = 3;
        this.state.score = 0;
        this.state.bullets = [];
        this.state.invaderBullets = [];
        this.state.invaderDirection = 1;
        this.state.isGameOver = false;
        this.state.isPaused = false;
        this.createInvaders();
        this.hideOverlay();
    }

    createInvaders() {
        this.state.invaders = [];
        for (let c = 0; c < INVADER_COLS; c++) {
            for (let r = 0; r < INVADER_ROWS; r++) {
                const x = c * (INVADER_SIZE + INVADER_PADDING) + INVADER_OFFSET_LEFT;
                const y = r * (INVADER_SIZE + INVADER_PADDING) + INVADER_OFFSET_TOP;
                this.state.invaders.push({
                    x: x,
                    y: y,
                    width: INVADER_SIZE,
                    height: INVADER_SIZE,
                    type: r % 2 === 0 ? 'A' : 'B'
                });
            }
        }
    }

    // --- INPUT HANDLING ---

    setupEventListeners() {
        // Attach to the document for global input handling
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    handleKeyDown(event) {
        this.state.keys[event.code] = true;
        if (event.code === 'Space' && !this.state.isPaused) {
            this.fireBullet();
        }
        if (event.code === 'KeyP') {
            this.togglePause();
        }
        if (this.state.isGameOver && event.code === 'Enter') {
            this.initGame();
        }
    }

    handleKeyUp(event) {
        this.state.keys[event.code] = false;
    }

    fireBullet() {
        if (this.state.bullets.length < 2) {
            this.state.bullets.push({
                x: this.state.player.x + this.state.player.width / 2 - 1,
                y: this.state.player.y,
                width: 2,
                height: 6,
                color: '#00ff00'
            });
        }
    }

    // --- GAME LOGIC & UPDATE ---

    gameLoop() {
        if (!this.state.isPaused && !this.state.isGameOver) {
            this.update();
            this.draw();
        } else if (this.state.isGameOver) {
             this.draw();
             this.showGameOver();
        } else if (this.state.isPaused) {
             this.draw();
             this.showPause();
        }

        this.state.gameLoop = requestAnimationFrame(this.gameLoop);
    }

    update() {
        this.updatePlayer();
        this.updateBullets();
        this.updateInvaders();
        this.updateInvaderBullets();
        this.checkCollisions();
        this.checkWinCondition();
    }

    updatePlayer() {
        const player = this.state.player;
        if (this.state.keys['ArrowLeft'] || this.state.keys['KeyA']) {
            player.x -= PLAYER_SPEED;
        }
        if (this.state.keys['ArrowRight'] || this.state.keys['KeyD']) {
            player.x += PLAYER_SPEED;
        }

        if (player.x < 0) player.x = 0;
        if (player.x + player.width > GAME_WIDTH) player.x = GAME_WIDTH - player.width;
    }

    updateBullets() {
        this.state.bullets = this.state.bullets.map(b => ({ ...b, y: b.y - BULLET_SPEED }))
                                            .filter(b => b.y > 0);

        this.state.invaderBullets = this.state.invaderBullets
            .map(b => ({ ...b, y: b.y + BULLET_SPEED / 2 }))
            .filter(b => b.y < GAME_HEIGHT);
    }

    updateInvaders() {
        this.state.updateCounter++;
        if (this.state.updateCounter % 25 !== 0) {
            this.invaderFire();
            return;
        }
        this.state.updateCounter = 0;

        let needsChangeDirection = false;
        
        for (const invader of this.state.invaders) {
            if (invader.x + invader.width + INVADER_SPEED_X * this.state.invaderDirection > GAME_WIDTH ||
                invader.x + INVADER_SPEED_X * this.state.invaderDirection < 0) {
                needsChangeDirection = true;
                break;
            }
        }

        if (needsChangeDirection) {
            this.state.invaderDirection *= -1;
            for (const invader of this.state.invaders) {
                invader.y += INVADER_SPEED_Y;
                if (invader.y + invader.height >= this.state.player.y) {
                    this.state.isGameOver = true;
                }
            }
        } else {
            for (const invader of this.state.invaders) {
                invader.x += INVADER_SPEED_X * this.state.invaderDirection;
            }
        }
        
        this.invaderFire();
    }

    invaderFire() {
        if (Math.random() > INVADER_FIRE_RATE && this.state.invaders.length > 0) {
            const shooter = this.state.invaders[Math.floor(Math.random() * this.state.invaders.length)];
            this.state.invaderBullets.push({
                x: shooter.x + shooter.width / 2 - 1,
                y: shooter.y + shooter.height,
                width: 2,
                height: 8,
                color: '#ff0000'
            });
        }
    }

    // --- COLLISION DETECTION ---

    checkCollisions() {
        this.state.bullets.forEach((bullet) => {
            this.state.invaders.forEach((invader) => {
                if (this.isColliding(bullet, invader)) {
                    bullet.hit = true;
                    invader.hit = true;
                    this.state.score += 10;
                }
            });
        });

        this.state.bullets = this.state.bullets.filter(b => !b.hit);
        this.state.invaders = this.state.invaders.filter(i => !i.hit);

        this.state.invaderBullets.forEach((bullet) => {
            if (this.isColliding(bullet, this.state.player)) {
                bullet.hit = true;
                this.state.player.lives--;
                if (this.state.player.lives <= 0) {
                    this.state.isGameOver = true;
                }
            }
        });

        this.state.invaderBullets = this.state.invaderBullets.filter(b => !b.hit);
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    checkWinCondition() {
        if (this.state.invaders.length === 0) {
            this.state.isGameOver = true;
            this.state.win = true;
        }
    }

    // --- DRAWING ---

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        this.drawPlayer(ctx);
        this.drawInvaders(ctx);
        this.drawBullets(ctx);
        this.drawUI(ctx);
    }

    drawPlayer(ctx) {
        const p = this.state.player;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.beginPath();
        ctx.moveTo(p.x + p.width / 2, p.y);
        ctx.lineTo(p.x + p.width / 2 + 3, p.y - 5);
        ctx.lineTo(p.x + p.width / 2 - 3, p.y - 5);
        ctx.fill();
    }

    drawInvaders(ctx) {
        this.state.invaders.forEach(i => {
            ctx.fillStyle = i.type === 'A' ? '#ff00ff' : '#00ffff';
            ctx.fillRect(i.x, i.y, i.width, i.height);
            ctx.fillStyle = '#000000';
            ctx.fillRect(i.x + 5, i.y + 5, 10, 10);
        });
    }

    drawBullets(ctx) {
        this.state.bullets.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.width, b.height);
        });
        this.state.invaderBullets.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.width, b.height);
        });
    }

    drawUI(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Courier New';
        ctx.fillText(`SCORE: ${this.state.score}`, 10, 20);
        ctx.fillText(`LIVES: ${this.state.player.lives}`, GAME_WIDTH - 80, 20);
    }

    // --- OVERLAY/STATE METHODS ---

    showPause() {
        this.overlay.style.display = 'flex';
        this.overlay.innerHTML = `
            <h1>PAUSED</h1>
            <p>Press 'P' to resume.</p>
            <p>Controls: Arrows/A/D to Move, Space to Fire</p>
        `;
    }

    showGameOver() {
        this.overlay.style.display = 'flex';
        const message = this.state.win ? 'YOU WIN!' : 'GAME OVER';
        this.overlay.innerHTML = `
            <h1>${message}</h1>
            <p>Final Score: ${this.state.score}</p>
            <p>Press 'Enter' to play again!</p>
        `;
    }

    hideOverlay() {
        this.overlay.style.display = 'none';
    }

    togglePause() {
        this.state.isPaused = !this.state.isPaused;
        if (this.state.isPaused) {
            this.showPause();
        } else {
            this.hideOverlay();
        }
    }
}

// Register the custom element
customElements.define('ki-games-invaders', KIGamesInvaders);
