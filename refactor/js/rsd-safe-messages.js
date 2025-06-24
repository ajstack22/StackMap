/**
 * RSD-Safe Messages Module
 * Provides encouraging, non-blaming messages for all error states
 * Designed for users with Rejection Sensitive Dysphoria
 */

(function(exports) {
    'use strict';
    
    const RSDSafeMessages = {
        // Message categories with encouraging, supportive language
        // Never use: "failed", "error", "wrong", "invalid", "incorrect"
        // Always: suggest alternatives, be encouraging, normalize struggle
        
        voice: {
            notSupported: "Voice commands aren't available in this browser. You can type tasks instead!",
            timeout: "I stopped listening to save battery. Tap the microphone to start again.",
            startFailed: "I couldn't start listening. Let's try again in a moment.",
            notHeard: "I didn't catch that. Try speaking a bit louder or tap to type instead.",
            partial: "I heard part of that. You can say it again or I can help with what I heard.",
            noMatch: "I'm still learning that command. Try 'add', 'done', or 'show' to start.",
            lowConfidence: "I think I heard '{transcript}' - is that right?",
            noSpeech: "I didn't hear anything. Take your time and try again when ready.",
            noPermission: "I need microphone access to hear you. You can also type tasks instead.",
            networkError: "Voice commands work best with internet. You can still type tasks!",
            recognitionError: "Something went wrong. Let's try again!",
            permissionDenied: "No problem! You can type tasks instead of using voice."
        },
        
        gestures: {
            notRecognized: "That gesture is new to me. Try a simple swipe up, down, left, or right.",
            tooFast: "That was quick! A slower swipe works better.",
            tooSmall: "A bigger swipe will work better. You're doing great!",
            interrupted: "No problem, try again when you're ready.",
            multiTouch: "Try using just one finger for gestures.",
            wrongDirection: "Try swiping {direction} instead.",
            almostThere: "Almost! Try making the movement a bit {adjustment}."
        },
        
        pressure: {
            tooLight: "A bit more pressure will do it. You've got this!",
            tooQuick: "Hold it just a moment longer.",
            notSupported: "Press and hold works just like a regular tap here.",
            tooHeavy: "A lighter touch works here.",
            variablePressure: "Try to keep steady pressure.",
            released: "Keep holding for another moment."
        },
        
        switch: {
            tooEarly: "Wait for the highlight to reach your target.",
            tooLate: "The highlight moved past. It'll come around again!",
            missedTarget: "No worries, here comes another chance.",
            adjustingSpeed: "I'm adjusting the speed to match you better.",
            switchNotDetected: "Make sure your switch is connected.",
            multipleActivations: "One press at a time works best."
        },
        
        general: {
            tryAgain: "Let's try that again. You're doing fine!",
            alternative: "Here's another way to do that:",
            success: "Perfect! That worked great.",
            almostSuccess: "So close! One more try should do it.",
            learningYourStyle: "I'm learning how you like to do things.",
            takingBreak: "Take a break anytime. I'll be here when you're ready.",
            encouragement: [
                "You're getting the hang of it!",
                "That's exactly right!",
                "Nice work!",
                "You've got this!",
                "Great job!",
                "Keep going, you're doing well!",
                "That's the way!",
                "You're making progress!"
            ]
        },
        
        suggestions: {
            voiceCommands: [
                "Try saying: 'Add buy groceries'",
                "You can say: 'Show today's tasks'",
                "Try: 'Mark email done'",
                "Say: 'What's next?'"
            ],
            gestures: [
                "Swipe down to add a task",
                "Swipe left to see more options",
                "Tap and hold for details",
                "Swipe right to go back"
            ],
            alternatives: {
                voice: "You can also tap buttons or use gestures instead of voice.",
                gesture: "You can also use voice commands or tap buttons.",
                pressure: "A regular tap works just as well here.",
                switch: "You can also use touch or voice commands."
            }
        },
        
        // Helper functions
        
        // Format message with placeholders
        format: function(message, data) {
            if (!data) return message;
            
            return message.replace(/{(\w+)}/g, function(match, key) {
                return data[key] || match;
            });
        },
        
        // Add random encouragement to messages
        addEncouragement: function(message, probability = 0.3) {
            if (Math.random() < probability) {
                const encouragement = this.general.encouragement[
                    Math.floor(Math.random() * this.general.encouragement.length)
                ];
                return `${message} ${encouragement}`;
            }
            return message;
        },
        
        // Get a suggestion for the current context
        getSuggestion: function(context, method) {
            const suggestions = this.suggestions[method];
            if (!suggestions) return null;
            
            if (Array.isArray(suggestions)) {
                return suggestions[Math.floor(Math.random() * suggestions.length)];
            }
            
            return suggestions[context] || null;
        },
        
        // Get alternative input method suggestion
        getAlternative: function(failedMethod) {
            return this.suggestions.alternatives[failedMethod] || 
                   "Try a different input method.";
        },
        
        // Build a complete error response
        buildResponse: function(category, type, data, options = {}) {
            const messages = this[category];
            if (!messages || !messages[type]) {
                return "Let's try something else.";
            }
            
            let message = this.format(messages[type], data);
            
            // Add encouragement
            if (options.encourage !== false) {
                message = this.addEncouragement(message, options.encourageProbability);
            }
            
            // Add suggestion
            if (options.suggest) {
                const suggestion = this.getSuggestion(type, category);
                if (suggestion) {
                    message += ` ${suggestion}`;
                }
            }
            
            // Add alternative
            if (options.alternative) {
                const alternative = this.getAlternative(category);
                message += ` ${alternative}`;
            }
            
            return message;
        },
        
        // Quick access methods for common scenarios
        
        voiceError: function(type, data) {
            return this.buildResponse('voice', type, data, {
                suggest: true,
                alternative: true
            });
        },
        
        gestureError: function(type, data) {
            return this.buildResponse('gestures', type, data, {
                encourage: true,
                suggest: true
            });
        },
        
        pressureError: function(type, data) {
            return this.buildResponse('pressure', type, data, {
                encourage: true
            });
        },
        
        switchError: function(type, data) {
            return this.buildResponse('switch', type, data, {
                encourage: true
            });
        },
        
        // Positive reinforcement
        
        celebrate: function(achievement) {
            const celebrations = {
                firstVoiceCommand: "Excellent! You just used your first voice command!",
                fastCompletion: "Wow, that was quick! You're getting faster!",
                accurateGesture: "Perfect gesture! You nailed it!",
                switchMastery: "You've really got the hang of switch control!",
                dailyGoal: "You've completed your daily goal! Well done!",
                weekStreak: "A whole week of progress! You're amazing!"
            };
            
            return celebrations[achievement] || 
                   this.general.encouragement[
                       Math.floor(Math.random() * this.general.encouragement.length)
                   ];
        }
    };
    
    // Convenience class for managing messages in UI
    class RSDMessageHandler {
        constructor(container) {
            this.container = container || document.body;
            this.currentMessage = null;
            this.messageQueue = [];
            this.isShowing = false;
        }
        
        show(category, type, data, options) {
            const message = RSDSafeMessages.buildResponse(category, type, data, options);
            this.displayMessage(message, options);
        }
        
        showCustom(message, options = {}) {
            this.displayMessage(message, options);
        }
        
        displayMessage(message, options = {}) {
            // Add to queue if already showing
            if (this.isShowing && !options.immediate) {
                this.messageQueue.push({ message, options });
                return;
            }
            
            this.isShowing = true;
            
            // Create or update message element
            if (!this.currentMessage) {
                this.currentMessage = document.createElement('div');
                this.currentMessage.className = 'rsd-message';
                this.container.appendChild(this.currentMessage);
            }
            
            // Set message
            this.currentMessage.textContent = message;
            this.currentMessage.className = `rsd-message ${options.type || 'info'}`;
            
            // Add icon if specified
            if (options.icon) {
                const icon = document.createElement('span');
                icon.className = 'rsd-message-icon';
                icon.textContent = options.icon;
                this.currentMessage.prepend(icon);
            }
            
            // Show message
            this.currentMessage.style.display = 'block';
            this.currentMessage.setAttribute('role', 'status');
            this.currentMessage.setAttribute('aria-live', 'polite');
            
            // Auto-hide
            const duration = options.duration || 3000;
            setTimeout(() => {
                this.hide();
            }, duration);
        }
        
        hide() {
            if (this.currentMessage) {
                this.currentMessage.style.display = 'none';
            }
            
            this.isShowing = false;
            
            // Show next in queue
            if (this.messageQueue.length > 0) {
                const next = this.messageQueue.shift();
                setTimeout(() => {
                    this.displayMessage(next.message, next.options);
                }, 200);
            }
        }
        
        celebrate(achievement) {
            const message = RSDSafeMessages.celebrate(achievement);
            this.displayMessage(message, {
                type: 'success',
                icon: '🎉',
                duration: 4000
            });
        }
    }
    
    // Export
    exports.RSDSafeMessages = RSDSafeMessages;
    exports.RSDMessageHandler = RSDMessageHandler;
    
})(window);