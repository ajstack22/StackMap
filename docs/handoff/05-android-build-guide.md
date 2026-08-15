# 05 — Android Build & Direct-Install Guide

How to set up, version, sign, and distribute the new app with no store in the loop. The old pipeline (four flavors, fastlane, Play tracks, dual version systems, macOS-only scripts) is replaced by: **one module, one flavor, one Gradle command, one APK you install directly.**

## 1. Project identity

| Setting | Value | Why |
|---|---|---|
| `applicationId` | `app.stackmap.family` (or similar — anything **new**) | A new ID lets the new app coexist with the old install during migration, and decouples it from the old keystore and Play history. Do not reuse `com.stackmapnative`. |
| `minSdk` | **29** (Android 10) | "Modern Android only." Everything the app needs (SAF, scoped storage, dark-free theming) is clean from 29 up. Raise to 31+ freely if every family device is newer; nothing in this app needs to run lower. |
| `targetSdk` / `compileSdk` | Current stable (35 at time of writing; track releases) | |
| Language / UI | Kotlin + Jetpack Compose, single `:app` module | |
| Debug variant | `applicationIdSuffix ".debug"` | Dev build installs beside the family's real app — the one genuinely good idea from the old flavor system. |
| ABI | `arm64-v8a` only | Matches every modern device; halves APK size. (Old app already defaulted to this.) |

## 2. Versioning — keep the date scheme

The old app's Android scheme is worth carrying verbatim:

- **`versionName` = `YY.MM.DD`** (e.g. `26.08.15`)
- **`versionCode` = `YYMMDDXXX`** — date + 3-digit same-day build counter (e.g. `260815001`, `260815002`, …)

It is human-decodable, fits Android's 2.1 B cap for decades, and is automatically monotonic — which matters because **versionCode monotonicity is the only update gate for direct installs**: same signing key + higher versionCode = clean in-place update with data preserved.

Don't port the old `sed`-based bump script (macOS-only, and a separate JS version system fought with it). Compute it in Gradle instead:

```kotlin
// app/build.gradle.kts
val buildDate: String = java.time.LocalDate.now()
    .format(java.time.format.DateTimeFormatter.ofPattern("yyMMdd"))
val buildOfDay: Int = (project.findProperty("buildOfDay") as String? ?: "1").toInt()

defaultConfig {
    versionCode = "$buildDate%03d".format(buildOfDay).toInt()   // 260815001
    versionName = buildDate.chunked(2).joinToString(".")        // 26.08.15
}
```
Second build the same day: `./gradlew assembleRelease -PbuildOfDay=2`.

## 3. Signing — the keystore IS the app ⚠️

With no store, the signing certificate is the only identity that lets a new APK update the installed one. **Lose the keystore and the only path forward is uninstall/reinstall — which deletes the family's data.**

**Generate once:**
```bash
keytool -genkeypair -v \
  -keystore stackmap-family.keystore \
  -alias stackmap-family \
  -keyalg RSA -keysize 4096 \
  -validity 10950   # 30 years
```

**Store it like it matters:**
1. Keystore file + both passwords in the family password manager.
2. A copy of the keystore file in the StackMap backup folder (it's useless without the passwords, so co-locating with backups is fine).
3. Never commit it (`*.keystore` in `.gitignore`, as the old repo did).

**Wire it via a git-ignored properties file** (simpler than the old env-var/Keychain/property triple fallback):
```properties
# keystore.properties  (gitignored)
storeFile=/path/to/stackmap-family.keystore
storePassword=...
keyAlias=stackmap-family
keyPassword=...
```
```kotlin
signingConfigs { create("release") { /* load from keystore.properties */ } }
buildTypes { release { signingConfig = signingConfigs["release"]; isMinifyEnabled = true } }
```
R8 defaults are fine; no keep-rule zoo needed without React Native.

## 4. Manifest

```xml
<uses-permission android:name="android.permission.VIBRATE" />   <!-- only if using Vibrator API; View haptics need nothing -->

<application
    android:allowBackup="true"
    android:dataExtractionRules="@xml/data_extraction_rules"
    android:fullBackupContent="@xml/backup_rules">
```

- **No storage permissions** — SAF covers export/import/backup on every supported API level. (The old app's `READ/WRITE_EXTERNAL_STORAGE` + `requestLegacyExternalStorage` was the legacy pattern that ended up broken.)
- **No INTERNET permission.** The app is offline by construction; leaving the permission out is both a privacy statement and a guarantee.
- No CAMERA (was sync-QR only). No deep links / App Links (were sync-only and dead anyway). Declare the `.json` `ACTION_VIEW` filter **only if** the import-on-open flow is actually implemented (see backup spec §3).
- `allowBackup="true"` reverses the old app's opt-out — see backup spec §4. Exclude the PIN from extraction rules.
- Splash: solid `#5C7E9D` via the SplashScreen API. Launcher icon: build a proper **adaptive icon** from `assets/icon-1024-truly-centered.svg` (the old app shipped legacy non-adaptive PNGs that modern Android letterboxes).
- Fonts: bundle `ComicRelief-Regular.ttf` + `ComicRelief-Bold.ttf` as `res/font/` resources with a `font-family` XML / Compose `FontFamily`; include the SIL OFL license text.

## 5. Build, install, update

**Build:** `./gradlew assembleRelease` → `app/build/outputs/apk/release/app-release.apk`. (No AAB — AABs are for Play.)

**First install on a family device:**
- Copy the APK over (Drive, messaging, USB, `adb install app-release.apk`).
- The device prompts to allow "install unknown apps" for whichever app opens the APK (Files, Drive, etc.) — one-time per source app.

**Updates:** build a new APK (same keystore, later date → higher versionCode), deliver the same way, tap to install. Android verifies the signature matches and updates in place; **app data is preserved**. If Android refuses with a signature or downgrade error: wrong keystore or non-increasing versionCode — never work around it by uninstalling until backups are confirmed current.

**Suggested release ritual** (replaces the whole old pipeline):
1. `./gradlew test assembleRelease`
2. Install on one device, smoke-test: complete an activity, edit mode round-trip, backup file written, import of a v4 fixture.
3. Copy the APK + a dated changelog line into the family backup folder (`apks/stackmap-26.08.15.apk`) — this doubles as version history and disaster recovery.
4. Install on the other devices.

## 6. What was deliberately not carried over

| Old | Status |
|---|---|
| 4 product flavors + `BUILD_TYPE_ENV` native module | Dropped — one environment |
| fastlane (Play upload, track mgmt, Keychain lanes, version-vs-Play checks) | Dropped — no store |
| `scripts/deploy.sh` tiers, `update-mobile-versions.sh`, `version-increment.sh` | Dropped — §2 replaces them |
| React Native, Hermes, Metro bundling, RN ProGuard keeps, `patch-package` | Dropped with the stack |
| Old keystore `android/app/stackmap-release.keystore` (alias `stackmap`) | **Not reused** — but keep it safe until migration completes; it's the only way to ship a fix to the *old* installed app (backup spec §5) |
| MMKV, AsyncStorage, debounced storage adapters | Replaced by Room + DataStore |
