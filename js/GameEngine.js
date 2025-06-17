class GameEngine {
    constructor() {
        this.gameState = {
            board: this.createEmptyBoard(),
            currentPiece: null,
            nextPieces: [],
            score: 0,
            lines: 0,
            level: 1,
            isGameOver: false,
            isPaused: false
        };
        
        // Game timing
        this.lastTime = 0;
        this.fallTimer = 0;
        this.fallSpeed = GAME_CONFIG.BASE_FALL_SPEED;
        
        // Tetromino factory for piece generation
        this.tetrominoFactory = new TetrominoFactory();
        
        // Components
        this.renderer = null;
        this.inputHandler = null;
        this.audioManager = null;
        
        // High score persistence
        this.highScore = Utils.getStoredValue('tetris_high_score', 0);
        
        // Animation frame ID
        this.animationId = null;
        
        // Initialize game
        this.initialize();
    }
    
    initialize() {
        // Create initial pieces
        this.spawnNewPiece();
        this.updateNextPieces();
        
        // Update UI
        this.updateUI();
    }
    
    // Create empty game board
    createEmptyBoard() {
        const board = [];
        const totalHeight = GAME_CONFIG.BOARD_HEIGHT + GAME_CONFIG.BUFFER_HEIGHT;
        
        for (let y = 0; y < totalHeight; y++) {
            board[y] = new Array(GAME_CONFIG.BOARD_WIDTH).fill(null);
        }
        
        return board;
    }
    
    // Start the game loop
    start() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.lastTime = performance.now();
        this.gameLoop();

        // Start background music with retry mechanism
        this.startBackgroundMusicWithRetry();
    }

    // Start background music with retry mechanism
    startBackgroundMusicWithRetry() {
        if (this.audioManager && this.audioManager.isInitialized) {
            this.audioManager.startBackgroundMusic();
            console.log('Background music started from GameEngine');
        } else {
            // Retry after a short delay if audio manager isn't ready
            setTimeout(() => {
                if (this.audioManager && this.audioManager.isInitialized) {
                    this.audioManager.startBackgroundMusic();
                    console.log('Background music started from GameEngine (retry)');
                }
            }, 1000);
        }
    }
    
    // Main game loop
    gameLoop(currentTime = performance.now()) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Cap delta time to prevent large jumps
        const cappedDeltaTime = Math.min(deltaTime, 50);

        if (!this.gameState.isPaused && !this.gameState.isGameOver) {
            this.update(cappedDeltaTime);
        }

        this.render();

        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    // Update game state
    update(deltaTime) {
        // Update input handler
        if (this.inputHandler) {
            this.inputHandler.update(deltaTime);
        }
        
        // Update piece falling
        this.updateFalling(deltaTime);
        
        // Update current piece lock timer
        if (this.gameState.currentPiece) {
            const shouldLock = this.gameState.currentPiece.updateLockTimer(deltaTime, this.gameState.board);
            if (shouldLock) {
                this.lockPiece();
            }
        }
    }
    
    // Update piece falling logic
    updateFalling(deltaTime) {
        if (!this.gameState.currentPiece) return;

        this.fallTimer += deltaTime;

        if (this.fallTimer >= this.fallSpeed) {
            if (this.gameState.currentPiece.moveDown(this.gameState.board)) {
                // Piece moved down successfully
                this.fallTimer = 0;
            } else {
                // Piece can't move down - it will be handled by lock timer
                this.fallTimer = 0;
            }
        }
    }
    
    // Spawn a new piece
    spawnNewPiece() {
        // Get next piece from factory
        const nextPiece = this.tetrominoFactory.getNext();
        this.gameState.currentPiece = nextPiece;

        // Check for game over
        if (!Utils.isValidPosition(
            this.gameState.board,
            this.gameState.currentPiece.getCurrentShape(),
            this.gameState.currentPiece.x,
            this.gameState.currentPiece.y
        )) {
            this.gameOver();
            return;
        }

        // Update next pieces preview
        this.updateNextPieces();
    }

    // Update next pieces queue
    updateNextPieces() {
        this.gameState.nextPieces = this.tetrominoFactory.peek(1);
    }
    
    // Lock current piece to the board
    lockPiece() {
        if (!this.gameState.currentPiece) return;
        
        const piece = this.gameState.currentPiece;
        const shape = piece.getCurrentShape();
        
        // Place piece on board
        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    const boardY = piece.y + py;
                    const boardX = piece.x + px;
                    
                    if (boardY >= 0 && boardY < this.gameState.board.length) {
                        this.gameState.board[boardY][boardX] = piece.color;
                    }
                }
            }
        }
        
        // Play lock sound
        if (this.audioManager) {
            this.audioManager.playSound('drop');
        }
        
        // Check for line clears
        const clearedLines = this.checkLineClear();
        
        if (clearedLines.length > 0) {
            this.clearLines(clearedLines);
        }
        
        // Spawn next piece
        this.spawnNewPiece();
    }
    
    // Check for completed lines
    checkLineClear() {
        const clearedLines = [];

        // Check all rows including buffer area (where pieces can be placed)
        for (let y = GAME_CONFIG.BUFFER_HEIGHT; y < GAME_CONFIG.BOARD_HEIGHT + GAME_CONFIG.BUFFER_HEIGHT; y++) {
            if (this.gameState.board[y] && this.gameState.board[y].every(cell => cell !== null)) {
                clearedLines.push(y);
            }
        }

        return clearedLines;
    }
    
    // Clear completed lines and update score
    clearLines(lines) {
        const lineCount = lines.length;
        
        // Calculate score
        let points = 0;
        switch (lineCount) {
            case 1: points = GAME_CONFIG.SCORING.SINGLE; break;
            case 2: points = GAME_CONFIG.SCORING.DOUBLE; break;
            case 3: points = GAME_CONFIG.SCORING.TRIPLE; break;
            case 4: points = GAME_CONFIG.SCORING.TETRIS; break;
        }
        
        // Apply level multiplier
        points *= this.gameState.level;
        
        // Update game state
        this.gameState.score += points;
        this.gameState.lines += lineCount;
        
        // Check for level up
        const newLevel = Utils.calculateLevel(this.gameState.lines);
        if (newLevel > this.gameState.level) {
            this.gameState.level = newLevel;
            this.fallSpeed = Utils.calculateFallSpeed(this.gameState.level);
            
            if (this.audioManager) {
                this.audioManager.playSound('levelUp');
            }
        }
        
        // Update high score
        if (this.gameState.score > this.highScore) {
            this.highScore = this.gameState.score;
            Utils.setStoredValue('tetris_high_score', this.highScore);
        }
        
        // Play sound effects based on line count
        if (this.audioManager) {
            if (lineCount === 4) {
                this.audioManager.playSound('tetris');
            } else {
                this.audioManager.playSound(`lineClear${lineCount}`);
            }
        }
        
        // Start line clear animation
        if (this.renderer) {
            this.renderer.startLineClearAnimation(lines);
            if (lineCount === 4) {
                this.renderer.startScreenShake(15);
            } else {
                this.renderer.startScreenShake(5);
            }
        }
        
        // Remove cleared lines
        lines.sort((a, b) => b - a); // Sort in descending order
        lines.forEach(lineY => {
            this.gameState.board.splice(lineY, 1);
            this.gameState.board.unshift(new Array(GAME_CONFIG.BOARD_WIDTH).fill(null));
        });
        
        // Update UI
        this.updateUI();
    }
    
    // Player actions
    moveLeft() {
        if (this.gameState.currentPiece && !this.gameState.isPaused && !this.gameState.isGameOver) {
            if (this.gameState.currentPiece.moveLeft(this.gameState.board)) {
                if (this.audioManager) {
                    this.audioManager.playSound('move');
                }
            }
        }
    }
    
    moveRight() {
        if (this.gameState.currentPiece && !this.gameState.isPaused && !this.gameState.isGameOver) {
            if (this.gameState.currentPiece.moveRight(this.gameState.board)) {
                if (this.audioManager) {
                    this.audioManager.playSound('move');
                }
            }
        }
    }
    
    softDrop() {
        if (this.gameState.currentPiece && !this.gameState.isPaused && !this.gameState.isGameOver) {
            if (this.gameState.currentPiece.moveDown(this.gameState.board)) {
                this.gameState.score += GAME_CONFIG.SCORING.SOFT_DROP;
                this.fallTimer = 0; // Reset fall timer
            }
        }
    }
    
    hardDrop() {
        if (this.gameState.currentPiece && !this.gameState.isPaused && !this.gameState.isGameOver) {
            const dropDistance = this.gameState.currentPiece.hardDrop(this.gameState.board);
            this.gameState.score += dropDistance * GAME_CONFIG.SCORING.HARD_DROP;
            
            if (this.audioManager) {
                this.audioManager.playSound('drop');
            }
            
            this.lockPiece();
        }
    }
    
    rotate(clockwise = true) {
        if (this.gameState.currentPiece && !this.gameState.isPaused && !this.gameState.isGameOver) {
            // Pass the clockwise parameter to the Tetromino's rotate method
            if (this.gameState.currentPiece.rotate(this.gameState.board, clockwise)) {
                if (this.audioManager) {
                    this.audioManager.playSound('rotate');
                }
            }
        }
    }
    

    
    // Game state management
    togglePause() {
        if (this.gameState.isGameOver) return;
        
        this.gameState.isPaused = !this.gameState.isPaused;
        
        const overlay = document.getElementById('gameOverlay');
        const title = document.getElementById('overlayTitle');
        const message = document.getElementById('overlayMessage');
        
        if (this.gameState.isPaused) {
            overlay.classList.add('active');
            title.textContent = 'GAME PAUSED';
            message.textContent = 'Press P to resume';
            
            if (this.audioManager) {
                this.audioManager.stopBackgroundMusic();
            }
        } else {
            overlay.classList.remove('active');
            
            if (this.audioManager) {
                this.audioManager.resume();
                this.audioManager.startBackgroundMusic();
            }
        }
    }
    
    gameOver() {
        this.gameState.isGameOver = true;
        
        const overlay = document.getElementById('gameOverlay');
        const title = document.getElementById('overlayTitle');
        const message = document.getElementById('overlayMessage');
        
        overlay.classList.add('active');
        title.textContent = 'GAME OVER';
        message.textContent = `Final Score: ${Utils.formatScore(this.gameState.score)}`;
        
        if (this.audioManager) {
            this.audioManager.stopBackgroundMusic();
            this.audioManager.playSound('gameOver');
        }
        
        console.log('Game Over - Score:', this.gameState.score);
    }
    
    restart() {
        // Reset game state
        this.gameState = {
            board: this.createEmptyBoard(),
            currentPiece: null,
            nextPieces: [],
            score: 0,
            lines: 0,
            level: 1,
            isGameOver: false,
            isPaused: false
        };
        
        // Reset timing
        this.fallTimer = 0;
        this.fallSpeed = GAME_CONFIG.BASE_FALL_SPEED;
        
        // Reset tetromino factory
        this.tetrominoFactory.reset();
        
        // Hide overlay
        const overlay = document.getElementById('gameOverlay');
        overlay.classList.remove('active');
        
        // Initialize new game
        this.initialize();
        
        // Start background music
        this.startBackgroundMusicWithRetry();

        console.log('Game restarted');
    }
    
    // Render the game
    render() {
        if (this.renderer) {
            this.renderer.render(this.gameState);
        }
    }
    
    // Update UI elements
    updateUI() {
        document.getElementById('currentScore').textContent = Utils.formatScore(this.gameState.score);
        document.getElementById('highScore').textContent = Utils.formatScore(this.highScore);
        document.getElementById('linesCleared').textContent = this.gameState.lines.toString();
        document.getElementById('currentLevel').textContent = this.gameState.level.toString();
    }
    
    // Set components
    setRenderer(renderer) {
        this.renderer = renderer;
    }
    
    setInputHandler(inputHandler) {
        this.inputHandler = inputHandler;
    }
    
    setAudioManager(audioManager) {
        this.audioManager = audioManager;
    }
    
    // Cleanup
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.inputHandler) {
            this.inputHandler.destroy();
        }
        
        if (this.audioManager) {
            this.audioManager.stopBackgroundMusic();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameEngine };
}
