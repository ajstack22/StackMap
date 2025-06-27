/**
 * Time Input Component for StackMap
 * User-friendly time input with smart parsing and visual picker
 * Story #109 - Time Field Implementation
 */

(function() {
    'use strict';
    
    const TimeInput = {
        // Component instances
        instances: {},
        
        // Default configuration
        defaults: {
            format: '12h', // '12h' or '24h'
            showPicker: true,
            showSuggestions: true,
            placeholder: 'Add time (optional)',
            value: null,
            onChange: null,
            container: null
        },
        
        /**
         * Create a new time input instance
         */
        create: function(options = {}) {
            const config = Object.assign({}, this.defaults, options);
            const instanceId = this.generateInstanceId();
            
            const instance = {
                id: instanceId,
                config: config,
                element: null,
                picker: null,
                isValid: true,
                value: config.value,
                
                // Core methods
                render: function() {
                    return TimeInput.render(this);
                },
                setValue: function(value) {
                    return TimeInput.setValue(this, value);
                },
                getValue: function() {
                    return TimeInput.getValue(this);
                },
                validate: function() {
                    return TimeInput.validate(this);
                },
                destroy: function() {
                    return TimeInput.destroy(this);
                },
                focus: function() {
                    return TimeInput.focus(this);
                },
                showPicker: function() {
                    return TimeInput.showPicker(this);
                },
                hidePicker: function() {
                    return TimeInput.hidePicker(this);
                }
            };
            
            this.instances[instanceId] = instance;
            return instance;
        },
        
        /**
         * Render the time input component
         */
        render: function(instance) {
            const config = instance.config;
            
            // Create main container
            const container = document.createElement('div');
            container.className = 'time-input-container';
            container.setAttribute('data-time-input-id', instance.id);
            
            // Create input field
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'time-input';
            input.placeholder = config.placeholder;
            input.autocomplete = 'off';
            input.spellcheck = false;
            
            if (instance.value) {
                input.value = this.formatForInput(instance.value, config.format);
            }
            
            // Create picker button
            let pickerButton = null;
            if (config.showPicker) {
                pickerButton = document.createElement('button');
                pickerButton.type = 'button';
                pickerButton.className = 'time-picker-button';
                pickerButton.innerHTML = '🕐';
                pickerButton.setAttribute('aria-label', 'Open time picker');
                pickerButton.title = 'Click to open time picker';
            }
            
            // Create suggestions container
            let suggestionsContainer = null;
            if (config.showSuggestions) {
                suggestionsContainer = document.createElement('div');
                suggestionsContainer.className = 'time-suggestions hidden';
            }
            
            // Create validation message container
            const validationMessage = document.createElement('div');
            validationMessage.className = 'time-validation-message hidden';
            
            // Assemble components
            container.appendChild(input);
            if (pickerButton) {
                container.appendChild(pickerButton);
            }
            if (suggestionsContainer) {
                container.appendChild(suggestionsContainer);
            }
            container.appendChild(validationMessage);
            
            // Store element references
            instance.element = container;
            instance.input = input;
            instance.pickerButton = pickerButton;
            instance.suggestionsContainer = suggestionsContainer;
            instance.validationMessage = validationMessage;
            
            // Set up event listeners
            this.setupEventListeners(instance);
            
            // Append to configured container
            if (config.container) {
                config.container.appendChild(container);
            }
            
            return container;
        },
        
        /**
         * Set up event listeners for the time input
         */
        setupEventListeners: function(instance) {
            const input = instance.input;
            const pickerButton = instance.pickerButton;
            
            // Input event handling
            input.addEventListener('input', (e) => {
                this.handleInput(instance, e.target.value);
            });
            
            input.addEventListener('blur', (e) => {
                this.handleBlur(instance, e.target.value);
            });
            
            input.addEventListener('focus', (e) => {
                this.handleFocus(instance);
            });
            
            input.addEventListener('keydown', (e) => {
                this.handleKeyDown(instance, e);
            });
            
            // Picker button handling
            if (pickerButton) {
                pickerButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.togglePicker(instance);
                });
            }
            
            // Click outside to close picker
            document.addEventListener('click', (e) => {
                if (instance.picker && !instance.element.contains(e.target)) {
                    this.hidePicker(instance);
                }
            });
        },
        
        /**
         * Handle input events with smart parsing
         */
        handleInput: function(instance, value) {
            // Clear previous validation
            this.clearValidation(instance);
            
            // Update suggestions
            if (instance.config.showSuggestions && value.length > 0) {
                this.updateSuggestions(instance, value);
            } else {
                this.hideSuggestions(instance);
            }
            
            // Real-time validation feedback
            if (value.trim()) {
                const parsed = window.TimeParser ? window.TimeParser.parse(value) : null;
                if (parsed) {
                    this.setValidationState(instance, 'valid', 'Valid time');
                } else {
                    this.setValidationState(instance, 'invalid', 'Invalid time format');
                }
            }
        },
        
        /**
         * Handle blur events with final parsing
         */
        handleBlur: function(instance, value) {
            this.hideSuggestions(instance);
            
            if (!value.trim()) {
                // Empty value is allowed
                this.setValue(instance, null);
                return;
            }
            
            // Parse the input value
            const parsed = window.TimeParser ? window.TimeParser.parse(value) : null;
            
            if (parsed) {
                // Valid time - update display
                this.setValue(instance, parsed);
                this.setValidationState(instance, 'valid');
            } else {
                // Invalid time - show error
                this.setValidationState(instance, 'invalid', 'Please enter a valid time (e.g., "3pm", "15:30")');
                instance.isValid = false;
            }
        },
        
        /**
         * Handle focus events
         */
        handleFocus: function(instance) {
            this.clearValidation(instance);
            
            // Show quick suggestions
            if (instance.config.showSuggestions && window.TimeParser) {
                const suggestions = window.TimeParser.getQuickTimeSuggestions();
                this.showQuickSuggestions(instance, suggestions);
            }
        },
        
        /**
         * Handle keyboard navigation
         */
        handleKeyDown: function(instance, event) {
            switch (event.key) {
                case 'Escape':
                    this.hidePicker(instance);
                    this.hideSuggestions(instance);
                    break;
                    
                case 'Enter':
                    if (instance.suggestionsContainer && !instance.suggestionsContainer.classList.contains('hidden')) {
                        // Select first suggestion
                        const firstSuggestion = instance.suggestionsContainer.querySelector('.time-suggestion');
                        if (firstSuggestion) {
                            event.preventDefault();
                            this.selectSuggestion(instance, firstSuggestion.dataset.time);
                        }
                    }
                    break;
                    
                case 'ArrowDown':
                    if (instance.config.showPicker) {
                        event.preventDefault();
                        this.showPicker(instance);
                    }
                    break;
            }
        },
        
        /**
         * Update time suggestions based on input
         */
        updateSuggestions: function(instance, input) {
            if (!window.TimeParser || !instance.suggestionsContainer) {
                return;
            }
            
            // Get suggestions from TimeParser
            const suggestions = [];
            
            // Try to parse partial input
            const parsed = window.TimeParser.parse(input);
            if (parsed) {
                suggestions.push({
                    label: window.TimeParser.formatForDisplay(parsed, instance.config.format),
                    time: parsed,
                    type: 'parsed'
                });
            }
            
            // Add contextual suggestions
            if (input.toLowerCase().includes('morning')) {
                suggestions.push({ label: 'Morning (9:00 AM)', time: '09:00', type: 'contextual' });
            } else if (input.toLowerCase().includes('afternoon')) {
                suggestions.push({ label: 'Afternoon (2:00 PM)', time: '14:00', type: 'contextual' });
            } else if (input.toLowerCase().includes('evening')) {
                suggestions.push({ label: 'Evening (6:00 PM)', time: '18:00', type: 'contextual' });
            }
            
            this.renderSuggestions(instance, suggestions);
        },
        
        /**
         * Show quick time suggestions
         */
        showQuickSuggestions: function(instance, suggestions) {
            if (!suggestions || !instance.suggestionsContainer) {
                return;
            }
            
            this.renderSuggestions(instance, suggestions.map(s => ({
                label: s.label,
                time: s.time,
                type: 'quick'
            })));
        },
        
        /**
         * Render suggestions in the suggestions container
         */
        renderSuggestions: function(instance, suggestions) {
            if (!instance.suggestionsContainer || suggestions.length === 0) {
                this.hideSuggestions(instance);
                return;
            }
            
            // Clear existing suggestions
            instance.suggestionsContainer.innerHTML = '';
            
            suggestions.forEach(suggestion => {
                const suggestionElement = document.createElement('button');
                suggestionElement.type = 'button';
                suggestionElement.className = `time-suggestion time-suggestion-${suggestion.type}`;
                suggestionElement.textContent = suggestion.label;
                suggestionElement.dataset.time = suggestion.time;
                
                suggestionElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.selectSuggestion(instance, suggestion.time);
                });
                
                instance.suggestionsContainer.appendChild(suggestionElement);
            });
            
            // Show suggestions
            instance.suggestionsContainer.classList.remove('hidden');
        },
        
        /**
         * Select a suggestion
         */
        selectSuggestion: function(instance, time) {
            this.setValue(instance, time);
            this.hideSuggestions(instance);
            instance.input.focus();
        },
        
        /**
         * Hide suggestions
         */
        hideSuggestions: function(instance) {
            if (instance.suggestionsContainer) {
                instance.suggestionsContainer.classList.add('hidden');
            }
        },
        
        /**
         * Show time picker
         */
        showPicker: function(instance) {
            if (instance.picker) {
                return; // Already showing
            }
            
            instance.picker = this.createPicker(instance);
            instance.element.appendChild(instance.picker);
            
            // Position picker
            this.positionPicker(instance);
            
            // Focus first interactive element
            const firstInput = instance.picker.querySelector('input, button');
            if (firstInput) {
                firstInput.focus();
            }
        },
        
        /**
         * Hide time picker
         */
        hidePicker: function(instance) {
            if (instance.picker) {
                instance.picker.remove();
                instance.picker = null;
            }
        },
        
        /**
         * Toggle time picker visibility
         */
        togglePicker: function(instance) {
            if (instance.picker) {
                this.hidePicker(instance);
            } else {
                this.showPicker(instance);
            }
        },
        
        /**
         * Create visual time picker
         */
        createPicker: function(instance) {
            const picker = document.createElement('div');
            picker.className = 'time-picker';
            
            // Parse current value for initial state
            let currentHour = 9;
            let currentMinute = 0;
            let currentPeriod = 'AM';
            
            if (instance.value) {
                const [hours, minutes] = instance.value.split(':').map(Number);
                currentHour = instance.config.format === '12h' ? (hours === 0 ? 12 : hours > 12 ? hours - 12 : hours) : hours;
                currentMinute = minutes;
                currentPeriod = hours >= 12 ? 'PM' : 'AM';
            }
            
            // Create picker content
            picker.innerHTML = `
                <div class="time-picker-header">
                    <button type="button" class="time-picker-close" aria-label="Close picker">×</button>
                </div>
                <div class="time-picker-content">
                    <div class="time-picker-section">
                        <label class="time-picker-label">Hour</label>
                        <input type="number" class="time-picker-hour" min="${instance.config.format === '12h' ? 1 : 0}" max="${instance.config.format === '12h' ? 12 : 23}" value="${currentHour}">
                    </div>
                    <div class="time-picker-section">
                        <label class="time-picker-label">Minute</label>
                        <input type="number" class="time-picker-minute" min="0" max="59" step="5" value="${currentMinute}">
                    </div>
                    ${instance.config.format === '12h' ? `
                    <div class="time-picker-section">
                        <label class="time-picker-label">Period</label>
                        <select class="time-picker-period">
                            <option value="AM"${currentPeriod === 'AM' ? ' selected' : ''}>AM</option>
                            <option value="PM"${currentPeriod === 'PM' ? ' selected' : ''}>PM</option>
                        </select>
                    </div>
                    ` : ''}
                </div>
                <div class="time-picker-actions">
                    <button type="button" class="time-picker-clear">Clear</button>
                    <button type="button" class="time-picker-now">Now</button>
                    <button type="button" class="time-picker-apply">Apply</button>
                </div>
            `;
            
            // Set up picker event listeners
            this.setupPickerListeners(instance, picker);
            
            return picker;
        },
        
        /**
         * Set up event listeners for the picker
         */
        setupPickerListeners: function(instance, picker) {
            // Close button
            picker.querySelector('.time-picker-close').addEventListener('click', () => {
                this.hidePicker(instance);
            });
            
            // Clear button
            picker.querySelector('.time-picker-clear').addEventListener('click', () => {
                this.setValue(instance, null);
                this.hidePicker(instance);
            });
            
            // Now button
            picker.querySelector('.time-picker-now').addEventListener('click', () => {
                const now = new Date();
                const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                this.setValue(instance, timeString);
                this.hidePicker(instance);
            });
            
            // Apply button
            picker.querySelector('.time-picker-apply').addEventListener('click', () => {
                const hour = parseInt(picker.querySelector('.time-picker-hour').value, 10);
                const minute = parseInt(picker.querySelector('.time-picker-minute').value, 10);
                
                let finalHour = hour;
                if (instance.config.format === '12h') {
                    const period = picker.querySelector('.time-picker-period').value;
                    if (period === 'PM' && hour !== 12) {
                        finalHour = hour + 12;
                    } else if (period === 'AM' && hour === 12) {
                        finalHour = 0;
                    }
                }
                
                const timeString = `${finalHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                this.setValue(instance, timeString);
                this.hidePicker(instance);
            });
            
            // Input validation
            picker.querySelectorAll('input[type="number"]').forEach(input => {
                input.addEventListener('input', () => {
                    const value = parseInt(input.value, 10);
                    const min = parseInt(input.min, 10);
                    const max = parseInt(input.max, 10);
                    
                    if (value < min) {
                        input.value = min;
                    } else if (value > max) {
                        input.value = max;
                    }
                });
            });
        },
        
        /**
         * Position the picker relative to the input
         */
        positionPicker: function(instance) {
            if (!instance.picker) {
                return;
            }
            
            // Simple positioning - below the input
            instance.picker.style.position = 'absolute';
            instance.picker.style.top = '100%';
            instance.picker.style.left = '0';
            instance.picker.style.zIndex = '1000';
        },
        
        /**
         * Set validation state
         */
        setValidationState: function(instance, state, message = '') {
            const container = instance.element;
            const validationMessage = instance.validationMessage;
            
            // Remove existing states
            container.classList.remove('time-input-valid', 'time-input-invalid');
            
            // Apply new state
            if (state === 'valid') {
                container.classList.add('time-input-valid');
                instance.isValid = true;
            } else if (state === 'invalid') {
                container.classList.add('time-input-invalid');
                instance.isValid = false;
            }
            
            // Update validation message
            if (message) {
                validationMessage.textContent = message;
                validationMessage.classList.remove('hidden');
            } else {
                validationMessage.classList.add('hidden');
            }
        },
        
        /**
         * Clear validation state
         */
        clearValidation: function(instance) {
            const container = instance.element;
            const validationMessage = instance.validationMessage;
            
            container.classList.remove('time-input-valid', 'time-input-invalid');
            validationMessage.classList.add('hidden');
        },
        
        /**
         * Set the value of the time input
         */
        setValue: function(instance, value) {
            // Validate the value
            if (value !== null && window.TimeParser && !window.TimeParser.isValidTime(value)) {
                console.warn('TimeInput: Invalid time value', value);
                return false;
            }
            
            instance.value = value;
            
            // Update input display
            if (instance.input) {
                instance.input.value = value ? this.formatForInput(value, instance.config.format) : '';
            }
            
            // Clear validation
            this.clearValidation(instance);
            
            // Trigger change callback
            if (instance.config.onChange && typeof instance.config.onChange === 'function') {
                instance.config.onChange(value, instance);
            }
            
            return true;
        },
        
        /**
         * Get the current value
         */
        getValue: function(instance) {
            return instance.value;
        },
        
        /**
         * Validate the current input
         */
        validate: function(instance) {
            const inputValue = instance.input ? instance.input.value.trim() : '';
            
            if (!inputValue) {
                // Empty is valid
                instance.isValid = true;
                this.clearValidation(instance);
                return true;
            }
            
            const parsed = window.TimeParser ? window.TimeParser.parse(inputValue) : null;
            
            if (parsed) {
                instance.isValid = true;
                this.setValidationState(instance, 'valid');
                return true;
            } else {
                instance.isValid = false;
                this.setValidationState(instance, 'invalid', 'Please enter a valid time');
                return false;
            }
        },
        
        /**
         * Focus the time input
         */
        focus: function(instance) {
            if (instance.input) {
                instance.input.focus();
            }
        },
        
        /**
         * Format time for input display
         */
        formatForInput: function(time, format) {
            if (!time || !window.TimeParser) {
                return '';
            }
            
            return window.TimeParser.formatForDisplay(time, format);
        },
        
        /**
         * Destroy the time input instance
         */
        destroy: function(instance) {
            // Remove from DOM
            if (instance.element && instance.element.parentNode) {
                instance.element.parentNode.removeChild(instance.element);
            }
            
            // Clean up references
            delete this.instances[instance.id];
        },
        
        /**
         * Generate unique instance ID
         */
        generateInstanceId: function() {
            return `time_input_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        },
        
        /**
         * Get instance by ID
         */
        getInstance: function(id) {
            return this.instances[id] || null;
        },
        
        /**
         * Get instance by element
         */
        getInstanceByElement: function(element) {
            const container = element.closest('[data-time-input-id]');
            if (container) {
                const id = container.getAttribute('data-time-input-id');
                return this.getInstance(id);
            }
            return null;
        },
        
        /**
         * Destroy all instances
         */
        destroyAll: function() {
            Object.keys(this.instances).forEach(id => {
                this.destroy(this.instances[id]);
            });
        }
    };
    
    // Export to global scope
    window.TimeInput = TimeInput;
    
})();