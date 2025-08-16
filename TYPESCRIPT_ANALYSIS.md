# TypeScript Error Analysis & Resolution Plan

## Current Status
- **Total TypeScript Errors**: 294 (all in JavaScript files with @ts-check)
- **Lint Warnings**: 454
- **Build Status**: ✅ Successful (errors don't block build)

## TypeScript Error Breakdown

### Error Categories
| Error Code | Count | Description | Severity |
|------------|-------|-------------|----------|
| TS2322 | 212 | Type assignment mismatch | Medium |
| TS2339 | 24 | Property doesn't exist | High |
| TS2345 | 20 | Argument type mismatch | Medium |
| TS2739 | 15 | Missing required properties | High |
| TS2741 | 12 | Missing required property | High |
| TS2769 | 3 | No overload matches | Medium |
| TS2740 | 3 | Type missing index signature | Low |
| TS2349 | 3 | Type has no call signatures | High |
| TS2554 | 1 | Wrong number of arguments | High |
| TS2552 | 1 | Cannot find name (typo) | High |

## Critical Issues to Fix First

### 1. Custom Text Component Props (212 errors - TS2322)
**Problem**: The custom `Text` component from `./src/components/Typography` doesn't properly forward React Native Text props.

**Solution**:
```javascript
// Add proper prop forwarding in Typography/index.js
/**
 * @typedef {import('react-native').TextProps} TextProps
 * @param {TextProps & {children?: React.ReactNode}} props
 */
export const Text = React.forwardRef((props, ref) => {
  // existing implementation
});
```

### 2. Missing Properties on Functions (24 errors - TS2339)
**Problem**: Functions being used as objects with properties (e.g., `updateAutoUpdateShares.timeout`)

**Solution**:
```javascript
// Use a ref or state instead of function properties
const updateSharesTimeoutRef = useRef(null);
// Then use: updateSharesTimeoutRef.current instead of updateAutoUpdateShares.timeout
```

### 3. Modal Component Props (15 errors - TS2739)
**Problem**: Modal components missing required props in their interfaces

**Solution**: Add proper prop type definitions for each modal component

## Resolution Priority

### Phase 1: Critical Fixes (Block functionality)
1. Fix Text component type forwarding - **Impact: 212 errors**
2. Fix function property access patterns - **Impact: 24 errors**
3. Fix file input event types - **Impact: Web functionality**

### Phase 2: Type Safety Improvements
1. Add JSDoc type annotations to all component props
2. Fix modal component prop interfaces
3. Correct Alert.alert usage on web platform

### Phase 3: Code Quality
1. Fix argument type mismatches in function calls
2. Add proper event handler types
3. Resolve overload matching issues

## Quick Wins (Can fix immediately)

### 1. File Input Event Type (Line 2125)
```javascript
// Before
const file = e.target.files[0];

// After
const file = /** @type {HTMLInputElement} */(e.target).files?.[0];
```

### 2. parseInt Type Mismatch (Line 1681)
```javascript
// Before
const dayIndex = parseInt(targetDay);

// After
const dayIndex = parseInt(targetDay, 10);
```

### 3. Alert.alert Style Property
```javascript
// Before
Alert.alert('Title', 'Message', [
  { text: 'OK', style: 'default', onPress: () => {} }
]);

// After
Alert.alert('Title', 'Message', [
  { text: 'OK', onPress: () => {} } // Remove style for web
]);
```

## Lint Warning Categories

### Complexity Warnings (149 total)
- `max-lines`: 94 - Files exceeding 1000 lines
- `complexity`: 55 - Functions with cyclomatic complexity > 20

### Code Quality (305 total)
- `no-unused-vars`: 111 - Unused variables
- `react/prop-types`: 88 - Missing prop type validation
- `no-shadow`: 42 - Variable shadowing
- Other React/hooks warnings: 64

## Recommended Action Plan

### Immediate (Fix errors blocking functionality)
1. ✅ Fix TypeScript errors in service files (COMPLETED)
2. Add type annotations to App.js critical functions
3. Fix Text component prop forwarding

### Short-term (1-2 days)
1. Add JSDoc annotations to all components
2. Fix modal prop interfaces
3. Resolve file input and event handler types

### Medium-term (3-5 days)
1. Split App.js into smaller modules (< 1000 lines each)
2. Add prop-types or convert components to TypeScript
3. Refactor complex functions (complexity > 20)

### Long-term (Ongoing)
1. Gradually migrate components to TypeScript
2. Implement strict type checking
3. Add comprehensive type tests

## Migration Strategy

### Current Approach
- Using `@ts-check` in JavaScript files for gradual adoption
- TypeScript for all service files
- JavaScript for components (intentional decision)

### Recommended Next Steps
1. Create `.d.ts` files for complex components
2. Add JSDoc type annotations systematically
3. Consider TypeScript for new components only

## Tools & Commands

```bash
# Check TypeScript errors
npm run typecheck

# Check lint warnings
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Check specific file
npx tsc --noEmit App.js
```

## Success Metrics
- [ ] 0 TypeScript errors in critical paths
- [ ] < 100 TypeScript errors total
- [ ] < 200 lint warnings
- [ ] All modals properly typed
- [ ] Build passes without errors