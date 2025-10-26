# React Native Project Conventions

## Project Overview
- Name: StackMap Mobile
- Stack: React Native, TypeScript, Redux Toolkit
- Architecture: Feature-based modules with shared components

## State Management
- Library: Zustand (split stores pattern)
- Update pattern: `useUserStore.getState().updateUser(userData)`
- Async: React Query for server state
- Anti-pattern: Direct state mutation `state.user = newUser` or using `useAppStore.setState` for specific stores

## Naming Conventions
- Components: PascalCase (e.g., `UserProfile.tsx`, `ActivityCard.tsx`)
- Screens: PascalCase with Screen suffix (e.g., `HomeScreen.tsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useUserData.ts`, `useActivitySync.ts`)
- Utilities: camelCase (e.g., `formatDate.ts`, `validateEmail.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`, `MAX_RETRIES`)
- Files: Match component name (UserProfile.tsx contains UserProfile component)

## Code Organization
```
src/
  components/        # Reusable UI components
    shared/          # Cross-feature components
    ActivityCard/    # Feature-specific components
  screens/          # Screen components
  navigation/       # Navigation configuration
  stores/           # Zustand stores
  hooks/            # Custom React hooks
  utils/            # Utility functions
  services/         # API and business logic
  types/            # TypeScript type definitions
  constants/        # App-wide constants
```

## Code Quality
- Linting: ESLint with React Native config
- Formatting: Prettier
- Type checking: TypeScript strict mode
- Testing framework: Jest + React Native Testing Library
- Coverage target: 70%

## Error Handling
- Pattern: Try/catch with specific error types
- Logging: Console in development, error service in production
- User-facing errors: Toast notifications via custom hook
- Network errors: Retry with exponential backoff

## Comments & Documentation
- When to comment: Complex business logic, non-obvious workarounds
- JSDoc: Required for all public functions and exported components
- README updates: Required when adding new major features or changing architecture

## Performance
- Bundle size target: < 10MB for production
- Render optimization: React.memo for expensive components, useMemo/useCallback for heavy computations
- API call patterns: React Query for caching, debounce user inputs
- List optimization: Use FlatList with proper keyExtractor and optimizations

## Accessibility
- ARIA labels: Required for all interactive elements (use accessibilityLabel)
- Keyboard navigation: Full support for external keyboards
- Color contrast: Minimum 4.5:1 for normal text, 3:1 for large text
- Screen readers: Test with TalkBack (Android) and VoiceOver (iOS)

## Platform-Specific Rules

### iOS
- AsyncStorage: Debounced saves (causes 20+ second freeze on iOS)
- NetInfo.fetch(): DISABLED - causes freezes, assume online instead
- Modal constraints: Must use specific flex rules for proper display
- Safe area: Use SafeAreaView or react-native-safe-area-context
- Fonts: Use fontWeight with "Comic Relief" font family
- Build: Xcode 15+, iOS 13+ target

### Android
- FlexWrap cards: MUST use percentage widths (48%) + alignContent: 'flex-start'
- No calculateCardWidth() for multi-column layouts
- Font weights: MUST use font variants (ComicRelief-Bold) without fontWeight property
  - Typography component handles this automatically - just use `fontWeight: 'bold'`
- ScrollView: Captures touches at native level before JS
- Build: Android Studio, minSdkVersion 21, targetSdkVersion 33

### Web (React Native Web)
- 3-Column Layout: Main screen cards MUST use percentage widths
  - 3 columns: width: '31%', 2 columns: width: '48%', 1 column: width: '100%'
  - DO NOT use flexBasis: 'auto' or width: undefined for multi-column layouts
  - Breakpoints: <768px: 1 col, 768-1199px: 2 cols, ≥1200px: 3 cols
- VectorIcons: MUST use `<span>` not `<Text>` component in VectorIcons.web.js
- Alert.alert: Not supported - use ConfirmModal component instead
- Browser support: Last 2 versions of Chrome, Firefox, Safari, Edge

### Mobile (iOS & Android)
- Swipe in modals: Use `react-native-pager-view` NOT PanResponder
- Navigation: React Navigation v6 with TypeScript
- Deep linking: Universal Links (iOS) and App Links (Android)

## Field Naming Standards (CRITICAL)
- Activities: Use `text` (not name/title), `icon` (not emoji)
- Users: Use `icon` (not emoji), `name` as string only
- Always include fallbacks: `activity.text || activity.name || activity.title`
- Normalizer: `/src/utils/dataNormalizer.js` handles variations

## Security
- Authentication: JWT tokens stored in secure storage (react-native-keychain)
- Authorization: Role-based with permission checks
- Data validation: Validate all user input before API calls
- Sensitive data: Never log PII, encrypt before storing

## Data Flow
- API integration: Centralized API client with interceptors
- Data normalization: Use dataNormalizer.js for consistent field names
- Caching strategy: React Query for server state, Zustand for client state
- Sync: Last-write-wins with conflict resolution

## Deployment
- Changelog file: `CHANGELOG.md` in root
- Version bumping: Automated via deployment scripts
- Deployment command: `./scripts/deploy.sh [qual|stage|beta|prod]`
- Environments:
  - QUAL: Development testing (multiple/day)
  - STAGE: Internal team validation (mobile-only, before beta)
  - BETA: Closed beta testing (1-2/week)
  - PROD: Public release (weekly/bi-weekly)

## Anti-Patterns (AVOID)

### State Management
- ❌ Direct state mutation: `state.user.name = "John"`
- ❌ Using useAppStore.setState for specific stores
- ✅ Use store-specific methods: `useUserStore.getState().setUser(...)`

### Performance
- ❌ Anonymous functions in render: `onPress={() => doSomething()}`
- ❌ Unoptimized lists: map() instead of FlatList
- ✅ Use useCallback: `const handlePress = useCallback(() => doSomething(), [])`
- ✅ Use FlatList with proper optimizations

### Styling
- ❌ Inline styles: `<View style={{margin: 10}}>`
- ❌ Magic numbers: `fontSize: 16`
- ✅ Use StyleSheet: `styles.container`
- ✅ Use constants: `fontSize: theme.fontSize.body`

### Platform-Specific
- ❌ Platform checks everywhere: `Platform.OS === 'ios' ? ... : ...`
- ❌ Ignoring safe areas on iOS
- ✅ Use Platform.select() or .ios.js/.android.js files
- ✅ Use SafeAreaView consistently

## Typography (Design System)
- All text must be black (#000) for accessibility
- Comic Relief font forced everywhere via custom Typography component
- High contrast required - test with all theme colors
- Usage:
  ```tsx
  <Typography fontWeight="bold">Bold text</Typography>
  <Typography fontSize={18}>Custom size</Typography>
  ```

## Examples

### Good Example: Store Update
```typescript
// ✅ Correct way to update user state
const updateUserName = (newName: string) => {
  useUserStore.getState().updateUser({
    name: newName
  });
};
```

### Bad Example: Direct State Mutation
```typescript
// ❌ WRONG: Direct state mutation
const updateUserName = (newName: string) => {
  useAppStore.setState((state) => {
    state.user.name = newName;
  });
};
```

### Good Example: FlatList with Optimization
```tsx
// ✅ Correct FlatList usage
<FlatList
  data={activities}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <ActivityCard activity={item} />}
  windowSize={5}
  maxToRenderPerBatch={10}
  removeClippedSubviews={true}
/>
```

### Bad Example: Unoptimized List
```tsx
// ❌ WRONG: Using map for long lists
<ScrollView>
  {activities.map((activity) => (
    <ActivityCard key={activity.id} activity={activity} />
  ))}
</ScrollView>
```

### Good Example: Platform-Specific Code
```typescript
// ✅ Correct platform-specific styling
const styles = StyleSheet.create({
  container: {
    padding: Platform.select({
      ios: 10,
      android: 8,
      web: 12,
    }),
  },
});
```

### Good Example: Typography Usage
```tsx
// ✅ Correct typography with accessibility
<Typography fontWeight="bold" accessibilityRole="header">
  Activity Title
</Typography>
```
