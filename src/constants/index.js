// Re-export all constants for easy importing
export * from './layout';
export * from './theme';
export * from './featureFlags';

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

// Custom image sources mapping
export const CUSTOM_IMAGE_SOURCES = {
  'ChickenNuggets.png': require('../../assets/images/ChickenNuggets.png'),
  'FishSticks.png': require('../../assets/images/FishSticks.png'),
  'fish_sticks.png': require('../../assets/images/fish_sticks.png'),
  'Fusion.png': require('../../assets/images/Fusion.png'),
  'GoldenRetriever.png': require('../../assets/images/GoldenRetriever.png'),
  'GoldfishCrackers.png': require('../../assets/images/GoldfishCrackers.png'),
  'kart.png': require('../../assets/images/kart.png'),
  'lambo.png': require('../../assets/images/lambo.png'),
  'RAV4.png': require('../../assets/images/RAV4.png'),
  'Swingset.png': require('../../assets/images/Swingset.png'),
  'breakfast_dog.png': require('../../assets/images/breakfast_dog.png'),
};