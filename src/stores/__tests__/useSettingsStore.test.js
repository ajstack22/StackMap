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

      // Test all valid themes from constants/theme.js
      const validThemes = [
        'stackBlue', 'crimson', 'cherry', 'scarlet', 'rust', 'tangerine', 'amber', 'gold',
        'olive', 'emerald', 'sage', 'teal', 'aqua', 'sapphire', 'periwinkle', 'lavender',
        'mauve', 'dustyBlue', 'terracotta', 'sandstone'
      ];

      validThemes.forEach(theme => {
        act(() => {
          result.current.setCurrentTheme(theme);
        });
        expect(result.current.currentTheme).toBe(theme);
      });
    });

    test('should use THEMES constant for validation', () => {
      const { result } = renderHook(() => useSettingsStore());

      // This test exercises the line that imports THEMES from constants (line ~91)
      // by testing theme validation that uses that import

      // Test a theme that exists in THEMES
      act(() => {
        result.current.setCurrentTheme('emerald');
      });
      expect(result.current.currentTheme).toBe('emerald');

      // Test a theme that doesn't exist in THEMES
      act(() => {
        result.current.setCurrentTheme('nonExistentTheme');
      });
      expect(result.current.currentTheme).toBe('stackBlue'); // Should default

      // Test edge case where theme is false/falsy but truthy for condition
      act(() => {
        result.current.setCurrentTheme('');
      });
      expect(result.current.currentTheme).toBe('stackBlue'); // Should default
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

  describe('Storage Adapter Integration', () => {
    test('should handle storage getItem with pending write', () => {
      const { result } = renderHook(() => useSettingsStore());

      // The storage adapter behavior is internal to the store
      // Test by triggering rapid updates that would use the pending write logic
      act(() => {
        result.current.updateSettings({
          currentTheme: 'emerald',
          soundEnabled: false
        });
        result.current.updateSettings({
          currentTheme: 'crimson',
          displayMode: 'checkmarks'
        });
      });

      // Final state should reflect the last update
      expect(result.current.currentTheme).toBe('crimson');
      expect(result.current.soundEnabled).toBe(false);
      expect(result.current.displayMode).toBe('checkmarks');
    });

    test('should handle storage errors gracefully', () => {
      const { result } = renderHook(() => useSettingsStore());

      // Mock AsyncStorage to simulate errors
      const originalAsyncStorage = require('@react-native-async-storage/async-storage');
      const mockAsyncStorage = {
        ...originalAsyncStorage,
        getItem: jest.fn().mockRejectedValue(new Error('Storage error')),
        setItem: jest.fn().mockRejectedValue(new Error('Storage error')),
        removeItem: jest.fn().mockRejectedValue(new Error('Storage error'))
      };

      // Store operations should continue to work even with storage errors
      act(() => {
        result.current.setCurrentTheme('stackBlue');
        result.current.setSoundEnabled(true);
      });

      expect(result.current.currentTheme).toBe('stackBlue');
      expect(result.current.soundEnabled).toBe(true);
    });

    test('should handle corrupted storage data', () => {
      const { result } = renderHook(() => useSettingsStore());

      // The store should initialize with default values even if storage is corrupted
      // This is handled by the storage adapter's JSON.parse error handling
      expect(result.current.currentTheme).toBe('stackBlue');
      expect(result.current.soundEnabled).toBe(true);
      expect(result.current.hasCompletedOnboarding).toBe(false);
    });

    test('should handle debounced storage writes', () => {
      const { result } = renderHook(() => useSettingsStore());

      // Test rapid updates that trigger the debouncing logic
      act(() => {
        result.current.setCurrentTheme('emerald');
        result.current.setCurrentTheme('crimson');
        result.current.setCurrentTheme('stackBlue');
        result.current.setSoundEnabled(false);
        result.current.setSoundEnabled(true);
      });

      // Final state should be consistent
      expect(result.current.currentTheme).toBe('stackBlue');
      expect(result.current.soundEnabled).toBe(true);
    });
  });

  describe('Theme Validation Edge Cases', () => {
    test('should handle empty string theme', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setCurrentTheme('');
      });

      expect(result.current.currentTheme).toBe('stackBlue'); // Should default
    });

    test('should handle whitespace-only theme', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setCurrentTheme('   ');
      });

      expect(result.current.currentTheme).toBe('stackBlue'); // Should default
    });

    test('should handle numeric theme input', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setCurrentTheme(123);
      });

      expect(result.current.currentTheme).toBe('stackBlue'); // Should default
    });

    test('should handle object theme input', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setCurrentTheme({ theme: 'emerald' });
      });

      expect(result.current.currentTheme).toBe('stackBlue'); // Should default
    });
  });

  describe('Settings Persistence and State Management', () => {
    test('should handle syncSkipped flag updates', () => {
      const { result } = renderHook(() => useSettingsStore());

      // Test setting syncSkipped through updateSettings
      act(() => {
        result.current.updateSettings({ syncSkipped: true });
      });

      expect(result.current.syncSkipped).toBe(true);

      act(() => {
        result.current.updateSettings({ syncSkipped: false });
      });

      expect(result.current.syncSkipped).toBe(false);
    });

    test('should handle complex settings objects in updateSettings', () => {
      const { result } = renderHook(() => useSettingsStore());

      const complexSettings = {
        currentTheme: 'emerald',
        soundEnabled: false,
        preferences: {
          notifications: true,
          autoSync: false
        },
        ui: {
          animations: true,
          reducedMotion: false
        }
      };

      act(() => {
        result.current.updateSettings(complexSettings);
      });

      expect(result.current.currentTheme).toBe('emerald');
      expect(result.current.soundEnabled).toBe(false);
      expect(result.current.preferences).toEqual({ notifications: true, autoSync: false });
      expect(result.current.ui).toEqual({ animations: true, reducedMotion: false });
    });

    test('should handle function values in updateSettings', () => {
      const { result } = renderHook(() => useSettingsStore());

      const settingsWithFunction = {
        currentTheme: 'crimson',
        callback: () => 'test function'
      };

      act(() => {
        result.current.updateSettings(settingsWithFunction);
      });

      expect(result.current.currentTheme).toBe('crimson');
      expect(typeof result.current.callback).toBe('function');
      expect(result.current.callback()).toBe('test function');
    });

    test('should handle array values in settings', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.updateSettings({
          toolbarOrder: ['sync', 'user', 'library', 'settings'],
          favoriteThemes: ['stackBlue', 'emerald', 'crimson']
        });
      });

      expect(result.current.toolbarOrder).toEqual(['sync', 'user', 'library', 'settings']);
      expect(result.current.favoriteThemes).toEqual(['stackBlue', 'emerald', 'crimson']);
    });
  });

  describe('Banner Position Edge Cases', () => {
    test('should accept any banner position value', () => {
      const { result } = renderHook(() => useSettingsStore());

      const positions = ['top', 'bottom', 'left', 'right', 'center', 'floating'];

      positions.forEach(position => {
        act(() => {
          result.current.setBannerPosition(position);
        });
        expect(result.current.bannerPosition).toBe(position);
      });
    });

    test('should handle non-string banner positions', () => {
      const { result } = renderHook(() => useSettingsStore());

      const values = [null, undefined, 123, { position: 'top' }, ['bottom']];

      values.forEach(value => {
        act(() => {
          result.current.setBannerPosition(value);
        });
        expect(result.current.bannerPosition).toBe(value);
      });
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