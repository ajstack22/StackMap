# Customization Guide for Atlas Full Workflow

This guide explains what was removed from the StackMap-specific version and how to customize it for your project.

## What Was Removed (StackMap-Specific Elements)

### 1. State Management Patterns
**Removed:**
- `useAppStore.setState()` anti-pattern
- `useUserStore.getState().setUsers()` specific methods
- `useSettingsStore.getState().updateSettings()` patterns
- `useLibraryStore.getState().setLibrary()` patterns
- Store-specific update methods

**Generic Replacement:**
- Generic state management guidance
- "Use project-specific state update patterns"

**Customize for Your Project:**
```markdown
### Your State Management Rules:
- Redux: Always use action creators, never modify state directly
- MobX: Use observable actions, avoid direct property assignment
- Zustand: Use set() method with proper merging
- Context: Use reducer pattern for complex state
```

---

### 2. Field Naming Conventions
**Removed:**
- Activities use `text` (not `name` or `title`)
- Activities use `icon` (not `emoji`)
- Users use `icon` (not `emoji`)
- Fallback patterns: `activity.text || activity.name || activity.title`
- `dataNormalizer.js` references

**Generic Replacement:**
- Generic data schema design guidance
- Field naming consistency principles

**Customize for Your Project:**
```markdown
### Your Field Naming Rules:
- Dates: Always use ISO 8601 format, name fields `*At` (createdAt, updatedAt)
- IDs: Always use `id` not `_id` or `ID`
- Booleans: Prefix with `is*`, `has*`, `can*` (isActive, hasPermission)
- Arrays: Plural names (users, items, tags)
```

---

### 3. Platform-Specific Gotchas
**Removed:**
- Android FlexWrap cards use 48% widths
- Android font rendering (Typography component, no direct fontWeight)
- iOS AsyncStorage debouncing (20+ second freeze issue)
- iOS NetInfo.fetch() disabled (causes freezes)
- Web 3-column layouts use 31%/48%/100% widths
- Web Alert.alert not supported (use ConfirmModal)
- VectorIcons.web.js must use `<span>` not `<Text>`

**Generic Replacement:**
- Generic platform considerations
- "Add platform-specific checks for your stack"

**Customize for Your Project:**
```markdown
### Your Platform-Specific Rules:

**iOS:**
- Use native navigation (UINavigationController) for better performance
- Avoid large list renders (use virtualization)
- Test on iPhone SE (smallest screen) and iPad Pro (largest)

**Android:**
- Test on API 21 (min version) and API 34 (latest)
- Use Material Design 3 components
- Test with TalkBack screen reader

**Web:**
- Support Chrome, Firefox, Safari, Edge (last 2 versions)
- Use progressive enhancement
- Test with keyboard navigation
```

---

### 4. Design Rules
**Removed:**
- No gray text (all text must be #000)
- Typography component forced everywhere
- Comic Relief font specific rules

**Generic Replacement:**
- Generic accessibility guidelines
- High contrast requirements

**Customize for Your Project:**
```markdown
### Your Design Rules:
- Color contrast: WCAG AA minimum (4.5:1 for normal text)
- Typography: Use system fonts (San Francisco, Roboto, Segoe UI)
- Spacing: 4px grid system (4, 8, 12, 16, 24, 32, 48, 64)
- Breakpoints: Mobile (0-768px), Tablet (769-1024px), Desktop (1025px+)
```

---

### 5. Sync System
**Removed:**
- Last-write-wins with conflict resolution
- NaCl encryption with 100k iterations
- 32-character hexadecimal recovery phrase
- Sync ID generation (first 16 bytes of hash)
- Periodic sync (30-second interval)
- Queue system for offline changes
- Photo URLs synced (not files)

**Generic Replacement:**
- Generic data synchronization considerations
- Conflict resolution strategies

**Customize for Your Project:**
```markdown
### Your Sync Strategy:
- Real-time sync: Use WebSockets (Socket.io)
- Conflict resolution: Operational Transform (OT) or CRDT
- Offline support: IndexedDB with sync queue
- Encryption: AES-256 for sensitive data
```

---

### 6. Deployment Process
**Removed:**
- Four-tier deployment (QUAL → STAGE → BETA → PROD)
- `./scripts/deploy.sh` master script
- `PENDING_CHANGES.md` required before deployment
- API endpoints: stackmap.app/qual/api, /stage/api, /beta/api, /api
- iOS Bundle IDs (app.stackmap vs app.stackmap.qual)
- Android package names (com.stackmapnative)
- TestFlight groups for beta/stage/prod
- Qual uses qual-api DB, Stage shares Qual DB, Beta/Prod use prod-api DB

**Generic Replacement:**
- Generic staged rollout strategy
- Development → Staging → Production pattern
- Feature flags and gradual rollout

**Customize for Your Project:**
```markdown
### Your Deployment Process:

**Environments:**
- Dev: Automatic from main branch, dev.yourapp.com
- Staging: Manual trigger, staging.yourapp.com
- Production: Approval required, yourapp.com

**Feature Flags:**
- Use LaunchDarkly / Unleash / custom system
- Gradual rollout: 1% → 10% → 50% → 100%

**Deployment Commands:**
- Dev: `npm run deploy:dev`
- Staging: `npm run deploy:staging`
- Production: `npm run deploy:prod` (requires approval)
```

---

### 7. Anti-patterns in Quality Gates
**Removed from quality-gates.sh:**
- Check for `useAppStore.setState()` usage
- Check for `activity.name` / `activity.emoji` (should be `text` / `icon`)
- Check for direct `fontWeight` usage (should use Typography)
- Check for gray text colors (#666, etc.)
- PENDING_CHANGES.md validation

**Generic Replacement:**
- Generic anti-pattern framework
- Customization instructions in script comments

**Customize for Your Project:**
Add to `scripts/quality-gates.sh` Section 8:
```bash
# Check for deprecated API usage
print_info "Checking for deprecated API usage..."
if grep -r "oldApiFunction" src/ 2>/dev/null | grep -v "node_modules"; then
    print_warning "Found usage of deprecated API (migrate to newApiFunction)"
    ANTIPATTERN_FOUND=1
fi

# Check for synchronous file operations
print_info "Checking for synchronous file operations..."
if grep -r "readFileSync\|writeFileSync" src/ 2>/dev/null | grep -v "node_modules"; then
    print_warning "Found synchronous file operations (use async versions)"
    ANTIPATTERN_FOUND=1
fi
```

---

## Quick Customization Checklist

### SKILL.md Customization:
- [ ] Replace "Platform A/B/C" with your actual platforms (iOS/Android/Web, Windows/Mac/Linux, etc.)
- [ ] Add domain-specific examples (replace generic "Feature X" example)
- [ ] Update time allocations to match your team's pace
- [ ] Add project-specific architectural patterns
- [ ] Update deployment section to match your CI/CD process

### story-template.md Customization:
- [ ] Update platform sections to match your stack
- [ ] Add domain-specific success metrics (e.g., conversion rate, revenue impact)
- [ ] Add compliance requirements section (GDPR, HIPAA, PCI, SOX, etc.)
- [ ] Add stakeholder approval section format
- [ ] Update definition of done to match your process

### adversarial-checklist.md Customization:
- [ ] Add domain-specific security concerns (payment processing, health data, etc.)
- [ ] Add platform-specific performance thresholds
- [ ] Add your project's coding standards to maintainability section
- [ ] Add common vulnerabilities specific to your stack
- [ ] Update "Domain-Specific Considerations" section at end

### quality-gates.sh Customization:
- [ ] Update `COVERAGE_TARGET` and `COVERAGE_MIN_ACCEPTABLE` variables
- [ ] Update `BUNDLE_SIZE_WARNING` threshold
- [ ] Update `CHANGE_FILE` to your changelog location
- [ ] Verify npm script names match your package.json
- [ ] Add project-specific anti-pattern checks (Section 8)
- [ ] Add project-specific security checks (Section 9)
- [ ] Add build validation for your platforms

---

## Example: E-commerce Platform Customization

Here's how an e-commerce platform might customize the generic version:

### Added to adversarial-checklist.md:
```markdown
### E-commerce Specific Security

- [ ] **PCI DSS Compliance**: Payment card data handling complies with PCI DSS?
- [ ] **Cart manipulation prevention**: Cart totals calculated server-side?
- [ ] **Inventory race conditions**: Concurrent orders don't oversell inventory?
- [ ] **Pricing integrity**: Prices cannot be manipulated by client?
- [ ] **Order atomicity**: Orders fully succeed or fully fail (no partial fulfillment)?
```

### Added to quality-gates.sh:
```bash
# Check for client-side price calculations
print_info "Checking for client-side price calculations..."
if grep -r "calculatePrice\|calculateTotal" src/client 2>/dev/null | grep -v "node_modules"; then
    print_status 1 "Found client-side price calculations (must be server-side)"
    ANTIPATTERN_FOUND=1
fi

# Check for direct inventory modifications
print_info "Checking for direct inventory modifications..."
if grep -r "inventory\s*=" src/ 2>/dev/null | grep -v "node_modules" | grep -v "test"; then
    print_warning "Found direct inventory modifications (use transaction system)"
    ANTIPATTERN_FOUND=1
fi
```

---

## Example: Healthcare Application Customization

Here's how a healthcare application might customize the generic version:

### Added to adversarial-checklist.md:
```markdown
### Healthcare Specific Security (HIPAA)

- [ ] **PHI encryption**: Protected Health Information encrypted at rest and in transit?
- [ ] **Audit trail**: All PHI access logged immutably?
- [ ] **Access controls**: Role-based access control (RBAC) enforced?
- [ ] **Data retention**: Data retention policies enforced?
- [ ] **Emergency access**: Break-glass emergency access protocols work?
- [ ] **Patient consent**: Consent recorded and enforced for data sharing?
```

### Added to story-template.md:
```markdown
## Compliance Requirements

### HIPAA Compliance:
- [ ] PHI encrypted at rest (AES-256)
- [ ] PHI encrypted in transit (TLS 1.2+)
- [ ] Audit logging implemented for all PHI access
- [ ] Business Associate Agreement (BAA) in place for third-party services
- [ ] Patient consent mechanism implemented

### FDA Compliance (if medical device):
- [ ] IEC 62304 software lifecycle processes followed
- [ ] Risk management (ISO 14971) documented
- [ ] Design controls (21 CFR 820.30) maintained
```

---

## Support and Feedback

This generic version is designed to be a starting point. As you customize it:
1. Keep what works for your domain
2. Remove what doesn't apply
3. Add domain-specific checks and examples
4. Share improvements that could benefit the generic version

---

**Remember**: The goal is to make this workflow YOUR workflow, adapted to your domain, stack, and team culture.
