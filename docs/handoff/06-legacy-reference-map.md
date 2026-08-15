# 06 — Legacy Reference Map

Where to find everything in this repo when a spec detail needs re-verification. Paths are repo-relative; line numbers are as of commit `885e57a` and will drift — search by symbol name.

## 1. Concept → code map

| Concept | Primary source | Notes |
|---|---|---|
| Day view: card rendering, grid, tap-to-complete | `App.js` — `renderActivity` (~4253), grid/FlatList (~4626), `toggleActivity` (~2126) | App.js is a ~6,900-line monolith; almost all screen logic lives here |
| Header/banner + user pill | `App.js` — `Header` (~4442) | iOS-only day-swipe gesture in here too |
| Celebrations | `src/components/CelebrationManager/CelebrationManager.js` | Palettes at top (`green` is buggy), confetti/fireworks params, reduce-motion |
| Context switcher (user/day) | `src/components/Modals/ContextModal/ContextModalV2.js` | Per-user theme swap on select |
| Edit mode list + rows | `src/components/EditModeList/` (`index.js`, `EditModeListItem.js`, `utils.js`, `styles.js`) | `utils.js` has the reorder + stubbed haptics |
| Edit mode state/PIN gate/animations | `App.js` — `isEditMode` (~283), PIN effect (~1050), transitions (~962) | |
| Edit toolbar | `src/components/EditModeToolbar/EditModeToolbar.js` | Default order `['data','access','complete','library','add']` |
| Activity add/edit forms | `src/components/Modals/ActivityModal/`, `src/components/Modals/ActivityManagementModal/AddTabContent.js` | Two paths build slightly different objects |
| Delete + undo toast | `App.js` — `deleteActivity` (~2402); `src/components/Toast/Toast.js` | Soft-delete + ~3.5 s hard delete |
| Library UI | `src/components/Modals/ActivityManagementModal/LibraryTabContent.js` | Add All, rename/delete guards; `ActivityLibraryModal.js` is just chrome |
| Save-to-library picker | `src/components/Modals/CategoryPickerModal/CategoryPickerModal.js` | 50-char cap, case-insensitive dup folding |
| Built-in 60-activity library (seed data) | `src/constants/stackMapLibrary.js` | Clean `{id,text,icon,description}` content |
| Users management | `src/components/Modals/AccessModal/UsersTabContent.js`, `AddUserModal/` | 5-user cap, last-user guard |
| PIN storage + modals | `src/utils/securePinStorage.js`, `Modals/PinModal/`, `AccessModal/PINTabContent.js` | Plaintext PIN in MMKV `stackmap-pin-storage` |
| Complete Day | `src/components/Modals/DayManagementModal/CompleteTabContent.js` + `App.js handleCompleteDayConfirm` (~2971) | Hosted by `CompleteDayModal/` |
| Settings UI | `src/components/Modals/SettingsModal/SettingsModal.js` | Ground truth for option enums |
| Theme picker | `src/components/Modals/PreferencesModal/PreferencesModal.js` | On-screen title "Theme"; `.slice(0,20)` hides slate |
| Theme palette + design tokens | `src/constants/theme.js` | 21 themes `{primary,dark,light}`, SHADOWS/RADIUS/SPACING |
| Layout constants | `src/constants/layout.js` | Columns, card sizes, FONT_SCALE |
| Misc constants | `src/constants/index.js` | Default icons, `EMPTY_CATEGORIES`, `PIN_LENGTH`, `TOAST_DURATION` |
| Stores (persistence) | `src/stores/useUserStore.js`, `useSettingsStore.js`, `useLibraryStore.js` (+ `useAppStore.js` facade) | AsyncStorage keys + debounced adapters |
| Field normalization | `src/utils/dataNormalizer.js`, `src/utils/fieldAccessors.js` | The import-normalization rules |
| Export | `src/components/Modals/DataModal/exportUtils.js` (`buildExportData`) | Exact v4 schema + broken Android Downloads write |
| Import | `DataModal/DataImport.js` → `ImportPreview.js` → `ImportConfirmation.js` → `App.js handleImportComplete` (~3604) | Fresh/merge semantics; live validation is 3 rules in DataImport |
| Strict legacy validator | `App.js validateDataStructure` (~1127) | `version === 4`, requires users/library/libraryTemplates |
| Emoji picker | `src/components/EmojiPicker/EmojiPickerMain.js` | emoji-datasource-apple, 8 categories, skin tones disabled |
| Time picker | `src/components/TimePicker/TimePicker.js` | Produces `"HH:MM AM"` display strings |
| Typography enforcement | `src/components/Typography/index.js` | The RN-Android font hack Compose makes obsolete |
| Logo | `src/components/Logo/Logo.js` | 3-bar SVG geometry |
| Android nav-bar theming | `src/utils/navigationBarTheme.js` | Luminance-based icon color |
| Android project | `android/app/build.gradle`, `android/build.gradle`, `AndroidManifest.xml`, `android/fastlane/Fastfile` | Flavors, signing, permissions, Play lanes |
| Product copy / intent | `README.md`, `docs/BRAND_GUIDELINES.md`, `docs/LLM_CONTEXT_STACKMAP_OVERVIEW.md`, `src/components/Onboarding/OnboardingUserCentered/` | Marketing overstates features — see §3 |

## 2. Dead code — looks real, must NOT be ported

- **`togglePin`** (`App.js` ~2253): fully implemented pin/unpin with tomorrow-copy logic — **no UI ever calls it**. Consequence: `pinned` is always false in practice and Complete Day defaults everything to deletion. The rebuild adds a real pin toggle instead.
- **`ReorderModal`** jump-to-position (~2518): its only trigger renders on a card that never appears in edit mode. Unreachable.
- **`useEditMode`'s undo stack + batch selection** (`src/hooks/useEditMode.js`): implemented, wired to nothing.
- **`src/utils/importExportValidation.js` + `src/utils/fileProcessingUtils.js`**: referenced only by their own tests. They encode *intended* rules (10 MB cap, extension checks) the shipped app never enforced — the backup spec adopted the useful ones deliberately.
- **`src/stores/mmkvStorage.js`**: complete MMKV persistence adapter, imported by nothing. The real persistence is the AsyncStorage adapters inside each store file.
- **`src/utils/activityCrudLogic.js`**: creates activities with legacy `name` field; tests-only. Not the live creation path.
- **Manifest intent filters** (JSON open-with, `stackmap.app/sync` App Links, `stackmap://`): nothing anywhere consumes the launch intent — "Open with StackMap" silently does nothing.
- **`soundEnabled`** setting: no audio code exists in the entire app.
- **`triggerHaptic`**: empty body with a stale "permission missing" comment — VIBRATE *is* in the manifest; someone just never uncommented it.
- **Custom image stickers**: `FEATURE_FLAGS.ENABLE_CUSTOM_EMOJIS=false`, `CUSTOM_IMAGE_SOURCES = {}` (assets archived) — but `image:` icon values still exist in old data; importer maps them to 🎯.
- Also unused: `src/utils/deferredStorage.js`, `clipboardUtils.js`, `screenshotHelper.js`, `src/components/ShareView/` (web-only), `userContextData` and both `userAddedActivityIds` arrays (write-only), the vestigial `yesterday` day bucket, `libraryTemplates` flat array, `secureStorage.js` (superseded by `securePinStorage.js`).
- **Server code in-repo**: `api/` (PHP sync endpoint) and `src/services/api/dev/` (Express dev server) explain the odd `package.json` deps (express, mysql2, redis, bcrypt…). The mobile client never uses them.

## 3. Doc-vs-code discrepancies (trust code)

| Claim in old docs/types | Reality |
|---|---|
| `displayMode: 'cards'\|'list'` (DATA_STRUCTURE.md) or `'numbers'\|'dots'` (types) | `'none' \| 'numbers' \| 'time'`, default `numbers` |
| `dayMode: 'single'\|'both'` | `'today' \| 'both'`, default `today` |
| Mood/weather check-ins, timers, completion sounds, PIN auto-lock (README/marketing) | Never implemented |
| Onboarding feature carousel (docs/onboarding/) | Doesn't exist; docs describe an older design |
| Edit mode: tap-row-to-edit, day-move buttons, checkbox icons, haptics (edit-mode-refactor.md) | Pre-implementation design doc; shipped UI differs in ~11 specifics |
| Activity `order`, `type:'routine'`, category `isCustom`, `Day.date` | Never written by code |
| "Single package name for all environments" (CLAUDE.md) | qual flavor used `com.stackmapnative.qual` |
| Beta ships to "Play Internal Testing" | Fastlane uploads beta to the **alpha/Closed** track as draft |
| "~40 library activities in 5 categories" | 60 in 6 groups |
| "20 themes" / "25+ themes" | 21 defined; picker showed 20 (slice bug) |
| `hasPinProtection` in the settings store | React state in App.js; PIN lives in MMKV |
| Pinning "keeps items always visible" | Pinning means "survives Complete Day" |

## 4. Assets worth carrying out of this repo

| Asset | Path | Use in rebuild |
|---|---|---|
| Comic Relief fonts | `assets/fonts/ComicRelief-{Regular,Bold}.ttf` | Bundle as `res/font/`; add SIL OFL license text (not in repo — fetch it) |
| Icon source art | `assets/icon-1024-truly-centered.svg` | Build the adaptive launcher icon from this |
| UI screenshots | `assets/app-screenshots/` (Pixel 9/Pro XL/Tablet ×6 screens) | Visual reference for the Compose UI (verify against the device before treating as pixel-canon) |
| Seed activity library | `src/constants/stackMapLibrary.js` | 60 curated activities incl. the Wellness set |
| Theme hex values | `src/constants/theme.js` | Copy all 21 verbatim (fix nothing but the picker bug) |
| Celebration palettes | `src/components/CelebrationManager/CelebrationManager.js` | Copy, but replace the pink "green" set |
| Importer test fixtures | `data/demo-data-kids-export.json` (+ `-backup`), `archive/old-data/stackmap-export-2025-08-16-18-52-05.json` | Legacy-shape test data for the new importer |
| Old release keystore | `android/app/stackmap-release.keystore` — **not in git**; dev Mac only, passwords in its Keychain (services `stackmap-keystore-*`) | Only needed for the migration contingency (backup spec §5). Committed `stackmap-production-20251003-140513.aab` in repo root can verify the shipped cert |

## 5. Version archaeology (for the migration)

- Last shipped prod version: `2025.12.11.8` / Android `versionCode 251211003`, `versionName 25.12.11` (commit `43aa879`).
- SAF import fix commits (`4e2c104`, `c987103`, `c307a26`, `574b74e`) all land **after** that version — the installed app predates them.
- Export at HEAD still uses the legacy Downloads write (`exportUtils.js handleAndroidExport`).
- `CURRENT_WORK.md` (Dec 2025) confirms: "Fix Android import/export — Users cannot restore backups on Android."
