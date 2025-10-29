import React from 'react';
import { Modal, Platform, StyleSheet, View, Text } from 'react-native';

// Platform-specific QR scanner components
// This wrapper pattern avoids React hooks violations by splitting
// mobile and web implementations into separate components
let MobileQRScanner = null;
let WebQRScanner = null;

if (Platform.OS !== 'web') {
  MobileQRScanner = require('./MobileQRScanner').default;
} else {
  WebQRScanner = require('./WebQRScanner').default;
}

/**
 * Parse sync key from various formats
 * Supports:
 * - Full URLs: https://stackmap.app/?sync=<key>
 * - Beta URLs: https://stackmap.app/beta/?sync=<key>
 * - Qual URLs: https://stackmap.app/qual/?sync=<key>
 * - Direct key: 32-character hexadecimal string
 */
const parseSyncKey = (scannedData) => {
  if (!scannedData || typeof scannedData !== 'string') {
    throw new Error('Invalid scanned data');
  }

  const trimmedData = scannedData.trim();

  // Check if it's a URL
  if (trimmedData.includes('stackmap.app')) {
    try {
      const url = new URL(trimmedData);
      const syncKey = url.searchParams.get('sync');

      if (!syncKey) {
        throw new Error('No sync key found in URL');
      }

      // Validate the extracted key
      if (!/^[a-f0-9]{32}$/i.test(syncKey)) {
        throw new Error('Invalid sync key format in URL');
      }

      return syncKey;
    } catch (error) {
      throw new Error(`Failed to parse URL: ${error.message}`);
    }
  }

  // Check if it's a direct key (32-character hex string)
  if (/^[a-f0-9]{32}$/i.test(trimmedData)) {
    return trimmedData;
  }

  throw new Error('Invalid sync key format. Expected a 32-character hexadecimal string or StackMap sync URL.');
};

/**
 * Platform-aware QR Scanner wrapper component
 *
 * This component acts as a router that delegates to platform-specific
 * implementations to avoid React hooks violations. The hooks from
 * react-native-vision-camera MUST be called unconditionally, which is
 * impossible in a cross-platform component. By splitting into separate
 * components, we ensure proper hook usage on each platform.
 */
const SyncQRScanner = ({ visible, onClose, onScanSuccess, theme }) => {
  // Render platform-specific scanner
  const renderScanner = () => {
    if (Platform.OS === 'web') {
      if (!WebQRScanner) {
        return (
          <View style={styles.container}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                QR code scanner is not available in this browser
              </Text>
            </View>
          </View>
        );
      }
      return <WebQRScanner onScanSuccess={onScanSuccess} onClose={onClose} theme={theme} />;
    } else {
      if (!MobileQRScanner) {
        return (
          <View style={styles.container}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                QR code scanner is not available on this platform
              </Text>
            </View>
          </View>
        );
      }
      return <MobileQRScanner onScanSuccess={onScanSuccess} onClose={onClose} theme={theme} />;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {renderScanner()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
});

export default SyncQRScanner;
export { parseSyncKey };
