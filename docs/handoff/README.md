# StackMap Family Rebuild — Handoff Package

**Created:** August 2026
**Status:** Blueprint for a fresh rebuild. The React Native codebase in this repo is the *reference implementation*, not the thing being maintained.

## What this package is

StackMap shipped as a cross-platform (web/iOS/Android) visual-routine app optimized for a general audience: onboarding funnels, sync, template sharing, store distribution, four deployment tiers. The family that built it wants the opposite: **one modern, native Android app, for one family, installed directly (no store), with local backup and no sync.**

This package is everything a developer (human or AI) needs to build that app from scratch without access to the original authors. It was produced by a deep audit of the actual code at commit `885e57a` — **not** the repo's `/docs` tree, which is stale in many specifics (each doc here flags known doc-vs-code discrepancies).

## Locked decisions

| Decision | Choice |
|---|---|
| Purpose of docs | Blueprint for a fresh rebuild (old codebase = reference only) |
| Stack | Native Kotlin + Jetpack Compose, Android only |
| Feature scope | Core routine/schedule features only (users, activities, day view, edit mode, completion, library templates) |
| Backup | Automatic local backups **and** manual export/import; export format stays compatible with the old app's v4 JSON |
| Explicitly dropped | Sync, web, iOS, store distribution, multi-tier deploys, general-audience onboarding, share-with-providers, donations/privacy-policy surfaces |

## The documents

Read in order for a full picture; each stands alone for reference.

1. **[01-product-spec.md](./01-product-spec.md)** — What the app is, who it's for, the interaction model, on-screen vocabulary, core user journeys, keep/drop feature lists, and the open product decisions the family must make.
2. **[02-data-model.md](./02-data-model.md)** — The clean data model for the new app, the legacy persisted model it descends from, and the normalization rules needed to read old data.
3. **[03-behavior-spec.md](./03-behavior-spec.md)** — Pixel-and-behavior spec for every kept screen and interaction: day view, completion + celebrations, edit mode, library, user management, Complete Day, settings, PIN, theming, typography, Android system behaviors.
4. **[04-backup-spec.md](./04-backup-spec.md)** — The backup system: v4 file-format compatibility contract, automatic backup design (new), manual export/import, restore flows, and the **data-migration plan off the old app — read the risk section first.**
5. **[05-android-build-guide.md](./05-android-build-guide.md)** — New project setup: app identity, SDK levels, the date-based versioning scheme worth keeping, signing/keystore management (the single most losable asset in a store-less app), direct-APK install and update mechanics, manifest decisions.
6. **[06-legacy-reference-map.md](./06-legacy-reference-map.md)** — Where everything lives in this repo: concept → file map, the dead-code inventory (things that look real but must not be ported), doc-vs-code discrepancy list, and the assets worth carrying (fonts, icon art, seed library, test fixtures, screenshots).

## Three things to know before doing anything else

1. **Migration risk (act early):** the family's installed app (versionCode `251211003`, Dec 2025) likely **cannot export a backup** — export uses a legacy file write that fails on modern Android, and that build also predates the import fix. Validate export on a real family device *before* building anything, and read the contingency plan in [04-backup-spec.md](./04-backup-spec.md#migration-off-the-old-app).
2. **The keystore is the app.** With no store, the signing key is the only update identity: lose it and the family must uninstall (losing data) to ever update again. [05-android-build-guide.md](./05-android-build-guide.md) covers generating and *backing up* a new keystore.
3. **Trust code, not the old docs.** `/docs/DATA_STRUCTURE.md`, `edit-mode-refactor.md`, the README feature list, and the TypeScript type definitions all contain stale claims (mood check-ins, timers, sounds, drag & drop, wrong enum values). Every doc in this package was verified against the code and flags the discrepancies.
