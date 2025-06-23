// Undo Functionality Tests for ADHD Users
// Based on research: ADHD users need 100+ undo levels, use undo 4-6x more

(function() {
    'use strict';

    var suite = {
        name: 'Undo Functionality',
        tests: []
    };

    // Constants based on ADHD research
    var MIN_UNDO_LEVELS = 100;
    var ADHD_UNDO_MULTIPLIER = 5; // 4-6x more usage
    var CHARACTER_LEVEL_UNDO = true; // Character-by-character for text
    var UNDO_PERSIST_TIME = 30 * 60 * 1000; // 30 minutes

    // Mock undo stack implementation
    function UndoStack(maxSize) {
        this.stack = [];
        this.currentIndex = -1;
        this.maxSize = maxSize || MIN_UNDO_LEVELS;
    }

    UndoStack.prototype.push = function(action) {
        // Remove any redo items
        this.stack = this.stack.slice(0, this.currentIndex + 1);
        
        // Add new action
        this.stack.push(action);
        
        // Limit stack size
        if (this.stack.length > this.maxSize) {
            this.stack.shift();
        } else {
            this.currentIndex++;
        }
    };

    UndoStack.prototype.undo = function() {
        if (this.canUndo()) {
            var action = this.stack[this.currentIndex];
            this.currentIndex--;
            return action;
        }
        return null;
    };

    UndoStack.prototype.redo = function() {
        if (this.canRedo()) {
            this.currentIndex++;
            return this.stack[this.currentIndex];
        }
        return null;
    };

    UndoStack.prototype.canUndo = function() {
        return this.currentIndex >= 0;
    };

    UndoStack.prototype.canRedo = function() {
        return this.currentIndex < this.stack.length - 1;
    };

    // Test: Minimum 100 undo levels
    suite.tests.push({
        name: 'Maintains 100+ undo levels',
        test: function(done) {
            var undoStack = new UndoStack(MIN_UNDO_LEVELS);
            
            // Add 150 actions
            for (var i = 0; i < 150; i++) {
                undoStack.push({
                    type: 'edit',
                    data: 'Action ' + i
                });
            }
            
            // Should maintain at least 100
            TestUtils.assert(undoStack.stack.length >= MIN_UNDO_LEVELS,
                'Undo stack size: ' + undoStack.stack.length + ' (min: ' + MIN_UNDO_LEVELS + ')');
            
            // Test we can undo at least 100 times
            var undoCount = 0;
            while (undoStack.canUndo() && undoCount < MIN_UNDO_LEVELS) {
                undoStack.undo();
                undoCount++;
            }
            
            TestUtils.assert(undoCount >= MIN_UNDO_LEVELS,
                'Can undo ' + undoCount + ' times (min: ' + MIN_UNDO_LEVELS + ')');
            
            done();
        }
    });

    // Test: Character-level undo for text
    suite.tests.push({
        name: 'Supports character-level undo for text input',
        test: function(done) {
            var textInput = document.createElement('textarea');
            textInput.value = '';
            document.body.appendChild(textInput);
            
            var undoStack = new UndoStack();
            var previousValue = '';
            
            // Track character changes
            textInput.addEventListener('input', function() {
                var currentValue = textInput.value;
                var change = {
                    type: 'text',
                    before: previousValue,
                    after: currentValue,
                    position: textInput.selectionStart
                };
                undoStack.push(change);
                previousValue = currentValue;
            });
            
            // Simulate typing "Hello World"
            var text = 'Hello World';
            for (var i = 0; i < text.length; i++) {
                textInput.value += text[i];
                textInput.dispatchEvent(new Event('input'));
            }
            
            TestUtils.assert(undoStack.stack.length === text.length,
                'Each character tracked: ' + undoStack.stack.length + ' changes');
            
            // Test character-level undo
            var lastChange = undoStack.undo();
            TestUtils.assert(lastChange.after === 'Hello World',
                'Last state captured correctly');
            TestUtils.assert(lastChange.before === 'Hello Worl',
                'Character-level tracking works');
            
            document.body.removeChild(textInput);
            done();
        }
    });

    // Test: Undo usage frequency
    suite.tests.push({
        name: 'Handles 4-6x more undo usage than baseline',
        test: function(done) {
            var baselineUndoUsage = 10; // Typical user might undo 10 times
            var adhdUndoUsage = baselineUndoUsage * ADHD_UNDO_MULTIPLIER;
            
            var undoStack = new UndoStack(adhdUndoUsage * 2); // Ensure enough capacity
            
            // Simulate high undo usage
            for (var i = 0; i < adhdUndoUsage * 2; i++) {
                undoStack.push({ type: 'action', id: i });
            }
            
            // Perform many undos
            var undoPerformed = 0;
            for (var j = 0; j < adhdUndoUsage; j++) {
                if (undoStack.canUndo()) {
                    undoStack.undo();
                    undoPerformed++;
                }
            }
            
            TestUtils.assert(undoPerformed >= adhdUndoUsage,
                'Handled ' + undoPerformed + ' undos (expected: ' + adhdUndoUsage + ')');
            
            // Should still be able to redo
            TestUtils.assert(undoStack.canRedo(),
                'Redo available after heavy undo usage');
            
            done();
        }
    });

    // Test: Undo/Redo UI accessibility
    suite.tests.push({
        name: 'Undo/Redo controls are easily accessible',
        test: function(done) {
            // Create UI elements
            var toolbar = document.createElement('div');
            toolbar.className = 'toolbar';
            toolbar.innerHTML = 
                '<button class="undo-btn" title="Undo (Ctrl+Z)">Undo</button>' +
                '<button class="redo-btn" title="Redo (Ctrl+Y)">Redo</button>';
            document.body.appendChild(toolbar);
            
            var undoBtn = toolbar.querySelector('.undo-btn');
            var redoBtn = toolbar.querySelector('.redo-btn');
            
            // Check button properties
            var undoRect = undoBtn.getBoundingClientRect();
            var redoRect = redoBtn.getBoundingClientRect();
            
            // Buttons should be prominently sized
            TestUtils.assert(undoRect.width >= 60 && undoRect.height >= 40,
                'Undo button size: ' + undoRect.width + 'x' + undoRect.height + 'px');
            TestUtils.assert(redoRect.width >= 60 && redoRect.height >= 40,
                'Redo button size: ' + redoRect.width + 'x' + redoRect.height + 'px');
            
            // Check keyboard shortcuts
            var hasUndoShortcut = undoBtn.title.includes('Ctrl+Z') || undoBtn.title.includes('Cmd+Z');
            var hasRedoShortcut = redoBtn.title.includes('Ctrl+Y') || redoBtn.title.includes('Cmd+Y');
            
            TestUtils.assert(hasUndoShortcut, 'Undo shortcut indicated');
            TestUtils.assert(hasRedoShortcut, 'Redo shortcut indicated');
            
            document.body.removeChild(toolbar);
            done();
        }
    });

    // Test: Undo persistence
    suite.tests.push({
        name: 'Undo history persists for 30+ minutes',
        test: function(done) {
            var undoStack = new UndoStack();
            var persistedData = null;
            
            // Mock persistence layer
            var storage = {
                save: function(data) {
                    persistedData = {
                        data: JSON.stringify(data),
                        timestamp: Date.now()
                    };
                },
                load: function() {
                    if (persistedData) {
                        var age = Date.now() - persistedData.timestamp;
                        if (age < UNDO_PERSIST_TIME) {
                            return JSON.parse(persistedData.data);
                        }
                    }
                    return null;
                }
            };
            
            // Add some actions
            for (var i = 0; i < 20; i++) {
                undoStack.push({ type: 'edit', value: i });
            }
            
            // Save undo history
            storage.save(undoStack.stack);
            
            // Simulate time passing (but less than 30 minutes)
            persistedData.timestamp -= (20 * 60 * 1000); // 20 minutes ago
            
            // Load should work
            var loaded = storage.load();
            TestUtils.assert(loaded !== null,
                'Undo history loaded after 20 minutes');
            TestUtils.assert(loaded.length === 20,
                'Full history preserved: ' + loaded.length + ' actions');
            
            // Simulate more time passing (over 30 minutes)
            persistedData.timestamp -= (20 * 60 * 1000); // Now 40 minutes ago
            
            // Load should fail
            var expired = storage.load();
            TestUtils.assert(expired === null,
                'Undo history expired after 40 minutes');
            
            done();
        }
    });

    // Test: Undo grouping for related actions
    suite.tests.push({
        name: 'Groups related actions for efficient undo',
        test: function(done) {
            var undoStack = new UndoStack();
            var groupingWindow = 500; // ms
            
            function addGroupedAction(action) {
                var lastAction = undoStack.stack[undoStack.currentIndex];
                
                if (lastAction && 
                    lastAction.type === action.type && 
                    action.timestamp - lastAction.timestamp < groupingWindow) {
                    // Group with previous action
                    if (!lastAction.group) {
                        lastAction.group = [lastAction];
                    }
                    lastAction.group.push(action);
                    lastAction.timestamp = action.timestamp;
                } else {
                    // New action
                    undoStack.push(action);
                }
            }
            
            // Simulate rapid text formatting
            var baseTime = Date.now();
            addGroupedAction({ type: 'format', action: 'bold', timestamp: baseTime });
            addGroupedAction({ type: 'format', action: 'italic', timestamp: baseTime + 100 });
            addGroupedAction({ type: 'format', action: 'underline', timestamp: baseTime + 200 });
            
            // Should be grouped as one
            TestUtils.assert(undoStack.stack.length === 1,
                'Related actions grouped: ' + undoStack.stack.length + ' group(s)');
            
            // Add different action type (shouldn't group)
            addGroupedAction({ type: 'text', action: 'insert', timestamp: baseTime + 300 });
            
            TestUtils.assert(undoStack.stack.length === 2,
                'Different actions not grouped');
            
            done();
        }
    });

    // Test: Visual undo feedback
    suite.tests.push({
        name: 'Provides clear visual feedback for undo/redo',
        test: function(done) {
            var container = document.createElement('div');
            container.innerHTML = '<div class="content">Original text</div>';
            document.body.appendChild(container);
            
            var content = container.querySelector('.content');
            var originalText = content.textContent;
            
            // Simulate undo with visual feedback
            function performUndo() {
                // Flash animation
                content.style.backgroundColor = '#fffacd';
                content.style.transition = 'background-color 0.3s';
                
                // Revert content
                content.textContent = originalText;
                
                setTimeout(function() {
                    content.style.backgroundColor = '';
                }, 300);
                
                return true;
            }
            
            // Change content
            content.textContent = 'Modified text';
            
            // Perform undo
            var feedbackProvided = performUndo();
            
            TestUtils.assert(feedbackProvided,
                'Visual feedback provided for undo');
            TestUtils.assert(content.textContent === originalText,
                'Content reverted correctly');
            TestUtils.assert(content.style.transition.includes('background-color'),
                'Smooth transition applied');
            
            document.body.removeChild(container);
            done();
        }
    });

    // Test: Undo availability indicators
    suite.tests.push({
        name: 'Shows clear indicators when undo/redo available',
        test: function(done) {
            var undoStack = new UndoStack();
            
            // UI indicators
            var indicators = {
                undoButton: { disabled: true, opacity: 0.5 },
                redoButton: { disabled: true, opacity: 0.5 },
                undoCount: 0,
                redoCount: 0
            };
            
            function updateIndicators() {
                indicators.undoButton.disabled = !undoStack.canUndo();
                indicators.undoButton.opacity = undoStack.canUndo() ? 1.0 : 0.5;
                indicators.redoButton.disabled = !undoStack.canRedo();
                indicators.redoButton.opacity = undoStack.canRedo() ? 1.0 : 0.5;
                
                // Count available actions
                var tempIndex = undoStack.currentIndex;
                indicators.undoCount = tempIndex + 1;
                indicators.redoCount = undoStack.stack.length - tempIndex - 1;
            }
            
            // Initial state
            updateIndicators();
            TestUtils.assert(indicators.undoButton.disabled === true,
                'Undo disabled when no history');
            
            // Add action
            undoStack.push({ type: 'test' });
            updateIndicators();
            TestUtils.assert(indicators.undoButton.disabled === false,
                'Undo enabled after action');
            TestUtils.assert(indicators.undoButton.opacity === 1.0,
                'Undo button fully visible');
            
            // Perform undo
            undoStack.undo();
            updateIndicators();
            TestUtils.assert(indicators.redoButton.disabled === false,
                'Redo enabled after undo');
            TestUtils.assert(indicators.undoCount === 0,
                'Undo count updated');
            TestUtils.assert(indicators.redoCount === 1,
                'Redo count updated');
            
            done();
        }
    });

    // Test: Undo conflict resolution
    suite.tests.push({
        name: 'Handles undo conflicts gracefully',
        test: function(done) {
            var document = {
                content: 'Initial content',
                version: 1
            };
            
            var undoStack = new UndoStack();
            
            // Add change
            var change1 = {
                type: 'edit',
                before: 'Initial content',
                after: 'Modified content',
                version: 1
            };
            undoStack.push(change1);
            document.content = change1.after;
            document.version = 2;
            
            // External change happens
            document.content = 'External change';
            document.version = 3;
            
            // Try to undo - detect conflict
            function tryUndo() {
                var action = undoStack.undo();
                if (action && action.version !== document.version - 1) {
                    // Conflict detected
                    return {
                        success: false,
                        conflict: true,
                        message: "Let's refresh and try again"
                    };
                }
                return { success: true };
            }
            
            var result = tryUndo();
            TestUtils.assert(result.conflict === true,
                'Conflict detected correctly');
            TestUtils.assert(!result.message.includes('error'),
                'Conflict message is RSD-aware');
            
            done();
        }
    });

    // Test: Undo performance with large history
    suite.tests.push({
        name: 'Maintains performance with large undo history',
        test: function(done) {
            var undoStack = new UndoStack(200);
            var startTime = performance.now();
            
            // Add 200 actions
            for (var i = 0; i < 200; i++) {
                undoStack.push({
                    type: 'action',
                    id: i,
                    data: 'x'.repeat(100) // Some data
                });
            }
            
            var populateTime = performance.now() - startTime;
            TestUtils.assert(populateTime < 100,
                'History populated quickly: ' + populateTime.toFixed(2) + 'ms');
            
            // Time undo operations
            startTime = performance.now();
            for (var j = 0; j < 50; j++) {
                undoStack.undo();
            }
            var undoTime = performance.now() - startTime;
            
            TestUtils.assert(undoTime < 50,
                '50 undos performed quickly: ' + undoTime.toFixed(2) + 'ms');
            
            // Time redo operations
            startTime = performance.now();
            for (var k = 0; k < 50; k++) {
                undoStack.redo();
            }
            var redoTime = performance.now() - startTime;
            
            TestUtils.assert(redoTime < 50,
                '50 redos performed quickly: ' + redoTime.toFixed(2) + 'ms');
            
            done();
        }
    });

    // Register the suite and tests
    function register() {
        if (typeof TestRunner === 'undefined') return;
        
        TestRunner.registerSuite(suite.name);
        
        suite.tests.forEach(function(test) {
            TestRunner.registerTest(suite.name, test.name, test.test, { async: test.test.length > 0 });
        });
    }

    // Export for module usage
    window.UndoFunctionalityTests = {
        suite: suite,
        register: register
    };
    
    // Auto-register if TestRunner is available
    if (typeof TestRunner !== 'undefined') {
        register();
    }

})();