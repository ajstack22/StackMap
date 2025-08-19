# Pending Changes

## Title: EditModeToolbar Positioning and Visibility Fixes

### Changes Made:

#### 1. Enhanced EditModeToolbar Padding (All Platforms)
- **File**: `src/components/EditModeToolbar/EditModeToolbar.js`
- **Change**: Increased padding in `toolbarWrapper` style to lift content away from screen edges
  - iOS: paddingTop 16px, paddingBottom 20px
  - Android: paddingTop 8px, paddingBottom 16px  
  - Web: paddingTop 12px, paddingBottom 12px
- **Reason**: Prevents toolbar from sitting directly on home bar/navigation areas

#### 2. Fixed EditModeToolbar Visibility Issues
- **File**: `App.js`
- **Problem**: EditModeToolbar not showing when banner position changes
- **Solution**: 
  - Split toolbar rendering based on banner position
  - When banner is top: Toolbar renders at bottom (inside main container)
  - When banner is bottom: Toolbar renders at top (after content area for Android z-index)
  - Removed duplicate toolbar that was outside the main container

#### 3. Android-Specific Z-Index Fix
- **File**: `App.js`, `src/components/EditModeToolbar/EditModeToolbar.js`
- **Problem**: On Android, EditModeToolbar appeared behind activity cards
- **Solution**:
  - Moved toolbar to render AFTER content area in component tree
  - Added high elevation (20) for Android platform
  - Increased z-index to 1000 for absolute positioning
  - Added elevation to EditModeToolbar container style
- **Technical Note**: Android respects render order over z-index for absolutely positioned elements

#### 4. Adjusted EditModeList Content Padding
- **File**: `App.js`
- **Change**: Reduced padding values from 124/184px to 100/160px
- **Reason**: Prevents activity cards from appearing too low when toolbar is visible

#### 5. Banner Position Persistence Fix
- **File**: `src/stores/useSettingsStore.js`
- **Changes**:
  - Added console logging for banner position changes
  - Reduced storage debounce timeout from 1000ms to 500ms
- **Reason**: Faster persistence prevents position reverting on view changes

