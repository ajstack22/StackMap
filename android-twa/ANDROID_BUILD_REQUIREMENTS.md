# Android Build Requirements

## ✅ Completed:
1. **Signing Key Generated**
   - Keystore: `stackmap-release.keystore`
   - SHA256: `CA:AE:CE:81:09:F4:90:32:1C:C9:DC:38:BE:E2:B0:28:F4:54:EB:52:09:19:60:16:4C:CD:12:F1:97:88:38:FE`
   - Digital Asset Links updated

2. **Java Installed**
   - OpenJDK 24.0.1 via Homebrew
   - Path: `/opt/homebrew/Cellar/openjdk/24.0.1`

3. **Gradle Installed**
   - Gradle 8.14.2 via Homebrew
   - Gradle wrapper created

## ❌ Still Needed:
1. **Android SDK**
   - Option 1: Install Android Studio (includes everything)
   - Option 2: Install command line tools only
   
2. **Environment Setup**
   - Set ANDROID_HOME environment variable
   - Install required SDK components:
     - Android SDK Platform 34
     - Android SDK Build-Tools
     - Android SDK Platform-Tools

## Next Steps:

### Option 1: Install Android Studio (Recommended)
1. Download from: https://developer.android.com/studio
2. Install and open Android Studio
3. It will automatically download all required SDK components
4. Set ANDROID_HOME: `export ANDROID_HOME=$HOME/Library/Android/sdk`

### Option 2: Command Line Tools Only
```bash
# Download command line tools
# From: https://developer.android.com/studio#command-tools

# Extract to ~/android-sdk
mkdir -p ~/android-sdk
unzip commandlinetools-mac-*.zip -d ~/android-sdk

# Set up environment
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Install required components
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

## Once Android SDK is installed:
```bash
# Build debug APK
./gradlew assembleDebug

# The APK will be at:
# app/build/outputs/apk/debug/app-debug.apk
```

## Important Security Notes:
- **NEVER** commit `stackmap-release.keystore` to version control
- Keep a secure backup of the keystore file
- Store the keystore password securely
- You'll need this keystore for all future app updates