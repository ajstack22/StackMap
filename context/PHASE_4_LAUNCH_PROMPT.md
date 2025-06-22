# Phase 4 Launch Prompt: Inline Fallback UI

## Context for Next Session

Use this prompt to resume development of Phase 4:

---

**PROMPT:**

I need to implement Phase 4: Inline Fallback UI for the Emergency Fallback system.

**Context:**
- Working in /refactor directory (mobile-first rebuild)
- Phases 1-3 complete: emergency-static.html, pre-boot detection, safe mode
- Phase 3 passed 4 rounds of adversarial review and is production-ready
- Need Phase 4: Runtime error detection and inline fallback UI

**Read First:**
1. `/context/DEVELOPER_CONTEXT.md` - Overall project context
2. `/context/PHASE_3_SUMMARY.md` - What we just completed
3. `/refactor/CLAUDE.md` - Updated with Phase 4 readiness

**Phase 4 Requirements:**
1. Detect runtime errors in critical components
2. Show inline fallback UI instead of crashing
3. Graceful degradation per component
4. User-friendly error messages
5. Recovery options without page reload
6. Integration with safe mode (?safe=true)

**Key Technical Challenges:**
- No React, so no ErrorBoundary component
- Must work with ES5 (Android 5 compatibility)
- Need to wrap critical functions safely
- Preserve user data during errors
- Clear communication to users

**Architecture Considerations:**
- Which components need error boundaries?
- How to detect and catch errors globally?
- What fallback UI to show for each component?
- How to integrate with existing safe mode?
- Should errors trigger safe mode automatically?

**Success Criteria:**
- Runtime errors don't crash the app
- Users see helpful fallback UI
- Core functionality remains accessible
- Errors are logged for debugging
- Recovery is possible without data loss

Please help implement Phase 4 with the same attention to stability and user needs as the previous phases.

---

## Additional Context for Developer

### Phase 4 Technical Approach

Consider implementing:
1. **Global error handler**: `window.onerror` and `window.addEventListener('unhandledrejection')`
2. **Try-catch wrapping**: For critical async operations
3. **Component status tracking**: Mark components as failed/degraded
4. **Fallback UI templates**: Pre-defined HTML for each component
5. **Error recovery actions**: Retry, reload component, activate safe mode

### Integration Points

1. **With Safe Mode**: 
   - Should multiple errors trigger safe mode?
   - Show "Switch to Simple Mode" in error UI?
   - Track error frequency in localStorage?

2. **With Emergency Static**:
   - Catastrophic errors redirect to emergency-static.html?
   - Pass error context via URL parameters?

3. **With Platform Detection**:
   - Different error handling per platform?
   - Mobile vs desktop error UI?

### User Experience Goals

1. **For ADHD Users**:
   - Don't lose their place or data
   - Clear, simple error messages
   - One-click recovery options
   - No cognitive overload

2. **For Autism Users**:
   - Predictable error handling
   - Consistent UI patterns
   - No sudden changes
   - Clear cause and effect

### Testing Scenarios

1. Throw errors in different components
2. Simulate network failures
3. Fill localStorage to quota
4. Corrupt component state
5. Test recovery flows

### Example Error Scenarios

1. **Task Save Fails**: Show inline "Save failed, retry?" with manual save button
2. **View Transition Fails**: Stay on current view, show toast notification
3. **Storage Quota Exceeded**: Offer to clear old data or use safe mode
4. **Network Error**: Show offline indicator, queue actions
5. **Component Render Fail**: Show simplified version or placeholder

Remember: A partially working app is better than a completely broken one. Every error should degrade gracefully while preserving user data and core functionality.