// Security utility functions for StackMap

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} unsafe - The string to escape
 * @returns {string} The escaped string safe for HTML insertion
 */
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        return '';
    }
    
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Creates a safe HTML string with escaped variables
 * Usage: safeHtml`<div>${userInput}</div>`
 * @param {TemplateStringsArray} strings - Template literal strings
 * @param {...any} values - Values to be escaped
 * @returns {string} Safe HTML string
 */
function safeHtml(strings, ...values) {
    let result = strings[0];
    for (let i = 0; i < values.length; i++) {
        result += escapeHtml(String(values[i])) + strings[i + 1];
    }
    return result;
}

/**
 * Validates and sanitizes user input
 * @param {string} input - User input to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized input
 */
function sanitizeUserInput(input, maxLength = 50) {
    if (!input || typeof input !== 'string') return '';
    
    // Trim whitespace and limit length
    let sanitized = input.trim().slice(0, maxLength);
    
    // Remove any potential script tags or event handlers
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    return sanitized;
}

// Export for use in other files
window.SecurityUtils = {
    escapeHtml,
    safeHtml,
    sanitizeUserInput
};