module.exports = {
  root: true,
  extends: [
    '@react-native',
  ],
  plugins: [
    'security',
    'no-secrets',
    'react-hooks',
  ],
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

    // Security rules
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-possible-timing-attacks': 'warn',

    // Prevent secrets in code
    'no-secrets/no-secrets': ['error', {
      'tolerance': 4.5,
      'ignoreContent': ['^REACT_APP_', '^PUBLIC_'],
    }],

    // React hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': ['warn', {
      additionalHooks: '(useAnimatedStyle|useAnimatedProps|useDerivedValue|useAnimatedGestureHandler)',
    }],

    // Additional security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
