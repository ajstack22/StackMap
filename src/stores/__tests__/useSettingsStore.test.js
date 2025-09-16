/**
 * Comprehensive tests for useSettingsStore
 * Tests theme, display, and app settings functionality
 */

import { renderHook, act } from '@testing-library/react-hooks';
import useSettingsStore from '../useSettingsStore';

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useSettingsStore.setState({
      currentTheme: 'stackBlue',
      bannerPosition: 'top',
      soundEnabled: true,
      taskCelebration: 'rainbow',
      routineCelebration: 'rainbow',
      displayMode: 'numbers',
      dayMode: 'today',
      hasCompletedOnboarding: false,
      syncSkipped: false,
      toolbarOrder: null,
      moreButtonPosition: 'left'
    });
  });

  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const { result } = renderHook(() => useSettingsStore());

      expect(result.current.currentTheme).toBe('stackBlue');
      expect(result.current.bannerPosition).toBe('top');
      expect(result.current.soundEnabled).toBe(true);
      expect(result.current.taskCelebration).toBe('rainbow');
      expect(result.current.routineCelebration).toBe('rainbow');
      expect(result.current.displayMode).toBe('numbers');
      expect(result.current.dayMode).toBe('today');
      expect(result.current.hasCompletedOnboarding).toBe(false);
      expect(result.current.syncSkipped).toBe(false);
      expect(result.current.toolbarOrder).toBe(null);
      expect(result.current.moreButtonPosition).toBe('left');
    });
  });

  describe('Theme Settings', () => {
    test('should set current theme', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setCurrentTheme('emerald');
      });

      expect(result.current.currentTheme).toBe('emerald');
    });

    test('should handle invalid theme by defaulting to stackBlue', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setCurrentTheme('invalidTheme');
      });

      expect(result.current.currentTheme).toBe('stackBlue');
    });

    test('should handle null theme by defaulting to stackBlue', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setCurrentTheme(null);
      });

      expect(result.current.currentTheme).toBe('stackBlue');
    });

    test('should handle undefined theme by defaulting to stackBlue', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setCurrentTheme(undefined);
      });

      expect(result.current.currentTheme).toBe('stackBlue');
    });

    test('should accept valid theme names', () => {
      const { result } = renderHook(() => useSettingsStore());

      const validThemes = ['stackBlue', 'crimson', 'cherry', 'emerald', 'sapphire', 'sage', 'dustyBlue', 'terracotta'];

      validThemes.forEach(theme => {
        act(() => {
          result.current.setCurrentTheme(theme);
        });
        expect(result.current.currentTheme).toBe(theme);
      });
    });
  });

  describe('Display Settings', () => {
    test('should set banner position', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setBannerPosition('bottom');
      });

      expect(result.current.bannerPosition).toBe('bottom');
    });

    test('should set sound enabled', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setSoundEnabled(false);
      });

      expect(result.current.soundEnabled).toBe(false);

      act(() => {
        result.current.setSoundEnabled(true);
      });

      expect(result.current.soundEnabled).toBe(true);
    });

    test('should set task celebration mode', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setTaskCelebration('confetti');
      });

      expect(result.current.taskCelebration).toBe('confetti');
    });

    test('should set routine celebration mode', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setRoutineCelebration('stars');
      });

      expect(result.current.routineCelebration).toBe('stars');
    });

    test('should set display mode', () => {
      const { result } = renderHook(() => useSettingsStore());

      const displayModes = ['numbers', 'checkmarks', 'progress'];

      displayModes.forEach(mode => {
        act(() => {
          result.current.setDisplayMode(mode);
        });
        expect(result.current.displayMode).toBe(mode);
      });
    });

    test('should set day mode', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setDayMode('tomorrow');
      });

      expect(result.current.dayMode).toBe('tomorrow');

      act(() => {
        result.current.setDayMode('today');
      });

      expect(result.current.dayMode).toBe('today');
    });
  });

  describe('Onboarding and App State', () => {
    test('should set onboarding completion status', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setHasCompletedOnboarding(true);
      });

      expect(result.current.hasCompletedOnboarding).toBe(true);

      act(() => {
        result.current.setHasCompletedOnboarding(false);
      });

      expect(result.current.hasCompletedOnboarding).toBe(false);
    });

    test('should handle sync skip flag', () => {
      const { result } = renderHook(() => useSettingsStore());

      // Initial state
      expect(result.current.syncSkipped).toBe(false);

      // Can be set through updateSettings
      act(() => {
        result.current.updateSettings({ syncSkipped: true });
      });

      expect(result.current.syncSkipped).toBe(true);
    });
  });

  describe('Toolbar and UI Settings', () => {
    test('should set toolbar order', () => {
      const { result } = renderHook(() => useSettingsStore());

      const toolbarOrder = ['user', 'library', 'settings', 'sync'];

      act(() => {
        result.current.setToolbarOrder(toolbarOrder);
      });

      expect(result.current.toolbarOrder).toEqual(toolbarOrder);
    });

    test('should set more button position', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setMoreButtonPosition('right');
      });

      expect(result.current.moreButtonPosition).toBe('right');

      act(() => {
        result.current.setMoreButtonPosition('left');
      });

      expect(result.current.moreButtonPosition).toBe('left');
    });

    test('should handle null toolbar order', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setToolbarOrder(null);
      });

      expect(result.current.toolbarOrder).toBe(null);
    });
  });

  describe('Batch Settings Updates', () => {
    test('should handle batch settings updates', () => {
      const { result } = renderHook(() => useSettingsStore());

      const settingsUpdate = {
        currentTheme: 'stackPurple',
        soundEnabled: false,
        hasCompletedOnboarding: true,
        displayMode: 'checkmarks',
        taskCelebration: 'confetti'
      };

      act(() => {
        result.current.updateSettings(settingsUpdate);
      });

      expect(result.current.currentTheme).toBe('stackPurple');
      expect(result.current.soundEnabled).toBe(false);
      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.displayMode).toBe('checkmarks');
      expect(result.current.taskCelebration).toBe('confetti');
    });

    test('should handle partial batch updates', () => {
      const { result } = renderHook(() => useSettingsStore());

      // Set initial values
      act(() => {
        result.current.updateSettings({
          currentTheme: 'emerald',
          soundEnabled: true,
          displayMode: 'numbers'
        });
      });

      // Update only some fields
      act(() => {
        result.current.updateSettings({
          soundEnabled: false,
          displayMode: 'progress'
        });
      });

      expect(result.current.currentTheme).toBe('emerald'); // unchanged
      expect(result.current.soundEnabled).toBe(false); // changed
      expect(result.current.displayMode).toBe('progress'); // changed
    });

    test('should handle empty settings update', () => {
      const { result } = renderHook(() => useSettingsStore());

      const initialState = {
        currentTheme: result.current.currentTheme,
        soundEnabled: result.current.soundEnabled,
        displayMode: result.current.displayMode
      };

      act(() => {
        result.current.updateSettings({});
      });

      expect(result.current.currentTheme).toBe(initialState.currentTheme);
      expect(result.current.soundEnabled).toBe(initialState.soundEnabled);
      expect(result.current.displayMode).toBe(initialState.displayMode);
    });

    test('should handle nested object updates in updateSettings', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.updateSettings({
          currentTheme: 'stackRed',
          soundEnabled: false,
          meta: {
            version: '1.0',
            lastUpdated: Date.now()
          }
        });
      });

      expect(result.current.currentTheme).toBe('stackRed');
      expect(result.current.soundEnabled).toBe(false);
      expect(result.current.meta).toBeDefined();
      expect(result.current.meta.version).toBe('1.0');
    });
  });

  describe('Celebration Modes', () => {
    test('should handle different celebration modes', () => {
      const { result } = renderHook(() => useSettingsStore());

      const celebrationModes = ['rainbow', 'confetti', 'stars', 'none'];

      celebrationModes.forEach(mode => {
        act(() => {
          result.current.setTaskCelebration(mode);
        });
        expect(result.current.taskCelebration).toBe(mode);

        act(() => {
          result.current.setRoutineCelebration(mode);
        });
        expect(result.current.routineCelebration).toBe(mode);
      });
    });

    test('should handle independent task and routine celebrations', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setTaskCelebration('confetti');
        result.current.setRoutineCelebration('stars');
      });

      expect(result.current.taskCelebration).toBe('confetti');
      expect(result.current.routineCelebration).toBe('stars');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid values gracefully', () => {
      const { result } = renderHook(() => useSettingsStore());

      // These should not crash the store
      act(() => {
        result.current.setSoundEnabled(null);
        result.current.setDisplayMode(null);
        result.current.setBannerPosition(undefined);
      });

      // Store should accept whatever values are set (no validation for these fields)
      expect(result.current.soundEnabled).toBe(null);
      expect(result.current.displayMode).toBe(null);
      expect(result.current.bannerPosition).toBe(undefined);
    });

    test('should handle object spread in updateSettings', () => {
      const { result } = renderHook(() => useSettingsStore());

      const complexUpdate = {
        currentTheme: 'stackOrange',
        ...{ soundEnabled: false },
        ...(true && { displayMode: 'checkmarks' }),
        ...(false && { invalidField: 'should not appear' })
      };

      act(() => {
        result.current.updateSettings(complexUpdate);
      });

      expect(result.current.currentTheme).toBe('stackOrange');
      expect(result.current.soundEnabled).toBe(false);
      expect(result.current.displayMode).toBe('checkmarks');
      expect(result.current.invalidField).toBeUndefined();
    });

    test('should maintain state consistency during rapid updates', () => {
      const { result } = renderHook(() => useSettingsStore());

      // Simulate rapid theme changes
      act(() => {
        result.current.setCurrentTheme('emerald');
        result.current.setCurrentTheme('crimson');
        result.current.setCurrentTheme('stackBlue');
        result.current.setCurrentTheme('sapphire');
      });

      expect(result.current.currentTheme).toBe('sapphire');
    });

    test('should handle boolean-like values correctly', () => {
      const { result } = renderHook(() => useSettingsStore());

      // Test with various boolean-like values
      act(() => {
        result.current.updateSettings({
          soundEnabled: 0, // falsy
          hasCompletedOnboarding: 1, // truthy
          syncSkipped: '', // falsy
        });
      });

      expect(result.current.soundEnabled).toBe(0);
      expect(result.current.hasCompletedOnboarding).toBe(1);
      expect(result.current.syncSkipped).toBe('');
    });
  });

  describe('Store State Management', () => {
    test('should maintain state persistence structure', () => {
      const { result } = renderHook(() => useSettingsStore());

      // Update multiple settings
      act(() => {
        result.current.updateSettings({
          currentTheme: 'stackYellow',
          soundEnabled: false,
          displayMode: 'progress',
          hasCompletedOnboarding: true,
          toolbarOrder: ['library', 'user', 'settings'],
          moreButtonPosition: 'right'
        });
      });

      // Verify all settings are maintained
      expect(result.current.currentTheme).toBe('stackYellow');
      expect(result.current.soundEnabled).toBe(false);
      expect(result.current.displayMode).toBe('progress');
      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.toolbarOrder).toEqual(['library', 'user', 'settings']);
      expect(result.current.moreButtonPosition).toBe('right');
    });

    test('should handle concurrent access patterns', () => {
      const { result } = renderHook(() => useSettingsStore());

      // Simulate concurrent updates that might happen in real usage
      act(() => {
        result.current.setCurrentTheme('emerald');
        result.current.setSoundEnabled(false);
        result.current.updateSettings({
          displayMode: 'checkmarks',
          taskCelebration: 'confetti'
        });
        result.current.setHasCompletedOnboarding(true);
      });

      expect(result.current.currentTheme).toBe('emerald');
      expect(result.current.soundEnabled).toBe(false);
      expect(result.current.displayMode).toBe('checkmarks');
      expect(result.current.taskCelebration).toBe('confetti');
      expect(result.current.hasCompletedOnboarding).toBe(true);
    });
  });
});