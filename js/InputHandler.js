class InputHandler {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Key states
        this.keys = {};
        this.keyTimers = {};
        
        // Input timing for DAS (Delayed Auto Shift) and ARR (Auto Repeat Rate)
        this.dasTimer = 0;
        this.arrTimer = 0;
        this.lastMoveTime = 0;
        
        // Touch handling
        this.touchStartPos = null;
        this.touchThreshold = 30; // pixels
        
        // Bind event handlers
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        
        this.setupEventListeners();
        this.setupTouchControls();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        
        // Touch events for mobile
        document.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        
        // Prevent context menu on long press
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    setupTouchControls() {
        // Show mobile controls on touch devices
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            const mobileControls = document.getElementById('mobileControls');
            if (mobileControls) {
                mobileControls.style.display = 'block';
                
                // Touch button handlers
                this.setupTouchButton('leftBtn', () => this.gameEngine.moveLeft());
                this.setupTouchButton('rightBtn', () => this.gameEngine.moveRight());
                this.setupTouchButton('downBtn', () => this.gameEngine.softDrop());
                this.setupTouchButton('rotateBtn', () => this.gameEngine.rotate());
                this.setupTouchButton('hardDropBtn', () => this.gameEngine.hardDrop());
            }
        }
    }
    
    setupTouchButton(buttonId, action) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        let interval;
        let timeout;
        
        const startAction = () => {
            action();
            // For movement buttons, set up auto-repeat
            if (['leftBtn', 'rightBtn', 'downBtn'].includes(buttonId)) {
                timeout = setTimeout(() => {
                    interval = setInterval(action, GAME_CONFIG.ARR_DELAY);
                }, GAME_CONFIG.DAS_DELAY);
            }
        };
        
        const stopAction = () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
        
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startAction();
        });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            stopAction();
        });
        
        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            stopAction();
        });
    }
    
    handleKeyDown(event) {
        const key = event.code;
        
        // Prevent default for game keys
        if (this.isGameKey(key)) {
            event.preventDefault();
        }
        
        // Handle key press
        if (!this.keys[key]) {
            this.keys[key] = true;
            this.keyTimers[key] = 0;
            this.handleKeyPress(key);
        }
    }
    
    handleKeyUp(event) {
        const key = event.code;
        this.keys[key] = false;
        delete this.keyTimers[key];
        
        // Reset DAS/ARR timers when movement keys are released
        if (['ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(key)) {
            this.dasTimer = 0;
            this.arrTimer = 0;
        }
    }
    
    handleKeyPress(key) {
        switch (key) {
            case 'ArrowLeft':
                this.gameEngine.moveLeft();
                this.lastMoveTime = Date.now();
                break;
            case 'ArrowRight':
                this.gameEngine.moveRight();
                this.lastMoveTime = Date.now();
                break;
            case 'ArrowDown':
                this.gameEngine.softDrop();
                break;
            case 'ArrowUp':
                this.gameEngine.rotate();
                break;
            case 'Space':
                this.gameEngine.hardDrop();
                break;
            case 'KeyP':
                this.gameEngine.togglePause();
                break;
            case 'KeyR':
                if (this.gameEngine.gameState.isGameOver) {
                    this.gameEngine.restart();
                }
                break;
            case 'Escape':
                this.gameEngine.togglePause();
                break;
        }
    }
    
    // Handle touch gestures
    handleTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.touchStartPos = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now()
            };
        }
    }
    
    handleTouchMove(event) {
        event.preventDefault(); // Prevent scrolling
    }
    
    handleTouchEnd(event) {
        if (!this.touchStartPos) return;
    
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartPos.x;
        const deltaY = touch.clientY - this.touchStartPos.y;
        const deltaTime = Date.now() - this.touchStartPos.time;
    
        const canvas = this.gameEngine.renderer.canvas; // Assuming renderer has a canvas property
        const rect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
    
        // Define tap zones (adjust as needed)
        const screenWidth = rect.width;
        const screenHeight = rect.height;
        const tapZoneWidth = screenWidth / 3;
        const hardDropZoneHeight = screenHeight / 4;
    
        // Check for tap zone actions first
        if (deltaTime < 250) { // Max time for a tap
            if (touchY < hardDropZoneHeight) {
                // Tap in top zone: Hard Drop
                this.gameEngine.hardDrop();
                this.touchStartPos = null;
                return;
            } else if (touchX < tapZoneWidth) {
                // Tap in left zone: Rotate Counter-Clockwise (or primary rotate)
                this.gameEngine.rotate(false); // Assuming rotate can take a direction
                this.touchStartPos = null;
                return;
            } else if (touchX > screenWidth - tapZoneWidth) {
                // Tap in right zone: Rotate Clockwise (or primary rotate if no direction)
                this.gameEngine.rotate(true); // Assuming rotate can take a direction
                this.touchStartPos = null;
                return;
            }
        }
    
        // Only process swipes that are long enough and fast enough, and not a tap zone action
        const swipeThreshold = this.touchThreshold * 1.5; // Increased threshold for swipes
        if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
            if (deltaTime < 350) { // Quick swipe, slightly longer time for swipes
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe
                    if (deltaX > 0) {
                        this.gameEngine.moveRight();
                    } else {
                        this.gameEngine.moveLeft();
                    }
                } else {
                    // Vertical swipe (down for soft drop, up could be hold or nothing)
                    if (deltaY > 0) {
                        this.gameEngine.softDrop();
                    } // No action for swipe up by default, could be used for 'hold' piece
                }
            }
        } else if (deltaTime < 200 && (Math.abs(deltaX) < this.touchThreshold && Math.abs(deltaY) < this.touchThreshold)) {
            // If it wasn't a zone tap or a clear swipe, consider it a general tap for rotation (fallback)
            // This part might be redundant if tap zones cover rotation well.
            // Or, it could be a center-tap for a different action if desired.
            // For now, let's keep the original quick tap rotate if no zone is hit.
            // this.gameEngine.rotate(); // Original tap-to-rotate, consider if needed with zones
        }
    
        this.touchStartPos = null;
    }
    
    // Update input handling (called from game loop)
    update(deltaTime) {
        this.updateKeyRepeat(deltaTime);
    }
    
    // Handle key repeat for movement
    updateKeyRepeat(deltaTime) {
        const currentTime = Date.now();
        
        // Handle horizontal movement with DAS/ARR
        if (this.keys['ArrowLeft'] || this.keys['ArrowRight']) {
            const timeSinceLastMove = currentTime - this.lastMoveTime;
            
            if (timeSinceLastMove >= GAME_CONFIG.DAS_DELAY) {
                this.arrTimer += deltaTime;
                
                if (this.arrTimer >= GAME_CONFIG.ARR_DELAY) {
                    if (this.keys['ArrowLeft']) {
                        this.gameEngine.moveLeft();
                    } else if (this.keys['ArrowRight']) {
                        this.gameEngine.moveRight();
                    }
                    this.arrTimer = 0;
                }
            }
        }
        
        // Handle soft drop
        if (this.keys['ArrowDown']) {
            this.keyTimers['ArrowDown'] += deltaTime;
            
            if (this.keyTimers['ArrowDown'] >= 50) { // 50ms repeat for soft drop
                this.gameEngine.softDrop();
                this.keyTimers['ArrowDown'] = 0;
            }
        }
    }
    
    // Check if a key is a game control key
    isGameKey(key) {
        const gameKeys = [
            'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp',
            'Space', 'KeyP', 'KeyR', 'Escape'
        ];
        return gameKeys.includes(key);
    }
    
    // Check if a key is currently pressed
    isKeyPressed(key) {
        return !!this.keys[key];
    }
    
    // Get all currently pressed keys
    getPressedKeys() {
        return Object.keys(this.keys).filter(key => this.keys[key]);
    }
    
    // Clear all key states (useful for pause/unpause)
    clearKeyStates() {
        this.keys = {};
        this.keyTimers = {};
        this.dasTimer = 0;
        this.arrTimer = 0;
    }
    
    // Enable/disable input handling
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!enabled) {
            this.clearKeyStates();
        }
    }
    
    // Cleanup event listeners
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InputHandler };
}
