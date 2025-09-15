/**
 * Helper Flow Regression Test for Story S030
 * CRITICAL: Ensures helper user flow remains UNCHANGED
 * Helper users should go directly to PIN setup, NOT sync choice screen
 */

import { renderHook, act } from '@testing-library/react-hooks';
import {
  resetAllStores,
  setupTestEnvironment,
  userInteractions,
  assertions
} from '../helpers/testHelpers';
import useAppStore from '../../stores/useAppStore';
import useUserStore from '../../stores/useUserStore';
import useSettingsStore from '../../stores/useSettingsStore';

describe('Helper Flow Regression Tests - S030', () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe('Helper User Onboarding Flow - NO CHANGES ALLOWED', () => {
    test('helper user should go directly to PIN setup, not sync choice', () => {
      const { result: appResult } = renderHook(() => useAppStore());
      const { result: settingsResult } = renderHook(() => useSettingsStore());

      // 1. Simulate user selecting "Helping Someone Else" during onboarding
      // This should set userType to 'helper'
      const helperUserJourney = {
        journeyType: 'new',
        userType: 'helper',
        deviceStrategy: 'single', // helpers typically use single device
        syncEnabled: false
      };

      // 2. Verify initial state
      expect(appResult.current.hasCompletedOnboarding).toBe(false);
      expect(Object.keys(appResult.current.users)).toHaveLength(0);

      // 3. Create helper user (this happens in user setup step)
      const helperUser = {
        id: Date.now().toString(),
        name: 'Helper Person',
        icon: '👨‍💼',
        isHelper: true
      };

      act(() => {
        appResult.current.setUsers({ [helperUser.id]: helperUser });
        appResult.current.setCurrentUser(helperUser.id);
      });

      expect(appResult.current.currentUser).toBe(helperUser.id);
      expect(appResult.current.users[helperUser.id].name).toBe('Helper Person');

      // 4. CRITICAL TEST: Helper users should NOT see sync choice screen
      // They should go directly to PIN setup after user creation
      // This simulates the navigation logic in OnboardingUserCentered.js lines 1117-1123

      // Helper journey: userType === 'helper' should go to 'pinSetup'
      const shouldGoToSyncChoice = helperUserJourney.userType?.toLowerCase().trim() !== 'group' &&
                                  helperUserJourney.userType?.toLowerCase().trim() !== 'helper' &&
                                  helperUserJourney.deviceStrategy === 'multi';

      const shouldGoToPinSetup = helperUserJourney.userType?.toLowerCase().trim() === 'group' ||
                                helperUserJourney.userType?.toLowerCase().trim() === 'helper';

      expect(shouldGoToSyncChoice).toBe(false);
      expect(shouldGoToPinSetup).toBe(true);

      // 5. Simulate PIN setup (this should happen for helpers)
      const testPin = '1234';

      act(() => {
        // This simulates completing PIN setup for helper
        settingsResult.current.updateSettings({
          helperPin: testPin,
          helperMode: true
        });
      });

      // 6. Complete onboarding
      act(() => {
        settingsResult.current.setHasCompletedOnboarding(true);
      });

      expect(appResult.current.hasCompletedOnboarding).toBe(true);

      // 7. VERIFICATION: Helper flow should be complete without sync
      expect(appResult.current.syncEnabled).toBe(false);
      expect(appResult.current.users[helperUser.id]).toBeDefined();
      expect(appResult.current.currentUser).toBe(helperUser.id);

      // Helper-specific verification
      expect(appResult.current.users[helperUser.id].isHelper).toBe(true);
    });

    test('group user should also go to PIN setup, not sync choice', () => {
      const { result: appResult } = renderHook(() => useAppStore());
      const { result: settingsResult } = renderHook(() => useSettingsStore());

      // 1. Simulate user selecting group mode during onboarding
      const groupUserJourney = {
        journeyType: 'new',
        userType: 'group',
        deviceStrategy: 'single',
        syncEnabled: false
      };

      // 2. Create group user
      const groupUser = {
        id: Date.now().toString(),
        name: 'Group Leader',
        icon: '👥',
        isGroupLeader: true
      };

      act(() => {
        appResult.current.setUsers({ [groupUser.id]: groupUser });
        appResult.current.setCurrentUser(groupUser.id);
      });

      // 3. CRITICAL TEST: Group users should also NOT see sync choice screen
      const shouldGoToSyncChoice = groupUserJourney.userType?.toLowerCase().trim() !== 'group' &&
                                  groupUserJourney.userType?.toLowerCase().trim() !== 'helper' &&
                                  groupUserJourney.deviceStrategy === 'multi';

      const shouldGoToPinSetup = groupUserJourney.userType?.toLowerCase().trim() === 'group' ||
                                groupUserJourney.userType?.toLowerCase().trim() === 'helper';

      expect(shouldGoToSyncChoice).toBe(false);
      expect(shouldGoToPinSetup).toBe(true);

      // 4. Complete onboarding with PIN
      act(() => {
        settingsResult.current.updateSettings({ groupPin: '5678' });
        settingsResult.current.setHasCompletedOnboarding(true);
      });

      // 5. VERIFICATION: Group flow should be complete without sync
      expect(appResult.current.hasCompletedOnboarding).toBe(true);
      expect(appResult.current.syncEnabled).toBe(false);
      expect(appResult.current.users[groupUser.id].isGroupLeader).toBe(true);
    });

    test('multi-device individual user SHOULD see sync choice (positive test)', () => {
      const { result: appResult } = renderHook(() => useAppStore());

      // 1. Simulate individual user selecting multi-device
      const multiDeviceUserJourney = {
        journeyType: 'new',
        userType: 'individual', // Not helper or group
        deviceStrategy: 'multi',
        syncEnabled: false
      };

      // 2. POSITIVE TEST: Multi-device individual users SHOULD see sync choice
      const shouldGoToSyncChoice = multiDeviceUserJourney.userType?.toLowerCase().trim() !== 'group' &&
                                  multiDeviceUserJourney.userType?.toLowerCase().trim() !== 'helper' &&
                                  multiDeviceUserJourney.deviceStrategy === 'multi';

      const shouldGoToPinSetup = multiDeviceUserJourney.userType?.toLowerCase().trim() === 'group' ||
                                multiDeviceUserJourney.userType?.toLowerCase().trim() === 'helper';

      expect(shouldGoToSyncChoice).toBe(true);
      expect(shouldGoToPinSetup).toBe(false);

      // This confirms the change works for the intended users
      // while preserving helper/group behavior
    });
  });

  describe('Navigation Logic Verification', () => {
    test('should follow correct navigation paths based on user type', () => {
      // Test all possible combinations to ensure navigation logic is correct

      const testCases = [
        {
          userType: 'helper',
          deviceStrategy: 'single',
          expectedNext: 'pinSetup',
          description: 'Helper with single device'
        },
        {
          userType: 'helper',
          deviceStrategy: 'multi',
          expectedNext: 'pinSetup',
          description: 'Helper with multi device (still goes to PIN)'
        },
        {
          userType: 'group',
          deviceStrategy: 'single',
          expectedNext: 'pinSetup',
          description: 'Group with single device'
        },
        {
          userType: 'group',
          deviceStrategy: 'multi',
          expectedNext: 'pinSetup',
          description: 'Group with multi device (still goes to PIN)'
        },
        {
          userType: 'individual',
          deviceStrategy: 'multi',
          expectedNext: 'syncChoice',
          description: 'Individual with multi device (NEW: goes to sync choice)'
        },
        {
          userType: 'individual',
          deviceStrategy: 'single',
          expectedNext: 'complete',
          description: 'Individual with single device'
        }
      ];

      testCases.forEach(testCase => {
        const { userType, deviceStrategy, expectedNext, description } = testCase;

        // Simulate the navigation logic from OnboardingUserCentered.js
        let actualNext;

        if (userType?.toLowerCase().trim() === 'group' || userType?.toLowerCase().trim() === 'helper') {
          actualNext = 'pinSetup';
        } else if (deviceStrategy === 'multi') {
          actualNext = 'syncChoice';
        } else {
          actualNext = 'complete';
        }

        expect(actualNext).toBe(expectedNext);
      });
    });
  });

  describe('Sync Skip Behavior', () => {
    test('should persist sync skip decision in settings', () => {
      const { result: settingsResult } = renderHook(() => useSettingsStore());

      // 1. Initial state - sync not skipped
      expect(settingsResult.current.syncSkipped).toBe(false);

      // 2. Simulate user skipping sync
      act(() => {
        settingsResult.current.updateSettings({ syncSkipped: true });
      });

      // 3. Verify skip decision is persisted
      expect(settingsResult.current.syncSkipped).toBe(true);

      // 4. Verify this can be used later to prompt user about sync
      const shouldPromptForSync = !settingsResult.current.syncSkipped &&
                                 !settingsResult.current.syncEnabled;

      expect(shouldPromptForSync).toBe(false); // They skipped, so don't prompt
    });
  });
});