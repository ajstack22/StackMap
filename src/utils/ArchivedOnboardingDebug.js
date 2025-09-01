// ARCHIVED ONBOARDING DEBUG CODE
// Removed from OnboardingUserCentered.js on 2025-09-01
// This code was used for debugging sync issues during development
// Can be re-enabled if needed for future debugging

import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal } from 'react-native';

// Debug button component that was in renderWelcomeStep (lines 678-693)
export const DebugButton = ({ onPress, platform }) => (
  <TouchableOpacity
    style={{
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: '#ff6b6b',
      padding: 10,
      borderRadius: 5,
      zIndex: 1000,
    }}
    onPress={onPress}
  >
    <Text style={{ color: 'white', fontWeight: 'bold' }}>
      Debug ({platform})
    </Text>
  </TouchableOpacity>
);

// Debug button that was in renderUserTypeStep (lines 826-842) 
export const UserTypeDebugButton = ({ onPress, platform }) => (
  <TouchableOpacity
    style={{
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: '#ff6b6b',
      padding: 10,
      borderRadius: 5,
      zIndex: 1000,
    }}
    onPress={onPress}
  >
    <Text style={{ color: 'white', fontWeight: 'bold' }}>
      Debug ({platform})
    </Text>
  </TouchableOpacity>
);

// Sync Debugger Modal that was at lines 1382-1394
export const SyncDebuggerModal = ({ showSyncDebugger, setShowSyncDebugger }) => {
  if (!showSyncDebugger) return null;
  
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={showSyncDebugger}
      onRequestClose={() => setShowSyncDebugger(false)}
    >
      {(() => {
        const SyncDebugger = require('../components/SyncDebugger').default;
        return <SyncDebugger onClose={() => setShowSyncDebugger(false)} />;
      })()}
    </Modal>
  );
};

// State hook for managing debug modal visibility (line 86)
export const useDebugState = () => {
  const [showSyncDebugger, setShowSyncDebugger] = useState(false);
  return { showSyncDebugger, setShowSyncDebugger };
};

/* 
HOW TO RE-ENABLE DEBUG MODE:

1. Import the debug utilities at the top of OnboardingUserCentered.js:
   import { DebugButton, UserTypeDebugButton, SyncDebuggerModal, useDebugState } from '../../utils/ArchivedOnboardingDebug';

2. Add the debug state hook in the component:
   const { showSyncDebugger, setShowSyncDebugger } = useDebugState();

3. Add debug buttons where needed:
   - In renderWelcomeStep(): <DebugButton onPress={() => setShowSyncDebugger(true)} platform={Platform.OS} />
   - In renderUserTypeStep(): <UserTypeDebugButton onPress={() => setShowSyncDebugger(true)} platform={Platform.OS} />

4. Add the modal at the end of the main return statement (before closing KeyboardAvoidingView):
   <SyncDebuggerModal showSyncDebugger={showSyncDebugger} setShowSyncDebugger={setShowSyncDebugger} />

NOTE: The SyncDebugger and TestEncryption components have been removed from the codebase.
If you need to restore them, they can be recovered from git history at commit point
before this removal.
*/