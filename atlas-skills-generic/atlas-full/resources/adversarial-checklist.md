# Adversarial Review Checklist

Use this checklist for Phase 4: Adversarial Review in the Atlas Full Workflow.

The goal is to think like an attacker, skeptic, and stress-tester. Ask tough questions.
Find the flaws before they reach production.

**Customization Note**: Add platform-specific checks and domain-specific security concerns for your project. Remove sections that don't apply.

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
- [ ] **XML External Entities (XXE)**: XML parsing safe (if applicable)?
- [ ] **Broken Access Control**: Authorization enforced?
- [ ] **Security Misconfiguration**: Secure defaults, no debug mode in prod?
- [ ] **Cross-Site Scripting (XSS)**: User input sanitized?
- [ ] **Insecure Deserialization**: Deserialization safe (if applicable)?
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
- [ ] **Back button**: Browser/app back button handled correctly?
- [ ] **App backgrounding**: State preserved when app backgrounds (mobile)?
- [ ] **App killing**: Critical data saved before app terminates?
- [ ] **Deep linking**: Deep links to feature work correctly?
- [ ] **Keyboard**: Virtual keyboard doesn't hide critical UI (mobile)?
- [ ] **Orientation change**: Feature works in portrait and landscape (mobile)?
- [ ] **Gestures**: Swipe, pinch, long-press handled correctly (if applicable)?

### Platform Edge Cases (customize for your platforms)

- [ ] **Platform A**: Version X-Y+ all supported?
- [ ] **Platform B**: Version X-Y+ all supported?
- [ ] **Screen sizes**: Works on small, medium, large screens?
- [ ] **Old devices**: Performance acceptable on older hardware?
- [ ] **Different locales**: Feature works in different languages/regions?
- [ ] **Accessibility**: Screen readers and accessibility tools work?
- [ ] **Dark mode**: Feature works in light and dark themes (if applicable)?

### Time-Based Edge Cases

- [ ] **Timezones**: Time handling correct across timezones?
- [ ] **Daylight saving**: DST transitions handled?
- [ ] **Date edge cases**: Leap years, month boundaries, year boundaries?
- [ ] **Future dates**: Future dates validated or allowed?
- [ ] **Past dates**: Very old dates handled?
- [ ] **Timestamps**: Timestamp formats consistent?

### Concurrency Edge Cases

- [ ] **Multiple sessions**: Same account on multiple devices/sessions handled?
- [ ] **Concurrent edits**: Two sessions editing same data resolved?
- [ ] **Conflict resolution**: Merge conflicts resolved intelligently?
- [ ] **Last-write-wins**: Is last-write-wins acceptable, or need better strategy?
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

- [ ] **Smooth animations**: Animations run at target framerate (e.g., 60fps)?
- [ ] **Scroll performance**: Lists scroll smoothly (virtualized if needed)?
- [ ] **Render performance**: No unnecessary re-renders?
- [ ] **Debouncing**: Expensive operations debounced/throttled?
- [ ] **Background work**: Heavy computation off main thread?

### Memory Usage

- [ ] **Memory footprint**: Feature adds reasonable amount to app memory?
- [ ] **Memory leaks**: No memory leaks (listeners cleaned up)?
- [ ] **Large lists**: Memory usage reasonable with 1,000+ items?
- [ ] **Image memory**: Images properly cached and released?
- [ ] **Garbage collection**: Objects properly garbage collected?

### Network Usage

- [ ] **Bandwidth efficient**: Data transfer minimized?
- [ ] **Request batching**: Multiple requests batched where possible?
- [ ] **Caching**: API responses cached appropriately?
- [ ] **Compression**: Data compressed (gzip, etc.)?
- [ ] **Asset optimization**: Images/assets compressed, optimized?

### Resource Utilization

- [ ] **CPU usage**: No excessive CPU usage?
- [ ] **Battery impact**: Feature doesn't drain battery excessively (mobile)?
- [ ] **Background activity**: Background work minimized?
- [ ] **Network polling**: Polling intervals reasonable (not too frequent)?
- [ ] **Storage usage**: Disk space usage reasonable?

### Storage Usage

- [ ] **Disk space**: Feature adds reasonable amount of data?
- [ ] **Storage growth**: Storage growth over time acceptable?
- [ ] **Cleanup policy**: Old/unused data cleaned up?
- [ ] **Storage limits**: Feature handles device storage full?
- [ ] **Cache size**: Cache size limited (not unbounded)?

---

## Cross-Platform Compatibility

**Customize this section for your platforms (e.g., iOS/Android/Web, Windows/Mac/Linux, etc.)**

### Platform A

- [ ] **Versions supported**: Works on version X-Y+?
- [ ] **Screen sizes**: Works on various screen sizes?
- [ ] **Permissions**: Permissions requested with clear messaging?
- [ ] **Native features**: Native modules/APIs work correctly?
- [ ] **Guidelines compliance**: Follows platform design guidelines?

### Platform B

- [ ] **Versions supported**: Works on version X-Y+?
- [ ] **Screen sizes**: Works on various screen sizes?
- [ ] **Permissions**: Permissions requested appropriately?
- [ ] **Native features**: Native modules/APIs work correctly?
- [ ] **Guidelines compliance**: Follows platform design guidelines?

### Platform C

- [ ] **Browsers**: Works on major browsers?
- [ ] **Browser versions**: Works on last 2 major versions?
- [ ] **Responsive design**: Works on mobile, tablet, desktop sizes?
- [ ] **Keyboard navigation**: Keyboard navigation works (tab, enter)?
- [ ] **Mouse interactions**: Hover, click, right-click handled?
- [ ] **Touch interactions**: Touch gestures work on touch screens?

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
- [ ] **Type safety**: Types used appropriately (no unchecked types)?

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
   - Will rate limits be hit?
   - Will costs skyrocket?

5. **"What if the data set grows 100x?"**
   - Will queries slow down?
   - Will UI become unusable?
   - Will storage costs become prohibitive?

6. **"What if this runs on old/slow hardware?"**
   - Acceptable performance on old hardware?
   - Memory usage reasonable?
   - Resource drain acceptable?

### Reliability

7. **"What if the network drops mid-operation?"**
   - Data loss?
   - Corrupt state?
   - Clear error message?

8. **"What if external service is down?"**
   - Critical dependency down?
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
- [ ] **No offline support** (for applications that need it)
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
- Platform A: [Status]
- Platform B: [Status]
- Platform C: [Status]

**Platform issues to address**:
1. [Issue 1] - Platform: [which platform]
2. [Issue 2] - Platform: [which platform]

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
2. [ ] **Edge Cases**: Empty state, error state, network failures
3. [ ] **Performance**: Load time < 3s, no memory leaks
4. [ ] **Platform**: Works on target platforms
5. [ ] **Maintainability**: Code quality, test coverage, documentation

### Recommended Time Allocation

- Security audit: 5 minutes
- Edge case analysis: 5 minutes
- Performance review: 3 minutes
- Cross-platform check: 3 minutes (if applicable)
- Maintainability check: 2 minutes
- **Total**: ~20 minutes

---

## Domain-Specific Considerations

**Add your project-specific checks here:**

### Example: E-commerce Platform

- [ ] **PCI compliance**: Payment data handling complies with PCI DSS?
- [ ] **Inventory accuracy**: Stock counts remain accurate under concurrent orders?
- [ ] **Pricing integrity**: Prices cannot be manipulated by users?
- [ ] **Order atomicity**: Orders fully succeed or fully fail (no partial orders)?

### Example: Healthcare Application

- [ ] **HIPAA compliance**: Patient data handling complies with HIPAA?
- [ ] **Audit trail**: All data access logged for compliance?
- [ ] **Data retention**: Data retention policies enforced?
- [ ] **Emergency access**: Emergency access protocols work correctly?

### Example: Financial Application

- [ ] **Transaction integrity**: Transactions are atomic and consistent?
- [ ] **Audit logging**: All financial operations logged immutably?
- [ ] **Compliance**: Meets financial regulations (SOX, etc.)?
- [ ] **Fraud prevention**: Fraud detection mechanisms in place?

---

Use this checklist to be paranoid, adversarial, and thorough. Find the issues before users do. 🔍
