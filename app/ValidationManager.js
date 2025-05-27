// app/ValidationManager.js - Grown-up mode validation logic
// === VALIDATION MANAGER ===
export class ValidationManager {
    constructor(app) {
        this.app = app;
        
        // VALIDATION QUESTIONS
        // TEMPORARY DEVELOPMENT QUESTION
        this.validationQuestions = [
            { question: "What's the first letter of the alphabet?", answer: "A", acceptLowercase: true }
        ];
        
        /* PRODUCTION QUESTIONS - TO BE RE-ENABLED LATER
        this.validationQuestions = [
            { question: "What is 8 × 7?", answer: 56 },
            { question: "What year is it?", answer: new Date().getFullYear() },
            { question: "How many days are in a year?", answer: 365 },
            { question: "What is 15 + 27?", answer: 42 },
            { question: "How many hours are in a day?", answer: 24 },
            { question: "What is 12 × 3?", answer: 36 },
            { question: "What is 100 - 37?", answer: 63 }
        ];
        */
        
        this.currentQuestion = null;
    }

    showValidation() {
        const modal = document.getElementById('validationModal');
        const questionElement = document.getElementById('validationQuestion');
        const answerInput = document.getElementById('validationAnswer');
        
        this.currentQuestion = this.validationQuestions[
            Math.floor(Math.random() * this.validationQuestions.length)
        ];
        
        questionElement.textContent = this.currentQuestion.question;
        answerInput.value = '';
        
        // Change input type based on question type
        if (this.currentQuestion.acceptLowercase) {
            answerInput.type = 'text';
            answerInput.placeholder = 'Type your answer';
        } else {
            answerInput.type = 'number';
            answerInput.placeholder = 'Enter your answer';
        }
        
        modal.classList.remove('hidden');
        answerInput.focus();
        
        answerInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                this.checkValidation();
            }
        };
    }

    checkValidation() {
        const answerInput = document.getElementById('validationAnswer');
        const userAnswer = answerInput.value.trim();
        
        let isCorrect = false;
        
        if (this.currentQuestion.acceptLowercase) {
            // For string answers, check both uppercase and lowercase
            isCorrect = userAnswer.toUpperCase() === this.currentQuestion.answer.toUpperCase();
        } else {
            // For numeric answers
            isCorrect = parseInt(userAnswer) === this.currentQuestion.answer;
        }
        
        if (isCorrect) {
            this.app.enterGrownupMode();
        }
        
        this.cancelValidation();
    }

    cancelValidation() {
        const modal = document.getElementById('validationModal');
        modal.classList.add('hidden');
    }
}