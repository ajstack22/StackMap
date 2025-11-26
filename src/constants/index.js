// Re-export all constants for easy importing
export * from './layout';
export * from './theme';
export * from './colors';
export * from './featureFlags';

// Common emojis used in the app
export const COMMON_EMOJIS = [
  '😀',
  '😎',
  '🤩',
  '🥳',
  '🤗',
  '🤔',
  '😴',
  '🌟',
  '⭐',
  '🎯',
  '🎨',
  '🎮',
  '📚',
  '📝',
  '💡',
  '🏃',
  '🏋️',
  '🧘',
  '🎵',
  '🎸',
  '🥗',
  '🍕',
  '🏆',
  '💪',
  '🌈',
  '🌺',
  '🐶',
  '🐱',
  '🦄',
  '🦋',
  '🔥',
  '💧',
];

// Default user icon
export const DEFAULT_USER_ICON = '🐶';

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

// Custom images have been archived and removed from the build
// These 18MB of PNG files were causing 5+ second startup delays
// Files moved to: /archive/unused-images/
export const CUSTOM_IMAGE_SOURCES = {};

// Export a stub function for backward compatibility
export const getCustomImageSource = imageName => {
  // Images have been archived - return null
  return null;
};

// Default empty categories for library initialization
export const EMPTY_CATEGORIES = [
  {
    id: 'my-templates',
    name: 'My Templates',
    icon: '⭐',
    activities: [],
  },
];
