# Build Scripts Overview

## Android Build Scripts
- `build-android-old-arch.sh` - Main Android build script (using old architecture)
- `check-android-logs.sh` - Monitor Android device logs for debugging
- `start-emulator-and-install.sh` - Start emulator and install APK

## iOS Scripts  
- `generate-ios-icons.sh` - Generate iOS app icons

## Temporary/Can Delete
- `build-android-simple.sh` - Superseded by build-android-old-arch.sh
- `build-app-only.sh` - Superseded by build-android-old-arch.sh
- `build-release.sh` - Superseded by build-android-old-arch.sh
- `clean-android.sh` - One-time use
- `install-android-build-tools.sh` - One-time setup

## To Clean Up
Run: `rm build-android-simple.sh build-app-only.sh build-release.sh clean-android.sh install-android-build-tools.sh`