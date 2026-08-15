# 01 — Product Spec: StackMap Family Edition

The new app is a **visual daily-routine app for one family**, rebuilt native (Kotlin + Jetpack Compose), keeping only what serves day-to-day family use.

## 1. Purpose and audience

StackMap exists to answer "what comes next?" for people who find that question stressful. It was designed for families with neurodivergent members (autism, ADHD, executive-function challenges) sharing a device: a parent/caregiver builds emoji-based activity cards, and the child (or any family member) taps them to complete, earning a celebration animation. The in-app tagline was *"Better days through shared understanding."*

Design values that must survive the rebuild, because they are the product:

- **Visual first**: big emoji, short text, large cards, one-tap completion.
- **Predictable**: no calendar, no rigid times — just "Today" (and optionally "Tomorrow").
- **Low cognitive load**: minimal gestures (taps and buttons, no drag & drop), consistent layout, optional sequence numbers as a "what comes next" cue.
- **Positive reinforcement**: confetti per completed activity, fireworks when the whole day is done. Both can be turned off per user (sensory sensitivity is a first-class concern).
- **Personal color identity**: each family member has their own theme color; the whole app recolors when you switch users. The palette includes six "calming" themes annotated for neurodivergent users (sage, dustyBlue, stackBlue, terracotta, lavender, slate).
- **High contrast**: all text pure black `#000` on light surfaces or pure white on theme-colored surfaces. Gray text is banned except for disabled states.
- **Friendly, dyslexia-aware typography**: Comic Relief font (Regular + Bold) everywhere.
- **Private by construction**: no accounts, no analytics, no network. Data lives on the device and in local backup files.

## 2. The interaction model (the product's essence)

```
Family
 └─ User (max 5; name + emoji icon + theme color)
     ├─ Today     ── ordered list of Activities
     └─ Tomorrow  ── ordered list of Activities   (optional, off by default)

Activity = emoji icon + short text + optional description + optional time label
         + completed flag + pinned flag
```

- **Normal mode** (the child's view): a vertical list/grid of activity cards for the active user's current day. Tapping a card toggles completion. That's the whole surface.
- **Edit mode** (the grown-up's view, optionally gated by a 4-digit PIN): manage activities (add/edit/delete/reorder), users, the template library, settings, and backups.
- **"Routine"** in this app means the whole day's list — there is no named-routine entity. Completing *all* activities is "completing the routine" (fireworks).
- **Pinned** means "survives the daily reset": when the day is completed, pinned activities stay (reset to unchecked) and copy forward to the new Tomorrow; unpinned ones are swept away. Pinning is the recurring-item mechanism.
- **Complete Day** is the manual daily-reset ritual. There is deliberately **no automatic midnight rollover** in the old app (see open decisions, §6).

## 3. On-screen vocabulary (use these exact words)

| Concept | UI word | Never |
|---|---|---|
| Family member | **User** | profile, member |
| Task / routine step | **Activity** (rendered as a **card**) | task |
| Whole day's list | the day / **Routine** (only in "Routine Celebration") | schedule |
| Days | **Today** / **Tomorrow** only | dates, weekdays |
| Daily reset | **Complete Day** | — |
| Recurring item | **Pinned** ("Keep for Today", "Keep & Copy Forward") | — |
| Management mode | **Edit Mode** | admin, parent mode |
| Template store | **Library**; personal category **My Templates** (⭐) | — |
| User/day switcher | **Context** ("Select User", "Select Day") | — |
| Color scheme | **Theme** | — |
| Edit-mode lock | **PIN** | password |
| Backup area | **Data** | — |
| Completion effects | **Task Celebration** / **Routine Celebration** | — |

## 4. Core user journeys

### J1 — First run (NEW design; the old onboarding funnel is dropped)
The old app had a multi-step general-audience wizard (user type, device strategy, sync setup, 12 starter tutorial cards). The rebuild replaces all of it with a minimal flow:

1. App opens to an empty state: "Who's using StackMap?" → add user (name + emoji, quick-pick row 🐶 🦊 🎨 ⚽ 🚀 🌟 + full emoji picker).
2. Optionally add more users (cap: 5).
3. Optionally set a 4-digit PIN ("Add a simple PIN to prevent accidental changes"). Skippable.
4. Optionally restore from a backup file instead of starting fresh ("I have a StackMap backup").
5. Land on the day view.

### J2 — Run the day (the default surface)
Open app → active user's Today. Tap a card → it restyles in the user's theme color, check circle fills, confetti plays (unless celebration = none or system reduce-motion is on). Complete the last one → fireworks. Un-tap to undo. Header shows the user's emoji + name in a pill; tapping the pill opens the Context switcher.

### J3 — Build / edit routines (Edit Mode)
Edit FAB → (PIN if set) → edit list replaces the cards. Per row: edit, move up/down, toggle complete, save to Library, delete (with undo). Toolbar: **Add**, **Library**, **Complete** (Day), **Access** (users + PIN), **Data** (backup), **Settings**.

### J4 — End the day (Complete Day)
Toolbar → Complete. Review buckets: *Will Be Removed* (unpinned), *Keep for Today* (pinned, reset to unchecked), *Moving from Tomorrow* (tomorrow's plan promotes to today), *Keep & Copy Forward* (pinned copies seed the new tomorrow). Tap cards to move them between buckets. Confirm.

### J5 — Plan tomorrow (opt-in)
Settings → Day Mode: **Both Days**. The Context switcher gains Today/Tomorrow selection; edit Tomorrow's list the same way; Complete Day pulls it into Today.

### J6 — Backup & restore
Automatic: the app continuously writes versioned JSON backups to a family-chosen folder (new capability — see [04-backup-spec.md](./04-backup-spec.md)). Manual: Data → Export writes a `stackmap-export-….json` file; Data → Import restores from any StackMap export/backup, including files from the old app.

## 5. Feature disposition

### Keep (core product)
- Tap-to-complete activity cards (emoji + text + optional description + check circle + optional number/time badge)
- Task & routine celebrations, per-user color themes (all 21, including the previously hidden `slate`), reduce-motion respect
- Users (max 5) with emoji identity; Context switcher; per-user theme follows the active user
- Today/Tomorrow model, pinning, Complete Day ritual
- Edit Mode with PIN gate; button-based reordering
- Personal Library (My Templates + custom categories) with save-to-library and add-from-library
- Settings: day mode, activity display badges (none/numbers/time), banner position, celebrations
- Manual JSON export/import (v4-compatible) **plus new automatic local backup**
- Comic Relief typography, no-gray-text contrast rules, large touch targets

### Drop (general-audience / infrastructure)
- Sync (service, QR pairing, recovery phrases, conflict resolution, share-with-providers, deep links)
- Onboarding funnel, starter tutorial cards, device-strategy questions
- Web + iOS platforms, four-tier deploy pipeline, Play/App Store distribution, fastlane
- Donations/support modal, privacy-policy modal, marketing surfaces
- Toolbar order / more-button-position customization (fix a sensible order)
- Custom PNG sticker icons (already feature-flagged off; importer must still tolerate `image:` icon values in old data)
- Camera permission + QR scanners (sync-only), all server code in the repo

### Decide-per-item (documented as built, but dead or broken in the old app)
- **Pin toggle UI**: the `pinned` field drives Complete Day, but no shipped UI can set it — so in practice everything lands in "Will Be Removed". **Recommendation: add a pin toggle to the edit-mode row** (this restores the designed behavior).
- **Sounds**: `soundEnabled` setting exists; no sound has ever played. Recommendation: drop the setting, or actually implement a soft completion sound. Don't ship a dead toggle.
- **Haptics**: stubbed out in the old app (a stale permission comment). Recommendation: light haptic on completion toggle and reorder; trivial in Compose.
- **The 60-activity built-in library** ("StackMap Library": Morning/Food/Play/Afternoon/Evening/Wellness): good content, general-audience browse UI. Recommendation: ship it as optional seed data for My Library rather than a separate read-only catalog.

## 6. Open product decisions for the family

These change behavior, so decide explicitly rather than inheriting accidents:

1. **Automatic day rollover?** The old app *never* resets at midnight — checkmarks persist until someone runs Complete Day. Options: keep manual-only (the designed ritual), auto-prompt on first open of a new calendar day ("Yesterday isn't completed — complete it now?"), or full auto-reset. Recommendation: **auto-prompt**; it preserves the ritual while preventing stale days.
2. **Per-user theme switching** — keep (each member's color identity, recommended) or single device theme?
3. **Celebration fixes** — the old "green" palette is actually pink (a bug), and the 21st theme (slate) was unselectable. Fix both, or reproduce faithfully for a child used to the current look? Recommendation: fix.
4. **PIN scope** — old app gates Edit Mode only; the theme picker was *not* gated (a child can recolor the app). Gate settings/theme too?
5. **Named routines?** The old app approximates recurring routines via pinning + templates. If the family wants "School Morning" as a switchable set, that's new scope — flag it now, don't retrofit.
6. **Time on activities** stays a display-only label (no alarms/notifications) unless the family asks otherwise.

## 7. What was documented but never real

Do not "restore" these — they never existed in code: mood/weather check-ins, activity timers/alarms, completion sounds, onboarding feature carousel, PIN auto-lock and failed-attempt handling, drag-and-drop reordering (removed by design in favor of buttons), visual "always on top" pinning.
