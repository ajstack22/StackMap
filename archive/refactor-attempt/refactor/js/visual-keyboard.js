/**
 * Visual Keyboard System
 * Enhanced keyboard for edit mode with large touch targets and visual feedback
 * Story #98 - Round 6 Dev2
 */

(function() {
    'use strict';
    
    const VisualKeyboard = {
        container: null,
        activeInput: null,
        isVisible: false,
        keyboardLayout: null,
        
        /**
         * Initialize the visual keyboard system
         */
        init: function() {
            const self = this;
            
            // Create keyboard container
            this.createKeyboardContainer();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize layouts
            this.initializeLayouts();
            
            console.log('Visual keyboard initialized');
        },
        
        /**
         * Create the keyboard container element
         */
        createKeyboardContainer: function() {
            this.container = document.createElement('div');
            this.container.className = 'visual-keyboard-container';
            this.container.setAttribute('role', 'application');
            this.container.setAttribute('aria-label', 'Visual keyboard');
            this.container.innerHTML = `
                <div class="visual-keyboard">
                    <div class="keyboard-header">
                        <button class="keyboard-minimize" aria-label="Minimize keyboard">
                            <span class="minimize-icon">⌄</span>
                        </button>
                        <div class="keyboard-suggestions" role="list" aria-label="Text suggestions">
                            <!-- Suggestions will be added dynamically -->
                        </div>
                    </div>
                    <div class="keyboard-rows" role="group" aria-label="Keyboard keys">
                        <!-- Keys will be added dynamically -->
                    </div>
                    <div class="keyboard-toolbar">
                        <button class="keyboard-action-btn" data-action="numbers" aria-label="Switch to numbers">123</button>
                        <button class="keyboard-action-btn" data-action="emoji" aria-label="Open emoji picker">😊</button>
                        <button class="keyboard-key key-space" data-key=" " aria-label="Space">space</button>
                        <button class="keyboard-action-btn" data-action="done" aria-label="Done">Done</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.container);
        },
        
        /**
         * Initialize keyboard layouts
         */
        initializeLayouts: function() {
            this.layouts = {
                'qwerty': [
                    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
                    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
                    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace']
                ],
                'numbers': [
                    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
                    ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
                    ['symbols', '.', ',', '?', '!', "'", 'backspace']
                ],
                'symbols': [
                    ['[', ']', '{', '}', '#', '%', '^', '*', '+', '='],
                    ['_', '\\', '|', '~', '<', '>', '€', '£', '¥', '•'],
                    ['numbers', '.', ',', '?', '!', "'", 'backspace']
                ]
            };
            
            this.currentLayout = 'qwerty';
            this.isShiftActive = false;
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
            // Listen for focus on inputs in edit mode
            document.addEventListener('focusin', function(e) {
                if (self.shouldShowKeyboard(e.target)) {
                    self.show(e.target);
                }
            });
            
            document.addEventListener('focusout', function(e) {
                // Delay to check if focus moved to keyboard
                setTimeout(function() {
                    if (!self.container.contains(document.activeElement)) {
                        self.hide();
                    }
                }, 100);
            });
            
            // Keyboard actions
            this.container.addEventListener('click', function(e) {
                const key = e.target.closest('[data-key]');
                const action = e.target.closest('[data-action]');
                
                if (key) {
                    self.handleKeyPress(key.getAttribute('data-key'));
                } else if (action) {
                    self.handleAction(action.getAttribute('data-action'));
                }
            });
            
            // Touch feedback
            this.container.addEventListener('touchstart', function(e) {
                const key = e.target.closest('.keyboard-key, .keyboard-action-btn');
                if (key) {
                    key.classList.add('key-pressed');
                    self.provideHapticFeedback();
                }
            });
            
            this.container.addEventListener('touchend', function(e) {
                const key = e.target.closest('.keyboard-key, .keyboard-action-btn');
                if (key) {
                    key.classList.remove('key-pressed');
                }
            });
        },
        
        /**
         * Check if keyboard should show for this element
         */
        shouldShowKeyboard: function(element) {
            // Only show in edit mode
            if (!window.EditMode || !window.EditMode.isActive()) return false;
            
            // Check if it's an editable element
            const isEditable = element.matches('input[type="text"], input[type="number"], textarea, [contenteditable="true"]');
            
            // Check if it's within an activity card
            const isInCard = element.closest('.activity-card, .task-card');
            
            return isEditable && isInCard;
        },
        
        /**
         * Show the visual keyboard
         */
        show: function(inputElement) {
            const self = this;
            
            this.activeInput = inputElement;
            this.renderKeyboard();
            
            // Position keyboard
            this.positionKeyboard();
            
            // Show with animation
            this.container.classList.add('visible');
            this.isVisible = true;
            
            // Update suggestions based on input
            this.updateSuggestions();
            
            // Announce to screen readers
            this.announce('Visual keyboard opened');
        },
        
        /**
         * Hide the visual keyboard
         */
        hide: function() {
            this.container.classList.remove('visible');
            this.isVisible = false;
            this.activeInput = null;
            
            // Announce to screen readers
            this.announce('Visual keyboard closed');
        },
        
        /**
         * Render the current keyboard layout
         */
        renderKeyboard: function() {
            const rowsContainer = this.container.querySelector('.keyboard-rows');
            rowsContainer.innerHTML = '';
            
            const layout = this.layouts[this.currentLayout];
            
            layout.forEach(function(row, rowIndex) {
                const rowElement = document.createElement('div');
                rowElement.className = 'keyboard-row';
                rowElement.setAttribute('role', 'group');
                
                row.forEach(function(key) {
                    const keyElement = document.createElement('button');
                    keyElement.className = 'keyboard-key';
                    
                    // Special keys
                    if (key === 'shift') {
                        keyElement.className += ' key-shift';
                        keyElement.innerHTML = '⇧';
                        keyElement.setAttribute('aria-label', 'Shift');
                        if (this.isShiftActive) keyElement.classList.add('active');
                    } else if (key === 'backspace') {
                        keyElement.className += ' key-backspace';
                        keyElement.innerHTML = '⌫';
                        keyElement.setAttribute('aria-label', 'Backspace');
                    } else if (key === 'symbols' || key === 'numbers') {
                        keyElement.className += ' key-layout';
                        keyElement.innerHTML = key;
                        keyElement.setAttribute('aria-label', `Switch to ${key}`);
                    } else {
                        const displayKey = this.isShiftActive ? key.toUpperCase() : key;
                        keyElement.textContent = displayKey;
                        keyElement.setAttribute('aria-label', displayKey);
                    }
                    
                    keyElement.setAttribute('data-key', key);
                    keyElement.setAttribute('role', 'button');
                    keyElement.setAttribute('tabindex', '0');
                    
                    rowElement.appendChild(keyElement);
                }, this);
                
                rowsContainer.appendChild(rowElement);
            }, this);
        },
        
        /**
         * Handle key press
         */
        handleKeyPress: function(key) {
            if (!this.activeInput) return;
            
            const input = this.activeInput;
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const value = input.value || '';
            
            if (key === 'backspace') {
                if (start === end && start > 0) {
                    // Delete character before cursor
                    input.value = value.slice(0, start - 1) + value.slice(start);
                    input.setSelectionRange(start - 1, start - 1);
                } else if (start !== end) {
                    // Delete selection
                    input.value = value.slice(0, start) + value.slice(end);
                    input.setSelectionRange(start, start);
                }
            } else if (key === 'shift') {
                this.isShiftActive = !this.isShiftActive;
                this.renderKeyboard();
                return;
            } else if (key === 'symbols' || key === 'numbers') {
                this.currentLayout = key;
                this.renderKeyboard();
                return;
            } else {
                // Insert character
                const char = this.isShiftActive ? key.toUpperCase() : key;
                input.value = value.slice(0, start) + char + value.slice(end);
                input.setSelectionRange(start + 1, start + 1);
                
                // Auto-disable shift after character
                if (this.isShiftActive) {
                    this.isShiftActive = false;
                    this.renderKeyboard();
                }
            }
            
            // Trigger input event
            input.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Update suggestions
            this.updateSuggestions();
        },
        
        /**
         * Handle keyboard actions
         */
        handleAction: function(action) {
            switch (action) {
                case 'done':
                    this.hide();
                    if (this.activeInput) {
                        this.activeInput.blur();
                    }
                    break;
                    
                case 'numbers':
                    this.currentLayout = this.currentLayout === 'numbers' ? 'qwerty' : 'numbers';
                    this.renderKeyboard();
                    break;
                    
                case 'emoji':
                    // TODO: Implement emoji picker
                    console.log('Emoji picker not yet implemented');
                    break;
            }
        },
        
        /**
         * Position keyboard to avoid covering content
         */
        positionKeyboard: function() {
            if (!this.activeInput) return;
            
            const inputRect = this.activeInput.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const keyboardHeight = 280; // Approximate keyboard height
            
            // Check if input would be covered
            if (inputRect.bottom > viewportHeight - keyboardHeight) {
                // Scroll to bring input into view
                const scrollAmount = inputRect.bottom - (viewportHeight - keyboardHeight) + 20;
                window.scrollBy(0, scrollAmount);
            }
        },
        
        /**
         * Update text suggestions
         */
        updateSuggestions: function() {
            // TODO: Implement smart suggestions based on input
            const suggestionsContainer = this.container.querySelector('.keyboard-suggestions');
            suggestionsContainer.innerHTML = '';
            
            // Example static suggestions
            const suggestions = ['Today', 'Tomorrow', 'Complete', 'Priority'];
            
            suggestions.forEach(function(suggestion) {
                const btn = document.createElement('button');
                btn.className = 'keyboard-suggestion';
                btn.textContent = suggestion;
                btn.setAttribute('role', 'listitem');
                btn.onclick = function() {
                    if (this.activeInput) {
                        this.activeInput.value = suggestion;
                        this.activeInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }.bind(this);
                suggestionsContainer.appendChild(btn);
            }, this);
        },
        
        /**
         * Provide haptic feedback if available
         */
        provideHapticFeedback: function() {
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }
        },
        
        /**
         * Announce to screen readers
         */
        announce: function(message) {
            const announcement = document.createElement('div');
            announcement.className = 'sr-only';
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.textContent = message;
            
            document.body.appendChild(announcement);
            setTimeout(function() {
                announcement.remove();
            }, 1000);
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            VisualKeyboard.init();
        });
    } else {
        VisualKeyboard.init();
    }
    
    // Export for external use
    window.VisualKeyboard = VisualKeyboard;
})();