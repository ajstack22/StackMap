// components/ComponentBuilder.js - Basic DOM utility methods
// === COMPONENT BUILDER ===
export class ComponentBuilder {
    static createElement(tag, className = '', attributes = {}) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
    }

    static createButton(className, iconName, onclick, ariaLabel = '') {
        const button = this.createElement('button', `btn ${className}`, { 
            'aria-label': ariaLabel 
        });
        button.innerHTML = `<span class="material-icons">${iconName}</span>`;
        button.onclick = onclick;
        return button;
    }

    static createInput(className, type = 'text', placeholder = '', maxLength = null) {
        const input = this.createElement('input', `form-field ${className}`, {
            type,
            placeholder
        });
        if (maxLength) input.maxLength = maxLength;
        return input;
    }
}