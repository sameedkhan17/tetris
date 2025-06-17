class Tetromino {
    constructor(type, x = 3, y = 2) { // Changed from -2 to 2 to spawn in visible area
        this.type = type;
        this.x = x;
        this.y = y;
        this.rotation = 0;
        this.shape = TETROMINO_SHAPES[type];
        this.color = GAME_CONFIG.COLORS[type];
        this.lockTimer = 0;
        this.lockDelay = GAME_CONFIG.LOCK_DELAY;
        this.hasBeenHeld = false;
    }
    
    // Get current rotated shape
    getCurrentShape() {
        return this.shape[this.rotation];
    }
    
    // Get shape for specific rotation
    getShapeAtRotation(rotation) {
        return this.shape[rotation % 4];
    }
    
    // Move piece left
    moveLeft(board) {
        if (Utils.isValidPosition(board, this.getCurrentShape(), this.x - 1, this.y)) {
            this.x--;
            this.resetLockTimer();
            return true;
        }
        return false;
    }
    
    // Move piece right
    moveRight(board) {
        if (Utils.isValidPosition(board, this.getCurrentShape(), this.x + 1, this.y)) {
            this.x++;
            this.resetLockTimer();
            return true;
        }
        return false;
    }
    
    // Move piece down (soft drop)
    moveDown(board) {
        if (Utils.isValidPosition(board, this.getCurrentShape(), this.x, this.y + 1)) {
            this.y++;
            this.resetLockTimer();
            return true;
        }
        return false;
    }
    
    // Hard drop - move to bottom instantly
    hardDrop(board) {
        let dropDistance = 0;
        while (Utils.isValidPosition(board, this.getCurrentShape(), this.x, this.y + 1)) {
            this.y++;
            dropDistance++;
        }
        return dropDistance;
    }
    
    // Rotate piece using Super Rotation System (SRS)
    rotate(board, clockwise = true) {
        const oldRotation = this.rotation;
        const newRotation = clockwise ? 
            (this.rotation + 1) % 4 : 
            (this.rotation + 3) % 4;
        
        const newShape = this.getShapeAtRotation(newRotation);
        
        // Try basic rotation first
        if (Utils.isValidPosition(board, newShape, this.x, this.y)) {
            this.rotation = newRotation;
            this.resetLockTimer();
            return true;
        }
        
        // Try wall kicks
        const wallKickData = this.getWallKickData(oldRotation, newRotation);
        
        for (const [offsetX, offsetY] of wallKickData) {
            const testX = this.x + offsetX;
            const testY = this.y + offsetY;
            
            if (Utils.isValidPosition(board, newShape, testX, testY)) {
                this.x = testX;
                this.y = testY;
                this.rotation = newRotation;
                this.resetLockTimer();
                return true;
            }
        }
        
        return false; // Rotation failed
    }
    
    // Get wall kick data for rotation
    getWallKickData(fromRotation, toRotation) {
        const key = `${fromRotation}->${toRotation}`;
        
        if (this.type === 'I') {
            return WALL_KICK_DATA.I[key] || [[0, 0]];
        } else if (this.type === 'O') {
            return [[0, 0]]; // O piece doesn't need wall kicks
        } else {
            return WALL_KICK_DATA.JLSTZ[key] || [[0, 0]];
        }
    }
    
    // Get ghost piece position (where piece would land)
    getGhostPosition(board) {
        let ghostY = this.y;
        while (Utils.isValidPosition(board, this.getCurrentShape(), this.x, ghostY + 1)) {
            ghostY++;
        }
        return { x: this.x, y: ghostY };
    }
    
    // Check if piece can be placed (for lock delay)
    canMoveDown(board) {
        return Utils.isValidPosition(board, this.getCurrentShape(), this.x, this.y + 1);
    }
    
    // Update lock timer
    updateLockTimer(deltaTime, board) {
        if (!this.canMoveDown(board)) {
            this.lockTimer += deltaTime;
            return this.lockTimer >= this.lockDelay;
        } else {
            this.resetLockTimer();
            return false;
        }
    }
    
    // Reset lock timer (called when piece moves)
    resetLockTimer() {
        this.lockTimer = 0;
    }
    
    // Get all occupied positions
    getOccupiedPositions() {
        const positions = [];
        const shape = this.getCurrentShape();
        
        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    positions.push({
                        x: this.x + px,
                        y: this.y + py
                    });
                }
            }
        }
        
        return positions;
    }
    
    // Check if piece is in spawn position (for game over detection)
    isInSpawnArea() {
        return this.y < 0;
    }
    
    // Create a copy of this tetromino
    clone() {
        const clone = new Tetromino(this.type, this.x, this.y);
        clone.rotation = this.rotation;
        clone.lockTimer = this.lockTimer;
        clone.hasBeenHeld = this.hasBeenHeld;
        return clone;
    }
    
    // Reset to spawn position
    resetToSpawn() {
        this.x = 3;
        this.y = 2; // Changed from -2 to 2 to spawn in visible area
        this.rotation = 0;
        this.lockTimer = 0;
    }
    
    // Get bounding box for rendering optimization
    getBoundingBox() {
        const shape = this.getCurrentShape();
        let minX = 4, maxX = -1, minY = 4, maxY = -1;
        
        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    minX = Math.min(minX, px);
                    maxX = Math.max(maxX, px);
                    minY = Math.min(minY, py);
                    maxY = Math.max(maxY, py);
                }
            }
        }
        
        return {
            minX: minX === 4 ? 0 : minX,
            maxX: maxX === -1 ? 0 : maxX,
            minY: minY === 4 ? 0 : minY,
            maxY: maxY === -1 ? 0 : maxY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    }
    
    // Check if two tetrominoes are the same type
    isSameType(other) {
        return other && this.type === other.type;
    }
    
    // Get center position for rotation calculations
    getCenterPosition() {
        const bbox = this.getBoundingBox();
        return {
            x: this.x + bbox.minX + bbox.width / 2,
            y: this.y + bbox.minY + bbox.height / 2
        };
    }
}

// Tetromino factory for creating pieces
class TetrominoFactory {
    constructor() {
        this.bag = [];
        this.bagIndex = 0;
    }
    
    // Get next tetromino using 7-bag system
    getNext() {
        if (this.bagIndex >= this.bag.length) {
            this.bag = Utils.generateBag();
            this.bagIndex = 0;
        }

        const type = this.bag[this.bagIndex++];
        return new Tetromino(type);
    }
    
    // Peek at upcoming pieces without consuming them
    peek(count = 1) {
        const upcoming = [];
        let tempBag = [...this.bag];
        let tempIndex = this.bagIndex;
        
        for (let i = 0; i < count; i++) {
            if (tempIndex >= tempBag.length) {
                tempBag = [...tempBag, ...Utils.generateBag()];
            }
            upcoming.push(tempBag[tempIndex++]);
        }
        
        return upcoming;
    }
    
    // Reset the bag (for new game)
    reset() {
        this.bag = [];
        this.bagIndex = 0;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Tetromino, TetrominoFactory };
}
