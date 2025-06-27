// Task Timer Module - Lightweight timer feature for ADHD users
// Provides visual countdown, notifications, and time-boxing for tasks

var TaskTimer = (function() {
    'use strict';
    
    var timers = {}; // Active timers by task ID
    var buttonCache = {}; // Cache timer button references
    var defaultDurations = [5, 10, 15, 20, 25, 30, 45, 60]; // minutes
    var tickInterval = null;
    var audioEnabled = true;
    var volumeLevel = 0.5;
    var warningTime = 60; // seconds
    
    // Initialize the timer system
    function init() {
        loadActiveTimers();
        startTickLoop();
        loadSettings();
    }
    
    // Create a new timer for a task
    function createTimer(taskId, durationMinutes) {
        // Validate input
        if (!taskId || !durationMinutes || durationMinutes <= 0) {
            console.error('Invalid timer parameters');
            return null;
        }
        
        var timer = {
            taskId: taskId,
            duration: durationMinutes * 60, // Convert to seconds
            remaining: durationMinutes * 60,
            startTime: Date.now(),
            isPaused: false,
            hasNotified: false,
            hasWarned: false
        };
        
        timers[taskId] = timer;
        saveTimers();
        updateTimerDisplay(taskId);
        
        // Restart tick loop if it was stopped
        if (!tickInterval) {
            startTickLoop();
        }
        
        return timer;
    }
    
    // Start the global tick loop
    function startTickLoop() {
        if (tickInterval) {
            stopTickLoop();
        }
        
        // Use TimerManager for memory safety
        if (window.TimerManager) {
            tickInterval = window.TimerManager.setInterval(function() {
                tick();
            }, 1000);
        } else {
            // Fallback to regular setInterval
            tickInterval = setInterval(function() {
                tick();
            }, 1000);
        }
    }
    
    // Stop the tick loop
    function stopTickLoop() {
        if (tickInterval) {
            if (window.TimerManager) {
                window.TimerManager.clearInterval(tickInterval);
            } else {
                clearInterval(tickInterval);
            }
            tickInterval = null;
        }
    }
    
    // Update all active timers
    function tick() {
        var hasActiveTimers = false;
        var activeTimerCount = 0;
        
        for (var taskId in timers) {
            if (timers.hasOwnProperty(taskId)) {
                var timer = timers[taskId];
                if (!timer.isPaused && timer.remaining > 0) {
                    timer.remaining--;
                    hasActiveTimers = true;
                    activeTimerCount++;
                    updateTimerDisplay(taskId);
                    
                    // Check for warning time
                    if (!timer.hasWarned && timer.remaining === warningTime) {
                        showWarning(taskId);
                        timer.hasWarned = true;
                    }
                    
                    // Check for completion
                    if (timer.remaining === 0) {
                        timerComplete(taskId);
                    }
                }
            }
        }
        
        // Stop the interval if no active timers to prevent memory leak
        if (activeTimerCount === 0 && tickInterval) {
            stopTickLoop();
        }
        
        if (hasActiveTimers) {
            saveTimers();
        }
    }
    
    // Update the timer display for a specific task
    function updateTimerDisplay(taskId) {
        var timer = timers[taskId];
        var button = buttonCache[taskId];
        
        // Try to get button from cache or DOM
        if (!button) {
            button = document.querySelector('[data-task-id="' + taskId + '"] .task-timer-button');
            if (button) {
                buttonCache[taskId] = button;
            }
        }
        
        if (button && timer) {
            button.innerHTML = '⏱️ ' + formatTime(timer.remaining);
            button.classList.add('active');
            
            // Add visual states
            if (timer.remaining === 0) {
                button.classList.add('complete');
                button.classList.remove('warning');
            } else if (timer.remaining <= warningTime) {
                button.classList.add('warning');
            }
            
            if (timer.isPaused) {
                button.classList.add('paused');
            } else {
                button.classList.remove('paused');
            }
        }
    }
    
    // Format seconds to MM:SS
    function formatTime(seconds) {
        var minutes = Math.floor(seconds / 60);
        var secs = seconds % 60;
        return minutes + ':' + (secs < 10 ? '0' : '') + secs;
    }
    
    // Announce for screen readers
    function announceForScreenReader(message) {
        var announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(function() {
            announcement.remove();
        }, 1000);
    }
    
    // Start a timer for a task
    function startTimer(taskId, duration) {
        createTimer(taskId, duration);
        closeTimerMenu();
        announceForScreenReader('Timer started for ' + duration + ' minutes');
    }
    
    // Start a custom timer
    function startCustomTimer(taskId) {
        var input = document.getElementById('custom-duration');
        if (input) {
            var duration = parseInt(input.value, 10);
            if (duration && duration >= 1 && duration <= 180) {
                createTimer(taskId, duration);
                closeTimerMenu();
                announceForScreenReader('Timer started for ' + duration + ' minutes');
            } else {
                alert('Please enter a duration between 1 and 180 minutes');
                input.focus();
            }
        }
    }
    
    // Toggle pause/resume
    function togglePause(taskId) {
        var timer = timers[taskId];
        if (timer) {
            timer.isPaused = !timer.isPaused;
            updateTimerDisplay(taskId);
            saveTimers();
        }
        closeTimerMenu();
    }
    
    // Cancel a timer
    function cancelTimer(taskId) {
        // Get button reference before deleting from cache
        var button = buttonCache[taskId] || document.querySelector('[data-task-id="' + taskId + '"] .task-timer-button');
        
        // Now safe to delete
        delete timers[taskId];
        delete buttonCache[taskId];
        saveTimers();
        
        // Update button display
        if (button) {
            button.innerHTML = '⏱️';
            button.classList.remove('active', 'warning', 'complete', 'paused');
        }
        
        closeTimerMenu();
    }
    
    // Clear button cache (called when tasks are re-rendered)
    function clearButtonCache() {
        buttonCache = {};
    }
    
    // Pre-warm button cache after render
    function prewarmButtonCache() {
        for (var taskId in timers) {
            if (timers.hasOwnProperty(taskId) && !buttonCache[taskId]) {
                var button = document.querySelector('[data-task-id="' + taskId + '"] .task-timer-button');
                if (button) {
                    buttonCache[taskId] = button;
                }
            }
        }
    }
    
    // Show timer menu
    function showTimerMenu(taskId, button) {
        closeTimerMenu(); // Close any existing menu
        
        var existingTimer = timers[taskId];
        var menu = document.createElement('div');
        menu.className = 'timer-menu';
        menu.setAttribute('role', 'menu');
        
        if (existingTimer) {
            // Timer controls
            var html = '<div class="timer-controls" role="group" aria-label="Timer controls">';
            html += '<button role="menuitem" onclick="TaskTimer.togglePause(\'' + taskId + '\')">';
            html += existingTimer.isPaused ? '▶️ Resume' : '⏸️ Pause';
            html += '</button>';
            html += '<button role="menuitem" onclick="TaskTimer.cancelTimer(\'' + taskId + '\')">❌ Cancel</button>';
            html += '</div>';
            menu.innerHTML = html;
        } else {
            // Duration options
            var html = '<div class="timer-durations" role="group" aria-label="Timer duration options">';
            html += '<div class="timer-label">Set Timer:</div>';
            
            // Preset duration buttons
            defaultDurations.forEach(function(duration) {
                html += '<button role="menuitem" class="duration-option" ';
                html += 'onclick="TaskTimer.startTimer(\'' + taskId + '\', ' + duration + ')">';
                html += duration + ' min</button>';
            });
            
            // Custom duration input
            html += '<div class="custom-duration-container" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">';
            html += '<label for="custom-duration" style="display: block; margin-bottom: 8px; font-size: 14px;">Custom (minutes):</label>';
            html += '<div style="display: flex; gap: 8px;">';
            html += '<input type="number" id="custom-duration" min="1" max="180" placeholder="1-180" ';
            html += 'style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 16px;">';
            html += '<button onclick="TaskTimer.startCustomTimer(\'' + taskId + '\')" ';
            html += 'style="padding: 8px 16px; background: var(--primary-purple); color: white; border: none; border-radius: 4px; cursor: pointer;">Start</button>';
            html += '</div>';
            html += '</div>';
            
            html += '</div>';
            menu.innerHTML = html;
        }
        
        // Position near button
        positionMenu(menu, button);
        document.body.appendChild(menu);
        
        // Focus first button for accessibility
        var firstButton = menu.querySelector('button');
        if (firstButton) {
            firstButton.focus();
        }
        
        // Close on outside click
        setTimeout(function() {
            document.addEventListener('click', closeMenuHandler);
            document.addEventListener('keydown', menuKeyHandler);
        }, 0);
    }
    
    // Close timer menu
    function closeTimerMenu() {
        var menu = document.querySelector('.timer-menu');
        if (menu) {
            menu.remove();
            document.removeEventListener('click', closeMenuHandler);
            document.removeEventListener('keydown', menuKeyHandler);
            
            // Remove mobile backdrop if exists
            var backdrop = document.getElementById('timer-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
        }
    }
    
    // Menu close handler
    function closeMenuHandler(e) {
        if (!e.target.closest('.timer-menu') && !e.target.closest('.task-timer-button')) {
            closeTimerMenu();
        }
    }
    
    // Menu keyboard handler
    function menuKeyHandler(e) {
        var menu = document.querySelector('.timer-menu');
        if (!menu) return;
        
        if (e.key === 'Escape') {
            closeTimerMenu();
            return;
        }
        
        // Arrow key navigation
        var focusableElements = menu.querySelectorAll('button:not([disabled]), input:not([disabled])');
        var currentIndex = Array.prototype.indexOf.call(focusableElements, document.activeElement);
        
        switch(e.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                var nextIndex = currentIndex + 1;
                if (nextIndex < focusableElements.length) {
                    focusableElements[nextIndex].focus();
                    announceForScreenReader('Moved to ' + (focusableElements[nextIndex].textContent || 'input field'));
                }
                break;
                
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault();
                var prevIndex = currentIndex - 1;
                if (prevIndex >= 0) {
                    focusableElements[prevIndex].focus();
                    announceForScreenReader('Moved to ' + (focusableElements[prevIndex].textContent || 'input field'));
                }
                break;
                
            case 'Home':
                e.preventDefault();
                focusableElements[0].focus();
                announceForScreenReader('Moved to first option');
                break;
                
            case 'End':
                e.preventDefault();
                focusableElements[focusableElements.length - 1].focus();
                announceForScreenReader('Moved to last option');
                break;
        }
    }
    
    // Detect if device is mobile
    function isMobile() {
        return window.innerWidth <= 768 || 
               ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0);
    }
    
    // Position menu near button
    function positionMenu(menu, button) {
        // Mobile positioning - bottom sheet
        if (isMobile()) {
            menu.style.position = 'fixed';
            menu.style.bottom = '0';
            menu.style.left = '0';
            menu.style.right = '0';
            menu.style.top = 'auto';
            menu.style.borderRadius = '20px 20px 0 0';
            menu.style.padding = '20px';
            menu.style.maxHeight = '50vh';
            menu.style.overflowY = 'auto';
            menu.classList.add('timer-menu-mobile');
            
            // Add backdrop for mobile
            var backdrop = document.createElement('div');
            backdrop.className = 'timer-menu-backdrop';
            backdrop.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999;';
            backdrop.onclick = closeTimerMenu;
            menu.setAttribute('data-backdrop-id', 'timer-backdrop');
            backdrop.id = 'timer-backdrop';
            document.body.appendChild(backdrop);
        } else {
            // Desktop positioning
            var rect = button.getBoundingClientRect();
            var menuHeight = 200; // Approximate height
            var menuWidth = 200; // Approximate width
            
            // Default position below button
            var top = rect.bottom + 5;
            var left = rect.left;
            
            // Adjust if menu would go off screen
            if (top + menuHeight > window.innerHeight) {
                top = rect.top - menuHeight - 5;
            }
            
            if (left + menuWidth > window.innerWidth) {
                left = window.innerWidth - menuWidth - 10;
            }
            
            menu.style.position = 'absolute';
            menu.style.top = top + 'px';
            menu.style.left = left + 'px';
        }
        
        menu.style.zIndex = '1000';
    }
    
    // Timer complete handler
    function timerComplete(taskId) {
        var timer = timers[taskId];
        
        if (!timer.hasNotified) {
            timer.hasNotified = true;
            
            // Visual notification
            showTimerAlert(taskId);
            
            // Audio notification
            if (audioEnabled) {
                playTimerSound();
            }
            
            // Haptic feedback on mobile
            if ('vibrate' in navigator) {
                try {
                    navigator.vibrate([200, 100, 200]);
                } catch (e) {
                    console.log('Vibration not supported or failed:', e);
                }
            }
            
            // Update display
            updateTimerDisplay(taskId);
        }
    }
    
    // Show warning
    function showWarning(taskId) {
        updateTimerDisplay(taskId);
        
        // Subtle audio warning
        if (audioEnabled) {
            playWarningSound();
        }
    }
    
    // Show timer alert
    function showTimerAlert(taskId) {
        var task = null;
        var taskTitle = 'Task';
        
        try {
            if (window.TaskDisplay && window.TaskDisplay.getTaskById) {
                task = window.TaskDisplay.getTaskById(taskId);
                if (task && task.title) {
                    taskTitle = task.title;
                }
            }
        } catch (e) {
            console.log('Could not get task details:', e);
        }
        
        var message = 'Timer complete for: ' + taskTitle;
        
        // Show toast notification
        var toast = document.createElement('div');
        toast.className = 'timer-alert';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.innerHTML = '⏰ ' + message;
        document.body.appendChild(toast);
        
        setTimeout(function() {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(function() {
            toast.classList.add('hide');
            setTimeout(function() {
                toast.remove();
            }, 300);
        }, 5000);
    }
    
    // Play timer complete sound
    function playTimerSound() {
        try {
            if (!audioEnabled) return;
            
            var audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // First beep
            var oscillator1 = audioContext.createOscillator();
            var gainNode1 = audioContext.createGain();
            
            oscillator1.connect(gainNode1);
            gainNode1.connect(audioContext.destination);
            
            oscillator1.frequency.value = 800;
            gainNode1.gain.value = volumeLevel * 0.3;
            
            oscillator1.start(audioContext.currentTime);
            oscillator1.stop(audioContext.currentTime + 0.2);
            
            // Second beep
            setTimeout(function() {
                var oscillator2 = audioContext.createOscillator();
                var gainNode2 = audioContext.createGain();
                
                oscillator2.connect(gainNode2);
                gainNode2.connect(audioContext.destination);
                
                oscillator2.frequency.value = 1000;
                gainNode2.gain.value = volumeLevel * 0.3;
                
                oscillator2.start(audioContext.currentTime);
                oscillator2.stop(audioContext.currentTime + 0.2);
            }, 250);
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }
    
    // Play warning sound
    function playWarningSound() {
        try {
            var audioContext = new (window.AudioContext || window.webkitAudioContext)();
            var oscillator = audioContext.createOscillator();
            var gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 600;
            gainNode.gain.value = volumeLevel * 0.2;
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    // Save timers to localStorage
    function saveTimers() {
        var activeTimers = {};
        for (var taskId in timers) {
            if (timers.hasOwnProperty(taskId)) {
                var timer = timers[taskId];
                if (timer.remaining > 0) {
                    activeTimers[taskId] = {
                        duration: timer.duration,
                        remaining: timer.remaining,
                        isPaused: timer.isPaused,
                        startTime: timer.startTime,
                        hasWarned: timer.hasWarned
                    };
                }
            }
        }
        
        try {
            localStorage.setItem('stackmap_timers', JSON.stringify(activeTimers));
        } catch (e) {
            console.error('Failed to save timers:', e);
        }
    }
    
    // Load active timers from localStorage
    function loadActiveTimers() {
        try {
            var saved = localStorage.getItem('stackmap_timers');
            if (saved) {
                var savedTimers = JSON.parse(saved);
                var hasActiveTimers = false;
                
                for (var taskId in savedTimers) {
                    if (savedTimers.hasOwnProperty(taskId)) {
                        var timer = savedTimers[taskId];
                        
                        // Calculate elapsed time correctly
                        if (!timer.isPaused && timer.startTime) {
                            var now = Date.now();
                            var elapsed = Math.floor((now - timer.startTime) / 1000);
                            
                            // Calculate what the remaining time should be
                            var actualRemaining = timer.duration - elapsed;
                            
                            // If more time has passed than what was saved, use the calculated time
                            if (actualRemaining < timer.remaining) {
                                timer.remaining = Math.max(0, actualRemaining);
                            }
                        }
                        
                        // Only restore timers that have time remaining
                        if (timer.remaining > 0) {
                            timer.taskId = taskId;
                            timer.hasNotified = false;
                            timers[taskId] = timer;
                            hasActiveTimers = true;
                            
                            // Update display immediately
                            updateTimerDisplay(taskId);
                        }
                    }
                }
                
                // Start tick loop if we have active timers
                if (hasActiveTimers && !tickInterval) {
                    startTickLoop();
                }
            }
        } catch (e) {
            console.error('Failed to load timers:', e);
        }
    }
    
    // Load settings
    function loadSettings() {
        try {
            var settings = localStorage.getItem('stackmap_timer_settings');
            if (settings) {
                var parsed = JSON.parse(settings);
                audioEnabled = parsed.audioEnabled !== false;
                volumeLevel = parsed.volumeLevel || 0.5;
                warningTime = parsed.warningTime || 60;
            }
        } catch (e) {
            console.error('Failed to load timer settings:', e);
        }
    }
    
    // Save settings
    function saveSettings() {
        try {
            localStorage.setItem('stackmap_timer_settings', JSON.stringify({
                audioEnabled: audioEnabled,
                volumeLevel: volumeLevel,
                warningTime: warningTime
            }));
        } catch (e) {
            console.error('Failed to save timer settings:', e);
        }
    }
    
    // Get timer for task
    function getTimer(taskId) {
        return timers[taskId];
    }
    
    // Get all active timers
    function getActiveTimers() {
        var activeTimers = [];
        for (var taskId in timers) {
            if (timers.hasOwnProperty(taskId) && timers[taskId].remaining > 0) {
                var timer = timers[taskId];
                var task = null;
                if (window.TaskDisplay && window.TaskDisplay.getTaskById) {
                    task = window.TaskDisplay.getTaskById(taskId);
                }
                activeTimers.push({
                    taskId: taskId,
                    taskTitle: task ? task.title : 'Unknown Task',
                    remaining: timer.remaining,
                    duration: timer.duration,
                    isPaused: timer.isPaused
                });
            }
        }
        return activeTimers;
    }
    
    // Show timer overview
    function showTimerOverview() {
        var activeTimers = getActiveTimers();
        
        if (activeTimers.length === 0) {
            alert('No active timers');
            return;
        }
        
        var modal = document.createElement('div');
        modal.className = 'timer-overview-modal';
        modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--background-secondary); padding: 20px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.2); z-index: 2000; max-width: 400px; width: 90%;';
        
        var html = '<h2 style="margin-top: 0;">Active Timers (' + activeTimers.length + ')</h2>';
        html += '<div class="timer-list" style="max-height: 300px; overflow-y: auto;">';
        
        activeTimers.forEach(function(timer) {
            var percentage = Math.round((timer.remaining / timer.duration) * 100);
            html += '<div class="timer-overview-item" style="margin-bottom: 12px; padding: 12px; background: var(--background-primary); border-radius: 8px;">';
            html += '<div style="display: flex; justify-content: space-between; align-items: center;">';
            html += '<span style="font-weight: bold;">' + timer.taskTitle + '</span>';
            html += '<span style="font-size: 18px; color: var(--primary-purple);">' + formatTime(timer.remaining) + '</span>';
            html += '</div>';
            html += '<div style="margin-top: 8px; height: 4px; background: var(--border-color); border-radius: 2px; overflow: hidden;">';
            html += '<div style="height: 100%; width: ' + percentage + '%; background: var(--primary-purple); transition: width 0.3s;"></div>';
            html += '</div>';
            if (timer.isPaused) {
                html += '<span style="font-size: 12px; color: var(--text-secondary);">Paused</span>';
            }
            html += '</div>';
        });
        
        html += '</div>';
        html += '<button onclick="TaskTimer.closeTimerOverview()" style="margin-top: 16px; width: 100%; padding: 12px; background: var(--primary-purple); color: white; border: none; border-radius: 8px; cursor: pointer;">Close</button>';
        
        modal.innerHTML = html;
        
        // Add backdrop
        var backdrop = document.createElement('div');
        backdrop.className = 'timer-overview-backdrop';
        backdrop.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1999;';
        backdrop.onclick = closeTimerOverview;
        
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        
        // Focus close button
        var closeBtn = modal.querySelector('button');
        if (closeBtn) closeBtn.focus();
    }
    
    // Close timer overview
    function closeTimerOverview() {
        var modal = document.querySelector('.timer-overview-modal');
        var backdrop = document.querySelector('.timer-overview-backdrop');
        if (modal) modal.remove();
        if (backdrop) backdrop.remove();
    }
    
    // Set audio enabled
    function setAudioEnabled(enabled) {
        audioEnabled = enabled;
        saveSettings();
    }
    
    // Public API
    return {
        init: init,
        createTimer: createTimer,
        startTimer: startTimer,
        startCustomTimer: startCustomTimer,
        togglePause: togglePause,
        cancelTimer: cancelTimer,
        showTimerMenu: showTimerMenu,
        getTimer: getTimer,
        getActiveTimers: getActiveTimers,
        showTimerOverview: showTimerOverview,
        closeTimerOverview: closeTimerOverview,
        setAudioEnabled: setAudioEnabled,
        formatTime: formatTime,
        clearButtonCache: clearButtonCache,
        prewarmButtonCache: prewarmButtonCache
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', TaskTimer.init);
} else {
    TaskTimer.init();
}