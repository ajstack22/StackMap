/* 
 * OPTION 1: MANAGEMENT PANEL INTEGRATION
 * Complete implementation concept for moving title/subtitle editing to the Management panel
 * This would replace the current in-place editing with form-based editing in the side panel
 */

// ===== UPDATED HYBRIDPANELMANAGER.JS =====

class HybridPanelManager {
    
    /**
     * UPDATED: Management content with title/subtitle editor
     */
    renderManagementContent() {
        const allUsers = this.app.appState.getAllUsers();
        
        if (!this.app.grownupMode) {
            // View mode: Show validation question
            return `
                <div class="panel-section">
                    <label>Access Edit Mode</label>
                    ${this.renderValidationSection()}
                </div>
            `;
        } else {
            // Edit mode: Show app settings + admin tools
            return `
                <div class="panel-section">
                    <label>Edit Mode</label>
                    ${this.renderViewModeButton()}
                </div>
                
                <!-- NEW: App Settings Section -->
                <div class="panel-section">
                    <label>App Settings</label>
                    ${this.renderTitleSubtitleEditor()}
                </div>
                
                <div class="panel-section">
                    <label>Admin Tools</label>
                    ${this.renderAdminButtons()}
                </div>
            `;
        }
    }

    /**
     * NEW: Title/Subtitle Editor for Management Panel
     * Provides form-based editing instead of in-place contenteditable
     */
    renderTitleSubtitleEditor() {
        const currentTitle = this.app.appState.settings.title || 'StackMap';
        const currentSubtitle = this.app.appState.settings.subtitle || 'Routine Ready';
        
        return `
            <div class="title-subtitle-editor">
                <div class="editor-field">
                    <label class="field-label">App Title</label>
                    <input type="text" 
                           id="hybridTitleInput" 
                           value="${this.escapeHtml(currentTitle)}" 
                           placeholder="Enter app title"
                           class="panel-input"
                           maxlength="50">
                </div>
                
                <div class="editor-field">
                    <label class="field-label">App Subtitle</label>
                    <input type="text" 
                           id="hybridSubtitleInput" 
                           value="${this.escapeHtml(currentSubtitle)}" 
                           placeholder="Enter app subtitle"
                           class="panel-input"
                           maxlength="50">
                </div>
                
                <button class="save-btn" onclick="hybridPanelManager.saveTitleSubtitle()">
                    <span class="material-icons">save</span>
                    <span>Update App Info</span>
                </button>
                
                <div class="editor-help">
                    <p>Changes appear immediately in the header above</p>
                </div>
            </div>
        `;
    }

    /**
     * NEW: Save title/subtitle from panel inputs
     * Handles form-based saving instead of contenteditable blur events
     */
    saveTitleSubtitle() {
        const titleInput = document.getElementById('hybridTitleInput');
        const subtitleInput = document.getElementById('hybridSubtitleInput');
        
        if (!titleInput || !subtitleInput) {
            console.error('Title/subtitle inputs not found');
            return;
        }
        
        // Get values and sanitize
        const newTitle = titleInput.value.trim() || 'StackMap';
        const newSubtitle = subtitleInput.value.trim() || 'Routine Ready';
        
        // Prevent XSS and validate length
        const sanitizedTitle = this.sanitizeText(newTitle, 50);
        const sanitizedSubtitle = this.sanitizeText(newSubtitle, 50);
        
        // Update app state
        this.app.appState.settings.title = sanitizedTitle;
        this.app.appState.settings.subtitle = sanitizedSubtitle;
        this.app.appState.settings.isDefaultTitle = (sanitizedTitle === 'StackMap');
        this.app.appState.settings.isDefaultSubtitle = (sanitizedSubtitle === 'Routine Ready');
        
        // Persist to localStorage
        this.app.appState._triggerSave();
        
        // Update header elements immediately
        this.updateHeaderElements(sanitizedTitle, sanitizedSubtitle);
        
        // Update browser tab title
        this.app.updateTabTitle();
        
        // Visual feedback
        this.showSaveSuccess();
        
        console.log('Title/subtitle updated:', { title: sanitizedTitle, subtitle: sanitizedSubtitle });
    }

    /**
     * NEW: Update header elements from panel
     * Ensures header reflects changes immediately
     */
    updateHeaderElements(title, subtitle) {
        // Update main header elements
        const mainTitle = document.getElementById('mainTitle');
        const mainSubtitle = document.getElementById('subtitle');
        
        if (mainTitle) {
            mainTitle.textContent = title;
        }
        if (mainSubtitle) {
            mainSubtitle.textContent = subtitle;
        }
        
        // Update any duplicate header elements (like fixed header if it exists)
        const fixedTitle = document.getElementById('fixedTitle');
        const fixedSubtitle = document.getElementById('fixedSubtitle');
        
        if (fixedTitle) {
            fixedTitle.textContent = title;
        }
        if (fixedSubtitle) {
            fixedSubtitle.textContent = subtitle;
        }
    }

    /**
     * NEW: Show save success feedback
     * Provides visual confirmation of successful save
     */
    showSaveSuccess() {
        const saveBtn = document.querySelector('.save-btn');
        if (saveBtn) {
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span class="material-icons">check</span><span>Saved!</span>';
            saveBtn.style.background = 'rgba(76, 175, 80, 0.3)'; // Green success color
            
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.style.background = '';
            }, 2000);
        }
    }

    /**
     * NEW: Real-time input handling
     * Updates header as user types for immediate feedback
     */
    setupTitleSubtitleInputs() {
        const titleInput = document.getElementById('hybridTitleInput');
        const subtitleInput = document.getElementById('hybridSubtitleInput');
        
        if (titleInput) {
            // Update header in real-time as user types
            titleInput.addEventListener('input', (e) => {
                const value = e.target.value.trim() || 'StackMap';
                const mainTitle = document.getElementById('mainTitle');
                if (mainTitle) {
                    mainTitle.textContent = value;
                }
            });
            
            // Save on Enter key
            titleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveTitleSubtitle();
                }
            });
        }
        
        if (subtitleInput) {
            // Update header in real-time as user types
            subtitleInput.addEventListener('input', (e) => {
                const value = e.target.value.trim() || 'Routine Ready';
                const mainSubtitle = document.getElementById('subtitle');
                if (mainSubtitle) {
                    mainSubtitle.textContent = value;
                }
            });
            
            // Save on Enter key
            subtitleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveTitleSubtitle();
                }
            });
        }
    }

    /**
     * UPDATED: Panel content rendering with input setup
     */
    renderPanelContent(side) {
        const contentDiv = document.getElementById(`hybrid${side.charAt(0).toUpperCase() + side.slice(1)}Content`);
        
        if (side === 'left') {
            contentDiv.innerHTML = this.renderPreferencesContent();
        } else {
            contentDiv.innerHTML = this.renderManagementContent();
            
            // Setup input event listeners after rendering
            if (this.app.grownupMode) {
                setTimeout(() => {
                    this.setupTitleSubtitleInputs();
                }, 0);
            }
        }
    }

    /**
     * UTILITY: HTML escaping for security
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * UTILITY: Text sanitization
     */
    sanitizeText(text, maxLength) {
        return text.replace(/[<>]/g, '').substring(0, maxLength).trim();
    }
}

// ===== UPDATED STACKMAPAPP.JS =====

class StackMapApp {
    
    /**
     * REMOVED: setupEditableElements() method
     * No longer needed since editing is in management panel
     */
    
    /**
     * REMOVED: makeElementEditable() method  
     * No longer needed since editing is in management panel
     */
    
    /**
     * UPDATED: enterGrownupMode() - remove in-place editing setup
     */
    enterGrownupMode() {
        this.grownupMode = true;
        document.body.classList.add('grownup-mode');
        
        // Remove old in-place editing setup
        // this.setupEditableElements(); // REMOVED
        
        // Other edit mode setup remains the same
        this.render();
        console.log('Entered edit mode - title/subtitle editing available in management panel');
    }

    /**
     * UPDATED: exitGrownupMode() - remove contenteditable cleanup
     */
    exitGrownupMode() {
        this.grownupMode = false;
        document.body.classList.remove('grownup-mode');
        
        // Remove old contenteditable cleanup
        // const title = document.getElementById('mainTitle');
        // const subtitle = document.getElementById('subtitle');
        // [title, subtitle].forEach(element => {
        //     if (element) {
        //         element.contentEditable = false;
        //     }
        // });
        
        // Other exit mode cleanup remains the same
        this.render();
        console.log('Exited edit mode');
    }

    /**
     * KEPT: updateTabTitle() method
     * Still needed for browser tab updates
     */
    updateTabTitle() {
        const { isDefaultTitle, title } = this.appState.settings;
        document.title = isDefaultTitle ? 'StackMap' : title;
    }
}

/* 
 * CSS ADDITIONS NEEDED:
 * Add to hybrid-panels.css
 */

/*
.title-subtitle-editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.editor-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.field-label {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    margin: 0;
}

.panel-input {
    width: 100%;
    padding: 12px;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 8px;
    background: rgba(255,255,255,0.2);
    color: white;
    font-size: 1rem;
    font-family: inherit;
    box-sizing: border-box;
    transition: all 0.2s ease;
}

.panel-input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.25);
}

.panel-input::placeholder {
    color: rgba(255, 255, 255, 0.7);
}

.save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 18px;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.3);
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 48px;
    margin-top: 4px;
}

.save-btn:hover {
    background: rgba(255, 255, 255, 0.4);
    transform: translateY(-1px);
}

.editor-help {
    margin-top: 8px;
}

.editor-help p {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    font-style: italic;
}
*/

/* 
 * IMPLEMENTATION BENEFITS:
 * 
 * 1. Consistency: Matches other admin functions in management panel
 * 2. Discoverability: Clear, dedicated UI for editing
 * 3. Form-based: Standard input patterns users expect
 * 4. Real-time feedback: Header updates as user types
 * 5. Mobile-friendly: Touch-optimized inputs work better than contenteditable
 * 6. Security: Proper input sanitization and validation
 * 7. Accessibility: Clear labels and keyboard support
 * 8. Visual feedback: Success confirmation when saved
 * 
 * MIGRATION STEPS:
 * 1. Add new methods to HybridPanelManager
 * 2. Remove old methods from StackMapApp
 * 3. Add CSS for form styling
 * 4. Test on both desktop and mobile
 * 5. Remove old CSS for in-place editing hover states
 */