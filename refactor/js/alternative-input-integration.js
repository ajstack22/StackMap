/**
 * Alternative Input Integration
 * Connects voice, gesture, and switch input methods to task creation
 * Provides unified interface for all alternative input methods
 */

class AlternativeInputIntegration {
    constructor() {
        // Configuration
        this.config = {
            // Feature flags
            enableVoice: true,
            enableGestures: true,
            enableSwitch: true,
            
            // Auto-detection
            autoDetectPreference: true,
            rememberPreference: true,
            
            // Feedback
            provideFeedback: true,
            feedbackDuration: 2000,
            
            // Task creation
            confirmBeforeCreate: false,  // For users who need confirmation
            autoFocusInput: true,
            clearAfterCreate: true
        };
        
        // State
        this.isInitialized = false;
        this.activeMethod = null;
        this.preferences = {};
        
        // Input managers
        this.voiceManager = null;
        this.gestureManager = null;
        this.switchScanner = null;
        
        // UI elements
        this.taskInput = null;
        this.taskList = null;
        this.altInputToggle = null;
        
        // Event handlers
        this.handlers = new Map();
    }
    
    // Initialize all input methods
    async init() {
        if (this.isInitialized) return;
        
        // Load preferences
        this.loadPreferences();
        
        // Find UI elements
        this.findUIElements();
        
        // Initialize input methods
        await this.initializeInputMethods();
        
        // Set up UI controls
        this.setupUIControls();
        
        // Apply saved preferences
        this.applyPreferences();
        
        this.isInitialized = true;
        console.log('Alternative Input Integration initialized');
    }
    
    // Find required UI elements
    findUIElements() {
        // Task input field
        this.taskInput = document.querySelector('#task-input, .task-input, input[name="task"]');
        if (!this.taskInput) {
            console.warn('Task input field not found');
        }
        
        // Task list container
        this.taskList = document.querySelector('#tasks, .task-list, [data-task-list]');
        if (!this.taskList) {
            console.warn('Task list container not found');
        }
        
        // Alternative input toggle
        this.altInputToggle = document.querySelector('.alt-input-toggle');
        if (!this.altInputToggle) {
            this.createAltInputToggle();
        }
    }
    
    // Initialize input methods
    async initializeInputMethods() {
        // Initialize voice commands
        if (this.config.enableVoice && window.VoiceCommandManager) {
            this.voiceManager = window.VoiceCommandManager;
            if (this.voiceManager.init()) {
                this.setupVoiceHandlers();
                console.log('Voice commands integrated');
            }
        }
        
        // Initialize gestures
        if (this.config.enableGestures && window.GestureManager) {
            this.gestureManager = window.GestureManager;
            if (this.gestureManager.init()) {
                this.setupGestureHandlers();
                console.log('Gestures integrated');
            }
        }
        
        // Initialize switch scanning
        if (this.config.enableSwitch && window.SwitchScanner) {
            this.switchScanner = new window.SwitchScanner();
            this.setupSwitchHandlers();
            console.log('Switch scanning integrated');
        }
    }
    
    // Set up voice command handlers
    setupVoiceHandlers() {
        // Handle voice commands
        this.voiceManager.on('command', (command) => {
            this.handleVoiceCommand(command);
        });
        
        // Handle voice errors with RSD-safe messages
        this.voiceManager.on('error', (error) => {
            if (window.RSDSafeMessages) {
                const message = window.RSDSafeMessages.voiceError(error.error);
                this.showFeedback(message, 'info');
            }
        });
    }
    
    // Handle voice commands
    handleVoiceCommand(command) {
        console.log('Voice command:', command);
        
        switch (command.type) {
            case 'create':
                this.createTask(command.target, 'voice');
                break;
                
            case 'complete':
                this.completeTask(command.target, 'voice');
                break;
                
            case 'show':
                this.showTasks(command.target);
                break;
                
            case 'next':
                this.focusNextTask();
                break;
                
            default:
                this.showFeedback('Command not recognized', 'info');
        }
    }
    
    // Set up gesture handlers
    setupGestureHandlers() {
        // Handle gestures
        this.gestureManager.on('gesture', (gesture) => {
            this.handleGesture(gesture);
        });
        
        // Handle pressure gestures
        this.gestureManager.on('pressure', (data) => {
            this.handlePressure(data);
        });
    }
    
    // Handle gestures
    handleGesture(gesture) {
        console.log('Gesture detected:', gesture);
        
        // Check if gesture is on a task element
        const taskElement = gesture.target.closest('.task, [data-task-id]');
        
        switch (gesture.type) {
            case 'swipe':
                this.handleSwipe(gesture, taskElement);
                break;
                
            case 'tap':
                if (taskElement) {
                    this.selectTask(taskElement);
                } else if (gesture.target === this.taskInput) {
                    // Focus input for typing
                    this.taskInput.focus();
                }
                break;
                
            case 'doubletap':
                if (taskElement) {
                    this.toggleTaskComplete(taskElement);
                } else {
                    this.quickAddTask();
                }
                break;
                
            case 'longpress':
            case 'pressure':
                if (taskElement) {
                    this.showTaskOptions(taskElement);
                } else {
                    this.showInputMethods();
                }
                break;
        }
    }
    
    // Handle swipe gestures
    handleSwipe(gesture, taskElement) {
        if (taskElement) {
            switch (gesture.direction) {
                case 'right':
                    this.completeTaskElement(taskElement, 'gesture');
                    break;
                case 'left':
                    this.deleteTaskElement(taskElement, 'gesture');
                    break;
                case 'up':
                    this.moveTaskUp(taskElement);
                    break;
                case 'down':
                    this.moveTaskDown(taskElement);
                    break;
            }
        } else {
            // Global swipes
            switch (gesture.direction) {
                case 'down':
                    this.scrollToInput();
                    this.quickAddTask();
                    break;
                case 'up':
                    this.scrollToTasks();
                    break;
                case 'left':
                    this.showPreviousView();
                    break;
                case 'right':
                    this.showNextView();
                    break;
            }
        }
    }
    
    // Handle pressure gestures
    handlePressure(data) {
        const taskElement = data.target.closest('.task, [data-task-id]');
        
        if (taskElement) {
            switch (data.level) {
                case 'light':
                    this.previewTask(taskElement);
                    break;
                case 'medium':
                    this.showTaskOptions(taskElement);
                    break;
                case 'firm':
                    this.editTask(taskElement);
                    break;
            }
        }
    }
    
    // Set up switch scanning handlers
    setupSwitchHandlers() {
        // Handle activation
        this.switchScanner.on('activate', (data) => {
            this.handleSwitchActivation(data);
        });
        
        // Handle custom actions
        this.switchScanner.on('customAction', (data) => {
            this.handleSwitchAction(data);
        });
    }
    
    // Handle switch activation
    handleSwitchActivation(data) {
        const element = data.element;
        
        // Check if it's a task
        const taskElement = element.closest('.task, [data-task-id]');
        if (taskElement) {
            this.toggleTaskComplete(taskElement);
            return;
        }
        
        // Check for specific actions
        const action = element.dataset.action || element.dataset.scanAction;
        if (action) {
            this.handleAction(action, element);
        }
    }
    
    // Handle switch custom actions
    handleSwitchAction(data) {
        this.handleAction(data.action, data.element);
    }
    
    // Handle generic actions
    handleAction(action, element) {
        switch (action) {
            case 'add':
            case 'create':
                this.quickAddTask();
                break;
            case 'complete':
                this.completeSelectedTask();
                break;
            case 'delete':
                this.deleteSelectedTask();
                break;
            case 'edit':
                this.editSelectedTask();
                break;
            case 'voice':
                this.startVoiceInput();
                break;
            case 'scan':
                this.toggleSwitchScanning();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }
    
    // Task management methods
    createTask(title, source = 'manual') {
        if (!title || !title.trim()) return;
        
        // Create task object
        const task = {
            id: Date.now(),
            title: title.trim(),
            completed: false,
            created: new Date().toISOString(),
            source: source
        };
        
        // Add to storage (if available)
        if (window.Storage) {
            window.Storage.addTask(task);
        }
        
        // Add to UI
        this.addTaskToUI(task);
        
        // Show feedback
        this.showFeedback(`Activity "${title}" added!`, 'success');
        
        // Clear input if configured
        if (this.config.clearAfterCreate && this.taskInput) {
            this.taskInput.value = '';
        }
        
        // Track usage for learning
        this.trackUsage('create', source);
    }
    
    // Add task to UI
    addTaskToUI(task) {
        if (!this.taskList) return;
        
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        taskElement.dataset.taskId = task.id;
        taskElement.innerHTML = `
            <input type="checkbox" id="activity-${task.id}" ${task.completed ? 'checked' : ''}>
            <label for="activity-${task.id}">${this.escapeHtml(task.title)}</label>
            <button class="task-action" data-action="delete" aria-label="Delete activity">
                <span aria-hidden="true">×</span>
            </button>
        `;
        
        // Make scannable
        taskElement.setAttribute('data-scannable', 'true');
        
        // Add event listeners
        const checkbox = taskElement.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            this.toggleTaskComplete(taskElement);
        });
        
        const deleteBtn = taskElement.querySelector('[data-action="delete"]');
        deleteBtn.addEventListener('click', () => {
            this.deleteTaskElement(taskElement);
        });
        
        // Add to list
        this.taskList.appendChild(taskElement);
    }
    
    // Complete task by title
    completeTask(title, source = 'manual') {
        const tasks = this.taskList.querySelectorAll('.task');
        let found = false;
        
        tasks.forEach(taskElement => {
            const label = taskElement.querySelector('label');
            if (label && label.textContent.toLowerCase().includes(title.toLowerCase())) {
                this.completeTaskElement(taskElement, source);
                found = true;
            }
        });
        
        if (!found) {
            this.showFeedback('Task not found. Try being more specific.', 'info');
        }
    }
    
    // Complete task element
    completeTaskElement(taskElement, source = 'manual') {
        const checkbox = taskElement.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.checked = true;
            taskElement.classList.add('completed');
        }
        
        const taskId = taskElement.dataset.taskId;
        if (window.Storage && taskId) {
            window.Storage.updateTask(taskId, { completed: true });
        }
        
        this.showFeedback('Task completed! Great job! 🎉', 'success');
        this.trackUsage('complete', source);
    }
    
    // Toggle task completion
    toggleTaskComplete(taskElement) {
        const checkbox = taskElement.querySelector('input[type="checkbox"]');
        const isCompleted = checkbox && checkbox.checked;
        
        if (isCompleted) {
            taskElement.classList.add('completed');
        } else {
            taskElement.classList.remove('completed');
        }
        
        const taskId = taskElement.dataset.taskId;
        if (window.Storage && taskId) {
            window.Storage.updateTask(taskId, { completed: isCompleted });
        }
    }
    
    // Delete task element
    deleteTaskElement(taskElement, source = 'manual') {
        const taskId = taskElement.dataset.taskId;
        
        // Animate removal
        taskElement.style.transform = 'translateX(-100%)';
        taskElement.style.opacity = '0';
        
        setTimeout(() => {
            taskElement.remove();
            
            if (window.Storage && taskId) {
                window.Storage.deleteTask(taskId);
            }
            
            this.showFeedback('Task deleted', 'info');
            this.trackUsage('delete', source);
        }, 300);
    }
    
    // Quick add task
    quickAddTask() {
        if (!this.taskInput) return;
        
        // Focus input
        this.taskInput.focus();
        this.taskInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Start voice input if available and preferred
        if (this.preferences.preferredMethod === 'voice' && this.voiceManager) {
            setTimeout(() => {
                this.startVoiceInput();
            }, 500);
        }
    }
    
    // Start voice input
    async startVoiceInput() {
        if (!this.voiceManager || !this.voiceManager.isAvailable()) {
            this.showFeedback('Voice input not available', 'info');
            return;
        }
        
        const started = await this.voiceManager.startListening();
        if (started) {
            this.showFeedback('Listening... Say "Add" followed by your task', 'info');
            this.setActiveMethod('voice');
        }
    }
    
    // Toggle switch scanning
    toggleSwitchScanning() {
        if (!this.switchScanner) return;
        
        if (this.switchScanner.isScanning()) {
            this.switchScanner.stop();
            this.setActiveMethod(null);
        } else {
            this.switchScanner.start();
            this.showFeedback('Switch scanning started. Press Space to select.', 'info');
            this.setActiveMethod('switch');
        }
    }
    
    // Create alternative input toggle button
    createAltInputToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'alt-input-toggle';
        toggle.setAttribute('aria-label', 'Alternative input methods');
        toggle.innerHTML = '🎙️';
        
        toggle.addEventListener('click', () => {
            this.showInputMethods();
        });
        
        document.body.appendChild(toggle);
        this.altInputToggle = toggle;
    }
    
    // Show input method menu
    showInputMethods() {
        // Create menu if not exists
        let menu = document.querySelector('.alt-input-menu');
        if (!menu) {
            menu = this.createInputMethodMenu();
            document.body.appendChild(menu);
        }
        
        // Toggle visibility
        menu.classList.toggle('show');
    }
    
    // Create input method menu
    createInputMethodMenu() {
        const menu = document.createElement('div');
        menu.className = 'alt-input-menu';
        
        const methods = [
            { id: 'voice', icon: '🎙️', label: 'Voice Commands', available: this.voiceManager?.isAvailable() },
            { id: 'gesture', icon: '👆', label: 'Gestures', available: !!this.gestureManager },
            { id: 'switch', icon: '🎮', label: 'Switch Scanning', available: !!this.switchScanner },
            { id: 'keyboard', icon: '⌨️', label: 'Keyboard Only', available: true }
        ];
        
        methods.forEach(method => {
            if (!method.available) return;
            
            const option = document.createElement('button');
            option.className = 'alt-input-option';
            option.dataset.method = method.id;
            
            if (this.activeMethod === method.id) {
                option.classList.add('active');
            }
            
            option.innerHTML = `
                <span class="alt-input-option-icon">${method.icon}</span>
                <span class="alt-input-option-label">${method.label}</span>
            `;
            
            option.addEventListener('click', () => {
                this.selectInputMethod(method.id);
                menu.classList.remove('show');
            });
            
            menu.appendChild(option);
        });
        
        return menu;
    }
    
    // Select input method
    selectInputMethod(method) {
        // Stop current method
        if (this.activeMethod) {
            this.stopActiveMethod();
        }
        
        // Start new method
        switch (method) {
            case 'voice':
                this.startVoiceInput();
                break;
            case 'switch':
                this.toggleSwitchScanning();
                break;
            case 'gesture':
                this.showFeedback('Gestures are always active. Try swiping!', 'info');
                this.setActiveMethod('gesture');
                break;
            case 'keyboard':
                this.showFeedback('Keyboard mode active', 'info');
                this.setActiveMethod('keyboard');
                if (this.taskInput) {
                    this.taskInput.focus();
                }
                break;
        }
        
        // Save preference
        if (this.config.rememberPreference) {
            this.preferences.preferredMethod = method;
            this.savePreferences();
        }
    }
    
    // Stop active method
    stopActiveMethod() {
        switch (this.activeMethod) {
            case 'voice':
                if (this.voiceManager?.isActive()) {
                    this.voiceManager.stopListening();
                }
                break;
            case 'switch':
                if (this.switchScanner?.isScanning()) {
                    this.switchScanner.stop();
                }
                break;
        }
    }
    
    // Set active method
    setActiveMethod(method) {
        this.activeMethod = method;
        
        // Update UI
        if (this.altInputToggle) {
            const icons = {
                voice: '🎙️',
                gesture: '👆',
                switch: '🎮',
                keyboard: '⌨️'
            };
            this.altInputToggle.innerHTML = icons[method] || '🎛️';
            this.altInputToggle.classList.toggle('active', !!method);
        }
        
        // Update menu
        document.querySelectorAll('.alt-input-option').forEach(option => {
            option.classList.toggle('active', option.dataset.method === method);
        });
    }
    
    // Show feedback
    showFeedback(message, type = 'info') {
        if (!this.config.provideFeedback) return;
        
        // Use RSD-safe message handler if available
        if (window.RSDMessageHandler) {
            const handler = new window.RSDMessageHandler(document.body);
            handler.showCustom(message, {
                type: type,
                duration: this.config.feedbackDuration
            });
        } else {
            // Fallback to console
            console.log(`[${type}] ${message}`);
        }
    }
    
    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    scrollToInput() {
        if (this.taskInput) {
            this.taskInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    scrollToTasks() {
        if (this.taskList) {
            this.taskList.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    // Track usage for learning
    trackUsage(action, source) {
        if (!this.config.autoDetectPreference) return;
        
        // Increment usage counter
        const key = `usage_${source}`;
        this.preferences[key] = (this.preferences[key] || 0) + 1;
        
        // Auto-detect preference after enough usage
        if (this.getTotalUsage() >= 20) {
            this.detectPreferredMethod();
        }
        
        this.savePreferences();
    }
    
    // Get total usage
    getTotalUsage() {
        return Object.keys(this.preferences)
            .filter(key => key.startsWith('usage_'))
            .reduce((total, key) => total + this.preferences[key], 0);
    }
    
    // Detect preferred method
    detectPreferredMethod() {
        const usage = {
            voice: this.preferences.usage_voice || 0,
            gesture: this.preferences.usage_gesture || 0,
            switch: this.preferences.usage_switch || 0,
            manual: this.preferences.usage_manual || 0
        };
        
        // Find most used method
        let maxUsage = 0;
        let preferred = 'manual';
        
        Object.entries(usage).forEach(([method, count]) => {
            if (count > maxUsage) {
                maxUsage = count;
                preferred = method;
            }
        });
        
        // Update preference if significantly different
        if (preferred !== 'manual' && maxUsage > usage.manual * 1.5) {
            this.preferences.preferredMethod = preferred;
            this.showFeedback(`I've noticed you prefer ${preferred} input. Making it your default!`, 'info');
        }
    }
    
    // Setup UI controls
    setupUIControls() {
        // Add keyboard shortcut for quick access
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Space for voice
            if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
                e.preventDefault();
                if (this.voiceManager?.isActive()) {
                    this.voiceManager.stopListening();
                } else {
                    this.startVoiceInput();
                }
            }
            
            // Ctrl/Cmd + Shift + S for switch scanning
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.toggleSwitchScanning();
            }
        });
        
        // Handle form submission
        if (this.taskInput) {
            const form = this.taskInput.closest('form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const title = this.taskInput.value.trim();
                    if (title) {
                        this.createTask(title, 'keyboard');
                    }
                });
            }
        }
    }
    
    // Preferences
    loadPreferences() {
        try {
            const saved = localStorage.getItem('altInputPreferences');
            if (saved) {
                this.preferences = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    }
    
    savePreferences() {
        try {
            localStorage.setItem('altInputPreferences', JSON.stringify(this.preferences));
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }
    
    applyPreferences() {
        // Apply preferred method
        if (this.preferences.preferredMethod && this.preferences.preferredMethod !== 'manual') {
            // Don't auto-start, but show hint
            setTimeout(() => {
                this.showFeedback(
                    `Tip: Press Ctrl+Space to start ${this.preferences.preferredMethod} input`,
                    'info'
                );
            }, 2000);
        }
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.altInput = new AlternativeInputIntegration();
        window.altInput.init();
    });
} else {
    window.altInput = new AlternativeInputIntegration();
    window.altInput.init();
}

// Export
window.AlternativeInputIntegration = AlternativeInputIntegration;