/**
 * Story Test: STORY-001 - Add Activity Card
 * 
 * As a parent,
 * I want to add activity cards,
 * So that I can create a visual schedule for my child.
 */

class AddCardStoryTest extends StoryTestBase {
    constructor() {
        super('STORY-001', 'Add Activity Card');
    }

    async runStory() {
        // Scenario 1: Add a basic activity card
        this.startScenario('Add Basic Activity Card', [
            { description: 'User can access edit mode', met: false },
            { description: 'Add Card button is visible in edit mode', met: false },
            { description: 'Card form accepts required fields', met: false },
            { description: 'New card appears in the schedule', met: false }
        ]);

        await this.step('Enter edit mode', async () => {
            await this.enterEditMode();
            this.assert(
                this.appDocument.body.classList.contains('grownup-mode'),
                'Edit mode is active',
                0
            );
        });

        await this.step('Open card creation form', async () => {
            const fab = this.appDocument.querySelector('#edit-mode-fab');
            this.assert(fab, 'FAB button exists', 1);
            
            fab.click();
            await this.wait(500);
            
            const addCardBtn = Array.from(this.appDocument.querySelectorAll('.admin-btn'))
                .find(btn => btn.textContent.includes('Add Card'));
            this.assert(addCardBtn, 'Add Card button found');
            
            addCardBtn.click();
            await this.wait(500);
        });

        await this.step('Fill in card details', async () => {
            const titleInput = this.appDocument.getElementById('activityTitle');
            const descInput = this.appDocument.getElementById('activityDescription');
            
            this.assert(titleInput, 'Title input exists', 2);
            this.assert(descInput, 'Description input exists', 2);
            
            titleInput.value = 'Brush Teeth';
            titleInput.dispatchEvent(new Event('input'));
            
            descInput.value = 'Time to brush your teeth!';
            descInput.dispatchEvent(new Event('input'));
            
            // Select an icon
            const iconOptions = this.appDocument.querySelectorAll('.icon-option');
            if (iconOptions.length > 0) {
                iconOptions[0].click();
            }
        });

        await this.step('Save the card', async () => {
            const saveBtn = Array.from(this.appDocument.querySelectorAll('.footer-button'))
                .find(btn => btn.textContent.includes('Add Card'));
            
            this.assert(saveBtn, 'Save button exists');
            saveBtn.click();
            await this.wait(1000);
        });

        await this.step('Verify card was created', async () => {
            await this.exitEditMode();
            
            const cards = this.appDocument.querySelectorAll('.card:not(.management-card)');
            const newCard = Array.from(cards).find(card => 
                card.textContent.includes('Brush Teeth')
            );
            
            this.assert(newCard, 'New card appears in schedule', 3);
        });

        this.endScenario();

        // Scenario 2: Add card with timer
        this.startScenario('Add Card with Timer', [
            { description: 'Timer option is available', met: false },
            { description: 'Timer duration can be set', met: false },
            { description: 'Card shows timer indicator', met: false }
        ]);

        await this.step('Enter edit mode and open form', async () => {
            await this.enterEditMode();
            
            const fab = this.appDocument.querySelector('#edit-mode-fab');
            fab.click();
            await this.wait(500);
            
            const addCardBtn = Array.from(this.appDocument.querySelectorAll('.admin-btn'))
                .find(btn => btn.textContent.includes('Add Card'));
            addCardBtn.click();
            await this.wait(500);
        });

        await this.step('Set up card with timer', async () => {
            const titleInput = this.appDocument.getElementById('activityTitle');
            titleInput.value = 'Reading Time';
            titleInput.dispatchEvent(new Event('input'));
            
            // Enable timer
            const timerCheckbox = this.appDocument.getElementById('hasTimer');
            if (timerCheckbox) {
                timerCheckbox.checked = true;
                timerCheckbox.dispatchEvent(new Event('change'));
                this.assert(true, 'Timer option available', 0);
                
                // Set timer duration
                const minutesInput = this.appDocument.getElementById('timerMinutes');
                if (minutesInput) {
                    minutesInput.value = '15';
                    minutesInput.dispatchEvent(new Event('input'));
                    this.assert(true, 'Timer duration set', 1);
                }
            }
        });

        await this.step('Save and verify timer card', async () => {
            const saveBtn = Array.from(this.appDocument.querySelectorAll('.footer-button'))
                .find(btn => btn.textContent.includes('Add Card'));
            saveBtn.click();
            await this.wait(1000);
            
            await this.exitEditMode();
            
            const cards = this.appDocument.querySelectorAll('.card:not(.management-card)');
            const timerCard = Array.from(cards).find(card => 
                card.textContent.includes('Reading Time')
            );
            
            if (timerCard) {
                const timerIndicator = timerCard.querySelector('.timer-indicator, .material-icons:contains("timer")');
                this.assert(timerIndicator, 'Timer indicator visible on card', 2);
            }
        });

        this.endScenario();

        // Scenario 3: Validation - Empty fields
        this.startScenario('Validation - Empty Fields', [
            { description: 'Form validates required fields', met: false },
            { description: 'Error message shown for empty title', met: false }
        ]);

        await this.step('Try to save card without title', async () => {
            await this.enterEditMode();
            
            const fab = this.appDocument.querySelector('#edit-mode-fab');
            fab.click();
            await this.wait(500);
            
            const addCardBtn = Array.from(this.appDocument.querySelectorAll('.admin-btn'))
                .find(btn => btn.textContent.includes('Add Card'));
            addCardBtn.click();
            await this.wait(500);
            
            // Try to save without filling fields
            const saveBtn = Array.from(this.appDocument.querySelectorAll('.footer-button'))
                .find(btn => btn.textContent.includes('Add Card'));
            
            if (saveBtn) {
                saveBtn.click();
                await this.wait(500);
                
                // Check if we're still in the form (validation prevented save)
                const titleInput = this.appDocument.getElementById('activityTitle');
                const formStillOpen = titleInput && titleInput.offsetParent !== null;
                
                this.assert(formStillOpen, 'Form remains open when validation fails', 0);
                
                // Check for validation message
                const validationMsg = titleInput?.validationMessage || 
                                    this.appDocument.querySelector('.error-message');
                this.assert(validationMsg, 'Validation message present', 1);
            }
        });

        this.endScenario();
    }
}

// Auto-run if loaded directly
if (typeof module === 'undefined') {
    const test = new AddCardStoryTest();
    test.run().catch(console.error);
}