// components/EmojiPicker.js - Enhanced Emoji Picker with Unified Search
// === EMOJI PICKER COMPONENT ===
import { ComponentBuilder } from './ComponentBuilder.js';

export class EmojiPicker {
    static createEmojiPicker(selectedEmoji, onEmojiSelect, filterId) {
        const picker = ComponentBuilder.createElement('div', 'emoji-picker');
        
        // Add header section
        const header = ComponentBuilder.createElement('div', 'emoji-picker__header');
        
        // Unified search/paste input
        const filter = ComponentBuilder.createElement('input', 'emoji-picker__filter');
        filter.type = 'text';
        filter.placeholder = 'Search emojis or paste your own...';
        filter.id = filterId;
        
        // Add hint text
        const hint = ComponentBuilder.createElement('div', 'emoji-picker__hint');
        hint.innerHTML = '💡 Tip: Paste any emoji or search by keywords like "face", "happy", "dark skin"';
        
        // Grid for our emojis
        const grid = ComponentBuilder.createElement('div', 'emoji-picker__grid');
        grid.id = `${filterId}_grid`;
        
        // Assembly
        header.appendChild(filter);
        header.appendChild(hint);
        picker.appendChild(header);
        picker.appendChild(grid);
        
        // Populate grid immediately
        this.renderEmojiGrid(grid, selectedEmoji, onEmojiSelect, EMOJIS.OPTIONS);
        
        // Emoji regex pattern - matches emojis
        const emojiRegex = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/u;
        
        // Handle unified input
        filter.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            
            // Check if input contains emoji
            const emojiMatch = value.match(emojiRegex);
            if (emojiMatch) {
                // User pasted/typed an emoji - select it immediately
                onEmojiSelect(emojiMatch[0]);
                filter.value = '';
                this.showSuccess(filter, 'Emoji selected!');
                // Reset grid to show all
                this.renderEmojiGrid(grid, selectedEmoji, onEmojiSelect, EMOJIS.OPTIONS);
            } else if (value) {
                // Search functionality
                const filteredEmojis = this.smartEmojiSearch(value);
                
                if (filteredEmojis.length === 0) {
                    grid.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #666; font-size: 0.9rem;">
                            No emojis found for "${value}"<br>
                            Try: "face", "animal", "food", "light skin", "red hair", "family"
                        </div>
                    `;
                } else {
                    this.renderEmojiGrid(grid, selectedEmoji, onEmojiSelect, filteredEmojis);
                }
            } else {
                // Empty input - show all
                this.renderEmojiGrid(grid, selectedEmoji, onEmojiSelect, EMOJIS.OPTIONS);
            }
        });
        
        // Handle paste event for better emoji detection
        filter.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const emojiMatch = pastedText.match(emojiRegex);
            
            if (emojiMatch) {
                onEmojiSelect(emojiMatch[0]);
                filter.value = '';
                this.showSuccess(filter, 'Emoji pasted!');
            } else {
                // If not an emoji, treat as search
                filter.value = pastedText;
                filter.dispatchEvent(new Event('input'));
            }
        });
        
        return picker;
    }
    
    static smartEmojiSearch(searchTerm) {
        const terms = searchTerm.toLowerCase().split(' ').filter(t => t.length > 0);
        
        // Process skin tone and hair terms
        const processedTerms = this.processSearchTerms(terms);
        
        return EMOJIS.OPTIONS.filter(emoji => {
            const keywords = (EMOJIS.NAMES[emoji] || '').toLowerCase();
            
            // Check if all processed terms match
            return processedTerms.every(term => {
                // Direct emoji match
                if (emoji === term) return true;
                
                // Keyword match
                if (keywords.includes(term)) return true;
                
                // Synonym matching
                const synonyms = this.getSynonyms(term);
                return synonyms.some(syn => keywords.includes(syn));
            });
        });
    }
    
    static processSearchTerms(terms) {
        const processed = [];
        let skipNext = false;
        
        for (let i = 0; i < terms.length; i++) {
            if (skipNext) {
                skipNext = false;
                continue;
            }
            
            // Check for skin tone combinations
            if (i < terms.length - 1) {
                const combined = this.normalizeSkinTone(terms[i], terms[i + 1]);
                if (combined) {
                    processed.push(combined);
                    skipNext = true;
                    continue;
                }
            }
            
            // Single term normalization
            const normalized = this.normalizeTerm(terms[i]);
            if (normalized) {
                processed.push(normalized);
            }
        }
        
        return processed;
    }
    
    static normalizeSkinTone(term1, term2) {
        const skinToneMap = {
            'light skin': 'light skin',
            'pale skin': 'light skin',
            'white skin': 'light skin',
            'fair skin': 'light skin',
            'medium skin': 'medium skin',
            'olive skin': 'medium skin',
            'tan skin': 'medium light skin',
            'brown skin': 'medium skin',
            'dark skin': 'dark skin',
            'black skin': 'dark skin'
        };
        
        const combined = `${term1} ${term2}`;
        return skinToneMap[combined] || null;
    }
    
    static normalizeTerm(term) {
        const termMap = {
            'light': 'light skin',
            'pale': 'light skin',
            'white': 'light skin',
            'fair': 'light skin',
            'medium': 'medium skin',
            'olive': 'medium skin',
            'tan': 'medium light skin',
            'brown': 'medium skin',
            'dark': 'dark skin',
            'black': 'dark skin',
            'mom': 'mother',
            'dad': 'father',
            'mommy': 'mother',
            'daddy': 'father',
            'kid': 'child',
            'kids': 'children'
        };
        
        return termMap[term] || term;
    }
    
    static getSynonyms(term) {
        const synonymMap = {
            'happy': ['smile', 'joy', 'cheerful', 'glad'],
            'sad': ['unhappy', 'crying', 'tears', 'upset'],
            'angry': ['mad', 'frustrated', 'annoyed'],
            'family': ['parents', 'children', 'mother', 'father'],
            'boy': ['son', 'male', 'child'],
            'girl': ['daughter', 'female', 'child'],
            'man': ['male', 'father', 'dad'],
            'woman': ['female', 'mother', 'mom'],
            'baby': ['infant', 'newborn'],
            'food': ['eat', 'meal', 'breakfast', 'lunch', 'dinner'],
            'animal': ['pet', 'creature'],
            'work': ['job', 'office', 'professional'],
            'school': ['education', 'learn', 'study']
        };
        
        return synonymMap[term] || [];
    }
    
    static showSuccess(input, message) {
        const parent = input.parentElement;
        const existing = parent.querySelector('.emoji-picker__feedback');
        if (existing) existing.remove();
        
        const feedback = ComponentBuilder.createElement('div', 'emoji-picker__feedback emoji-picker__feedback--success');
        feedback.textContent = message;
        parent.appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 2000);
    }
    
    static showError(input, message) {
        const parent = input.parentElement;
        const existing = parent.querySelector('.emoji-picker__feedback');
        if (existing) existing.remove();
        
        const feedback = ComponentBuilder.createElement('div', 'emoji-picker__feedback emoji-picker__feedback--error');
        feedback.textContent = message;
        parent.appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 3000);
    }

    static renderEmojiGrid(grid, selectedEmoji, onEmojiSelect, emojis) {
        grid.innerHTML = '';
        
        emojis.forEach(emoji => {
            const button = ComponentBuilder.createElement('button', 'emoji-picker__option');
            button.textContent = emoji;
            button.title = EMOJIS.NAMES[emoji] || emoji;
            button.type = 'button';
            
            if (emoji === selectedEmoji) {
                button.classList.add('emoji-picker__option--selected');
            }
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update selection
                grid.querySelectorAll('.emoji-picker__option').forEach(opt => {
                    opt.classList.remove('emoji-picker__option--selected');
                });
                button.classList.add('emoji-picker__option--selected');
                
                // Call callback
                if (typeof onEmojiSelect === 'function') {
                    onEmojiSelect(emoji);
                }
            });
            
            grid.appendChild(button);
        });
    }
}