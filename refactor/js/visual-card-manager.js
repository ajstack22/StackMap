/**
 * Visual Card Manager for StackMap
 * Manages visual activity cards with emoji-first design
 * Optimized for ADHD/autism users with visual learning preferences
 */

class VisualCardManager {
    constructor() {
        this.cards = new Map();
        this.isInitialized = false;
        
        // Card type definitions
        this.cardTypes = {
            single: {
                name: 'Single Use',
                behavior: 'complete-once',
                icon: '1️⃣',
                description: 'Complete once and done'
            },
            recurring: {
                name: 'Daily Recurring',
                behavior: 'reset-daily',
                icon: '🔄',
                description: 'Resets every day'
            },
            frequent: {
                name: 'Always Available',
                behavior: 'always-available',
                icon: '♾️',
                description: 'Can be done multiple times'
            }
        };
        
        // Default card colors (WCAG AA compliant with white text)
        this.defaultColors = [
            '#667eea', // Purple (default)
            '#4a90e2', // Blue
            '#4ade80', // Green
            '#f97316', // Orange
            '#ef4444', // Red
            '#8b5cf6'  // Violet
        ];
        
        // Card state definitions
        this.cardStates = {
            active: 'active',
            completed: 'completed',
            disabled: 'disabled',
            inProgress: 'in-progress'
        };
    }
    
    /**
     * Initialize the visual card system
     */
    async init() {
        if (this.isInitialized) return;
        
        console.log('[VisualCardManager] Initializing...');
        
        // Load existing cards from storage
        await this.loadCards();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Create default cards if none exist (for first-time users)
        if (this.cards.size === 0 && !localStorage.getItem('stackmap_visual_cards_initialized')) {
            console.log('[VisualCardManager] No cards found, creating defaults for new user');
            this.createDefaultCards();
            localStorage.setItem('stackmap_visual_cards_initialized', 'true');
        }
        
        this.isInitialized = true;
        console.log('[VisualCardManager] Initialized with ' + this.cards.size + ' cards');
    }
    
    /**
     * Create a new visual card
     */
    createCard(data) {
        // Validate required fields
        if (!data.emoji) {
            throw new Error('Card must have an emoji');
        }
        
        // Validate title length
        if (data.title && data.title.length > 13) {
            data.title = data.title.substring(0, 13);
        }
        
        // Generate unique ID
        const id = data.id || `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create card object
        const card = {
            id,
            taskId: data.taskId || null,
            emoji: data.emoji,
            title: data.title || '',
            description: data.description || '',
            color: data.color || this.defaultColors[0],
            type: data.type || 'single',
            position: data.position || this.cards.size,
            state: data.state || this.cardStates.active,
            completedAt: null,
            completedCount: 0,
            created: Date.now(),
            modified: Date.now(),
            // Accessibility
            ariaLabel: data.ariaLabel || this.generateAriaLabel(data)
        };
        
        // Validate card type
        if (!this.cardTypes[card.type]) {
            card.type = 'single';
        }
        
        // Store in memory
        this.cards.set(id, card);
        
        // Persist to storage
        this.saveCard(card);
        
        // Dispatch event
        this.dispatchCardEvent('card-created', card);
        
        return card;
    }
    
    /**
     * Update an existing card
     */
    updateCard(id, updates) {
        const card = this.cards.get(id);
        if (!card) {
            console.warn(`[VisualCardManager] Card ${id} not found`);
            return null;
        }
        
        // Validate updates
        if (updates.title && updates.title.length > 13) {
            updates.title = updates.title.substring(0, 13);
        }
        
        // Apply updates
        Object.assign(card, updates, {
            modified: Date.now()
        });
        
        // Update aria label if content changed
        if (updates.emoji || updates.title) {
            card.ariaLabel = this.generateAriaLabel(card);
        }
        
        // Save changes
        this.saveCard(card);
        
        // Dispatch event
        this.dispatchCardEvent('card-updated', card);
        
        return card;
    }
    
    /**
     * Toggle card completion
     */
    toggleCardCompletion(id) {
        const card = this.cards.get(id);
        if (!card) return null;
        
        // Handle based on card type
        switch (card.type) {
            case 'single':
                if (card.state === this.cardStates.completed) {
                    // Uncomplete
                    card.state = this.cardStates.active;
                    card.completedAt = null;
                } else {
                    // Complete
                    card.state = this.cardStates.completed;
                    card.completedAt = Date.now();
                }
                break;
                
            case 'recurring':
                // Always toggle between active and completed
                if (card.state === this.cardStates.completed) {
                    card.state = this.cardStates.active;
                    card.completedAt = null;
                } else {
                    card.state = this.cardStates.completed;
                    card.completedAt = Date.now();
                    card.completedCount++;
                }
                break;
                
            case 'frequent':
                // Always mark as completed temporarily
                card.state = this.cardStates.completed;
                card.completedAt = Date.now();
                card.completedCount++;
                
                // Reset after animation
                setTimeout(() => {
                    card.state = this.cardStates.active;
                    this.saveCard(card);
                    this.dispatchCardEvent('card-reset', card);
                }, 2000);
                break;
        }
        
        // Save state
        this.saveCard(card);
        
        // Sync with task if linked
        if (card.taskId) {
            this.syncCardToTask(card);
        }
        
        // Dispatch completion event
        this.dispatchCardEvent('card-toggled', card);
        
        // Trigger celebration for completion
        if (card.state === this.cardStates.completed) {
            this.triggerCelebration(card);
        }
        
        return card;
    }
    
    /**
     * Delete a card
     */
    deleteCard(id) {
        const card = this.cards.get(id);
        if (!card) return false;
        
        // Remove from memory
        this.cards.delete(id);
        
        // Remove from storage
        this.saveToLocalStorage();
        
        // Dispatch event
        this.dispatchCardEvent('card-deleted', card);
        
        return true;
    }
    
    /**
     * Get all cards
     */
    getAllCards() {
        return Array.from(this.cards.values())
            .sort((a, b) => a.position - b.position);
    }
    
    /**
     * Get cards by type
     */
    getCardsByType(type) {
        return this.getAllCards().filter(card => card.type === type);
    }
    
    /**
     * Get active cards
     */
    getActiveCards() {
        return this.getAllCards().filter(card => 
            card.state === this.cardStates.active || 
            card.state === this.cardStates.inProgress
        );
    }
    
    /**
     * Reset daily cards
     */
    resetDailyCards() {
        const recurringCards = this.getCardsByType('recurring');
        const today = new Date().toDateString();
        
        recurringCards.forEach(card => {
            if (card.completedAt) {
                const completedDate = new Date(card.completedAt).toDateString();
                if (completedDate !== today) {
                    // Reset card for new day
                    card.state = this.cardStates.active;
                    card.completedAt = null;
                    this.saveCard(card);
                }
            }
        });
        
        console.log(`[VisualCardManager] Reset ${recurringCards.length} daily cards`);
    }
    
    /**
     * Reorder cards
     */
    reorderCards(cardId, newPosition) {
        const cards = this.getAllCards();
        const cardIndex = cards.findIndex(c => c.id === cardId);
        
        if (cardIndex === -1) return;
        
        // Remove card from current position
        const [card] = cards.splice(cardIndex, 1);
        
        // Insert at new position
        cards.splice(newPosition, 0, card);
        
        // Update positions
        cards.forEach((c, index) => {
            c.position = index;
            this.saveCard(c);
        });
        
        this.dispatchCardEvent('cards-reordered', { cards });
    }
    
    /**
     * Sync card state to linked task
     */
    syncCardToTask(card) {
        if (!card.taskId || !window.TaskDisplay) return;
        
        // Find task
        const task = window.TaskDisplay.tasks.find(t => t.id === card.taskId);
        if (!task) return;
        
        // Update task completion state
        task.completed = card.state === this.cardStates.completed;
        task.title = card.title || card.emoji;
        
        // Save task
        window.TaskDisplay.saveTasks();
        
        console.log(`[VisualCardManager] Synced card ${card.id} to task ${task.id}`);
    }
    
    /**
     * Sync task to card
     */
    syncTaskToCard(task) {
        // Find card linked to this task
        const card = Array.from(this.cards.values()).find(c => c.taskId === task.id);
        if (!card) return;
        
        // Update card state
        card.state = task.completed ? this.cardStates.completed : this.cardStates.active;
        card.title = task.title.substring(0, 13);
        
        this.saveCard(card);
        this.dispatchCardEvent('card-updated', card);
    }
    
    /**
     * Load cards from storage
     */
    async loadCards() {
        // Always use localStorage for now - SQLite integration can come later
        try {
            const stored = localStorage.getItem('stackmap_visual_cards');
            if (stored) {
                const cards = JSON.parse(stored);
                cards.forEach(card => {
                    this.cards.set(card.id, card);
                });
                console.log(`[VisualCardManager] Loaded ${cards.length} cards from localStorage`);
            } else {
                console.log('[VisualCardManager] No cards found in localStorage');
            }
            
            // Reset daily cards if needed
            this.resetDailyCards();
        } catch (error) {
            console.error('[VisualCardManager] Failed to load cards from localStorage:', error);
            // Continue with empty cards
        }
    }
    
    /**
     * Save card to storage
     */
    saveCard(card) {
        // Always use localStorage for now
        this.saveToLocalStorage();
    }
    
    /**
     * Save all cards to localStorage
     */
    saveToLocalStorage() {
        try {
            const cards = Array.from(this.cards.values());
            localStorage.setItem('stackmap_visual_cards', JSON.stringify(cards));
        } catch (error) {
            console.error('[VisualCardManager] Failed to save cards to localStorage:', error);
        }
    }
    
    /**
     * Generate accessible label for card
     */
    generateAriaLabel(card) {
        const type = this.cardTypes[card.type]?.name || 'Card';
        const title = card.title || 'Untitled';
        const state = card.state === this.cardStates.completed ? 'completed' : 'not completed';
        
        return `${type}: ${card.emoji} ${title}, ${state}`;
    }
    
    /**
     * Trigger celebration animation
     */
    triggerCelebration(card) {
        if (document.body.classList.contains('safe-mode')) {
            // Simple celebration for safe mode
            document.dispatchEvent(new CustomEvent('celebrate', {
                detail: {
                    type: 'small',
                    message: `${card.emoji} Done!`,
                    duration: 1500
                }
            }));
        } else {
            // Normal celebration
            document.dispatchEvent(new CustomEvent('celebrate', {
                detail: {
                    type: card.type === 'frequent' ? 'small' : 'medium',
                    message: `${card.emoji} ${card.title || 'Complete'}!`,
                    duration: 2000
                }
            }));
        }
    }
    
    /**
     * Dispatch card events
     */
    dispatchCardEvent(eventName, detail) {
        document.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for task updates
        document.addEventListener('task-updated', (e) => {
            this.syncTaskToCard(e.detail);
        });
        
        // Listen for daily reset (midnight)
        this.scheduleDailyReset();
    }
    
    /**
     * Schedule daily reset
     */
    scheduleDailyReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const msUntilMidnight = tomorrow - now;
        
        setTimeout(() => {
            this.resetDailyCards();
            // Schedule next reset
            this.scheduleDailyReset();
        }, msUntilMidnight);
        
        console.log(`[VisualCardManager] Daily reset scheduled in ${msUntilMidnight}ms`);
    }
    
    /**
     * Create default cards for new users
     */
    createDefaultCards() {
        // Fallback defaults based on common special needs activities
        // The activity library tool will handle which activities users actually see
        const defaults = [
            { emoji: '🌞', title: 'Morning Stretch', description: 'Wake up your body!', type: 'recurring', color: this.defaultColors[0] },
            { emoji: '🦷', title: 'Brush Teeth', description: 'Keep them clean and shiny!', type: 'recurring', color: this.defaultColors[1] },
            { emoji: '👕', title: 'Get Dressed', description: 'Pick your favorite outfit!', type: 'single', color: this.defaultColors[2] },
            { emoji: '💧', title: 'Water Break', description: 'Hydration station!', type: 'frequent', color: this.defaultColors[3] },
            { emoji: '🧘', title: 'Quiet Time', description: 'Peaceful moments!', type: 'frequent', color: this.defaultColors[4] }
        ];
        
        defaults.forEach((cardData, index) => {
            cardData.position = index;
            this.createCard(cardData);
        });
        
        console.log(`[VisualCardManager] Created ${defaults.length} default cards`);
    }
    
    /**
     * Create card from activity
     */
    createCardFromActivity(activity) {
        const cardData = {
            emoji: activity.icon,
            title: activity.title,
            description: activity.description,
            type: this.determineCardType(activity.title),
            color: this.defaultColors[this.cards.size % this.defaultColors.length],
            activityId: activity.id // Link to activity if it has an ID
        };
        
        return this.createCard(cardData);
    }
    
    /**
     * Determine card type based on activity
     */
    determineCardType(title) {
        // Recurring daily activities
        const recurringActivities = ['Brush Teeth', 'Morning Stretch', 'Bedtime', 'Take Medicine', 'Breakfast Time', 'Dinner Time'];
        if (recurringActivities.some(activity => title.includes(activity))) {
            return 'recurring';
        }
        
        // Frequent activities that can be done multiple times
        const frequentActivities = ['Water', 'Snack', 'Break', 'Deep Breath', 'Quiet Time', 'Sensory'];
        if (frequentActivities.some(activity => title.includes(activity))) {
            return 'frequent';
        }
        
        // Default to single use
        return 'single';
    }
}

// Export as singleton
window.VisualCardManager = new VisualCardManager();