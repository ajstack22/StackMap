// components.js - Component builder and UI components with card type icons integration
// === COMPONENT BUILDER ===
// NO ES6 IMPORTS - This file is loaded via script tag

// The emoji data is loaded from emoji-list.js and emoji-names.js
// They should be available as global constants EMOJIS and EMOJI_NAMES

// Card Type Icons Mapping - Centralized configuration
const CARD_TYPE_ICONS = {
    'recurring': 'refresh',
    'frequent': 'star',
    'single-use': 'event'
};

// Card Type Labels - For accessibility and display
const CARD_TYPE_LABELS = {
    'recurring': 'Recurring',
    'frequent': 'Frequent', 
    'single-use': 'Single Use'
};

class ComponentBuilder {
    static createElement(tag, className, attributes = {}) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        
        // Apply attributes if provided
        Object.keys(attributes).forEach(key => {
            if (key === 'innerHTML') {
                element.innerHTML = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        return element;
    }

    static createCard(activity, index, appState, renderer, app) {
        return new ActivityCard(activity, index, appState, renderer, app).render();
    }

    static createNewCard(appState, position = 'top') {
        const newCard = this.createElement('div', 'new-card', {
            onclick: `appInstance.openNewCardForm('${position}')`
        });
        
        newCard.innerHTML = `
            <div class="new-card__icon">➕</div>
            <div class="new-card__title">Add New Activity</div>
            <div class="new-card__description">Click to create a new card</div>
        `;
        
        return newCard;
    }

    static createEditInfoCard() {
        const card = this.createElement('div', 'card edit-info-card');
        
        card.innerHTML = `
            <div class="card__icon">✏️</div>
            <div class="card__title">Edit Mode Active</div>
            <div class="card__description">
                • Click any card to edit<br>
                • Drag cards to reorder<br>
                • Use buttons for quick actions
            </div>
        `;
        
        return card;
    }
    
    // Story 4: Create Day Selector Component
    // Updated Day Selector Component - NO COUNT TEXT
    static createDaySelector(currentDay = 'today') {
        const selector = this.createElement('div', 'day-selector');
        
        selector.innerHTML = `
            <div class="day-option day-option--today ${currentDay === 'today' ? 'active' : ''}" data-day="today">
                <span class="day-label">Today</span>
            </div>
            <div class="day-option day-option--tomorrow ${currentDay === 'tomorrow' ? 'active' : ''}" data-day="tomorrow">
                <span class="day-label">Tomorrow</span>
            </div>
        `;
        
        // Add click handlers
        selector.querySelectorAll('.day-option').forEach(option => {
            option.addEventListener('click', () => {
                const day = option.getAttribute('data-day');
                if (window.appInstance) {
                    window.appInstance.switchDay(day);
                }
            });
        });
        
        return selector;
    }

    // NEW: Create StackMap Logo Component
    static createStackMapLogo() {
        const logoContainer = this.createElement('div', 'stackmap-logo');
        
        // Create SVG logo that matches theme
        const logoSvg = `
            <svg class="stackmap-logo-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:rgba(255,255,255,0.9);stop-opacity:1" />
                        <stop offset="100%" style="stop-color:rgba(255,255,255,0.6);stop-opacity:1" />
                    </linearGradient>
                </defs>
                
                <!-- Background circle with theme integration -->
                <circle cx="16" cy="16" r="15" 
                        fill="rgba(255,255,255,0.1)" 
                        stroke="rgba(255,255,255,0.2)" 
                        stroke-width="1"/>
                
                <!-- StackMap layers with theme color hints -->
                <rect x="7" y="10" width="18" height="2.5" 
                      fill="url(#logoGradient)" 
                      rx="1.25"/>
                <rect x="7" y="14.5" width="18" height="2.5" 
                      fill="url(#logoGradient)" 
                      rx="1.25"/>
                <rect x="7" y="19" width="18" height="5" 
                      fill="url(#logoGradient)" 
                      rx="2.5"/>
            </svg>
        `;
        
        logoContainer.innerHTML = `
            ${logoSvg}
            <span class="stackmap-logo-text">StackMap</span>
        `;
        
        return logoContainer;
    }

    // NOTE: Management cards replaced by FAB system
    // createManagementCard() method deprecated - Use EditModeFAB component instead
    
    /* DEPRECATED - Kept for reference only
    static createManagementCard(position = 'top') {
        const card = this.createElement('div', `card management-card management-card--${position}`);
        
        card.innerHTML = `
            <div class="management-card__header">
                <div class="management-card__icon">📝</div>
                <div class="management-card__title">Edit Mode</div>
            </div>
            
            <div class="management-card__actions">
                <button class="btn btn--management btn--add-card" 
                        onclick="appInstance.openNewCardForm('${position}')"
                        title="Add new activity card">
                    <span class="material-icons">add</span>
                    <span>Add Card</span>
                </button>
                
                <button class="btn btn--management btn--complete-day" 
                        onclick="appInstance.showCompleteDayConfirmation()"
                        title="Complete day and move to tomorrow">
                    <span class="material-icons">today</span>
                    <span>Complete Day</span>
                </button>
                
                <div class="management-card__filter">
                    <div class="filter-input-group">
                        <span class="material-icons filter-icon">search</span>
                        <input type="text" 
                               class="filter-input" 
                               id="cardFilter${position}" 
                               placeholder="Type to find cards..."
                               maxlength="50">
                        <button class="btn btn--icon btn--clear-filter" 
                                id="clearFilter${position}"
                                style="display: none;"
                                title="Clear filter">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Set up filter functionality
        setTimeout(() => {
            const filterInput = card.querySelector(`#cardFilter${position}`);
            const clearButton = card.querySelector(`#clearFilter${position}`);
            
            if (filterInput && clearButton) {
                filterInput.addEventListener('input', (e) => {
                    const value = e.target.value.trim();
                    appInstance.filterCards(value, position);
                    
                    if (value) {
                        clearButton.style.display = 'flex';
                    } else {
                        clearButton.style.display = 'none';
                    }
                });
                
                clearButton.addEventListener('click', () => {
                    filterInput.value = '';
                    appInstance.filterCards('', position);
                    filterInput.focus();
                });
            }
        }, 0);
        
        return card;
    }
    */

    // Create modal card overlay for new/edit activity with card type support - FIXED BUTTON LAYOUT
    static createModalCard(isNewCard = true, activity = null, index = -1, selectedEmoji = CONFIG.DEFAULT_EMOJI) {
        const overlay = this.createElement('div', 'modal-card-overlay');
        overlay.id = 'modalCardOverlay';
        
        // Close modal when clicking overlay (not the card itself)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModalCard();
            }
        });
        
        // Escape key handler
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeModalCard();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        const modalCard = this.createElement('div', 'modal-card');
        
        const emoji = isNewCard ? selectedEmoji : activity.icon;
        const titleValue = isNewCard ? '' : activity.title;
        const descValue = isNewCard ? '' : activity.description;
        const timeValue = isNewCard ? '' : (activity.time || '');
        const cardType = isNewCard ? 'recurring' : (activity.cardType || 'recurring'); // Story 1
        const titleId = isNewCard ? 'newActivityTitle' : `editTitle${index}`;
        const descId = isNewCard ? 'newActivityDescription' : `editDescription${index}`;
        const timeId = isNewCard ? 'newActivityTime' : `editTime${index}`;
        const iconId = isNewCard ? 'newActivityIcon' : `editIcon${index}`;
        const filterId = isNewCard ? 'newCardEmoji' : `cardEmoji${index}`;
        
        // INTEGRATED: Generate card type buttons using the centralized icons
        const cardTypeButtons = Object.keys(CARD_TYPE_ICONS).map(type => {
            const icon = CARD_TYPE_ICONS[type];
            const label = CARD_TYPE_LABELS[type];
            const selectedClass = cardType === type ? 'btn--card-type--selected' : '';
            
            return `
                <button type="button" class="btn btn--card-type ${selectedClass}" 
                        data-card-type="${type}">
                    <span class="material-icons">${icon}</span>
                    <span>${label}</span>
                </button>
            `;
        }).join('');
        
        modalCard.innerHTML = `
            <div class="modal-card__header">
                <h2 class="modal-card__title">${isNewCard ? 'Add New Activity' : 'Edit Activity'}</h2>
            </div>
            
            <div class="modal-card__icon" id="${iconId}" onclick="document.getElementById('${filterId}').focus()">${emoji}</div>
            
            <div class="modal-emoji-picker-slot" data-filter-id="${filterId}" data-icon-id="${iconId}"></div>
            
            <input type="text" class="modal-form-field modal-form-field--title" id="${titleId}" 
                   placeholder="Activity title..." value="${titleValue}" maxlength="${CONFIG.MAX_TITLE_LENGTH}"
                   autocomplete="off" spellcheck="false">
            
            <input type="text" class="modal-form-field modal-form-field--description" id="${descId}" 
                   placeholder="Description (optional)" value="${descValue}" maxlength="${CONFIG.MAX_DESCRIPTION_LENGTH}"
                   autocomplete="off" spellcheck="false">
            
            <div class="modal-time-field">
                <div class="modal-time-field__label">
                    <span class="material-icons">schedule</span>
                    <span>Time (optional)</span>
                </div>
                <div class="modal-time-field__input-group">
                    <input type="time" class="modal-form-field modal-form-field--time" 
                           id="${timeId}" value="${timeValue}" autocomplete="off">
                    ${timeValue ? `<button type="button" class="modal-time-field__clear" 
                                          onclick="document.getElementById('${timeId}').value = ''; document.getElementById('${timeId}').focus();"
                                          title="Clear time">Clear</button>` : ''}
                </div>
            </div>
            
            <div class="modal-card-type-field">
                <div class="modal-card-type-field__label">
                    <span class="material-icons">category</span>
                    <span>Card Type</span>
                </div>
                <div class="modal-card-type-field__options">
                    ${cardTypeButtons}
                </div>
            </div>
            
            <div class="modal-card__actions">
                ${isNewCard ? 
                    `<button class="btn btn--primary" onclick="appInstance.addActivity()">Add Activity</button>
                     <button class="btn btn--secondary" onclick="ComponentBuilder.closeModalCard()">Cancel</button>` :
                    `<button class="btn btn--primary" onclick="appInstance.saveCardEdit(${index})">Save Changes</button>
                     <button class="btn btn--secondary" onclick="ComponentBuilder.closeModalCard()">Cancel</button>`
                }
            </div>
        `;
        
        overlay.appendChild(modalCard);
        
        // Insert modal emoji picker after the modal is in DOM
        setTimeout(() => {
            const slot = modalCard.querySelector('.modal-emoji-picker-slot');
            if (slot) {
                const filterId = slot.getAttribute('data-filter-id');
                const iconId = slot.getAttribute('data-icon-id');
                const picker = this.createModalEmojiPicker(
                    emoji,
                    (emoji) => {
                        const iconElement = document.getElementById(iconId);
                        if (iconElement) iconElement.textContent = emoji;
                        if (isNewCard) {
                            appInstance.selectNewEmoji(emoji);
                        } else {
                            // For edit mode, update the activity directly
                            const currentActivities = appInstance.appState.getCurrentActivities();
                            if (currentActivities[index]) {
                                currentActivities[index].icon = emoji;
                            }
                        }
                    },
                    filterId
                );
                slot.replaceWith(picker);
            }
            
            // FIXED: Set up card type selection with proper state management
            const cardTypeButtons = modalCard.querySelectorAll('.btn--card-type');
            cardTypeButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // FIXED: Clear previous selection and update visual state
                    cardTypeButtons.forEach(btn => btn.classList.remove('btn--card-type--selected'));
                    button.classList.add('btn--card-type--selected');
                    
                    // Store selected card type
                    const selectedType = button.getAttribute('data-card-type');
                    if (isNewCard) {
                        // Store in UI state for new cards
                        if (window.appInstance) {
                            window.appInstance.selectedCardType = selectedType;
                        }
                    } else {
                        // Update activity directly for edit mode
                        const currentActivities = appInstance.appState.getCurrentActivities();
                        if (currentActivities[index]) {
                            currentActivities[index].cardType = selectedType;
                            // FIXED: Trigger save to persist changes
                            appInstance.appState._triggerSave();
                        }
                    }
                    
                    // FIXED: Provide visual feedback
                    button.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        button.style.transform = '';
                    }, 150);
                });
            });
            
            // Focus on title input
            const titleInput = document.getElementById(titleId);
            if (titleInput) {
                titleInput.focus();
                if (!isNewCard) {
                    titleInput.select();
                }
            }
            
            // Add clear button functionality for time field
            const timeInput = document.getElementById(timeId);
            if (timeInput) {
                timeInput.addEventListener('input', () => {
                    const inputGroup = timeInput.closest('.modal-time-field__input-group');
                    const existingClear = inputGroup.querySelector('.modal-time-field__clear');
                    
                    if (timeInput.value && !existingClear) {
                        // Add clear button
                        const clearBtn = this.createElement('button', 'modal-time-field__clear');
                        clearBtn.type = 'button';
                        clearBtn.textContent = 'Clear';
                        clearBtn.title = 'Clear time';
                        clearBtn.onclick = () => {
                            timeInput.value = '';
                            timeInput.focus();
                            clearBtn.remove();
                        };
                        inputGroup.appendChild(clearBtn);
                    } else if (!timeInput.value && existingClear) {
                        // Remove clear button
                        existingClear.remove();
                    }
                });
            }
        }, 0);
        
        return overlay;
    }

    // Create compact modal emoji picker
    static createModalEmojiPicker(selectedEmoji, onEmojiSelect, filterId) {
        const picker = this.createElement('div', 'modal-emoji-picker');
        
        // Search/paste input
        const filter = this.createElement('input', 'modal-emoji-picker__filter');
        filter.type = 'text';
        filter.placeholder = 'Search or paste emoji...';
        filter.id = filterId;
        
        // Hint text
        const hint = this.createElement('div', 'modal-emoji-picker__hint');
        hint.innerHTML = '💡 Search keywords or paste any emoji';
        
        // Compact grid (2 rows visible)
        const grid = this.createElement('div', 'modal-emoji-picker__grid');
        grid.id = `${filterId}_grid`;
        
        picker.appendChild(filter);
        picker.appendChild(hint);
        picker.appendChild(grid);
        
        // Populate grid with emojis
        this.renderModalEmojiGrid(grid, selectedEmoji, onEmojiSelect, EMOJIS || []);
        
        // Handle input for search and paste
        const emojiRegex = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/u;
        
        filter.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            
            // Check for emoji paste
            const emojiMatch = value.match(emojiRegex);
            if (emojiMatch) {
                onEmojiSelect(emojiMatch[0]);
                filter.value = '';
                this.renderModalEmojiGrid(grid, selectedEmoji, onEmojiSelect, EMOJIS || []);
            } else if (value) {
                // Search functionality
                const filteredEmojis = EmojiPicker.smartEmojiSearch(value);
                this.renderModalEmojiGrid(grid, selectedEmoji, onEmojiSelect, filteredEmojis);
            } else {
                // Show all emojis
                this.renderModalEmojiGrid(grid, selectedEmoji, onEmojiSelect, EMOJIS || []);
            }
        });
        
        filter.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const emojiMatch = pastedText.match(emojiRegex);
            
            if (emojiMatch) {
                onEmojiSelect(emojiMatch[0]);
                filter.value = '';
            } else {
                filter.value = pastedText;
                filter.dispatchEvent(new Event('input'));
            }
        });
        
        return picker;
    }

    static renderModalEmojiGrid(grid, selectedEmoji, onEmojiSelect, emojis) {
        grid.innerHTML = '';
        
        if (!emojis || !Array.isArray(emojis) || emojis.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 15px; color: #666; font-size: 0.85rem;">No emojis found</div>';
            return;
        }
        
        emojis.forEach(emoji => {
            const button = this.createElement('button', 'modal-emoji-picker__option');
            button.textContent = emoji;
            button.title = (EMOJI_NAMES || {})[emoji] || emoji;
            button.type = 'button';
            
            if (emoji === selectedEmoji) {
                button.classList.add('modal-emoji-picker__option--selected');
            }
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update selection
                grid.querySelectorAll('.modal-emoji-picker__option').forEach(opt => {
                    opt.classList.remove('modal-emoji-picker__option--selected');
                });
                button.classList.add('modal-emoji-picker__option--selected');
                
                // Call callback
                if (typeof onEmojiSelect === 'function') {
                    onEmojiSelect(emoji);
                }
            });
            
            grid.appendChild(button);
        });
    }

    // Show modal card
    static showModalCard(isNewCard = true, activity = null, index = -1, selectedEmoji = CONFIG.DEFAULT_EMOJI) {
        // Add body class to hide other cards
        document.body.classList.add('modal-active');
        
        // Create and show modal
        const modal = this.createModalCard(isNewCard, activity, index, selectedEmoji);
        document.body.appendChild(modal);
        
        return modal;
    }

    // Close modal card
    static closeModalCard() {
        const overlay = document.getElementById('modalCardOverlay');
        if (overlay) {
            // Add closing animation
            overlay.classList.add('modal-card-overlay--closing');
            
            // Remove after animation
            setTimeout(() => {
                overlay.remove();
                document.body.classList.remove('modal-active');
                
                // Clean up app state
                if (window.appInstance) {
                    window.appInstance.appState.ui.showingNewCardForm = false;
                    window.appInstance.appState.ui.editingCardIndex = -1;
                }
            }, 300);
        }
    }

    static createActivityForm(selectedEmoji, isNewCard = true, activity = null, index = -1) {
        // Legacy method - now redirects to modal
        return this.showModalCard(isNewCard, activity, index, selectedEmoji);
    }

    // Delegate to EmojiPicker class for backward compatibility
    static createEmojiPicker(selectedEmoji, onEmojiSelect, filterId) {
        return EmojiPicker.createEmojiPicker(selectedEmoji, onEmojiSelect, filterId);
    }

    // Time formatting helper - converts 24-hour time to 12-hour format with AM/PM
    static formatTime(time24) {
        if (!time24 || typeof time24 !== 'string' || !time24.includes(':')) {
            return '--:--';
        }
        
        const [hoursStr, minutesStr] = time24.split(':');
        const hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);
        
        if (isNaN(hours) || isNaN(minutes)) {
            return '--:--';
        }
        
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const displayMinutes = minutes.toString().padStart(2, '0');
        
        return `${displayHours}:${displayMinutes} ${period}`;
    }

    // INTEGRATED: Get card type icon - centralized method
    static getCardTypeIcon(cardType) {
        return CARD_TYPE_ICONS[cardType] || CARD_TYPE_ICONS['recurring'];
    }

    // INTEGRATED: Get card type label - centralized method
    static getCardTypeLabel(cardType) {
        return CARD_TYPE_LABELS[cardType] || CARD_TYPE_LABELS['recurring'];
    }

    // INTEGRATED: Get all card type options for UI generation
    static getCardTypeOptions() {
        return Object.keys(CARD_TYPE_ICONS).map(type => ({
            type,
            icon: CARD_TYPE_ICONS[type],
            label: CARD_TYPE_LABELS[type]
        }));
    }

    // NEW: Show Add User Modal with Emoji Picker (similar to activity flow)
    static showAddUserModal() {
        console.log('showAddUserModal called');
        const overlay = this.createElement('div', 'add-user-modal');
        overlay.id = 'addUserModal';
        
        // Store selected emoji (default to person emoji)
        this.selectedUserEmoji = '👤';
        
        // Close modal when clicking overlay
        overlay.addEventListener('click', (e) => {
            console.log('Overlay clicked, target:', e.target, 'overlay:', overlay);
            if (e.target === overlay) {
                console.log('Closing modal via overlay click');
                this.closeAddUserModal();
            }
        });
        
        // Escape key handler
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeAddUserModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        const modal = this.createElement('div', 'add-user-content');
        modal.innerHTML = `
            <div class="modal-header">
                <h2>Add User</h2>
            </div>
            
            <div class="modal-body">
                <div class="user-icon-section">
                    <div class="user-icon-display" id="userIcon" onclick="document.getElementById('userEmojiFilter').focus()">${this.selectedUserEmoji}</div>
                    <label class="user-icon-label">Choose an icon:</label>
                </div>
                
                <div class="emoji-picker-slot" id="userEmojiPicker"></div>
                
                <div class="form-field">
                    <label for="userName">User Name:</label>
                    <input type="text" 
                           id="userName" 
                           class="form-input" 
                           placeholder="Enter name..." 
                           maxlength="20"
                           autocomplete="off">
                </div>
                
                <div class="modal-info">
                    <p>Each user gets their own personalized StackMap with separate activities and settings.</p>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn--primary" onclick="ComponentBuilder.addUser()">
                    Add User
                </button>
                <button class="btn btn--secondary" onclick="ComponentBuilder.closeAddUserModal()">
                    Cancel
                </button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Add emoji picker after modal is in DOM
        setTimeout(() => {
            const emojiSlot = document.getElementById('userEmojiPicker');
            if (emojiSlot) {
                const emojiPicker = this.createModalEmojiPicker(
                    this.selectedUserEmoji,
                    (emoji) => {
                        this.selectedUserEmoji = emoji;
                        const iconDisplay = document.getElementById('userIcon');
                        if (iconDisplay) {
                            iconDisplay.textContent = emoji;
                        }
                    },
                    'userEmojiFilter'
                );
                emojiSlot.appendChild(emojiPicker);
            }
            
            // Focus on name input
            const nameInput = document.getElementById('userName');
            if (nameInput) {
                nameInput.focus();
                
                // Allow Enter key to submit
                nameInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.addUser();
                    }
                });
            }
        }, 100);
    }

    // NEW: Add user functionality with emoji support
    static addUser() {
        console.log('addUser called');
        const nameInput = document.getElementById('userName');
        if (!nameInput) {
            console.error('Name input not found');
            return;
        }
        
        const name = nameInput.value.trim();
        const icon = this.selectedUserEmoji || '👤';
        console.log('Creating user:', name, 'with icon:', icon);
        
        if (!name) {
            // Show error feedback
            nameInput.classList.add('error');
            nameInput.placeholder = 'Name is required';
            nameInput.focus();
            return;
        }
        
        if (name.length > 20) {
            nameInput.classList.add('error');
            nameInput.value = name.substring(0, 20);
            return;
        }
        
        try {
            // Add the user through AppState with emoji
            if (window.appInstance && window.appInstance.appState) {
                console.log('Adding user through appState');
                const userId = window.appInstance.appState.addUser(name, icon);
                console.log('New user ID:', userId);
                
                // Switch to the new user
                window.appInstance.handleUserSwitch(userId);
                
                // Close modal
                this.closeAddUserModal();
                
                // Show success feedback
                this.showUserSuccess(name, icon);
                
                // Refresh the dropdown
                window.appInstance.populateUserDropdowns();
            } else {
                console.error('App instance not found');
            }
        } catch (error) {
            console.error('Error adding user:', error);
            // Show error (probably max users reached)
            nameInput.classList.add('error');
            nameInput.placeholder = error.message || 'Maximum users reached';
            console.error('Error adding user:', error);
        }
    }

    // NEW: Close add user modal
    static closeAddUserModal() {
        const modal = document.getElementById('addUserModal');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                // Clean up stored emoji
                this.selectedUserEmoji = null;
            }, 200);
        }
    }

    // NEW: Show success feedback with emoji
    static showUserSuccess(name, icon) {
        const toast = this.createElement('div', 'success-toast welcome-toast');
        toast.innerHTML = `
            <div class="success-toast__content">
                <span class="success-icon">✓</span>
                <span>Welcome, ${name}!</span>
                <span class="user-success-icon">${icon}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // NEW: Show Edit User Modal with current user data and emoji picker
    static showEditUserModal(user) {
        console.log('showEditUserModal called with user:', user);
        const overlay = this.createElement('div', 'edit-user-modal');
        overlay.id = 'editUserModal';
        
        // Store current user data and selected emoji
        this.editingUser = user;
        this.selectedUserEmoji = user.icon || '👤';
        
        // Close modal when clicking overlay
        overlay.addEventListener('click', (e) => {
            console.log('Overlay clicked, target:', e.target, 'overlay:', overlay);
            if (e.target === overlay) {
                console.log('Closing modal via overlay click');
                this.closeEditUserModal();
            }
        });
        
        // Escape key handler
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeEditUserModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        const modal = this.createElement('div', 'edit-user-content');
        modal.innerHTML = `
            <div class="modal-header">
                <h2>Edit User</h2>
            </div>
            
            <div class="modal-body">
                <div class="user-icon-section">
                    <div class="user-icon-display" id="editUserIcon" onclick="document.getElementById('editUserEmojiFilter').focus()">${this.selectedUserEmoji}</div>
                    <label class="user-icon-label">Choose an icon:</label>
                </div>
                
                <div class="emoji-picker-slot" id="editUserEmojiPicker"></div>
                
                <div class="form-field">
                    <label for="editUserName">User Name:</label>
                    <input type="text" 
                           id="editUserName" 
                           class="form-input" 
                           placeholder="Enter name..." 
                           value="${user.name}"
                           maxlength="20"
                           autocomplete="off">
                </div>
                
                <div class="modal-info">
                    <p>Update this user's name and icon. Changes will be saved immediately.</p>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn btn--primary" onclick="ComponentBuilder.saveEditUser()">
                    Save Changes
                </button>
                <button class="btn btn--secondary" onclick="ComponentBuilder.closeEditUserModal()">
                    Cancel
                </button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Add emoji picker after modal is in DOM
        setTimeout(() => {
            const emojiSlot = document.getElementById('editUserEmojiPicker');
            if (emojiSlot) {
                const emojiPicker = this.createModalEmojiPicker(
                    this.selectedUserEmoji,
                    (emoji) => {
                        this.selectedUserEmoji = emoji;
                        const iconDisplay = document.getElementById('editUserIcon');
                        if (iconDisplay) {
                            iconDisplay.textContent = emoji;
                        }
                    },
                    'editUserEmojiFilter'
                );
                emojiSlot.appendChild(emojiPicker);
            }
            
            // Focus on name input and select text for easy editing
            const nameInput = document.getElementById('editUserName');
            if (nameInput) {
                nameInput.focus();
                nameInput.select();
                
                // Allow Enter key to submit
                nameInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.saveEditUser();
                    }
                });
            }
        }, 100);
    }

    // NEW: Save edited user data
    static saveEditUser() {
        console.log('saveEditUser called');
        const nameInput = document.getElementById('editUserName');
        if (!nameInput || !this.editingUser) {
            console.error('Name input or editing user not found');
            return;
        }
        
        const newName = nameInput.value.trim();
        const newIcon = this.selectedUserEmoji || '👤';
        console.log('Updating user:', this.editingUser.id, 'with name:', newName, 'and icon:', newIcon);
        
        if (!newName) {
            // Show error feedback
            nameInput.classList.add('error');
            nameInput.placeholder = 'Name is required';
            nameInput.focus();
            return;
        }
        
        if (newName.length > 20) {
            nameInput.classList.add('error');
            nameInput.value = newName.substring(0, 20);
            return;
        }
        
        try {
            // Update the user through AppState
            if (window.appInstance && window.appInstance.appState) {
                console.log('Updating user through appState');
                
                // Update user data
                window.appInstance.appState.updateUser(this.editingUser.id, {
                    name: newName,
                    icon: newIcon
                });
                
                // Close modal
                this.closeEditUserModal();
                
                // Show success feedback
                this.showEditUserSuccess(newName, newIcon);
                
                // Refresh the drawer and UI
                window.appInstance.populateDrawerSelects();
                window.appInstance.render();
                
                // Update title if we edited the current user
                const currentUser = window.appInstance.appState.getCurrentUser();
                if (currentUser.id === this.editingUser.id) {
                    window.appInstance.initializeTitleSubtitle();
                }
            } else {
                console.error('App instance not found');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            // Show error
            nameInput.classList.add('error');
            nameInput.placeholder = error.message || 'Error updating user';
        }
    }

    // NEW: Close edit user modal
    static closeEditUserModal() {
        const modal = document.getElementById('editUserModal');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                // Clean up stored data
                this.editingUser = null;
                this.selectedUserEmoji = null;
            }, 200);
        }
    }

    // NEW: Show success feedback for edit user
    static showEditUserSuccess(name, icon) {
        const toast = this.createElement('div', 'success-toast edit-user-toast');
        toast.innerHTML = `
            <div class="success-toast__content">
                <span class="success-icon">✓</span>
                <span>Updated ${name}!</span>
                <span class="user-success-icon">${icon}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
}

// === EXPANDABLE HEADER COMPONENT ===
class ExpandableHeader {
    constructor(containerId, isFixed = false) {
        this.containerId = containerId;
        this.isFixed = isFixed;
        this.prefix = isFixed ? 'fixed' : 'static';
        this.isExpanded = false;
        
        // Get DOM elements
        this.indicator = document.getElementById(`${this.prefix}ExpansionIndicator`);
        this.submenu = document.getElementById(`${this.prefix}SubmenuContainer`);
        this.closeBtn = document.getElementById(`${this.prefix}SubmenuClose`);
        this.arrow = this.indicator?.querySelector('.expansion-arrow');
        
        this.init();
    }
    
    init() {
        if (!this.indicator || !this.submenu) return;
        
        this.setupEventListeners();
        this.renderUserSelector();
        this.renderDaySelector();
    }
    
    setupEventListeners() {
        // Expansion indicator click/tap
        this.indicator.addEventListener('click', () => this.toggle());
        
        // Keyboard support for expansion indicator
        this.indicator.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            }
        });
        
        // Close button
        this.closeBtn?.addEventListener('click', () => this.collapse());
        
        // Outside click to close
        document.addEventListener('click', (e) => {
            if (this.isExpanded && !this.indicator.contains(e.target) && !this.submenu.contains(e.target)) {
                this.collapse();
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isExpanded) {
                this.collapse();
            }
        });
    }
    
    toggle() {
        if (this.isExpanded) {
            this.collapse();
        } else {
            this.expand();
        }
    }
    
    expand() {
        if (this.isExpanded) return;
        
        this.isExpanded = true;
        
        // Update ARIA states
        this.indicator.setAttribute('aria-expanded', 'true');
        this.submenu.setAttribute('aria-hidden', 'false');
        
        // Add CSS classes for animation
        this.indicator.classList.add('expanded');
        this.submenu.classList.add('expanded');
        
        // Rotate arrow
        if (this.arrow) {
            this.arrow.style.transform = 'rotate(180deg)';
        }
        
        // Update current selections before showing
        this.updateSelections();
    }
    
    collapse() {
        if (!this.isExpanded) return;
        
        this.isExpanded = false;
        
        // Update ARIA states
        this.indicator.setAttribute('aria-expanded', 'false');
        this.submenu.setAttribute('aria-hidden', 'true');
        
        // Remove CSS classes
        this.indicator.classList.remove('expanded');
        this.submenu.classList.remove('expanded');
        
        // Reset arrow
        if (this.arrow) {
            this.arrow.style.transform = 'rotate(0deg)';
        }
    }
    
    renderUserSelector() {
        const container = document.getElementById(`${this.prefix}SubmenuUserSelector`);
        if (!container || !window.appInstance) return;
        
        const currentUser = window.appInstance.appState.getCurrentUser();
        const allUsers = window.appInstance.appState.getAllUsers();
        
        container.innerHTML = `
            <div class="submenu-user-dropdown" role="listbox" aria-label="Select user">
                <div class="submenu-user-current" role="option" aria-selected="true">
                    <span class="user-icon">${currentUser.icon || '👤'}</span>
                    <span class="user-name">${currentUser.name}</span>
                    <span class="dropdown-arrow" aria-hidden="true">▼</span>
                </div>
                <div class="submenu-user-list" role="listbox">
                    ${allUsers.map(user => `
                        <div class="submenu-user-option ${user.id === currentUser.id ? 'selected' : ''}" 
                             role="option" 
                             data-user-id="${user.id}"
                             aria-selected="${user.id === currentUser.id}">
                            <span class="user-icon">${user.icon || '👤'}</span>
                            <span class="user-name">${user.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add click handlers
        container.querySelectorAll('.submenu-user-option').forEach(option => {
            option.addEventListener('click', () => {
                const userId = option.getAttribute('data-user-id');
                if (userId && window.appInstance) {
                    window.appInstance.handleUserSwitch(userId);
                    this.updateUserDisplay();
                }
            });
        });
    }
    
    renderDaySelector() {
        const container = document.getElementById(`${this.prefix}SubmenuDaySelector`);
        if (!container || !window.appInstance) return;
        
        const currentDay = window.appInstance.appState.getCurrentDay();
        const todayIcon = this.getTodayCalendarIcon();
        const tomorrowIcon = this.getTomorrowCalendarIcon();
        
        container.innerHTML = `
            <div class="submenu-day-options" role="radiogroup" aria-label="Select day">
                <div class="submenu-day-option ${currentDay === 'today' ? 'selected' : ''}" 
                     role="radio" 
                     data-day="today"
                     aria-checked="${currentDay === 'today'}"
                     tabindex="${currentDay === 'today' ? '0' : '-1'}">
                    <div class="day-icon">${todayIcon}</div>
                    <span class="day-label">Today</span>
                </div>
                <div class="submenu-day-option ${currentDay === 'tomorrow' ? 'selected' : ''}" 
                     role="radio" 
                     data-day="tomorrow"
                     aria-checked="${currentDay === 'tomorrow'}"
                     tabindex="${currentDay === 'tomorrow' ? '0' : '-1'}">
                    <div class="day-icon">${tomorrowIcon}</div>
                    <span class="day-label">Tomorrow</span>
                </div>
            </div>
        `;
        
        // Add click handlers
        container.querySelectorAll('.submenu-day-option').forEach(option => {
            option.addEventListener('click', () => {
                const day = option.getAttribute('data-day');
                if (day && window.appInstance) {
                    window.appInstance.switchDay(day);
                    this.updateDayDisplay();
                }
            });
        });
    }
    
    getTodayCalendarIcon() {
        const today = new Date();
        const dayNum = today.getDate();
        const themeColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-color').trim() || '#667eea';
        return this.generateCalendarIcon(dayNum, themeColor);
    }
    
    getTomorrowCalendarIcon() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayNum = tomorrow.getDate();
        const themeColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-color').trim() || '#667eea';
        return this.generateCalendarIcon(dayNum, themeColor);
    }
    
    generateCalendarIcon(dayNumber, themeColor = '#667eea') {
        // Determine font size based on number of digits
        const fontSize = dayNumber < 10 ? '9' : '8';
        
        return `
            <svg class="calendar-day-icon" width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="calGrad${dayNumber}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${themeColor};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${themeColor};stop-opacity:0.8" />
                    </linearGradient>
                    <filter id="calShadow${dayNumber}">
                        <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.15"/>
                    </filter>
                </defs>
                
                <!-- Calendar base -->
                <rect x="3" y="5" width="22" height="20" rx="3" fill="white" stroke="#e0e0e0" stroke-width="1"/>
                
                <!-- Calendar header with theme color -->
                <rect x="3" y="5" width="22" height="6" rx="3" fill="url(#calGrad${dayNumber})"/>
                <rect x="3" y="8" width="22" height="3" fill="${themeColor}"/>
                
                <!-- Binding holes -->
                <circle cx="8" cy="3" r="1.5" fill="#666" opacity="0.4"/>
                <circle cx="20" cy="3" r="1.5" fill="#666" opacity="0.4"/>
                
                <!-- Day number -->
                <text x="14" y="19" text-anchor="middle" 
                      font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
                      font-size="${fontSize}" font-weight="700" fill="#333"
                      filter="url(#calShadow${dayNumber})">
                    ${dayNumber}
                </text>
            </svg>
        `;
    }
    
    updateSelections() {
        this.updateUserDisplay();
        this.updateDayDisplay();
    }
    
    updateUserDisplay() {
        // Update user selection when state changes
        if (window.appInstance) {
            this.renderUserSelector();
        }
    }
    
    updateDayDisplay() {
        // Update day selection when state changes  
        if (window.appInstance) {
            this.renderDaySelector();
        }
    }
}

// Make available globally
window.ExpandableHeader = ExpandableHeader;

// === ENHANCED EMOJI PICKER COMPONENT ===
class EmojiPicker {
    static createEmojiPicker(selectedEmoji, onEmojiSelect, filterId) {
        const picker = ComponentBuilder.createElement('div', 'emoji-picker');
        
        // Add header section
        const header = ComponentBuilder.createElement('div', 'emoji-picker__header');
        
        // Unified search/paste input
        const filter = ComponentBuilder.createElement('input', 'emoji-picker__filter');
        filter.type = 'text';
        filter.placeholder = 'Search emojis or paste your own...';
        filter.id = filterId;
        
        // Add hint text
        const hint = ComponentBuilder.createElement('div', 'emoji-picker__hint');
        hint.innerHTML = '💡 Tip: Paste any emoji or search by keywords like "face", "happy", "dark skin"';
        
        // Grid for our emojis
        const grid = ComponentBuilder.createElement('div', 'emoji-picker__grid');
        grid.id = `${filterId}_grid`;
        
        // Assembly
        header.appendChild(filter);
        header.appendChild(hint);
        picker.appendChild(header);
        picker.appendChild(grid);
        
        // Populate grid immediately
        this.renderEmojiGrid(grid, selectedEmoji, onEmojiSelect, EMOJIS || []);
        
        // Emoji regex pattern - matches emojis
        const emojiRegex = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/u;
        
        // Handle unified input
        filter.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            
            // Check if input contains emoji
            const emojiMatch = value.match(emojiRegex);
            if (emojiMatch) {
                // User pasted/typed an emoji - select it immediately
                onEmojiSelect(emojiMatch[0]);
                filter.value = '';
                this.showSuccess(filter, 'Emoji selected!');
                // Reset grid to show all
                this.renderEmojiGrid(grid, selectedEmoji, onEmojiSelect, EMOJIS || []);
            } else if (value) {
                // Search functionality
                const filteredEmojis = this.smartEmojiSearch(value);
                
                if (filteredEmojis.length === 0) {
                    grid.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #666; font-size: 0.9rem;">
                            No emojis found for "${value}"<br>
                            Try: "face", "animal", "food", "light skin", "red hair", "family"
                        </div>
                    `;
                } else {
                    this.renderEmojiGrid(grid, selectedEmoji, onEmojiSelect, filteredEmojis);
                }
            } else {
                // Empty input - show all
                this.renderEmojiGrid(grid, selectedEmoji, onEmojiSelect, EMOJIS || []);
            }
        });
        
        // Handle paste event for better emoji detection
        filter.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const emojiMatch = pastedText.match(emojiRegex);
            
            if (emojiMatch) {
                onEmojiSelect(emojiMatch[0]);
                filter.value = '';
                this.showSuccess(filter, 'Emoji pasted!');
            } else {
                // If not an emoji, treat as search
                filter.value = pastedText;
                filter.dispatchEvent(new Event('input'));
            }
        });
        
        return picker;
    }
    
    static smartEmojiSearch(searchTerm) {
        const terms = searchTerm.toLowerCase().split(' ').filter(t => t.length > 0);
        
        // Process skin tone and hair terms
        const processedTerms = this.processSearchTerms(terms);
        
        return (EMOJIS || []).filter(emoji => {
            const keywords = ((EMOJI_NAMES || {})[emoji] || '').toLowerCase();
            
            // Check if all processed terms match
            return processedTerms.every(term => {
                // Direct emoji match
                if (emoji === term) return true;
                
                // Keyword match
                if (keywords.includes(term)) return true;
                
                // Synonym matching
                const synonyms = this.getSynonyms(term);
                return synonyms.some(syn => keywords.includes(syn));
            });
        });
    }
    
    static processSearchTerms(terms) {
        const processed = [];
        let skipNext = false;
        
        for (let i = 0; i < terms.length; i++) {
            if (skipNext) {
                skipNext = false;
                continue;
            }
            
            // Check for skin tone combinations
            if (i < terms.length - 1) {
                const combined = this.normalizeSkinTone(terms[i], terms[i + 1]);
                if (combined) {
                    processed.push(combined);
                    skipNext = true;
                    continue;
                }
            }
            
            // Single term normalization
            const normalized = this.normalizeTerm(terms[i]);
            if (normalized) {
                processed.push(normalized);
            }
        }
        
        return processed;
    }
    
    static normalizeSkinTone(term1, term2) {
        const skinToneMap = {
            'light skin': 'light skin',
            'pale skin': 'light skin',
            'white skin': 'light skin',
            'fair skin': 'light skin',
            'medium skin': 'medium skin',
            'olive skin': 'medium skin',
            'tan skin': 'medium light skin',
            'brown skin': 'medium skin',
            'dark skin': 'dark skin',
            'black skin': 'dark skin'
        };
        
        const combined = `${term1} ${term2}`;
        return skinToneMap[combined] || null;
    }
    
    static normalizeTerm(term) {
        const termMap = {
            'light': 'light skin',
            'pale': 'light skin',
            'white': 'light skin',
            'fair': 'light skin',
            'medium': 'medium skin',
            'olive': 'medium skin',
            'tan': 'medium light skin',
            'brown': 'medium skin',
            'dark': 'dark skin',
            'black': 'dark skin',
            'mom': 'mother',
            'dad': 'father',
            'mommy': 'mother',
            'daddy': 'father',
            'kid': 'child',
            'kids': 'children'
        };
        
        return termMap[term] || term;
    }
    
    static getSynonyms(term) {
        const synonymMap = {
            'happy': ['smile', 'joy', 'cheerful', 'glad'],
            'sad': ['unhappy', 'crying', 'tears', 'upset'],
            'angry': ['mad', 'frustrated', 'annoyed'],
            'family': ['parents', 'children', 'mother', 'father'],
            'boy': ['son', 'male', 'child'],
            'girl': ['daughter', 'female', 'child'],
            'man': ['male', 'father', 'dad'],
            'woman': ['female', 'mother', 'mom'],
            'baby': ['infant', 'newborn'],
            'food': ['eat', 'meal', 'breakfast', 'lunch', 'dinner'],
            'animal': ['pet', 'creature'],
            'work': ['job', 'office', 'professional'],
            'school': ['education', 'learn', 'study']
        };
        
        return synonymMap[term] || [];
    }
    
    static showSuccess(input, message) {
        const parent = input.parentElement;
        const existing = parent.querySelector('.emoji-picker__feedback');
        if (existing) existing.remove();
        
        const feedback = ComponentBuilder.createElement('div', 'emoji-picker__feedback emoji-picker__feedback--success');
        feedback.textContent = message;
        parent.appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 2000);
    }
    
    static showError(input, message) {
        const parent = input.parentElement;
        const existing = parent.querySelector('.emoji-picker__feedback');
        if (existing) existing.remove();
        
        const feedback = ComponentBuilder.createElement('div', 'emoji-picker__feedback emoji-picker__feedback--error');
        feedback.textContent = message;
        parent.appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 3000);
    }

    static renderEmojiGrid(grid, selectedEmoji, onEmojiSelect, emojis) {
        grid.innerHTML = '';
        
        // Add safety check
        if (!emojis || !Array.isArray(emojis) || emojis.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #666;">No emojis available</div>';
            return;
        }
        
        emojis.forEach(emoji => {
            const button = ComponentBuilder.createElement('button', 'emoji-picker__option');
            button.textContent = emoji;
            button.title = (EMOJI_NAMES || {})[emoji] || emoji;
            button.type = 'button';
            
            if (emoji === selectedEmoji) {
                button.classList.add('emoji-picker__option--selected');
            }
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update selection
                grid.querySelectorAll('.emoji-picker__option').forEach(opt => {
                    opt.classList.remove('emoji-picker__option--selected');
                });
                button.classList.add('emoji-picker__option--selected');
                
                // Call callback
                if (typeof onEmojiSelect === 'function') {
                    onEmojiSelect(emoji);
                }
            });
            
            grid.appendChild(button);
        });
    }
}

// === ENHANCED ACTIVITY CARD COMPONENT ===
class ActivityCard {
    constructor(activity, index, appState, renderer, app) {
        this.activity = activity;
        this.index = index;
        this.appState = appState;
        this.renderer = renderer;
        this.app = app;
    }

    render() {
        const { editMode, editingCardIndex } = this.appState.ui;
        const { backgroundColor, displayMode, showCompletionIndicators } = this.appState.settings;
        const isEditing = editingCardIndex === this.index;
        
        // Create card with completion state
        const completedClass = this.activity.completed ? 'card--completed' : '';
        const hiddenClass = !this.activity.visible ? 'card--hidden' : '';
        
        const card = ComponentBuilder.createElement('div', 
            `card ${completedClass} ${hiddenClass}`, 
            { 
                'data-index': this.index,
                'data-card-type': this.activity.cardType || 'recurring' // FIXED: Add card type for CSS styling
            }
        );

        // CARD CLICK BEHAVIOR - Updated to respect completion indicators setting
        if (!editMode) {
            // Child mode: click to complete only if indicators are shown
            if (showCompletionIndicators !== false) {
                card.onclick = (e) => this.handleClick(e);
                card.style.cursor = 'pointer';
            } else {
                card.style.cursor = 'default';
            }
        } else {
            // Grown-up mode: click to edit (now opens modal)
            card.onclick = (e) => this.handleEditClick(e);
            card.style.cursor = 'pointer';
            card.title = 'Click to edit this card';
        }

        this.setupDragAndDrop(card);

        // Always render view mode since editing is now in modal
        card.innerHTML = this.renderViewMode(backgroundColor, displayMode);

        return card;
    }

    renderViewMode(backgroundColor, displayMode) {
        const { editMode } = this.appState.ui;
        const { showCompletionIndicators } = this.appState.settings;
        const displayIndex = this.getDisplayIndex();
        
        // Generate badge content based on display mode
        let badgeContent = '';
        if (!editMode) {
            switch (displayMode) {
                case CONFIG.DISPLAY_MODES.NONE:
                    // No badge displayed
                    badgeContent = '';
                    break;
                case CONFIG.DISPLAY_MODES.NUMBERS:
                    // Show sequential numbers in circular badge
                    badgeContent = `<div class="card__number" style="background: ${backgroundColor};">${displayIndex + 1}</div>`;
                    break;
                case CONFIG.DISPLAY_MODES.TIMES:
                    // Show time in elongated pill badge (only if time is set)
                    if (this.activity.time && this.activity.time.trim()) {
                        const formattedTime = ComponentBuilder.formatTime(this.activity.time);
                        badgeContent = `<div class="card__time-pill" style="background: ${backgroundColor};">${formattedTime}</div>`;
                    }
                    // If no time is set, don't show any badge
                    break;
                default:
                    // Default to numbers for backward compatibility
                    badgeContent = `<div class="card__number" style="background: ${backgroundColor};">${displayIndex + 1}</div>`;
            }
        }
        
        return `
            ${badgeContent}
            ${editMode ? this.renderEditButtons() : ''}
            ${editMode && this.activity.time && this.activity.time.trim() ? this.renderEditTimePill(backgroundColor) : ''}
            ${editMode ? this.renderCardTypeIndicator() : ''}
            <div class="card__icon">${this.activity.icon}</div>
            <div class="card__title">${this.activity.title}</div>
            <div class="card__description">${this.activity.description}</div>
        `;
    }

    renderEditButtons() {
        // In grown-up mode, show completion checkbox in top-left
        const checkboxIcon = '✓';
        const checkboxBg = this.activity.completed ? 'var(--primary-color)' : '#e8e8e8';
        const checkboxColor = this.activity.completed ? 'white' : '#999';
        
        return `
            <button class="btn btn--round btn--checkbox" 
                    style="top: 15px; left: 15px; background: ${checkboxBg}; color: ${checkboxColor}; font-size: 1.35rem; font-weight: 900; font-family: inherit; line-height: 1; padding: 0;" 
                    onclick="event.stopPropagation(); appInstance.toggleGrownupCompletion(${this.index})" 
                    aria-label="Toggle completion" title="${this.activity.completed ? 'Mark incomplete' : 'Mark complete'}">✓</button>
            
            <button class="btn btn--round btn--visibility ${!this.activity.visible ? 'btn--visibility--hidden' : ''}" 
                    style="top: 15px; right: 15px;"
                    onclick="event.stopPropagation(); appInstance.toggleVisibility(${this.index})" 
                    aria-label="Toggle visibility" title="${this.activity.visible ? 'Hide from routine' : 'Show in routine'}">
                <span class="material-icons">${this.activity.visible ? 'visibility' : 'visibility_off'}</span>
            </button>
            <button class="btn btn--round btn--duplicate" 
                    style="bottom: 15px; right: 15px;"
                    onclick="event.stopPropagation(); appInstance.duplicateActivity(${this.index})" 
                    aria-label="Duplicate card" title="Make a copy">
                <span class="material-icons">content_copy</span>
            </button>
            <button class="btn btn--round btn--delete" 
                    style="bottom: 15px; left: 15px;"
                    onclick="event.stopPropagation(); appInstance.deleteActivity(${this.index})" 
                    aria-label="Delete card" title="Delete card">
                <span class="material-icons">delete</span>
            </button>
        `;
    }

    // INTEGRATED: Use centralized card type configuration
    renderCardTypeIndicator() {
        const cardType = this.activity.cardType || 'recurring';
        const icon = ComponentBuilder.getCardTypeIcon(cardType);
        const label = ComponentBuilder.getCardTypeLabel(cardType);
        
        return `
            <div class="card__type-indicator" 
                 onclick="event.stopPropagation(); appInstance.cycleCardType(${this.index})"
                 title="Card Type: ${label} (Click to cycle)">
                <span class="material-icons">${icon}</span>
            </div>
        `;
    }

    renderEditTimePill(backgroundColor) {
        const formattedTime = ComponentBuilder.formatTime(this.activity.time);
        return `<div class="card__time-pill--edit" style="background: ${backgroundColor};">${formattedTime}</div>`;
    }

    getDisplayIndex() {
        const visibleActivities = this.appState.getCurrentActivities().filter(a => a.visible);
        return visibleActivities.indexOf(this.activity);
    }

    // CHILD MODE: Click to complete (only if indicators are enabled)
    handleClick(e) {
        if (!e.target.closest('.card').classList.contains('card--dragging')) {
            if (this.appState.settings.showCompletionIndicators !== false) {
                this.toggleComplete();
            }
        }
    }

    // GROWN-UP MODE: Click to edit (now opens modal)
    handleEditClick(e) {
        // Don't trigger edit if clicking on buttons
        if (e.target.closest('button')) {
            return;
        }
        
        // Use panel-based editing if available
        if (window.hybridPanelManager) {
            window.hybridPanelManager.editActivity(this.activity, this.index);
        } else {
            // Fallback to modal
            ComponentBuilder.showModalCard(false, this.activity, this.index);
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
            // Trigger task completion celebration
            if (window.celebrationManager && window.appInstance) {
                const currentUser = window.appInstance.appState.getCurrentUser();
                window.celebrationManager.celebrateTask(card, currentUser.id);
            }
            
            // Check if all visible cards are now completed
            const visibleActivities = this.appState.getCurrentActivities().filter(a => a.visible);
            const allCards = document.querySelectorAll('.card:not(.card--hidden)');
            const completedCards = document.querySelectorAll('.card--completed:not(.card--hidden)');
            
            if (completedCards.length === visibleActivities.length && visibleActivities.length > 0) {
                // Trigger routine completion celebration
                if (window.celebrationManager && window.appInstance) {
                    const containerElement = document.getElementById('mainContainer') || 
                                          document.querySelector('.main-container');
                    const currentUser = window.appInstance.appState.getCurrentUser();
                    window.celebrationManager.celebrateRoutine(containerElement, currentUser.id);
                }
            }
        }
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
        
        if (isNaN(draggedIndex) || isNaN(targetIndex) || draggedIndex === targetIndex) return;
        
        // Get container and calculate card dimensions
        const container = targetCard.parentElement;
        const cards = Array.from(container.querySelectorAll('.card:not(.card--dragging)'));
        const firstCard = cards[0];
        if (!firstCard) return;
        
        const cardRect = firstCard.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const cardsPerRow = Math.floor(containerRect.width / cardRect.width);
        const gap = 20; // Match CSS gap
        
        // Clear previous animations
        cards.forEach(card => {
            card.style.transform = '';
            card.style.transition = '';
            card.classList.remove('card--shifting');
        });
        
        // Animate cards that need to move
        cards.forEach(card => {
            const cardIndex = parseInt(card.dataset.index);
            if (isNaN(cardIndex)) return;
            
            let translateX = 0;
            let translateY = 0;
            
            if (draggedIndex < targetIndex) {
                // Dragging down: cards between dragged and target move up/left
                if (cardIndex > draggedIndex && cardIndex <= targetIndex) {
                    const currentRow = Math.floor(cardIndex / cardsPerRow);
                    const currentCol = cardIndex % cardsPerRow;
                    const newIndex = cardIndex - 1;
                    const newRow = Math.floor(newIndex / cardsPerRow);
                    const newCol = newIndex % cardsPerRow;
                    
                    translateX = (newCol - currentCol) * (cardRect.width + gap);
                    translateY = (newRow - currentRow) * (cardRect.height + gap);
                }
            } else {
                // Dragging up: cards between target and dragged move down/right
                if (cardIndex >= targetIndex && cardIndex < draggedIndex) {
                    const currentRow = Math.floor(cardIndex / cardsPerRow);
                    const currentCol = cardIndex % cardsPerRow;
                    const newIndex = cardIndex + 1;
                    const newRow = Math.floor(newIndex / cardsPerRow);
                    const newCol = newIndex % cardsPerRow;
                    
                    translateX = (newCol - currentCol) * (cardRect.width + gap);
                    translateY = (newRow - currentRow) * (cardRect.height + gap);
                }
            }
            
            if (translateX !== 0 || translateY !== 0) {
                card.style.transform = `translate(${translateX}px, ${translateY}px)`;
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

/**
 * EditModeFAB - Floating Action Button for Edit Mode
 * Replaces management cards with clean FAB interface
 * Only visible in edit mode, provides access to all edit actions
 */
class EditModeFAB {
    constructor(appInstance) {
        this.app = appInstance;
        this.isExpanded = false;
        this.isAnimating = false;
        this.fab = null;
        this.subFabs = [];
        this.backdrop = null;
        this.container = null;
        
        // Action definitions with icons and handlers
        this.actions = [
            {
                id: 'add-activity',
                icon: '➕',
                label: 'Add Activity',
                ariaLabel: 'Add new activity card',
                handler: () => this.app.showNewCardForm('bottom')
            },
            {
                id: 'add-user',
                icon: '👤',
                label: 'Add User',
                ariaLabel: 'Add new user profile',
                handler: () => this.app.showAddUserForm()
            },
            {
                id: 'complete-day',
                icon: '✅',
                label: 'Complete Day',
                ariaLabel: 'Mark all activities as complete',
                handler: () => this.app.completeAllActivities()
            },
            {
                id: 'exit-edit',
                icon: '👁️',
                label: 'Return to View',
                ariaLabel: 'Exit edit mode and return to view mode',
                handler: () => this.app.exitGrownupMode()
            }
        ];
    }
    
    init() {
        this.render();
        this.setupEventListeners();
        this.hide(); // Hidden by default, shown when edit mode activated
    }
    
    render() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'fab-container';
        this.container.innerHTML = `
            <!-- Mobile backdrop (only visible on mobile when expanded) -->
            <div class="fab-backdrop" style="display: none;"></div>
            
            <!-- Main FAB button -->
            <button class="btn btn--floating btn--fab" 
                    id="edit-mode-fab"
                    aria-label="Edit mode actions menu"
                    aria-expanded="false"
                    aria-haspopup="true">
                <span class="fab-icon">✏️</span>
            </button>
            
            <!-- Sub-FAB actions (hidden by default) -->
            <div class="fab-actions" style="display: none;">
                ${this.actions.map((action, index) => `
                    <button class="btn btn--floating btn--fab-sub" 
                            id="fab-${action.id}"
                            data-action="${action.id}"
                            aria-label="${action.ariaLabel}"
                            style="transform: scale(0) translateY(20px); opacity: 0;">
                        <span class="fab-icon">${action.icon}</span>
                        <span class="fab-label">${action.label}</span>
                    </button>
                `).join('')}
            </div>
        `;
        
        // Store references
        this.fab = this.container.querySelector('#edit-mode-fab');
        this.subFabs = Array.from(this.container.querySelectorAll('.btn--fab-sub'));
        this.backdrop = this.container.querySelector('.fab-backdrop');
        this.actionsContainer = this.container.querySelector('.fab-actions');
        
        // Append to body
        document.body.appendChild(this.container);
    }
    
    setupEventListeners() {
        // Main FAB click - toggle expansion
        this.fab.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        // Sub-FAB clicks - execute actions
        this.subFabs.forEach(subFab => {
            subFab.addEventListener('click', (e) => {
                e.stopPropagation();
                const actionId = subFab.dataset.action;
                this.handleAction(actionId);
            });
        });
        
        // Backdrop click - close on mobile
        this.backdrop.addEventListener('click', () => {
            this.collapse();
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (this.isExpanded && !this.container.contains(e.target)) {
                this.collapse();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isVisible()) return;
            
            if (e.key === 'Escape' && this.isExpanded) {
                this.collapse();
                this.fab.focus();
            }
            
            // Tab navigation through expanded FAB
            if (e.key === 'Tab' && this.isExpanded) {
                this.handleTabNavigation(e);
            }
        });
        
        // Window resize - reposition if needed
        window.addEventListener('resize', () => {
            if (this.isExpanded) {
                this.updateSubFabPositions();
            }
        });
    }
    
    show() {
        if (this.container) {
            this.container.style.display = 'block';
            // Animate in
            requestAnimationFrame(() => {
                this.fab.style.transform = 'scale(1)';
                this.fab.style.opacity = '1';
            });
        }
    }
    
    hide() {
        if (this.container) {
            if (this.isExpanded) {
                this.collapse();
            }
            // Animate out
            this.fab.style.transform = 'scale(0)';
            this.fab.style.opacity = '0';
            setTimeout(() => {
                this.container.style.display = 'none';
            }, 300);
        }
    }
    
    isVisible() {
        return this.container && this.container.style.display !== 'none';
    }
    
    toggle() {
        if (this.isAnimating) return;
        
        if (this.isExpanded) {
            this.collapse();
        } else {
            this.expand();
        }
    }
    
    expand() {
        if (this.isAnimating || this.isExpanded) return;
        
        this.isAnimating = true;
        this.isExpanded = true;
        
        // Update ARIA state
        this.fab.setAttribute('aria-expanded', 'true');
        
        // Show actions container
        this.actionsContainer.style.display = 'block';
        
        // Show mobile backdrop
        if (window.innerWidth <= 768) {
            this.backdrop.style.display = 'block';
            requestAnimationFrame(() => {
                this.backdrop.style.opacity = '1';
            });
        }
        
        // Calculate positions and animate sub-FABs
        this.updateSubFabPositions();
        
        // Stagger sub-FAB animations
        this.subFabs.forEach((subFab, index) => {
            setTimeout(() => {
                subFab.style.transform = 'scale(1) translateY(0)';
                subFab.style.opacity = '1';
            }, index * 50); // 50ms stagger
        });
        
        // Animation complete
        setTimeout(() => {
            this.isAnimating = false;
        }, this.subFabs.length * 50 + 300);
        
        // Announce to screen readers
        this.announceToScreenReader('Edit menu opened');
    }
    
    collapse() {
        if (this.isAnimating || !this.isExpanded) return;
        
        this.isAnimating = true;
        this.isExpanded = false;
        
        // Update ARIA state
        this.fab.setAttribute('aria-expanded', 'false');
        
        // Hide mobile backdrop
        this.backdrop.style.opacity = '0';
        setTimeout(() => {
            this.backdrop.style.display = 'none';
        }, 300);
        
        // Animate sub-FABs out (reverse order)
        this.subFabs.slice().reverse().forEach((subFab, index) => {
            setTimeout(() => {
                subFab.style.transform = 'scale(0) translateY(20px)';
                subFab.style.opacity = '0';
            }, index * 30); // Faster collapse
        });
        
        // Hide actions container after animation
        setTimeout(() => {
            this.actionsContainer.style.display = 'none';
            this.isAnimating = false;
        }, this.subFabs.length * 30 + 300);
        
        // Announce to screen readers
        this.announceToScreenReader('Edit menu closed');
    }
    
    updateSubFabPositions() {
        const fabRect = this.fab.getBoundingClientRect();
        const subFabSize = 40; // Size of sub-FABs
        const spacing = 16; // Space between FABs
        
        this.subFabs.forEach((subFab, index) => {
            // Position above main FAB
            const offsetY = (subFabSize + spacing) * (index + 1);
            subFab.style.bottom = `${24 + 56 + offsetY}px`; // 24px from edge + FAB height + offset
            subFab.style.right = `${24 + (56 - subFabSize) / 2}px`; // Centered on main FAB
        });
    }
    
    handleAction(actionId) {
        const action = this.actions.find(a => a.id === actionId);
        if (action && action.handler) {
            // Collapse first
            this.collapse();
            
            // Execute action after collapse animation
            setTimeout(() => {
                action.handler();
            }, 150);
            
            // Announce action to screen readers
            this.announceToScreenReader(`${action.label} activated`);
        }
    }
    
    handleTabNavigation(e) {
        const focusableElements = [this.fab, ...this.subFabs.filter(fab => 
            window.getComputedStyle(fab).opacity !== '0'
        )];
        
        const currentIndex = focusableElements.indexOf(document.activeElement);
        let nextIndex;
        
        if (e.shiftKey) {
            // Backward navigation
            nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        } else {
            // Forward navigation
            nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
        }
        
        e.preventDefault();
        focusableElements[nextIndex].focus();
    }
    
    announceToScreenReader(message) {
        // Create temporary announcement element
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        
        document.body.appendChild(announcement);
        announcement.textContent = message;
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    destroy() {
        if (this.container) {
            document.body.removeChild(this.container);
            this.container = null;
            this.fab = null;
            this.subFabs = [];
            this.backdrop = null;
        }
    }
}

// Make classes globally available (no ES6 exports)
window.ComponentBuilder = ComponentBuilder;
window.ActivityCard = ActivityCard;
window.EmojiPicker = EmojiPicker;
window.EditModeFAB = EditModeFAB;

// INTEGRATED: Make card type configuration globally available
window.CARD_TYPE_ICONS = CARD_TYPE_ICONS;
window.CARD_TYPE_LABELS = CARD_TYPE_LABELS;