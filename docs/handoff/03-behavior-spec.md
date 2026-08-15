# 03 — Behavior Spec

Behavior of every kept surface, as verified in the shipped code (not the stale design docs). Pixel values are from the old app and are calibration points, not laws — match the *feel* (big, calm, high-contrast) over exact px. The screenshots in `assets/app-screenshots/` (Pixel 9 / Pro XL / Tablet: home, edit, library, preferences, settings, check-in) are the visual reference.

## 1. App frame

- **Banner** (header strip, `theme.primary`): logo + "StackMap" wordmark + the **user pill** — a white rounded pill showing the active user's emoji + name (in edit mode it shows the day: "Today"/"Tomorrow" instead). Banner position is a setting (`top` default, or `bottom`); status bar and (on the old app) the Android navigation bar are tinted to match the theme. The logo is a code-drawn three-stacked-bars SVG (32×20 viewBox: bars 24×3.6, 24×3.6, 24×8.4, white) — redraw it in Compose, don't rasterize.
- **Two FABs**, opposite corners on the banner-adjacent edge:
  - Palette FAB → theme picker. ⚠️ In the old app this was **not** PIN-gated (family decision whether to gate it).
  - Edit FAB → toggles Edit Mode (PIN modal first if a PIN is set). While in edit mode it turns red (`#f56565`) with an "exit edit" icon.
- **Page background**: `theme.light`. All modals slide up full-screen or near-full-screen.
- **Toast**: bottom pill in `theme.primary`, white text, ~3s auto-dismiss, optional action button (used for delete Undo).

## 2. Day view (normal mode)

- Flat ordered list of the active user's activities for the current day. **No categories on this screen** (categories exist only in the Library). Phone portrait = 1 column; ≥768 dp (tablets) = 2 columns. Cards max-width ~450 dp, centered, ~20 dp gaps.
- **Card anatomy** (whole card is one tap target, old height 320 dp):
  - Check circle top-left (~54 dp, 70 on tablet): gray `#e8e8e8` with dark ✓ when incomplete; `theme.primary` with white ✓ when complete.
  - Centered column: emoji icon (~64 sp), title (bold ~23 sp, black, max 2 lines; fallback `"Untitled Activity"`), optional description (~17 sp, black).
  - **Badge** top-right, outside the tap target, per `displayMode`: `numbers` → 1-based position in a `theme.primary` circle; `time` → `time ?: "--:--"` in a pill; `none` → hidden.
  - Completed state: background `theme.light`, border `theme.primary`, title/description flip to white bold, slight scale-up + elevation. This white-on-`theme.light` pairing is intentional and tested — don't "fix" it.
- **Empty state**: 📋 "No activities yet" / "Tap the edit button to add your first activity."
- **Tap = toggle completion**:
  - Complete: set `completed=true`, `completedAt=now`. If **every** activity in the day is now complete → **routine celebration** (fireworks); else → **task celebration** (confetti). Card restyles immediately (no per-card animation in the old app).
  - Uncomplete: `completed=false`, clear `completedAt`. No celebration.
  - Celebrations are suppressed in edit mode.

### Celebrations
Full-screen non-interactive overlay; **must** render nothing when the OS reduce-motion setting is on or the user's celebration setting is `none`.
- **Confetti** (task): 60 pieces, 10×10 dp rounded squares, fall from above over ~4 s with ±30 dp sway and 720° rotation, staggered 0–500 ms, fade in last 20%; overlay ends ~4.5 s.
- **Fireworks** (routine): 15 bursts, staggered ~160 ms, random positions (x 10–90%, y 10–70%), 19–31 radiating particles each (5–12.5 dp), scale 0→1.5→0 over ~1.5 s; overlay ends ~3.5 s.
- Color sets (`rainbow` default): rainbow `#ff6b9d #4ecdc4 #45b7d1 #96ceb4 #feca57 #ff9ff3`, plus blue/orange/pink/purple/gold/green 6-color sets and `random` (picks one set per firing). ⚠️ The old `green` set is mostly pink (`#ff9ff3, #96ceb4, #ffeaa7, #fd79a8, #a8e6cf, #ffcccc`) — a bug; use actual greens.

## 3. Context switching (user + day)

Tapping the user pill opens **Context**: "Select Context — Choose which user and day to view".
- **Select User**: all users as rows (emoji + name + check on active). Selecting switches immediately and **recolors the whole app to that user's theme**.
- **Select Day**: Today / Tomorrow cards — shown **only when `dayMode == both`**.
- The old iOS-only swipe-on-pill day toggle does not exist on Android; don't add a hidden gesture.

## 4. Edit Mode

**Entry**: edit FAB → if PIN set, 4-digit keypad modal (dots, digits only) → verify → enter. **Exit**: same FAB, or completing the day. Leaving edit mode always resets the current day to Today.

**List** replaces the cards: one row per activity (white card, max-width ~800 dp, centered):
- Row content: emoji + title (1 line) + description (1 line) + a prominent circular **Edit** (pencil) button in `theme.primary`.
- Actions row: **▲/▼ reorder** (one position per tap, disabled at ends, ~44 dp touch targets), position/time badge (per `displayMode`), **✓ toggle**, **bookmark = Save to Library**, **trash = Delete** (red `#e53e3e`).
- Tapping the row body does nothing (only buttons act). Reordering animates (~250 ms spring on Android).
- **Add a pin toggle here** (new — see product spec §5): pinned state must be settable or Complete Day degenerates.
- Empty day in edit mode: show "Tap Add to create an activity" (the old app showed a blank area — a bug).

**Toolbar** (opposite edge from the banner, slides in ~200 ms): fixed order **Add, Library, Complete, Access, Data, Settings** (customizable order is dropped).

### Activity add/edit form
Fields: **Activity Name** (required — inline error "Activity name is required"), **Icon** (emoji picker, default 🎯), **Description (Optional)**, **Time (Optional)** (12-hour wheel picker → `"HH:MM AM"` string; Clear empties it). No other validation; duplicates allowed. Delete = confirm dialog ("Delete Activity — Are you sure you want to delete "X"?") → remove with a **3 s Undo toast** (old app: soft-delete flag + delayed hard delete; in the rebuild an in-memory undo is fine).

### Library
Two sections in one modal:
- **My Library**: user categories, **My Templates** first then alphabetical. Per template: **+** (adds a copy to the current user's current day), reorder ▲/▼, delete (confirm). Per category: **Add All** (batch-adds every template), rename + delete for custom categories only (My Templates is immutable). Search filters template text/icon and category names.
- **Seed library** (if kept per product spec §5): the 60 curated activities (Morning/Food/Play/Afternoon/Evening/Wellness groups) from `src/constants/stackMapLibrary.js`, offered as importable seed content.
- **Save to Library** (bookmark in edit list): category picker, My Templates first; "Create New Group" inline (≤50 chars; case-insensitive duplicate silently reuses the existing category). Confirmation: brief filled-bookmark state / toast "Added to <category>".

### Access (users + PIN)
- **Users tab**: rows (emoji, name, "Active" badge). Tap = switch user (+ theme). Edit (name/icon). Delete with confirm ("…will permanently remove the user and all their activity cards") — hidden for the last user. **Add User** hidden at 5 users. Name required; no length cap; duplicates allowed.
- **PIN tab**: Add PIN (enter twice), Change Code (verify old → new twice), Remove PIN (confirm). Copy: "Remember your PIN! If forgotten, you'll need to reset the app data." Exactly 4 digits.

### Complete Day
Modal buckets built from the current user's **Today** list:
1. **Will Be Removed** — unpinned activities ("These activities will be permanently deleted").
2. **Keep for Today** (or **Keep & Copy Forward** when Tomorrow has content) — pinned activities.
3. **Moving from Tomorrow** — Tomorrow's entire list (shown only if non-empty).

Tap any card to flip it between remove ↔ keep. Confirm →
```
newToday    = kept (each reset to completed=false) + tomorrow's activities
newTomorrow = copies of kept-pinned activities (fresh ids, completed=false)   // only when Tomorrow was non-empty
removed     = gone permanently
```
Exits edit mode; toast "Day completed! Activities reorganized." Only affects the current user — each member completes their own day.

### Settings
Keep: **Banner Position** (Top/Bottom), **Day Mode** (Today Only / Both Days), **Activity Display** (None / Numbers / Time), **Task Celebration** + **Routine Celebration** (chip rows: none, random, rainbow, blue, orange, pink, purple, gold, green). All auto-save. Theme lives in the separate palette-FAB picker (grid of 21 colored circles, active check-marked, per-user).

## 5. First run

No users → minimal setup (product spec J1): add user(s) → optional PIN → optional restore-from-backup → day view. No tutorial cards, no journey questions.

## 6. Android system behaviors (define explicitly — the old app mostly defaulted)

- **Back button / predictive back**: modal open → close modal; edit mode → exit edit mode; else → leave app. (Old app: back exited the app even in edit mode; that was an accident, not a design.)
- **Edge-to-edge**: yes; tint status bar to `theme.primary` (light icons) with banner-top, and match the nav-bar treatment to the theme as the old app did.
- **Orientation/resize**: relayout without losing state (Compose default).
- **Reduce motion**: disables celebrations entirely; keep other animations subtle (~200 ms fades).
- **Haptics**: light tick on completion toggle and reorder (new — was stubbed in the old app). Needs no permission via `View.performHapticFeedback`.
- **No notifications, widgets, alarms, or shortcuts.** No telemetry of any kind.

## 7. Typography & accessibility

- **Comic Relief** Regular + Bold only (`assets/fonts/ComicRelief-*.ttf`, SIL OFL — carry the license file). In Compose: one `FontFamily(Font(regular, W400), Font(bold, W700))`; map medium/semibold requests to Bold to match the old rendering. The old app's entire font-wrapper hack existed because RN-Android can't combine `fontFamily`+`fontWeight` — irrelevant in Compose.
- **No gray text**: body text `#000`, text on theme surfaces `#fff`; gray only for disabled controls. All 21 theme primaries are AA with white text.
- Touch targets ≥ 44 dp; no long-press-only or gesture-only functions.
- **TalkBack is new scope**: the old app had essentially zero accessibility labels. Budget for contentDescriptions on every interactive element (the old edit rows at least named "Move up/Move down/Edit activity/Delete activity" — start there).
- Font scaling: the old app *disabled* OS font scaling on card titles (`allowFontScaling={false}`) and scaled 1.2× on tablets. Recommendation: respect OS font scale in the rebuild unless it breaks card layout; test with the family's device settings.
