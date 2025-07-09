# Research Request: ScrollView Not Working in React Native 0.76.6 Modals on Android

## Issue Summary
ScrollView components inside Modal components are not responding to touch/scroll gestures on Android devices (both physical Samsung device and Android emulator). The same code works correctly on iOS. This issue affects multiple modals in our app but interestingly, one modal (ActivityLibrary) works correctly while others (Settings, Preferences) do not.

## Environment Details
- **React Native Version**: 0.76.6
- **Platform**: Android only (iOS works fine)
- **Tested Devices**: 
  - Samsung SM-S936U1 (Android 15)
  - Android Emulator - Pixel 9 Pro XL (Android 16)
- **Node Version**: Not specified, but using latest React Native CLI
- **Key Dependencies**:
  - react-native-gesture-handler
  - react-native-reanimated
  - react-native-safe-area-context

## Current Code Structure

### Working Modal (ActivityLibrary) - Scrolling Works:
```javascript
// Uses DraggableFlatList (falls back to FlatList on Android)
<View style={[styles.container, { backgroundColor: theme.light }]}>
  <SafeAreaView style={{ backgroundColor: theme.primary }}>
    <View style={[styles.header, { backgroundColor: theme.primary }]}>
      {/* Header content */}
    </View>
  </SafeAreaView>
  
  <View style={[styles.contentWrapper, { backgroundColor: theme.light }]}>
    <DraggableFlatList
      data={categories}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: SPACING.lg }}
      scrollEnabled={!isDraggingAnyCategory && !isSortMode}
      renderItem={/* ... */}
    />
  </View>
</View>
```

### Non-Working Modal (Settings) - Scrolling Broken:
```javascript
<Modal visible={showEditModeSettingsModal} animationType="slide">
  <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
  <View style={styles.modalContainer}>
    {Platform.OS === 'android' && (
      <View style={{ backgroundColor: theme.primary, height: StatusBar.currentHeight || 24 }} />
    )}
    <SafeAreaView style={{ backgroundColor: theme.primary }}>
      <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
        {/* Header content */}
      </View>
    </SafeAreaView>
    
    <View style={{ flex: 1, backgroundColor: theme.light }}>
      <ScrollView 
        ref={settingsScrollRef}
        style={styles.modalContent}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Content with TouchableOpacity components */}
      </ScrollView>
    </View>
  </View>
</Modal>
```

## What We've Tried

1. **Removed `pointerEvents="box-none"`** from wrapper Views - no effect
2. **Removed extra ScrollView props**:
   - `scrollEnabled={true}`
   - `nestedScrollEnabled={true}` 
   - `removeClippedSubviews={false}`
   - Custom `onLayout` handler that tried to force scroll position updates
3. **Fixed all JSX syntax errors** - 30+ mismatched closing tags
4. **Simplified View hierarchy** - removed unnecessary wrapper Views
5. **Verified the issue persists** on both physical device and emulator

## Key Observations

1. **FlatList works, ScrollView doesn't**: The working modal uses FlatList/DraggableFlatList while broken modals use ScrollView
2. **Platform-specific**: Issue only occurs on Android, iOS works fine
3. **Content is rendered**: The content inside ScrollView is visible and TouchableOpacity buttons are clickable, only scrolling is broken
4. **No error messages**: No console errors or warnings related to scrolling
5. **Gesture handling**: The app uses react-native-gesture-handler which might be intercepting touch events

## Research Questions

1. **Is there a known issue with ScrollView inside Modal components in React Native 0.76.6 on Android?**
2. **Are there specific gesture handler configurations needed for ScrollView in Modals?**
3. **Why would FlatList work but ScrollView not work in the same Modal structure?**
4. **Are there Android-specific touch event handling changes in recent React Native versions?**
5. **Is there a recommended pattern for scrollable content inside Modals for React Native 0.76.x?**

## Additional Context

- The app uses a custom gesture handler setup for swipe gestures on the main screen
- Multiple nested TouchableOpacity components exist within the ScrollView content
- The modals are full-screen overlays with slide animation
- The issue appeared after upgrading React Native versions (previous version unknown)

## What We Need

1. **Root cause identification** - Why is ScrollView not receiving touch events inside Modal on Android?
2. **Best practice solution** - What's the recommended approach for scrollable modals in RN 0.76.6?
3. **Alternative approaches** - Should we convert ScrollView to FlatList, or is there a better solution?
4. **Gesture handler conflicts** - How to properly configure gesture handlers to not interfere with ScrollView?

## Code Repository Structure
```
StackMapNative/
├── App.js (main file with all modals - 3400+ lines)
├── src/components/
│   └── ActivityLibrary/ (working modal implementation)
├── android/ (Android-specific configuration)
└── package.json (dependencies)
```

Please research current best practices and known issues with React Native 0.76.6 ScrollView in Modal components on Android, focusing on gesture handling and touch event propagation.