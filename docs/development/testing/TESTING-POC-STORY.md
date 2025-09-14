# Testing POC Story: Automated Testing for Peer Review

## Story Title
**Implement Automated Testing Infrastructure for Code Quality Assurance**

## Story ID
`TECH-001`

## Priority
🔴 **Critical** - Prevents production issues and broken deployments

## Problem Statement
Currently, code changes are made without automated testing, leading to:
- Broken functionality discovered only after deployment
- Cascading failures from refactoring
- Time-consuming manual testing
- Inability to confidently make large changes
- Poor developer experience when working with AI assistants

## Success Criteria
- [ ] Jest and React Testing Library configured for React Native Web
- [ ] At least 5 critical components have comprehensive tests
- [ ] Pre-commit hook runs tests automatically
- [ ] Test coverage report generated
- [ ] CI/CD pipeline runs tests before deployment
- [ ] Documentation for writing new tests

## Technical Approach

### Phase 1: Infrastructure Setup
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react-native
npm install --save-dev @testing-library/jest-native
npm install --save-dev @testing-library/user-event
npm install --save-dev jest-environment-jsdom
npm install --save-dev @babel/preset-react
```

### Phase 2: Component Test Examples

#### 1. FAB Button Test
```javascript
// src/components/FAB/__tests__/FAB.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FAB from '../FAB';

describe('FAB Component', () => {
  it('renders with edit icon initially', () => {
    const { getByTestId } = render(
      <FAB
        icon="edit"
        onPress={jest.fn()}
        theme={{ primary: '#0095FF' }}
      />
    );

    expect(getByTestId('fab-icon')).toHaveTextContent('edit');
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <FAB
        icon="edit"
        onPress={onPress}
        theme={{ primary: '#0095FF' }}
      />
    );

    fireEvent.press(getByTestId('fab-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('changes icon when isEditMode changes', () => {
    const { getByTestId, rerender } = render(
      <FAB
        icon="edit"
        isEditMode={false}
        onPress={jest.fn()}
        theme={{ primary: '#0095FF' }}
      />
    );

    expect(getByTestId('fab-icon')).toHaveTextContent('edit');

    rerender(
      <FAB
        icon="close"
        isEditMode={true}
        onPress={jest.fn()}
        theme={{ primary: '#0095FF' }}
      />
    );

    expect(getByTestId('fab-icon')).toHaveTextContent('close');
  });
});
```

#### 2. Store Integration Test
```javascript
// src/stores/__tests__/integration.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import { useAppStore, useUserStore, useLibraryStore } from '../index';

describe('Store Integration', () => {
  beforeEach(() => {
    // Reset stores before each test
    useAppStore.setState({});
    useUserStore.setState({});
    useLibraryStore.setState({});
  });

  it('creates a user and sets as current', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setUsers({
        user1: {
          id: 'user1',
          name: 'Test User',
          icon: '👤',
          days: { today: { activities: [] } }
        }
      });
      result.current.setCurrentUser('user1');
    });

    expect(result.current.currentUser).toBe('user1');
    expect(result.current.users.user1.name).toBe('Test User');
  });

  it('adds activities to library', () => {
    const { result } = renderHook(() => useLibraryStore());

    act(() => {
      result.current.setLibrary({
        categories: [{
          id: 'morning',
          name: 'Morning',
          icon: '☀️',
          activities: [
            { id: '1', text: 'Brush Teeth', icon: '🪥' }
          ]
        }]
      });
    });

    expect(result.current.library.categories).toHaveLength(1);
    expect(result.current.library.categories[0].activities).toHaveLength(1);
  });
});
```

#### 3. Modal Controller Test
```javascript
// src/controllers/__tests__/ModalController.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import { useModalController } from '../ModalController';

describe('ModalController', () => {
  it('opens and closes modals correctly', () => {
    const { result } = renderHook(() => useModalController());

    expect(result.current.showPrivacyModal).toBe(false);

    act(() => {
      result.current.setShowPrivacyModal(true);
    });

    expect(result.current.showPrivacyModal).toBe(true);
    expect(result.current.getOpenModals()).toContain('privacy');

    act(() => {
      result.current.closeModal('privacy');
    });

    expect(result.current.showPrivacyModal).toBe(false);
  });

  it('prevents modal stacking', () => {
    const { result } = renderHook(() => useModalController());

    act(() => {
      result.current.openModal('privacy');
    });

    expect(result.current.showPrivacyModal).toBe(true);

    act(() => {
      result.current.openModal('support');
    });

    // First modal should be closed
    expect(result.current.showPrivacyModal).toBe(false);
    expect(result.current.showSupportModal).toBe(true);
  });
});
```

### Phase 3: Pre-commit Hook

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:pre-commit": "jest --bail --findRelatedTests"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:pre-commit"
    }
  }
}
```

### Phase 4: Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.svg': '<rootDir>/__mocks__/svgMock.js',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/index.js',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
```

## Implementation Plan

### Week 1: Setup & Infrastructure
- [ ] Install all testing dependencies
- [ ] Configure Jest for React Native Web
- [ ] Set up test helpers and mocks
- [ ] Create testing documentation

### Week 2: Critical Path Tests
- [ ] Test App.js initialization
- [ ] Test store integrations
- [ ] Test modal controller
- [ ] Test FAB component
- [ ] Test user creation flow

### Week 3: Coverage & Automation
- [ ] Add pre-commit hooks
- [ ] Set up GitHub Actions for CI
- [ ] Generate coverage reports
- [ ] Document testing patterns

## Acceptance Criteria
1. **Developer can run tests locally**
   ```bash
   npm test
   ```

2. **Tests run automatically on commit**
   ```bash
   git commit -m "feat: add new feature"
   # Tests run automatically
   ```

3. **Coverage report shows >60% coverage**
   ```bash
   npm run test:coverage
   ```

4. **New PR template includes test checklist**
   ```markdown
   ## PR Checklist
   - [ ] Tests written for new features
   - [ ] All tests passing
   - [ ] Coverage maintained above 60%
   ```

## Benefits
- **Confidence in changes**: Know immediately if something breaks
- **Faster development**: No need to manually test everything
- **Better AI collaboration**: AI can run tests to verify changes
- **Documentation**: Tests serve as living documentation
- **Regression prevention**: Old bugs don't come back

## Risks & Mitigation
| Risk | Mitigation |
|------|------------|
| Tests slow down development | Run only related tests in pre-commit |
| False positives | Regular test maintenance and review |
| Complex setup | Start with simple components first |

## Success Metrics
- 0 production bugs from refactoring
- 50% reduction in manual testing time
- 100% of PRs include tests
- <5 minute test suite execution time

## Next Steps
1. Review and approve this story
2. Create feature branch: `feat/testing-infrastructure`
3. Implement Phase 1 (Infrastructure)
4. Write first 3 component tests
5. Merge and iterate

---

**Story Points**: 13
**Sprint**: Next available
**Assignee**: Development Team
**Reviewer**: Tech Lead