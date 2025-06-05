// ModernDaySelector.js - Custom day selector with expandable modal UI
class ModernDaySelector {
    constructor(container, appInstance) {
        this.container = container;
        this.app = appInstance;
        this.isOpen = false;
        this.currentView = 'today';
        
        // Feature detection
        if (this.supportsModernFeatures()) {
            this.render();
            this.setupEventListeners();
        }
    }
    
    supportsModernFeatures() {
        return 'classList' in document.documentElement &&
               'addEventListener' in window &&
               CSS.supports('display', 'flex');
    }
    
    render() {
        // Create modern selector structure matching user selector
        this.selector = ComponentBuilder.createElement('div', 'modern-selector day-selector-modern');
        this.selector.setAttribute('role', 'button');
        this.selector.setAttribute('aria-haspopup', 'dialog');
        this.selector.setAttribute('aria-expanded', 'false');
        this.selector.tabIndex = 0;
        
        // Create content container
        const content = ComponentBuilder.createElement('div', 'day-selector-content');
        
        // Day info section - similar to user-info
        this.dayInfo = ComponentBuilder.createElement('div', 'day-info');
        
        // Day icon - similar to user avatar
        this.dayIcon = ComponentBuilder.createElement('div', 'day-icon');
        
        // Day details - similar to user details
        this.dayDetails = ComponentBuilder.createElement('div', 'day-details');
        this.dayName = ComponentBuilder.createElement('div', 'day-name');
        
        this.dayDetails.appendChild(this.dayName);
        
        this.dayInfo.appendChild(this.dayIcon);
        this.dayInfo.appendChild(this.dayDetails);
        
        // Selector icon
        this.icon = ComponentBuilder.createElement('div', 'selector-icon');
        this.icon.innerHTML = '▼';
        
        content.appendChild(this.dayInfo);
        content.appendChild(this.icon);
        
        this.selector.appendChild(content);
        
        // Create expandable modal
        this.createModal();
        
        // Create backdrop
        this.backdrop = ComponentBuilder.createElement('div', 'selector-backdrop');
        document.body.appendChild(this.backdrop);
        
        // Insert selector
        this.container.appendChild(this.selector);
        
        // Update with current day
        this.updateDisplay();
    }
    
    createModal() {
        this.modal = ComponentBuilder.createElement('div', 'day-modal');
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');
        this.modal.setAttribute('aria-labelledby', 'day-modal-title');
        
        // Modal content
        const modalContent = ComponentBuilder.createElement('div', 'day-modal-content');
        
        // Modal header
        const modalHeader = ComponentBuilder.createElement('div', 'day-modal-header');
        const modalTitle = ComponentBuilder.createElement('h3', 'day-modal-title');
        modalTitle.id = 'day-modal-title';
        modalTitle.textContent = 'Plan Your Days';
        modalHeader.appendChild(modalTitle);
        
        // Day options container
        this.dayOptions = ComponentBuilder.createElement('div', 'day-modal-options');
        
        // Today option
        const todayOption = this.createDayOption('today', 'Today', '📅');
        this.dayOptions.appendChild(todayOption);
        
        // Tomorrow option
        const tomorrowOption = this.createDayOption('tomorrow', 'Tomorrow', '⏰');
        this.dayOptions.appendChild(tomorrowOption);
        
        // Complete day button
        const completeSection = ComponentBuilder.createElement('div', 'day-modal-complete');
        const completeBtn = ComponentBuilder.createElement('button', 'btn btn--complete-day');
        completeBtn.innerHTML = '<span class="material-icons">check_circle</span> Complete Today';
        completeBtn.onclick = () => {
            this.close();
            this.app.showCompleteDayConfirmation();
        };
        
        const completeHint = ComponentBuilder.createElement('p', 'day-modal-hint');
        completeHint.textContent = 'Move tomorrow\'s activities to today';
        
        completeSection.appendChild(completeBtn);
        completeSection.appendChild(completeHint);
        
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(this.dayOptions);
        modalContent.appendChild(completeSection);
        
        this.modal.appendChild(modalContent);
        document.body.appendChild(this.modal);
    }
    
    createDayOption(day, label, icon) {
        const option = ComponentBuilder.createElement('div', 'day-modal-option');
        option.setAttribute('data-day', day);
        option.setAttribute('role', 'button');
        option.tabIndex = 0;
        
        const optionIcon = ComponentBuilder.createElement('div', 'day-modal-option-icon');
        optionIcon.textContent = icon;
        
        const optionContent = ComponentBuilder.createElement('div', 'day-modal-option-content');
        
        const optionTitle = ComponentBuilder.createElement('div', 'day-modal-option-title');
        optionTitle.textContent = label;
        
        const optionCount = ComponentBuilder.createElement('div', 'day-modal-option-count');
        optionCount.id = `${day}ModalCount`;
        
        const optionActivities = ComponentBuilder.createElement('div', 'day-modal-option-activities');
        optionActivities.id = `${day}Activities`;
        
        optionContent.appendChild(optionTitle);
        optionContent.appendChild(optionCount);
        optionContent.appendChild(optionActivities);
        
        option.appendChild(optionIcon);
        option.appendChild(optionContent);
        
        // Click handler
        option.onclick = () => {
            this.selectDay(day);
        };
        
        // Keyboard handler for accessibility
        option.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.selectDay(day);
            }
        };
        
        return option;
    }
    
    updateDisplay() {
        const currentDay = this.app.appState.getCurrentDay();
        const counts = this.app.getDayCounts();
        
        if (currentDay === 'today') {
            this.dayIcon.textContent = '📅';
            this.dayName.textContent = 'Today';
        } else {
            this.dayIcon.textContent = '⏰';
            this.dayName.textContent = 'Tomorrow';
        }
        
        // Update aria label
        this.selector.setAttribute('aria-label', 
            `Select day. Currently viewing ${currentDay}. ${currentDay === 'today' ? counts.today : counts.tomorrow} activities`);
        
        // Ensure selector is focusable
        if (!this.selector.hasAttribute('tabindex')) {
            this.selector.tabIndex = 0;
        }
        
        // Update modal counts
        this.updateModalCounts();
    }
    
    updateModalCounts() {
        const counts = this.app.getDayCounts();
        const user = this.app.appState.getCurrentUser();
        
        // Update today
        const todayCount = document.getElementById('todayModalCount');
        if (todayCount) {
            todayCount.textContent = `${counts.today} activities`;
        }
        
        const todayActivities = document.getElementById('todayActivities');
        if (todayActivities) {
            const todayPreview = user.activities
                .filter(a => a.visible)
                .slice(0, 3)
                .map(a => a.icon)
                .join(' ');
            todayActivities.textContent = todayPreview;
        }
        
        // Update tomorrow
        const tomorrowCount = document.getElementById('tomorrowModalCount');
        if (tomorrowCount) {
            tomorrowCount.textContent = `${counts.tomorrow} activities`;
        }
        
        const tomorrowActivities = document.getElementById('tomorrowActivities');
        if (tomorrowActivities) {
            const tomorrowPreview = user.tomorrowActivities
                .filter(a => a.visible)
                .slice(0, 3)
                .map(a => a.icon)
                .join(' ');
            tomorrowActivities.textContent = tomorrowPreview;
        }
        
        // Update active state
        document.querySelectorAll('.day-modal-option').forEach(option => {
            const day = option.getAttribute('data-day');
            if (day === this.app.appState.getCurrentDay()) {
                option.classList.add('day-modal-option--active');
            } else {
                option.classList.remove('day-modal-option--active');
            }
        });
    }
    
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.updateModalCounts();
        
        // Update states
        this.selector.classList.add('modern-selector--open');
        this.selector.setAttribute('aria-expanded', 'true');
        this.modal.classList.add('day-modal--open');
        this.backdrop.classList.add('selector-backdrop--open');
        
        // Focus management
        this.previousFocus = document.activeElement;
        
        // Focus first option in modal for better accessibility
        setTimeout(() => {
            const firstOption = this.modal.querySelector('.day-modal-option');
            if (firstOption) {
                firstOption.focus();
            }
        }, 100);
        
        // Announce to screen readers
        this.announceToScreenReader('Day selector opened');
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        
        // Update states
        this.selector.classList.remove('modern-selector--open');
        this.selector.setAttribute('aria-expanded', 'false');
        this.modal.classList.remove('day-modal--open');
        this.backdrop.classList.remove('selector-backdrop--open');
        
        // Return focus
        if (this.previousFocus) {
            this.previousFocus.focus();
        } else {
            this.selector.focus();
        }
    }
    
    selectDay(day) {
        this.app.switchDay(day);
        this.updateDisplay();
        this.close();
    }
    
    setupEventListeners() {
        // Selector click
        this.selector.addEventListener('click', () => {
            this.isOpen ? this.close() : this.open();
        });
        
        // Keyboard navigation
        this.selector.addEventListener('keydown', (e) => {
            this.handleSelectorKeydown(e);
        });
        
        // Backdrop click - Fix for test
        this.backdrop.addEventListener('click', (e) => {
            if (e.target === this.backdrop) {
                this.close();
            }
        });
        
        // Escape key handling for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                e.preventDefault();
                this.close();
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            if (this.isOpen) {
                this.positionModal();
            }
        });
    }
    
    handleSelectorKeydown(e) {
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.isOpen ? this.close() : this.open();
                break;
                
            case 'ArrowLeft':
            case 'ArrowRight':
                e.preventDefault();
                // Quick switch between days
                const currentDay = this.app.appState.getCurrentDay();
                const newDay = currentDay === 'today' ? 'tomorrow' : 'today';
                this.selectDay(newDay);
                break;
        }
    }
    
    positionModal() {
        // Center the modal on screen
        const modalRect = this.modal.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Vertical centering
        const top = Math.max(20, (viewportHeight - modalRect.height) / 2);
        this.modal.style.top = `${top}px`;
        
        // Horizontal centering
        const left = Math.max(20, (viewportWidth - modalRect.width) / 2);
        this.modal.style.left = `${left}px`;
    }
    
    announceToScreenReader(message) {
        const announcement = ComponentBuilder.createElement('div', 'sr-only');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }
    
    destroy() {
        // Clean up event listeners
        this.selector.remove();
        this.modal.remove();
        this.backdrop.remove();
    }
}

// Make available globally
window.ModernDaySelector = ModernDaySelector;