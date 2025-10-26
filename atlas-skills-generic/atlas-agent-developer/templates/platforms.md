# Platform-Specific Rules Template

Copy this file to `.atlas/platforms.md` in your project if you develop for multiple platforms.

---

# Platform-Specific Rules

Document platform-specific conventions, gotchas, and best practices here.

## Platform Overview

**Platforms supported:**
- [ ] Web (browser)
- [ ] Mobile (iOS/Android)
- [ ] Desktop (Electron/Tauri)
- [ ] Server (Node.js)

**Code sharing strategy:**
- Shared code location: `src/shared/` or `src/`
- Platform-specific code: `src/web/`, `src/mobile/`, `src/desktop/`
- Platform-specific extensions: `.web.ts`, `.native.ts`, `.electron.ts`

---

## Web Platform

### Browser Support

**Target browsers:**
- Chrome: [version]
- Firefox: [version]
- Safari: [version]
- Edge: [version]

**Polyfills required:**
- [List any polyfills needed]

### Web-Specific Rules

**DOM Access:**
```typescript
// ✅ CORRECT: Check for window
if (typeof window !== 'undefined') {
  window.localStorage.setItem('key', 'value')
}

// ❌ WRONG: Assume window exists
window.localStorage.setItem('key', 'value')
```

**Styling:**
- Use CSS modules or styled-components
- Avoid inline styles (except dynamic values)
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Ensure responsive design (mobile-first)

**Performance:**
- Code split by route
- Lazy load components
- Optimize images (WebP, lazy loading)
- Use service workers for offline support

**Accessibility:**
- All interactive elements keyboard accessible
- Maintain WCAG AA contrast ratios
- Use ARIA labels where needed
- Test with screen readers

### Web Gotchas

**Known issues:**
- [Document any browser-specific bugs or workarounds]
- Example: "Safari has 50MB localStorage limit (other browsers 10MB)"
- Example: "Firefox requires user interaction before accessing clipboard"

**Verification:**
```bash
# Verify no direct window access in shared code
grep -r "window\." src/shared/
# Should return NOTHING (use platform abstraction)

# Verify semantic HTML used
grep -r "<div.*onClick" src/web/components/
# Should return NOTHING (use <button>)
```

---

## Mobile Platform (React Native)

### Device Support

**iOS:**
- Minimum version: iOS [version]
- Target version: iOS [version]

**Android:**
- Minimum API level: [number]
- Target API level: [number]

### Mobile-Specific Rules

**Components:**
```typescript
// ✅ CORRECT: Use React Native components
import { View, Text, TouchableOpacity } from 'react-native'

// ❌ WRONG: Don't use web components in mobile
import { div, span } from 'react' // Not available
```

**Styling:**
```typescript
// ✅ CORRECT: Use StyleSheet
const styles = StyleSheet.create({
  container: { flex: 1 }
})

// ❌ WRONG: Don't use CSS strings
const style = "display: flex;" // Not supported
```

**Navigation:**
- Use React Navigation (not web routing)
- Handle hardware back button (Android)
- Support deep linking

**Permissions:**
- Request permissions at runtime
- Handle permission denials gracefully
- Explain why permissions needed

### Platform-Specific Code

**Platform detection:**
```typescript
import { Platform } from 'react-native'

if (Platform.OS === 'ios') {
  // iOS-specific code
} else if (Platform.OS === 'android') {
  // Android-specific code
}
```

**File extensions:**
- Shared: `Button.tsx`
- iOS-only: `Button.ios.tsx`
- Android-only: `Button.android.tsx`

### Mobile Gotchas

**iOS:**
- AsyncStorage is slow (debounce writes)
- NetInfo.fetch() can freeze UI (avoid in hot path)
- Modal has specific layout requirements
- ScrollView captures touches before JS

**Android:**
- Font weights need font family variants (e.g., `Roboto-Bold`)
- FlexWrap requires percentage widths
- Hardware back button needs handling
- Different behavior for keyboard events

**Verification:**
```bash
# Verify no web APIs in mobile code
grep -r "window\|document\|localStorage" src/mobile/
# Should return NOTHING

# Verify platform checks exist
grep -r "Platform\.OS" src/mobile/ | wc -l
# Should be > 0 if platform-specific code exists

# Verify no hardcoded colors (use theme)
grep -r "color.*#" src/mobile/components/ | wc -l
# Should be low (use theme system)
```

---

## Desktop Platform (Electron/Tauri)

### Desktop-Specific Rules

**Window Management:**
- Handle window resize/maximize/minimize
- Save/restore window position
- Handle multiple windows if supported

**Native APIs:**
```typescript
// ✅ CORRECT: Check for electron
if (window.electron) {
  window.electron.ipcRenderer.send('message')
}

// ❌ WRONG: Assume electron exists
window.electron.ipcRenderer.send('message')
```

**File System:**
- Use native file dialogs
- Handle file paths correctly (cross-platform)
- Request file system permissions

**Performance:**
- Optimize for desktop (larger screens, more power)
- Handle high DPI displays
- Support keyboard shortcuts

### Desktop Gotchas

**Known issues:**
- [Document Electron/Tauri-specific issues]
- Example: "Electron: `remote` module deprecated, use IPC"
- Example: "Tauri: File dialogs are async"

**Verification:**
```bash
# Verify IPC calls are checked
grep -r "ipcRenderer\." src/desktop/ | grep -v "if.*electron"
# Should return NOTHING (always check for electron)
```

---

## Server Platform (Node.js)

### Server-Specific Rules

**No Browser APIs:**
```typescript
// ❌ WRONG: Don't use browser APIs
window.location.href = '/path' // Not available

// ✅ CORRECT: Use Node.js APIs
const url = new URL('/path', 'http://localhost')
```

**Environment:**
- Use process.env for configuration
- Handle signals (SIGTERM, SIGINT)
- Log to stdout/stderr (not files)

**Security:**
- Validate all input
- Use helmet.js for Express
- Never trust client data
- Use environment variables for secrets

### Server Gotchas

**Known issues:**
- [Document Node.js-specific issues]
- Example: "Node.js <16: fetch not available (use node-fetch)"
- Example: "Timers in Node.js use different API than browser"

**Verification:**
```bash
# Verify no browser APIs in server code
grep -r "window\|document\|localStorage" src/server/
# Should return NOTHING

# Verify environment variables used for secrets
grep -r "const.*=.*['\"].*key['\"]" src/server/
# Should return NOTHING (use process.env)
```

---

## Cross-Platform Abstraction

### Shared Code Guidelines

**Create platform abstractions:**

```typescript
// src/shared/storage.ts
interface Storage {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
}

// src/web/storage.ts
export const storage: Storage = {
  async getItem(key) { return localStorage.getItem(key) },
  async setItem(key, value) { localStorage.setItem(key, value) }
}

// src/mobile/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage'

export const storage: Storage = {
  async getItem(key) { return AsyncStorage.getItem(key) },
  async setItem(key, value) { return AsyncStorage.setItem(key, value) }
}
```

**Platform detection:**
```typescript
// ✅ CORRECT: Use build-time platform detection
const platform = process.env.PLATFORM // 'web' | 'mobile' | 'desktop'

// ❌ WRONG: Runtime checks in shared code
if (window) { /* web code */ } // Breaks mobile
```

### Testing Across Platforms

**Test strategy:**
- Unit tests: Platform-agnostic (test shared logic)
- Integration tests: Platform-specific (test platform integrations)
- E2E tests: Platform-specific (test user flows)

**Run tests:**
```bash
# Web
npm run test:web

# Mobile
npm run test:mobile

# All platforms
npm run test:all
```

---

## Platform-Specific Dependencies

### Managing Dependencies

**Web-only:**
```json
{
  "devDependencies": {
    "webpack": "^5.0.0",
    "css-loader": "^6.0.0"
  }
}
```

**Mobile-only:**
```json
{
  "dependencies": {
    "react-native": "^0.70.0",
    "@react-native-async-storage/async-storage": "^1.17.0"
  }
}
```

**Shared:**
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Verification

```bash
# Verify no mobile deps in web code
grep -r "react-native" src/web/
# Should return NOTHING

# Verify no web deps in mobile code
grep -r "react-dom" src/mobile/
# Should return NOTHING
```

---

## Build Configuration

### Platform-Specific Builds

**Web:**
```bash
npm run build:web
# Outputs to: dist/web/
```

**Mobile:**
```bash
npm run build:ios
npm run build:android
# Outputs to: ios/build/, android/app/build/
```

**Desktop:**
```bash
npm run build:desktop
# Outputs to: dist/desktop/
```

### Environment-Specific Config

**Development:**
- Hot reload enabled
- Source maps enabled
- Debug logging enabled

**Production:**
- Minification enabled
- Source maps disabled (or external)
- Debug logging disabled
- Analytics enabled

---

## Deployment

### Platform-Specific Deployment

**Web:**
- Deploy to: [CDN, Vercel, Netlify, etc.]
- Cache strategy: [describe caching]
- Rollback plan: [describe rollback]

**Mobile:**
- iOS: App Store via TestFlight
- Android: Play Store via Internal Testing
- Update strategy: [OTA updates, force update, etc.]

**Desktop:**
- Distribution: [Auto-updater, manual download, etc.]
- Update frequency: [describe strategy]

---

## Troubleshooting

### Common Issues

**"Code works on web but not mobile"**
- Check for browser APIs (window, document, localStorage)
- Check for CSS usage (use StyleSheet instead)
- Check for web-specific libraries

**"Code works on iOS but not Android"**
- Check for iOS-specific APIs
- Check font weight usage (Android needs font variants)
- Check for layout differences (flexbox behaves differently)

**"Build fails for specific platform"**
- Check dependencies (platform-specific deps in wrong code)
- Check imports (importing platform-specific code in shared)
- Check configuration (platform-specific config needed)

### Debug Commands

```bash
# Check for platform-specific code in shared
grep -r "Platform\.OS\|window\.\|document\." src/shared/

# Check for web code in mobile
grep -r "localStorage\|sessionStorage" src/mobile/

# Check for mobile code in web
grep -r "react-native" src/web/
```

---

## Maintenance

**Update this file when:**
- Adding platform support
- Discovering platform-specific bugs
- Changing build configuration
- Updating minimum platform versions
- Adding platform-specific dependencies

**Review quarterly:**
- Remove deprecated workarounds
- Update minimum versions
- Document new gotchas
- Verify abstraction layer is sufficient
