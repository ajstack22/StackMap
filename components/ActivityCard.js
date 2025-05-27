// components/ActivityCard.js - All activity card rendering and interaction logic
// === ACTIVITY CARD COMPONENT ===
import { ComponentBuilder } from './ComponentBuilder.js';
import { EmojiPicker } from './EmojiPicker.js';

export class ActivityCard {
    constructor(activity, index, appState, renderer, app) {
        this.activity = activity;
        this.index = index;
        this.appState = appState;
        this.renderer = renderer;
        this.app = app;
    }

    render() {
        const { editMode, editingCardIndex } = this.appState.ui;
        const { backgroundColor, showNumbers } = this.appState.settings;
        const isEditing = editingCardIndex === this.index;
        
        const card = ComponentBuilder.createElement('div', 
            `card ${!this.activity.visible ? 'card--hidden' : ''}`, 
            { 'data-index': this.index }
        );

        if (!editMode) {
            card.onclick = (e) => this.handleClick(e);
        }

        this.setupDragAndDrop(card);

        if (isEditing) {
            card.innerHTML = this.renderEditMode(backgroundColor);
            
            // Insert emoji picker directly
            const slot = card.querySelector('.emoji-picker-slot');
            if (slot) {
                const picker = EmojiPicker.createEmojiPicker(
                    this.activity.icon,
                    (emoji) => {
                        this.activity.icon = emoji;
                        const iconElement = document.getElementById(`editIcon${this.index}`);
                        if (iconElement) iconElement.textContent = emoji;
                    },
                    `cardEmoji${this.index}`
                );
                slot.replaceWith(picker);
            }
        } else {
            card.innerHTML = this.renderViewMode(backgroundColor, showNumbers);
            
            // Add direct emoji editing in edit mode
            if (editMode) {
                const iconElement = card.querySelector('.card__icon');
                if (iconElement) {
                    iconElement.classList.add('card__icon--editable');
                    iconElement.title = 'Click to change emoji';
                    iconElement.style.cursor = 'pointer';
                    
                    iconElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.promptEmojiChange();
                    });
                }
            }
        }

        return card;
    }
    
    promptEmojiChange() {
        const newEmoji = prompt('Enter a new emoji:', this.activity.icon);
        if (newEmoji && newEmoji.trim()) {
            // Extract first emoji from input
            const emojiMatch = newEmoji.match(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
            if (emojiMatch) {
                this.activity.icon = emojiMatch[0];
                this.appState._triggerSave();
                this.renderer.render();
            } else {
                alert('Please enter a valid emoji');
            }
        }
    }

    renderViewMode(backgroundColor, showNumbers) {
        const { editMode } = this.appState.ui;
        const displayIndex = this.getDisplayIndex();
        
        return `
            ${!editMode && showNumbers ? `<div class="card__number" style="background: ${backgroundColor};">${displayIndex + 1}</div>` : ''}
            ${editMode ? this.renderEditButtons() : ''}
            <div class="card__icon">${this.activity.icon}</div>
            <div class="card__title">${this.activity.title}</div>
            <div class="card__description">${this.activity.description}</div>
        `;
    }

    renderEditMode(backgroundColor) {
        return `
            ${this.renderEditButtons()}
            <div class="card__icon" id="editIcon${this.index}">${this.activity.icon}</div>
            <div class="emoji-picker-slot"></div>
            <input type="text" class="form-field form-field--title" 
                   value="${this.activity.title}" id="editTitle${this.index}" maxlength="${CONFIG.MAX_TITLE_LENGTH}">
            <input type="text" class="form-field form-field--description" 
                   value="${this.activity.description}" id="editDescription${this.index}" maxlength="${CONFIG.MAX_DESCRIPTION_LENGTH}">
            <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: center;">
                <button class="btn btn--primary" onclick="appInstance.saveCardEdit(${this.index})">Save</button>
                <button class="btn btn--secondary" onclick="appInstance.cancelCardEdit()">Cancel</button>
            </div>
        `;
    }

    renderEditButtons() {
        const isEditing = this.appState.ui.editingCardIndex === this.index;
        
        // If this card is being edited, show cancel button instead of edit
        const editButton = isEditing 
            ? `<button class="btn btn--round btn--edit" onclick="appInstance.cancelCardEdit()" aria-label="Cancel edit" title="Cancel edit">
                <span class="material-icons">close</span>
              </button>`
            : `<button class="btn btn--round btn--edit" onclick="appInstance.startCardEdit(${this.index})" aria-label="Edit card" title="Edit card">
                <span class="material-icons">edit</span>
              </button>`;
        
        return `
            ${editButton}
            <button class="btn btn--round btn--visibility ${!this.activity.visible ? 'btn--visibility--hidden' : ''}" 
                    onclick="appInstance.toggleVisibility(${this.index})" aria-label="Toggle visibility" title="${this.activity.visible ? 'Hide from routine' : 'Show in routine'}">
                <span class="material-icons">${this.activity.visible ? 'visibility' : 'visibility_off'}</span>
            </button>
            <button class="btn btn--round btn--duplicate" onclick="appInstance.duplicateActivity(${this.index})" aria-label="Duplicate card" title="Make a copy">
                <span class="material-icons">content_copy</span>
            </button>
            <button class="btn btn--round btn--delete" onclick="appInstance.deleteActivity(${this.index})" aria-label="Delete card" title="Delete card">
                <span class="material-icons">delete</span>
            </button>
        `;
    }

    getDisplayIndex() {
        const visibleActivities = this.appState.activities.filter(a => a.visible);
        return visibleActivities.indexOf(this.activity);
    }

    handleClick(e) {
        if (!e.target.closest('.card').classList.contains('card--dragging')) {
            this.toggleComplete();
        }
    }

    toggleComplete() {
        const card = document.querySelector(`[data-index="${this.index}"]`);
        if (!card) return;

        // Toggle completion in state AND save it
        this.appState.toggleActivityCompletion(this.index);
        
        const wasCompleted = card.classList.contains('card--completed');
        card.classList.toggle('card--completed');

        if (!wasCompleted) {
            // Check if all visible cards are now completed
            const visibleActivities = this.appState.activities.filter(a => a.visible);
            const allCards = document.querySelectorAll('.card:not(.card--hidden)');
            const completedCards = document.querySelectorAll('.card--completed:not(.card--hidden)');
            
            if (completedCards.length === visibleActivities.length && visibleActivities.length > 0) {
                this.renderer.createFireworks();
            } else {
                this.renderer.createConfetti();
            }
        }
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    setupDragAndDrop(card) {
        if (!card) return;
        
        card.draggable = true;
        
        card.addEventListener('dragstart', (e) => {
            if (!this.appState.ui.editMode) {
                e.preventDefault();
                return;
            }
            
            console.log('Drag start:', e.target.dataset.index);
            this.appState.ui.draggedElement = e.target;
            this.draggedIndex = parseInt(e.target.dataset.index);
            
            e.target.classList.add('card--dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', '');
            
            // Add visual feedback to other cards
            setTimeout(() => {
                document.querySelectorAll('.card:not(.card--dragging)').forEach(c => {
                    c.classList.add('card--droppable');
                });
            }, 50);
        });
        
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (!this.appState.ui.draggedElement) return;
            
            const targetCard = e.target.closest('.card');
            if (!targetCard || targetCard.classList.contains('card--dragging')) return;
            
            // Clear previous highlights
            document.querySelectorAll('.card--drop-target').forEach(c => {
                c.classList.remove('card--drop-target');
            });
            
            // Add highlight to current target
            targetCard.classList.add('card--drop-target');
            
            // Live sorting animation
            this.animateLiveSort(targetCard);
        });
        
        card.addEventListener('drop', (e) => {
            e.preventDefault();
            console.log('Drop event');
            
            const draggedElement = this.appState.ui.draggedElement;
            const targetCard = e.target.closest('.card');
            
            if (!draggedElement || !targetCard || draggedElement === targetCard) return;
            
            const draggedIndex = parseInt(draggedElement.dataset.index);
            const targetIndex = parseInt(targetCard.dataset.index);
            
            console.log('Moving from', draggedIndex, 'to', targetIndex);
            
            if (!isNaN(draggedIndex) && !isNaN(targetIndex) && draggedIndex !== targetIndex) {
                this.appState.moveActivity(draggedIndex, targetIndex);
                this.renderer.render();
            }
        });
        
        card.addEventListener('dragend', (e) => {
            console.log('Drag end');
            this.cleanupDragStates();
        });
        
        card.addEventListener('dragleave', (e) => {
            const targetCard = e.target.closest('.card');
            if (targetCard && !targetCard.contains(e.relatedTarget)) {
                targetCard.classList.remove('card--drop-target');
            }
        });
    }
    
    animateLiveSort(targetCard) {
        if (!this.appState.ui.draggedElement || !targetCard) return;
        
        const draggedIndex = this.draggedIndex;
        const targetIndex = parseInt(targetCard.dataset.index);
        
        if (isNaN(draggedIndex) || isNaN(targetIndex)) return;
        
        // Clear previous animations
        document.querySelectorAll('.card:not(.card--dragging)').forEach(card => {
            card.style.transform = '';
            card.style.transition = '';
        });
        
        // Animate cards that need to move to make room
        document.querySelectorAll('.card:not(.card--dragging)').forEach(card => {
            const cardIndex = parseInt(card.dataset.index);
            if (isNaN(cardIndex)) return;
            
            let translateY = 0;
            
            if (draggedIndex < targetIndex) {
                // Dragging down: cards between dragged and target move up
                if (cardIndex > draggedIndex && cardIndex <= targetIndex) {
                    translateY = -140; // Card height + gap
                }
            } else {
                // Dragging up: cards between target and dragged move down
                if (cardIndex >= targetIndex && cardIndex < draggedIndex) {
                    translateY = 140; // Card height + gap
                }
            }
            
            if (translateY !== 0) {
                card.style.transform = `translateY(${translateY}px)`;
                card.style.transition = 'transform 0.25s cubic-bezier(0.2, 0, 0.2, 1)';
                card.classList.add('card--shifting');
            }
        });
    }
    
    cleanupDragStates() {
        // Remove all drag-related classes and styles
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('card--dragging', 'card--drop-target', 'card--droppable', 'card--shifting');
            card.style.transform = '';
            card.style.transition = '';
        });
        
        this.appState.ui.draggedElement = null;
        this.draggedIndex = null;
    }
}