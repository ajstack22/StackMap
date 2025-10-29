import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { ModalButton } from '../../ModalUtilities';

// Platform-specific QR scanner imports
let QRCodeScanner = null;
let Html5QrcodeScanner = null;

if (Platform.OS !== 'web') {
  try {
    QRCodeScanner = require('react-native-qrcode-scanner').default;
  } catch (error) {
    console.warn('QR code scanner not available on this platform');
  }
} else {
  try {
    const { Html5Qrcode } = require('html5-qrcode');
    Html5QrcodeScanner = Html5Qrcode;
  } catch (error) {
    console.warn('HTML5 QR code scanner not available');
  }
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

const SyncQRScanner = ({ visible, onClose, onScanSuccess, theme }) => {
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [html5Scanner, setHtml5Scanner] = useState(null);

  // Web-specific QR scanner setup
  useEffect(() => {
    if (Platform.OS === 'web' && visible && Html5QrcodeScanner) {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      });

      setHtml5Scanner(scanner);

      return () => {
        if (scanner) {
          scanner.clear().catch(err => console.warn('Error clearing scanner:', err));
        }
      };
    }
  }, [visible]);

  useEffect(() => {
    if (Platform.OS === 'web' && html5Scanner && visible) {
      html5Scanner.render(
        (decodedText) => handleScan(decodedText),
        (errorMessage) => {
          // Silent - scanner continuously scans
        }
      );
    }
  }, [html5Scanner, visible]);

  const handleScan = (data) => {
    if (!data) return;

    try {
      const syncKey = parseSyncKey(data);
      setIsScanning(false);
      onScanSuccess(syncKey);
      onClose();
    } catch (err) {
      setError(err.message);
      setIsScanning(false);
    }
  };

  const handleError = (err) => {
    console.error('QR Scanner error:', err);
    setError('Failed to access camera. Please check permissions.');
    setIsScanning(false);
  };

  const handleRetry = () => {
    setError(null);
    setIsScanning(true);
  };

  const renderMobileScanner = () => {
    if (!QRCodeScanner) {
      return (
        <View style={styles.scannerError}>
          <Text style={styles.scannerErrorText}>
            QR code scanner is not available on this platform
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.scannerError}>
          <Text style={styles.scannerErrorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <QRCodeScanner
        onRead={({ data }) => handleScan(data)}
        reactivate={isScanning}
        reactivateTimeout={500}
        showMarker={true}
        containerStyle={styles.scannerContainer}
        cameraStyle={styles.camera}
        topContent={
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scan Sync QR Code</Text>
            <Text style={styles.scannerInstructions}>
              Position the QR code within the frame
            </Text>
          </View>
        }
        bottomContent={
          <ModalButton
            theme={theme}
            variant="secondary"
            label="Cancel"
            onPress={onClose}
            fullWidth
          />
        }
      />
    );
  };

  const renderWebScanner = () => {
    if (!Html5QrcodeScanner) {
      return (
        <View style={styles.scannerError}>
          <Text style={styles.scannerErrorText}>
            QR code scanner is not available in this browser
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.scannerError}>
          <Text style={styles.scannerErrorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.webScannerContainer}>
        <View style={styles.scannerHeader}>
          <Text style={styles.scannerTitle}>Scan Sync QR Code</Text>
          <Text style={styles.scannerInstructions}>
            Allow camera access and position the QR code within the frame
          </Text>
        </View>
        <div id="qr-reader" style={{ width: '100%', maxWidth: 500 }}></div>
        <ModalButton
          theme={theme}
          variant="secondary"
          label="Cancel"
          onPress={onClose}
          fullWidth
        />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {Platform.OS === 'web' ? renderWebScanner() : renderMobileScanner()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  webScannerContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerHeader: {
    padding: 20,
    alignItems: 'center',
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
  scannerError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scannerErrorText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SyncQRScanner;
export { parseSyncKey };
