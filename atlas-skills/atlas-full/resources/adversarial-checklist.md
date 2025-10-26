# Adversarial Review Checklist

Use this checklist for Phase 4: Adversarial Review in the Atlas Full Workflow.

The goal is to think like an attacker, skeptic, and stress-tester. Ask tough questions.
Find the flaws before they reach production.

---

## Security Audit

### Authentication & Authorization

- [ ] **Authentication required?** Is feature protected by authentication?
- [ ] **Authorization checked?** Are permissions verified for each action?
- [ ] **Role-based access?** Do different user types have appropriate access?
- [ ] **Session management?** Are sessions properly validated and expired?
- [ ] **Token security?** Are tokens securely stored and transmitted?

### Data Security

- [ ] **Data encrypted at rest?** Is sensitive data encrypted in storage?
- [ ] **Data encrypted in transit?** Is HTTPS/TLS used for all requests?
- [ ] **Encryption keys secured?** Are keys not hardcoded, properly managed?
- [ ] **Sensitive data in logs?** No passwords, tokens, PII in console logs?
- [ ] **Data deletion secure?** Is deleted data truly removed (not just hidden)?

### Input Validation & Sanitization

- [ ] **Input validated?** All user input validated (type, length, format)?
- [ ] **SQL injection prevented?** Parameterized queries used (if applicable)?
- [ ] **XSS prevented?** User input sanitized before rendering HTML?
- [ ] **Command injection prevented?** No user input in shell commands?
- [ ] **Path traversal prevented?** File paths validated, no `../` exploits?

### API Security

- [ ] **Rate limiting?** Are API requests rate-limited to prevent abuse?
- [ ] **API keys secured?** No API keys in client code or version control?
- [ ] **CORS configured?** Cross-origin requests properly restricted?
- [ ] **Error messages safe?** Errors don't leak sensitive information?
- [ ] **API versioning?** Breaking changes handled gracefully?

### Common Vulnerabilities (OWASP Top 10)

- [ ] **Injection** (SQL, NoSQL, Command): Protected?
- [ ] **Broken Authentication**: Session management secure?
- [ ] **Sensitive Data Exposure**: Data encrypted, access controlled?
- [ ] **XML External Entities (XXE)**: XML parsing safe?
- [ ] **Broken Access Control**: Authorization enforced?
- [ ] **Security Misconfiguration**: Secure defaults, no debug mode in prod?
- [ ] **Cross-Site Scripting (XSS)**: User input sanitized?
- [ ] **Insecure Deserialization**: Deserialization safe?
- [ ] **Using Components with Known Vulnerabilities**: Dependencies updated?
- [ ] **Insufficient Logging & Monitoring**: Security events logged?

---

## Edge Case Analysis

### Data Edge Cases

- [ ] **Empty data**: How does feature handle zero items/records?
- [ ] **Null/undefined**: All null checks in place?
- [ ] **Invalid data**: How does feature handle malformed data?
- [ ] **Very large data**: Can feature handle 1,000+ items? 10,000+?
- [ ] **Very small data**: Does feature work with single item?
- [ ] **Duplicate data**: How are duplicates handled?
- [ ] **Special characters**: Unicode, emojis, HTML entities handled?
- [ ] **Long strings**: How does UI handle very long text?
- [ ] **Whitespace**: Leading/trailing whitespace trimmed?
- [ ] **Case sensitivity**: Consistent case handling (search, comparison)?

### Network Edge Cases

- [ ] **Offline mode**: Feature works offline or shows clear message?
- [ ] **Slow network**: Loading states shown, timeouts appropriate?
- [ ] **Network failure mid-operation**: Graceful failure and recovery?
- [ ] **Intermittent connectivity**: Retry logic implemented?
- [ ] **Request timeout**: Timeout values reasonable (not too short/long)?
- [ ] **Response errors**: 400, 500 errors handled gracefully?
- [ ] **Large payloads**: Can handle large responses without crashing?
- [ ] **Concurrent requests**: Race conditions prevented?

### State Edge Cases

- [ ] **Initial state**: Feature works on first launch (no data)?
- [ ] **Loading state**: Loading indicators shown appropriately?
- [ ] **Error state**: Errors displayed clearly with recovery options?
- [ ] **Success state**: Success feedback provided to user?
- [ ] **State transitions**: All state changes handled smoothly?
- [ ] **Stale state**: Old data refreshed when appropriate?
- [ ] **Race conditions**: Concurrent state updates handled?

### User Interaction Edge Cases

- [ ] **Rapid clicks**: Debouncing/throttling prevents duplicate actions?
- [ ] **Rapid navigation**: Navigating away mid-operation handled?
- [ ] **Back button**: Android/browser back button handled correctly?
- [ ] **App backgrounding**: State preserved when app backgrounds?
- [ ] **App killing**: Critical data saved before app terminates?
- [ ] **Deep linking**: Deep links to feature work correctly?
- [ ] **Notifications**: Notification taps open correct screen/state?
- [ ] **Keyboard**: Virtual keyboard doesn't hide critical UI?
- [ ] **Orientation change**: Feature works in portrait and landscape?
- [ ] **Gestures**: Swipe, pinch, long-press handled correctly?

### Platform Edge Cases

- [ ] **iOS-specific**: iOS 11-16+ all supported?
- [ ] **Android-specific**: Android 5-13+ all supported?
- [ ] **Web-specific**: Chrome, Firefox, Safari, Edge supported?
- [ ] **Small screens**: iPhone SE, small Android phones work?
- [ ] **Large screens**: iPads, Android tablets, desktop work?
- [ ] **Old devices**: Performance acceptable on older hardware?
- [ ] **Different locales**: Feature works in different languages/regions?
- [ ] **Accessibility**: Screen readers, VoiceOver, TalkBack work?
- [ ] **Dark mode**: Feature works in light and dark themes?

### Time-Based Edge Cases

- [ ] **Timezones**: Time handling correct across timezones?
- [ ] **Daylight saving**: DST transitions handled?
- [ ] **Date edge cases**: Leap years, month boundaries, year boundaries?
- [ ] **Future dates**: Future dates validated or allowed?
- [ ] **Past dates**: Very old dates (pre-2000) handled?
- [ ] **Timestamps**: Unix timestamps, ISO 8601 handled correctly?

### Concurrency Edge Cases

- [ ] **Multiple devices**: Same account on multiple devices handled?
- [ ] **Concurrent edits**: Two devices editing same data resolved?
- [ ] **Conflict resolution**: Merge conflicts resolved intelligently?
- [ ] **Last-write-wins**: Is last-write-wins acceptable, or need better?
- [ ] **Optimistic updates**: Optimistic UI updates rolled back on failure?

---

## Performance Analysis

### Load Time

- [ ] **Initial load**: Feature loads in < 3 seconds?
- [ ] **Subsequent loads**: Caching improves repeat load times?
- [ ] **Cold start**: App startup time not significantly increased?
- [ ] **Lazy loading**: Non-critical resources loaded lazily?
- [ ] **Code splitting**: Feature code split to reduce bundle size?

### Runtime Performance

- [ ] **Smooth animations**: 60fps maintained (no drops below 50fps)?
- [ ] **Scroll performance**: Lists scroll smoothly (virtualized if needed)?
- [ ] **Render performance**: No unnecessary re-renders?
- [ ] **Debouncing**: Expensive operations debounced/throttled?
- [ ] **Background work**: Heavy computation off main thread?

### Memory Usage

- [ ] **Memory footprint**: Feature adds < 50MB to app memory?
- [ ] **Memory leaks**: No memory leaks (listeners cleaned up)?
- [ ] **Large lists**: Memory usage reasonable with 1,000+ items?
- [ ] **Image memory**: Images properly cached and released?
- [ ] **Garbage collection**: Objects properly garbage collected?

### Network Usage

- [ ] **Bandwidth efficient**: Data transfer minimized?
- [ ] **Request batching**: Multiple requests batched where possible?
- [ ] **Caching**: API responses cached appropriately?
- [ ] **Compression**: Data compressed (gzip, etc.)?
- [ ] **Image optimization**: Images compressed, thumbnails used?

### Battery Impact (Mobile)

- [ ] **CPU usage**: No excessive CPU usage?
- [ ] **Network polling**: Polling intervals reasonable (not too frequent)?
- [ ] **Background activity**: Background work minimized?
- [ ] **Location services**: Location services only when needed?
- [ ] **Wake locks**: Device sleep not prevented unnecessarily?

### Storage Usage

- [ ] **Disk space**: Feature adds reasonable amount of data?
- [ ] **Storage growth**: Storage growth over time acceptable?
- [ ] **Cleanup policy**: Old/unused data cleaned up?
- [ ] **Storage limits**: Feature handles device storage full?
- [ ] **Cache size**: Cache size limited (not unbounded)?

---

## Cross-Platform Compatibility

### iOS

- [ ] **iOS versions**: Works on iOS 11-16+?
- [ ] **iPhone sizes**: Works on SE, 12/13/14/15 models?
- [ ] **iPad**: Works on iPad (different layouts if needed)?
- [ ] **Permissions**: iOS permissions requested with clear messaging?
- [ ] **Native modules**: Native iOS modules work correctly?
- [ ] **App Store guidelines**: Complies with App Store review guidelines?
- [ ] **Apple Human Interface Guidelines**: Follows iOS design patterns?

### Android

- [ ] **Android versions**: Works on Android 5-13+?
- [ ] **Screen sizes**: Works on small, medium, large, xlarge screens?
- [ ] **Manufacturers**: Works on Samsung, Google, Xiaomi, etc.?
- [ ] **Permissions**: Android permissions requested appropriately?
- [ ] **Native modules**: Native Android modules work correctly?
- [ ] **Material Design**: Follows Material Design guidelines?
- [ ] **Google Play guidelines**: Complies with Play Store policies?

### Web

- [ ] **Browsers**: Works on Chrome, Firefox, Safari, Edge?
- [ ] **Browser versions**: Works on last 2 major versions?
- [ ] **Mobile browsers**: Works on mobile Safari, Chrome Android?
- [ ] **Responsive design**: Works on mobile, tablet, desktop sizes?
- [ ] **Keyboard navigation**: Keyboard navigation works (tab, enter)?
- [ ] **Mouse interactions**: Hover, click, right-click handled?
- [ ] **Touch interactions**: Touch gestures work on touch screens?

### Platform-Specific Gotchas (StackMap)

- [ ] **Android FlexWrap**: Cards use 48% widths (not calculateCardWidth)?
- [ ] **Android fonts**: Typography component used (not direct fontWeight)?
- [ ] **iOS AsyncStorage**: Debounced updates (not rapid writes)?
- [ ] **iOS NetInfo**: NetInfo.fetch() not used (causes freezes)?
- [ ] **Web 3-column**: Percentage widths (31%/48%/100%) used?
- [ ] **Web Alert.alert**: ConfirmModal used instead of Alert.alert?
- [ ] **Typography**: Typography component used for cross-platform fonts?
- [ ] **No gray text**: All text uses #000 (black) for accessibility?

---

## Maintainability Review

### Code Complexity

- [ ] **Function length**: Functions < 50 lines (split if longer)?
- [ ] **File length**: Files < 500 lines (split into modules if longer)?
- [ ] **Cyclomatic complexity**: Complexity < 10 (refactor if higher)?
- [ ] **Nesting depth**: Nesting < 3 levels (extract functions if deeper)?
- [ ] **Code duplication**: No copy-paste duplication (DRY principle)?

### Code Quality

- [ ] **Clear naming**: Variables, functions named descriptively?
- [ ] **Consistent style**: Code follows project style guide?
- [ ] **Comments**: Complex logic commented (why, not what)?
- [ ] **Magic numbers**: No magic numbers (use named constants)?
- [ ] **Error handling**: Errors handled gracefully (try-catch)?
- [ ] **Type safety**: TypeScript types used (no `any` without reason)?

### Testing

- [ ] **Test coverage**: > 80% coverage for critical paths?
- [ ] **Unit tests**: All functions have unit tests?
- [ ] **Integration tests**: Key workflows have integration tests?
- [ ] **Edge case tests**: Edge cases tested?
- [ ] **Performance tests**: Performance benchmarks in place?
- [ ] **Regression tests**: Existing tests still pass?

### Documentation

- [ ] **Code comments**: Non-obvious logic commented?
- [ ] **Function docs**: Public functions documented (purpose, params, return)?
- [ ] **README**: README updated with new feature?
- [ ] **API docs**: API endpoints documented (if applicable)?
- [ ] **User guide**: User-facing documentation updated?
- [ ] **Developer guide**: Developer onboarding docs updated?

### Technical Debt

- [ ] **Shortcuts documented**: Any shortcuts logged as technical debt?
- [ ] **TODOs addressed**: All TODOs either resolved or logged?
- [ ] **Deprecated APIs**: No deprecated APIs used?
- [ ] **Dependencies updated**: Dependencies up-to-date (security patches)?
- [ ] **Refactoring needed**: Major refactoring needs documented?

---

## StackMap-Specific Review

### Field Naming Conventions

- [ ] **Activities use `text`**: Not `name` or `title`?
- [ ] **Activities use `icon`**: Not `emoji`?
- [ ] **Users use `icon`**: Not `emoji`?
- [ ] **Users use `name`**: As string, not object?
- [ ] **Fallbacks included**: Reading uses `text || name || title`, `icon || emoji`?
- [ ] **dataNormalizer**: Normalization logic in dataNormalizer.js if needed?

### Store Updates

- [ ] **Store-specific methods**: Used instead of `useAppStore.setState()`?
- [ ] **User updates**: `useUserStore.getState().setUsers()` used?
- [ ] **Settings updates**: `useSettingsStore.getState().updateSettings()` used?
- [ ] **Library updates**: `useLibraryStore.getState().setLibrary()` used?
- [ ] **Optimistic updates**: Immediate UI updates with rollback on error?

### Sync System

- [ ] **Field names synced**: Canonical field names (`text`, `icon`) synced?
- [ ] **Conflict resolution**: Conflicts resolved intelligently?
- [ ] **Encryption**: Sensitive data encrypted (NaCl)?
- [ ] **Sync triggers**: Appropriate sync triggers (debounced)?
- [ ] **Migration**: Existing synced data compatible?

### Design Rules

- [ ] **No gray text**: All text uses #000 (black)?
- [ ] **High contrast**: Colors pass accessibility contrast ratios?
- [ ] **Typography component**: Used for all text rendering?
- [ ] **Consistent spacing**: Follows spacing guidelines (8px grid)?
- [ ] **Font sizes**: Readable font sizes (min 14px)?

### Platform Gotchas

- [ ] **CLAUDE.md reviewed**: Platform-specific gotchas checked?
- [ ] **Android layouts**: FlexWrap cards use percentage widths?
- [ ] **iOS performance**: AsyncStorage debounced, NetInfo disabled?
- [ ] **Web layouts**: Multi-column layouts use percentage widths?
- [ ] **Platform-specific files**: Created where needed (.native.js, .web.js)?

---

## Adversarial Questions

Ask yourself these tough questions:

### Security

1. **"How would I hack this?"**
   - What attack vectors exist?
   - How would I steal data, impersonate users, disrupt service?
   - What's the worst-case scenario?

2. **"What if authentication fails?"**
   - Can unauthenticated users access this?
   - What if token expires mid-operation?
   - What if user logs out on another device?

3. **"What data could leak?"**
   - What's in logs, error messages, API responses?
   - What's visible in network inspector?
   - What's accessible to other users?

### Performance

4. **"What if 10,000 users use this simultaneously?"**
   - Can backend handle the load?
   - Will API rate limits be hit?
   - Will costs skyrocket?

5. **"What if the data set grows 100x?"**
   - Will queries slow down?
   - Will UI become unusable?
   - Will storage costs become prohibitive?

6. **"What if this runs on a 5-year-old device?"**
   - Acceptable performance on old hardware?
   - Memory usage reasonable?
   - Battery drain acceptable?

### Reliability

7. **"What if the network drops mid-operation?"**
   - Data loss?
   - Corrupt state?
   - Clear error message?

8. **"What if the external service is down?"**
   - Firebase Storage down?
   - API server down?
   - Graceful degradation?

9. **"What if user does something unexpected?"**
   - Spams button 100 times?
   - Enters 10,000 characters in text field?
   - Uploads 100MB file?

### Maintenance

10. **"What will break in 6 months?"**
    - Technical debt?
    - Deprecated APIs?
    - Unmaintained dependencies?

11. **"Can a new developer understand this?"**
    - Clear code?
    - Adequate documentation?
    - Obvious patterns?

12. **"What if requirements change?"**
    - Easy to modify?
    - Easy to extend?
    - Easy to remove?

---

## Red Flags (Stop and Reconsider)

If ANY of these are true, stop and address before proceeding:

### Security Red Flags 🚩

- [ ] **Unauthenticated access to sensitive data**
- [ ] **User data not encrypted**
- [ ] **API keys in client code**
- [ ] **SQL injection vulnerability**
- [ ] **XSS vulnerability**
- [ ] **No input validation**

### Performance Red Flags 🚩

- [ ] **Load time > 5 seconds**
- [ ] **Memory leak detected**
- [ ] **UI freezes for > 1 second**
- [ ] **Network requests unbounded (no pagination)**
- [ ] **No caching strategy**

### Reliability Red Flags 🚩

- [ ] **No error handling**
- [ ] **No offline support (for mobile)**
- [ ] **No retry logic for critical operations**
- [ ] **State corruption possible**
- [ ] **Data loss possible**

### Maintainability Red Flags 🚩

- [ ] **Functions > 100 lines**
- [ ] **No tests**
- [ ] **No documentation**
- [ ] **Heavy code duplication**
- [ ] **High technical debt**

---

## Review Output Template

```markdown
## Adversarial Review: [Feature Name]

### Security Assessment: ✅ PASS / ⚠️ CONCERNS / ❌ FAIL

**Reviewed**:
- [Security aspect 1]: [Status]
- [Security aspect 2]: [Status]

**Concerns found**:
1. [Concern 1] - Severity: [High/Med/Low] - Mitigation: [plan]
2. [Concern 2] - Severity: [High/Med/Low] - Mitigation: [plan]

**Verdict**: [Pass, Pass with concerns, Fail]

---

### Edge Case Analysis: ✅ COVERED / ⚠️ PARTIAL / ❌ GAPS

**Edge cases covered**:
- [Case 1] ✅
- [Case 2] ✅

**Edge cases to address**:
1. [Case 1] - Plan: [how to handle]
2. [Case 2] - Plan: [how to handle]

**Verdict**: [Covered, Partial coverage, Gaps exist]

---

### Performance Assessment: ✅ GOOD / ⚠️ ACCEPTABLE / ❌ CONCERNING

**Measurements**:
- Load time: [value]
- Memory usage: [value]
- Network bandwidth: [value]

**Optimizations needed**:
1. [Optimization 1] - Impact: [High/Med/Low]
2. [Optimization 2] - Impact: [High/Med/Low]

**Verdict**: [Good, Acceptable, Concerning]

---

### Cross-Platform Compatibility: ✅ READY / ⚠️ NEEDS WORK / ❌ BLOCKED

**Platform testing**:
- iOS: [Status]
- Android: [Status]
- Web: [Status]

**Platform issues to address**:
1. [Issue 1] - Platform: [iOS/Android/Web]
2. [Issue 2] - Platform: [iOS/Android/Web]

**Verdict**: [Ready, Needs work, Blocked]

---

### Maintainability: ✅ GOOD / ⚠️ ACCEPTABLE / ❌ HIGH DEBT

**Code quality**:
- Complexity: [assessment]
- Test coverage: [percentage]
- Documentation: [assessment]

**Technical debt**:
1. [Debt item 1] - Priority: [High/Med/Low]
2. [Debt item 2] - Priority: [High/Med/Low]

**Verdict**: [Good, Acceptable, High debt]

---

### Overall Verdict: ✅ PROCEED / ⚠️ PROCEED WITH CAUTION / ❌ REVISE PLAN

**Blocking issues** (must fix before proceeding):
1. [Issue 1]
2. [Issue 2]

**Non-blocking issues** (address during implementation):
1. [Issue 1]
2. [Issue 2]

**Recommendation**: [Proceed / Proceed with caution / Revise plan]
```

---

## Quick Reference

### Must Check (Minimum Viable Review)

Even if short on time, check at MINIMUM:

1. [ ] **Security**: Authentication, authorization, input validation
2. [ ] **Edge Cases**: Empty state, error state, offline mode
3. [ ] **Performance**: Load time < 3s, no memory leaks
4. [ ] **Platform**: Works on iOS, Android, Web
5. [ ] **StackMap**: Store methods, field naming, platform gotchas

### Recommended Time Allocation

- Security audit: 5 minutes
- Edge case analysis: 5 minutes
- Performance review: 3 minutes
- Cross-platform check: 3 minutes
- Maintainability check: 2 minutes
- **Total**: ~20 minutes

---

Use this checklist to be paranoid, adversarial, and thorough. Find the issues before users do. 🔍
