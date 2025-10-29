import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Html5Qrcode } from 'html5-qrcode';
import { ModalButton } from '../../ModalUtilities';
import { parseSyncKey } from './SyncQRScanner';

/**
 * Web-specific QR Scanner using html5-qrcode
 * No React hooks issues since we're not using react-native-vision-camera
 */
const WebQRScanner = ({ onScanSuccess, onClose, theme }) => {
  const [error, setError] = useState(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [html5Scanner, setHtml5Scanner] = useState(null);

  // Initialize scanner when component mounts
  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    setHtml5Scanner(scanner);

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.warn('Error clearing scanner:', err));
      }
    };
  }, []);

  // Start scanning when scanner is ready
  useEffect(() => {
    if (html5Scanner && !hasScanned && !error) {
      html5Scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => handleScan(decodedText),
        (errorMessage) => {
          // Silent - scanner continuously scans
        }
      ).catch(err => {
        console.error('Failed to start scanner:', err);
        setError('Failed to start camera. Please check camera permissions.');
      });
    }
  }, [html5Scanner, hasScanned, error]);

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

  return (
    <View style={styles.container}>
      <View style={styles.scannerHeader}>
        <Text style={styles.scannerTitle}>Scan Sync QR Code</Text>
        <Text style={styles.scannerInstructions}>
          Allow camera access and position the QR code within the frame
        </Text>
      </View>
      <div id="qr-reader" style={{ width: '100%', maxWidth: 500, margin: '20px auto' }}></div>
      <View style={styles.buttonContainer}>
        <ModalButton
          theme={theme}
          variant="secondary"
          label="Cancel"
          onPress={onClose}
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerHeader: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
    marginBottom: 20,
  },
  scannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  scannerInstructions: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%',
    maxWidth: 500,
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

export default WebQRScanner;
