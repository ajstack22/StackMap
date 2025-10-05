## Title: Remove skin tone selector - keep only generic emojis for now

### Change Description:
Disabled the skin tone selector in the emoji picker. Will keep only generic/default emojis until skin tone functionality can be properly implemented.

**Reason:** The skin tone modifier system wasn't working correctly, and users should have a functional emoji picker without confusing UI elements that don't work.

### The Change:
**src/components/EmojiPicker/EmojiPickerMain.js** (lines 216-222):
- Commented out SkinToneSelector component
- Generic emojis still displayed correctly in People category
- Filter for skin tone variants (from previous fix) remains active

### Impact:
- ✅ Cleaner UI without non-functional skin tone selector
- ✅ Only generic/default emojis shown (no duplicate variants)
- ✅ Emoji picker fully functional
- ⏸️ Skin tone selection disabled until proper fix can be implemented

### Technical Details:
- SkinToneSelector component commented out (not removed)
- Can be re-enabled when proper implementation is done
- Regex filter `/1F3F[B-F]/` still active to exclude pre-modified emojis

### Deployment Date: [To be filled by deployment script]
