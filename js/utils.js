// Game Constants
const GAME_CONFIG = {
    BOARD_WIDTH: 10,
    BOARD_HEIGHT: 20,
    BUFFER_HEIGHT: 4,
    CELL_SIZE: 30,
    PREVIEW_CELL_SIZE: 20,
    HOLD_CELL_SIZE: 20,
    
    // Colors for each tetromino type
    COLORS: {
        I: '#00FFFF', // Cyan
        O: '#FFFF00', // Yellow
        T: '#800080', // Purple
        S: '#00FF00', // Green
        Z: '#FF0000', // Red
        J: '#0000FF', // Blue
        L: '#FFA500', // Orange
        GHOST: 'rgba(255, 255, 255, 0.3)',
        GRID: '#333333',
        BACKGROUND: '#000000'
    },
    
    // Scoring system
    SCORING: {
        SINGLE: 100,
        DOUBLE: 300,
        TRIPLE: 500,
        TETRIS: 800,
        SOFT_DROP: 1,
        HARD_DROP: 2
    },
    
    // Level progression
    LINES_PER_LEVEL: 10,
    BASE_FALL_SPEED: 1000, // milliseconds
    SPEED_MULTIPLIER: 0.8,
    
    // Input delays (milliseconds)
    DAS_DELAY: 167, // Delayed Auto Shift
    ARR_DELAY: 33,  // Auto Repeat Rate
    LOCK_DELAY: 300 // Lock delay for piece placement (reduced for better responsiveness)
};

// Tetromino shapes and rotations (SRS - Super Rotation System)
const TETROMINO_SHAPES = {
    I: [
        [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
        [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
        [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
        [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]
    ],
    O: [
        [[0,1,1,0], [0,1,1,0], [0,0,0,0], [0,0,0,0]],
        [[0,1,1,0], [0,1,1,0], [0,0,0,0], [0,0,0,0]],
        [[0,1,1,0], [0,1,1,0], [0,0,0,0], [0,0,0,0]],
        [[0,1,1,0], [0,1,1,0], [0,0,0,0], [0,0,0,0]]
    ],
    T: [
        [[0,1,0,0], [1,1,1,0], [0,0,0,0], [0,0,0,0]],
        [[0,1,0,0], [0,1,1,0], [0,1,0,0], [0,0,0,0]],
        [[0,0,0,0], [1,1,1,0], [0,1,0,0], [0,0,0,0]],
        [[0,1,0,0], [1,1,0,0], [0,1,0,0], [0,0,0,0]]
    ],
    S: [
        [[0,1,1,0], [1,1,0,0], [0,0,0,0], [0,0,0,0]],
        [[0,1,0,0], [0,1,1,0], [0,0,1,0], [0,0,0,0]],
        [[0,0,0,0], [0,1,1,0], [1,1,0,0], [0,0,0,0]],
        [[1,0,0,0], [1,1,0,0], [0,1,0,0], [0,0,0,0]]
    ],
    Z: [
        [[1,1,0,0], [0,1,1,0], [0,0,0,0], [0,0,0,0]],
        [[0,0,1,0], [0,1,1,0], [0,1,0,0], [0,0,0,0]],
        [[0,0,0,0], [1,1,0,0], [0,1,1,0], [0,0,0,0]],
        [[0,1,0,0], [1,1,0,0], [1,0,0,0], [0,0,0,0]]
    ],
    J: [
        [[1,0,0,0], [1,1,1,0], [0,0,0,0], [0,0,0,0]],
        [[0,1,1,0], [0,1,0,0], [0,1,0,0], [0,0,0,0]],
        [[0,0,0,0], [1,1,1,0], [0,0,1,0], [0,0,0,0]],
        [[0,1,0,0], [0,1,0,0], [1,1,0,0], [0,0,0,0]]
    ],
    L: [
        [[0,0,1,0], [1,1,1,0], [0,0,0,0], [0,0,0,0]],
        [[0,1,0,0], [0,1,0,0], [0,1,1,0], [0,0,0,0]],
        [[0,0,0,0], [1,1,1,0], [1,0,0,0], [0,0,0,0]],
        [[1,1,0,0], [0,1,0,0], [0,1,0,0], [0,0,0,0]]
    ]
};

// SRS Wall Kick Data
const WALL_KICK_DATA = {
    // Standard pieces (J, L, S, T, Z)
    JLSTZ: {
        '0->1': [[ 0, 0], [-1, 0], [-1, 1], [ 0,-2], [-1,-2]],
        '1->0': [[ 0, 0], [ 1, 0], [ 1,-1], [ 0, 2], [ 1, 2]],
        '1->2': [[ 0, 0], [ 1, 0], [ 1,-1], [ 0, 2], [ 1, 2]],
        '2->1': [[ 0, 0], [-1, 0], [-1, 1], [ 0,-2], [-1,-2]],
        '2->3': [[ 0, 0], [ 1, 0], [ 1, 1], [ 0,-2], [ 1,-2]],
        '3->2': [[ 0, 0], [-1, 0], [-1,-1], [ 0, 2], [-1, 2]],
        '3->0': [[ 0, 0], [-1, 0], [-1,-1], [ 0, 2], [-1, 2]],
        '0->3': [[ 0, 0], [ 1, 0], [ 1, 1], [ 0,-2], [ 1,-2]]
    },
    // I piece has different wall kick data
    I: {
        '0->1': [[ 0, 0], [-2, 0], [ 1, 0], [-2,-1], [ 1, 2]],
        '1->0': [[ 0, 0], [ 2, 0], [-1, 0], [ 2, 1], [-1,-2]],
        '1->2': [[ 0, 0], [-1, 0], [ 2, 0], [-1, 2], [ 2,-1]],
        '2->1': [[ 0, 0], [ 1, 0], [-2, 0], [ 1,-2], [-2, 1]],
        '2->3': [[ 0, 0], [ 2, 0], [-1, 0], [ 2, 1], [-1,-2]],
        '3->2': [[ 0, 0], [-2, 0], [ 1, 0], [-2,-1], [ 1, 2]],
        '3->0': [[ 0, 0], [ 1, 0], [-2, 0], [ 1,-2], [-2, 1]],
        '0->3': [[ 0, 0], [-1, 0], [ 2, 0], [-1, 2], [ 2,-1]]
    }
};

// Utility Functions
const Utils = {
    // Generate random tetromino type
    randomTetrominoType() {
        const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        return types[Math.floor(Math.random() * types.length)];
    },
    
    // Generate bag of 7 tetrominoes (ensures fair distribution)
    generateBag() {
        const bag = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        // Fisher-Yates shuffle
        for (let i = bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        return bag;
    },
    
    // Calculate level from lines cleared
    calculateLevel(lines) {
        return Math.floor(lines / GAME_CONFIG.LINES_PER_LEVEL) + 1;
    },
    
    // Calculate fall speed based on level
    calculateFallSpeed(level) {
        return Math.max(50, GAME_CONFIG.BASE_FALL_SPEED * Math.pow(GAME_CONFIG.SPEED_MULTIPLIER, level - 1));
    },
    
    // Deep clone 2D array
    cloneMatrix(matrix) {
        return matrix.map(row => [...row]);
    },
    
    // Check if position is valid on board
    isValidPosition(board, piece, x, y) {
        for (let py = 0; py < piece.length; py++) {
            for (let px = 0; px < piece[py].length; px++) {
                if (piece[py][px]) {
                    const newX = x + px;
                    const newY = y + py;
                    
                    // Check boundaries
                    if (newX < 0 || newX >= GAME_CONFIG.BOARD_WIDTH || 
                        newY >= GAME_CONFIG.BOARD_HEIGHT + GAME_CONFIG.BUFFER_HEIGHT) {
                        return false;
                    }
                    
                    // Check collision with existing pieces (only in visible area)
                    if (newY >= 0 && board[newY] && board[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    },
    
    // Get localStorage with fallback
    getStoredValue(key, defaultValue) {
        try {
            const stored = localStorage.getItem(key);
            return stored !== null ? JSON.parse(stored) : defaultValue;
        } catch (e) {
            console.warn('localStorage error:', e);
            return defaultValue;
        }
    },
    
    // Set localStorage with error handling
    setStoredValue(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('localStorage error:', e);
        }
    },
    
    // Format number with commas
    formatScore(score) {
        return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GAME_CONFIG, TETROMINO_SHAPES, WALL_KICK_DATA, Utils };
}
