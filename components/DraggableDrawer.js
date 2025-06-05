class DraggableDrawer {
    constructor(containerId, isFixed = false) {
        this.containerId = containerId;
        this.isFixed = isFixed;
        this.prefix = isFixed ? 'fixed' : 'static';
        this.isOpen = false;
        this.startY = 0;
        this.currentY = 0;
        this.drawerHeight = 350; // Max height of drawer
        this.threshold = 50; // Drag threshold to toggle states
        
        // Get DOM elements
        this.container = document.querySelector(`.${containerId} .expandable-header-container`);
        this.indicator = document.getElementById(`${this.prefix}ExpansionIndicator`);
        this.submenu = document.getElementById(`${this.prefix}SubmenuContainer`);
        this.closeBtn = document.getElementById(`${this.prefix}SubmenuClose`);
        this.backdrop = null;
        
        this.init();
    }
    
    init() {
        console.log('Initializing drawer for:', this.containerId);
        console.log('Container:', this.container);
        console.log('Indicator:', this.indicator);
        console.log('Submenu:', this.submenu);
        
        if (!this.container || !this.indicator || !this.submenu) {
            console.error('Missing required elements for drawer');
            return;
        }
        
        // Create backdrop
        this.createBackdrop();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Render selectors
        this.renderUserSelector();
        this.renderDaySelector();
        
        // Set initial drawer state
        this.setDrawerHeight(0);
    }
    
    createBackdrop() {
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'drawer-backdrop';
        this.backdrop.setAttribute('aria-hidden', 'true');
        document.body.appendChild(this.backdrop);
    }
    
    setupEventListeners() {
        // Touch events for mobile
        this.indicator.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.indicator.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.indicator.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Mouse events for desktop
        this.indicator.addEventListener('mousedown', this.handleMouseDown.bind(this));
        
        // Click to toggle
        this.indicator.addEventListener('click', (e) => {
            // Only toggle on direct click, not after dragging
            if (!this.isDragging) {
                this.toggle();
            }
        });
        
        // Keyboard support
        this.indicator.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            }
        });
        
        // Close button
        this.closeBtn?.addEventListener('click', () => this.close());
        
        // Backdrop click to close
        this.backdrop?.addEventListener('click', () => this.close());
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    handleTouchStart(e) {
        this.startY = e.touches[0].clientY;
        this.isDragging = false;
        this.submenu.style.transition = 'none';
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        this.currentY = e.touches[0].clientY;
        const deltaY = this.startY - this.currentY;
        this.isDragging = true;
        
        if (this.isOpen) {
            // Dragging down to close
            const newHeight = this.drawerHeight + deltaY;
            this.setDrawerHeight(Math.max(0, Math.min(this.drawerHeight, newHeight)));
        } else {
            // Dragging up to open
            const newHeight = Math.max(0, deltaY);
            this.setDrawerHeight(Math.min(this.drawerHeight, newHeight));
        }
    }
    
    handleTouchEnd() {
        this.submenu.style.transition = '';
        const deltaY = this.startY - this.currentY;
        
        if (Math.abs(deltaY) > this.threshold) {
            if (deltaY > 0 && !this.isOpen) {
                this.open();
            } else if (deltaY < 0 && this.isOpen) {
                this.close();
            }
        } else {
            // Snap back to previous state
            if (this.isOpen) {
                this.setDrawerHeight(this.drawerHeight);
            } else {
                this.setDrawerHeight(0);
            }
        }
        
        // Reset dragging state after a short delay
        setTimeout(() => {
            this.isDragging = false;
        }, 100);
    }
    
    handleMouseDown(e) {
        this.startY = e.clientY;
        this.isDragging = false;
        this.submenu.style.transition = 'none';
        
        const handleMouseMove = (e) => {
            this.currentY = e.clientY;
            const deltaY = this.startY - this.currentY;
            this.isDragging = true;
            
            if (this.isOpen) {
                const newHeight = this.drawerHeight + deltaY;
                this.setDrawerHeight(Math.max(0, Math.min(this.drawerHeight, newHeight)));
            } else {
                const newHeight = Math.max(0, deltaY);
                this.setDrawerHeight(Math.min(this.drawerHeight, newHeight));
            }
        };
        
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            this.handleTouchEnd();
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
    
    setDrawerHeight(height) {
        this.submenu.style.height = `${height}px`;
        
        // Update backdrop opacity based on drawer position
        const opacity = (height / this.drawerHeight) * 0.5;
        if (this.backdrop) {
            this.backdrop.style.opacity = opacity;
            this.backdrop.style.pointerEvents = opacity > 0 ? 'auto' : 'none';
        }
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        
        // Update ARIA states
        this.indicator.setAttribute('aria-expanded', 'true');
        this.submenu.setAttribute('aria-hidden', 'false');
        this.backdrop?.setAttribute('aria-hidden', 'false');
        
        // Add CSS classes
        this.container.classList.add('drawer-open');
        document.body.classList.add('drawer-active');
        
        // Animate drawer
        this.setDrawerHeight(this.drawerHeight);
        
        // Update selections
        this.updateSelections();
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        
        // Update ARIA states
        this.indicator.setAttribute('aria-expanded', 'false');
        this.submenu.setAttribute('aria-hidden', 'true');
        this.backdrop?.setAttribute('aria-hidden', 'true');
        
        // Remove CSS classes
        this.container.classList.remove('drawer-open');
        document.body.classList.remove('drawer-active');
        
        // Animate drawer
        this.setDrawerHeight(0);
    }
    
    renderUserSelector() {
        const container = document.getElementById(`${this.prefix}SubmenuUserSelector`);
        if (!container || !window.appInstance) return;
        
        const currentUser = window.appInstance.appState.getCurrentUser();
        const allUsers = window.appInstance.appState.getAllUsers();
        
        container.innerHTML = `
            <div class="drawer-user-grid" role="listbox" aria-label="Select user">
                ${allUsers.map(user => `
                    <div class="drawer-user-card ${user.id === currentUser.id ? 'selected' : ''}" 
                         role="option" 
                         data-user-id="${user.id}"
                         aria-selected="${user.id === currentUser.id}"
                         tabindex="${user.id === currentUser.id ? '0' : '-1'}">
                        <div class="user-avatar">${user.icon || '👤'}</div>
                        <div class="user-name">${user.name}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add click handlers
        container.querySelectorAll('.drawer-user-card').forEach(card => {
            card.addEventListener('click', () => {
                const userId = card.getAttribute('data-user-id');
                if (userId && window.appInstance) {
                    window.appInstance.handleUserSwitch(userId);
                    this.updateUserDisplay();
                    
                    // Visual feedback
                    container.querySelectorAll('.drawer-user-card').forEach(c => {
                        c.classList.remove('selected');
                        c.setAttribute('aria-selected', 'false');
                        c.setAttribute('tabindex', '-1');
                    });
                    card.classList.add('selected');
                    card.setAttribute('aria-selected', 'true');
                    card.setAttribute('tabindex', '0');
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
            <div class="drawer-day-toggle" role="radiogroup" aria-label="Select day">
                <div class="drawer-day-option ${currentDay === 'today' ? 'selected' : ''}" 
                     role="radio" 
                     data-day="today"
                     aria-checked="${currentDay === 'today'}"
                     tabindex="${currentDay === 'today' ? '0' : '-1'}">
                    <div class="day-calendar-icon">${todayIcon}</div>
                    <span class="day-label">Today</span>
                </div>
                <div class="drawer-day-option ${currentDay === 'tomorrow' ? 'selected' : ''}" 
                     role="radio" 
                     data-day="tomorrow"
                     aria-checked="${currentDay === 'tomorrow'}"
                     tabindex="${currentDay === 'tomorrow' ? '0' : '-1'}">
                    <div class="day-calendar-icon">${tomorrowIcon}</div>
                    <span class="day-label">Tomorrow</span>
                </div>
            </div>
        `;
        
        // Add click handlers
        container.querySelectorAll('.drawer-day-option').forEach(option => {
            option.addEventListener('click', () => {
                const day = option.getAttribute('data-day');
                if (day && window.appInstance) {
                    window.appInstance.switchDay(day);
                    this.updateDayDisplay();
                    
                    // Visual feedback
                    container.querySelectorAll('.drawer-day-option').forEach(opt => {
                        opt.classList.remove('selected');
                        opt.setAttribute('aria-checked', 'false');
                        opt.setAttribute('tabindex', '-1');
                    });
                    option.classList.add('selected');
                    option.setAttribute('aria-checked', 'true');
                    option.setAttribute('tabindex', '0');
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
        const fontSize = dayNumber < 10 ? '10' : '9';
        
        return `
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="calGrad${this.prefix}${dayNumber}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${themeColor};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${themeColor};stop-opacity:0.8" />
                    </linearGradient>
                </defs>
                
                <!-- Calendar base -->
                <rect x="4" y="6" width="24" height="22" rx="3" fill="white" stroke="#e0e0e0" stroke-width="1"/>
                
                <!-- Calendar header -->
                <rect x="4" y="6" width="24" height="7" rx="3" fill="url(#calGrad${this.prefix}${dayNumber})"/>
                <rect x="4" y="10" width="24" height="3" fill="${themeColor}"/>
                
                <!-- Binding holes -->
                <circle cx="10" cy="4" r="1.5" fill="#666" opacity="0.4"/>
                <circle cx="22" cy="4" r="1.5" fill="#666" opacity="0.4"/>
                
                <!-- Day number -->
                <text x="16" y="22" text-anchor="middle" 
                      font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
                      font-size="${fontSize}" font-weight="700" fill="#333">
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
        if (window.appInstance) {
            this.renderUserSelector();
        }
    }
    
    updateDayDisplay() {
        if (window.appInstance) {
            this.renderDaySelector();
        }
    }
    
    destroy() {
        // Clean up backdrop
        if (this.backdrop && this.backdrop.parentNode) {
            this.backdrop.parentNode.removeChild(this.backdrop);
        }
        
        // Remove body class if active
        document.body.classList.remove('drawer-active');
    }
}

// Make available globally
window.DraggableDrawer = DraggableDrawer;