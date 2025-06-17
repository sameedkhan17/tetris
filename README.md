# 🎮 Tetris Clone

A fully functional Tetris clone built with modern web technologies including HTML5 Canvas, JavaScript ES6+, and Web Audio API.

## 🚀 [Play Online](https://your-tetris-game.vercel.app)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/tetris-game)

![Tetris Game Screenshot](https://via.placeholder.com/800x400/000000/00FFFF?text=Tetris+Game+Screenshot)

## Features

### Core Game Mechanics
- **7 Standard Tetrominoes**: I, O, T, S, Z, J, L pieces with official colors
- **Super Rotation System (SRS)**: Proper rotation with wall kicks
- **10×20 Game Board**: Standard Tetris dimensions with 4 buffer rows
- **Line Clearing**: Full line detection with gravity and scoring
- **Level Progression**: Speed increases every 10 lines cleared

### Advanced Features
- **Ghost Piece**: Shows where the current piece will land
- **Next Piece Preview**: Shows upcoming piece
- **Scoring System**: 100/300/500/800 points for 1-4 lines
- **High Score Persistence**: Saves high scores using localStorage
- **Sound Effects**: Generated using Web Audio API
- **Background Music**: Enhanced Tetris-inspired melody with stereo mixing
- **Particle Effects**: Visual effects for line clears
- **Screen Shake**: Feedback for Tetris (4-line) clears

### Controls

#### Desktop (Keyboard)
- **Arrow Keys**: Move left/right, rotate (up), soft drop (down)
- **Space**: Hard drop
- **P**: Pause/Resume
- **R**: Restart (when game over)
- **Esc**: Pause

#### Mobile (Touch)
- **Touch Controls**: On-screen buttons for all actions
- **Swipe Gestures**: 
  - Horizontal swipe: Move left/right
  - Vertical swipe down: Soft drop
  - Vertical swipe up: Hard drop
  - Quick tap: Rotate

### Technical Implementation

#### Architecture
- **Modular Design**: Separate classes for different responsibilities
- **GameEngine**: Core game logic and state management
- **Renderer**: Canvas rendering with animations and effects
- **InputHandler**: Keyboard and touch input with DAS/ARR timing
- **AudioManager**: Web Audio API sound generation
- **Tetromino**: Piece logic with SRS rotation system

#### Performance
- **60 FPS**: Smooth gameplay with requestAnimationFrame
- **Optimized Rendering**: Cached gradients and efficient drawing
- **Responsive Design**: Works on desktop and mobile devices

## 🎯 Getting Started

### 🌐 Play Online
Simply visit: **[https://your-tetris-game.vercel.app](https://your-tetris-game.vercel.app)**

### 💻 Running Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tetris-game.git
   cd tetris-game
   ```

2. Start a local web server:
   ```bash
   # Using Python 3
   python3 -m http.server 8000

   # Using Node.js
   npx http-server

   # Using PHP
   php -S localhost:8000

   # Using npm (if you have package.json)
   npm start
   ```

3. Open `http://localhost:8000` in your browser
4. Click anywhere or press any key to initialize audio
5. Start playing!

### 🚀 Deploy Your Own
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/tetris-game)

### File Structure
```
tetris/
├── index.html          # Main HTML structure
├── styles/
│   └── main.css        # Responsive styling and animations
├── js/
│   ├── main.js         # Application entry point
│   ├── GameEngine.js   # Core game logic
│   ├── Tetromino.js    # Piece logic and SRS rotation
│   ├── Renderer.js     # Canvas rendering and effects
│   ├── InputHandler.js # Input handling (keyboard/touch)
│   ├── AudioManager.js # Sound effects and music
│   └── utils.js        # Constants and utility functions
├── sw.js               # Service worker for offline play
└── README.md           # This file
```

## Game Rules

### Scoring
- **Single Line**: 100 × level
- **Double Lines**: 300 × level  
- **Triple Lines**: 500 × level
- **Tetris (4 lines)**: 800 × level
- **Soft Drop**: 1 point per cell
- **Hard Drop**: 2 points per cell

### Level Progression
- Level increases every 10 lines cleared
- Fall speed increases with each level
- Maximum challenge at higher levels

### Performance Optimizations
- **60 FPS Gameplay**: Smooth rendering with optimized game loop
- **Efficient Rendering**: Reduced canvas operations and smart redraw detection
- **Memory Management**: Optimized particle systems and animation handling
- **Responsive Controls**: Enhanced input handling with proper timing

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 13+)
- **Mobile Browsers**: Touch controls enabled

## Development

### Adding New Features
The modular architecture makes it easy to extend:

1. **New Piece Types**: Add to `TETROMINO_SHAPES` in `utils.js`
2. **Sound Effects**: Add to `AudioManager.generateSoundEffects()`
3. **Visual Effects**: Extend `Renderer` class methods
4. **Game Modes**: Modify `GameEngine` state management

### Performance Optimization
- Canvas operations are optimized for 60 FPS
- Gradient caching reduces redundant calculations
- Efficient collision detection algorithms
- Minimal DOM manipulation during gameplay

## Credits

Built following official Tetris guidelines and modern web development best practices.

- **SRS Rotation**: Based on official Super Rotation System
- **Scoring**: Standard Tetris scoring system
- **Colors**: Official Tetris piece colors
- **Audio**: Generated using Web Audio API
- **Fonts**: Google Fonts (Orbitron)

## License

This project is for educational purposes. Tetris is a trademark of The Tetris Company.
