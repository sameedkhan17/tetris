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
        // Better mobile device detection - only show controls on actual mobile devices
        const isMobile = this.isMobileDevice();

        const mobileControls = document.getElementById('mobileControls');
        if (!mobileControls) return;

        if (isMobile) {
            // Show mobile controls and override CSS !important
            mobileControls.style.setProperty('display', 'block', 'important');

            // Touch button handlers - only set up if we're showing controls
            this.setupTouchButton('leftBtn', () => this.gameEngine.moveLeft());
            this.setupTouchButton('rightBtn', () => this.gameEngine.moveRight());
            this.setupTouchButton('downBtn', () => this.gameEngine.softDrop());
            this.setupTouchButton('rotateBtn', () => this.gameEngine.rotate());
            this.setupTouchButton('hardDropBtn', () => this.gameEngine.hardDrop());
        } else {
            // Ensure mobile controls stay hidden on desktop
            mobileControls.style.setProperty('display', 'none', 'important');
        }
    }

    // Better mobile device detection
    isMobileDevice() {
        // Check user agent for mobile indicators
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
        const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));

        // Check screen size (mobile devices typically have smaller screens)
        const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 768;

        // Check if device has touch AND is likely mobile (not just touch-capable desktop)
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Check for desktop-specific indicators
        const isDesktop = userAgent.includes('windows') && !userAgent.includes('windows phone') ||
                         userAgent.includes('macintosh') && !userAgent.includes('mobile') ||
                         userAgent.includes('linux') && !userAgent.includes('android');

        // Return true only if it's likely a mobile device
        const result = (isMobileUA || (hasTouch && isSmallScreen)) && !isDesktop;

        // Debug logging
        console.log('Mobile Detection Debug:', {
            userAgent: userAgent,
            isMobileUA: isMobileUA,
            isSmallScreen: isSmallScreen,
            hasTouch: hasTouch,
            isDesktop: isDesktop,
            result: result,
            screenSize: `${window.innerWidth}x${window.innerHeight}`
        });

        return result;
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
        // Only handle touch gestures on mobile devices
        if (!this.isMobileDevice()) return;

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
        // Only handle touch gestures on mobile devices
        if (!this.isMobileDevice()) return;

        event.preventDefault(); // Prevent scrolling
    }

    handleTouchEnd(event) {
        // Only handle touch gestures on mobile devices
        if (!this.isMobileDevice() || !this.touchStartPos) return;

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartPos.x;
        const deltaY = touch.clientY - this.touchStartPos.y;
        const deltaTime = Date.now() - this.touchStartPos.time;

        // Get game canvas for touch area calculations
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            this.touchStartPos = null;
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const touchStartX = this.touchStartPos.x - rect.left;
        const touchStartY = this.touchStartPos.y - rect.top;

        // Improved gesture recognition
        const minSwipeDistance = 40; // Minimum distance for a swipe
        const maxTapTime = 300; // Maximum time for a tap
        const maxTapDistance = 20; // Maximum distance for a tap

        const swipeDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Check if it's a tap (short time, small distance)
        if (deltaTime < maxTapTime && swipeDistance < maxTapDistance) {
            // Simple tap anywhere on the game area rotates the piece
            this.gameEngine.rotate();
            this.touchStartPos = null;
            return;
        }

        // Check if it's a swipe (sufficient distance and reasonable time)
        if (swipeDistance >= minSwipeDistance && deltaTime < 500) {
            // Determine swipe direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    // Swipe right
                    this.gameEngine.moveRight();
                } else {
                    // Swipe left
                    this.gameEngine.moveLeft();
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    // Swipe down - soft drop
                    this.gameEngine.softDrop();
                } else {
                    // Swipe up - hard drop
                    this.gameEngine.hardDrop();
                }
            }
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
