// renderer.js - Application rendering logic with management cards and edit mode info card removed
// === MAIN RENDERER ===
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
        // Story 4: Header updates are now handled by day selector
        // No subtitle to update anymore
        this.app.updateDayCounts();
    }

    updateButtonPositioning() {
        // Story 4: Button positioning is now simpler with day selector always present
        // No need for has-subtitle class anymore
    }

    renderActivities() {
        if (!this.container) return;
        
        // Clear container
        this.container.innerHTML = '';
        
        // Add a spacer div at the very beginning to push cards down
        const spacer = document.createElement('div');
        const isMobile = window.innerWidth <= 768;
        spacer.style.height = '60px'; // Same height for both mobile and desktop
        spacer.style.width = '100%';
        spacer.style.gridColumn = '1 / -1';
        this.container.appendChild(spacer);
        
        // Create a document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        // NOTE: Management cards replaced by FAB system
        // FAB system handles edit mode actions now - no management cards needed
        if (this.appState.ui.editMode) {
            // console.log('Rendering in edit mode - FAB handles edit actions');
            // console.log('Current day:', this.appState.getCurrentDay());
            // console.log('Current activities:', this.appState.getCurrentActivities().length);
            
            // Only show new card form if actively creating a card
            if (this.appState.ui.showingNewCardForm === 'top') {
                fragment.appendChild(this.createActivityGenerator('top'));
            }
        }

        // Render activity cards
        this.renderActivityCards(fragment);
        
        // NOTE: Bottom management card removed - FAB handles all edit actions
        if (this.appState.ui.editMode && this.appState.ui.showingNewCardForm === 'bottom') {
            fragment.appendChild(this.createActivityGenerator('bottom'));
        }
        
        // Append all at once
        this.container.appendChild(fragment);
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
            <div class="card__icon" id="newActivityIcon" style="font-size: 3rem; height: 60px; margin-bottom: 10px; margin-top: 5px;">${selectedEmoji}</div>
            <div class="emoji-picker-slot" id="newEmojiSlot"></div>
            <div style="margin-top: 12px;">
                <input type="text" class="form-field form-field--title" 
                       id="newActivityTitle" placeholder="New activity..." maxlength="${CONFIG.MAX_TITLE_LENGTH}" 
                       autocomplete="off"
                       style="font-size: 1.5rem; padding: 10px 14px;">
                <input type="text" class="form-field form-field--description" 
                       id="newActivityDescription" placeholder="Remember to make it fun!" 
                       maxlength="${CONFIG.MAX_DESCRIPTION_LENGTH}" 
                       autocomplete="off"
                       style="margin-top: 8px; font-size: 1rem; padding: 8px 12px;">
                <div style="margin-top: 12px; display: flex; gap: 10px; justify-content: center;">
                    <button class="btn btn--primary" onclick="appInstance.addActivity('${position}')">Add Activity</button>
                    <button class="btn btn--secondary" onclick="appInstance.closeNewCardForm()">Cancel</button>
                </div>
            </div>
        `;
        
        // Insert emoji picker directly
        const slot = panel.querySelector('#newEmojiSlot');
        if (slot) {
            const picker = ComponentBuilder.createEmojiPicker(
                selectedEmoji,
                (emoji) => this.app.selectNewEmoji(emoji),
                'newActivityEmoji'
            );
            slot.replaceWith(picker);
        }
        
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

    renderActivityCards(fragment) {
        // Story 4: Use context-aware activities
        const currentActivities = this.appState.getCurrentActivities();
        // Show all activities since we removed the visibility toggle
        let activitiesToShow = currentActivities;

        // Get current user settings for display mode
        const currentUser = this.appState.getCurrentUser();
        const userSettings = currentUser?.settings || {};
        const displayMode = userSettings.displayMode || this.appState.settings.displayMode || 'numbers';

        // Sort activities based on display mode
        if (displayMode === 'times') {
            // Sort by time when in times mode
            activitiesToShow = [...activitiesToShow].sort((a, b) => {
                // Parse times (convert to minutes for comparison)
                const timeA = this.parseTimeToMinutes(a.time);
                const timeB = this.parseTimeToMinutes(b.time);
                
                // Activities without times go to the end
                if (timeA === null && timeB === null) return 0;
                if (timeA === null) return 1;
                if (timeB === null) return -1;
                
                return timeA - timeB;
            });
        } else {
            // Sort by card number in numbers mode or default
            activitiesToShow = [...activitiesToShow].sort((a, b) => {
                const numA = a.cardNumber || currentActivities.indexOf(a) + 1;
                const numB = b.cardNumber || currentActivities.indexOf(b) + 1;
                return numA - numB;
            });
        }

        activitiesToShow.forEach((activity, displayIndex) => {
            const originalIndex = currentActivities.indexOf(activity);
            const card = new ActivityCard(activity, originalIndex, this.appState, this, this.app);
            const cardElement = card.render();
            
            // Apply completed state if needed
            if (activity.completed) {
                cardElement.classList.add('card--completed');
            }
            
            fragment.appendChild(cardElement);
        });
    }

    parseTimeToMinutes(timeStr) {
        if (!timeStr || !timeStr.trim()) return null;
        
        // Handle various time formats
        const time = timeStr.trim().toLowerCase();
        let hours = 0;
        let minutes = 0;
        
        // Try to parse 12-hour format (e.g., "2:30pm", "8:00am")
        const twelveHourMatch = time.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
        if (twelveHourMatch) {
            hours = parseInt(twelveHourMatch[1]);
            minutes = parseInt(twelveHourMatch[2]);
            const period = twelveHourMatch[3];
            
            if (period === 'pm' && hours !== 12) hours += 12;
            if (period === 'am' && hours === 12) hours = 0;
        } else {
            // Try to parse 24-hour format (e.g., "14:30", "08:00")
            const twentyFourHourMatch = time.match(/^(\d{1,2}):(\d{2})$/);
            if (twentyFourHourMatch) {
                hours = parseInt(twentyFourHourMatch[1]);
                minutes = parseInt(twentyFourHourMatch[2]);
            } else {
                // Try simple hour format (e.g., "2pm", "8am")
                const simpleMatch = time.match(/^(\d{1,2})\s*(am|pm)$/);
                if (simpleMatch) {
                    hours = parseInt(simpleMatch[1]);
                    const period = simpleMatch[2];
                    
                    if (period === 'pm' && hours !== 12) hours += 12;
                    if (period === 'am' && hours === 12) hours = 0;
                }
            }
        }
        
        // Return total minutes since midnight
        return (hours * 60) + minutes;
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

// Make available globally
window.AppRenderer = AppRenderer;