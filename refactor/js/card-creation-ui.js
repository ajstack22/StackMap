/**
 * Card Creation UI for StackMap
 * Visual card builder with emoji picker and accessibility
 * Optimized for ADHD/autism users with visual design preferences
 */

class CardCreationUI {
    constructor() {
        this.isOpen = false;
        this.editingCard = null;
        this.selectedEmoji = null;
        this.selectedColor = null;
        this.cardManager = window.VisualCardManager;
        
        // Popular emojis for quick selection
        this.popularEmojis = [
            // Daily activities
            '💊', '🪥', '🚿', '🧘', '💧', '🍽️', '🛏️', '👕',
            // Work & productivity
            '💼', '💻', '📧', '📞', '📝', '📅', '✅', '📊',
            // Health & wellness
            '🏃', '🚶', '💪', '🧠', '❤️', '🩺', '💉', '🏥',
            // Home & chores
            '🏠', '🧹', '🧺', '🍳', '🛒', '🌱', '🔧', '🗑️',
            // Social & communication
            '👥', '💬', '📱', '🎮', '🎬', '📚', '🎨', '🎵',
            // Transport & movement
            '🚗', '🚌', '🚶', '✈️', '🚲', '🛴', '🚕', '🚢',
            // Money & finance
            '💰', '💳', '🏧', '💵', '📈', '🏦', '🧾', '💸',
            // Special interests
            '🐕', '🐈', '🌟', '🔥', '🌈', '🎯', '🏆', '🎁'
        ];
        
        // Color palette (WCAG AA compliant with white text)
        this.colorPalette = [
            { name: 'Purple', value: '#667eea' },
            { name: 'Blue', value: '#4a90e2' },
            { name: 'Green', value: '#4ade80' },
            { name: 'Orange', value: '#f97316' },
            { name: 'Red', value: '#ef4444' },
            { name: 'Violet', value: '#8b5cf6' },
            { name: 'Teal', value: '#14b8a6' },
            { name: 'Pink', value: '#ec4899' }
        ];
        
        this.init();
    }
    
    /**
     * Initialize the card creation UI
     */
    init() {
        // Create UI elements
        this.createModal();
        this.setupEventListeners();
        
        console.log('[CardCreationUI] Initialized');
    }
    
    /**
     * Create the modal structure
     */
    createModal() {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'card-creation-modal';
        modal.id = 'card-creation-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'card-modal-title');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="card-modal-overlay" data-action="close"></div>
            <div class="card-modal-content">
                <div class="card-modal-header">
                    <h2 id="card-modal-title">Create Activity Card</h2>
                    <button class="card-modal-close" data-action="close" aria-label="Close">
                        <span aria-hidden="true">×</span>
                    </button>
                </div>
                
                <div class="card-modal-body">
                    <!-- Card Preview -->
                    <div class="card-preview-section">
                        <h3>Preview</h3>
                        <div class="card-preview-container">
                            <div class="card-preview" id="card-preview">
                                <div class="card-preview-emoji" id="preview-emoji">📌</div>
                                <div class="card-preview-title" id="preview-title">Activity</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Emoji Selection -->
                    <div class="card-form-section">
                        <label for="card-emoji-input">
                            <h3>Choose Emoji *</h3>
                            <p class="form-help">Pick an emoji that represents this activity</p>
                        </label>
                        <div class="emoji-picker-container">
                            <input type="text" 
                                   id="card-emoji-input" 
                                   class="card-emoji-input" 
                                   placeholder="🔍 Search or click below"
                                   maxlength="10"
                                   aria-describedby="emoji-help">
                            <div class="emoji-grid" id="emoji-grid" role="grid" aria-label="Popular emojis">
                                <!-- Populated by JS -->
                            </div>
                        </div>
                        <span id="emoji-help" class="sr-only">Type an emoji or select from the grid below</span>
                    </div>
                    
                    <!-- Title Input -->
                    <div class="card-form-section">
                        <label for="card-title-input">
                            <h3>Short Title (Optional)</h3>
                            <p class="form-help">13 characters max - keep it simple!</p>
                        </label>
                        <input type="text" 
                               id="card-title-input" 
                               class="card-title-input" 
                               placeholder="e.g., Medicine"
                               maxlength="13"
                               aria-describedby="title-help">
                        <span class="char-counter" id="title-counter">0/13</span>
                        <span id="title-help" class="sr-only">Optional short title, maximum 13 characters</span>
                    </div>
                    
                    <!-- Color Selection -->
                    <div class="card-form-section">
                        <h3>Background Color</h3>
                        <div class="color-grid" id="color-grid" role="radiogroup" aria-label="Choose background color">
                            <!-- Populated by JS -->
                        </div>
                    </div>
                    
                    <!-- Card Type -->
                    <div class="card-form-section">
                        <h3>Card Type</h3>
                        <div class="card-type-options" role="radiogroup" aria-label="Choose card type">
                            <label class="card-type-option">
                                <input type="radio" name="card-type" value="single" checked>
                                <div class="type-content">
                                    <span class="type-icon">1️⃣</span>
                                    <span class="type-name">Single Use</span>
                                    <span class="type-desc">Complete once and done</span>
                                </div>
                            </label>
                            <label class="card-type-option">
                                <input type="radio" name="card-type" value="recurring">
                                <div class="type-content">
                                    <span class="type-icon">🔄</span>
                                    <span class="type-name">Daily</span>
                                    <span class="type-desc">Resets every day</span>
                                </div>
                            </label>
                            <label class="card-type-option">
                                <input type="radio" name="card-type" value="frequent">
                                <div class="type-content">
                                    <span class="type-icon">♾️</span>
                                    <span class="type-name">Frequent</span>
                                    <span class="type-desc">Always available</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="card-modal-footer">
                    <button class="btn-secondary" data-action="cancel">Cancel</button>
                    <button class="btn-primary" id="save-card-btn" data-action="save">
                        <span id="save-btn-text">Create Card</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
        
        // Populate emoji grid
        this.populateEmojiGrid();
        
        // Populate color grid
        this.populateColorGrid();
    }
    
    /**
     * Populate emoji grid with popular emojis
     */
    populateEmojiGrid() {
        const grid = document.getElementById('emoji-grid');
        
        this.popularEmojis.forEach((emoji, index) => {
            const button = document.createElement('button');
            button.className = 'emoji-option';
            button.textContent = emoji;
            button.setAttribute('role', 'gridcell');
            button.setAttribute('aria-label', `Select ${emoji}`);
            button.setAttribute('tabindex', index === 0 ? '0' : '-1');
            button.dataset.emoji = emoji;
            
            grid.appendChild(button);
        });
    }
    
    /**
     * Populate color selection grid
     */
    populateColorGrid() {
        const grid = document.getElementById('color-grid');
        
        this.colorPalette.forEach((color, index) => {
            const label = document.createElement('label');
            label.className = 'color-option';
            label.style.backgroundColor = color.value;
            label.setAttribute('role', 'radio');
            label.setAttribute('aria-label', color.name);
            label.setAttribute('tabindex', index === 0 ? '0' : '-1');
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'card-color';
            input.value = color.value;
            if (index === 0) input.checked = true;
            
            const checkmark = document.createElement('span');
            checkmark.className = 'color-checkmark';
            checkmark.innerHTML = '✓';
            checkmark.setAttribute('aria-hidden', 'true');
            
            label.appendChild(input);
            label.appendChild(checkmark);
            grid.appendChild(label);
        });
        
        // Set initial color
        this.selectedColor = this.colorPalette[0].value;
        this.updatePreview();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Modal close buttons
        this.modal.querySelectorAll('[data-action="close"], [data-action="cancel"]').forEach(btn => {
            btn.addEventListener('click', () => this.close());
        });
        
        // Save button
        const saveBtn = this.modal.querySelector('[data-action="save"]');
        saveBtn.addEventListener('click', () => this.saveCard());
        
        // Emoji selection
        const emojiGrid = document.getElementById('emoji-grid');
        emojiGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('emoji-option')) {
                this.selectEmoji(e.target.dataset.emoji);
            }
        });
        
        // Emoji input
        const emojiInput = document.getElementById('card-emoji-input');
        emojiInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (value) {
                this.selectEmoji(value);
            }
        });
        
        // Title input
        const titleInput = document.getElementById('card-title-input');
        titleInput.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('title-counter').textContent = `${value.length}/13`;
            this.updatePreview();
        });
        
        // Color selection
        const colorGrid = document.getElementById('color-grid');
        colorGrid.addEventListener('change', (e) => {
            if (e.target.name === 'card-color') {
                this.selectedColor = e.target.value;
                this.updatePreview();
            }
        });
        
        // Card type selection
        const typeRadios = this.modal.querySelectorAll('input[name="card-type"]');
        typeRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updatePreview());
        });
        
        // Keyboard navigation for grids
        this.setupGridKeyboardNav(emojiGrid);
        this.setupGridKeyboardNav(colorGrid);
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    /**
     * Set up keyboard navigation for grids
     */
    setupGridKeyboardNav(grid) {
        grid.addEventListener('keydown', (e) => {
            const items = Array.from(grid.querySelectorAll('[tabindex]'));
            const currentIndex = items.findIndex(item => item === document.activeElement);
            
            let newIndex = currentIndex;
            
            switch (e.key) {
                case 'ArrowRight':
                    newIndex = Math.min(currentIndex + 1, items.length - 1);
                    break;
                case 'ArrowLeft':
                    newIndex = Math.max(currentIndex - 1, 0);
                    break;
                case 'ArrowDown':
                    newIndex = Math.min(currentIndex + 8, items.length - 1); // Assuming 8 columns
                    break;
                case 'ArrowUp':
                    newIndex = Math.max(currentIndex - 8, 0);
                    break;
                case 'Home':
                    newIndex = 0;
                    break;
                case 'End':
                    newIndex = items.length - 1;
                    break;
                case 'Enter':
                case ' ':
                    if (items[currentIndex].classList.contains('emoji-option')) {
                        this.selectEmoji(items[currentIndex].dataset.emoji);
                    } else if (items[currentIndex].classList.contains('color-option')) {
                        items[currentIndex].querySelector('input').click();
                    }
                    e.preventDefault();
                    return;
                default:
                    return;
            }
            
            if (newIndex !== currentIndex) {
                items[currentIndex].setAttribute('tabindex', '-1');
                items[newIndex].setAttribute('tabindex', '0');
                items[newIndex].focus();
                e.preventDefault();
            }
        });
    }
    
    /**
     * Select an emoji
     */
    selectEmoji(emoji) {
        this.selectedEmoji = emoji;
        
        // Update input
        document.getElementById('card-emoji-input').value = emoji;
        
        // Update preview
        this.updatePreview();
        
        // Update grid selection
        document.querySelectorAll('.emoji-option').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.emoji === emoji);
        });
    }
    
    /**
     * Update the card preview
     */
    updatePreview() {
        const preview = document.getElementById('card-preview');
        const previewEmoji = document.getElementById('preview-emoji');
        const previewTitle = document.getElementById('preview-title');
        
        // Update emoji
        previewEmoji.textContent = this.selectedEmoji || '📌';
        
        // Update title
        const titleValue = document.getElementById('card-title-input').value;
        previewTitle.textContent = titleValue || 'Activity';
        
        // Update color
        preview.style.backgroundColor = this.selectedColor || this.colorPalette[0].value;
        
        // Update type indicator
        const selectedType = document.querySelector('input[name="card-type"]:checked').value;
        preview.className = `card-preview card-type-${selectedType}`;
    }
    
    /**
     * Open the modal
     */
    open(cardData = null) {
        this.editingCard = cardData;
        this.isOpen = true;
        
        // Reset form
        this.resetForm();
        
        // If editing, populate form
        if (cardData) {
            document.getElementById('card-modal-title').textContent = 'Edit Activity Card';
            document.getElementById('save-btn-text').textContent = 'Save Changes';
            
            // Populate fields
            this.selectEmoji(cardData.emoji);
            document.getElementById('card-title-input').value = cardData.title || '';
            document.getElementById('title-counter').textContent = `${(cardData.title || '').length}/13`;
            
            // Select color
            const colorRadio = document.querySelector(`input[value="${cardData.color}"]`);
            if (colorRadio) {
                colorRadio.checked = true;
                this.selectedColor = cardData.color;
            }
            
            // Select type
            const typeRadio = document.querySelector(`input[value="${cardData.type}"]`);
            if (typeRadio) {
                typeRadio.checked = true;
            }
        } else {
            document.getElementById('card-modal-title').textContent = 'Create Activity Card';
            document.getElementById('save-btn-text').textContent = 'Create Card';
        }
        
        // Update preview
        this.updatePreview();
        
        // Show modal
        this.modal.classList.add('open');
        this.modal.setAttribute('aria-hidden', 'false');
        
        // Focus first input
        setTimeout(() => {
            document.getElementById('card-emoji-input').focus();
        }, 100);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Close the modal
     */
    close() {
        this.isOpen = false;
        this.editingCard = null;
        
        // Hide modal
        this.modal.classList.remove('open');
        this.modal.setAttribute('aria-hidden', 'true');
        
        // Re-enable body scroll
        document.body.style.overflow = '';
        
        // Reset form
        this.resetForm();
    }
    
    /**
     * Reset the form
     */
    resetForm() {
        this.selectedEmoji = null;
        this.selectedColor = this.colorPalette[0].value;
        
        document.getElementById('card-emoji-input').value = '';
        document.getElementById('card-title-input').value = '';
        document.getElementById('title-counter').textContent = '0/13';
        
        // Reset radio buttons
        document.querySelector('input[name="card-type"][value="single"]').checked = true;
        document.querySelector('input[name="card-color"]').checked = true;
        
        // Clear emoji selection
        document.querySelectorAll('.emoji-option').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
    
    /**
     * Save the card
     */
    saveCard() {
        // Validate emoji
        if (!this.selectedEmoji) {
            alert('Please select an emoji for your card');
            document.getElementById('card-emoji-input').focus();
            return;
        }
        
        // Get form values
        const title = document.getElementById('card-title-input').value.trim();
        const type = document.querySelector('input[name="card-type"]:checked').value;
        
        // Create card data
        const cardData = {
            emoji: this.selectedEmoji,
            title: title,
            color: this.selectedColor,
            type: type
        };
        
        // If editing, preserve ID
        if (this.editingCard) {
            cardData.id = this.editingCard.id;
        }
        
        // Save via card manager
        if (this.cardManager) {
            if (this.editingCard) {
                this.cardManager.updateCard(this.editingCard.id, cardData);
            } else {
                this.cardManager.createCard(cardData);
            }
        }
        
        // Close modal
        this.close();
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('card-saved', { 
            detail: { 
                card: cardData, 
                isEdit: !!this.editingCard 
            } 
        }));
    }
    
    /**
     * Show emoji picker (native if available)
     */
    async showNativeEmojiPicker() {
        // Check if native emoji picker is available (future browsers)
        if ('showEmojiPicker' in navigator) {
            try {
                const emoji = await navigator.showEmojiPicker();
                this.selectEmoji(emoji);
            } catch (err) {
                // User cancelled or error
                console.log('Emoji picker cancelled or not supported');
            }
        }
    }
}

// Export as singleton
window.CardCreationUI = new CardCreationUI();