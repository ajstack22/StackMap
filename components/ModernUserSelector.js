// ModernUserSelector.js - Custom user dropdown with modern UI
class ModernUserSelector {
    constructor(container, fallbackSelect, appInstance) {
        this.container = container;
        this.fallback = fallbackSelect;
        this.app = appInstance;
        this.isOpen = false;
        this.currentFocus = -1;
        
        // Feature detection
        if (this.supportsModernFeatures()) {
            this.render();
            this.setupEventListeners();
            this.hide(this.fallback);
        }
    }
    
    supportsModernFeatures() {
        // Check for required browser features
        return 'classList' in document.documentElement &&
               'addEventListener' in window &&
               CSS.supports('display', 'flex');
    }
    
    hide(element) {
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        element.style.visibility = 'hidden';
        element.setAttribute('aria-hidden', 'true');
        element.tabIndex = -1;
    }
    
    render() {
        // Create modern selector structure
        this.selector = ComponentBuilder.createElement('div', 'modern-selector user-selector-modern');
        this.selector.setAttribute('role', 'button');
        this.selector.setAttribute('aria-haspopup', 'listbox');
        this.selector.setAttribute('aria-expanded', 'false');
        this.selector.tabIndex = 0;
        
        // Create content container
        const content = ComponentBuilder.createElement('div', 'user-selector-content');
        
        // User info section
        this.userInfo = ComponentBuilder.createElement('div', 'user-info');
        
        // Avatar
        this.avatar = ComponentBuilder.createElement('div', 'user-avatar');
        this.avatar.textContent = '👤';
        
        // Details
        this.userDetails = ComponentBuilder.createElement('div', 'user-details');
        this.userName = ComponentBuilder.createElement('div', 'user-name');
        this.userContext = ComponentBuilder.createElement('div', 'user-context');
        
        this.userDetails.appendChild(this.userName);
        this.userDetails.appendChild(this.userContext);
        
        this.userInfo.appendChild(this.avatar);
        this.userInfo.appendChild(this.userDetails);
        
        // Selector icon
        this.icon = ComponentBuilder.createElement('div', 'selector-icon');
        this.icon.innerHTML = '▼';
        
        content.appendChild(this.userInfo);
        content.appendChild(this.icon);
        
        this.selector.appendChild(content);
        
        // Create dropdown modal
        this.createDropdown();
        
        // Create backdrop
        this.backdrop = ComponentBuilder.createElement('div', 'selector-backdrop');
        document.body.appendChild(this.backdrop);
        
        // Insert selector
        this.container.appendChild(this.selector);
        
        // Update with current user
        this.updateDisplay();
    }
    
    createDropdown() {
        this.dropdown = ComponentBuilder.createElement('div', 'dropdown-modal');
        this.dropdown.setAttribute('role', 'listbox');
        
        // Will be populated when opened
        this.dropdownOptions = ComponentBuilder.createElement('div', 'dropdown-options');
        this.dropdown.appendChild(this.dropdownOptions);
        
        this.selector.appendChild(this.dropdown);
    }
    
    updateDisplay() {
        const currentUser = this.app.appState.getCurrentUser();
        if (currentUser) {
            this.userName.textContent = currentUser.name;
            // Remove activity count - just show the user's icon
            this.userContext.style.display = 'none';
            
            // Update avatar if user has custom emoji
            if (currentUser.avatar) {
                this.avatar.textContent = currentUser.avatar;
            }
            
            // Update aria label
            this.selector.setAttribute('aria-label', 
                `Select user. Currently ${currentUser.name}`);
        }
    }
    
    populateDropdown() {
        this.dropdownOptions.innerHTML = '';
        
        const users = this.app.appState.getAllUsers();
        const currentUserId = this.app.appState.users.currentUserId;
        
        users.forEach((user, index) => {
            const option = this.createUserOption(user, user.id === currentUserId);
            option.setAttribute('data-index', index);
            this.dropdownOptions.appendChild(option);
        });
        
        // Add "Add User" option if in grownup mode
        console.log('Checking grownup mode:', this.app.grownupMode, 'Body class:', document.body.classList.contains('grownup-mode'));
        if (this.app.grownupMode) {
            const addOption = this.createAddUserOption();
            this.dropdownOptions.appendChild(addOption);
        } else {
            console.log('Not in grownup mode - Add User option not shown');
        }
    }
    
    createUserOption(user, isSelected) {
        const option = ComponentBuilder.createElement('div', 'dropdown-option');
        if (isSelected) {
            option.classList.add('dropdown-option--selected');
            option.setAttribute('aria-selected', 'true');
        }
        option.setAttribute('role', 'option');
        option.setAttribute('data-user-id', user.id);
        
        const content = ComponentBuilder.createElement('div', 'dropdown-option-content');
        
        // Icon
        const icon = ComponentBuilder.createElement('div', 'dropdown-option-icon');
        icon.textContent = user.avatar || '👤';
        
        // Text
        const text = ComponentBuilder.createElement('div', 'dropdown-option-text');
        const primary = ComponentBuilder.createElement('div', 'dropdown-option-primary');
        primary.textContent = user.name;
        
        text.appendChild(primary);
        // Remove secondary text showing routine count
        
        content.appendChild(icon);
        content.appendChild(text);
        
        // Selection indicator
        const indicator = ComponentBuilder.createElement('div', 'dropdown-option-indicator');
        
        option.appendChild(content);
        option.appendChild(indicator);
        
        return option;
    }
    
    createAddUserOption() {
        console.log('Creating Add User option');
        const option = ComponentBuilder.createElement('div', 'dropdown-option dropdown-option--add');
        option.setAttribute('role', 'option');
        option.setAttribute('data-action', 'add-user');
        
        const content = ComponentBuilder.createElement('div', 'dropdown-option-content');
        
        const icon = ComponentBuilder.createElement('div', 'dropdown-option-icon');
        icon.textContent = '➕';
        
        const text = ComponentBuilder.createElement('div', 'dropdown-option-text');
        const primary = ComponentBuilder.createElement('div', 'dropdown-option-primary');
        primary.textContent = 'Add User';
        
        text.appendChild(primary);
        content.appendChild(icon);
        content.appendChild(text);
        option.appendChild(content);
        
        console.log('Add User option created with data-action:', option.getAttribute('data-action'));
        return option;
    }
    
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.populateDropdown();
        
        // Update states
        this.selector.classList.add('modern-selector--open');
        this.selector.setAttribute('aria-expanded', 'true');
        this.dropdown.classList.add('dropdown-modal--open');
        this.backdrop.classList.add('selector-backdrop--open');
        
        // Focus management
        this.currentFocus = -1;
        
        // Announce to screen readers
        this.announceToScreenReader('User menu opened');
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        
        // Update states
        this.selector.classList.remove('modern-selector--open');
        this.selector.setAttribute('aria-expanded', 'false');
        this.dropdown.classList.remove('dropdown-modal--open');
        this.backdrop.classList.remove('selector-backdrop--open');
        
        // Return focus
        this.selector.focus();
    }
    
    selectUser(userId) {
        this.app.appState.switchUser(userId);
        this.updateDisplay();
        this.close();
        
        // Update fallback select
        this.fallback.value = userId;
        
        // Trigger app render
        this.app.render();
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
        
        // Dropdown clicks
        this.dropdown.addEventListener('click', (e) => {
            console.log('Dropdown clicked, target:', e.target);
            const option = e.target.closest('.dropdown-option');
            if (option) {
                console.log('Option found:', option);
                const userId = option.getAttribute('data-user-id');
                const action = option.getAttribute('data-action');
                console.log('userId:', userId, 'action:', action);
                
                if (userId) {
                    this.selectUser(userId);
                } else if (action === 'add-user') {
                    console.log('Add user action triggered');
                    this.close();
                    this.app.showAddUserDialog();
                }
            }
        });
        
        // Keyboard support for dropdown options
        this.dropdown.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const option = e.target.closest('.dropdown-option');
                if (option) {
                    e.preventDefault();
                    option.click();
                }
            }
        });
        
        // Backdrop click
        this.backdrop.addEventListener('click', () => {
            this.close();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            if (this.isOpen) {
                this.positionDropdown();
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
                
            case 'ArrowDown':
                e.preventDefault();
                if (!this.isOpen) {
                    this.open();
                } else {
                    this.focusNextOption();
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                if (this.isOpen) {
                    this.focusPreviousOption();
                }
                break;
                
            case 'Escape':
                if (this.isOpen) {
                    e.preventDefault();
                    this.close();
                }
                break;
                
            case 'Home':
                if (this.isOpen) {
                    e.preventDefault();
                    this.focusFirstOption();
                }
                break;
                
            case 'End':
                if (this.isOpen) {
                    e.preventDefault();
                    this.focusLastOption();
                }
                break;
        }
    }
    
    focusNextOption() {
        const options = this.dropdownOptions.querySelectorAll('.dropdown-option');
        this.currentFocus = (this.currentFocus + 1) % options.length;
        this.focusOption(options[this.currentFocus]);
    }
    
    focusPreviousOption() {
        const options = this.dropdownOptions.querySelectorAll('.dropdown-option');
        this.currentFocus = this.currentFocus <= 0 ? options.length - 1 : this.currentFocus - 1;
        this.focusOption(options[this.currentFocus]);
    }
    
    focusFirstOption() {
        const options = this.dropdownOptions.querySelectorAll('.dropdown-option');
        this.currentFocus = 0;
        this.focusOption(options[0]);
    }
    
    focusLastOption() {
        const options = this.dropdownOptions.querySelectorAll('.dropdown-option');
        this.currentFocus = options.length - 1;
        this.focusOption(options[this.currentFocus]);
    }
    
    focusOption(option) {
        // Remove previous focus
        this.dropdownOptions.querySelectorAll('.dropdown-option').forEach(opt => {
            opt.classList.remove('dropdown-option--focused');
        });
        
        // Add focus
        option.classList.add('dropdown-option--focused');
        option.scrollIntoView({ block: 'nearest' });
    }
    
    positionDropdown() {
        // Ensure dropdown doesn't go off-screen
        const rect = this.selector.getBoundingClientRect();
        const dropdownHeight = this.dropdown.offsetHeight;
        const viewportHeight = window.innerHeight;
        
        if (rect.bottom + dropdownHeight > viewportHeight) {
            // Position above if not enough space below
            this.dropdown.style.bottom = '100%';
            this.dropdown.style.top = 'auto';
        } else {
            this.dropdown.style.top = '100%';
            this.dropdown.style.bottom = 'auto';
        }
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
        this.backdrop.remove();
        
        // Show fallback
        this.fallback.style.position = '';
        this.fallback.style.left = '';
        this.fallback.style.visibility = '';
        this.fallback.removeAttribute('aria-hidden');
        this.fallback.tabIndex = 0;
    }
}

// Make available globally
window.ModernUserSelector = ModernUserSelector;