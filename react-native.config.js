module.exports = {
  // Let React Native handle vector icons automatically
  assets: ['./assets/fonts/'],
  dependencies: {
    // react-native-document-picker: Android enabled for import functionality (SDK 30+ scoped storage)
    'react-native-keychain': {
      platforms: {
        ios: null, // Disable auto-linking for iOS - causing crash
        android: null, // Disable auto-linking for Android
      },
    },
  },
};