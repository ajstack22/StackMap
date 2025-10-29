import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { parseSyncKey } from './SyncQRScanner';

/**
 * Mobile-specific QR Scanner using react-native-vision-camera
 * This component MUST call all hooks unconditionally (React Rules of Hooks)
 */
const MobileQRScanner = ({ onScanSuccess, onClose, theme }) => {
  const [error, setError] = useState(null);
  const [hasScanned, setHasScanned] = useState(false);

  // ALWAYS call hooks unconditionally at the top level
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  // Code scanner setup (always called, not conditional)
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (hasScanned || codes.length === 0) return;

      const code = codes[0];
      if (!code.value) return;

      handleScan(code.value);
    },
  });

  // Request permission on mount if needed
  useEffect(() => {
    if (!hasPermission && hasPermission !== null) {
      requestPermission();
    }
  }, [hasPermission]);

  const handleScan = (data) => {
    if (!data || hasScanned) return;

    try {
      const syncKey = parseSyncKey(data);
      setHasScanned(true);
      onScanSuccess(syncKey);
      onClose();
    } catch (err) {
      setError(err.message);
      setHasScanned(true);
    }
  };

  const handleRetry = () => {
    setError(null);
    setHasScanned(false);
  };

  // Permission not yet determined
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Checking camera permissions...</Text>
        </View>
      </View>
    );
  }

  // Permission denied
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Camera permission is required to scan QR codes.{'\n\n'}
            Please enable camera access in your device settings.
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.retryButtonText}>Request Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.primary }]}
            onPress={onClose}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
              Use Manual Entry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // No camera device available
  if (!device) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            No camera device found on this device.{'\n\n'}
            Please use manual sync key entry instead.
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <Text style={styles.retryButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.primary }]}
            onPress={onClose}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!hasScanned}
        codeScanner={codeScanner}
      />
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>Scan Sync QR Code</Text>
          <Text style={styles.instructions}>
            Position the QR code within the frame
          </Text>
        </View>
        <View style={styles.scanFrame} />
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    alignSelf: 'center',
    borderRadius: 12,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 200,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MobileQRScanner;
