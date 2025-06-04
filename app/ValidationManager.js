// app/ValidationManager.js - Grown-up mode validation logic
// === VALIDATION MANAGER ===
class ValidationManager {
    constructor(app) {
        console.log('ValidationManager: constructor called', app);
        this.app = app;
        
        // Simple questions appropriate for parents/caregivers but not young children
        this.validationQuestions = [
            { question: "What's the first letter of the alphabet?", answer: "A", acceptLowercase: true },
            { question: "What comes after 2?", answer: "3", acceptLowercase: true },
            { question: "How many days are in a week?", answer: "7", acceptLowercase: true },
            { question: "What color do you get when you mix red and blue?", answer: "PURPLE", acceptLowercase: true },
            { question: "What's 5 + 5?", answer: "10", acceptLowercase: true },
            { question: "What's the opposite of 'hot'?", answer: "COLD", acceptLowercase: true },
            { question: "What is 3 × 4?", answer: "12", acceptLowercase: true },
            { question: "How many months in a year?", answer: "12", acceptLowercase: true }
        ];
        
        this.currentQuestion = null;
        console.log('ValidationManager: initialized with', this.validationQuestions.length, 'questions');
    }

    showValidation() {
        console.log('ValidationManager: showValidation called');
        const modal = document.getElementById('validationModal');
        const questionElement = document.getElementById('validationQuestion');
        const answerInput = document.getElementById('validationAnswer');
        
        // Pick a random question
        const randomIndex = Math.floor(Math.random() * this.validationQuestions.length);
        this.currentQuestion = this.validationQuestions[randomIndex];
        console.log('Selected question:', this.currentQuestion);
        
        // Set up the modal
        questionElement.textContent = this.currentQuestion.question;
        answerInput.value = '';
        answerInput.type = 'text'; // Always use text for these simple questions
        answerInput.placeholder = 'Type your answer';
        
        // Show the modal
        modal.classList.remove('hidden');
        console.log('Modal shown, classes:', modal.className);
        
        // Focus on input after a brief delay to ensure modal is visible
        setTimeout(() => {
            answerInput.focus();
        }, 100);
        
        // Remove any existing event listeners to prevent duplicates
        answerInput.onkeydown = null;
        
        // Set up keyboard handler
        answerInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Check for space + enter developer shortcut
                if (answerInput.value.trim() === '') {
                    console.log('Space+Enter shortcut detected');
                    this.app.enterGrownupMode();
                    this.cancelValidation();
                    return;
                }
                this.checkValidation();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelValidation();
            }
        };
    }

    checkValidation() {
        console.log('ValidationManager: checkValidation called');
        const answerInput = document.getElementById('validationAnswer');
        const userAnswer = answerInput.value.trim();
        console.log('User answer:', userAnswer);
        console.log('Expected answer:', this.currentQuestion.answer);
        
        // Check for space shortcut
        if (userAnswer === '') {
            console.log('Space shortcut detected');
            this.app.enterGrownupMode();
            this.cancelValidation();
            return;
        }
        
        // Check if answer is correct (case-insensitive)
        const isCorrect = userAnswer.toUpperCase() === this.currentQuestion.answer.toString().toUpperCase();
        console.log('Is correct?', isCorrect);
        
        if (isCorrect) {
            console.log('Correct answer! Entering grown-up mode...');
            // Enter grown-up mode
            this.app.enterGrownupMode();
            // Close the modal
            this.cancelValidation();
        } else {
            console.log('Wrong answer, clearing input');
            // Wrong answer - clear input and refocus
            answerInput.value = '';
            answerInput.focus();
            
            // Optional: Add visual feedback for wrong answer
            answerInput.style.borderColor = '#e74c3c';
            setTimeout(() => {
                answerInput.style.borderColor = '';
            }, 500);
        }
    }

    cancelValidation() {
        console.log('ValidationManager: cancelValidation called');
        const modal = document.getElementById('validationModal');
        const answerInput = document.getElementById('validationAnswer');
        
        // Clear any event listeners
        if (answerInput) {
            answerInput.onkeydown = null;
            answerInput.value = '';
            answerInput.style.borderColor = '';
        }
        
        // Hide the modal
        console.log('Modal classes before:', modal.className);
        modal.classList.add('hidden');
        console.log('Modal classes after:', modal.className);
        
        // Clear current question
        this.currentQuestion = null;
    }
}

// Make it globally available (no ES6 export)
window.ValidationManager = ValidationManager;