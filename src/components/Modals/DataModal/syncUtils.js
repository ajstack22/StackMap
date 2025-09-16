// @ts-check
import { Platform, Alert } from 'react-native';
import syncService from '../../../services/sync';

/**
 * Utility functions for sync operations
 */

/**
 * Handle sync enable - creates new sync
 */
export const handleEnableSync = async ({
  setSyncLoading,
  setSyncError,
  onSyncStateUpdate,
  onSyncStatusChange,
  showToast
}) => {
  setSyncLoading(true);
  setSyncError('');

  setTimeout(async () => {
    try {
      // Use create() for "Create New Sync" button
      const result = await syncService.create();

      // Capture the frozen values to prevent modification
      const finalSyncId = result.syncId;
      const finalRecoveryPhrase = result.recoveryPhrase;

      // Update parent state through callback
      onSyncStateUpdate({
        syncEnabled: true,
        syncId: finalSyncId,
        syncRecoveryPhrase: finalRecoveryPhrase
      });

      if (onSyncStatusChange) {
        onSyncStatusChange(true);
      }

      // Show appropriate message based on whether sync was new or restored
      if (result.isNewSync) {
        showToast({ message: 'Sync enabled successfully!' });
      } else {
        showToast({ message: 'Sync restored - displaying recovery phrase' });
      }

    } catch (error) {
      setSyncError(error.message || 'Failed to enable sync');
      // Clear all sync state if there's an error
      onSyncStateUpdate({
        syncEnabled: false,
        syncId: '',
        syncRecoveryPhrase: ''
      });
      showToast({
        message: error.message || 'Failed to enable sync',
        type: 'error',
      });
    } finally {
      setSyncLoading(false);
    }
  }, 0);
};

/**
 * Handle sync restore from recovery phrase
 */
export const handleRestoreSync = async ({
  recoveryInput,
  setSyncLoading,
  setSyncError,
  onSyncStateUpdate,
  setShowRecoveryInput,
  setRecoveryInput,
  onSyncStatusChange,
  showToast
}) => {
  setSyncLoading(true);
  setSyncError('');

  setTimeout(async () => {
    try {
      if (!recoveryInput.trim()) {
        setSyncError('Please enter your sync key');
        setSyncLoading(false);
        return;
      }

      // Use joinSync method to join existing sync
      const result = await syncService.joinSync(recoveryInput.trim());

      const syncId = (typeof result === 'object' && result.syncId) || syncService.syncId;

      onSyncStateUpdate({
        syncEnabled: true,
        syncId: syncId,
        syncRecoveryPhrase: recoveryInput.trim()
      });

      setShowRecoveryInput(false);
      setRecoveryInput('');

      if (onSyncStatusChange) {
        onSyncStatusChange(true);
      }

      const message = (typeof result === 'object' && result.isNewSync)
        ? 'New sync created successfully!'
        : 'Joined existing sync successfully!';
      showToast({ message });
    } catch (error) {
      setSyncError(error.message || 'Failed to restore sync');
    } finally {
      setSyncLoading(false);
    }
  }, 0);
};

/**
 * Handle manual sync
 */
export const handleManualSync = async ({
  onSyncStateUpdate,
  setSyncError,
  showToast
}) => {
  try {
    onSyncStateUpdate({ syncStatus: 'syncing' });
    setSyncError('');

    const result = await syncService.performManualSync();

    if (result.success) {
      onSyncStateUpdate({
        lastSyncTime: Date.now(),
        syncStatus: 'idle'
      });
      showToast({
        message: 'Sync completed successfully',
        type: 'success'
      });
    } else {
      onSyncStateUpdate({ syncStatus: 'idle' });
      setSyncError(result.message || 'Sync failed');
      showToast({
        message: result.message || 'Sync failed',
        type: 'error'
      });
    }
  } catch (error) {
    onSyncStateUpdate({ syncStatus: 'idle' });
    setSyncError(error.message);
    showToast({
      message: `Sync failed: ${error.message}`,
      type: 'error'
    });
  }
};

/**
 * Handle sync disable
 */
export const handleDisableSync = async ({
  setSyncLoading,
  onSyncStateUpdate,
  setShowDisableSyncConfirm,
  onSyncStatusChange,
  showToast
}) => {
  try {
    setSyncLoading(true);

    await syncService.disable();

    onSyncStateUpdate({
      syncEnabled: false,
      syncId: null,
      syncRecoveryPhrase: ''
    });

    setShowDisableSyncConfirm(false);

    if (onSyncStatusChange) {
      onSyncStatusChange(false);
    }

    showToast({ message: 'Sync disabled' });
  } catch (error) {
    Alert.alert('Error', 'Failed to disable sync');
  } finally {
    setSyncLoading(false);
  }
};

/**
 * Handle delete server data
 */
export const handleDeleteServerData = async ({
  setShowDeleteServerDataConfirm,
  setSyncLoading,
  onSyncStateUpdate,
  onSyncStatusChange,
  showToast
}) => {
  setShowDeleteServerDataConfirm(false);

  try {
    setSyncLoading(true);

    const currentSyncId = syncService.getSyncId ? syncService.getSyncId() :
                         syncService.syncId;

    if (!currentSyncId) {
      throw new Error('No sync ID available - sync may not be enabled');
    }

    // Delete all server data for this sync ID
    const deleteResult = await syncService.deleteFromServer();

    // Disable sync after deleting server data
    await syncService.disable();

    onSyncStateUpdate({
      syncEnabled: false,
      syncId: null,
      syncRecoveryPhrase: ''
    });

    if (onSyncStatusChange) {
      onSyncStatusChange(false);
    }

    showToast({ message: 'Server data deleted and sync disabled', type: 'success' });
  } catch (error) {
    showToast({
      message: 'Unable to delete server data. Please contact support if this persists.',
      type: 'error',
    });
  } finally {
    setSyncLoading(false);
  }
};

/**
 * Show confirmation dialogs for sync operations
 */
export const showSyncConfirmation = (action, onConfirm) => {
  if (Platform.OS === 'ios') {
    if (action === 'disable') {
      Alert.alert(
        'Disable Sync',
        'This will stop syncing your data. Your local data will remain unchanged. You can re-enable sync later with your sync key.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', style: 'destructive', onPress: onConfirm }
        ]
      );
    } else if (action === 'delete') {
      Alert.alert(
        'Delete Server Data',
        'This will permanently delete all your data from the server and disable sync. Your local data will remain unchanged. This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Server Data', style: 'destructive', onPress: onConfirm }
        ]
      );
    }
  }
};