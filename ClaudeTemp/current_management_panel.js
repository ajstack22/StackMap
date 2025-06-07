/* 
 * CURRENT MANAGEMENT PANEL IMPLEMENTATION
 * Extracted from HybridPanelManager.js
 * This shows the current structure where title/subtitle editing could be added
 */

class HybridPanelManager {
    
    /**
     * MAIN PANEL CONTENT RENDERER
     * This is where title/subtitle editing could be integrated
     */
    renderManagementContent() {
        const allUsers = this.app.appState.getAllUsers();
        
        if (!this.app.grownupMode) {
            // VIEW MODE: Show validation question to access edit mode
            return `
                <div class="panel-section">
                    <label>Access Edit Mode</label>
                    ${this.renderValidationSection()}
                </div>
            `;
        } else {
            // EDIT MODE: Show admin tools
            // THIS IS WHERE TITLE/SUBTITLE EDITING COULD BE ADDED
            return `
                <div class="panel-section">
                    <label>Edit Mode</label>
                    ${this.renderViewModeButton()}
                </div>
                
                <!-- POTENTIAL ADDITION: App Settings Section -->
                <!--
                <div class="panel-section">
                    <label>App Settings</label>
                    ${this.renderTitleSubtitleEditor()}
                </div>
                -->
                
                <div class="panel-section">
                    <label>Admin Tools</label>
                    ${this.renderAdminButtons()}
                </div>
            `;
        }
    }

    /**
     * VALIDATION SECTION: How users access edit mode
     * This section would remain unchanged
     */
    renderValidationSection() {
        const questions = [
            { question: "What's the first letter of the alphabet?", answer: "A" },
            { question: "What comes after 2?", answer: "3" },
            { question: "How many days are in a week?", answer: "7" },
            { question: "What color do you get when you mix red and blue?", answer: "PURPLE" },
            { question: "What's 5 + 5?", answer: "10" },
            { question: "What's the opposite of 'hot'?", answer: "COLD" }
        ];
        
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        return `
            <div class="validation-section">
                <div class="validation-question">
                    <p>${randomQuestion.question}</p>
                </div>
                <div class="validation-input">
                    <input type="text" id="hybridValidationInput" placeholder="Type your answer" 
                           data-answer="${randomQuestion.answer.toUpperCase()}"
                           autofocus>
                </div>
                <button class="segment segment--edit-mode" onclick="hybridPanelManager.checkValidationAnswer()">
                    <span class="material-icons">edit</span>
                    <span>Enter Edit Mode</span>
                </button>
            </div>
        `;
    }

    /**
     * ADMIN BUTTONS: Current admin tools
     * Title/subtitle editing would fit naturally before or after these
     */
    renderAdminButtons() {
        return `
            <div class="admin-buttons">
                <button class="admin-btn" onclick="hybridPanelManager.addNewCard()">
                    <span class="material-icons">add</span>
                    Add Activity
                </button>
                <button class="admin-btn" onclick="hybridPanelManager.exportData()">
                    <span class="material-icons">download</span>
                    Export Data
                </button>
                <button class="admin-btn" onclick="hybridPanelManager.importData()">
                    <span class="material-icons">upload</span>
                    Import Data
                </button>
                <button class="admin-btn" onclick="hybridPanelManager.addNewUser()">
                    <span class="material-icons">person_add</span>
                    Add User
                </button>
            </div>
        `;
    }

    /* 
     * POTENTIAL NEW METHOD: Title/Subtitle Editor
     * This could be added to integrate title/subtitle editing
     */
    /*
    renderTitleSubtitleEditor() {
        const currentTitle = this.app.appState.settings.title;
        const currentSubtitle = this.app.appState.settings.subtitle;
        
        return `
            <div class="title-subtitle-editor">
                <div class="edit-field">
                    <label>App Title</label>
                    <input type="text" 
                           id="hybridTitleInput" 
                           value="${currentTitle}" 
                           placeholder="Enter app title"
                           style="width: 100%; padding: 12px; border: 2px solid rgba(255,255,255,0.3); 
                                  border-radius: 8px; background: rgba(255,255,255,0.2); 
                                  color: white; font-size: 1rem; margin-bottom: 8px;
                                  font-family: inherit;">
                </div>
                <div class="edit-field">
                    <label>App Subtitle</label>
                    <input type="text" 
                           id="hybridSubtitleInput" 
                           value="${currentSubtitle}" 
                           placeholder="Enter app subtitle"
                           style="width: 100%; padding: 12px; border: 2px solid rgba(255,255,255,0.3); 
                                  border-radius: 8px; background: rgba(255,255,255,0.2); 
                                  color: white; font-size: 1rem; margin-bottom: 12px;
                                  font-family: inherit;">
                </div>
                <button class="segment" onclick="hybridPanelManager.saveTitleSubtitle()"
                        style="width: 100%; background: rgba(255,255,255,0.3); border: none; 
                               border-radius: 8px; padding: 14px; color: white; font-weight: 600;
                               cursor: pointer; transition: all 0.2s ease;">
                    <span class="material-icons">save</span>
                    <span>Save Changes</span>
                </button>
            </div>
        `;
    }
    */

    /* 
     * POTENTIAL NEW METHOD: Save title/subtitle from panel
     * This would handle saving from form inputs instead of contenteditable
     */
    /*
    saveTitleSubtitle() {
        const titleInput = document.getElementById('hybridTitleInput');
        const subtitleInput = document.getElementById('hybridSubtitleInput');
        
        if (titleInput && subtitleInput) {
            const newTitle = titleInput.value.trim() || 'StackMap';
            const newSubtitle = subtitleInput.value.trim() || 'Routine Ready';
            
            // Update settings
            this.app.appState.settings.title = newTitle;
            this.app.appState.settings.subtitle = newSubtitle;
            this.app.appState.settings.isDefaultTitle = (newTitle === 'StackMap');
            this.app.appState.settings.isDefaultSubtitle = (newSubtitle === 'Routine Ready');
            
            // Save and update
            this.app.appState._triggerSave();
            this.app.updateTabTitle();
            
            // Update header elements
            const mainTitle = document.getElementById('mainTitle');
            const mainSubtitle = document.getElementById('subtitle');
            if (mainTitle) mainTitle.textContent = newTitle;
            if (mainSubtitle) mainSubtitle.textContent = newSubtitle;
            
            // Show feedback
            console.log('Title/subtitle updated from panel');
            
            // Optional: Show success feedback or close panel
        }
    }
    */

    /**
     * PANEL OPENING LOGIC
     * Shows how panels are opened and content is rendered
     */
    openPanel(side) {
        // Close other panel first
        this.closeAllPanels();
        
        // Update state
        this.state[`${side}PanelOpen`] = true;
        this.state.activePanel = side;
        
        // Update UI
        const panel = document.getElementById(`hybrid${side.charAt(0).toUpperCase() + side.slice(1)}Panel`);
        const button = document.getElementById(`hybrid${side === 'left' ? 'Preferences' : 'Manage'}Btn`);
        const backdrop = document.getElementById('hybridBackdrop');
        
        panel.classList.add('open');
        button.classList.add('fab--active');
        backdrop.classList.add('active');
        
        // Platform-specific FAB behavior
        this.handleFABVisibility(true);
        
        // Render content - THIS IS WHERE TITLE/SUBTITLE EDITOR WOULD APPEAR
        this.renderPanelContent(side);
        
        // Focus validation input if opening management panel in view mode
        if (side === 'right' && !this.app.grownupMode) {
            setTimeout(() => {
                const validationInput = document.getElementById('hybridValidationInput');
                if (validationInput) {
                    validationInput.focus();
                }
            }, 300);
        }
        
        console.log(`Opened ${side} panel`);
    }

    /**
     * CONTENT RENDERING
     * This is called whenever panel content needs to update
     */
    renderPanelContent(side) {
        const contentDiv = document.getElementById(`hybrid${side.charAt(0).toUpperCase() + side.slice(1)}Content`);
        
        if (side === 'left') {
            contentDiv.innerHTML = this.renderPreferencesContent();
        } else {
            // RIGHT PANEL - Where title/subtitle editing would be added
            contentDiv.innerHTML = this.renderManagementContent();
        }
    }
}

/* 
 * INTEGRATION NOTES:
 * 
 * Advantages of Panel Integration:
 * 1. Consistent with other admin tools
 * 2. Hidden in view mode (no accidental edits)
 * 3. Clear context separation
 * 4. Form-based editing (more standard UX)
 * 
 * Implementation Steps:
 * 1. Add renderTitleSubtitleEditor() method
 * 2. Add saveTitleSubtitle() method  
 * 3. Include editor in renderManagementContent() for edit mode
 * 4. Remove current in-place editing from StackMapApp.js
 * 5. Update CSS for form styling consistency
 * 
 * Mobile Considerations:
 * - Panel has full height on mobile
 * - Form inputs work better than contenteditable on mobile
 * - Save button provides clear completion action
 */