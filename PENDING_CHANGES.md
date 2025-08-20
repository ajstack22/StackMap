# Pending Changes

## Title: Fix EditModeToolbar Touch Responsiveness and Z-Index Issues

### Changes Made:

#### 1. Fixed Z-Index Layering Issues
- **File**: `App.js`
- **Problem**: EditModeList (activity cards) were overlapping EditModeToolbar buttons, making them unclickable
- **Solution**:
  - Reduced EditModeList z-index from 2 to 1
  - Increased EditModeToolbar z-index to 1000 for both positions
  - Added Android elevation of 100 to ensure proper layering
  - Wrapped toolbars in View containers with `pointerEvents="box-none"`

#### 2. Enhanced FAB Touch Responsiveness  
- **File**: `src/components/FAB/FAB.js`
- **Change**: Added `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}`
- **Reason**: Increases touch target area for better responsiveness

#### 3. FAB Z-Index Optimization
- **File**: `App.js`
- **Changes**:
  - Moved FABs to render last in component tree
  - Added z-index: 10000 and elevation: 200 to FAB positions
- **Reason**: Ensures FABs are always clickable and above all other elements

#### 4. Android-Specific Performance Optimizations
- **File**: `src/components/EditModeList/index.js`
- **Changes**:
  - Reduced `maxToRenderPerBatch` from 10 to 5 for Android
  - Increased `updateCellsBatchingPeriod` from 50ms to 100ms
  - Reduced `windowSize` from 10 to 5
  - Added `scrollEventThrottle={16}` for better touch responsiveness
  
#### 5. React.memo Optimization for List Items
- **File**: `src/components/EditModeList/EditModeListItem.js`
- **Change**: Added custom comparison function to React.memo
- **Reason**: Prevents unnecessary re-renders, improving performance on Android

#### 6. Fixed Banner Position Persistence
- **File**: `src/stores/useSettingsStore.js`
- **Changes**:
  - Added console logging for debugging
  - Reduced storage debounce from 1000ms to 500ms
- **Reason**: Faster persistence prevents banner position from reverting

