class Renderer {
    constructor(gameCanvas, nextCanvas) {
        this.gameCanvas = gameCanvas;
        this.nextCanvas = nextCanvas;

        this.gameCtx = gameCanvas.getContext('2d');
        this.nextCtx = nextCanvas.getContext('2d');

        // Enable image smoothing for better visuals
        [this.gameCtx, this.nextCtx].forEach(ctx => {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        });
        
        // Animation properties
        this.particles = [];
        this.lineClearAnimation = null;
        this.shakeOffset = { x: 0, y: 0 };
        this.shakeIntensity = 0;
        
        // Cached gradients and patterns
        this.gradientCache = new Map();
        
        this.setupCanvases();
    }
    
    setupCanvases() {
        // Set up game canvas
        this.gameCanvas.width = GAME_CONFIG.BOARD_WIDTH * GAME_CONFIG.CELL_SIZE;
        this.gameCanvas.height = GAME_CONFIG.BOARD_HEIGHT * GAME_CONFIG.CELL_SIZE;

        // Set up next piece canvas (smaller for single piece)
        this.nextCanvas.width = 120;
        this.nextCanvas.height = 120;
    }
    
    // Main render function
    render(gameState) {
        this.updateAnimations();
        
        // Clear all canvases
        this.clearCanvas(this.gameCtx, this.gameCanvas.width, this.gameCanvas.height);
        this.clearCanvas(this.nextCtx, this.nextCanvas.width, this.nextCanvas.height);
        
        // Apply screen shake
        this.gameCtx.save();
        this.gameCtx.translate(this.shakeOffset.x, this.shakeOffset.y);
        
        // Render game board
        this.renderBoard(gameState.board);
        this.renderGrid();
        
        // Render ghost piece
        if (gameState.currentPiece && !gameState.isPaused) {
            this.renderGhostPiece(gameState.currentPiece, gameState.board);
        }
        
        // Render current piece
        if (gameState.currentPiece && !gameState.isPaused) {
            this.renderTetromino(this.gameCtx, gameState.currentPiece, GAME_CONFIG.CELL_SIZE);
        }
        
        // Render line clear animation
        if (this.lineClearAnimation) {
            this.renderLineClearAnimation();
        }
        
        // Render particles
        this.renderParticles();
        
        this.gameCtx.restore();
        
        // Render UI elements
        this.renderNextPieces(gameState.nextPieces);
    }
    
    // Clear canvas with background
    clearCanvas(ctx, width, height) {
        ctx.fillStyle = GAME_CONFIG.COLORS.BACKGROUND;
        ctx.fillRect(0, 0, width, height);
    }
    
    // Render the game board
    renderBoard(board) {
        // Only render the visible part of the board (skip buffer rows)
        for (let y = GAME_CONFIG.BUFFER_HEIGHT; y < GAME_CONFIG.BOARD_HEIGHT + GAME_CONFIG.BUFFER_HEIGHT; y++) {
            for (let x = 0; x < GAME_CONFIG.BOARD_WIDTH; x++) {
                if (board[y] && board[y][x]) {
                    this.renderCell(
                        this.gameCtx,
                        x * GAME_CONFIG.CELL_SIZE,
                        (y - GAME_CONFIG.BUFFER_HEIGHT) * GAME_CONFIG.CELL_SIZE, // Adjust for buffer offset
                        GAME_CONFIG.CELL_SIZE,
                        board[y][x]
                    );
                }
            }
        }
    }
    
    // Render grid lines
    renderGrid() {
        this.gameCtx.strokeStyle = GAME_CONFIG.COLORS.GRID;
        this.gameCtx.lineWidth = 1;
        this.gameCtx.globalAlpha = 0.3;
        
        // Vertical lines
        for (let x = 0; x <= GAME_CONFIG.BOARD_WIDTH; x++) {
            const xPos = x * GAME_CONFIG.CELL_SIZE;
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(xPos, 0);
            this.gameCtx.lineTo(xPos, this.gameCanvas.height);
            this.gameCtx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= GAME_CONFIG.BOARD_HEIGHT; y++) {
            const yPos = y * GAME_CONFIG.CELL_SIZE;
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(0, yPos);
            this.gameCtx.lineTo(this.gameCanvas.width, yPos);
            this.gameCtx.stroke();
        }
        
        this.gameCtx.globalAlpha = 1;
    }
    
    // Render a tetromino piece
    renderTetromino(ctx, tetromino, cellSize, offsetX = 0, offsetY = 0) {
        const shape = tetromino.getCurrentShape();

        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    const x = (tetromino.x + px) * cellSize + offsetX;
                    const y = (tetromino.y + py - GAME_CONFIG.BUFFER_HEIGHT) * cellSize + offsetY; // Adjust for buffer offset

                    // Only render if within visible area (after buffer adjustment)
                    if (tetromino.y + py >= GAME_CONFIG.BUFFER_HEIGHT) {
                        this.renderCell(ctx, x, y, cellSize, tetromino.color);
                    }
                }
            }
        }
    }
    
    // Render ghost piece (preview of where piece will land)
    renderGhostPiece(tetromino, board) {
        const ghostPos = tetromino.getGhostPosition(board);
        const shape = tetromino.getCurrentShape();

        this.gameCtx.globalAlpha = 0.3;

        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px] && ghostPos.y + py >= GAME_CONFIG.BUFFER_HEIGHT) {
                    const x = (ghostPos.x + px) * GAME_CONFIG.CELL_SIZE;
                    const y = (ghostPos.y + py - GAME_CONFIG.BUFFER_HEIGHT) * GAME_CONFIG.CELL_SIZE; // Adjust for buffer offset

                    this.renderCell(this.gameCtx, x, y, GAME_CONFIG.CELL_SIZE, GAME_CONFIG.COLORS.GHOST);
                }
            }
        }

        this.gameCtx.globalAlpha = 1;
    }
    
    // Render a single cell with gradient and border
    renderCell(ctx, x, y, size, color) {
        // Create gradient for 3D effect
        const gradient = this.getGradient(ctx, x, y, size, color);
        
        // Fill cell
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, size, size);
        
        // Add border for definition
        ctx.strokeStyle = this.darkenColor(color, 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
        
        // Add highlight for 3D effect
        ctx.strokeStyle = this.lightenColor(color, 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 1, y + size - 1);
        ctx.lineTo(x + 1, y + 1);
        ctx.lineTo(x + size - 1, y + 1);
        ctx.stroke();
    }
    
    // Get cached gradient for cell
    getGradient(ctx, x, y, size, color) {
        const key = `${color}_${size}`;
        
        if (!this.gradientCache.has(key)) {
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, this.lightenColor(color, 0.2));
            gradient.addColorStop(1, this.darkenColor(color, 0.2));
            this.gradientCache.set(key, gradient);
        }
        
        return this.gradientCache.get(key);
    }
    

    
    // Render next piece (single piece only)
    renderNextPieces(nextPieces) {
        if (nextPieces.length === 0) return;

        const piece = new Tetromino(nextPieces[0]);
        const centerX = this.nextCanvas.width / 2;
        const centerY = this.nextCanvas.height / 2;

        this.renderTetrominoPreview(
            this.nextCtx,
            piece,
            centerX,
            centerY,
            GAME_CONFIG.PREVIEW_CELL_SIZE
        );
    }
    
    // Render tetromino preview (centered)
    renderTetrominoPreview(ctx, tetromino, centerX, centerY, cellSize) {
        const shape = tetromino.getCurrentShape();
        const bbox = tetromino.getBoundingBox();
        
        const startX = centerX - (bbox.width * cellSize) / 2;
        const startY = centerY - (bbox.height * cellSize) / 2;
        
        for (let py = bbox.minY; py <= bbox.maxY; py++) {
            for (let px = bbox.minX; px <= bbox.maxX; px++) {
                if (shape[py][px]) {
                    const x = startX + (px - bbox.minX) * cellSize;
                    const y = startY + (py - bbox.minY) * cellSize;
                    
                    this.renderCell(ctx, x, y, cellSize, tetromino.color);
                }
            }
        }
    }
    
    // Start line clear animation
    startLineClearAnimation(lines) {
        this.lineClearAnimation = {
            lines: lines,
            progress: 0,
            duration: 400, // Reduced duration for better gameplay flow
            flashPhase: 0 // For flashing effect
        };

        // Create particles for line clear effect
        this.createLineClearParticles(lines);
    }
    
    // Render line clear animation
    renderLineClearAnimation() {
        if (!this.lineClearAnimation) return;

        const { lines, progress } = this.lineClearAnimation;

        // Create flashing effect in first half, then dissolve
        if (progress < 0.5) {
            // Flashing phase
            const flashIntensity = Math.sin(progress * Math.PI * 8) * 0.5 + 0.5;
            this.gameCtx.globalAlpha = flashIntensity;
            this.gameCtx.fillStyle = '#FFFFFF';

            lines.forEach(lineY => {
                const y = (lineY - GAME_CONFIG.BUFFER_HEIGHT) * GAME_CONFIG.CELL_SIZE;
                this.gameCtx.fillRect(0, y, this.gameCanvas.width, GAME_CONFIG.CELL_SIZE);
            });
        } else {
            // Dissolve phase
            const dissolveProgress = (progress - 0.5) * 2; // 0 to 1
            this.gameCtx.globalAlpha = 1 - dissolveProgress;

            lines.forEach(lineY => {
                const y = (lineY - GAME_CONFIG.BUFFER_HEIGHT) * GAME_CONFIG.CELL_SIZE;
                const scaleY = 1 - dissolveProgress;
                const offsetY = (GAME_CONFIG.CELL_SIZE * (1 - scaleY)) / 2;

                // Create gradient effect for dissolving
                const gradient = this.gameCtx.createLinearGradient(0, y, 0, y + GAME_CONFIG.CELL_SIZE);
                gradient.addColorStop(0, '#FFFFFF');
                gradient.addColorStop(0.5, '#FFFF00');
                gradient.addColorStop(1, '#FF0000');

                this.gameCtx.fillStyle = gradient;
                this.gameCtx.fillRect(
                    0,
                    y + offsetY,
                    this.gameCanvas.width,
                    GAME_CONFIG.CELL_SIZE * scaleY
                );
            });
        }

        this.gameCtx.globalAlpha = 1;
    }
    
    // Create particles for line clear effect
    createLineClearParticles(lines) {
        lines.forEach(lineY => {
            for (let x = 0; x < GAME_CONFIG.BOARD_WIDTH; x++) {
                for (let i = 0; i < 3; i++) {
                    this.particles.push({
                        x: (x + 0.5) * GAME_CONFIG.CELL_SIZE,
                        y: (lineY - GAME_CONFIG.BUFFER_HEIGHT + 0.5) * GAME_CONFIG.CELL_SIZE, // Adjust for buffer offset
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        life: 1,
                        decay: 0.02,
                        color: `hsl(${Math.random() * 360}, 100%, 50%)`
                    });
                }
            }
        });
    }
    
    // Render particles
    renderParticles() {
        this.particles.forEach(particle => {
            this.gameCtx.globalAlpha = particle.life;
            this.gameCtx.fillStyle = particle.color;
            this.gameCtx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        });
        
        this.gameCtx.globalAlpha = 1;
    }
    
    // Update animations
    updateAnimations() {
        let needsRedraw = false;

        // Update line clear animation
        if (this.lineClearAnimation) {
            this.lineClearAnimation.progress += 1 / 60; // Assuming 60 FPS
            needsRedraw = true;

            if (this.lineClearAnimation.progress >= 1) {
                this.lineClearAnimation = null;
            }
        }

        // Update particles (batch processing for better performance)
        if (this.particles.length > 0) {
            const activeParticles = [];
            for (let i = 0; i < this.particles.length; i++) {
                const particle = this.particles[i];
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life -= particle.decay;

                if (particle.life > 0) {
                    activeParticles.push(particle);
                }
            }
            this.particles = activeParticles;
            needsRedraw = this.particles.length > 0;
        }

        // Update screen shake
        if (this.shakeIntensity > 0) {
            this.shakeOffset.x = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeOffset.y = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= 0.9;
            needsRedraw = true;

            if (this.shakeIntensity < 0.1) {
                this.shakeIntensity = 0;
                this.shakeOffset.x = 0;
                this.shakeOffset.y = 0;
            }
        }

        return needsRedraw;
    }
    
    // Start screen shake effect
    startScreenShake(intensity = 10) {
        this.shakeIntensity = intensity;
    }
    
    // Color utility functions
    lightenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    darkenColor(color, amount) {
        return this.lightenColor(color, -amount);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Renderer };
}
