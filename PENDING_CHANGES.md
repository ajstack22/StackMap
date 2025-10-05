## Title: Fix emoji skin tone selector - exclude pre-modified variants from categories

### Bug Description:
Skin tone selector was not working - all emojis appeared with default skin tone and selecting different skin tones didn't change the displayed emojis.

**Root Cause:** The `buildEmojiCategories()` function was including emojis that already had skin tone modifiers baked into their unicode (e.g., 👋🏻, 👋🏼, etc.) as separate entries alongside the base emojis (👋). This caused the category to show both base and all skin tone variants, making the skin tone selector appear broken.

### The Fix:
**src/components/EmojiPicker/EmojiPickerMain.js** (lines 75-93):
- Added regex filter to exclude emojis with skin tone modifiers: `/1F3F[B-F]/`
- Skin tone modifiers in unicode: 1F3FB (light) through 1F3FF (dark)
- Now only base emojis are added to categories
- Skin tones are applied dynamically via `applySkinTone()` in SearchResults.js

### How It Works:
1. **Category population:** Only base emojis (e.g., 👋) added to People category
2. **Skin tone selection:** User selects skin tone via SkinToneSelector
3. **Dynamic application:** SearchResults applies skin tone modifier to base emoji
4. **Result:** 👋 + 🏻 modifier = 👋🏻

### Impact:
- ✅ Skin tone selector now works correctly
- ✅ Only base emojis shown in categories (no duplicates)
- ✅ Selecting skin tones updates all people emojis dynamically
- ✅ Cleaner category display (fewer total emojis, all unique)

### Technical Details:
- Skin tone modifiers: U+1F3FB through U+1F3FF
- Regex pattern matches: `1F3FB`, `1F3FC`, `1F3FD`, `1F3FE`, `1F3FF`
- Applied to unified codes like `1F44B-1F3FB` (waving hand with light skin tone)

### Deployment Date: [To be filled by deployment script]
