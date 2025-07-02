// Re-export all constants for easy importing
export * from './layout';
export * from './theme';

// Common emojis used in the app
export const COMMON_EMOJIS = [
  '😀', '😎', '🤩', '🥳', '🤗', '🤔', '😴', '🌟',
  '⭐', '🎯', '🎨', '🎮', '📚', '📝', '💡', '🏃',
  '🏋️', '🧘', '🎵', '🎸', '🥗', '🍕', '🏆', '💪',
  '🌈', '🌺', '🐶', '🐱', '🦄', '🦋', '🔥', '💧',
];

// Default user icon
export const DEFAULT_USER_ICON = '😀';

// Default activity emoji
export const DEFAULT_ACTIVITY_EMOJI = '🎯';

// Toast duration
export const TOAST_DURATION = 3000;

// PIN length
export const PIN_LENGTH = 4;

// Animation durations
export const ANIMATION_DURATIONS = {
  fast: 200,
  normal: 300,
  slow: 500,
  toastSlide: 300,
};