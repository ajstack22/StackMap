# 02 — Data Model

Two layers: the **clean model for the new app** (§1–§3) and the **legacy model** it must be able to read (§4–§6). The old app's persisted data accumulated sync-era audit fields, legacy field aliases, and dead fields; the rebuild stores the clean model and normalizes legacy shapes only at import time.

## 1. Entities (new app)

### User
| Field | Type | Notes |
|---|---|---|
| `id` | String | Opaque unique ID (UUID is fine). Never parse IDs. |
| `name` | String | Required, non-empty after trim. Duplicates allowed. |
| `icon` | String | A single emoji. Default `🐶`. |
| `themeKey` | String | Key into the 21-theme palette. Default `stackBlue`. |
| `taskCelebration` | Enum | `none, random, rainbow, blue, orange, pink, purple, gold, green`. Default `rainbow`. |
| `routineCelebration` | Enum | Same set. Default `rainbow`. |
| `sortOrder` | Int | Display order (old app used map insertion order). |
| `createdAt` | Instant | |

Constraints: max **5** users; the last remaining user cannot be deleted. Old app soft-deleted users (kept forever with `deleted:true`); the rebuild can hard-delete — there is no sync to tombstone for.

### Activity (a day-list entry — per user, per day)
| Field | Type | Notes |
|---|---|---|
| `id` | String | Opaque unique ID. |
| `userId` | String | Owner. |
| `day` | Enum | `TODAY` or `TOMORROW`. These are logical buckets, **not calendar dates**. |
| `position` | Int | Order within the (user, day) list. |
| `text` | String | Required, non-empty. Duplicates allowed. No length cap (old app had none; a soft cap ~200 chars is reasonable). |
| `icon` | String | Emoji. Default `🎯`. |
| `description` | String? | Optional single extra line. |
| `time` | String? | Display-only label, `"HH:MM AM"` 12-hour zero-padded format (e.g. `07:30 PM`). Never parsed, never sorted on, no alarms. |
| `completed` | Boolean | The only authoritative completion flag. |
| `completedAt` | Instant? | Set on complete, cleared on uncomplete. Keep if a "when" display is ever wanted; otherwise optional. |

Dropped from the legacy activity (sync-only, dead, or superseded by decision D5): `pinned` (pinning is dropped — tolerated/ignored on import, written as `false` in exports), `completedBy`, `uncompletedAt`, `uncompletedBy`, `modifiedAt`, `sortIndex`, `orderChangedAt`, `deleted`/`deletedAt` (undo can be in-memory), `type`, `isPersonal`, `addedToLibrary` (runtime-only in current code but persisted in real data), `order` (was never written), legacy aliases `title`/`name`/`emoji`.

### Library
```
LibraryCategory { id, name, icon?, position }
LibraryTemplate { id, categoryId, text, icon, description?, position }
```
- A default category **My Templates** (`id: my-templates`, icon ⭐) always exists; it cannot be renamed or deleted, and is recreated if missing.
- Custom categories: user-named (≤50 chars), created without an icon in the old app; creating a category whose name matches an existing one case-insensitively should reuse the existing category (old behavior).
- Adding a template to a day **copies** it into a new Activity with a fresh id (`completed=false`, `pinned=false`); there is no live link back to the template.

### Device settings (global, not per-user)
| Field | Type | Default | Values |
|---|---|---|---|
| `displayMode` | Enum | `numbers` | `none` \| `numbers` \| `time` — corner badge on cards |
| `dayMode` | Enum | `today` | `today` \| `both` — whether Tomorrow is reachable |
| `bannerPosition` | Enum | `top` | `top` \| `bottom` |
| `currentUserId` | String | first user | Active user pointer |
| `currentDay` | Enum | `today` | Resets to `today` on leaving edit mode |
| `backupFolderUri` | String? | null | SAF tree URI for automatic backups (new) |
| `lastBackupAt` | Instant? | null | (new) |

Per-user in the old app and staying per-user: `themeKey`, `taskCelebration`, `routineCelebration`. The old global settings store merely mirrored the active user's values.

Dropped settings: `soundEnabled` (never implemented), `syncSkipped`, `hasCompletedOnboarding` (rebuild derives first-run from "no users"), `toolbarOrder`, `moreButtonPosition`.

### PIN
A 4-digit numeric PIN gating Edit Mode. Old app stored it **in plaintext** (Android: MMKV instance `stackmap-pin-storage`, key `secure_pin`, hardcoded "encryption" key in source). Rebuild: store a salted hash (or use `EncryptedSharedPreferences`); never include the PIN in exports (old app exported only a `pinEnabled` boolean).

## 2. Recommended persistence (new app)

- **Room** as the single source of truth: `users`, `activities`, `library_categories`, `library_templates` tables mirroring §1. Ordering = explicit `position` column (the old app's "array order is the order" doesn't survive SQL).
- **Preferences DataStore** for device settings + PIN hash.
- Export/backup files are **JSON serializations of the v4 contract** (see [04-backup-spec.md](./04-backup-spec.md)), generated from Room — the DB schema does not need to match the file format field-for-field.
- No debounced-write machinery is needed (that existed to work around iOS AsyncStorage freezes).

## 3. Semantics that are easy to get wrong

- **Completion is only `completed`**. In legacy data, timestamps lie: `completedAt` can coexist with `completed:false` (Complete Day resets the flag without stripping timestamps) and `uncompletedAt` sticks around after re-completing. Never infer state from timestamp presence.
- **Days are buckets, not dates.** Nothing in the data ties "today" to a calendar day. Day advancement is the manual Complete Day flow (plus whatever rollover decision the family makes — see product spec §6).
- **Order is position, full stop.** Legacy `sortIndex`/`orderChangedAt` were sync conflict-resolution stamps rewritten across the whole list on every reorder; ignore them except as a fallback ordering hint on import.
- **IDs are opaque.** Legacy IDs come in at least six formats (`deviceId_ts_rand`, `deviceId-ts-rand`, `tomorrow_<id>_<ts>`, `template-<ts>-<rand>`, `user_<ts>_<rand>`, kebab-case slugs in fixtures). Keep them as strings on import; generate UUIDs for new records.

## 4. Legacy persisted model (what's on the old devices)

Four Zustand stores in AsyncStorage (an SQLite-backed key-value table, `RKStorage`, in the app's private dir — unreachable without the app cooperating, because `allowBackup=false`). Each key holds a JSON **string** of `{"state": {...}, "version": 0}` — readers must unwrap `.state`.

| AsyncStorage key | Contents |
|---|---|
| `stackmap-user-storage` | `users` (map id → User), `currentUser`, `currentDay`, `userContextData` (dead, always `{}`) |
| `stackmap-settings-storage` | `currentTheme`, `bannerPosition`, `soundEnabled`, `taskCelebration`, `routineCelebration`, `displayMode`, `dayMode`, `hasCompletedOnboarding`, `syncSkipped`, `toolbarOrder`, `moreButtonPosition` |
| `stackmap-library-storage` | `library { categories, userAddedActivityIds }`, `libraryTemplates` (vestigial flat array, normally `[]`) |
| `stackmap-sync-storage` | sync state — irrelevant |

Legacy user shape: `{ id, name, icon, days: { today: {activities: []}, tomorrow: {activities: []} }, settings: { theme, taskCelebration, routineCelebration, soundEnabled }, createdAt, lastActive, deleted?, deletedAt?, userAddedActivityIds? }`. Notes:
- `days` has exactly the two literal keys (one dead code path also wrote a `yesterday` bucket; ignore it, but don't crash on it).
- Users may be soft-deleted (`deleted: true`) — **filter them out on import**.
- `settings.theme` is a theme *key* in new data but may be a raw hex color (e.g. `#2196F3`) in old data — map hex to the closest/matching theme key, default `stackBlue`.
- `lastActive` is set once at creation and never updated; ignore.

Legacy activity shape (superset): `{ id, text, icon, completed, pinned, modifiedAt, description?, time?, completedAt?, completedBy?, uncompletedAt?, uncompletedBy?, sortIndex?, orderChangedAt?, deleted?, deletedAt?, type?, isPersonal?, order?, createdAt?, activityType?, addedToLibrary?, title?, name?, emoji? }`.

Confirmed against the family's real export (sanitized copy: `docs/handoff/fixtures/stackmap-export-2026-08-15-sanitized.json`):
- The user object can carry a leaked internal field **`dayToUpdate`** — ignore it.
- **`addedToLibrary`** *is* persisted in real data (older builds wrote it) even though current code treats it as runtime-only — ignore it.
- `createdAt`/`lastActive` can be **absent** from users, and `settings` can be partial (e.g. only `theme`) — require nothing beyond `id`/`name`/`icon`/`days`, and apply defaults for the rest.
- `time` may be explicitly `null` — treat `null`, `""`, and absent the same.
- Library `sortIndex` values can be duplicated or missing within a category — array order is authoritative; `sortIndex` is only a tiebreaker.

PIN (not in the stores): Android MMKV instance `stackmap-pin-storage`, keys `secure_pin` (plaintext 4 digits) and `pin_disabled`. Not exported, not migratable — the family just sets a new PIN.

## 5. Field-normalization rules (apply to ALL imported data)

The old app itself wrote legacy fields (starter cards carried duplicate `title`, one wrote `emoji` with no `icon`), so even "new" exports need these:

| Canonical | Read fallback chain | Then |
|---|---|---|
| activity `text` | `text` → `name` → `title` → `"Untitled"` | drop `name`/`title` |
| activity `icon` | `icon` → `emoji` → `🎯` | drop `emoji`; tolerate `image:<file>` values (custom stickers, assets long gone) by substituting `🎯` |
| user `name` | if object: `.name` → `.text`; non-string → `"User"` | |
| user `icon` | `icon` → `emoji` → `🐶` | drop `emoji` (old code disagreed with itself on the default — `🐶` in stores, `👤` in normalizers; pick `🐶`) |
| activity order | array position; if absent/ambiguous, `sortIndex` ascending | renumber into `position` |
| completion | `completed == true` only | optionally keep `completedAt` when both present and `completed` is true |
| theme | key if in palette; hex → matching theme key; else `stackBlue` | |

Skip on import: entries with `deleted: true` (users and activities), `userContextData`, `userAddedActivityIds`, `libraryTemplates` unless non-empty (if non-empty, fold into My Templates), sync fields.

## 6. Reference: the 21-theme palette

Each theme is `{primary, dark, light}` hex. Copy the exact values from `src/constants/theme.js`. Keys:
`crimson, cherry, scarlet, rust, tangerine, amber, gold, olive, emerald, forest, ocean, sapphire, navy, indigo, plum` (chromatic, AA-compliant with white text) and `sage, dustyBlue, stackBlue, terracotta, lavender, slate` (calming/neurodiversity set). Default `stackBlue` = `#5C7E9D / #4A6680 / #7896B3`. The old theme picker accidentally hid `slate` (`.slice(0,20)` over 21 entries) — show all 21 in the rebuild.

Theme drives: banner/status-bar/nav-bar color, page background (`light`), completed-card background + border, check circles, badges, FAB accents, toasts, modal headers. Text is always black on white/light surfaces and white on `primary` surfaces; there is no `theme.text` token (one stray reference in old code, never defined — don't invent it).
