import { NativeModules, Platform } from 'react-native';

/**
 * Helper class for managing screenshots during automated testing
 */
class ScreenshotHelper {
  constructor() {
    this.isScreenshotMode = false;
    this.screenshotCallbacks = {};
  }

  /**
   * Enable screenshot mode - this should be set via launch arguments
   */
  enableScreenshotMode() {
    this.isScreenshotMode = true;
  }

  /**
   * Register a callback for a specific screenshot point
   */
  registerScreenshot(name, callback) {
    if (this.isScreenshotMode) {
      this.screenshotCallbacks[name] = callback;
    }
  }

  /**
   * Trigger a screenshot at a specific point
   */
  async captureScreenshot(name, delay = 1000) {
    if (!this.isScreenshotMode) return;

    // Wait for any animations to complete
    await new Promise(resolve => setTimeout(resolve, delay));

    // Execute any registered callbacks
    if (this.screenshotCallbacks[name]) {
      await this.screenshotCallbacks[name]();
    }

    // Signal to the test runner that we're ready for a screenshot
    if (Platform.OS === 'ios') {
      // For iOS, we'll use accessibility labels that the UI test can find
    } else {
      // For Android, we can use a similar approach
    }

    // Give the test runner time to capture
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Helper to set up common screenshot scenarios
   */
  async setupScreenshotScenarios() {
    // These would be called at appropriate points in your app
    return {
      mainScreen: async () => {
        // Ensure main screen is in a good state
        await this.captureScreenshot('01_MainScreen');
      },

      editMode: async () => {
        // Trigger edit mode and capture
        await this.captureScreenshot('02_EditMode');
      },

      activityLibrary: async () => {
        // Open activity library
        await this.captureScreenshot('03_ActivityLibrary');
      },

      settings: async () => {
        // Navigate to settings
        await this.captureScreenshot('04_Settings');
      },

      celebrationMode: async () => {
        // Show celebration animation
        await this.captureScreenshot('05_Celebration');
      },
    };
  }
}

export default new ScreenshotHelper();
