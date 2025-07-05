module.exports = {
  // Let React Native handle vector icons automatically
  assets: ['./assets/fonts/'],
  dependencies: {
    'react-native-document-picker': {
      platforms: {
        android: null, // disable Android platform, iOS will still work
      },
    },
  },
};