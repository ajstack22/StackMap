/* 
 * OPTION 2: EDIT MODE CARDS
 * Complete implementation concept for moving title/subtitle editing to dedicated cards
 * This would create special editing cards in the main content area during edit mode
 */

// ===== UPDATED STACKMAPAPP.JS =====

class StackMapApp {
    
    /**
     * UPDATED: Main render method to include edit cards
     */
    render() {
        const container = document.getElementById('mainContainer');
        if (!container) return;
        
        let content = '';
        
        // Add edit mode cards at the top if in edit mode
        if (this.grownupMode) {
            content += this.renderEditModeCards();
        }
        
        // Add regular activity cards
        content += this.renderer.renderCards();
        
        container.innerHTML = content;
        
        // Setup edit card interactions if in edit mode
        if (this.grownupMode) {
            this.setupEditCardHandlers();
        }
        
        // Other rendering setup...
        this.updateUIElements();
    }

    /**
     * NEW: Render edit mode cards
     * Creates dedicated cards for editing app settings
     */
    renderEditModeCards() {
        return `
            <!-- App Settings Edit Card -->
            <div class="card edit-card app-settings-card" id="appSettingsCard">
                <div class="edit-card-header">
                    <span class="material-icons edit-card-icon">settings</span>
                    <h3 class="edit-card-title">App Settings</h3>
                    <span class="edit-card-badge">Edit Mode</span>
                </div>
                
                <div class="edit-card-content">
                    <div class="edit-field-group">
                        <div class="edit-field">
                            <label for="editTitleInput" class="edit-label">App Title</label>
                            <input type="text" 
                                   id="editTitleInput" 
                                   class="edit-input" 
                                   value="${this.escapeHtml(this.appState.settings.title || 'StackMap')}"
                                   placeholder="Enter app title"
                                   maxlength="50">
                            <div class="edit-field-help">This appears in the header and browser tab</div>
                        </div>
                        
                        <div class="edit-field">
                            <label for="editSubtitleInput" class="edit-label">App Subtitle</label>
                            <input type="text" 
                                   id="editSubtitleInput" 
                                   class="edit-input" 
                                   value="${this.escapeHtml(this.appState.settings.subtitle || 'Routine Ready')}"
                                   placeholder="Enter app subtitle"
                                   maxlength="50">
                            <div class="edit-field-help">Tagline that appears below the title</div>
                        </div>
                    </div>
                    
                    <div class="edit-card-actions">
                        <button class="edit-btn edit-btn--primary" onclick="appInstance.saveTitleSubtitleFromCard()">
                            <span class="material-icons">save</span>
                            Save Changes
                        </button>
                        <button class="edit-btn edit-btn--secondary" onclick="appInstance.resetTitleSubtitle()">
                            <span class="material-icons">refresh</span>
                            Reset to Default
                        </button>
                    </div>
                    
                    <div class="edit-card-preview">
                        <div class="preview-label">Live Preview:</div>
                        <div class="preview-header">
                            <div class="preview-title" id="previewTitle">${this.appState.settings.title || 'StackMap'}</div>
                            <div class="preview-subtitle" id="previewSubtitle">${this.appState.settings.subtitle || 'Routine Ready'}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- User Management Edit Card -->
            <div class="card edit-card user-management-card" id="userManagementCard">
                <div class="edit-card-header">
                    <span class="material-icons edit-card-icon">people</span>
                    <h3 class="edit-card-title">User Management</h3>
                    <span class="edit-card-badge">Admin Tools</span>
                </div>
                
                <div class="edit-card-content">
                    <div class="edit-actions-grid">
                        <button class="edit-action-btn" onclick="appInstance.addNewUser()">
                            <span class="material-icons">person_add</span>
                            <span>Add User</span>
                        </button>
                        <button class="edit-action-btn" onclick="appInstance.showNewCardForm()">
                            <span class="material-icons">add_circle</span>
                            <span>Add Activity</span>
                        </button>
                        <button class="edit-action-btn" onclick="appInstance.exportData()">
                            <span class="material-icons">download</span>
                            <span>Export Data</span>
                        </button>
                        <button class="edit-action-btn" onclick="document.getElementById('fileInput').click()">
                            <span class="material-icons">upload</span>
                            <span>Import Data</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * NEW: Setup edit card interaction handlers
     * Handles real-time preview and input management
     */
    setupEditCardHandlers() {
        const titleInput = document.getElementById('editTitleInput');
        const subtitleInput = document.getElementById('editSubtitleInput');
        const previewTitle = document.getElementById('previewTitle');
        const previewSubtitle = document.getElementById('previewSubtitle');
        
        // Real-time preview updates
        if (titleInput && previewTitle) {
            titleInput.addEventListener('input', (e) => {
                const value = e.target.value.trim() || 'StackMap';
                previewTitle.textContent = value;
                
                // Also update actual header for immediate feedback
                const headerTitle = document.getElementById('mainTitle');
                if (headerTitle) {
                    headerTitle.textContent = value;
                }
            });
            
            // Save on Enter
            titleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveTitleSubtitleFromCard();
                }
            });
        }
        
        if (subtitleInput && previewSubtitle) {
            subtitleInput.addEventListener('input', (e) => {
                const value = e.target.value.trim() || 'Routine Ready';
                previewSubtitle.textContent = value;
                
                // Also update actual header for immediate feedback
                const headerSubtitle = document.getElementById('subtitle');
                if (headerSubtitle) {
                    headerSubtitle.textContent = value;
                }
            });
            
            // Save on Enter
            subtitleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveTitleSubtitleFromCard();
                }
            });
        }
        
        // Auto-save on blur (when user clicks away)
        [titleInput, subtitleInput].forEach(input => {
            if (input) {
                input.addEventListener('blur', () => {
                    // Small delay to allow for button clicks
                    setTimeout(() => {
                        this.saveTitleSubtitleFromCard();
                    }, 100);
                });
            }
        });
    }

    /**
     * NEW: Save title/subtitle from edit card
     * Handles saving from the dedicated edit card inputs
     */
    saveTitleSubtitleFromCard() {
        const titleInput = document.getElementById('editTitleInput');
        const subtitleInput = document.getElementById('editSubtitleInput');
        
        if (!titleInput || !subtitleInput) {
            console.error('Edit card inputs not found');
            return;
        }
        
        // Get and sanitize values
        const newTitle = this.sanitizeText(titleInput.value.trim() || 'StackMap', 50);
        const newSubtitle = this.sanitizeText(subtitleInput.value.trim() || 'Routine Ready', 50);
        
        // Update app state
        this.appState.settings.title = newTitle;
        this.appState.settings.subtitle = newSubtitle;
        this.appState.settings.isDefaultTitle = (newTitle === 'StackMap');
        this.appState.settings.isDefaultSubtitle = (newSubtitle === 'Routine Ready');
        
        // Persist changes
        this.appState._triggerSave();
        
        // Update browser tab
        this.updateTabTitle();
        
        // Update header elements
        this.updateHeaderElements(newTitle, newSubtitle);
        
        // Show save feedback
        this.showEditCardSaveSuccess();
        
        console.log('Title/subtitle saved from edit card:', { title: newTitle, subtitle: newSubtitle });
    }

    /**
     * NEW: Reset to default values
     * Resets title/subtitle to default values
     */
    resetTitleSubtitle() {
        const titleInput = document.getElementById('editTitleInput');
        const subtitleInput = document.getElementById('editSubtitleInput');
        const previewTitle = document.getElementById('previewTitle');
        const previewSubtitle = document.getElementById('previewSubtitle');
        
        // Reset to defaults
        const defaultTitle = 'StackMap';
        const defaultSubtitle = 'Routine Ready';
        
        // Update inputs
        if (titleInput) titleInput.value = defaultTitle;
        if (subtitleInput) subtitleInput.value = defaultSubtitle;
        
        // Update preview
        if (previewTitle) previewTitle.textContent = defaultTitle;
        if (previewSubtitle) previewSubtitle.textContent = defaultSubtitle;
        
        // Save changes
        this.appState.settings.title = defaultTitle;
        this.appState.settings.subtitle = defaultSubtitle;
        this.appState.settings.isDefaultTitle = true;
        this.appState.settings.isDefaultSubtitle = true;
        
        this.appState._triggerSave();
        this.updateTabTitle();
        this.updateHeaderElements(defaultTitle, defaultSubtitle);
        
        console.log('Title/subtitle reset to defaults');
    }

    /**
     * NEW: Update header elements from card
     */
    updateHeaderElements(title, subtitle) {
        const mainTitle = document.getElementById('mainTitle');
        const mainSubtitle = document.getElementById('subtitle');
        
        if (mainTitle) mainTitle.textContent = title;
        if (mainSubtitle) mainSubtitle.textContent = subtitle;
        
        // Update any fixed header elements if they exist
        const fixedTitle = document.getElementById('fixedTitle');
        const fixedSubtitle = document.getElementById('fixedSubtitle');
        
        if (fixedTitle) fixedTitle.textContent = title;
        if (fixedSubtitle) fixedSubtitle.textContent = subtitle;
    }

    /**
     * NEW: Show save success feedback on edit card
     */
    showEditCardSaveSuccess() {
        const saveBtn = document.querySelector('.edit-btn--primary');
        if (saveBtn) {
            const originalContent = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span class="material-icons">check</span>Saved!';
            saveBtn.classList.add('edit-btn--success');
            
            setTimeout(() => {
                saveBtn.innerHTML = originalContent;
                saveBtn.classList.remove('edit-btn--success');
            }, 2000);
        }
    }

    /**
     * UPDATED: Remove old in-place editing methods
     */
    enterGrownupMode() {
        this.grownupMode = true;
        document.body.classList.add('grownup-mode');
        
        // Remove old in-place editing setup
        // this.setupEditableElements(); // REMOVED
        
        // Re-render to show edit cards
        this.render();
        console.log('Entered edit mode - edit cards displayed');
    }

    exitGrownupMode() {
        this.grownupMode = false;
        document.body.classList.remove('grownup-mode');
        
        // Re-render to hide edit cards
        this.render();
        console.log('Exited edit mode - edit cards hidden');
    }

    /**
     * UTILITY: Text sanitization
     */
    sanitizeText(text, maxLength) {
        return text.replace(/[<>]/g, '').substring(0, maxLength).trim();
    }

    /**
     * UTILITY: HTML escaping
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/* 
 * CSS ADDITIONS NEEDED:
 * Add to a new edit-cards.css file or existing styles
 */

/*
// ===== EDIT CARD STYLES =====

.edit-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
    border: 2px solid var(--primary-color);
    border-radius: 16px;
    margin-bottom: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(10px);
    overflow: hidden;
    animation: editCardSlideIn 0.4s ease-out;
}

@keyframes editCardSlideIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.edit-card-header {
    background: var(--primary-color);
    color: white;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.edit-card-icon {
    font-size: 24px;
}

.edit-card-title {
    flex: 1;
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
}

.edit-card-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
}

.edit-card-content {
    padding: 20px;
}

// ===== FORM FIELD STYLES =====

.edit-field-group {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 24px;
}

.edit-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.edit-label {
    font-weight: 600;
    color: #333;
    font-size: 0.95rem;
}

.edit-input {
    padding: 12px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    background: white;
    transition: all 0.2s ease;
    font-family: inherit;
}

.edit-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.edit-field-help {
    font-size: 0.85rem;
    color: #666;
    font-style: italic;
}

// ===== BUTTON STYLES =====

.edit-card-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
}

.edit-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 48px;
}

.edit-btn--primary {
    background: var(--primary-color);
    color: white;
}

.edit-btn--primary:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
}

.edit-btn--secondary {
    background: #f5f5f5;
    color: #666;
}

.edit-btn--secondary:hover {
    background: #e0e0e0;
}

.edit-btn--success {
    background: #4caf50 !important;
}

// ===== PREVIEW STYLES =====

.edit-card-preview {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e0e0e0;
}

.preview-label {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 8px;
    font-weight: 500;
}

.preview-header {
    text-align: center;
}

.preview-title {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 4px;
}

.preview-subtitle {
    font-size: 1rem;
    color: #666;
}

// ===== ACTION GRID STYLES =====

.edit-actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
}

.edit-action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    color: #333;
    font-weight: 500;
    min-height: 80px;
}

.edit-action-btn:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.edit-action-btn .material-icons {
    font-size: 28px;
    color: var(--primary-color);
}

// ===== MOBILE RESPONSIVE =====

@media (max-width: 768px) {
    .edit-card-content {
        padding: 16px;
    }
    
    .edit-card-actions {
        flex-direction: column;
    }
    
    .edit-actions-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .edit-action-btn {
        min-height: 70px;
        padding: 12px 8px;
    }
}
*/

/* 
 * IMPLEMENTATION BENEFITS:
 * 
 * 1. High Discoverability: Edit cards are prominently displayed in main content
 * 2. Dedicated UI: Clear, purpose-built interface for editing
 * 3. Live Preview: Users see changes in real-time with preview section
 * 4. Immediate Feedback: Header updates as user types
 * 5. Comprehensive: Combines app settings with other admin tools
 * 6. Visual Hierarchy: Cards stand out clearly from regular activity cards
 * 7. Mobile Optimized: Touch-friendly inputs and responsive design
 * 8. Contextual Help: Field descriptions explain what each setting does
 * 
 * POTENTIAL DRAWBACKS:
 * 
 * 1. Space Usage: Takes up vertical space in main content area
 * 2. Scrolling: May require scrolling to see all content
 * 3. Visual Clutter: Additional cards in the interface
 * 4. Context Disconnect: Editing UI is separate from what's being edited
 * 
 * MIGRATION STEPS:
 * 1. Add renderEditModeCards() method to StackMapApp
 * 2. Update render() method to include edit cards
 * 3. Add setupEditCardHandlers() and related methods
 * 4. Remove old in-place editing methods
 * 5. Add comprehensive CSS for edit card styling
 * 6. Test on both desktop and mobile
 * 7. Consider card ordering and positioning
 */