(function() {
    'use strict';
    
    const GrownupMode = {
        // Rate limiting properties
        lastAttemptTime: 0,
        COOLDOWN_MS: 3000, // 3 second cooldown between attempts
        
        // Initialize the module
        init: function() {
            // Module is ready
        },
        
        // Generate a math challenge
        generateChallenge: function() {
            // Simple addition for accessibility
            const a = Math.floor(Math.random() * 10) + 1;  // 1-10
            const b = Math.floor(Math.random() * 10) + 1;  // 1-10
            
            return {
                question: `${a} + ${b} = ?`,
                answer: a + b,
                a: a,
                b: b
            };
        },
        
        // Show the challenge modal
        showChallenge: function(onSuccess) {
            const self = this;
            
            // Check rate limiting
            const now = Date.now();
            const timeSinceLastAttempt = now - self.lastAttemptTime;
            
            if (timeSinceLastAttempt < self.COOLDOWN_MS) {
                const remainingTime = Math.ceil((self.COOLDOWN_MS - timeSinceLastAttempt) / 1000);
                alert(`Please wait ${remainingTime} more second${remainingTime > 1 ? 's' : ''} before trying again.`);
                return;
            }
            
            self.lastAttemptTime = now;
            
            const challenge = this.generateChallenge();
            
            // Check if Modal system is available
            if (!window.Modal || !window.Modal.show) {
                // Fallback to native prompt
                self.showChallengeFallback(challenge, onSuccess);
                return;
            }
            
            // Use existing Modal system
            const html = this.createChallengeForm(challenge);
            
            const modal = window.Modal.show({
                title: '🔒 Grown-up Mode',
                content: html,
                className: 'grownup-modal',
                onClose: function() {
                    // User cancelled - stay in view mode
                }
            });
            
            this.setupChallengeHandlers(modal, challenge, onSuccess);
        },
        
        // Create the challenge form HTML
        createChallengeForm: function(challenge) {
            let html = '<form id="grownup-form" class="grownup-form">';
            
            // Friendly message
            html += '<p class="grownup-message">Please solve this math problem to enter edit mode:</p>';
            
            // Math question
            html += '<div class="math-question">';
            html += `<span class="math-text">${challenge.question}</span>`;
            html += '</div>';
            
            // Answer input
            html += '<div class="answer-field">';
            html += '<input type="number" id="math-answer" class="math-answer" ';
            html += 'placeholder="Your answer" autofocus required aria-label="Enter your answer">';
            html += '</div>';
            
            // Error message container
            html += '<div id="math-error" class="math-error" aria-live="polite"></div>';
            
            // Submit button
            html += '<button type="submit" class="btn-primary">Enter Edit Mode</button>';
            
            html += '</form>';
            
            return html;
        },
        
        // Setup event handlers for the challenge
        setupChallengeHandlers: function(modal, challenge, onSuccess) {
            const self = this;
            const form = modal.querySelector('#grownup-form');
            const input = modal.querySelector('#math-answer');
            const errorDiv = modal.querySelector('#math-error');
            let attempts = 0;
            const maxAttempts = 5;
            
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const userAnswer = parseInt(input.value, 10);
                
                // Clear previous error
                errorDiv.textContent = '';
                input.classList.remove('error');
                
                // Validate input
                if (isNaN(userAnswer)) {
                    self.showError(input, errorDiv, 'Please enter a valid number');
                    return;
                }
                
                if (userAnswer === challenge.answer) {
                    // Correct!
                    window.Modal.close();
                    if (onSuccess) onSuccess();
                    self.showSuccessToast();
                } else {
                    // Wrong answer
                    attempts++;
                    
                    if (attempts >= maxAttempts) {
                        // Too many attempts - generate new challenge
                        challenge = self.generateChallenge();
                        modal.querySelector('.math-text').textContent = challenge.question;
                        self.showError(input, errorDiv, 'Too many attempts. Try this new problem.');
                        attempts = 0;
                    } else {
                        self.showError(input, errorDiv, 'Incorrect. Please try again.');
                    }
                    
                    input.value = '';
                    input.focus();
                }
            });
            
            // Focus input when modal opens
            setTimeout(function() {
                input.focus();
            }, 100);
        },
        
        // Show error feedback
        showError: function(input, errorDiv, message) {
            input.classList.add('error');
            errorDiv.textContent = message;
            
            // Shake animation
            input.style.animation = 'none';
            setTimeout(function() {
                input.style.animation = 'shake 0.5s';
            }, 10);
        },
        
        // Show success toast
        showSuccessToast: function() {
            // Create toast element
            const toast = document.createElement('div');
            toast.className = 'toast success-toast';
            toast.textContent = '✓ Edit mode unlocked!';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            
            document.body.appendChild(toast);
            
            // Trigger animation
            setTimeout(function() {
                toast.classList.add('show');
            }, 10);
            
            // Remove after animation
            setTimeout(function() {
                toast.classList.remove('show');
                setTimeout(function() {
                    document.body.removeChild(toast);
                }, 300);
            }, 2000);
        },
        
        // Fallback challenge using native prompt
        showChallengeFallback: function(challenge, onSuccess) {
            const self = this;
            const maxAttempts = 5;
            let attempts = 0;
            
            while (attempts < maxAttempts) {
                const answer = prompt(`Grown-up Mode\n\nPlease solve this math problem to enter edit mode:\n\n${challenge.question}`);
                
                // User cancelled
                if (answer === null) {
                    return;
                }
                
                const userAnswer = parseInt(answer, 10);
                
                if (userAnswer === challenge.answer) {
                    // Correct!
                    if (onSuccess) onSuccess();
                    self.showSuccessToast();
                    return;
                } else {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        // Generate new challenge
                        challenge = self.generateChallenge();
                        alert(`Too many incorrect attempts. Try this new problem:\n\n${challenge.question}`);
                        attempts = 0;
                    } else {
                        alert('Incorrect. Please try again.');
                    }
                }
            }
        },
        
        // Check if Grown-up Mode is enabled
        isEnabled: function() {
            // Get current user settings
            const currentUser = window.UserManager ? window.UserManager.getCurrentUser() : null;
            if (!currentUser || !currentUser.preferences) {
                // Default to enabled for safety
                return true;
            }
            
            // Check user preference (default to true if not set)
            return currentUser.preferences.grownupMode !== false;
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            GrownupMode.init();
        });
    } else {
        GrownupMode.init();
    }
    
    // Expose to global scope
    window.GrownupMode = GrownupMode;
})();