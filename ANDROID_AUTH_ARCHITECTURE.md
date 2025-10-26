# Android Fastlane Authentication - Architecture Diagrams

**Visual guide to understanding authentication flow and credential management**

---

## Complete Authentication Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT INITIATION                           │
│                    ./scripts/deploy.sh stage --android                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      MASTER DEPLOYMENT SCRIPT                           │
│                     scripts/deploy/deploy.sh                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ • Validates PENDING_CHANGES.md exists                             │  │
│  │ • Increments version in package.json                              │  │
│  │ • Confirms deployment tier with user                              │  │
│  │ • Sets VALIDATED_BY_MASTER=true                                   │  │
│  │ • Delegates to tier-specific script                               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    TIER-SPECIFIC DEPLOYMENT SCRIPT                      │
│                   scripts/deploy/deploy_stage.sh                        │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ • Checks git state (warn for stage, block for beta/prod)         │  │
│  │ • Runs test suite                                                 │  │
│  │ • Calls Fastlane: fastlane stage_android                          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FASTLANE LANE                                   │
│                  android/fastlane/Fastfile                              │
│                     lane :stage_android                                 │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Step 1: validate_signing                                          │  │
│  │         ↓                                                         │  │
│  │ Step 2: check_and_increment_version                               │  │
│  │         ↓                                                         │  │
│  │ Step 3: build_release_flavor(flavor: "stage")                     │  │
│  │         ↓                                                         │  │
│  │ Step 4: upload_to_play_store_with_retry(track: 'internal')       │  │
│  │         ↓                                                         │  │
│  │ Step 5: generate_deployment_summary                               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────┬──────────────────────┬─────────────────────────────┘
                     │                      │
         ┌───────────┘                      └───────────┐
         ▼                                              ▼
┌──────────────────────────┐                ┌────────────────────────────┐
│   GRADLE BUILD SYSTEM    │                │  GOOGLE PLAY CONSOLE API   │
│  (App Signing Auth)      │                │  (Upload Auth)             │
│                          │                │                            │
│  Task:                   │                │  Action:                   │
│  bundleStageRelease      │                │  upload_to_play_store      │
│                          │                │                            │
│  Requires:               │                │  Requires:                 │
│  • Keystore file         │                │  • Service account         │
│  • Store password        │                │  • JSON key file           │
│  • Key password          │                │  • API permissions         │
└──────────┬───────────────┘                └────────────┬───────────────┘
           │                                             │
           ▼                                             ▼
┌──────────────────────────┐                ┌────────────────────────────┐
│  CREDENTIAL RETRIEVAL    │                │  CREDENTIAL RETRIEVAL      │
│                          │                │                            │
│  Helper Lane:            │                │  Helper Lane:              │
│  get_keystore_*_password │                │  get_play_store_json_path  │
│                          │                │                            │
│  Priority:               │                │  Priority:                 │
│  1. macOS Keychain       │                │  1. macOS Keychain         │
│  2. ENV variables        │                │  2. ENV variables          │
│  3. Error (not found)    │                │  3. Error (not found)      │
└──────────┬───────────────┘                └────────────┬───────────────┘
           │                                             │
           ▼                                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        macOS KEYCHAIN                                    │
│                    (Encrypted OS-level storage)                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Service: stackmap-keystore-store-password                          │  │
│  │ Account: stackmap-android                                          │  │
│  │ Password: ••••••••••••••                                           │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │ Service: stackmap-keystore-key-password                            │  │
│  │ Account: stackmap-android                                          │  │
│  │ Password: ••••••••••••••                                           │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │ Service: stackmap-play-store-json-path                             │  │
│  │ Account: stackmap-android                                          │  │
│  │ Password: /Users/you/stackmap-play-console-abc123.json             │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
           │                                             │
           ▼                                             ▼
┌──────────────────────────┐                ┌────────────────────────────┐
│  SIGNING OPERATION       │                │  API AUTHENTICATION        │
│                          │                │                            │
│  Input: Unsigned AAB     │                │  Service Account:          │
│  Keystore: stackmap.jks  │                │  fastlane-stackmap@...     │
│  Output: Signed AAB      │                │                            │
│                          │                │  Permissions:              │
│  Location:               │                │  • Internal Testing ✓      │
│  app/build/outputs/      │                │  • Closed Testing ✓        │
│  bundle/stageRelease/    │                │  • Production ✓            │
│  app-stage-release.aab   │                │                            │
└──────────────────────────┘                └────────────────────────────┘
           │                                             │
           └─────────────────┬───────────────────────────┘
                             ▼
                ┌──────────────────────────┐
                │  GOOGLE PLAY CONSOLE     │
                │  Internal Testing Track  │
                │                          │
                │  Draft Release Created:  │
                │  • Version: 25.10.03     │
                │  • Build: 251003004      │
                │  • Status: Draft         │
                │                          │
                │  Ready for manual        │
                │  publish by developer    │
                └──────────────────────────┘
```

---

## Credential Flow Details

### 1. Keystore Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    GRADLE BUILD REQUEST                     │
│         bundleStageRelease -PMYAPP_RELEASE_STORE_...        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              android/app/build.gradle                       │
│  signingConfigs {                                           │
│    release {                                                │
│      storeFile file('stackmap-release.keystore')            │
│      storePassword System.getenv("STACKMAP_STORE_PASSWORD") │
│                    ?: project.findProperty("MYAPP_...")     │
│      keyAlias 'stackmap'                                    │
│      keyPassword System.getenv("STACKMAP_KEY_PASSWORD")     │
│                  ?: project.findProperty("MYAPP_...")       │
│    }                                                        │
│  }                                                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌──────────────────────┐    ┌─────────────────────────────┐
│  Environment Var     │    │  Gradle Property            │
│  STACKMAP_STORE_     │    │  MYAPP_RELEASE_STORE_       │
│  PASSWORD            │    │  PASSWORD (from Fastlane)   │
│                      │    │                             │
│  Priority: 1         │    │  Priority: 2                │
│  Source: ENV         │    │  Source: Fastlane lane      │
│  (legacy fallback)   │    │  (preferred method)         │
└──────────────────────┘    └─────────────┬───────────────┘
                                          │
                                          ▼
                            ┌───────────────────────────────┐
                            │  Fastlane Fastfile            │
                            │  build_release_flavor lane    │
                            │                               │
                            │  properties: {                │
                            │    "MYAPP_RELEASE_STORE_      │
                            │     PASSWORD" =>              │
                            │      get_keystore_store_      │
                            │      password                 │
                            │  }                            │
                            └──────────┬────────────────────┘
                                       │
                                       ▼
                            ┌───────────────────────────────┐
                            │  get_keystore_store_password  │
                            │  (Fastfile helper lane)       │
                            │                               │
                            │  1. Try Keychain              │
                            │     security find-generic-    │
                            │     password -s 'stackmap-    │
                            │     keystore-store-password'  │
                            │                               │
                            │  2. Try ENV                   │
                            │     ENV["STACKMAP_STORE_      │
                            │     PASSWORD"]                │
                            │                               │
                            │  3. Error if neither found    │
                            └──────────┬────────────────────┘
                                       │
                                       ▼
                            ┌───────────────────────────────┐
                            │  macOS Keychain               │
                            │                               │
                            │  Service:                     │
                            │  stackmap-keystore-store-     │
                            │  password                     │
                            │                               │
                            │  Account:                     │
                            │  stackmap-android             │
                            │                               │
                            │  Password: ••••••••••         │
                            └───────────────────────────────┘
```

### 2. Google Play Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                FASTLANE UPLOAD REQUEST                      │
│      upload_to_play_store(track: 'internal', ...)           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│        upload_to_play_store_with_retry (helper lane)        │
│                                                             │
│  json_key = get_play_store_json_path                        │
│                                                             │
│  upload_to_play_store(                                      │
│    track: 'internal',                                       │
│    aab: 'app/build/.../app-stage-release.aab',              │
│    json_key: json_key,                                      │
│    skip_upload_metadata: true,                              │
│    release_status: 'draft'                                  │
│  )                                                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         get_play_store_json_path (helper lane)              │
│                                                             │
│  Priority 1: macOS Keychain                                 │
│  read_from_keychain(                                        │
│    "stackmap-play-store-json-path",                         │
│    "stackmap-android"                                       │
│  )                                                          │
│  ↓                                                          │
│  Result: /Users/you/stackmap-play-console-abc123.json       │
│                                                             │
│  Priority 2: Environment Variable                           │
│  ENV["PLAY_STORE_JSON_KEY_PATH"]                            │
│                                                             │
│  Priority 3: Error                                          │
│  "Run: fastlane store_credentials_in_keychain"              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    macOS Keychain                           │
│                                                             │
│  Service: stackmap-play-store-json-path                     │
│  Account: stackmap-android                                  │
│  Password: /Users/you/stackmap-play-console-abc123.json     │
│                                                             │
│  (Note: "Password" field stores the file path, not actual   │
│   password - the JSON file itself contains credentials)     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              SERVICE ACCOUNT JSON FILE                      │
│         /Users/you/stackmap-play-console-abc123.json        │
│                                                             │
│  {                                                          │
│    "type": "service_account",                               │
│    "project_id": "stackmap-12345",                          │
│    "private_key_id": "abc123...",                           │
│    "private_key": "-----BEGIN PRIVATE KEY-----\n...",       │
│    "client_email": "fastlane-stackmap@stackmap-12345        │
│                     .iam.gserviceaccount.com",              │
│    "client_id": "123456789...",                             │
│    "auth_uri": "https://accounts.google.com/o/oauth2/auth", │
│    "token_uri": "https://oauth2.googleapis.com/token",      │
│    ...                                                      │
│  }                                                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           GOOGLE PLAY ANDROID DEVELOPER API                 │
│                                                             │
│  1. OAuth2 Authentication                                   │
│     • Uses private_key from JSON                            │
│     • Requests access token from token_uri                  │
│     • Scopes: androidpublisher                              │
│                                                             │
│  2. API Request                                             │
│     POST /edits                                             │
│     • Create edit session                                   │
│                                                             │
│  3. Upload AAB                                              │
│     POST /edits/{editId}/bundles                            │
│     • Upload binary (AAB file)                              │
│                                                             │
│  4. Assign to Track                                         │
│     PUT /edits/{editId}/tracks/internal                     │
│     • Assign to Internal Testing                            │
│                                                             │
│  5. Commit Edit                                             │
│     POST /edits/{editId}:commit                             │
│     • Create draft release                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              GOOGLE PLAY CONSOLE                            │
│              (play.google.com/console)                      │
│                                                             │
│  App: com.stackmapnative                                    │
│  Track: Internal Testing                                    │
│  Status: Draft                                              │
│                                                             │
│  Release: 25.10.03-stage (251003004)                        │
│  • Uploaded: 2025-01-16 10:30 AM                            │
│  • AAB size: 45.2 MB                                        │
│  • Supported devices: 15,234                                │
│  • Ready for manual publish                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Product Flavor Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  ANDROID BUILD SYSTEM (Gradle)                          │
│                                                                         │
│  flavorDimensions "environment"                                         │
└─────────────────────────────────────────────────────────────────────────┘
           │
           ├──────────────┬──────────────┬──────────────┬──────────────┐
           ▼              ▼              ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
    │   QUAL   │   │  STAGE   │   │   BETA   │   │   PROD   │
    │  Flavor  │   │  Flavor  │   │  Flavor  │   │  Flavor  │
    └─────┬────┘   └─────┬────┘   └─────┬────┘   └─────┬────┘
          │              │              │              │
          ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Package ID:  │ │ Package ID:  │ │ Package ID:  │ │ Package ID:  │
│ com.stackmap │ │ com.stackmap │ │ com.stackmap │ │ com.stackmap │
│ native.qual  │ │ native       │ │ native       │ │ native       │
│              │ │              │ │              │ │              │
│ Version:     │ │ Version:     │ │ Version:     │ │ Version:     │
│ 25.10.03-    │ │ 25.10.03-    │ │ 25.10.03-    │ │ 25.10.03     │
│ qual         │ │ stage        │ │ beta         │ │              │
│              │ │              │ │              │ │              │
│ App Name:    │ │ App Name:    │ │ App Name:    │ │ App Name:    │
│ StackMap     │ │ StackMap     │ │ StackMap     │ │ StackMap     │
│ QUAL         │ │ STAGE        │ │              │ │              │
│              │ │              │ │              │ │              │
│ API:         │ │ API:         │ │ API:         │ │ API:         │
│ qual-api     │ │ qual-api     │ │ beta-api     │ │ api          │
│ .stackmap    │ │ .stackmap    │ │ .stackmap    │ │ .stackmap    │
│ .app         │ │ .app         │ │ .app         │ │ .app         │
│              │ │              │ │              │ │              │
│ Database:    │ │ Database:    │ │ Database:    │ │ Database:    │
│ Qual DB      │ │ Qual DB      │ │ Prod DB      │ │ Prod DB      │
│              │ │              │ │              │ │              │
│ Distribution:│ │ Distribution:│ │ Distribution:│ │ Distribution:│
│ Local only   │ │ Play         │ │ Play         │ │ Play Store   │
│ (ADB)        │ │ Internal     │ │ Closed       │ │ Production   │
│              │ │ Testing      │ │ Testing      │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
       │                 │                 │                 │
       ▼                 ▼                 ▼                 ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Build Types: │ │ Build Types: │ │ Build Types: │ │ Build Types: │
│ • Debug      │ │ • Debug      │ │ • Debug      │ │ • Debug      │
│ • Release    │ │ • Release    │ │ • Release    │ │ • Release    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
       │                 │                 │                 │
       ├─────────┐       ├─────────┐       ├─────────┐       ├─────────┐
       ▼         ▼       ▼         ▼       ▼         ▼       ▼         ▼
    qualDebug  qualRel  stageDebug stageRel betaDebug betaRel prodDebug prodRel
    (local)    (unused) (unused)   (Play)   (unused)  (Play)  (unused)  (Play)
```

---

## Deployment Decision Tree

```
                         Start Deployment
                                │
                                ▼
                    ┌───────────────────────┐
                    │ What tier?            │
                    └───────┬───────────────┘
                            │
          ┌─────────────────┼─────────────────┬─────────────────┐
          ▼                 ▼                 ▼                 ▼
    ┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐
    │  QUAL   │       │ STAGE   │       │  BETA   │       │  PROD   │
    └────┬────┘       └────┬────┘       └────┬────┘       └────┬────┘
         │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼
    Local test?      Internal team?     External testers? Public release?
         │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼
    Use qual DB?      Use qual DB?      Use prod DB?      Use prod DB?
         │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼
    ┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐
    │ Auth:   │       │ Auth:   │       │ Auth:   │       │ Auth:   │
    │ None    │       │ Both    │       │ Both    │       │ Both    │
    └────┬────┘       └────┬────┘       └────┬────┘       └────┬────┘
         │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼
    Build debug      Build signed      Build signed      Build signed
    APK              AAB               AAB               AAB
         │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼
    Install via      Upload to         Upload to         Upload to
    ADB              Play Internal     Play Closed       Play Production
         │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼
    Test locally     Manual publish    Manual publish    Manual publish
    on device        to internal team  to beta testers   to public

Auth "Both" = Keystore + Google Play Service Account
```

---

## Security Boundaries

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       DEVELOPER MACHINE (macOS)                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    macOS Keychain (Encrypted)                     │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │ • stackmap-keystore-store-password                          │  │  │
│  │  │ • stackmap-keystore-key-password                            │  │  │
│  │  │ • stackmap-play-store-json-path                             │  │  │
│  │  │                                                             │  │  │
│  │  │ Accessible only with:                                       │  │  │
│  │  │ • macOS user login                                          │  │  │
│  │  │ • Terminal has Keychain access                              │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    File System (Unencrypted)                      │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │ android/app/stackmap-release.keystore                       │  │  │
│  │  │ • File permissions: 600 (owner read/write only)             │  │  │
│  │  │ • NOT in version control (.gitignore)                       │  │  │
│  │  │ • Backed up to encrypted storage                            │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                 │  │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │ /Users/you/stackmap-play-console-abc123.json                │  │  │
│  │  │ • File permissions: 600 (owner read/write only)             │  │  │
│  │  │ • NOT in version control (.gitignore)                       │  │  │
│  │  │ • Path stored in Keychain (not hardcoded)                   │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ HTTPS (encrypted transmission)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         GOOGLE CLOUD (GCP)                              │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Service Account                                │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │ Email: fastlane-stackmap@stackmap-12345.iam.gserviceaccount│  │  │
│  │  │        .com                                                 │  │  │
│  │  │                                                             │  │  │
│  │  │ Permissions (IAM):                                          │  │  │
│  │  │ • Service Account User                                      │  │  │
│  │  │                                                             │  │  │
│  │  │ Keys:                                                       │  │  │
│  │  │ • abc123... (active)                                        │  │  │
│  │  │ • Created: 2025-01-01                                       │  │  │
│  │  │ • Expires: Never                                            │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ OAuth2 + API calls
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    GOOGLE PLAY CONSOLE                                  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    App Permissions                                │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │ App: com.stackmapnative                                     │  │  │
│  │  │                                                             │  │  │
│  │  │ Service Account Permissions:                                │  │  │
│  │  │ ✅ View app information and download bulk reports          │  │  │
│  │  │ ✅ Manage testing track releases                           │  │  │
│  │  │ ✅ Manage production releases                              │  │  │
│  │  │ ❌ Manage orders and subscriptions (NOT GRANTED)           │  │  │
│  │  │ ❌ Manage store presence (NOT GRANTED)                     │  │  │
│  │  │                                                             │  │  │
│  │  │ Allowed Actions:                                            │  │  │
│  │  │ • Upload AAB/APK                                            │  │  │
│  │  │ • Create draft releases                                     │  │  │
│  │  │ • Assign to tracks (internal, closed, production)           │  │  │
│  │  │ • View version codes                                        │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

Security Notes:
1. Keychain credentials never leave macOS - only used locally
2. Service account JSON transmitted over HTTPS (TLS 1.2+)
3. Service account has minimal permissions (principle of least privilege)
4. Keystore file never transmitted - only used for local signing
5. All credential files excluded from version control
6. File permissions restrict access to owner only (chmod 600)
```

---

## Error Handling Flow

```
                        Deployment Starts
                              │
                              ▼
                    ┌──────────────────────┐
                    │ Validate Credentials │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        Keystore OK?    Store Password?   Key Password?
              │                │                │
              │ NO             │ NO             │ NO
              ▼                ▼                ▼
    ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
    │ Error:          │ │ Error:       │ │ Error:       │
    │ Keystore not    │ │ Password not │ │ Password not │
    │ found at:       │ │ found in     │ │ found in     │
    │ android/app/    │ │ Keychain or  │ │ Keychain or  │
    │ stackmap-       │ │ ENV          │ │ ENV          │
    │ release.        │ │              │ │              │
    │ keystore        │ │ Run:         │ │ Run:         │
    │                 │ │ fastlane     │ │ fastlane     │
    │ Create or copy  │ │ store_       │ │ store_       │
    │ keystore file   │ │ credentials_ │ │ credentials_ │
    │                 │ │ in_keychain  │ │ in_keychain  │
    └─────────────────┘ └──────────────┘ └──────────────┘
              │                │                │
              └────────────────┴────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ Deployment   │
                        │ Aborted      │
                        └──────────────┘

                        Validation Passed
                              │
                              ▼
                    ┌──────────────────────┐
                    │ Build AAB            │
                    └──────────┬───────────┘
                               │
                      ┌────────┴────────┐
                      ▼                 ▼
                Build Success?     Build Failed?
                      │                 │
                      │ YES             │ NO
                      │                 ▼
                      │        ┌─────────────────────┐
                      │        │ Possible Causes:    │
                      │        │ • Gradle error      │
                      │        │ • JS bundle error   │
                      │        │ • Signing error     │
                      │        │ • Proguard error    │
                      │        │                     │
                      │        │ Check logs:         │
                      │        │ android/app/build/  │
                      │        │ outputs/logs/       │
                      │        └─────────────────────┘
                      │                 │
                      │                 ▼
                      │        ┌─────────────────────┐
                      │        │ Deployment Aborted  │
                      │        └─────────────────────┘
                      ▼
            ┌──────────────────────┐
            │ Upload to Play Store │
            └──────────┬───────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
    Upload Success?          Upload Failed?
          │                         │
          │ YES                     │ NO
          ▼                         ▼
┌──────────────────┐      ┌──────────────────────┐
│ Draft Release    │      │ Retry Logic          │
│ Created          │      │ (3 attempts)         │
│                  │      │                      │
│ Next Steps:      │      │ Attempt 1: Immediate │
│ 1. Open Play     │      │ Attempt 2: Wait 30s  │
│    Console       │      │ Attempt 3: Wait 60s  │
│ 2. Review draft  │      │ Attempt 4: Wait 120s │
│ 3. Publish to    │      └──────────┬───────────┘
│    testers       │                 │
└──────────────────┘        ┌────────┴────────┐
                            ▼                 ▼
                      Still Failed?     Success?
                            │                 │
                            │ YES             │ NO
                            ▼                 └──> (Draft Created)
                  ┌──────────────────────┐
                  │ Possible Causes:     │
                  │ • 403 Forbidden      │
                  │   → Check service    │
                  │     account perms    │
                  │                      │
                  │ • 400 Bad Request    │
                  │   → Version code     │
                  │     already used     │
                  │                      │
                  │ • Network timeout    │
                  │   → Retry manually   │
                  │                      │
                  │ • Invalid AAB        │
                  │   → Rebuild          │
                  └──────────────────────┘
                            │
                            ▼
                  ┌──────────────────────┐
                  │ Deployment Failed    │
                  │                      │
                  │ Check logs:          │
                  │ /tmp/stackmap-logs/  │
                  │ fastlane-*-*.log     │
                  └──────────────────────┘
```

---

**Document Version:** 1.0
**Last Updated:** January 2025
