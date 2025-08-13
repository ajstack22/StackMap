# Keyboard-Aware Onboarding Design Proposal

## Problem Statement
The current onboarding flow has significant issues when the virtual keyboard appears:
1. **Name/Emoji page**: Content gets pushed up making it unreadable
2. **No scroll behavior**: Users can't scroll to see hidden content
3. **Fixed positioning**: Elements overlap when keyboard appears
4. **Poor mobile experience**: Especially problematic on smaller screens

## Current Issues Analysis

### CreateUser Screen (Name/Emoji Input)
- Uses `KeyboardAvoidingView` with `behavior="padding"` on iOS
- Content is centered vertically (`justifyContent: 'center'`)
- When keyboard appears, the entire view shifts up
- Preview section and buttons get pushed off-screen
- No ScrollView to allow user to see hidden content

### Other Input Screens
- PIN setup screen
- Sync recovery phrase input
- Similar issues with keyboard overlap

## Proposed Solution

### 1. Layout Structure Changes
```javascript
// Instead of:
<KeyboardAvoidingView style={{ flex: 1, justifyContent: 'center' }}>
  <Content />
</KeyboardAvoidingView>

// Use:
<KeyboardAvoidingView 
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  style={{ flex: 1 }}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0} // Account for header
>
  <ScrollView 
    contentContainerStyle={{ flexGrow: 1 }}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
  >
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <View>{/* Top content */}</View>
      <View>{/* Form content */}</View>
      <View>{/* Bottom buttons */}</View>
    </View>
  </ScrollView>
</KeyboardAvoidingView>
```

### 2. Responsive Design Adjustments

#### Mobile (Keyboard Active)
- Reduce spacing between elements
- Move preview section inline with form
- Collapse emoji grid to horizontal scroll
- Auto-scroll to active input field

#### Tablet/Desktop
- Maintain current design
- Add subtle animations for focus states
- Keep generous spacing

### 3. Specific Screen Improvements

#### CreateUser Screen
```javascript
// Improved layout
<KeyboardAvoidingView>
  <ScrollView>
    <SafeAreaView>
      {/* Header - stays visible */}
      <View style={styles.header}>
        <Text>Create User</Text>
      </View>
      
      {/* Form - scrollable */}
      <View style={styles.formContainer}>
        <TextInput placeholder="Name" />
        
        {/* Emoji picker - horizontal scroll on mobile */}
        <ScrollView horizontal={isMobile}>
          {emojis.map(emoji => <EmojiOption />)}
        </ScrollView>
        
        {/* Preview - inline on mobile */}
        <View style={[
          styles.preview,
          isMobile && styles.previewInline
        ]}>
          <UserPill />
        </View>
      </View>
      
      {/* Actions - always visible */}
      <View style={styles.actions}>
        <Button title="Continue" />
      </View>
    </SafeAreaView>
  </ScrollView>
</KeyboardAvoidingView>
```

#### PIN Setup Screen
- Use numeric keyboard type
- Auto-advance on 4 digits
- Show PIN dots above keyboard
- Keep instructions visible

#### Sync Recovery Screen
- Multiline text input
- "Paste" button for easy input
- QR code scanner option
- Clear error messages

### 4. Implementation Strategy

#### Phase 1: Quick Fixes (Immediate)
1. Add ScrollView to all input screens
2. Remove `justifyContent: 'center'` from containers
3. Add proper `keyboardVerticalOffset`
4. Test on web at different viewport sizes

#### Phase 2: Enhanced UX (Next Sprint)
1. Auto-scroll to active input
2. Keyboard dismiss on scroll
3. Input focus management
4. Animated transitions

#### Phase 3: Polish (Future)
1. Custom keyboard accessories
2. Input validation indicators
3. Progress indicators
4. Haptic feedback

### 5. Testing Approach

#### Device Testing
- iPhone SE (smallest)
- iPhone 16 Pro Max (largest)
- iPad (tablet)
- Web (responsive)

#### Scenarios
1. Open keyboard on each screen
2. Type and navigate between fields
3. Rotate device with keyboard open
4. Test with accessibility keyboard

### 6. Code Implementation

Key files to modify:
- `/src/components/Onboarding/OnboardingNew.js`
- Styles object within the same file

Main changes:
1. Wrap content in ScrollView
2. Adjust KeyboardAvoidingView settings
3. Add dynamic spacing based on keyboard state
4. Implement auto-scroll behavior

### 7. Benefits
- **Improved UX**: Users can always see what they're typing
- **Better accessibility**: Works with all keyboard sizes
- **Cross-platform**: Consistent behavior across iOS/Android/Web
- **Future-proof**: Handles new device sizes

## Next Steps
1. Implement Phase 1 fixes
2. Test on localhost:3001
3. Get user feedback
4. Iterate on design