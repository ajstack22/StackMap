// @ts-check
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SyncManagement from '../SyncManagement';
import syncService from '../../../../services/sync';

// Mock the sync service
jest.mock('../../../../services/sync', () => ({
  create: jest.fn(),
  joinSync: jest.fn(),
  performManualSync: jest.fn(),
  disable: jest.fn(),
  deleteFromServer: jest.fn(),
  getSyncId: jest.fn(),
}));

// Mock Alert
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}));

const mockTheme = {
  primary: '#007AFF',
  secondary: '#FF9500',
};

const defaultProps = {
  theme: mockTheme,
  showToast: jest.fn(),
  onSyncStatusChange: jest.fn(),
  onSyncStateUpdate: jest.fn(),
  syncEnabled: false,
  syncLoading: false,
  setSyncLoading: jest.fn(),
  syncError: '',
  setSyncError: jest.fn(),
  showRecoveryInput: false,
  setShowRecoveryInput: jest.fn(),
  recoveryInput: '',
  setRecoveryInput: jest.fn(),
  showDisableSyncConfirm: false,
  setShowDisableSyncConfirm: jest.fn(),
  showDeleteServerDataConfirm: false,
  setShowDeleteServerDataConfirm: jest.fn(),
};

describe('SyncManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('renderSyncDisabled', () => {
    it('should render sync disabled view with correct elements', () => {
      const syncManagement = SyncManagement(defaultProps);
      const { getByText } = render(syncManagement.renderSyncDisabled());

      expect(getByText('Sync Your Data')).toBeTruthy();
      expect(getByText('End-to-end encrypted')).toBeTruthy();
      expect(getByText('Multi-device support')).toBeTruthy();
      expect(getByText('Works offline')).toBeTruthy();
      expect(getByText('Create New Sync')).toBeTruthy();
      expect(getByText('Restore from Sync Key')).toBeTruthy();
    });

    it('should show recovery input when showRecoveryInput is true', () => {
      const props = { ...defaultProps, showRecoveryInput: true };
      const syncManagement = SyncManagement(props);
      const { getByText, getByPlaceholderText } = render(syncManagement.renderSyncDisabled());

      expect(getByText('Enter your sync key:')).toBeTruthy();
      expect(getByPlaceholderText('Paste sync key')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
      expect(getByText('Restore')).toBeTruthy();
    });

    it('should display sync error when present', () => {
      const props = { ...defaultProps, syncError: 'Test error message' };
      const syncManagement = SyncManagement(props);
      const { getByText } = render(syncManagement.renderSyncDisabled());

      expect(getByText('Test error message')).toBeTruthy();
    });
  });

  describe('handleEnableSync', () => {
    it('should create new sync successfully', async () => {
      const mockResult = {
        syncId: 'test-sync-id',
        recoveryPhrase: 'test-recovery-phrase',
        isNewSync: true,
      };
      syncService.create.mockResolvedValue(mockResult);

      const props = { ...defaultProps };
      const syncManagement = SyncManagement(props);

      await syncManagement.handleEnableSync();

      expect(syncService.create).toHaveBeenCalled();
      expect(props.onSyncStateUpdate).toHaveBeenCalledWith({
        syncEnabled: true,
        syncId: 'test-sync-id',
        syncRecoveryPhrase: 'test-recovery-phrase',
      });
      expect(props.onSyncStatusChange).toHaveBeenCalledWith(true);
      expect(props.showToast).toHaveBeenCalledWith({
        message: 'Sync enabled successfully!',
      });
    });

    it('should handle sync creation error', async () => {
      const errorMessage = 'Failed to create sync';
      syncService.create.mockRejectedValue(new Error(errorMessage));

      const props = { ...defaultProps };
      const syncManagement = SyncManagement(props);

      await syncManagement.handleEnableSync();

      expect(props.setSyncError).toHaveBeenCalledWith(errorMessage);
      expect(props.onSyncStateUpdate).toHaveBeenCalledWith({
        syncEnabled: false,
        syncId: '',
        syncRecoveryPhrase: '',
      });
      expect(props.showToast).toHaveBeenCalledWith({
        message: errorMessage,
        type: 'error',
      });
    });
  });

  describe('handleRestoreSync', () => {
    it('should restore sync successfully', async () => {
      const mockResult = {
        syncId: 'restored-sync-id',
        isNewSync: false,
      };
      syncService.joinSync.mockResolvedValue(mockResult);

      const props = {
        ...defaultProps,
        recoveryInput: 'test-recovery-phrase',
      };
      const syncManagement = SyncManagement(props);

      await syncManagement.handleRestoreSync();

      expect(syncService.joinSync).toHaveBeenCalledWith('test-recovery-phrase');
      expect(props.onSyncStateUpdate).toHaveBeenCalledWith({
        syncEnabled: true,
        syncId: 'restored-sync-id',
        syncRecoveryPhrase: 'test-recovery-phrase',
      });
      expect(props.setShowRecoveryInput).toHaveBeenCalledWith(false);
      expect(props.showToast).toHaveBeenCalledWith({
        message: 'Joined existing sync successfully!',
      });
    });

    it('should handle empty recovery input', async () => {
      const props = { ...defaultProps, recoveryInput: '' };
      const syncManagement = SyncManagement(props);

      await syncManagement.handleRestoreSync();

      expect(props.setSyncError).toHaveBeenCalledWith('Please enter your sync key');
      expect(syncService.joinSync).not.toHaveBeenCalled();
    });

    it('should handle restore sync error', async () => {
      const errorMessage = 'Failed to restore sync';
      syncService.joinSync.mockRejectedValue(new Error(errorMessage));

      const props = {
        ...defaultProps,
        recoveryInput: 'test-recovery-phrase',
      };
      const syncManagement = SyncManagement(props);

      await syncManagement.handleRestoreSync();

      expect(props.setSyncError).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('handleManualSync', () => {
    it('should perform manual sync successfully', async () => {
      const mockResult = { success: true };
      syncService.performManualSync.mockResolvedValue(mockResult);

      const props = { ...defaultProps };
      const syncManagement = SyncManagement(props);

      await syncManagement.handleManualSync();

      expect(syncService.performManualSync).toHaveBeenCalled();
      expect(props.onSyncStateUpdate).toHaveBeenCalledWith({
        syncStatus: 'syncing',
      });
      expect(props.onSyncStateUpdate).toHaveBeenCalledWith({
        lastSyncTime: expect.any(Number),
        syncStatus: 'idle',
      });
      expect(props.showToast).toHaveBeenCalledWith({
        message: 'Sync completed successfully',
        type: 'success',
      });
    });

    it('should handle manual sync failure', async () => {
      const mockResult = { success: false, message: 'Sync failed' };
      syncService.performManualSync.mockResolvedValue(mockResult);

      const props = { ...defaultProps };
      const syncManagement = SyncManagement(props);

      await syncManagement.handleManualSync();

      expect(props.onSyncStateUpdate).toHaveBeenCalledWith({
        syncStatus: 'idle',
      });
      expect(props.setSyncError).toHaveBeenCalledWith('Sync failed');
      expect(props.showToast).toHaveBeenCalledWith({
        message: 'Sync failed',
        type: 'error',
      });
    });

    it('should handle manual sync error', async () => {
      const errorMessage = 'Network error';
      syncService.performManualSync.mockRejectedValue(new Error(errorMessage));

      const props = { ...defaultProps };
      const syncManagement = SyncManagement(props);

      await syncManagement.handleManualSync();

      expect(props.setSyncError).toHaveBeenCalledWith(errorMessage);
      expect(props.showToast).toHaveBeenCalledWith({
        message: `Sync failed: ${errorMessage}`,
        type: 'error',
      });
    });
  });

  describe('handleDisableSync', () => {
    it('should disable sync successfully', async () => {
      syncService.disable.mockResolvedValue();

      const props = { ...defaultProps };
      const syncManagement = SyncManagement(props);

      await syncManagement.handleDisableSync();

      expect(syncService.disable).toHaveBeenCalled();
      expect(props.onSyncStateUpdate).toHaveBeenCalledWith({
        syncEnabled: false,
        syncId: null,
        syncRecoveryPhrase: '',
      });
      expect(props.setShowDisableSyncConfirm).toHaveBeenCalledWith(false);
      expect(props.onSyncStatusChange).toHaveBeenCalledWith(false);
      expect(props.showToast).toHaveBeenCalledWith({
        message: 'Sync disabled',
      });
    });

    it('should handle disable sync error', async () => {
      syncService.disable.mockRejectedValue(new Error('Disable failed'));

      const props = { ...defaultProps };
      const syncManagement = SyncManagement(props);

      await syncManagement.handleDisableSync();

      // Should use Alert.alert for errors on this function
      expect(require('react-native').Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to disable sync'
      );
    });
  });

  describe('handleDeleteServerData', () => {
    it('should delete server data successfully', async () => {
      syncService.getSyncId = jest.fn().mockReturnValue('test-sync-id');
      syncService.deleteFromServer.mockResolvedValue({ success: true });
      syncService.disable.mockResolvedValue();

      const props = { ...defaultProps };
      const syncManagement = SyncManagement(props);

      await syncManagement.handleDeleteServerData();

      expect(props.setShowDeleteServerDataConfirm).toHaveBeenCalledWith(false);
      expect(syncService.deleteFromServer).toHaveBeenCalled();
      expect(syncService.disable).toHaveBeenCalled();
      expect(props.onSyncStateUpdate).toHaveBeenCalledWith({
        syncEnabled: false,
        syncId: null,
        syncRecoveryPhrase: '',
      });
      expect(props.showToast).toHaveBeenCalledWith({
        message: 'Server data deleted and sync disabled',
        type: 'success',
      });
    });

    it('should handle missing sync ID', async () => {
      syncService.getSyncId = jest.fn().mockReturnValue(null);
      syncService.syncId = null;

      const props = { ...defaultProps };
      const syncManagement = SyncManagement(props);

      await syncManagement.handleDeleteServerData();

      expect(props.showToast).toHaveBeenCalledWith({
        message: 'Unable to delete server data. Please contact support if this persists.',
        type: 'error',
      });
    });

    it('should handle delete server data error', async () => {
      syncService.getSyncId = jest.fn().mockReturnValue('test-sync-id');
      syncService.deleteFromServer.mockRejectedValue(new Error('Delete failed'));

      const props = { ...defaultProps };
      const syncManagement = SyncManagement(props);

      await syncManagement.handleDeleteServerData();

      expect(props.showToast).toHaveBeenCalledWith({
        message: 'Unable to delete server data. Please contact support if this persists.',
        type: 'error',
      });
    });
  });

  describe('renderSyncControls', () => {
    it('should render sync control buttons', () => {
      const syncManagement = SyncManagement(defaultProps);
      const { getByText } = render(syncManagement.renderSyncControls());

      expect(getByText('Sync Now')).toBeTruthy();
      expect(getByText('Disable Sync')).toBeTruthy();
      expect(getByText('Delete Server Data')).toBeTruthy();
    });
  });
});