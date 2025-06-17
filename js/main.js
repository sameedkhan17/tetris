// Main application entry point
class TetrisGame {
    constructor() {
        this.gameEngine = null;
        this.renderer = null;
        this.inputHandler = null;
        this.audioManager = null;
        
        this.isInitialized = false;
        this.initPromise = null;
    }
    
    // Initialize the game
    async initialize() {
        if (this.initPromise) {
            return this.initPromise;
        }
        
        this.initPromise = this._doInitialize();
        return this.initPromise;
    }
    
    async _doInitialize() {
        try {
            // console.log('Initializing Tetris game...');
            
            // Get canvas elements
            const gameCanvas = document.getElementById('gameCanvas');
            const nextCanvas = document.getElementById('nextCanvas');

            if (!gameCanvas || !nextCanvas) {
                throw new Error('Required canvas elements not found');
            }
            
            // Create game engine
            this.gameEngine = new GameEngine();
            
            // Create renderer
            this.renderer = new Renderer(gameCanvas, nextCanvas);
            this.gameEngine.setRenderer(this.renderer);
            
            // Create input handler
            this.inputHandler = new InputHandler(this.gameEngine);
            this.gameEngine.setInputHandler(this.inputHandler);
            
            // Create audio manager
            this.audioManager = new AudioManager();
            this.gameEngine.setAudioManager(this.audioManager);
            
            // Initialize audio on first user interaction
            this.setupAudioInitialization();
            
            // Setup UI event handlers
            this.setupUIHandlers();
            
            // Start the game
            this.gameEngine.start();

            // Show audio status if audio isn't initialized
            this.showAudioStatusIfNeeded();

            this.isInitialized = true;
            console.log('Tetris game initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Tetris game:', error);
            this.showError('Failed to initialize game. Please refresh the page.');
        }
    }
    
    // Setup audio initialization on first user interaction
    setupAudioInitialization() {
        const initAudio = async () => {
            try {
                await this.audioManager.initialize();
                console.log('Audio initialized');

                // Start background music immediately after audio initialization
                setTimeout(() => {
                    if (this.audioManager && this.audioManager.isInitialized) {
                        this.audioManager.startBackgroundMusic();
                        console.log('Background music started');
                        this.hideAudioStatus();
                    }
                }, 100); // Small delay to ensure audio context is ready

            } catch (error) {
                console.warn('Audio initialization failed:', error);
            }
        };

        // Listen for first user interaction
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('keydown', initAudio, { once: true });
        document.addEventListener('touchstart', initAudio, { once: true });

        // Also try to initialize on page load (some browsers allow this)
        window.addEventListener('load', () => {
            setTimeout(initAudio, 500);
        });
    }
    
    // Setup UI event handlers
    setupUIHandlers() {
        // Pause button
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                this.gameEngine.togglePause();
            });
        }
        
        // New game button
        const newGameButton = document.getElementById('newGameButton');
        if (newGameButton) {
            newGameButton.addEventListener('click', () => {
                this.gameEngine.restart();
            });
        }
        
        // Restart button (in overlay)
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                this.gameEngine.restart();
            });
        }
        
        // Volume controls
        const musicVolumeSlider = document.getElementById('musicVolume');
        if (musicVolumeSlider) {
            musicVolumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value) / 100;
                if (this.audioManager) {
                    this.audioManager.setMusicVolume(volume);
                }
            });
        }
        
        const sfxVolumeSlider = document.getElementById('sfxVolume');
        if (sfxVolumeSlider) {
            sfxVolumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value) / 100;
                if (this.audioManager) {
                    this.audioManager.setSfxVolume(volume);
                }
            });
        }
        
        // Handle window focus/blur for pause
        window.addEventListener('blur', () => {
            if (this.gameEngine && !this.gameEngine.gameState.isGameOver && !this.gameEngine.gameState.isPaused) {
                this.gameEngine.togglePause();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));
        
        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.gameEngine && !this.gameEngine.gameState.isGameOver && !this.gameEngine.gameState.isPaused) {
                this.gameEngine.togglePause();
            }
        });
    }
    
    // Handle window resize
    handleResize() {
        if (!this.renderer) return;
        
        // Recalculate canvas sizes if needed
        const gameCanvas = document.getElementById('gameCanvas');
        if (gameCanvas) {
            const container = gameCanvas.parentElement;
            const containerRect = container.getBoundingClientRect();
            
            // Maintain aspect ratio
            const aspectRatio = GAME_CONFIG.BOARD_WIDTH / GAME_CONFIG.BOARD_HEIGHT;
            let newWidth = containerRect.width;
            let newHeight = newWidth / aspectRatio;
            
            if (newHeight > containerRect.height) {
                newHeight = containerRect.height;
                newWidth = newHeight * aspectRatio;
            }
            
            // Update canvas display size (CSS)
            gameCanvas.style.width = `${newWidth}px`;
            gameCanvas.style.height = `${newHeight}px`;
        }
    }
    
    // Show error message
    showError(message) {
        const overlay = document.getElementById('gameOverlay');
        const title = document.getElementById('overlayTitle');
        const messageEl = document.getElementById('overlayMessage');
        
        if (overlay && title && messageEl) {
            overlay.classList.add('active');
            title.textContent = 'ERROR';
            messageEl.textContent = message;
        } else {
            alert(message);
        }
    }
    
    // Show audio status if needed
    showAudioStatusIfNeeded() {
        const audioStatus = document.getElementById('audioStatus');
        if (audioStatus && (!this.audioManager || !this.audioManager.isInitialized)) {
            audioStatus.style.display = 'block';
        }
    }

    // Hide audio status
    hideAudioStatus() {
        const audioStatus = document.getElementById('audioStatus');
        if (audioStatus) {
            audioStatus.style.display = 'none';
        }
    }

    // Get game statistics
    getStats() {
        if (!this.gameEngine) return null;

        return {
            score: this.gameEngine.gameState.score,
            lines: this.gameEngine.gameState.lines,
            level: this.gameEngine.gameState.level,
            highScore: this.gameEngine.highScore,
            isGameOver: this.gameEngine.gameState.isGameOver,
            isPaused: this.gameEngine.gameState.isPaused
        };
    }
    
    // Cleanup
    destroy() {
        if (this.gameEngine) {
            this.gameEngine.destroy();
        }
        
        console.log('Tetris game destroyed');
    }
}

// Global game instance
let tetrisGame = null;

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        tetrisGame = new TetrisGame();
        await tetrisGame.initialize();
        
        // Make game instance globally available for debugging
        window.tetrisGame = tetrisGame;
        
    } catch (error) {
        console.error('Failed to start Tetris game:', error);
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (tetrisGame) {
        tetrisGame.destroy();
    }
});

// Service Worker registration for offline play (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TetrisGame };
}
