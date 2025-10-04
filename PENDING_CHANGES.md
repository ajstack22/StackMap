## Title: Fix Onboarding Text Input Issues - Focus Loss & Size

### Changes Made:

**Fixed both reported onboarding text input issues with proper root cause resolution**

#### Issue 1: Text Input Size Too Large ✅
**User Report**: Recovery phrase input 2x larger on web, 1.5x on Android
**Root Cause**: Unnecessary `multiline` prop causing excessive height (120px)
**Fix**: Removed multiline prop and reverted to single-line input style

#### Issue 2: Text Input Loses Focus After Single Character ✅
**User Report**: Focus loss persists despite previous "fix" with useCallback
**Root Cause**: Inline SafeAreaView component definition causing React to unmount/remount all children on every render
**Fix**: Removed inline component, replaced with regular View + conditional safe area padding

#### Why Previous Fix Failed
The useCallback approach (v2025.10.04.8) was solving the wrong problem:
- Memoized handlers prevent child re-renders from prop changes ✓
- But inline component definitions cause parent recreation ✗
- When parent recreates, ALL children unmount regardless of memoization ✗
- **Root cause was missed**: Inline component = new component type every render

#### Modified Files (2):
- src/components/Onboarding/OnboardingUserCentered/screens/SyncImportScreen.js
  - Removed `multiline` prop from TextInput (line 31)
  - Changed from `styles.multilineInput` to `styles.input` (line 25)

- src/components/Onboarding/OnboardingUserCentered/index.js
  - Removed inline SafeAreaView component definition (lines 606-611)
  - Replaced with regular View component
  - Applied conditional safe area padding: `Platform.OS !== 'web' ? { paddingTop: insets.top } : null`

#### Technical Details
- Pattern follows successful fix from commit f2f6dea0 (same issue in OnboardingCoordinator)
- Inline component definitions are anti-pattern - React treats them as new types on each render
- Safe area handled via inline styles instead of wrapper component

#### Impact
- **Both user-reported issues resolved**: Focus preserved, input size correct
- **No breaking changes**: All 1,945 tests passing
- **Performance improvement**: No unnecessary unmount/remount cycles
- **Proper fix**: Addressed actual root cause, not symptoms

### Deployment Date: [Auto-filled by deployment script]
