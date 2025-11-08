import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Html5Qrcode } from 'html5-qrcode';
import { ModalButton } from '../../ModalUtilities';
import { parseSyncKey } from './SyncQRScanner';
import { logWarn, logError } from '../../../utils/logger';

/**
 * Web-specific QR Scanner using html5-qrcode
 * Fixed version with proper refs and promise tracking
 */
const WebQRScanner = ({ onScanSuccess, onClose, theme }) => {
  const [error, setError] = useState(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Use refs to avoid stale closures and track scanner state
  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);
  const startPromiseRef = useRef(null);
  const hasUnmountedRef = useRef(false);

  // Initialize scanner when component mounts
  useEffect(() => {
    const initScanner = async () => {
      try {
        // Create scanner instance
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        // Only start if component hasn't unmounted
        if (!hasUnmountedRef.current) {
          setIsInitializing(false);
        }
      } catch (err) {
        logError('Failed to initialize scanner:', err);
        setError('Failed to initialize camera scanner');
        setIsInitializing(false);
      }
    };

    initScanner();

    // Cleanup function
    return () => {
      hasUnmountedRef.current = true;

      const cleanup = async () => {
        try {
          // If there's a start promise pending, wait for it
          if (startPromiseRef.current) {
            try {
              await startPromiseRef.current;
            } catch (err) {
              // Start failed, that's okay
              logWarn('Start promise failed during cleanup:', err);
            }
          }

          // Now safely stop if running
          if (scannerRef.current && isRunningRef.current) {
            try {
              await scannerRef.current.stop();
              logWarn('Scanner stopped during cleanup');
            } catch (err) {
              logWarn('Error stopping scanner during cleanup:', err);
            }
          }

          // Clear the scanner
          if (scannerRef.current) {
            try {
              await scannerRef.current.clear();
              logWarn('Scanner cleared during cleanup');
            } catch (err) {
              logWarn('Error clearing scanner during cleanup:', err);
            }
          }
        } catch (err) {
          logError('Unexpected error in cleanup:', err);
        }
      };

      cleanup();
    };
  }, []);

  // Start scanning when scanner is ready
  useEffect(() => {
    if (!scannerRef.current || hasScanned || error || isInitializing || hasUnmountedRef.current) {
      return;
    }

    const startScanning = async () => {
      try {
        // Don't start if already running
        if (isRunningRef.current) {
          logWarn('Scanner already running, skipping start');
          return;
        }

        logWarn('Starting scanner...');

        // Create and store the start promise
        const startPromise = scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => handleScan(decodedText),
          (errorMessage) => {
            // Silent - scanner continuously scans
          }
        );

        startPromiseRef.current = startPromise;

        await startPromise;

        // Only mark as running if component hasn't unmounted
        if (!hasUnmountedRef.current) {
          isRunningRef.current = true;
          logWarn('Scanner started successfully');
        }

        // Clear the promise ref once it's resolved
        startPromiseRef.current = null;

      } catch (err) {
        logError('Failed to start scanner:', err);
        if (!hasUnmountedRef.current) {
          setError('Failed to start camera. Please check camera permissions.');
        }
        startPromiseRef.current = null;
        isRunningRef.current = false;
      }
    };

    startScanning();
  }, [hasScanned, error, isInitializing]);

  const handleScan = async (data) => {
    if (!data || hasScanned || hasUnmountedRef.current) return;

    try {
      const syncKey = parseSyncKey(data);
      setHasScanned(true);

      // Stop the scanner before calling callbacks
      await stopScanner();

      onScanSuccess(syncKey);
      onClose();
    } catch (err) {
      if (!hasUnmountedRef.current) {
        setError(err.message);
        setHasScanned(true);
      }
    }
  };

  const stopScanner = async () => {
    try {
      // Wait for any pending start operation
      if (startPromiseRef.current) {
        logWarn('Waiting for start to complete before stopping...');
        try {
          await startPromiseRef.current;
        } catch (err) {
          logWarn('Start failed, proceeding with stop:', err);
        }
      }

      // Now stop if running
      if (scannerRef.current && isRunningRef.current) {
        logWarn('Stopping scanner...');
        await scannerRef.current.stop();
        isRunningRef.current = false;
        logWarn('Scanner stopped successfully');
      }
    } catch (err) {
      logWarn('Error in stopScanner:', err);
      isRunningRef.current = false;
      // Don't throw - we want to proceed with closing
    }
  };

  const handleRetry = () => {
    setError(null);
    setHasScanned(false);
    isRunningRef.current = false; // Reset scanner state for retry
  };

  const handleClose = async () => {
    // Stop the scanner before closing
    await stopScanner();
    onClose();
  };

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing camera...</Text>
        </View>
      </View>
    );
  }

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
            onPress={handleClose}
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
          onPress={handleClose}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
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