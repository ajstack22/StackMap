# Team Agreements & Best Practices - StackMap Development Framework

## Purpose
This document synthesizes best practices from all development roles into unified team agreements. These principles have proven successful for the StackMap team and serve as a blueprint for high-quality, cross-platform React Native development.

## Core Development Principles

### 1. Quality Over Speed
- **No shortcuts on data integrity** - Data loss is unacceptable
- **Performance requirements are non-negotiable** - < 100ms UI response, 60 FPS scrolling
- **All platforms must work** - No partial implementations
- **Requirements are binary** - 100% complete or not done

### 2. Evidence-Based Development
- **Document everything** - Screenshots, command outputs, performance metrics
- **Test on all platforms** - Web (Chrome, Safari, Firefox), iOS, Android
- **Measure performance impact** - Bundle size, load time, memory usage
- **Verify independently** - Don't trust, verify

### 3. Incremental Progress
- **Small, logical commits** - Easy to review and revert
- **Test after each change** - Catch issues early
- **Complete current task before starting new** - No partial work
- **Fix as you go** - Don't accumulate technical debt

## Development Workflow Standards

### Before Starting Work
```bash
# Clean environment checklist
git status                    # Must be clean
git pull origin main          # Latest code
npm ci                        # Fresh dependencies
npm run lint                  # Baseline passes
npm run typecheck            # No type errors
npm run build:web            # Build succeeds

# Component usage verification (before modifying)
grep -r "ComponentName" src/ --include="*.js" | grep import
grep -r "<ComponentName" src/ --include="*.js"
```

### During Development
```bash
# Continuous validation
npm run lint                 # After each file change
npm run typecheck           # Before commits
git commit -m "feat: ..."   # Logical chunks

# Automated validation thresholds
grep -r "console\." src/ | wc -l    # Max 5 allowed
grep -r "TODO\|FIXME" src/ | wc -l  # Max 20 allowed
```

### Before Submitting for Review
- [ ] All requirements implemented with evidence
- [ ] Verification commands pass
- [ ] No console.log statements (max 5 with NODE_ENV check)
- [ ] TODO/FIXME count under threshold (max 20)
- [ ] Performance maintained/improved
- [ ] All platforms tested
- [ ] PENDING_CHANGES.md updated

## Code Quality Standards

### Follow Existing Patterns
```javascript
// Component structure
const MyComponent = ({ prop1, prop2 }) => {
  // 1. State declarations
  const [state, setState] = useState(null);

  // 2. Store hooks
  const { data, updateData } = useAppStore();

  // 3. Callbacks
  const handlePress = useCallback(() => {
    // Implementation
  }, [dependency]);

  // 4. Render
  return <View>...</View>;
};
```

### Platform-Specific Handling
```javascript
// Use Platform.select, never .native.js or .web.js files
const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: { paddingTop: 20 },
      android: { paddingTop: 0 },
      web: { paddingTop: 10 }
    })
  }
});
```

### Field Naming Consistency
```javascript
// Activities MUST use:
activity.text  // NOT activity.name or activity.title
activity.icon  // NOT activity.emoji

// Always include fallbacks:
const text = activity.text || activity.name || activity.title;
const icon = activity.icon || activity.emoji;
```

### Production-Safe Console Patterns
```javascript
// ✅ CORRECT - Development only
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
  console.error('Debug error:', error);
}

// ❌ WRONG - Exposed in production
console.log('Data:', data);
console.error('Error:', error);
```

### Store Update Patterns
```javascript
// NEVER use setState directly
// BAD:
useAppStore.setState({ users: newUsers });

// GOOD - Use store-specific methods:
useUserStore.getState().setUsers(newUsers);
useSettingsStore.getState().updateSettings(settings);
```

## Testing & Review Standards

### Adversarial Testing Mindset
- **Assume everything is broken** until proven otherwise
- **Try to break it** - Edge cases, empty data, massive data
- **Test hostile scenarios** - Rapid clicks, offline mode, memory pressure
- **Verify all claims** - Run commands yourself, test independently

### Platform Testing Matrix
| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| Core Functionality | Real device preferred | Emulator + Device | All browsers |
| Performance | Instruments profiling | Studio Profiler | DevTools |
| Edge Cases | AsyncStorage freezes | FlexWrap rendering | Alert polyfills |

### Evidence Requirements
```markdown
## Implementation Report
### Requirements Completed
✅ Requirement 1: [What was done]
   Evidence: [Screenshot/Output]
   Command: `npm run test:feature`

### Performance Impact
- Bundle size: 2.3MB → 2.3MB (no change)
- Load time: 3.2s → 3.1s (improved)

### Platform Results
- Chrome: ✅ No issues
- iOS: ✅ iPhone 14 simulator tested
- Android: ✅ Pixel 6 emulator tested
```

## Platform-Specific Guidelines

### Android Requirements
```javascript
// FlexWrap MUST use percentage widths
style={{ width: '48%' }}  // NOT calculateCardWidth()

// Fonts MUST use variants, not fontWeight
fontFamily: bold ? 'ComicRelief-Bold' : 'ComicRelief'
```

### iOS Considerations
```javascript
// AsyncStorage has 5-second debounce for performance
// NetInfo.fetch() disabled - assumes online
// Modal constraints require specific flex rules
```

### Web Specifics
```javascript
// VectorIcons must use <span> not <Text>
// Alert.alert not supported - use ConfirmModal
// Build files go in root for qual, not web/build/
```

## Performance Standards

### Platform-Specific Targets
- **iOS Cold Start**: < 800ms
- **Android Cold Start**: < 1000ms
- **Web Lighthouse Score**: > 90
- **Web First Contentful Paint**: < 1.5s

### General Benchmarks (All Platforms)
- **Bundle size**: < 50MB (web < 5MB)
- **Initial load**: < 3 seconds
- **Scrolling**: 60 FPS minimum
- **UI response**: < 100ms
- **Memory usage**: < 200MB

### Performance Testing
```bash
# Bundle size check
ls -lh web/build/static/js/*.js

# Load time measurement
# Use Lighthouse for web
# Use Instruments for iOS
# Use Profiler for Android

# Memory profiling
# Chrome DevTools for web
# Platform-specific tools for mobile
```

## Conflict Resolution Process

### Developer vs Reviewer Disputes
1. **Requirements unclear** → PM clarifies, updates story
2. **"Good enough" debate** → Requirements are binary
3. **Platform limitations** → Find workaround or document
4. **"Fix later" promises** → Current story must be complete

### Escalation Triggers
- 3+ review cycles without approval
- Security concerns identified
- Architecture disputes
- Performance requirements impossible
- Data integrity questions

### Decision Framework
```
Performance vs Features:
< 10% hit → Accept for critical features
10-20% hit → Feature must be essential
> 20% hit → Reject or optimize first

Quality vs Speed:
Quality always wins
No data integrity compromises
No known data loss bugs to production
```

## Sprint & Priority Management

### Priority Levels
- **P0 Critical**: System down, data loss, security (< 24h fix)
- **P1 High**: Major impact, key features broken (< 1 week)
- **P2 Medium**: QoL improvements, tech debt (< 1 month)
- **P3 Low**: Nice-to-have, optimizations (as capacity)

### Story Sizing
- **S (< 1 day)**: Simple fixes, config changes
- **M (1-3 days)**: Single component changes
- **L (3-5 days)**: Multi-component features
- **XL (1-2 weeks)**: Architecture changes

## Deployment Standards

### Pre-deployment Checklist
```bash
# Update documentation
vi PENDING_CHANGES.md

# Run verification
npm run lint
npm run typecheck
npm test

# Automated enforcement checks
grep -r "console\." src/ | grep -v "NODE_ENV" | wc -l  # Must be 0
grep -r "TODO\|FIXME" src/ | wc -l                     # Max 20
find src -name "*.native.js" -o -name "*.web.js"      # Must be empty

# Deploy to staging first
./scripts/qual_deploy.sh

# Full production deploy
./scripts/prod_deploy.sh all
```

### Enhanced Deployment Script Should Enforce
1. Git status clean
2. Lint passes
3. TypeScript check passes
4. Console.log count ≤ 5 (with NODE_ENV check)
5. TODO/FIXME count ≤ 20
6. No secrets exposed
7. Tests pass
8. Create rollback point (git tag)
9. Deploy to server
10. Verify deployment

### Go/No-Go Criteria
**Must Have (No-Go if missing):**
- All P0 issues resolved
- No data loss bugs
- Performance requirements met
- All platforms tested
- Rollback plan ready

## Communication Protocols

### Daily Practices
- Review backlog status
- Check for blockers
- Update todo lists proactively
- Document decisions

### Code Review Comments
- Be specific about issues
- Provide reproduction steps
- Include evidence (screenshots, logs)
- Suggest solutions when possible

### Documentation Updates
- Update CLAUDE.md for permanent gotchas
- Document workarounds
- Keep troubleshooting guide current
- Share learnings with team

## Success Metrics

### Individual Performance
- **First-time approval rate**: Target > 30% (challenging but achievable)
- **Evidence completeness**: 100% requirements with proof
- **Platform coverage**: All platforms tested every time
- **Regression rate**: Zero regressions to production

### Team Performance
- **Velocity**: Consistent story points per sprint
- **Bug discovery**: Found in review, not production
- **Tech debt ratio**: < 20% of capacity
- **Performance maintenance**: No degradation over time

## Common Pitfalls to Avoid

### Development Mistakes
1. **Scope creep** - Stick to requirements exactly
2. **Console statements** - Remove ALL before review
3. **Platform assumptions** - Test don't assume
4. **Missing fallbacks** - Always handle edge cases

### Review Mistakes
1. **Being too nice** - Find problems, that's the job
2. **Trusting claims** - Verify everything independently
3. **Quick approvals** - Thorough beats fast
4. **Accepting promises** - "Will fix later" = rejection

### Architecture Mistakes
1. **Platform-specific files** - Use Platform.select instead
2. **Direct state updates** - Use store methods
3. **Sync breaking changes** - Test data flow completely
4. **Performance regression** - Measure before and after

## Debugging Patterns

### Component Discovery Pattern
When changes don't take effect:
```bash
1. Clear cache: rm -rf node_modules/.cache/
2. Trace imports: grep -n "ComponentName" src/App.js
3. Check Platform.OS conditionals in code
4. Look for duplicate/override components
5. Verify correct component is being imported
```

### Dead Code Detection Script
```bash
# Find potentially unused files
for file in $(find src -name "*.js"); do
  basename=$(basename $file .js)
  usage=$(grep -r "$basename" src/ --include="*.js" | grep -v "^$file:" | wc -l)
  [ $usage -eq 0 ] && echo "POSSIBLY DEAD: $file"
done
```

### True Centralization Principle
**"Centralization means elimination, not addition"**
```bash
1. Audit what exists
2. Pick ONE winner
3. Migrate everything to it
4. DELETE alternatives immediately
5. Verify: grep -r "OldComponent" src/ | wc -l  # Must be 0
```

## Tools & Resources

### Quick Reference Commands
```bash
# Development
npm run start                           # Web development
npx react-native start                  # Mobile development
npx react-native run-ios               # iOS simulator
npx react-native run-android           # Android emulator

# Validation
npm run lint                           # Code style
npm run typecheck                      # TypeScript
npm test                               # Unit tests
grep -r "console\." src/ | wc -l       # Console count (max 5)
grep -r "TODO\|FIXME" src/ | wc -l     # Tech debt count (max 20)

# Debugging
rm -rf node_modules/.cache/            # Clear webpack cache
grep -n "Component" src/App.js         # Trace imports
git diff HEAD~1                        # Check recent changes

# Deployment
./scripts/qual_deploy.sh               # Staging
./scripts/prod_deploy.sh all           # Production (all platforms)
./scripts/prod_deploy.sh web           # Production (web only)

# Emergency
npm run build:web --max-old-space-size=8192  # Memory issues
pkill -f node                                 # Kill all Node processes
```

### Essential Commands
```bash
# Development
npm run start              # Web development
npx react-native start     # Mobile development

# Validation
npm run lint              # Code style
npm run typecheck         # TypeScript
npm test                  # Unit tests

# Deployment
./scripts/qual_deploy.sh   # Staging
./scripts/prod_deploy.sh   # Production
```

### Key Documentation
- `/CLAUDE.md` - Project conventions
- `/docs/deployment/` - Deployment guides
- `/docs/platform/` - Platform-specific docs
- `/TROUBLESHOOTING.md` - Common issues

## Emergency Procedures

### P0 Response Protocol
1. **Assess** - Scope and impact
2. **Stop** - All current work
3. **Fix** - Minimal change required
4. **Test** - All platforms
5. **Deploy** - Immediately
6. **Monitor** - 24 hours minimum
7. **Post-mortem** - Document learnings

### Data Loss Response
1. **STOP all writes immediately**
2. Backup current state
3. Identify corruption scope
4. Restore from backups
5. Validate integrity
6. Implement prevention
7. Full incident report

## Continuous Improvement

### Learning from Failures Framework
- **Every production bug** → New validation check in deployment script
- **Every confused review** → Better documentation in CLAUDE.md
- **Every deployment failure** → Script improvement
- **Every performance issue** → New metric to monitor
- **Every data loss** → Prevention mechanism + post-mortem

### Post-Mortem Template
```markdown
## Incident: [Title]
Date: [YYYY-MM-DD]
Severity: P0/P1/P2

### Timeline
- [HH:MM] Issue detected
- [HH:MM] Root cause identified
- [HH:MM] Fix deployed
- [HH:MM] Verified resolved

### Root Cause
[What actually went wrong]

### Impact
- Users affected: [number]
- Data loss: [yes/no]
- Duration: [time]

### Lessons Learned
1. [What we learned]
2. [Process improvements]

### Action Items
- [ ] Update validation checks
- [ ] Add monitoring
- [ ] Document in CLAUDE.md
```

### Learning from Reviews
- Document rejection patterns
- Update personal checklists
- Share discoveries with team
- Improve testing strategies

### Skills Development Priority
1. React Native platform differences
2. Performance profiling techniques
3. Security best practices
4. Testing methodologies
5. StackMap architecture understanding

## Team Values

### What We Stand For
- **Data integrity** above all else
- **User experience** drives decisions
- **Quality** over velocity
- **Evidence** over assumptions
- **Collaboration** with constructive conflict
- **Learning** from every mistake

### Our Commitment
We commit to building software that:
- Works reliably on all platforms
- Performs excellently
- Protects user data
- Improves continuously
- Sets the standard for quality

### Core Principles (from Manylla learnings)
- **Verification Over Assumption** - Measure, don't guess
- **Elimination Over Addition** - True centralization removes alternatives
- **Prevention Over Correction** - Catch issues before production
- **Clarity Over Cleverness** - Simple, maintainable solutions

---

## Summary

These agreements represent hard-won lessons from building and maintaining StackMap. They prioritize quality, evidence, and cross-platform excellence. By following these practices, teams can achieve:

- **30% first-time approval rate** (high quality from start)
- **Zero production regressions** (catch issues early)
- **Consistent performance** (no degradation over time)
- **Platform parity** (truly cross-platform)
- **Sustainable velocity** (quality enables speed)

The key is discipline: follow the process, demand evidence, test adversarially, and never compromise on core principles. Quality isn't negotiable - it's the foundation of everything we build.

---
*Team Agreements v2.0 - StackMap Development Framework*
*Synthesized from all role best practices + Manylla learnings*
*Last Updated: 2025-01-16*