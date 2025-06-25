/**
 * Gesture Manager
 * Implements swipe gestures and pressure detection for ADHD/autism users
 * Supports touch, mouse, and Force Touch with graceful fallbacks
 */

(function(exports) {
    'use strict';
    
    // Gesture Manager
    const GestureManager = {
        // Configuration
        config: {
            // Swipe thresholds
            MIN_SWIPE_DISTANCE: 50,        // Minimum pixels for swipe
            MAX_SWIPE_TIME: 500,           // Maximum ms for swipe
            SWIPE_VELOCITY: 0.3,           // Minimum pixels/ms
            
            // Pressure thresholds
            LIGHT_PRESSURE: 0.1,           // Force Touch light
            MEDIUM_PRESSURE: 0.3,          // Force Touch medium  
            FIRM_PRESSURE: 0.5,            // Force Touch firm
            LONG_PRESS_TIME: 500,          // Fallback long press
            
            // ADHD optimizations
            GESTURE_TIMEOUT: 1000,         // Clear incomplete gestures
            VISUAL_FEEDBACK: true,         // Show gesture trails
            HAPTIC_FEEDBACK: true,         // Vibration feedback
            DOUBLE_TAP_TIME: 300,          // Double tap window
            
            // Tolerance settings
            DIRECTION_TOLERANCE: 30,       // Degrees of tolerance
            JITTER_THRESHOLD: 5,           // Ignore small movements
            PRESSURE_SMOOTHING: 0.7        // Smooth pressure readings
        },
        
        // State
        isInitialized: false,
        isEnabled: true,
        activeGestures: new Map(),
        lastTapTime: 0,
        lastTapPosition: null,
        pressureSupported: false,
        listeners: {},
        gestureHistory: [],
        
        // Initialize
        init: function() {
            if (this.isInitialized) return;
            
            // Check capabilities
            this.checkCapabilities();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load preferences
            this.loadPreferences();
            
            this.isInitialized = true;
            console.log('Gesture Manager initialized');
            
            return true;
        },
        
        // Check device capabilities
        checkCapabilities: function() {
            // Check for Force Touch / 3D Touch
            this.pressureSupported = this.checkPressureSupport();
            
            // Check for haptic feedback
            this.hapticSupported = 'vibrate' in navigator;
            
            // Check for pointer events
            this.pointerSupported = 'PointerEvent' in window;
            
            console.log('Gesture capabilities:', {
                pressure: this.pressureSupported,
                haptic: this.hapticSupported,
                pointer: this.pointerSupported
            });
        },
        
        // Check pressure support
        checkPressureSupport: function() {
            // Check for Force Touch (Safari)
            if ('ontouchforcechange' in document.documentElement) {
                return 'force';
            }
            
            // Check for Pointer Events pressure
            if (this.pointerSupported) {
                // Create test event to check for pressure
                const testEvent = new PointerEvent('test');
                if ('pressure' in testEvent || 'force' in testEvent) {
                    return 'pointer';
                }
            }
            
            return false;
        },
        
        // Setup event listeners
        setupEventListeners: function() {
            const self = this;
            
            // Use pointer events if available, fallback to touch/mouse
            if (this.pointerSupported) {
                document.addEventListener('pointerdown', (e) => self.handleStart(e), { passive: false });
                document.addEventListener('pointermove', (e) => self.handleMove(e), { passive: false });
                document.addEventListener('pointerup', (e) => self.handleEnd(e), { passive: false });
                document.addEventListener('pointercancel', (e) => self.handleCancel(e), { passive: false });
            } else {
                // Touch events
                document.addEventListener('touchstart', (e) => self.handleStart(e), { passive: false });
                document.addEventListener('touchmove', (e) => self.handleMove(e), { passive: false });
                document.addEventListener('touchend', (e) => self.handleEnd(e), { passive: false });
                document.addEventListener('touchcancel', (e) => self.handleCancel(e), { passive: false });
                
                // Mouse events (fallback)
                document.addEventListener('mousedown', (e) => self.handleStart(e), { passive: false });
                document.addEventListener('mousemove', (e) => self.handleMove(e), { passive: false });
                document.addEventListener('mouseup', (e) => self.handleEnd(e), { passive: false });
            }
            
            // Force Touch events (Safari)
            if (this.pressureSupported === 'force') {
                document.addEventListener('touchforcechange', (e) => self.handlePressureChange(e), { passive: false });
            }
            
            // Prevent context menu on long press
            document.addEventListener('contextmenu', (e) => {
                if (self.activeGestures.size > 0) {
                    e.preventDefault();
                }
            });
        },
        
        // Handle gesture start
        handleStart: function(event) {
            if (!this.isEnabled) return;
            
            // Get touch/pointer info
            const pointer = this.getPointerInfo(event);
            if (!pointer) return;
            
            // Create gesture object
            const gesture = {
                id: pointer.id,
                startX: pointer.x,
                startY: pointer.y,
                currentX: pointer.x,
                currentY: pointer.y,
                startTime: Date.now(),
                pressure: pointer.pressure || 0,
                maxPressure: pointer.pressure || 0,
                type: 'unknown',
                target: event.target,
                path: [{x: pointer.x, y: pointer.y, time: Date.now()}]
            };
            
            // Store active gesture
            this.activeGestures.set(pointer.id, gesture);
            
            // Check for double tap
            if (this.checkDoubleTap(pointer.x, pointer.y)) {
                this.handleDoubleTap(gesture);
                return;
            }
            
            // Start pressure monitoring
            if (this.pressureSupported) {
                this.startPressureMonitoring(gesture);
            } else {
                // Fallback to long press detection
                this.startLongPressDetection(gesture);
            }
            
            // Visual feedback
            if (this.config.VISUAL_FEEDBACK) {
                this.showGestureStart(pointer.x, pointer.y);
            }
            
            // Trigger start event
            this.trigger('gesturestart', gesture);
        },
        
        // Handle gesture move
        handleMove: function(event) {
            if (!this.isEnabled) return;
            
            const pointer = this.getPointerInfo(event);
            if (!pointer) return;
            
            const gesture = this.activeGestures.get(pointer.id);
            if (!gesture) return;
            
            // Update position
            const deltaX = pointer.x - gesture.currentX;
            const deltaY = pointer.y - gesture.currentY;
            
            // Ignore jitter
            if (Math.abs(deltaX) < this.config.JITTER_THRESHOLD && 
                Math.abs(deltaY) < this.config.JITTER_THRESHOLD) {
                return;
            }
            
            gesture.currentX = pointer.x;
            gesture.currentY = pointer.y;
            gesture.path.push({x: pointer.x, y: pointer.y, time: Date.now()});
            
            // Update pressure
            if (pointer.pressure !== undefined) {
                gesture.pressure = this.smoothPressure(gesture.pressure, pointer.pressure);
                gesture.maxPressure = Math.max(gesture.maxPressure, gesture.pressure);
            }
            
            // Detect gesture type
            this.detectGestureType(gesture);
            
            // Visual feedback
            if (this.config.VISUAL_FEEDBACK) {
                this.showGestureTrail(pointer.x, pointer.y);
            }
            
            // Trigger move event
            this.trigger('gesturemove', gesture);
        },
        
        // Handle gesture end
        handleEnd: function(event) {
            if (!this.isEnabled) return;
            
            const pointer = this.getPointerInfo(event);
            if (!pointer) return;
            
            const gesture = this.activeGestures.get(pointer.id);
            if (!gesture) return;
            
            // Finalize gesture
            gesture.endTime = Date.now();
            gesture.duration = gesture.endTime - gesture.startTime;
            
            // Recognize gesture
            const recognized = this.recognizeGesture(gesture);
            
            if (recognized) {
                // Haptic feedback
                if (this.config.HAPTIC_FEEDBACK && this.hapticSupported) {
                    this.provideHapticFeedback(recognized.type);
                }
                
                // Trigger gesture event
                this.trigger('gesture', recognized);
                
                // Add to history
                this.addToHistory(recognized);
            }
            
            // Cleanup
            this.activeGestures.delete(pointer.id);
            
            // Clear visual feedback
            if (this.config.VISUAL_FEEDBACK) {
                this.clearGestureVisuals();
            }
            
            // Update last tap for double tap detection
            this.lastTapTime = Date.now();
            this.lastTapPosition = {x: pointer.x, y: pointer.y};
        },
        
        // Handle gesture cancel
        handleCancel: function(event) {
            const pointer = this.getPointerInfo(event);
            if (pointer) {
                this.activeGestures.delete(pointer.id);
            }
            
            if (this.config.VISUAL_FEEDBACK) {
                this.clearGestureVisuals();
            }
        },
        
        // Handle pressure change (Force Touch)
        handlePressureChange: function(event) {
            const touches = event.touches;
            
            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];
                const gesture = this.activeGestures.get(touch.identifier);
                
                if (gesture && touch.force !== undefined) {
                    gesture.pressure = touch.force;
                    gesture.maxPressure = Math.max(gesture.maxPressure, touch.force);
                    
                    // Check for pressure gesture
                    this.checkPressureGesture(gesture);
                }
            }
        },
        
        // Get pointer info from event
        getPointerInfo: function(event) {
            let pointer = null;
            
            if (event.type.includes('touch')) {
                const touch = event.changedTouches ? event.changedTouches[0] : event.touches[0];
                if (touch) {
                    pointer = {
                        id: touch.identifier,
                        x: touch.pageX,
                        y: touch.pageY,
                        pressure: touch.force || 0
                    };
                }
            } else if (event.type.includes('pointer') || event.type.includes('mouse')) {
                pointer = {
                    id: event.pointerId || 0,
                    x: event.pageX,
                    y: event.pageY,
                    pressure: event.pressure || (event.buttons ? 0.5 : 0)
                };
            }
            
            return pointer;
        },
        
        // Detect gesture type
        detectGestureType: function(gesture) {
            const distance = Math.sqrt(
                Math.pow(gesture.currentX - gesture.startX, 2) +
                Math.pow(gesture.currentY - gesture.startY, 2)
            );
            
            const duration = Date.now() - gesture.startTime;
            
            // Check for swipe
            if (distance > this.config.MIN_SWIPE_DISTANCE) {
                const velocity = distance / duration;
                
                if (velocity > this.config.SWIPE_VELOCITY || 
                    duration < this.config.MAX_SWIPE_TIME) {
                    gesture.type = 'swipe';
                    gesture.direction = this.getSwipeDirection(gesture);
                }
            }
            
            // Check for pressure
            if (gesture.maxPressure > this.config.MEDIUM_PRESSURE) {
                gesture.type = 'pressure';
                gesture.level = this.getPressureLevel(gesture.maxPressure);
            }
            
            // Default to tap if still unknown
            if (gesture.type === 'unknown' && distance < 10) {
                gesture.type = 'tap';
            }
        },
        
        // Get swipe direction
        getSwipeDirection: function(gesture) {
            const deltaX = gesture.currentX - gesture.startX;
            const deltaY = gesture.currentY - gesture.startY;
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            
            // Determine direction with tolerance
            if (Math.abs(angle) < this.config.DIRECTION_TOLERANCE) {
                return 'right';
            } else if (Math.abs(angle - 180) < this.config.DIRECTION_TOLERANCE || 
                       Math.abs(angle + 180) < this.config.DIRECTION_TOLERANCE) {
                return 'left';
            } else if (Math.abs(angle - 90) < this.config.DIRECTION_TOLERANCE) {
                return 'down';
            } else if (Math.abs(angle + 90) < this.config.DIRECTION_TOLERANCE) {
                return 'up';
            }
            
            // Diagonal swipes
            if (angle > 0 && angle < 90) return 'down-right';
            if (angle > 90 && angle < 180) return 'down-left';
            if (angle < 0 && angle > -90) return 'up-right';
            if (angle < -90 && angle > -180) return 'up-left';
            
            return 'unknown';
        },
        
        // Get pressure level
        getPressureLevel: function(pressure) {
            if (pressure >= this.config.FIRM_PRESSURE) return 'firm';
            if (pressure >= this.config.MEDIUM_PRESSURE) return 'medium';
            if (pressure >= this.config.LIGHT_PRESSURE) return 'light';
            return 'none';
        },
        
        // Recognize final gesture
        recognizeGesture: function(gesture) {
            const distance = Math.sqrt(
                Math.pow(gesture.currentX - gesture.startX, 2) +
                Math.pow(gesture.currentY - gesture.startY, 2)
            );
            
            // Swipe gestures
            if (gesture.type === 'swipe' && gesture.direction) {
                return {
                    type: 'swipe',
                    direction: gesture.direction,
                    distance: distance,
                    duration: gesture.duration,
                    velocity: distance / gesture.duration,
                    startX: gesture.startX,
                    startY: gesture.startY,
                    endX: gesture.currentX,
                    endY: gesture.currentY,
                    target: gesture.target
                };
            }
            
            // Pressure gestures
            if (gesture.type === 'pressure' || gesture.maxPressure > this.config.LIGHT_PRESSURE) {
                return {
                    type: 'pressure',
                    level: this.getPressureLevel(gesture.maxPressure),
                    maxPressure: gesture.maxPressure,
                    duration: gesture.duration,
                    x: gesture.startX,
                    y: gesture.startY,
                    target: gesture.target
                };
            }
            
            // Long press (fallback for pressure)
            if (gesture.duration >= this.config.LONG_PRESS_TIME && distance < 10) {
                return {
                    type: 'longpress',
                    duration: gesture.duration,
                    x: gesture.startX,
                    y: gesture.startY,
                    target: gesture.target
                };
            }
            
            // Tap
            if (distance < 10 && gesture.duration < this.config.LONG_PRESS_TIME) {
                return {
                    type: 'tap',
                    x: gesture.startX,
                    y: gesture.startY,
                    target: gesture.target
                };
            }
            
            return null;
        },
        
        // Check for double tap
        checkDoubleTap: function(x, y) {
            if (!this.lastTapPosition) return false;
            
            const timeDiff = Date.now() - this.lastTapTime;
            const distance = Math.sqrt(
                Math.pow(x - this.lastTapPosition.x, 2) +
                Math.pow(y - this.lastTapPosition.y, 2)
            );
            
            return timeDiff < this.config.DOUBLE_TAP_TIME && distance < 30;
        },
        
        // Handle double tap
        handleDoubleTap: function(gesture) {
            const doubleTap = {
                type: 'doubletap',
                x: gesture.startX,
                y: gesture.startY,
                target: gesture.target
            };
            
            this.trigger('gesture', doubleTap);
            this.activeGestures.delete(gesture.id);
            
            // Reset double tap detection
            this.lastTapTime = 0;
            this.lastTapPosition = null;
        },
        
        // Start pressure monitoring (fallback)
        startPressureMonitoring: function(gesture) {
            // For browsers without pressure, simulate with timing
            if (!this.pressureSupported) {
                gesture.pressureTimer = setTimeout(() => {
                    gesture.pressure = 0.5;
                    gesture.maxPressure = 0.5;
                    this.checkPressureGesture(gesture);
                }, this.config.LONG_PRESS_TIME);
            }
        },
        
        // Start long press detection
        startLongPressDetection: function(gesture) {
            gesture.longPressTimer = setTimeout(() => {
                const current = this.activeGestures.get(gesture.id);
                if (current && current === gesture) {
                    // Check if still in same position
                    const distance = Math.sqrt(
                        Math.pow(gesture.currentX - gesture.startX, 2) +
                        Math.pow(gesture.currentY - gesture.startY, 2)
                    );
                    
                    if (distance < 10) {
                        gesture.type = 'longpress';
                        
                        // Trigger intermediate event
                        this.trigger('longpressdetected', gesture);
                        
                        // Haptic feedback
                        if (this.config.HAPTIC_FEEDBACK && this.hapticSupported) {
                            navigator.vibrate(50);
                        }
                    }
                }
            }, this.config.LONG_PRESS_TIME);
        },
        
        // Check pressure gesture
        checkPressureGesture: function(gesture) {
            const level = this.getPressureLevel(gesture.pressure);
            
            if (level !== 'none' && level !== gesture.lastPressureLevel) {
                gesture.lastPressureLevel = level;
                
                this.trigger('pressure', {
                    level: level,
                    pressure: gesture.pressure,
                    x: gesture.currentX,
                    y: gesture.currentY,
                    target: gesture.target
                });
                
                // Haptic feedback for pressure changes
                if (this.config.HAPTIC_FEEDBACK && this.hapticSupported) {
                    const vibrationPattern = {
                        light: 20,
                        medium: 40,
                        firm: 60
                    };
                    navigator.vibrate(vibrationPattern[level] || 30);
                }
            }
        },
        
        // Smooth pressure readings
        smoothPressure: function(current, next) {
            const smoothing = this.config.PRESSURE_SMOOTHING;
            return current * smoothing + next * (1 - smoothing);
        },
        
        // Visual feedback methods
        showGestureStart: function(x, y) {
            const indicator = document.createElement('div');
            indicator.className = 'gesture-start-indicator';
            indicator.style.left = x + 'px';
            indicator.style.top = y + 'px';
            document.body.appendChild(indicator);
            
            setTimeout(() => indicator.remove(), 500);
        },
        
        showGestureTrail: function(x, y) {
            const trail = document.createElement('div');
            trail.className = 'gesture-trail-point';
            trail.style.left = x + 'px';
            trail.style.top = y + 'px';
            
            const container = document.getElementById('gesture-trail') || 
                             this.createTrailContainer();
            container.appendChild(trail);
            
            setTimeout(() => trail.remove(), 500);
        },
        
        createTrailContainer: function() {
            const container = document.createElement('div');
            container.id = 'gesture-trail';
            container.className = 'gesture-trail';
            document.body.appendChild(container);
            return container;
        },
        
        clearGestureVisuals: function() {
            const trail = document.getElementById('gesture-trail');
            if (trail) {
                trail.innerHTML = '';
            }
        },
        
        // Haptic feedback
        provideHapticFeedback: function(gestureType) {
            if (!this.hapticSupported) return;
            
            const patterns = {
                tap: 10,
                doubletap: [10, 50, 10],
                swipe: 20,
                longpress: 50,
                pressure: 40
            };
            
            navigator.vibrate(patterns[gestureType] || 20);
        },
        
        // Add to gesture history
        addToHistory: function(gesture) {
            this.gestureHistory.push({
                ...gesture,
                timestamp: Date.now()
            });
            
            // Keep only last 20 gestures
            if (this.gestureHistory.length > 20) {
                this.gestureHistory.shift();
            }
        },
        
        // Event handling
        on: function(event, callback) {
            if (!this.listeners[event]) {
                this.listeners[event] = [];
            }
            this.listeners[event].push(callback);
        },
        
        off: function(event, callback) {
            if (!this.listeners[event]) return;
            
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        },
        
        trigger: function(event, data) {
            if (!this.listeners[event]) return;
            
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in gesture event listener:', error);
                }
            });
        },
        
        // Preferences
        loadPreferences: function() {
            try {
                const saved = localStorage.getItem('gesturePreferences');
                if (saved) {
                    const prefs = JSON.parse(saved);
                    Object.assign(this.config, prefs);
                }
            } catch (error) {
                console.error('Failed to load gesture preferences:', error);
            }
        },
        
        savePreferences: function() {
            try {
                localStorage.setItem('gesturePreferences', 
                    JSON.stringify(this.config));
            } catch (error) {
                console.error('Failed to save gesture preferences:', error);
            }
        },
        
        // Public API
        enable: function() {
            this.isEnabled = true;
        },
        
        disable: function() {
            this.isEnabled = false;
            this.activeGestures.clear();
            this.clearGestureVisuals();
        },
        
        isActive: function() {
            return this.activeGestures.size > 0;
        },
        
        getHistory: function() {
            return this.gestureHistory.slice();
        },
        
        clearHistory: function() {
            this.gestureHistory = [];
        },
        
        updateConfig: function(config) {
            Object.assign(this.config, config);
            this.savePreferences();
        }
    };
    
    // Export
    exports.GestureManager = GestureManager;
    
})(window);