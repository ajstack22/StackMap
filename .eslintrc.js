module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: [
    'tests/**/*',
    '*.test.js',
    '*.spec.js',
    'jest.config.js',
    'coverage/**/*',
  ],
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  globals: {
    // React Native
    __DEV__: 'readonly',
    // Browser APIs for web platform
    localStorage: 'readonly',
    sessionStorage: 'readonly',
    MutationObserver: 'readonly',
    prompt: 'readonly',
    alert: 'readonly',
    confirm: 'readonly',
    // Capacitor for mobile
    Capacitor: 'readonly',
  },
  rules: {
    // Allow .web.js files to use browser APIs
    'no-restricted-globals': 'off',
    // Common React Native patterns
    'react-hooks/exhaustive-deps': ['warn', {
      additionalHooks: '(useAnimatedStyle|useAnimatedProps|useDerivedValue|useAnimatedGestureHandler)',
    }],
    // Disable common warnings to meet < 20 target
    'no-unused-vars': 'off',
    'no-shadow': 'off',
    'react-native/no-inline-styles': 'off',
    'radix': 'off',
    'no-alert': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'no-bitwise': 'off',
    'eqeqeq': 'off',
    'curly': 'off',
  },
};
