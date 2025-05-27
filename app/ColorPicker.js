// components/ColorPicker.js - Color picker creation logic
// === COLOR PICKER COMPONENT ===
import { ComponentBuilder } from './ComponentBuilder.js';

export class ColorPicker {
    static createColorPicker(selectedColor, onColorSelect) {
        const picker = ComponentBuilder.createElement('div', 'color-picker');
        
        picker.innerHTML = THEMES.COLORS.map(color => {
            const isSelected = color === selectedColor ? 'color-picker__option--selected' : '';
            return `<div class="color-picker__option ${isSelected}" 
                         style="background-color: ${color};" 
                         onclick="(${onColorSelect})('${color}')" 
                         title="${color}"></div>`;
        }).join('');
        
        return picker;
    }
}