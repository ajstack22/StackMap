# Complete Day Modal Implementation Prompt

## Context
You are implementing a new Complete Day Modal for the StackMap app - a visual task manager for neurodivergent users. The modal will be triggered by the "Complete" button in the EditModeToolbar and will provide a reflective end-of-day experience.

## Technical Stack
- React Native (0.80.1) with React Native Web
- Platform-specific styling (iOS, Android, Web)
- Comic Relief font family
- MaterialIcons for icons
- Async Storage for persistence

## Architecture Overview

### File Structure
```
src/components/Modals/CompleteDayModal/
├── CompleteDayModal.js
├── styles.js
└── index.js
```

### Key Imports Pattern
```javascript
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import { COLORS, THEMES } from '../../../constants';
```

## Modal Style Pattern (CRITICAL)

### Modal Structure
All modals follow this exact pattern:

1. **Full-screen modal with SafeAreaView**
```javascript
<Modal
  animationType="slide"
  transparent={false}
  visible={visible}
  onRequestClose={onClose}
  presentationStyle="pageSheet" // iOS specific
>
  <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.primary }]}>
    <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
    {/* Content */}
  </SafeAreaView>
</Modal>
```

2. **Header Pattern**
```javascript
<View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
  <View style={styles.headerLeft}>
    <Icon name="event-available" size={28} color="white" style={styles.headerIcon} />
    <Text style={styles.modalTitle}>Complete Day</Text>
  </View>
  <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
    <Icon name="close" size={30} color="white" />
  </TouchableOpacity>
</View>
```

3. **Styles Pattern (from DataModal)**
```javascript
modalContainer: {
  flex: 1,
},
modalHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 20,
  backgroundColor: 'white', // Will be overridden by theme
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
},
headerLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},
headerIcon: {
  marginRight: 12,
},
modalTitle: {
  fontSize: 20,
  fontWeight: Platform.OS === 'ios' ? 'bold' : 'normal',
  color: 'white',
  fontFamily: TYPOGRAPHY.fontFamily.bold,
},
modalContent: {
  padding: 20,
},
```

## Edit Mode Toolbar Strategy (IMPORTANT)

### Overflow Menu System
The EditModeToolbar uses a dynamic overflow system:

1. **Action Map Structure**
```javascript
const actionMap = {
  users: { label: 'Users', icon: 'group', onPress: onUsers },
  data: { label: 'Data', icon: 'cloud-sync', onPress: onData },
  complete: { label: 'Complete', icon: 'event-available', onPress: onCompleteDay },
  share: { label: 'Share', icon: 'share', onPress: onShare },
  plan: { label: 'Plan', icon: 'event', onPress: onPlan },
  library: { label: 'Library', icon: 'collections-bookmark', onPress: onLibrary },
  add: { label: 'Add', icon: 'add-circle', onPress: onAdd },
  sort: { label: 'Sort', icon: 'sort', onPress: onCustomize, alwaysOverflow: true },
};
```

2. **Dynamic Button Calculation**
- Calculates available width based on screen size
- Accounts for container padding: `getContainerPadding() * 2`
- Reserves space for "Edit Mode" text (80-100px) and "More" button (60-70px)
- Minimum button width: 60px (phone) or 70px (tablet)
- Ensures at least 3 buttons are visible

3. **Overflow Strategy**
- More button can be positioned left or right (user preference)
- When left: Takes buttons from the end of the order
- When right: Takes buttons from the beginning
- Overflow menu is a modal with FlatList of remaining actions

## Complete Day Modal Requirements

### Core Features

1. **Day Summary Section**
   - Show total activities completed vs total
   - Display completion percentage with circular progress
   - Time spent (if time tracking is enabled)
   - Visual celebration for 100% completion

2. **Reflection Section**
   - "How was your day?" with emoji selector
   - Optional journal entry (multiline TextInput)
   - Save reflection to daily history

3. **Tomorrow Preview**
   - Option to view/plan tomorrow's activities
   - Quick add for tomorrow
   - Copy today's uncompleted tasks to tomorrow

4. **Actions**
   - "Complete Day" button (primary action)
   - "Save & Continue" (saves reflection but keeps day active)
   - "Cancel" (closes without saving)

### Visual Design Requirements

1. **Color Scheme**
   - Header: Theme primary color
   - Background: Theme light color for sections
   - Activity cards: White with subtle shadow
   - Success state: Green (#48bb78)
   - Text: BLACK ONLY - no gray text (accessibility requirement)

2. **Typography**
   - Use Comic Relief font family
   - Title: 20px bold
   - Section headers: 18px semibold
   - Body text: 16px regular
   - Maintain platform-specific font weights

3. **Spacing & Layout**
   - Consistent 20px padding for content
   - 30px margin between sections
   - Card-style sections with rounded corners (RADIUS.lg)
   - Shadows using SHADOWS.level2 for cards

### Platform Considerations

1. **iOS**
   - Use 'pageSheet' presentation style
   - Bold font weights
   - Larger touch targets

2. **Android**
   - Normal font weights (use fontFamily for bold)
   - Material Design shadows
   - Hardware back button support

3. **Web**
   - Slightly smaller font sizes
   - Consider desktop viewport
   - Keyboard navigation support

### Data Structure

```javascript
// Daily completion record
{
  date: '2024-12-28',
  completedCount: 15,
  totalCount: 20,
  completionPercentage: 75,
  reflection: {
    mood: '😊', // Selected emoji
    notes: 'Good productive day...', // Journal entry
    timestamp: Date.now()
  },
  activities: [...], // Snapshot of the day's activities
}
```

### Integration Points

1. **With App.js**
   - Add `onCompleteDay` handler that opens the modal
   - Pass current activities array
   - Pass theme object
   - Handle saving completion data

2. **With EditModeToolbar**
   - The Complete button triggers `onCompleteDay`
   - Icon: 'event-available'
   - Should be in default toolbar order

3. **With Storage**
   - Save to AsyncStorage under key: `@StackMap:dailyCompletions`
   - Store as array of completion records
   - Implement data retention (last 30 days)

### Animation Requirements

1. **Modal Entry**
   - Slide up from bottom
   - 300ms duration
   - Ease-out curve

2. **Progress Circle**
   - Animated fill on mount
   - 1000ms duration
   - Celebration animation at 100%

3. **Success State**
   - Fade in success message
   - Optional haptic feedback (if available)

### Error Handling

1. **Save Failures**
   - Show toast notification on error
   - Retry mechanism
   - Don't close modal on failure

2. **Data Validation**
   - Ensure date doesn't already exist
   - Validate reflection data
   - Handle edge cases (no activities, etc.)

## Key Constants Reference

```javascript
// From constants/theme.js
export const TYPOGRAPHY = {
  fontFamily: {
    regular: Platform.select({
      ios: 'Comic Relief',
      android: 'ComicRelief-Regular',
      web: "'Comic Relief', 'Comic Sans MS', cursive"
    }),
    bold: Platform.select({
      ios: 'Comic Relief',
      android: 'ComicRelief-Bold',
      web: "'Comic Relief', 'Comic Sans MS', cursive"
    }),
  },
  sizes: {
    xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24
  }
};

export const SPACING = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
};

export const RADIUS = {
  sm: 4, md: 8, lg: 12, xl: 16, xxl: 20, round: 9999
};

export const SHADOWS = {
  level2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  }
};
```

## Implementation Checklist

- [ ] Create CompleteDayModal component structure
- [ ] Implement modal header with theme color
- [ ] Add completion summary with animated progress
- [ ] Create reflection section with emoji picker
- [ ] Add journal entry TextInput
- [ ] Implement tomorrow preview section
- [ ] Add action buttons with proper styling
- [ ] Connect to AsyncStorage for persistence
- [ ] Add to App.js with proper handler
- [ ] Test on all platforms (iOS, Android, Web)
- [ ] Handle edge cases and errors
- [ ] Add success animations
- [ ] Implement keyboard dismissal
- [ ] Add accessibility labels

## Testing Considerations

1. Test with 0%, 50%, and 100% completion rates
2. Test with and without reflections
3. Test data persistence across app restarts
4. Test on different screen sizes
5. Test theme color changes
6. Test overflow behavior with many activities
7. Test platform-specific styling differences

## ⚠️ IMPORTANT ACCESSIBILITY RULES ⚠️

1. **NEVER USE GRAY TEXT** - All text must be black (#000) for maximum contrast
2. **Theme backgrounds require black text** - When using theme.light backgrounds, ensure all text is black
3. **Follow WCAG guidelines** - The app serves neurodivergent users who need clear, high-contrast interfaces
4. **Test with all themes** - Some themes have light backgrounds that require careful contrast consideration

Remember: Follow the established modal patterns exactly. The app prioritizes consistency and accessibility for neurodivergent users.