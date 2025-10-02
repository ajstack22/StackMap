/**
 * Animation timing constants for consistent UX across the app
 * All values in milliseconds
 */

export const ANIMATION_DURATION = {
  /** No animation delay */
  INSTANT: 0,

  /** Quick animations (50ms) - micro-interactions */
  MICRO: 50,

  /** Fast animations (100ms) - button presses, quick transitions */
  FAST: 100,

  /** Normal animations (200ms) - standard transitions, fades */
  NORMAL: 200,

  /** Slow animations (300ms) - modal entrances, complex transitions */
  SLOW: 300,

  /** Modal presentation delay (300ms) - prevents jarring immediate appearance */
  MODAL_DELAY: 300,
};

/**
 * Common animation easing presets
 */
export const ANIMATION_EASING = {
  /** Linear easing - constant speed */
  LINEAR: 'linear',

  /** Ease in out - smooth start and end */
  EASE_IN_OUT: 'ease-in-out',

  /** Ease out - quick start, slow end (most common for UI) */
  EASE_OUT: 'ease-out',

  /** Ease in - slow start, quick end */
  EASE_IN: 'ease-in',
};

/**
 * Helper to create a promise-based delay
 * @param {number} duration - Duration in milliseconds (use ANIMATION_DURATION constants)
 * @returns {Promise<void>}
 */
export const delay = duration => new Promise(resolve => setTimeout(resolve, duration));
