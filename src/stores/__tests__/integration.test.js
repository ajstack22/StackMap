import { renderHook, act } from '@testing-library/react-hooks';
import useAppStore from '../useAppStore';
import useUserStore from '../useUserStore';
import useLibraryStore from '../useLibraryStore';
import useSettingsStore from '../useSettingsStore';

describe('Store Integration', () => {
  beforeEach(() => {
    // Reset stores before each test - clear their state properly
    useUserStore.setState({ users: {}, currentUser: null, currentDay: 'today' });
    useLibraryStore.setState({ library: { categories: [], userActivityIds: [] } });
    useSettingsStore.setState({ currentTheme: 'stackBlue' });
  });

  describe('User Store', () => {
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
      expect(result.current.users.user1.icon).toBe('👤');
    });

    it('updates user data', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setUsers({
          user1: {
            id: 'user1',
            name: 'Initial Name',
            icon: '👤',
            days: {}
          }
        });
      });

      act(() => {
        result.current.updateUser('user1', {
          name: 'Updated Name',
          icon: '🎯'
        });
      });

      expect(result.current.users.user1.name).toBe('Updated Name');
      expect(result.current.users.user1.icon).toBe('🎯');
    });
  });

  describe('Library Store', () => {
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
      expect(result.current.library.categories[0].activities[0].text).toBe('Brush Teeth');
    });

    it('manages library structure', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Test that library can be set and retrieved
      act(() => {
        result.current.setLibrary({
          categories: [
            { id: 'test', name: 'Test', icon: '🧪', activities: [] }
          ],
          userActivityIds: ['custom1', 'custom2']
        });
      });

      expect(result.current.library.categories).toHaveLength(1);
      expect(result.current.library.categories[0].name).toBe('Test');
      expect(result.current.library.userActivityIds).toHaveLength(2);
    });
  });

  describe('Settings Store', () => {
    it('has correct default settings', () => {
      const { result } = renderHook(() => useSettingsStore());

      // Just verify defaults work
      expect(result.current.currentTheme).toBe('stackBlue');
      expect(result.current.soundEnabled).toBe(true);
      expect(result.current.hasCompletedOnboarding).toBe(false);
    });

    it('tracks onboarding completion', () => {
      const { result } = renderHook(() => useSettingsStore());

      expect(result.current.hasCompletedOnboarding).toBeFalsy();

      act(() => {
        result.current.setHasCompletedOnboarding(true);
      });

      expect(result.current.hasCompletedOnboarding).toBe(true);
    });
  });

  describe('AppStore Wrapper', () => {
    it('provides access to all sub-stores', () => {
      const { result } = renderHook(() => useAppStore());

      // Test that we can access state from all stores
      expect(result.current.users).toBeDefined();
      expect(result.current.currentUser).toBeDefined();
      expect(result.current.library).toBeDefined();
      expect(result.current.currentTheme).toBeDefined();
      expect(result.current.syncEnabled).toBeDefined();
    });

    it('delegates methods to sub-stores correctly', () => {
      const { result } = renderHook(() => useAppStore());

      // Test that setUsers delegates to userStore
      act(() => {
        result.current.setUsers({
          testUser: {
            id: 'testUser',
            name: 'Test',
            icon: '🧪'
          }
        });
      });

      // Verify the delegation worked by checking userStore
      const { result: userResult } = renderHook(() => useUserStore());
      expect(userResult.current.users.testUser).toBeDefined();
      expect(userResult.current.users.testUser.name).toBe('Test');
    });
  });
});