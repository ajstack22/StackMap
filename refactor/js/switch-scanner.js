/**
 * Switch Scanner
 * Implements adaptive switch scanning for single/dual switch users
 * Uses 0.65 timing rule for ADHD optimization
 */

class SwitchScanner {
    constructor() {
        // Configuration
        this.config = {
            // Timing settings (ms)
            BASE_SCAN_SPEED: 1500,      // Starting speed
            MIN_SCAN_SPEED: 500,        // Fastest allowed
            MAX_SCAN_SPEED: 3000,       // Slowest allowed
            SPEED_ADJUSTMENT: 100,      // Speed change increment
            
            // 0.65 rule for ADHD
            ACCEPTANCE_WINDOW: 0.65,    // 65% of scan cycle
            ANTICIPATION_THRESHOLD: 0.85, // Early activation threshold
            
            // Adaptive timing
            LEARNING_RATE: 0.1,         // How fast to adapt
            HISTORY_SIZE: 20,           // Activations to remember
            CONFIDENCE_THRESHOLD: 0.7,  // When to apply adaptations
            
            // Visual settings
            HIGHLIGHT_COLOR: '#FFD700',
            HIGHLIGHT_WIDTH: 4,
            GROUP_HIGHLIGHT_COLOR: '#FFA500',
            PULSE_ANIMATION: true,
            
            // Audio feedback
            AUDIO_ENABLED: true,
            SCAN_SOUND_FREQUENCY: 200,
            SELECT_SOUND_FREQUENCY: 400,
            ERROR_SOUND_FREQUENCY: 100,
            
            // Scanning modes
            AUTO_RESTART: true,         // Continue after selection
            GROUP_FIRST: true,          // Scan groups before items
            WRAP_AROUND: true,          // Loop at boundaries
            
            // Switch types
            SWITCH_MODES: ['single', 'dual', 'auto'],
            DEFAULT_MODE: 'single'
        };
        
        // State
        this.isActive = false;
        this.isPaused = false;
        this.currentIndex = -1;
        this.currentGroup = -1;
        this.scanTimer = null;
        this.scanSpeed = this.config.BASE_SCAN_SPEED;
        
        // Elements
        this.scanElements = [];
        this.scanGroups = [];
        this.currentElement = null;
        
        // Timing analysis
        this.activationHistory = [];
        this.timingProfile = {
            averageReactionTime: null,
            consistency: null,
            anticipationRate: 0,
            missRate: 0
        };
        
        // Audio context
        this.audioContext = null;
        this.oscillator = null;
        
        // Switch detection
        this.switchMode = this.config.DEFAULT_MODE;
        this.switches = new Map();
        
        // Event listeners
        this.listeners = new Map();
        
        // Initialize
        this.init();
    }
    
    init() {
        // Set up audio
        if (this.config.AUDIO_ENABLED && 'AudioContext' in window) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Load preferences
        this.loadPreferences();
        
        // Set up keyboard switches (default)
        this.setupDefaultSwitches();
        
        // Set up mutation observer for dynamic content
        this.setupMutationObserver();
        
        console.log('Switch Scanner initialized');
    }
    
    // Set up default keyboard switches
    setupDefaultSwitches() {
        // Space bar as primary switch
        this.addSwitch('primary', {
            key: ' ',
            keyCode: 32,
            action: 'activate'
        });
        
        // Enter as secondary switch (dual mode)
        this.addSwitch('secondary', {
            key: 'Enter',
            keyCode: 13,
            action: 'next'
        });
        
        // Set up keyboard listeners
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    // Add a switch configuration
    addSwitch(id, config) {
        this.switches.set(id, {
            ...config,
            pressed: false,
            lastActivation: 0
        });
    }
    
    // Handle key down
    handleKeyDown(event) {
        if (!this.isActive) return;
        
        for (const [id, switchConfig] of this.switches) {
            if (event.key === switchConfig.key || event.keyCode === switchConfig.keyCode) {
                event.preventDefault();
                
                if (!switchConfig.pressed) {
                    switchConfig.pressed = true;
                    switchConfig.lastActivation = Date.now();
                    this.handleSwitchActivation(id, switchConfig);
                }
            }
        }
    }
    
    // Handle key up
    handleKeyUp(event) {
        for (const [id, switchConfig] of this.switches) {
            if (event.key === switchConfig.key || event.keyCode === switchConfig.keyCode) {
                event.preventDefault();
                switchConfig.pressed = false;
            }
        }
    }
    
    // Handle switch activation
    handleSwitchActivation(id, switchConfig) {
        const now = Date.now();
        
        // Record activation timing
        if (this.scanTimer) {
            const scanPosition = (now - this.lastScanTime) / this.scanSpeed;
            this.recordActivation(scanPosition);
        }
        
        // Perform action based on mode and switch
        if (this.switchMode === 'single') {
            // Single switch: activate on any press
            this.activate();
        } else if (this.switchMode === 'dual') {
            // Dual switch: primary activates, secondary advances
            if (id === 'primary') {
                this.activate();
            } else if (id === 'secondary') {
                this.next();
            }
        } else if (this.switchMode === 'auto') {
            // Auto mode: adapt to user's pattern
            this.handleAutoMode(id);
        }
        
        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    }
    
    // Start scanning
    start(elements = null) {
        if (this.isActive) return;
        
        // Find scannable elements
        if (elements) {
            this.scanElements = Array.from(elements);
        } else {
            this.findScannableElements();
        }
        
        if (this.scanElements.length === 0) {
            console.warn('No scannable elements found');
            return;
        }
        
        this.isActive = true;
        this.currentIndex = -1;
        this.currentGroup = -1;
        
        // Start scanning
        this.next();
        
        // Trigger start event
        this.trigger('start', {
            elementCount: this.scanElements.length,
            groupCount: this.scanGroups.length
        });
    }
    
    // Stop scanning
    stop() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.clearHighlight();
        
        if (this.scanTimer) {
            clearTimeout(this.scanTimer);
            this.scanTimer = null;
        }
        
        // Stop audio
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator = null;
        }
        
        // Trigger stop event
        this.trigger('stop');
    }
    
    // Pause scanning
    pause() {
        if (!this.isActive || this.isPaused) return;
        
        this.isPaused = true;
        
        if (this.scanTimer) {
            clearTimeout(this.scanTimer);
            this.scanTimer = null;
        }
        
        this.trigger('pause');
    }
    
    // Resume scanning
    resume() {
        if (!this.isActive || !this.isPaused) return;
        
        this.isPaused = false;
        this.scheduleNext();
        
        this.trigger('resume');
    }
    
    // Move to next element
    next() {
        if (!this.isActive || this.isPaused) return;
        
        // Clear current highlight
        this.clearHighlight();
        
        // Determine next element based on mode
        if (this.config.GROUP_FIRST && this.scanGroups.length > 0) {
            this.nextWithGroups();
        } else {
            this.nextLinear();
        }
        
        // Highlight new element
        this.highlightCurrent();
        
        // Play scan sound
        if (this.config.AUDIO_ENABLED) {
            this.playSound(this.config.SCAN_SOUND_FREQUENCY, 50);
        }
        
        // Schedule next scan
        this.scheduleNext();
    }
    
    // Linear scanning
    nextLinear() {
        this.currentIndex++;
        
        if (this.currentIndex >= this.scanElements.length) {
            if (this.config.WRAP_AROUND) {
                this.currentIndex = 0;
            } else {
                this.currentIndex = this.scanElements.length - 1;
                this.stop();
                return;
            }
        }
        
        this.currentElement = this.scanElements[this.currentIndex];
    }
    
    // Group-based scanning
    nextWithGroups() {
        // If no group selected, move to next group
        if (this.currentGroup === -1 || this.currentIndex === -1) {
            this.currentGroup++;
            
            if (this.currentGroup >= this.scanGroups.length) {
                if (this.config.WRAP_AROUND) {
                    this.currentGroup = 0;
                } else {
                    this.stop();
                    return;
                }
            }
            
            // Highlight entire group
            this.highlightGroup(this.currentGroup);
            this.currentIndex = -1;
            this.currentElement = null;
        } else {
            // Move within current group
            const group = this.scanGroups[this.currentGroup];
            const groupElements = this.scanElements.filter(el => 
                el.closest('[data-scan-group="' + group.id + '"]')
            );
            
            this.currentIndex++;
            
            if (this.currentIndex >= groupElements.length) {
                // Move to next group
                this.currentGroup++;
                this.currentIndex = -1;
                
                if (this.currentGroup >= this.scanGroups.length) {
                    if (this.config.WRAP_AROUND) {
                        this.currentGroup = 0;
                    } else {
                        this.stop();
                        return;
                    }
                }
                
                this.highlightGroup(this.currentGroup);
                this.currentElement = null;
            } else {
                this.currentElement = groupElements[this.currentIndex];
            }
        }
    }
    
    // Activate current element
    activate() {
        if (!this.currentElement) {
            // If group is highlighted, enter the group
            if (this.currentGroup >= 0 && this.currentIndex === -1) {
                this.currentIndex = 0;
                this.next();
                return;
            }
            
            // No selection
            if (this.config.AUDIO_ENABLED) {
                this.playSound(this.config.ERROR_SOUND_FREQUENCY, 200);
            }
            return;
        }
        
        // Play selection sound
        if (this.config.AUDIO_ENABLED) {
            this.playSound(this.config.SELECT_SOUND_FREQUENCY, 100);
        }
        
        // Trigger element's action
        this.triggerElementAction(this.currentElement);
        
        // Record successful activation
        this.recordSuccessfulActivation();
        
        // Trigger activation event
        this.trigger('activate', {
            element: this.currentElement,
            index: this.currentIndex,
            group: this.currentGroup
        });
        
        // Auto-restart or stop
        if (this.config.AUTO_RESTART) {
            setTimeout(() => {
                this.currentIndex = -1;
                this.currentGroup = -1;
                this.next();
            }, 500);
        } else {
            this.stop();
        }
    }
    
    // Trigger element action
    triggerElementAction(element) {
        // Check for custom action
        const customAction = element.dataset.scanAction;
        if (customAction) {
            this.trigger('customAction', {
                action: customAction,
                element: element
            });
            return;
        }
        
        // Default actions based on element type
        if (element.matches('button, [role="button"]')) {
            element.click();
        } else if (element.matches('a[href]')) {
            element.click();
        } else if (element.matches('input[type="checkbox"], input[type="radio"]')) {
            element.checked = !element.checked;
            element.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (element.matches('input, textarea')) {
            element.focus();
        } else if (element.matches('select')) {
            element.focus();
            // Could open dropdown
        } else {
            // Generic click
            element.click();
        }
    }
    
    // Schedule next scan
    scheduleNext() {
        if (this.scanTimer) {
            clearTimeout(this.scanTimer);
        }
        
        this.lastScanTime = Date.now();
        this.scanTimer = setTimeout(() => {
            this.next();
        }, this.scanSpeed);
    }
    
    // Find scannable elements
    findScannableElements() {
        // Default selector for scannable elements
        const selector = [
            'button:not(:disabled)',
            'a[href]',
            'input:not(:disabled)',
            'textarea:not(:disabled)',
            'select:not(:disabled)',
            '[role="button"]:not([aria-disabled="true"])',
            '[tabindex]:not([tabindex="-1"])',
            '[data-scannable="true"]'
        ].join(', ');
        
        this.scanElements = Array.from(document.querySelectorAll(selector))
            .filter(el => this.isVisible(el));
        
        // Find groups
        this.findScanGroups();
        
        // Sort by visual order
        this.sortByVisualOrder();
    }
    
    // Find scan groups
    findScanGroups() {
        const groups = document.querySelectorAll('[data-scan-group]');
        this.scanGroups = Array.from(groups).map((group, index) => ({
            element: group,
            id: group.dataset.scanGroup || index,
            priority: parseInt(group.dataset.scanPriority) || 0
        }));
        
        // Sort by priority
        this.scanGroups.sort((a, b) => b.priority - a.priority);
    }
    
    // Sort elements by visual order
    sortByVisualOrder() {
        this.scanElements.sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            
            // Top to bottom, left to right
            if (Math.abs(rectA.top - rectB.top) > 10) {
                return rectA.top - rectB.top;
            }
            return rectA.left - rectB.left;
        });
    }
    
    // Check if element is visible
    isVisible(element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return rect.width > 0 && 
               rect.height > 0 && 
               style.display !== 'none' && 
               style.visibility !== 'hidden' &&
               style.opacity !== '0';
    }
    
    // Highlight current element
    highlightCurrent() {
        if (!this.currentElement) return;
        
        this.currentElement.classList.add('scan-highlight');
        
        // Add outline for better visibility
        const originalOutline = this.currentElement.style.outline;
        this.currentElement.style.outline = `${this.config.HIGHLIGHT_WIDTH}px solid ${this.config.HIGHLIGHT_COLOR}`;
        this.currentElement.dataset.originalOutline = originalOutline;
        
        // Ensure element is in view
        this.currentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
        
        // Pulse animation
        if (this.config.PULSE_ANIMATION) {
            this.currentElement.style.animation = 'scan-pulse 0.5s ease-in-out';
        }
    }
    
    // Highlight group
    highlightGroup(groupIndex) {
        const group = this.scanGroups[groupIndex];
        if (!group) return;
        
        group.element.classList.add('scan-group', 'scanning');
    }
    
    // Clear highlight
    clearHighlight() {
        // Clear element highlights
        document.querySelectorAll('.scan-highlight').forEach(el => {
            el.classList.remove('scan-highlight');
            if (el.dataset.originalOutline !== undefined) {
                el.style.outline = el.dataset.originalOutline;
                delete el.dataset.originalOutline;
            }
            el.style.animation = '';
        });
        
        // Clear group highlights
        document.querySelectorAll('.scanning').forEach(el => {
            el.classList.remove('scanning');
        });
    }
    
    // Play sound
    playSound(frequency, duration) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }
    
    // Record activation timing
    recordActivation(scanPosition) {
        const activation = {
            timestamp: Date.now(),
            scanPosition: scanPosition,
            scanSpeed: this.scanSpeed,
            success: false // Will be updated if activation succeeds
        };
        
        this.activationHistory.push(activation);
        
        // Keep only recent history
        if (this.activationHistory.length > this.config.HISTORY_SIZE) {
            this.activationHistory.shift();
        }
        
        // Analyze timing patterns
        this.analyzeTimingPatterns();
    }
    
    // Record successful activation
    recordSuccessfulActivation() {
        if (this.activationHistory.length > 0) {
            this.activationHistory[this.activationHistory.length - 1].success = true;
        }
    }
    
    // Analyze timing patterns
    analyzeTimingPatterns() {
        if (this.activationHistory.length < 5) return;
        
        // Calculate average reaction time
        const recentActivations = this.activationHistory.slice(-10);
        const scanPositions = recentActivations.map(a => a.scanPosition);
        
        // Average position in scan cycle when activated
        const avgPosition = scanPositions.reduce((a, b) => a + b) / scanPositions.length;
        
        // Check for anticipation (activating early)
        const anticipationCount = scanPositions.filter(p => p < this.config.ACCEPTANCE_WINDOW).length;
        this.timingProfile.anticipationRate = anticipationCount / scanPositions.length;
        
        // Check for late activations
        const lateCount = scanPositions.filter(p => p > this.config.ANTICIPATION_THRESHOLD).length;
        this.timingProfile.missRate = lateCount / scanPositions.length;
        
        // Calculate consistency (standard deviation)
        const variance = scanPositions.reduce((sum, pos) => {
            return sum + Math.pow(pos - avgPosition, 2);
        }, 0) / scanPositions.length;
        this.timingProfile.consistency = 1 - Math.sqrt(variance);
        
        // Adapt scan speed if patterns are consistent
        if (this.timingProfile.consistency > this.config.CONFIDENCE_THRESHOLD) {
            this.adaptScanSpeed();
        }
    }
    
    // Adapt scan speed based on user patterns
    adaptScanSpeed() {
        let adjustment = 0;
        
        // If user anticipates, speed up
        if (this.timingProfile.anticipationRate > 0.5) {
            adjustment = -this.config.SPEED_ADJUSTMENT;
        }
        // If user misses frequently, slow down
        else if (this.timingProfile.missRate > 0.3) {
            adjustment = this.config.SPEED_ADJUSTMENT;
        }
        
        // Apply adjustment with learning rate
        if (adjustment !== 0) {
            const newSpeed = this.scanSpeed + (adjustment * this.config.LEARNING_RATE);
            this.scanSpeed = Math.max(
                this.config.MIN_SCAN_SPEED,
                Math.min(this.config.MAX_SCAN_SPEED, newSpeed)
            );
            
            // Notify of speed change
            this.trigger('speedAdapted', {
                oldSpeed: this.scanSpeed - (adjustment * this.config.LEARNING_RATE),
                newSpeed: this.scanSpeed,
                reason: adjustment < 0 ? 'anticipation' : 'misses'
            });
        }
    }
    
    // Handle auto mode
    handleAutoMode(switchId) {
        // In auto mode, learn from user's switch patterns
        // This is a simplified implementation
        if (this.currentElement) {
            this.activate();
        } else {
            this.next();
        }
    }
    
    // Set up mutation observer
    setupMutationObserver() {
        const observer = new MutationObserver(() => {
            if (this.isActive) {
                // Debounce updates
                clearTimeout(this.updateTimer);
                this.updateTimer = setTimeout(() => {
                    this.findScannableElements();
                }, 500);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'aria-disabled', 'hidden']
        });
    }
    
    // Event handling
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (!this.listeners.has(event)) return;
        
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }
    
    trigger(event, data) {
        if (!this.listeners.has(event)) return;
        
        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in switch scanner event listener:', error);
            }
        });
    }
    
    // Settings
    updateConfig(config) {
        Object.assign(this.config, config);
        this.savePreferences();
    }
    
    setSpeed(speed) {
        this.scanSpeed = Math.max(
            this.config.MIN_SCAN_SPEED,
            Math.min(this.config.MAX_SCAN_SPEED, speed)
        );
    }
    
    setSwitchMode(mode) {
        if (this.config.SWITCH_MODES.includes(mode)) {
            this.switchMode = mode;
            this.savePreferences();
        }
    }
    
    // Preferences
    loadPreferences() {
        try {
            const saved = localStorage.getItem('switchScannerPreferences');
            if (saved) {
                const prefs = JSON.parse(saved);
                this.scanSpeed = prefs.scanSpeed || this.config.BASE_SCAN_SPEED;
                this.switchMode = prefs.switchMode || this.config.DEFAULT_MODE;
                Object.assign(this.config, prefs.config || {});
            }
        } catch (error) {
            console.error('Failed to load switch scanner preferences:', error);
        }
    }
    
    savePreferences() {
        try {
            localStorage.setItem('switchScannerPreferences', JSON.stringify({
                scanSpeed: this.scanSpeed,
                switchMode: this.switchMode,
                config: this.config
            }));
        } catch (error) {
            console.error('Failed to save switch scanner preferences:', error);
        }
    }
    
    // Public API
    isScanning() {
        return this.isActive;
    }
    
    getTimingProfile() {
        return { ...this.timingProfile };
    }
    
    getCurrentSpeed() {
        return this.scanSpeed;
    }
    
    reset() {
        this.stop();
        this.scanSpeed = this.config.BASE_SCAN_SPEED;
        this.activationHistory = [];
        this.timingProfile = {
            averageReactionTime: null,
            consistency: null,
            anticipationRate: 0,
            missRate: 0
        };
    }
}

// Export
window.SwitchScanner = SwitchScanner;