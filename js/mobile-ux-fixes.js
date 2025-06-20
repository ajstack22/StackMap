/**
 * Mobile UX Fixes for StackMap
 * Addresses scroll vs drag conflict and other mobile issues
 */

export class MobileUXEnhancements {
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
    // Check if user has been set up
    const userName = localStorage.getItem('userName');
    const userEmoji = localStorage.getItem('userEmoji');
    
    if (!userName || userName === 'StackMap User') {
      // Show simplified mobile onboarding
      setTimeout(() => {
        this.showMobileOnboarding();
      }, 500);
    }
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
      
      localStorage.setItem('userName', name);
      localStorage.setItem('userEmoji', emoji);
      
      modal.remove();
      window.location.reload(); // Reload to apply changes
    });
  }

  setupTouchHandling() {
    // Add long-press handling for draggable cards
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }

  handleTouchStart(e) {
    const card = e.target.closest('.activity-card');
    if (!card || !card.classList.contains('sortable')) return;
    
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.potentialDragTarget = card;
    
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
    }, this.LONG_PRESS_DURATION);
  }

  handleTouchMove(e) {
    if (!this.potentialDragTarget) return;
    
    const deltaX = Math.abs(e.touches[0].clientX - this.touchStartX);
    const deltaY = Math.abs(e.touches[0].clientY - this.touchStartY);
    
    // If moved beyond touch slop, cancel long press
    if ((deltaX > this.TOUCH_SLOP || deltaY > this.TOUCH_SLOP) && !this.isDragging) {
      clearTimeout(this.longPressTimer);
      this.potentialDragTarget = null;
    }
    
    // If in drag mode, handle drag
    if (this.isDragging) {
      e.preventDefault(); // Prevent scrolling while dragging
      // Let existing drag handling take over
    }
  }

  handleTouchEnd(e) {
    clearTimeout(this.longPressTimer);
    
    if (this.isDragging) {
      this.isDragging = false;
      document.body.classList.remove('drag-mode-active');
      
      if (this.potentialDragTarget) {
        this.potentialDragTarget.classList.remove('drag-ready');
      }
    }
    
    this.potentialDragTarget = null;
  }

  showDragFeedback(card) {
    // Add visual indicator that card is ready to drag
    const indicator = document.createElement('div');
    indicator.className = 'drag-indicator';
    indicator.innerHTML = '✋ Hold & Drag';
    card.appendChild(indicator);
    
    setTimeout(() => indicator.remove(), 2000);
  }

  optimizeMobileHeader() {
    // Shorten header text on mobile
    const updateHeader = () => {
      const headerElement = document.querySelector('.user-greeting');
      if (!headerElement) return;
      
      const userName = localStorage.getItem('userName') || 'Me';
      const userEmoji = localStorage.getItem('userEmoji') || '😊';
      const dayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });
      
      if (this.isMobile) {
        // Compact mobile format
        headerElement.textContent = `${userEmoji} ${dayName}`;
      } else {
        // Full desktop format
        headerElement.textContent = `${userName} ${userEmoji} ${dayName}`;
      }
    };
    
    // Update on load and when user info changes
    updateHeader();
    window.addEventListener('storage', updateHeader);
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
      .mobile-device .activity-card::before {
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
const mobileUX = new MobileUXEnhancements();
export default mobileUX;