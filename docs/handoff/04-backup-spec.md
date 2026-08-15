# 04 — Backup Spec

Backup is the app's only safety net (no sync, no cloud, no store). Three layers:

1. **Automatic local backups** (new capability — nothing like it exists in the old app)
2. **Manual export / import** (kept, format-compatible with the old app)
3. **Android Auto Backup** (OS-level, was explicitly disabled in the old app — enable it)

Plus §5: the one-time **migration off the old app** — resolved (a verified export exists), with the legacy quirks it taught us.

## 1. The file format: v4 compatibility contract

One JSON format serves automatic backups, manual exports, and old-app files. It is the old app's "version 4" export, pretty-printed, UTF-8.

### What the new app WRITES (canonical v4)

```json
{
  "version": 4,
  "exportDate": "2026-08-15T21:30:45.123Z",
  "exportedItems": { "users": true, "activityCards": true, "activityLibrary": true },
  "users": {
    "<userId>": {
      "id": "<userId>",
      "name": "Emma",
      "icon": "🦄",
      "settings": { "theme": "emerald", "taskCelebration": "rainbow", "routineCelebration": "rainbow" },
      "days": {
        "today": { "activities": [
          { "id": "...", "text": "Brush Teeth", "icon": "🦷", "description": "",
            "completed": true, "completedAt": 1723731234567, "pinned": false, "time": "07:30 AM" }
        ]},
        "tomorrow": { "activities": [] }
      }
    }
  },
  "currentDay": "today",
  "currentUser": "<userId>",
  "activityCards": [ /* flat, id-deduped union of every user's today+tomorrow activities */ ],
  "library": {
    "categories": [
      { "id": "my-templates", "name": "My Templates", "icon": "⭐",
        "activities": [ { "id": "...", "text": "Meditation", "icon": "🧘", "description": "" } ] }
    ],
    "userAddedActivityIds": []
  },
  "libraryTemplates": [],
  "globalSettings": {
    "currentTheme": "stackBlue", "bannerPosition": "top",
    "defaultView": "normal", "displayMode": "numbers",
    "enableDayManagement": true, "pinEnabled": false
  }
}
```

Writing rules (all exist so the **old app could read the file if ever needed**, and so validators stay happy):
- `version` is the JSON **number** `4` (one legacy validator required strict `=== 4`).
- Always include `users`, `library` (with `categories` array + `userAddedActivityIds: []`), `libraryTemplates: []`, and `globalSettings` — the strict legacy validator required all of them.
- `activityCards` is redundant (cards live inside users) but include it for compatibility.
- Activity/user fields use canonical names only: `text`, `icon`, `name`. Timestamps epoch-ms. Omit sync-era fields. Write `pinned: false` on every activity (the new app has no pinning — decision D5 — but the old reader expects the key).
- The old exporter hardcoded `defaultView/displayMode/enableDayManagement` in `globalSettings` regardless of real settings; keep writing those constants — nothing ever read them.
- Filename: `stackmap-export-YYYY-MM-DD-HH-MM-SS.json` (local time) for manual exports; `stackmap-backup-YYYY-MM-DD-HH-MM-SS.json` for automatic backups (distinct prefix keeps the folder legible; the importer accepts any name).
- PIN is never written to any file (only the `pinEnabled` boolean).

### What the new app ACCEPTS (superset)

Validation on read (mirrors the old live rules, then normalizes):
1. Parses as JSON; reject with "Invalid JSON file" otherwise.
2. `version` present and truthy (accept number `4`, `"4"`, `"4.0"`, and future values with a warning).
3. At least one of `users` / `activityCards` / `library` present, else "Export file contains no importable data".
4. Sanity cap ~10 MB.

Then apply every normalization rule from [02-data-model.md §5](./02-data-model.md): field aliases (`name`/`title`→`text`, `emoji`→`icon`), soft-deleted entries skipped, hex themes mapped to keys, `image:` icons replaced, `sortIndex` as ordering fallback, opaque IDs preserved, stale completion timestamps ignored in favor of `completed`. Real-world fixtures to test against, in priority order:
1. **`docs/handoff/fixtures/stackmap-export-2026-08-15-sanitized.json`** — the family's actual export with personal strings replaced by placeholders (see §5 for the legacy quirks it exhibits: `dayToUpdate`, persisted `addedToLibrary`, missing user timestamps, partial `settings`, stale completion metadata, duplicate/missing `sortIndex`, `time: null`).
2. `data/demo-data-kids-export.json` (+ variants) — hand-authored files with shapes live code never wrote (`order` fields, `modifiedAt: 0`, hex `settings.theme`, slug IDs).

An importer that round-trips all of these is done.

## 2. Automatic local backups (new)

**Goal:** the family never loses more than a few minutes of edits, without thinking about it.

- **Location**: a user-chosen folder via SAF (`ACTION_OPEN_DOCUMENT_TREE` + persistable URI permission), picked once during setup — recommend a folder that something else already syncs or that lives on removable storage (e.g. `Backups/StackMap/` in a Drive-synced folder). No storage permissions needed. If no folder is chosen yet, back up to app-internal storage (`filesDir/backups/`) so protection starts on day one, and nudge until a real folder is picked (internal-only backups die with an uninstall).
- **Trigger**: after any data mutation, schedule a debounced backup (~30 s); also flush when the app goes to background (`onStop`). Never write mid-edit-burst; one file per settled state. Throttle: no more than one file per 15 minutes unless the app is closing.
- **Contents**: full v4 file (everything, all users). Full snapshots, no deltas — files are a few KB.
- **Retention**: keep the newest **30** files plus the newest file per month for 12 months; prune the rest after each successful write.
- **Integrity**: serialize → write to the target → read back and re-parse before pruning anything; on any failure keep old files and surface a quiet warning in the Data screen ("Last backup failed — check backup folder"). Never let a failed write destroy prior backups.
- **Visibility**: Data screen shows "Last backup: <relative time> · <n> backups in <folder>" and a "Back up now" button.

## 3. Manual export / import

- **Export**: Data → Export → `ACTION_CREATE_DOCUMENT` (suggest filename per §1, default location Downloads) — *never* raw file-path writes (that's precisely what broke the old app on modern Android). Optionally also offer the system share sheet.
- **Import**: Data → Import → `ACTION_OPEN_DOCUMENT` (MIME `application/json` + `text/plain`), then:
  1. Parse + validate + normalize (§1).
  2. **Preview**: users found (icon, name, activity counts), library categories with counts, file date.
  3. Mode: **Replace everything** (default, with a strong confirm: "This will delete all current data…") or **Merge** (add users by name-match, append unknown activities, dedupe library templates by text within same-named categories — the old merge semantics; keep it simple and document that merged items get new IDs and arrive unchecked).
  4. **Safety snapshot**: before applying any import, write an automatic backup of the current state. Restores must never be one-way doors.
- **Reset** (Data → Reset): wipe all data after a typed/two-step confirm; write a final backup first.
- Optional nicety: handle `ACTION_VIEW` for `.json` so tapping a backup in Files opens the import preview. The old manifest promised this but never implemented it; either implement it for real or don't declare the filter.

## 4. OS-level safety net

Set `android:allowBackup="true"` with `dataExtractionRules` including the Room DB and DataStore (exclude the PIN hash). The old app disabled this because sync was the safety net; a local-only app should take the free Google-transfer/device-migration coverage. This is a convenience layer, not the backup system — the JSON files remain the source of truth.

## 5. Migration off the old app — ✅ RESOLVED

**Status (Aug 15, 2026):** export was verified working on a real family device. A sanitized copy (names, school/place names, and medical notes replaced with placeholders; every structural detail preserved) is checked in at **`docs/handoff/fixtures/stackmap-export-2026-08-15-sanitized.json`** as the primary importer test fixture. The unsanitized original is the actual migration source and lives outside git in the family's own storage — keep it safe, and until the new app ships, export again after any meaningful data change so the migration snapshot stays fresh.

What that real file confirms and adds to the compatibility contract (all folded into §1 and the data-model normalization rules):
- Envelope matches the documented v4 shape exactly (number `4`, all sections present, pretty-printed).
- **`dayToUpdate`** appears on the user object (a leaked internal update-helper field) — ignore it on import.
- **`addedToLibrary: false`** is persisted on every activity in real data (despite being runtime-only in current code) — ignore it.
- User objects may **lack `createdAt`/`lastActive`** and carry a **partial `settings`** (this one has only `theme`) — no user field beyond `id`/`name`/`icon`/`days` may be required.
- Stale completion metadata is real: activities with `completed: false` still carrying `completedAt`/`completedBy`. Only `completed` is authoritative.
- Library templates can have **duplicate or missing `sortIndex`** values — array order is the primary ordering; `sortIndex` is at best a tiebreaker.
- Activity IDs embed two different historical device IDs — IDs are opaque; never derive meaning from them.
- `time` can be explicitly `null`; treat `null` and `""` and absent identically.

**Original risk analysis (kept for reference):** the installed build (`versionCode 251211003`, Dec 2025) predates the SAF import fix, and export at HEAD still uses a raw `react-native-fs` write to `DownloadDirectoryPath` — a legacy pattern expected to fail under targetSdk 35. In practice it worked on the family's device. Had it failed, the fallback was to patch the old app in place using the original release keystore (`android/app/stackmap-release.keystore`, alias `stackmap`, on the dev Mac); `adb backup` was never an option (`allowBackup="false"`), and manual re-entry was the last resort.
