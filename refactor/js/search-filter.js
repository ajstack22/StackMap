class SearchFilter {
    constructor() {
        this.searchIndex = new Map();
        this.debounceTimer = null;
        this.searchCache = new Map();
    }
    
    // Levenshtein distance for fuzzy matching
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(
                        dp[i - 1][j],    // deletion
                        dp[i][j - 1],    // insertion
                        dp[i - 1][j - 1] // substitution
                    );
                }
            }
        }
        
        return dp[m][n];
    }
    
    // Fuzzy string matching with scoring
    fuzzyMatch(query, text) {
        if (!query || !text) return { score: 0, matches: [] };
        
        query = query.toLowerCase();
        text = text.toLowerCase();
        
        // Exact match gets highest score
        if (text.includes(query)) {
            const startIndex = text.indexOf(query);
            return {
                score: 1.0,
                matches: [{start: startIndex, end: startIndex + query.length}]
            };
        }
        
        // Calculate fuzzy match score
        const distance = this.levenshteinDistance(query, text.substring(0, Math.min(text.length, query.length + 5)));
        const maxLength = Math.max(query.length, text.length);
        const score = 1 - (distance / maxLength);
        
        // Word-by-word matching for partial matches
        const queryWords = query.split(/\s+/);
        const textWords = text.split(/\s+/);
        const matches = [];
        let wordScore = 0;
        
        for (const queryWord of queryWords) {
            for (let i = 0; i < textWords.length; i++) {
                if (textWords[i].includes(queryWord)) {
                    const startIndex = text.indexOf(textWords[i]);
                    matches.push({
                        start: startIndex,
                        end: startIndex + textWords[i].length
                    });
                    wordScore += 0.3;
                }
            }
        }
        
        return {
            score: Math.max(score, wordScore),
            matches: matches
        };
    }
    
    // Real-time search with debouncing
    search(query, options = {}) {
        clearTimeout(this.debounceTimer);
        
        return new Promise((resolve) => {
            this.debounceTimer = setTimeout(() => {
                const results = this.performSearch(query, options);
                resolve(results);
            }, 150);
        });
    }
    
    // Perform the actual search
    performSearch(query, options = {}) {
        if (!query || query.trim().length === 0) {
            return [];
        }
        
        // Check cache first
        const cacheKey = `${query}_${JSON.stringify(options)}`;
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey);
        }
        
        const results = [];
        const threshold = options.threshold || 0.3;
        
        // Search through indexed activities
        for (const [activityId, searchableText] of this.searchIndex) {
            const matchResult = this.fuzzyMatch(query, searchableText);
            
            if (matchResult.score >= threshold) {
                results.push({
                    activityId: activityId,
                    score: matchResult.score,
                    matches: matchResult.matches,
                    text: searchableText
                });
            }
        }
        
        // Sort by score (highest first)
        results.sort((a, b) => b.score - a.score);
        
        // Limit results
        const limitedResults = results.slice(0, options.limit || 50);
        
        // Cache results
        this.searchCache.set(cacheKey, limitedResults);
        
        return limitedResults;
    }
    
    // Index an activity for searching
    indexActivity(activity) {
        if (!activity || !activity.id) return;
        
        // Combine title, description, and tags for searchable text
        const searchableText = [
            activity.title || '',
            activity.description || '',
            ...(activity.tags || []),
            activity.type || '',
            activity.timeRange || ''
        ].join(' ').toLowerCase();
        
        this.searchIndex.set(activity.id, searchableText);
        
        // Clear cache when index changes
        this.searchCache.clear();
    }
    
    // Remove activity from index
    removeFromIndex(activityId) {
        this.searchIndex.delete(activityId);
        this.searchCache.clear();
    }
    
    // Clear entire index
    clearIndex() {
        this.searchIndex.clear();
        this.searchCache.clear();
    }
    
    // Get search suggestions based on partial query
    getSuggestions(partialQuery, limit = 5) {
        if (!partialQuery || partialQuery.length < 2) {
            return [];
        }
        
        const suggestions = new Set();
        const query = partialQuery.toLowerCase();
        
        // Find activities that start with the query
        for (const [activityId, text] of this.searchIndex) {
            const words = text.split(/\s+/);
            for (const word of words) {
                if (word.startsWith(query) && word.length > query.length) {
                    suggestions.add(word);
                    if (suggestions.size >= limit) {
                        return Array.from(suggestions);
                    }
                }
            }
        }
        
        return Array.from(suggestions);
    }
    
    // Highlight search matches in text
    highlightMatches(text, matches) {
        if (!matches || matches.length === 0) {
            return text;
        }
        
        // Sort matches by start position
        matches.sort((a, b) => a.start - b.start);
        
        let highlightedText = '';
        let lastEnd = 0;
        
        for (const match of matches) {
            highlightedText += text.substring(lastEnd, match.start);
            highlightedText += `<mark>${text.substring(match.start, match.end)}</mark>`;
            lastEnd = match.end;
        }
        
        highlightedText += text.substring(lastEnd);
        
        return highlightedText;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchFilter;
}