class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.isInitialized = false;
        
        // Volume settings
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
        
        // Audio buffers for sound effects
        this.soundBuffers = new Map();
        
        // Background music
        this.backgroundMusic = null;
        this.musicSource = null;
        this.musicBuffer = null;
        
        // Initialize on first user interaction
        this.initPromise = null;
    }
    
    // Initialize Web Audio API
    async initialize() {
        if (this.initPromise) {
            return this.initPromise;
        }
        
        this.initPromise = this._doInitialize();
        return this.initPromise;
    }
    
    async _doInitialize() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes for volume control
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            
            // Connect gain nodes
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
            
            // Set initial volumes
            this.musicGain.gain.value = this.musicVolume;
            this.sfxGain.gain.value = this.sfxVolume;
            
            // Generate sound effects
            await this.generateSoundEffects();

            // Load background music from MP3 file
            await this.loadBackgroundMusic();
            
            this.isInitialized = true;
            // console.log('AudioManager initialized successfully');

            // Auto-start background music if possible
            setTimeout(() => {
                this.startBackgroundMusic();
            }, 200);
            
        } catch (error) {
            console.warn('AudioManager initialization failed:', error);
            this.isInitialized = false;
        }
    }
    
    // Generate sound effects using Web Audio API
    async generateSoundEffects() {
        const sounds = {
            move: () => this.generateTone(200, 0.1, 'square'),
            rotate: () => this.generateTone(300, 0.1, 'triangle'),
            drop: () => this.generateTone(150, 0.2, 'sawtooth'),
            lineClear1: () => this.generateLineClearSound(1),
            lineClear2: () => this.generateLineClearSound(2),
            lineClear3: () => this.generateLineClearSound(3),
            tetris: () => this.generateTetrisSound(),
            gameOver: () => this.generateGameOverSound(),
            levelUp: () => this.generateLevelUpSound()
        };
        
        for (const [name, generator] of Object.entries(sounds)) {
            try {
                this.soundBuffers.set(name, generator());
            } catch (error) {
                console.warn(`Failed to generate sound: ${name}`, error);
            }
        }
    }
    
    // Generate a simple tone
    generateTone(frequency, duration, waveType = 'sine') {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            switch (waveType) {
                case 'sine':
                    sample = Math.sin(2 * Math.PI * frequency * t);
                    break;
                case 'square':
                    sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
                    break;
                case 'triangle':
                    sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t));
                    break;
                case 'sawtooth':
                    sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
                    break;
            }
            
            // Apply envelope (fade in/out)
            const envelope = Math.min(1, Math.min(i / (sampleRate * 0.01), (length - i) / (sampleRate * 0.05)));
            data[i] = sample * envelope * 0.3;
        }
        
        return buffer;
    }
    
    // Generate line clear sound effect (different for different line counts)
    generateLineClearSound(lineCount = 1) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.3 + (lineCount * 0.1);
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        // Different base frequencies for different line counts
        const baseFreq = 300 + (lineCount * 100);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const frequency = baseFreq + 150 * Math.sin(t * 8 * lineCount);
            const sample = Math.sin(2 * Math.PI * frequency * t) * 0.6 +
                          Math.sin(2 * Math.PI * frequency * 2 * t) * 0.2;
            const envelope = Math.exp(-t * (2 + lineCount));
            data[i] = sample * envelope * 0.5;
        }

        return buffer;
    }
    
    // Generate Tetris (4-line clear) sound effect
    generateTetrisSound() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.8;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.floor(t * 8) % notes.length;
            const frequency = notes[noteIndex];
            const sample = Math.sin(2 * Math.PI * frequency * t);
            const envelope = Math.exp(-t * 2);
            data[i] = sample * envelope * 0.5;
        }
        
        return buffer;
    }
    
    // Generate game over sound
    generateGameOverSound() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 1.5;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const frequency = 200 - t * 100;
            const sample = Math.sin(2 * Math.PI * frequency * t);
            const envelope = Math.exp(-t * 1.5);
            data[i] = sample * envelope * 0.4;
        }
        
        return buffer;
    }
    
    // Generate level up sound
    generateLevelUpSound() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.6;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        const notes = [523, 659, 784]; // C5, E5, G5
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.floor(t * 6) % notes.length;
            const frequency = notes[noteIndex];
            const sample = Math.sin(2 * Math.PI * frequency * t);
            const envelope = Math.min(1, Math.exp(-t * 2));
            data[i] = sample * envelope * 0.4;
        }
        
        return buffer;
    }
    
    // Generate background music
    generateBackgroundMusic() {
        // Enhanced Tetris-like melody (Korobeiniki inspired)
        const melody = [
            // Main theme
            659, 494, 523, 587, 523, 494, 440, 440, 523, 659, 587, 523,
            494, 523, 587, 659, 523, 440, 440, 440, 587, 698, 880, 784,
            698, 659, 523, 659, 587, 523, 494, 494, 523, 587, 659, 523, 440, 440,
            // Variation
            659, 494, 523, 587, 523, 494, 440, 440, 523, 659, 587, 523,
            494, 523, 587, 659, 523, 440, 440, 440
        ];

        const bass = [
            // Bass line
            220, 220, 220, 220, 196, 196, 196, 196, 220, 220, 220, 220,
            196, 196, 220, 220, 196, 196, 175, 175, 196, 196, 220, 220,
            196, 196, 175, 175, 196, 196, 220, 220, 196, 196, 175, 175, 196, 196,
            220, 220, 220, 220, 196, 196, 196, 196, 220, 220, 220, 220,
            196, 196, 220, 220, 196, 196, 175, 175
        ];

        const sampleRate = this.audioContext.sampleRate;
        const noteDuration = 0.5; // Slightly slower tempo
        const totalDuration = melody.length * noteDuration;
        const length = sampleRate * totalDuration;
        const buffer = this.audioContext.createBuffer(2, length, sampleRate); // Stereo
        const leftData = buffer.getChannelData(0);
        const rightData = buffer.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.floor(t / noteDuration) % melody.length;
            const melodyFreq = melody[noteIndex];
            const bassFreq = bass[noteIndex % bass.length];
            const noteTime = (t % noteDuration) / noteDuration;

            // Melody (right channel dominant)
            const melodySample = Math.sin(2 * Math.PI * melodyFreq * t) * 0.4 +
                               Math.sin(2 * Math.PI * melodyFreq * 2 * t) * 0.1;

            // Bass (left channel dominant)
            const bassSample = Math.sin(2 * Math.PI * bassFreq * t) * 0.3 +
                             Math.sin(2 * Math.PI * bassFreq * 0.5 * t) * 0.1;

            // Envelope for smooth note transitions
            const envelope = Math.sin(noteTime * Math.PI) * 0.8 + 0.2;

            // Mix channels
            leftData[i] = (melodySample * 0.6 + bassSample * 0.8) * envelope * 0.15;
            rightData[i] = (melodySample * 0.8 + bassSample * 0.4) * envelope * 0.15;
        }

        this.backgroundMusic = buffer;
    }

    // Load background music from MP3 file
    async loadBackgroundMusic() {
        try {
            const response = await fetch('Tetris.mp3');
            if (!response.ok) {
                console.warn('Could not load Tetris.mp3, falling back to generated music');
                this.generateBackgroundMusic();
                return;
            }

            const arrayBuffer = await response.arrayBuffer();
            this.musicBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            // console.log('Background music loaded successfully');

        } catch (error) {
            console.warn('Failed to load MP3 background music:', error);
            console.log('Falling back to generated background music');
            this.generateBackgroundMusic();
        }
    }
    
    // Play sound effect
    playSound(soundName) {
        if (!this.isInitialized || !this.soundBuffers.has(soundName)) {
            return;
        }
        
        try {
            const buffer = this.soundBuffers.get(soundName);
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.sfxGain);
            source.start();
        } catch (error) {
            console.warn(`Failed to play sound: ${soundName}`, error);
        }
    }
    
    // Start background music
    startBackgroundMusic() {
        if (!this.isInitialized) {
            console.log('AudioManager not initialized, cannot start music');
            return;
        }

        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                this.startBackgroundMusic();
            });
            return;
        }

        this.stopBackgroundMusic();

        try {
            this.musicSource = this.audioContext.createBufferSource();

            // Use MP3 buffer if available, otherwise use generated music
            if (this.musicBuffer) {
                this.musicSource.buffer = this.musicBuffer;
                console.log('Starting MP3 background music');
            } else if (this.backgroundMusic) {
                this.musicSource.buffer = this.backgroundMusic;
                console.log('Starting generated background music');
            } else {
                console.warn('No background music available');
                return;
            }

            this.musicSource.loop = true;
            this.musicSource.connect(this.musicGain);
            this.musicSource.start();
            console.log('Background music started successfully');
        } catch (error) {
            console.warn('Failed to start background music:', error);
        }
    }
    
    // Stop background music
    stopBackgroundMusic() {
        if (this.musicSource) {
            try {
                this.musicSource.stop();
            } catch (error) {
                // Source might already be stopped
            }
            this.musicSource = null;
        }
    }
    
    // Set music volume
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }
    
    // Set SFX volume
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    }
    
    // Resume audio context (required for some browsers)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioManager };
}
