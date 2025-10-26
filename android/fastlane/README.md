fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## Android

### android store_credentials_in_keychain

```sh
[bundle exec] fastlane android store_credentials_in_keychain
```

Store Google Play service account JSON path in macOS Keychain

Usage: fastlane store_credentials_in_keychain

### android build_debug

```sh
[bundle exec] fastlane android build_debug
```

Build debug APK

Usage: fastlane build_debug

### android build_release

```sh
[bundle exec] fastlane android build_release
```

Build signed release APK and AAB (production flavor)

Usage: fastlane build_release

### android test

```sh
[bundle exec] fastlane android test
```

Run unit tests

Usage: fastlane test

### android test_critical

```sh
[bundle exec] fastlane android test_critical
```

Run critical test suite (integrates with existing qual_deploy.sh)

Usage: fastlane test_critical

### android check_and_increment_version

```sh
[bundle exec] fastlane android check_and_increment_version
```

Check Google Play version codes and increment if needed

Usage: fastlane check_and_increment_version

### android increment_version_code

```sh
[bundle exec] fastlane android increment_version_code
```

Manually increment Android versionCode

Usage: fastlane increment_version_code

### android beta_android

```sh
[bundle exec] fastlane android beta_android
```

Build and deploy to Google Play Closed Testing (beta environment)

Usage: fastlane beta_android

NOTE: Closed Testing allows wider beta tester groups (vs Internal Testing for stage)

### android stage_android

```sh
[bundle exec] fastlane android stage_android
```

Build and deploy to Google Play Internal Testing (stage environment)

Usage: fastlane stage_android

### android qual_android

```sh
[bundle exec] fastlane android qual_android
```

Build and install qual debug APK to local emulator/device

Usage: fastlane qual_android

### android publish_internal_draft

```sh
[bundle exec] fastlane android publish_internal_draft
```

Publish the current draft release to internal testing

Usage: fastlane publish_internal_draft

### android promote_to_production

```sh
[bundle exec] fastlane android promote_to_production
```

Promote internal track release to production

Usage: fastlane promote_to_production

### android prod_android

```sh
[bundle exec] fastlane android prod_android
```

Build and deploy to Google Play Production (full release)

Usage: fastlane prod_android

### android validate_signing

```sh
[bundle exec] fastlane android validate_signing
```

Validate keystore and signing configuration

Usage: fastlane validate_signing

### android screenshots

```sh
[bundle exec] fastlane android screenshots
```

Generate screenshots

### android frame_screenshots

```sh
[bundle exec] fastlane android frame_screenshots
```

Frame screenshots with device frames

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
