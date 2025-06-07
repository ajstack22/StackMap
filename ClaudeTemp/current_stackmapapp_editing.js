/* 
 * CURRENT TITLE/SUBTITLE EDITING IMPLEMENTATION
 * Extracted from StackMapApp.js - Lines 2180-2300
 * This shows how in-place editing currently works
 */

class StackMapApp {
    // ... other methods ...

    /**
     * CURRENT APPROACH: In-place editing on header elements
     * Called when entering edit mode to make title/subtitle clickable
     */
    setupEditableElements() {
        if (!this.grownupMode) return;
        
        // Get header elements
        const title = document.getElementById('mainTitle');
        const subtitle = document.getElementById('subtitle');
        
        // Make each element editable
        [title, subtitle].forEach(element => {
            if (element) {
                this.makeElementEditable(element);
            }
        });
        
        console.log('Editable elements setup complete');
    }

    /**
     * CORE EDITING LOGIC: How in-place editing works
     * This is the main logic that would need to be moved/replaced
     */
    makeElementEditable(element) {
        const originalText = element.textContent;
        
        // Click handler - makes element editable
        element.addEventListener('click', (e) => {
            if (!this.grownupMode) return;
            
            e.preventDefault();
            element.contentEditable = true;
            element.focus();
            
            // Select all text for easy replacement
            const range = document.createRange();
            range.selectNodeContents(element);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            console.log(`Editing ${element.id}:`, originalText);
        });
        
        // Save on blur (click away)
        element.addEventListener('blur', () => {
            this.saveEditableElement(element);
        });
        
        // Save on Enter key
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                element.blur(); // Triggers save
            }
            if (e.key === 'Escape') {
                element.textContent = originalText; // Restore original
                element.blur();
            }
        });
    }

    /**
     * SAVE LOGIC: How changes are persisted
     * This logic could be reused in any new implementation
     */
    saveEditableElement(element) {
        element.contentEditable = false;
        const newText = element.textContent.trim();
        
        // Prevent empty values
        if (!newText) {
            if (element.id === 'mainTitle') {
                element.textContent = 'StackMap';
            } else if (element.id === 'subtitle') {
                element.textContent = 'Routine Ready';
            }
            return;
        }
        
        // Update settings based on which element was edited
        if (element.id === 'mainTitle') {
            this.appState.settings.title = newText;
            this.appState.settings.isDefaultTitle = (newText === 'StackMap');
            console.log('Title updated to:', newText);
        } else if (element.id === 'subtitle') {
            this.appState.settings.subtitle = newText;
            this.appState.settings.isDefaultSubtitle = (newText === 'Routine Ready');
            console.log('Subtitle updated to:', newText);
        }
        
        // Persist changes
        this.appState._triggerSave();
        
        // Update browser tab title
        this.updateTabTitle();
        
        // Update any duplicate elements (like fixed header)
        this.syncHeaderElements();
    }

    /**
     * TAB TITLE SYNC: Updates browser tab
     * This ensures tab title stays in sync with app title
     */
    updateTabTitle() {
        const { isDefaultTitle, title } = this.appState.settings;
        document.title = isDefaultTitle ? 'StackMap' : title;
    }

    /**
     * HEADER SYNC: Updates any duplicate header elements
     * Ensures consistency across multiple header instances
     */
    syncHeaderElements() {
        const mainTitle = document.getElementById('mainTitle');
        const fixedTitle = document.getElementById('fixedTitle');
        const mainSubtitle = document.getElementById('subtitle');
        const fixedSubtitle = document.getElementById('fixedSubtitle');
        
        if (mainTitle && fixedTitle) {
            fixedTitle.textContent = mainTitle.textContent;
        }
        if (mainSubtitle && fixedSubtitle) {
            fixedSubtitle.textContent = mainSubtitle.textContent;
        }
    }

    /**
     * MODE SWITCHING: Enable/disable editing
     * Called when entering/exiting edit mode
     */
    enterGrownupMode() {
        this.grownupMode = true;
        document.body.classList.add('grownup-mode');
        
        // Enable title/subtitle editing
        this.setupEditableElements();
        
        // Other edit mode setup...
        this.render();
        console.log('Entered edit mode - title/subtitle editing enabled');
    }

    exitGrownupMode() {
        this.grownupMode = false;
        document.body.classList.remove('grownup-mode');
        
        // Disable editing by removing contenteditable
        const title = document.getElementById('mainTitle');
        const subtitle = document.getElementById('subtitle');
        [title, subtitle].forEach(element => {
            if (element) {
                element.contentEditable = false;
            }
        });
        
        // Other exit mode cleanup...
        this.render();
        console.log('Exited edit mode - title/subtitle editing disabled');
    }
}

/* 
 * ALTERNATIVE IMPLEMENTATION CONCEPTS:
 * 
 * Option 1: Management Panel Integration
 * - Move this logic to HybridPanelManager.js
 * - Create form inputs in the panel
 * - Use same save logic but with input.value instead of contentEditable
 * 
 * Option 2: Dedicated Edit Cards
 * - Create new card component for app settings
 * - Render in main content area during edit mode
 * - Use same save logic but in card context
 * 
 * Either approach would reuse the saveEditableElement logic
 * but replace the makeElementEditable approach with form inputs
 */