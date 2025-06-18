# DevC Dispatcher - Mobile App Launch

## How to Parallelize Development with Multiple Claude Instances

### Quick Start for Each Issue

Open a new Claude conversation and paste:

```
I need you to implement GitHub issue #[NUMBER] for the StackMap project:
https://github.com/ajstack22/StackMap/issues/[NUMBER]

Current codebase is at: [drag in project folder]

Please read the issue and implement all acceptance criteria. Create any new files needed and update existing ones. Provide clear instructions for testing your implementation.
```

### Issue Assignment Strategy

#### Session 1: PWA Readiness (Issue #3)
**Start this first - it unblocks everything else**
```
Focus: manifest.json, icons, service worker, offline functionality
Key files: manifest.json, sw.js, index.html
Output: Updated PWA that passes Lighthouse audit
```

#### Session 2: Store Assets (Issue #6) 
**Can start immediately - no dependencies**
```
Focus: Screenshots, descriptions, marketing copy
Key files: Create new /store-assets directory
Output: All images and text ready for upload
```

#### Session 3: Android Wrapper (Issue #4)
**Start after PWA readiness**
```
Focus: Android Studio project with TWA
Key files: New Android project directory
Output: Signed APK ready for Play Store
```

#### Session 4: iOS Wrapper (Issue #5)
**Start after PWA readiness**
```
Focus: Xcode project with WKWebView
Key files: New iOS project directory  
Output: IPA ready for App Store
```

### Coordination Tips

1. **Check PWA Status First**
   ```bash
   npm run test:story -- --story pwa-store-ready
   ```

2. **Share Context Between Sessions**
   - If PWA session creates new icon files → Tell Android/iOS sessions the paths
   - If Store Assets creates screenshots → Share dimensions with wrapper sessions

3. **Test Integration Points**
   ```bash
   # After PWA changes
   npm run serve
   # Open http://localhost:5500 in mobile browser
   # Try "Add to Home Screen"
   ```

4. **Common Questions to Answer Upfront**
   - Bundle ID: `com.stackmap.app`
   - App version: `1.0.0`
   - Target SDK: Android 21+ / iOS 13+
   - Primary color: `#4A90E2` (or check current theme)

### Progress Tracking

Create a simple status file:

```markdown
# Mobile Launch Status

## In Progress
- [ ] Issue #3 - PWA Readiness (devc session 1)
- [ ] Issue #6 - Store Assets (devc session 2)

## Blocked
- [ ] Issue #4 - Android (waiting for #3)
- [ ] Issue #5 - iOS (waiting for #3)

## Completed
- None yet
```

### Handoff Protocol

When a devc completes an issue:

1. Get the list of changed files
2. Run any build commands they provide
3. Test using their test steps
4. Update the status file
5. Unblock dependent issues

### Red Flags to Watch For

- ❌ Don't let devc change core app functionality
- ❌ Don't let them add heavy dependencies without asking
- ❌ Don't let them modify the service worker version (you control that)
- ✅ Do let them create new directories for platform-specific code
- ✅ Do let them add necessary config files
- ✅ Do let them optimize assets

### Quick Commands

```bash
# See all mobile issues
gh issue list --label mobile

# Check specific issue
gh issue view 3

# Close completed issue
gh issue close 3 --comment "Implemented in commit abc123"
```

### Time Estimate
- PWA Readiness: 2-4 hours
- Store Assets: 2-3 hours  
- Android Wrapper: 3-4 hours
- iOS Wrapper: 3-4 hours

Total if done in parallel: ~4-6 hours
Total if done sequentially: ~12-15 hours

The key is starting #3 and #6 immediately in separate sessions.