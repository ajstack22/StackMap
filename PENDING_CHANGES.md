# Pending Changes

## Title: Fix PIN Input Security & Team Photo Display on Web

### Changes Made:

#### PIN Input Security Fixes:
1. **Fixed PinModal component** - Added proper security attributes to PIN input field
2. **Fixed OnboardingUserCentered** - Added security attributes to both PIN and confirm PIN fields  
3. **Fixed OnboardingNew** - Added security attributes to PIN setup fields
4. **Security attributes added**:
   - `autoComplete="off"` - Prevents password managers from interfering
   - `autoCorrect={false}` - Disables autocorrect for PIN entry
   - `autoCapitalize="none"` - Prevents auto-capitalization
   - `spellCheck={false}` - Disables spell checking

#### Team Photo Display Fix:
5. **Fixed SupportModal image loading** - Updated image source handling for web platform
   - Web requires `{ uri: imagePath }` format for Image component
   - Native platforms use direct require() result
   - Added platform-specific source formatting

### Problem Fixed:
- Browser was warning about password fields not being contained in a form
- PIN fields had autocorrect and autocomplete enabled, which is a security issue
- Could lead to PIN being saved in autocomplete history or modified by autocorrect
- StackMap team photo was not displaying on web (worked on iOS/Android)

### Benefits:
- No more browser warnings about password fields
- More secure PIN entry without autocomplete/autocorrect interference
- Better user experience for PIN entry
- Prevents accidental PIN exposure through autocomplete
- Team photo now displays correctly on all platforms (web, iOS, Android)

