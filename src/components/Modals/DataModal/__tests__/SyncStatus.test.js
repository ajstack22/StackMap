// @ts-check
import React from 'react';
import { render } from '@testing-library/react-native';
import SyncStatus from '../SyncStatus';

const mockTheme = {
  primary: '#007AFF',
  secondary: '#FF9500',
};

const defaultProps = {
  theme: mockTheme,
  syncEnabled: true,
  syncStatus: 'idle',
  lastSyncTime: Date.now() - 60000, // 1 minute ago
  syncError: '',
};

describe('SyncStatus', () => {
  describe('formatTimeAgo', () => {
    it('should format time correctly for various intervals', () => {
      const syncStatus = SyncStatus(defaultProps);
      const now = Date.now();

      // Test recent time
      expect(syncStatus.formatTimeAgo(now - 30000)).toBe('just now');

      // Test minutes
      expect(syncStatus.formatTimeAgo(now - 120000)).toBe('2 minutes ago');
      expect(syncStatus.formatTimeAgo(now - 60000)).toBe('1 minute ago');

      // Test hours
      expect(syncStatus.formatTimeAgo(now - 7200000)).toBe('2 hours ago');
      expect(syncStatus.formatTimeAgo(now - 3600000)).toBe('1 hour ago');

      // Test days
      expect(syncStatus.formatTimeAgo(now - 172800000)).toBe('2 days ago');
      expect(syncStatus.formatTimeAgo(now - 86400000)).toBe('1 day ago');
    });
  });

  describe('getSyncStatusIcon', () => {
    it('should return correct icon for disabled sync', () => {
      const props = { ...defaultProps, syncEnabled: false };
      const syncStatus = SyncStatus(props);
      const result = syncStatus.getSyncStatusIcon();

      expect(result.icon).toBe('sync-disabled');
      expect(result.color).toBe('#ff9800');
    });

    it('should return correct icon for syncing status', () => {
      const props = { ...defaultProps, syncStatus: 'syncing' };
      const syncStatus = SyncStatus(props);
      const result = syncStatus.getSyncStatusIcon();

      expect(result.icon).toBe('sync');
      expect(result.color).toBe(mockTheme.primary);
    });

    it('should return correct icon for sync error', () => {
      const props = { ...defaultProps, syncError: 'Network error' };
      const syncStatus = SyncStatus(props);
      const result = syncStatus.getSyncStatusIcon();

      expect(result.icon).toBe('sync-problem');
      expect(result.color).toBe('#d32f2f');
    });

    it('should return correct icon for successful sync', () => {
      const syncStatus = SyncStatus(defaultProps);
      const result = syncStatus.getSyncStatusIcon();

      expect(result.icon).toBe('cloud-done');
      expect(result.color).toBe('#4caf50');
    });
  });

  describe('getSyncStatusText', () => {
    it('should return correct text for disabled sync', () => {
      const props = { ...defaultProps, syncEnabled: false };
      const syncStatus = SyncStatus(props);
      const result = syncStatus.getSyncStatusText();

      expect(result).toBe('Sync disabled');
    });

    it('should return correct text for syncing status', () => {
      const props = { ...defaultProps, syncStatus: 'syncing' };
      const syncStatus = SyncStatus(props);
      const result = syncStatus.getSyncStatusText();

      expect(result).toBe('Syncing...');
    });

    it('should return correct text for sync error', () => {
      const props = { ...defaultProps, syncError: 'Network error' };
      const syncStatus = SyncStatus(props);
      const result = syncStatus.getSyncStatusText();

      expect(result).toBe('Sync error: Network error');
    });

    it('should return correct text with last sync time', () => {
      const syncStatus = SyncStatus(defaultProps);
      const result = syncStatus.getSyncStatusText();

      expect(result).toContain('Last synced');
      expect(result).toContain('minute');
    });

    it('should return default text when no last sync time', () => {
      const props = { ...defaultProps, lastSyncTime: null };
      const syncStatus = SyncStatus(props);
      const result = syncStatus.getSyncStatusText();

      expect(result).toBe('Sync active');
    });
  });

  describe('renderSyncEnabledHeader', () => {
    it('should render sync enabled header correctly', () => {
      const syncStatus = SyncStatus(defaultProps);
      const { getByText } = render(syncStatus.renderSyncEnabledHeader());

      expect(getByText('Sync Enabled')).toBeTruthy();
      expect(getByText('Your data is syncing across devices')).toBeTruthy();
    });
  });

  describe('renderSyncStatusInfo', () => {
    it('should render sync status info correctly', () => {
      const syncStatus = SyncStatus(defaultProps);
      const { getByText } = render(syncStatus.renderSyncStatusInfo());

      expect(getByText(/Last synced.*minute.*ago/)).toBeTruthy();
    });

    it('should show error message when sync error present', () => {
      const props = { ...defaultProps, syncError: 'Network error' };
      const syncStatus = SyncStatus(props);
      const { getByText } = render(syncStatus.renderSyncStatusInfo());

      expect(getByText('Network error')).toBeTruthy();
    });
  });

  describe('renderSyncProgress', () => {
    it('should render sync progress when syncing', () => {
      const props = { ...defaultProps, syncStatus: 'syncing' };
      const syncStatus = SyncStatus(props);
      const result = syncStatus.renderSyncProgress();

      expect(result).toBeTruthy();
    });

    it('should return null when not syncing', () => {
      const syncStatus = SyncStatus(defaultProps);
      const result = syncStatus.renderSyncProgress();

      expect(result).toBeNull();
    });
  });

  describe('renderCompactStatus', () => {
    it('should render compact status for enabled sync', () => {
      const syncStatus = SyncStatus(defaultProps);
      const { getByText } = render(syncStatus.renderCompactStatus());

      expect(getByText('Sync enabled')).toBeTruthy();
    });

    it('should render compact status for disabled sync', () => {
      const props = { ...defaultProps, syncEnabled: false };
      const syncStatus = SyncStatus(props);
      const { getByText } = render(syncStatus.renderCompactStatus());

      expect(getByText('Sync disabled')).toBeTruthy();
    });
  });

  describe('renderSyncFeatures', () => {
    it('should render sync features list', () => {
      const syncStatus = SyncStatus(defaultProps);
      const { getByText } = render(syncStatus.renderSyncFeatures());

      expect(getByText('End-to-end encrypted')).toBeTruthy();
      expect(getByText('Multi-device support')).toBeTruthy();
      expect(getByText('Works offline')).toBeTruthy();
    });
  });
});