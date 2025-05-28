// === MAIN RENDERER ===
// Components are loaded globally via module imports in index.html

class AppRenderer {
    constructor(appState, app) {
        this.appState = appState;
        this.app = app;
        this.container = document.getElementById('mainContainer');
    }

    render() {
        this.updateHeader();
        this.renderActivities();
        this.updateUIState();
        this.updateButtonPositioning();
    }

    updateHeader() {
        const { title, subtitle, isDefaultTitle } = this.appState.settings;
        const titleElement = document.getElementById('mainTitle');
        const subtitleElement = document.getElementById('subtitle');
        
        // Only update text content if not currently being edited
        if (titleElement && titleElement.contentEditable !== "true") {
            if (isDefaultTitle) {
                // Show logo + "StackMap" for default title
                titleElement.innerHTML = `
                    <svg style="width: 1em; height: 1em; vertical-align: middle; margin-right: 0.3em;" xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>
                        <circle cx='16' cy='16' r='15' fill='rgba(255,255,255,0.9)' stroke='rgba(255,255,255,0.7)' stroke-width='1'/>
                        <rect x='7' y='10' width='18' height='2.5' fill='#4a90e2' rx='1.25'/>
                        <rect x='7' y='14.5' width='18' height='2.5' fill='#4a90e2' rx='1.25'/>
                        <rect x='7' y='19' width='18' height='5' fill='#2c5aa0' rx='2.5'/>
                    </svg>StackMap
                `;
            } else {
                // Show custom title without logo
                titleElement.textContent = title;
            }
        }
        if (subtitleElement && subtitleElement.contentEditable !== "true") {
            subtitleElement.textContent = subtitle;
        }
        
        // Handle subtitle placeholder visibility based on grown-up mode
        this.updateSubtitleVisibility(subtitleElement);
    }

    updateSubtitleVisibility(subtitleElement) {
        if (!subtitleElement) return;
        
        const { grownupMode } = this.app;
        
        if (grownupMode) {
            // Show subtitle and placeholder in grown-up mode
            subtitleElement.style.display = 'inline-block';
            subtitleElement.setAttribute('data-placeholder', 'Tap to add subtitle');
        } else {
            // Hide subtitle in child mode (unless it has content)
            if (!this.appState.settings.subtitle.trim()) {
                subtitleElement.style.display = 'none';
            } else {
                subtitleElement.style.display = 'inline-block';
            }
            subtitleElement.removeAttribute('data-placeholder');
        }
    }

    updateButtonPositioning() {
        const { subtitle } = this.appState.settings;
        const { grownupMode } = this.app;
        const hasSubtitle = subtitle.trim() || grownupMode; // Show positioning for subtitle area if in grown-up mode or has subtitle content
        
        if (hasSubtitle) {
            document.body.classList.add('has-subtitle');
        } else {
            document.body.classList.remove('has-subtitle');
        }
    }

    renderActivities() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        
        if (this.appState.ui.editMode) {
            // Render edit mode components first
            this.renderEditModeComponents();
        }

        // Then render all activity cards
        this.renderActivityCards();
        
        // Add bottom new card button/form if in edit mode
        if (this.appState.ui.editMode && this.appState.ui.showingNewCardForm !== 'bottom') {
            this.container.appendChild(this.createNewCardButton('bottom'));
        } else if (this.appState.ui.editMode && this.appState.ui.showingNewCardForm === 'bottom') {
            this.container.appendChild(this.createActivityGenerator('bottom'));
        }
    }

    renderEditModeComponents() {
        // Show info card when NOT creating a new card
        if (!this.appState.ui.showingNewCardForm) {
            const infoCard = this.createEditModeInfoCard();
            this.container.appendChild(infoCard);
        }
        
        // Show top new card button or form
        if (this.appState.ui.showingNewCardForm === 'top') {
            this.container.appendChild(this.createActivityGenerator('top'));
        } else {
            this.container.appendChild(this.createNewCardButton('top'));
        }
    }

    createEditModeInfoCard() {
        const infoCard = ComponentBuilder.createElement('div', 'card edit-info-card');
        
        infoCard.innerHTML = `
            <div class="card__icon">⚙️</div>
            <div class="card__title">Grown-up Mode</div>
            <div class="card__description">Rename the title and subtitle of the page above. Create, edit, rearrange, and delete cards below.</div>
        `;
        
        return infoCard;
    }

    createNewCardButton(position) {
        const newCard = ComponentBuilder.createElement('div', `new-card new-card--${position}`);
        newCard.onclick = () => this.app.openNewCardForm(position);
        
        const positionText = position === 'top' ? 'top' : 'bottom';
        
        newCard.innerHTML = `
            <div class="new-card__icon">+</div>
            <div class="new-card__title">New Card</div>
            <div class="new-card__description">Click to add a card to the ${positionText}!</div>
        `;
        
        return newCard;
    }

    createActivityGenerator(position) {
        const panel = ComponentBuilder.createElement('div', 'panel');
        const { selectedEmoji } = this.appState.ui;

        panel.innerHTML = `
            <div class="card__icon card__icon--editable" id="newActivityIcon" style="font-size: 3rem; height: 60px; margin-bottom: 10px; margin-top: 5px;" title="Click to change emoji">${selectedEmoji}</div>
            <div class="emoji-picker-slot" id="newEmojiSlot"></div>
            <div style="margin-top: 12px;">
                <input type="text" class="form-field form-field--title" 
                       id="newActivityTitle" placeholder="New activity..." maxlength="${CONFIG.MAX_TITLE_LENGTH}" 
                       style="font-size: 1.5rem; padding: 10px 14px;">
                <input type="text" class="form-field form-field--description" 
                       id="newActivityDescription" placeholder="Remember to make it fun!" 
                       maxlength="${CONFIG.MAX_DESCRIPTION_LENGTH}" style="margin-top: 8px; font-size: 1rem; padding: 8px 12px;">
                <div style="margin-top: 12px; display: flex; gap: 10px; justify-content: center;">
                    <button class="btn btn--primary" onclick="appInstance.addActivity('${position}')">Add Activity</button>
                    <button class="btn btn--secondary" onclick="appInstance.closeNewCardForm()">Cancel</button>
                </div>
            </div>
        `;
        
        // Insert emoji picker directly
        const slot = panel.querySelector('#newEmojiSlot');
        if (slot) {
            const picker = EmojiPicker.createEmojiPicker(
                selectedEmoji,
                (emoji) => this.app.selectNewEmoji(emoji),
                'newActivityEmoji'
            );
            slot.replaceWith(picker);
        }
        
        // Add direct emoji editing
        setTimeout(() => {
            const iconElement = document.getElementById('newActivityIcon');
            if (iconElement) {
                iconElement.addEventListener('click', () => {
                    const newEmoji = prompt('Enter a new emoji:', this.appState.ui.selectedEmoji);
                    if (newEmoji && newEmoji.trim()) {
                        // Extract first emoji from input
                        const emojiMatch = newEmoji.match(/(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
                        if (emojiMatch) {
                            this.app.selectNewEmoji(emojiMatch[0]);
                        } else {
                            alert('Please enter a valid emoji');
                        }
                    }
                });
            }
        }, 0);
        
        // Add focus/blur handlers to clear placeholders
        setTimeout(() => {
            const titleInput = document.getElementById('newActivityTitle');
            const descInput = document.getElementById('newActivityDescription');
            
            if (titleInput) {
                titleInput.addEventListener('focus', () => {
                    if (titleInput.value === '') titleInput.placeholder = '';
                });
                titleInput.addEventListener('blur', () => {
                    if (titleInput.value === '') titleInput.placeholder = 'New activity...';
                });
            }
            
            if (descInput) {
                descInput.addEventListener('focus', () => {
                    if (descInput.value === '') descInput.placeholder = '';
                });
                descInput.addEventListener('blur', () => {
                    if (descInput.value === '') descInput.placeholder = 'Remember to make it fun!';
                });
            }
        }, 0);
        
        return panel;
    }

    renderActivityCards() {
        const activitiesToShow = this.appState.ui.editMode 
            ? this.appState.activities 
            : this.appState.activities.filter(activity => activity.visible);

        activitiesToShow.forEach((activity, displayIndex) => {
            const originalIndex = this.appState.activities.indexOf(activity);
            const card = new ActivityCard(activity, originalIndex, this.appState, this, this.app);
            const cardElement = card.render();
            
            // RESTORE COMPLETION STATE
            if (activity.completed) {
                cardElement.classList.add('card--completed');
            }
            
            // Ensure clean state for drag and drop
            cardElement.style.transform = '';
            cardElement.style.transition = '';
            cardElement.classList.remove('card--dragging', 'card--drop-target', 'card--droppable', 'card--shifting');
            
            this.container.appendChild(cardElement);
        });
    }

    // HELPER METHOD FOR COLOR CONVERSION
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    updateUIState() {
        // UI state is now handled by icon changes in enterGrownupMode/exitGrownupMode
        // No longer need to update button states here
    }

    createConfetti() {
        const colors = [this.appState.settings.backgroundColor, '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
        
        for (let i = 0; i < CONFIG.CONFETTI_COUNT; i++) {
            const confetti = ComponentBuilder.createElement('div', 'confetti');
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 1 + 's';
            confetti.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }
    }

    createFireworks() {
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
                       '#FF6348', '#DDA0DD', '#98FB98', '#87CEEB', '#FF69B4', '#00CED1',
                       '#FF1493', '#00FA9A', '#FFB6C1', '#20B2AA', '#FFA500', '#ADFF2F'];
        
        // Create multiple firework bursts at random positions
        for (let burst = 0; burst < 12; burst++) {
            setTimeout(() => {
                // Random position across the entire screen
                const x = 10 + Math.random() * 80;
                const y = 10 + Math.random() * 80;
                const burstColor = colors[Math.floor(Math.random() * colors.length)];
                const particleCount = 15 + Math.floor(Math.random() * 10);
                const burstSize = 0.8 + Math.random() * 0.6; // Vary the size
                
                // Create burst center flash
                const flash = ComponentBuilder.createElement('div', 'firework-burst');
                flash.style.left = x + '%';
                flash.style.top = y + '%';
                flash.style.width = '20px';
                flash.style.height = '20px';
                flash.style.background = burstColor;
                flash.style.boxShadow = `0 0 20px ${burstColor}, 0 0 40px ${burstColor}`;
                flash.style.transform = 'translate(-50%, -50%)';
                
                document.body.appendChild(flash);
                
                // Flash and remove
                flash.animate([
                    { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
                    { transform: 'translate(-50%, -50%) scale(2)', opacity: 0 }
                ], {
                    duration: 300,
                    easing: 'ease-out'
                });
                
                setTimeout(() => flash.remove(), 300);
                
                // Create particles
                for (let i = 0; i < particleCount; i++) {
                    const particle = ComponentBuilder.createElement('div', 'firework-particle');
                    const angle = (Math.PI * 2 * i) / particleCount;
                    const velocity = (40 + Math.random() * 40) * burstSize;
                    const particleSize = (4 + Math.random() * 6) + 'px';
                    const particleColor = Math.random() > 0.5 ? burstColor : colors[Math.floor(Math.random() * colors.length)];
                    
                    // Starting position
                    particle.style.left = x + '%';
                    particle.style.top = y + '%';
                    particle.style.width = particleSize;
                    particle.style.height = particleSize;
                    particle.style.background = particleColor;
                    particle.style.boxShadow = `0 0 6px ${particleColor}`;
                    
                    // Calculate end position
                    const endX = Math.cos(angle) * velocity;
                    const endY = Math.sin(angle) * velocity;
                    
                    document.body.appendChild(particle);
                    
                    // Animate the particle
                    particle.animate([
                        { 
                            transform: `translate(-50%, -50%)`,
                            opacity: 1
                        },
                        { 
                            transform: `translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px))`,
                            opacity: 0
                        }
                    ], {
                        duration: 1500,
                        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    });
                    
                    setTimeout(() => particle.remove(), 1500);
                }
            }, burst * 300); // Stagger the bursts
        }
        
        // Add some extra sparkles for atmosphere
        for (let sparkle = 0; sparkle < 20; sparkle++) {
            setTimeout(() => {
                const spark = ComponentBuilder.createElement('div', 'firework-particle');
                spark.style.left = Math.random() * 100 + '%';
                spark.style.top = Math.random() * 100 + '%';
                spark.style.width = '6px';
                spark.style.height = '6px';
                spark.style.background = colors[Math.floor(Math.random() * colors.length)];
                spark.style.boxShadow = `0 0 8px currentColor`;
                
                document.body.appendChild(spark);
                
                spark.animate([
                    { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
                    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                    { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 }
                ], {
                    duration: 800,
                    easing: 'ease-in-out'
                });
                
                setTimeout(() => spark.remove(), 800);
            }, Math.random() * 3000);
        }
    }
}