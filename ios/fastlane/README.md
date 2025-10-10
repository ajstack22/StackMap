fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios screenshots

```sh
[bundle exec] fastlane ios screenshots
```

Generate screenshots

### ios frame_screenshots

```sh
[bundle exec] fastlane ios frame_screenshots
```

Frame screenshots with device frames

### ios store_credentials_in_keychain

```sh
[bundle exec] fastlane ios store_credentials_in_keychain
```

Helper: Store credentials securely in macOS Keychain

### ios validate_environment

```sh
[bundle exec] fastlane ios validate_environment
```

Validate build environment and dependencies

### ios setup_certificates

```sh
[bundle exec] fastlane ios setup_certificates
```

Setup code signing certificates and provisioning profiles

### ios build_debug

```sh
[bundle exec] fastlane ios build_debug
```

Build debug version for testing

### ios build_release

```sh
[bundle exec] fastlane ios build_release
```

Build release version for TestFlight/App Store

### ios bump_build_number

```sh
[bundle exec] fastlane ios bump_build_number
```

Increment build number (preserves version string)

### ios upload_testflight

```sh
[bundle exec] fastlane ios upload_testflight
```

Upload to TestFlight (assumes IPA already built)

### ios beta_ios

```sh
[bundle exec] fastlane ios beta_ios
```

Build and deploy to TestFlight (complete beta pipeline)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
