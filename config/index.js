// config/index.js - Main Configuration Export
import { CONFIG } from './constants.js';
import { THEMES } from './themes.js';
import { EMOJI_OPTIONS } from '../data/emoji-list.js';
import { EMOJI_NAMES } from '../data/emoji-names.js';

// Export core configuration
export { CONFIG, THEMES };

// Export emoji data structure (maintain compatibility with existing code)
export const EMOJIS = {
    OPTIONS: EMOJI_OPTIONS,
    NAMES: EMOJI_NAMES
};