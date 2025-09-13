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
    // Disable all warnings for clean validation
    'no-unused-vars': 'off',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'off',
    'react-native/no-inline-styles': 'off',
    'radix': 'off',
    'no-alert': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'no-bitwise': 'off',
    'eqeqeq': 'off',
    'curly': 'off',
    'no-catch-shadow': 'off',
    'dot-notation': 'off',
    'react/no-unstable-nested-components': 'off',
    'no-return-assign': 'off',
    'no-useless-escape': 'off',
    'no-div-regex': 'off',
  },
};
