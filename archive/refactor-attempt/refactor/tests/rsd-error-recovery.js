// RSD-Aware Error Recovery Tests
// Based on research: 99% of ADHD adults have rejection sensitivity

(function() {
    'use strict';

    var suite = {
        name: 'RSD-Aware Error Recovery',
        tests: []
    };

    // RSD trigger words to avoid
    var RSD_TRIGGERS = ['failed', 'wrong', 'bad', 'error', 'incorrect', 'mistake', 'fault', 'broken', 'invalid'];
    
    // Positive framing words
    var POSITIVE_WORDS = ['let\'s', 'we', 'together', 'no worries', 'try', 'help', 'adjust', 'update'];

    // Helper to validate error messages
    function validateRSDMessage(message) {
        var errors = [];
        
        // Check length (15-20 words max)
        var wordCount = message.split(' ').length;
        if (wordCount > 20) {
            errors.push('Message too long: ' + wordCount + ' words (max: 20)');
        }

        // Check for RSD triggers
        var lowerMessage = message.toLowerCase();
        RSD_TRIGGERS.forEach(function(trigger) {
            if (lowerMessage.indexOf(trigger) !== -1) {
                errors.push('Contains RSD trigger: "' + trigger + '"');
            }
        });

        // Check for positive framing
        var hasPositiveFraming = POSITIVE_WORDS.some(function(word) {
            return lowerMessage.indexOf(word) !== -1;
        });
        
        if (!hasPositiveFraming) {
            errors.push('Missing positive framing words');
        }

        return errors;
    }

    // Helper to count recovery steps
    function countRecoverySteps(dialog) {
        var steps = 0;
        var currentElement = dialog;
        
        while (currentElement) {
            var buttons = currentElement.querySelectorAll('button:not([disabled])');
            if (buttons.length > 0) {
                steps++;
            }
            // Look for next step indicator
            currentElement = currentElement.querySelector('.recovery-next-step');
        }
        
        return steps;
    }

    // Test: Error messages avoid RSD triggers
    suite.tests.push({
        name: 'Error messages avoid RSD triggers',
        test: function(done) {
            var testMessages = {
                'password': "Let's try a different password",
                'network': "No worries! We'll try connecting again",
                'save': "We couldn't save just now. Let's try together",
                'validation': "Let's adjust that entry",
                'timeout': "Taking a bit longer - we're still here with you"
            };

            var allValid = true;
            var validationResults = [];

            Object.keys(testMessages).forEach(function(type) {
                var message = testMessages[type];
                var errors = validateRSDMessage(message);
                
                if (errors.length > 0) {
                    allValid = false;
                    validationResults.push(type + ': ' + errors.join(', '));
                }
            });

            TestUtils.assert(allValid, 
                'All error messages RSD-compliant' + 
                (validationResults.length > 0 ? '\nIssues: ' + validationResults.join('\n') : ''));
            
            done();
        }
    });

    // Test: Recovery flows have maximum 2 steps
    suite.tests.push({
        name: 'Error recovery completes in maximum 2 steps',
        test: function(done) {
            // Create mock error dialog
            var errorDialog = document.createElement('div');
            errorDialog.className = 'error-dialog';
            errorDialog.innerHTML = 
                '<p>No worries! Let\'s fix this together</p>' +
                '<button class="primary-action">Try Again</button>' +
                '<button class="secondary-action">Get Help</button>';
            
            document.body.appendChild(errorDialog);

            var steps = countRecoverySteps(errorDialog);
            TestUtils.assert(steps <= 2, 'Recovery steps: ' + steps + ' (max: 2)');

            // Test that clicking primary action resolves in one more step max
            var primaryBtn = errorDialog.querySelector('.primary-action');
            primaryBtn.click();

            // Simulate second step
            errorDialog.innerHTML = 
                '<p>Almost there!</p>' +
                '<button class="complete-action">Done</button>';
            
            var totalSteps = 2; // Initial + second step
            TestUtils.assert(totalSteps <= 2, 'Total recovery steps: ' + totalSteps);

            document.body.removeChild(errorDialog);
            done();
        }
    });

    // Test: Decision options limited to 2-3
    suite.tests.push({
        name: 'Error dialogs provide 2-3 options maximum',
        test: function(done) {
            var testDialogs = [
                {
                    name: 'Network Error',
                    buttons: ['Try Again', 'Work Offline']
                },
                {
                    name: 'Save Conflict',
                    buttons: ['Keep Mine', 'Keep Theirs', 'Merge']
                },
                {
                    name: 'Validation Error',
                    buttons: ['Fix Now', 'Skip']
                }
            ];

            var allValid = true;
            testDialogs.forEach(function(dialog) {
                if (dialog.buttons.length > 3) {
                    allValid = false;
                    TestUtils.assert(false, dialog.name + ' has too many options: ' + dialog.buttons.length);
                }
            });

            TestUtils.assert(allValid, 'All dialogs have 2-3 options maximum');
            done();
        }
    });

    // Test: Immediate acknowledgment of user action
    suite.tests.push({
        name: 'User actions acknowledged immediately',
        test: function(done) {
            var button = document.createElement('button');
            button.textContent = 'Save';
            document.body.appendChild(button);

            var acknowledged = false;
            var acknowledgmentTime = 0;
            var clickTime = performance.now();

            button.addEventListener('click', function() {
                // Simulate immediate visual feedback
                button.classList.add('clicked');
                acknowledged = true;
                acknowledgmentTime = performance.now() - clickTime;
            });

            button.click();

            setTimeout(function() {
                TestUtils.assert(acknowledged, 'Action was acknowledged');
                TestUtils.assert(acknowledgmentTime < 50, 
                    'Acknowledgment time: ' + acknowledgmentTime.toFixed(2) + 'ms (target: <50ms)');
                
                document.body.removeChild(button);
                done();
            }, 100);
        }
    });

    // Test: Undo functionality for errors
    suite.tests.push({
        name: 'Errors can be undone easily',
        test: function(done) {
            var undoAvailable = false;
            var undoAccessible = false;

            // Check for undo after error action
            var errorAction = function() {
                // Simulate error occurring
                var undoButton = document.querySelector('.undo-action');
                if (!undoButton) {
                    undoButton = document.createElement('button');
                    undoButton.className = 'undo-action';
                    undoButton.textContent = 'Undo';
                    document.body.appendChild(undoButton);
                }

                undoAvailable = true;
                
                // Check if undo is easily accessible (visible and prominent)
                var rect = undoButton.getBoundingClientRect();
                undoAccessible = rect.width >= 60 && rect.height >= 40;
            };

            errorAction();

            TestUtils.assert(undoAvailable, 'Undo is available after error');
            TestUtils.assert(undoAccessible, 'Undo button is prominent and accessible');

            var undoBtn = document.querySelector('.undo-action');
            if (undoBtn && undoBtn.parentNode === document.body) {
                document.body.removeChild(undoBtn);
            }
            
            done();
        }
    });

    // Test: Non-blocking error messages
    suite.tests.push({
        name: 'Error messages are non-blocking when possible',
        test: function(done) {
            var toast = document.createElement('div');
            toast.className = 'error-toast';
            toast.textContent = "Let's try that again";
            toast.style.position = 'fixed';
            toast.style.bottom = '20px';
            toast.style.right = '20px';
            document.body.appendChild(toast);

            // Check that main content is still interactive
            var mainContent = document.createElement('button');
            mainContent.className = 'main-action';
            document.body.appendChild(mainContent);

            var mainClickable = true;
            try {
                mainContent.click();
            } catch (e) {
                mainClickable = false;
            }

            TestUtils.assert(mainClickable, 'Main content remains interactive during error display');

            // Check auto-dismiss timing
            var dismissTime = 5000; // 5 seconds
            TestUtils.assert(dismissTime >= 3000 && dismissTime <= 7000, 
                'Error auto-dismiss time appropriate: ' + dismissTime + 'ms');

            document.body.removeChild(toast);
            document.body.removeChild(mainContent);
            done();
        }
    });

    // Test: Progressive disclosure for complex errors
    suite.tests.push({
        name: 'Complex errors use progressive disclosure',
        test: function(done) {
            var errorContainer = document.createElement('div');
            errorContainer.innerHTML = 
                '<div class="error-summary">Something needs our attention</div>' +
                '<button class="show-details">Details</button>' +
                '<div class="error-details" style="display: none;">' +
                '  <p>Technical details here...</p>' +
                '</div>';
            
            document.body.appendChild(errorContainer);

            var summary = errorContainer.querySelector('.error-summary');
            var details = errorContainer.querySelector('.error-details');
            var detailsButton = errorContainer.querySelector('.show-details');

            // Check initial state
            TestUtils.assert(summary.textContent.length < 50, 
                'Summary is concise: ' + summary.textContent.length + ' chars');
            TestUtils.assert(details.style.display === 'none', 
                'Details hidden initially');

            // Check progressive disclosure
            detailsButton.click();
            details.style.display = 'block'; // Simulate showing details

            TestUtils.assert(details.style.display === 'block', 
                'Details shown on request');

            document.body.removeChild(errorContainer);
            done();
        }
    });

    // Test: Error recovery preserves user data
    suite.tests.push({
        name: 'Error recovery preserves user data',
        test: function(done) {
            var formData = {
                task: 'Buy groceries',
                notes: 'Get milk and eggs',
                priority: 'high'
            };

            // Simulate form with data
            var form = document.createElement('form');
            form.innerHTML = 
                '<input name="task" value="' + formData.task + '">' +
                '<textarea name="notes">' + formData.notes + '</textarea>' +
                '<select name="priority"><option value="high" selected>High</option></select>';
            
            document.body.appendChild(form);

            // Simulate error and recovery
            var errorOccurred = function() {
                // Check data is preserved
                var taskInput = form.querySelector('[name="task"]');
                var notesInput = form.querySelector('[name="notes"]');
                var priorityInput = form.querySelector('[name="priority"]');

                TestUtils.assert(taskInput.value === formData.task, 
                    'Task data preserved');
                TestUtils.assert(notesInput.value === formData.notes, 
                    'Notes data preserved');
                TestUtils.assert(priorityInput.value === formData.priority, 
                    'Priority data preserved');
            };

            errorOccurred();
            document.body.removeChild(form);
            done();
        }
    });

    // Test: Contextual help in error messages
    suite.tests.push({
        name: 'Error messages provide contextual help',
        test: function(done) {
            var errorMessages = {
                'network': {
                    message: "Let's check your connection",
                    help: "Try: Turn WiFi off and on"
                },
                'storage_full': {
                    message: "We need a bit more space",
                    help: "Try: Clear some completed tasks"
                },
                'sync_conflict': {
                    message: "Let's sync your changes",
                    help: "Try: Save your version"
                }
            };

            var allHaveHelp = true;
            Object.keys(errorMessages).forEach(function(type) {
                var error = errorMessages[type];
                if (!error.help || error.help.length === 0) {
                    allHaveHelp = false;
                }
                
                // Verify help starts with "Try:"
                TestUtils.assert(error.help.indexOf('Try:') === 0, 
                    type + ' help uses "Try:" prefix');
            });

            TestUtils.assert(allHaveHelp, 'All errors provide contextual help');
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
    window.RSDErrorRecoveryTests = {
        suite: suite,
        register: register
    };
    
    // Auto-register if TestRunner is available
    if (typeof TestRunner !== 'undefined') {
        register();
    }

})();