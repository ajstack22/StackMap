module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Inline environment variables at build time
    ['transform-inline-environment-variables', {
      include: ['BUILD_TYPE', 'NODE_ENV']
    }],
    // Remove console logs in production
    ...(process.env.NODE_ENV === 'production' ? ['transform-remove-console'] : [])
  ],
};
