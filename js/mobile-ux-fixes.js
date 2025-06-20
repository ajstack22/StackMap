/**
 * Mobile UX Fixes for StackMap
 * Addresses scroll vs drag conflict and other mobile issues
 */

class MobileUXEnhancements {
  constructor() {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.longPressTimer = null;
    this.isDragging = false;
    this.LONG_PRESS_DURATION = 400; // ms
    this.TOUCH_SLOP = 10; // pixels
    
    if (this.isMobile) {
      this.initializeMobileEnhancements();
    }
  }

  initializeMobileEnhancements() {
    // Fix missing onboarding
    this.checkFirstTimeUser();
    
    // Add mobile-specific class
    document.body.classList.add('mobile-device');
    
    // Initialize touch handling
    this.setupTouchHandling();
    
    // Optimize header for mobile
    this.optimizeMobileHeader();
  }

  checkFirstTimeUser() {
    // Check if the splash screen has already been shown
    const splashSeen = localStorage.getItem('stackmap-splash-seen');
    if (splashSeen) return;
    
    // Wait for app to initialize
    setTimeout(() => {
      // Check current user's name
      if (window.appInstance && window.appInstance.appState) {
        const currentUser = window.appInstance.appState.getCurrentUser();
        if (currentUser && (currentUser.name === 'StackMap User' || currentUser.name === 'You' || currentUser.name === 'Me')) {
          // Show simplified mobile onboarding
          this.showMobileOnboarding();
        }
      }
    }, 1500); // Wait a bit longer to ensure app is ready
  }

  showMobileOnboarding() {
    const modal = document.createElement('div');
    modal.className = 'mobile-onboarding-modal';
    modal.innerHTML = `
      <div class="mobile-onboarding-content">
        <h2>👋 Welcome!</h2>
        <p>Let's personalize your experience</p>
        
        <div class="onboarding-field">
          <label>Your name (or nickname):</label>
          <input type="text" id="mobile-user-name" placeholder="Me" maxlength="15" />
        </div>
        
        <div class="onboarding-field">
          <label>Pick an emoji:</label>
          <div class="emoji-picker-simple">
            ${['😊', '🌟', '🎨', '🚀', '🌈', '💪', '🦋', '🐻'].map(emoji => 
              `<button class="emoji-option" data-emoji="${emoji}">${emoji}</button>`
            ).join('')}
          </div>
        </div>
        
        <button class="mobile-onboarding-done">Start Using StackMap</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles
    this.addOnboardingStyles();
    
    // Handle emoji selection
    modal.querySelectorAll('.emoji-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        modal.querySelectorAll('.emoji-option').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
      });
    });
    
    // Handle completion
    modal.querySelector('.mobile-onboarding-done').addEventListener('click', () => {
      const name = document.getElementById('mobile-user-name').value || 'Me';
      const emoji = modal.querySelector('.emoji-option.selected')?.dataset.emoji || '😊';
      
      // Update the current user in the app state
      if (window.appInstance && window.appInstance.appState) {
        const currentUser = window.appInstance.appState.getCurrentUser();
        if (currentUser) {
          window.appInstance.appState.updateUser(currentUser.id, { name: name, icon: emoji });
        }
      }
      
      // Mark splash as seen
      localStorage.setItem('stackmap-splash-seen', 'true');
      
      modal.remove();
      
      // Update UI
      if (window.appInstance) {
        window.appInstance.initializeTitleSubtitle();
        window.appInstance.render();
        window.appInstance.populateUserDropdowns();
        if (window.hybridPanelManager) {
          window.hybridPanelManager.updateSubtitle();
        }
      }
    });
  }

  setupTouchHandling() {
    // Override the default touch handling for cards with long-press detection
    // We need to intercept touch events before the default handlers in components.js
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false, capture: true });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false, capture: true });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false, capture: true });
  }

  handleTouchStart(e) {
    const card = e.target.closest('.card');
    if (!card) return;
    
    // Check if we're in edit mode
    const isEditMode = document.body.classList.contains('grownup-mode') || 
                      (window.appInstance && window.appInstance.appState.ui.editMode);
    
    if (!isEditMode) return;
    
    // Don't start drag if touching a button
    if (e.target.closest('.btn')) return;
    
    // IMPORTANT: Stop propagation to prevent the default handler in components.js
    e.stopPropagation();
    
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.potentialDragTarget = card;
    this.touchStartTime = Date.now();
    
    // Store the original event for later use
    this.originalTouchEvent = e;
    
    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      // Enable drag mode
      this.isDragging = true;
      card.classList.add('drag-ready');
      document.body.classList.add('drag-mode-active');
      
      // Show visual feedback
      this.showDragFeedback(card);
      
      // Now trigger the actual drag start
      this.startActualDrag(card, e);
    }, this.LONG_PRESS_DURATION);
  }

  handleTouchMove(e) {
    if (!this.potentialDragTarget) return;
    
    const card = e.target.closest('.card');
    if (!card) return;
    
    const deltaX = Math.abs(e.touches[0].clientX - this.touchStartX);
    const deltaY = Math.abs(e.touches[0].clientY - this.touchStartY);
    
    // If moved beyond touch slop, cancel long press and allow scrolling
    if ((deltaX > this.TOUCH_SLOP || deltaY > this.TOUCH_SLOP) && !this.isDragging) {
      clearTimeout(this.longPressTimer);
      this.potentialDragTarget = null;
      // Don't prevent default - allow normal scrolling
      return;
    }
    
    // If in drag mode, handle the drag
    if (this.isDragging) {
      e.stopPropagation();
      e.preventDefault();
      this.handleActualDrag(e);
    } else {
      // Still waiting for long press - stop propagation but don't prevent default yet
      e.stopPropagation();
    }
  }

  handleTouchEnd(e) {
    clearTimeout(this.longPressTimer);
    
    const card = e.target.closest('.card');
    if (card && this.potentialDragTarget) {
      // Always stop propagation for sortable cards in edit mode
      e.stopPropagation();
      
      if (this.isDragging) {
        e.preventDefault();
        // Handle the drag end
        this.handleActualDragEnd(e);
        
        this.isDragging = false;
        document.body.classList.remove('drag-mode-active');
        
        if (this.potentialDragTarget) {
          this.potentialDragTarget.classList.remove('drag-ready');
          this.hideDragFeedback(this.potentialDragTarget);
        }
      }
    }
    
    this.potentialDragTarget = null;
    this.touchClone = null;
  }
  
  startActualDrag(card, originalEvent) {
    // Create visual clone for dragging
    this.touchClone = card.cloneNode(true);
    this.touchClone.style.position = 'fixed';
    this.touchClone.style.pointerEvents = 'none';
    this.touchClone.style.zIndex = '9999';
    this.touchClone.style.opacity = '0.8';
    this.touchClone.style.transform = 'scale(1.05)';
    this.touchClone.style.transition = 'none';
    this.touchClone.classList.add('card--dragging');
    
    document.body.appendChild(this.touchClone);
    
    // Set initial position
    const touch = originalEvent.touches[0];
    const rect = card.getBoundingClientRect();
    this.touchOffset = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
    
    this.touchClone.style.left = `${touch.clientX - this.touchOffset.x}px`;
    this.touchClone.style.top = `${touch.clientY - this.touchOffset.y}px`;
    
    // Mark the original card as being dragged
    card.classList.add('card--dragging');
    
    // Set up app state for dragging
    if (window.appInstance) {
      window.appInstance.appState.ui.draggedElement = card;
    }
    
    // Add visual feedback to other cards
    document.querySelectorAll('.card:not(.card--dragging)').forEach(c => {
      c.classList.add('card--droppable');
    });
  }
  
  handleActualDrag(e) {
    if (!this.touchClone || !this.potentialDragTarget) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    
    // Move the clone
    this.touchClone.style.left = `${touch.clientX - this.touchOffset.x}px`;
    this.touchClone.style.top = `${touch.clientY - this.touchOffset.y}px`;
    
    // Find the element under the touch point
    this.touchClone.style.display = 'none';
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    this.touchClone.style.display = '';
    
    if (!elementBelow) return;
    
    const targetCard = elementBelow.closest('.card');
    if (!targetCard || targetCard === this.potentialDragTarget) return;
    
    // Clear previous highlights
    document.querySelectorAll('.card--drop-target').forEach(c => {
      c.classList.remove('card--drop-target');
    });
    
    // Add highlight to current target
    targetCard.classList.add('card--drop-target');
  }
  
  handleActualDragEnd(e) {
    if (!this.touchClone || !this.potentialDragTarget) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.changedTouches[0];
    
    // Find the element under the touch point
    this.touchClone.style.display = 'none';
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (elementBelow) {
      const targetCard = elementBelow.closest('.card');
      if (targetCard && targetCard !== this.potentialDragTarget) {
        const draggedIndex = parseInt(this.potentialDragTarget.dataset.index);
        const targetIndex = parseInt(targetCard.dataset.index);
        
        if (!isNaN(draggedIndex) && !isNaN(targetIndex) && draggedIndex !== targetIndex && window.appInstance) {
          window.appInstance.appState.moveActivity(draggedIndex, targetIndex);
          window.appInstance.renderer.render();
        }
      }
    }
    
    // Clean up
    if (this.touchClone) {
      this.touchClone.remove();
      this.touchClone = null;
    }
    
    // Clean up visual states
    document.querySelectorAll('.card--dragging, .card--droppable, .card--drop-target').forEach(c => {
      c.classList.remove('card--dragging', 'card--droppable', 'card--drop-target');
    });
    
    // Reset app state
    if (window.appInstance) {
      window.appInstance.appState.ui.draggedElement = null;
    }
  }

  showDragFeedback(card) {
    // Visual feedback is handled by the drag-ready class
    // The CSS will show appropriate visual changes
  }
  
  hideDragFeedback(card) {
    // Clean up any visual feedback
    card.classList.remove('drag-ready');
  }

  optimizeMobileHeader() {
    // Override the app's subtitle updating to use compact format on mobile
    const overrideSubtitleUpdate = () => {
      if (!window.appInstance) {
        // Try again if app not ready
        setTimeout(overrideSubtitleUpdate, 500);
        return;
      }
      
      // Override the initializeTitleSubtitle method
      const originalInit = window.appInstance.initializeTitleSubtitle;
      window.appInstance.initializeTitleSubtitle = function() {
        // Call original first
        originalInit.call(this);
        
        // Then apply mobile optimization
        if (window.mobileUX && window.mobileUX.isMobile) {
          const subtitle = document.getElementById('subtitle');
          const currentUser = this.appState.getCurrentUser();
          const currentDay = this.appState.ui.currentDay || 'today';
          const dayText = currentDay === 'today' ? 'Today' : 'Tomorrow';
          
          if (subtitle && currentUser) {
            // Compact mobile format: just emoji and day
            subtitle.innerHTML = `<span style="font-size: 1.3em;">${currentUser.icon}</span> ${dayText}`;
          }
        }
      };
      
      // Also override HybridPanelManager's updateSubtitle if it exists
      if (window.hybridPanelManager) {
        const originalHybridUpdate = window.hybridPanelManager.updateSubtitle;
        window.hybridPanelManager.updateSubtitle = function() {
          originalHybridUpdate.call(this);
          
          if (window.mobileUX && window.mobileUX.isMobile) {
            const subtitle = document.getElementById('subtitle');
            const currentUser = this.app.appState.getCurrentUser();
            const currentDay = this.app.appState.ui.currentDay || 'today';
            const dayText = currentDay === 'today' ? 'Today' : 'Tomorrow';
            
            if (subtitle && currentUser) {
              subtitle.innerHTML = `<span style="font-size: 1.3em;">${currentUser.icon}</span> ${dayText}`;
            }
          }
        };
      }
      
      // Call it immediately to apply changes
      if (window.appInstance) {
        window.appInstance.initializeTitleSubtitle();
      }
    };
    
    // Start the override process
    overrideSubtitleUpdate();
  }

  addOnboardingStyles() {
    if (document.getElementById('mobile-onboarding-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'mobile-onboarding-styles';
    styles.textContent = `
      .mobile-onboarding-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
      }
      
      .mobile-onboarding-content {
        background: white;
        border-radius: 20px;
        padding: 30px;
        max-width: 350px;
        width: 100%;
        text-align: center;
      }
      
      .mobile-onboarding-content h2 {
        margin: 0 0 10px 0;
        font-size: 24px;
      }
      
      .mobile-onboarding-content p {
        margin: 0 0 20px 0;
        color: #666;
      }
      
      .onboarding-field {
        margin-bottom: 20px;
        text-align: left;
      }
      
      .onboarding-field label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
      }
      
      .onboarding-field input {
        width: 100%;
        padding: 12px;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        font-size: 16px;
      }
      
      .emoji-picker-simple {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }
      
      .emoji-option {
        width: 60px;
        height: 60px;
        font-size: 30px;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .emoji-option:hover,
      .emoji-option.selected {
        border-color: #667eea;
        background: #f0f4ff;
        transform: scale(1.1);
      }
      
      .mobile-onboarding-done {
        width: 100%;
        padding: 15px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 10px;
      }
      
      /* Mobile-specific drag styles */
      .mobile-device .drag-mode-active {
        overflow: hidden; /* Prevent scrolling during drag */
      }
      
      .mobile-device .drag-ready {
        opacity: 0.8;
        transform: scale(1.05);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        transition: all 0.2s;
      }
      
      .drag-indicator {
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 12px;
        white-space: nowrap;
      }
      
      /* Add drag handles for future implementation */
      .mobile-device .card::before {
        content: '⋮⋮';
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: #ccc;
        font-size: 20px;
        display: none; /* Hidden for now */
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// Initialize on load
window.mobileUX = new MobileUXEnhancements();