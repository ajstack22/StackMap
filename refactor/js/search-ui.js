class SearchUI {
    constructor() {
        this.searchInput = null;
        this.searchContainer = null;
        this.suggestionsContainer = null;
        this.clearButton = null;
        this.searchHistory = this.loadSearchHistory();
        this.currentSuggestions = [];
        this.selectedSuggestionIndex = -1;
        this.voiceSearchSupported = this.checkVoiceSearchSupport();
    }
    
    // Render the search UI component
    render() {
        const html = `
            <div class="search-container" role="search">
                <div class="search-input-wrapper">
                    <input type="search" 
                           class="search-input" 
                           placeholder="Search activities..."
                           autocomplete="off"
                           autocorrect="off"
                           autocapitalize="off"
                           spellcheck="false"
                           aria-label="Search activities"
                           aria-describedby="search-help">
                    <button class="search-clear" 
                            aria-label="Clear search" 
                            style="display: none;">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <path d="M10 8.586L4.707 3.293a1 1 0 0 0-1.414 1.414L8.586 10l-5.293 5.293a1 1 0 1 0 1.414 1.414L10 11.414l5.293 5.293a1 1 0 0 0 1.414-1.414L11.414 10l5.293-5.293a1 1 0 0 0-1.414-1.414L10 8.586z"/>
                        </svg>
                    </button>
                    ${this.voiceSearchSupported ? `
                        <button class="voice-search" aria-label="Voice search">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <path d="M10 12a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v4a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H3a7 7 0 0 0 6 6.93V19h2v-3.07A7 7 0 0 0 17 9h-2z"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
                <div class="search-suggestions" role="listbox" aria-label="Search suggestions" style="display: none;"></div>
                <div id="search-help" class="search-help" style="display: none;">
                    <p>Tips: Use # for tags, "morning" for time ranges, or natural language like "tomorrow's tasks"</p>
                </div>
            </div>
        `;
        
        return html;
    }
    
    // Initialize the search UI after rendering
    initialize(container) {
        this.searchContainer = container.querySelector('.search-container');
        this.searchInput = container.querySelector('.search-input');
        this.clearButton = container.querySelector('.search-clear');
        this.suggestionsContainer = container.querySelector('.search-suggestions');
        
        if (this.voiceSearchSupported) {
            this.voiceButton = container.querySelector('.voice-search');
            this.initializeVoiceSearch();
        }
        
        this.attachEventListeners();
    }
    
    // Attach event listeners
    attachEventListeners() {
        // Search input events
        this.searchInput.addEventListener('input', this.handleInput.bind(this));
        this.searchInput.addEventListener('focus', this.handleFocus.bind(this));
        this.searchInput.addEventListener('blur', this.handleBlur.bind(this));
        this.searchInput.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Clear button
        this.clearButton.addEventListener('click', this.clearSearch.bind(this));
        
        // Suggestions container
        this.suggestionsContainer.addEventListener('click', this.handleSuggestionClick.bind(this));
    }
    
    // Handle input changes
    handleInput(e) {
        const query = e.target.value;
        
        // Show/hide clear button
        this.clearButton.style.display = query.length > 0 ? 'block' : 'none';
        
        // Dispatch search event
        document.dispatchEvent(new CustomEvent('searchInput', {
            detail: { query }
        }));
        
        // Update suggestions
        if (query.length >= 2) {
            this.showSuggestions(query);
        } else {
            this.hideSuggestions();
        }
    }
    
    // Handle focus event
    handleFocus(e) {
        const query = e.target.value;
        if (query.length >= 2) {
            this.showSuggestions(query);
        } else if (query.length === 0) {
            this.showRecentSearches();
        }
    }
    
    // Handle blur event
    handleBlur(e) {
        // Delay to allow suggestion clicks
        setTimeout(() => {
            this.hideSuggestions();
        }, 200);
    }
    
    // Handle keyboard navigation
    handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectNextSuggestion();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectPreviousSuggestion();
                break;
            case 'Enter':
                if (this.selectedSuggestionIndex >= 0) {
                    e.preventDefault();
                    this.selectSuggestion(this.selectedSuggestionIndex);
                } else {
                    this.addToHistory(e.target.value);
                }
                break;
            case 'Escape':
                this.clearSearch();
                this.searchInput.blur();
                break;
        }
    }
    
    // Show search suggestions
    showSuggestions(query) {
        // Get suggestions from search engine
        document.dispatchEvent(new CustomEvent('requestSuggestions', {
            detail: { query }
        }));
    }
    
    // Display suggestions
    displaySuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        this.currentSuggestions = suggestions;
        this.selectedSuggestionIndex = -1;
        
        const html = suggestions.map((suggestion, index) => `
            <div class="search-suggestion" 
                 role="option" 
                 data-index="${index}"
                 aria-selected="false">
                ${suggestion.icon ? `<span class="suggestion-icon">${suggestion.icon}</span>` : ''}
                <span class="suggestion-text">${this.highlightQuery(suggestion.text, suggestion.query)}</span>
                ${suggestion.type ? `<span class="suggestion-type">${suggestion.type}</span>` : ''}
            </div>
        `).join('');
        
        this.suggestionsContainer.innerHTML = html;
        this.suggestionsContainer.style.display = 'block';
    }
    
    // Show recent searches
    showRecentSearches() {
        if (this.searchHistory.length === 0) {
            return;
        }
        
        const suggestions = this.searchHistory.slice(0, 5).map(search => ({
            text: search,
            type: 'recent',
            icon: '🕐'
        }));
        
        this.displaySuggestions(suggestions);
    }
    
    // Hide suggestions
    hideSuggestions() {
        this.suggestionsContainer.style.display = 'none';
        this.currentSuggestions = [];
        this.selectedSuggestionIndex = -1;
    }
    
    // Select next suggestion
    selectNextSuggestion() {
        if (this.currentSuggestions.length === 0) return;
        
        this.selectedSuggestionIndex = (this.selectedSuggestionIndex + 1) % this.currentSuggestions.length;
        this.updateSuggestionSelection();
    }
    
    // Select previous suggestion
    selectPreviousSuggestion() {
        if (this.currentSuggestions.length === 0) return;
        
        this.selectedSuggestionIndex = this.selectedSuggestionIndex <= 0 
            ? this.currentSuggestions.length - 1 
            : this.selectedSuggestionIndex - 1;
        this.updateSuggestionSelection();
    }
    
    // Update visual selection
    updateSuggestionSelection() {
        const suggestions = this.suggestionsContainer.querySelectorAll('.search-suggestion');
        suggestions.forEach((el, index) => {
            if (index === this.selectedSuggestionIndex) {
                el.classList.add('selected');
                el.setAttribute('aria-selected', 'true');
            } else {
                el.classList.remove('selected');
                el.setAttribute('aria-selected', 'false');
            }
        });
    }
    
    // Handle suggestion click
    handleSuggestionClick(e) {
        const suggestionEl = e.target.closest('.search-suggestion');
        if (suggestionEl) {
            const index = parseInt(suggestionEl.dataset.index);
            this.selectSuggestion(index);
        }
    }
    
    // Select a suggestion
    selectSuggestion(index) {
        const suggestion = this.currentSuggestions[index];
        if (suggestion) {
            this.searchInput.value = suggestion.text;
            this.addToHistory(suggestion.text);
            this.hideSuggestions();
            
            // Trigger search
            document.dispatchEvent(new CustomEvent('searchInput', {
                detail: { query: suggestion.text }
            }));
        }
    }
    
    // Clear search
    clearSearch() {
        this.searchInput.value = '';
        this.clearButton.style.display = 'none';
        this.hideSuggestions();
        
        document.dispatchEvent(new CustomEvent('searchCleared'));
    }
    
    // Highlight query in text
    highlightQuery(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    // Escape regex special characters
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Add to search history
    addToHistory(query) {
        if (!query || query.trim().length === 0) return;
        
        // Remove if already exists
        this.searchHistory = this.searchHistory.filter(q => q !== query);
        
        // Add to beginning
        this.searchHistory.unshift(query);
        
        // Limit to 10 items
        this.searchHistory = this.searchHistory.slice(0, 10);
        
        this.saveSearchHistory();
    }
    
    // Save search history
    saveSearchHistory() {
        try {
            localStorage.setItem('stackmap_search_history', JSON.stringify(this.searchHistory));
        } catch (e) {
            console.error('Failed to save search history:', e);
        }
    }
    
    // Load search history
    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('stackmap_search_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load search history:', e);
            return [];
        }
    }
    
    // Check voice search support
    checkVoiceSearchSupport() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }
    
    // Initialize voice search
    initializeVoiceSearch() {
        if (!this.voiceButton) return;
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        
        this.voiceButton.addEventListener('click', this.startVoiceSearch.bind(this));
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.searchInput.value = transcript;
            this.handleInput({ target: this.searchInput });
            this.addToHistory(transcript);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Voice search error:', event.error);
            this.voiceButton.classList.remove('listening');
        };
        
        this.recognition.onend = () => {
            this.voiceButton.classList.remove('listening');
        };
    }
    
    // Start voice search
    startVoiceSearch() {
        if (this.recognition) {
            this.voiceButton.classList.add('listening');
            this.recognition.start();
        }
    }
    
    // Set search value programmatically
    setValue(value) {
        this.searchInput.value = value;
        this.clearButton.style.display = value.length > 0 ? 'block' : 'none';
    }
    
    // Get current search value
    getValue() {
        return this.searchInput.value;
    }
    
    // Focus the search input
    focus() {
        this.searchInput.focus();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchUI;
}