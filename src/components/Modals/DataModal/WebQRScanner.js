import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Html5Qrcode } from 'html5-qrcode';
import { ModalButton } from '../../ModalUtilities';
import { parseSyncKey } from './SyncQRScanner';
import { logWarn, logError } from '../../../utils/logger';

/**
 * Web-specific QR Scanner using html5-qrcode
 * Fixed version with proper refs, promise tracking, and camera permission handling
 */
const WebQRScanner = ({ onScanSuccess, onClose, theme }) => {
  const [error, setError] = useState(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [containerReady, setContainerReady] = useState(false);

  // Use refs to avoid stale closures and track scanner state
  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);
  const startPromiseRef = useRef(null);
  const hasUnmountedRef = useRef(false);
  const containerRef = useRef(null);

  // Add debug logging
  const addDebugInfo = (info) => {
    console.log(`[QR Scanner Debug] ${info}`);
    setDebugInfo(prev => prev + '\n' + info);
  };

  // Check for camera permissions first
  const checkCameraPermission = async () => {
    try {
      addDebugInfo('Checking camera permissions...');

      // Check if navigator.mediaDevices is available (HTTPS required)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        addDebugInfo('ERROR: Camera API not available (HTTPS required?)');
        logError('Camera API not available. HTTPS required.');
        throw new Error('Camera access requires HTTPS. Please use a secure connection.');
      }

      addDebugInfo('Camera API is available');

      // Try to get camera permission
      logWarn('Requesting camera permission...');
      addDebugInfo('Requesting camera access...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });

      addDebugInfo('Camera access granted successfully');

      // Stop the stream immediately - we just needed to check permission
      stream.getTracks().forEach(track => {
        addDebugInfo(`Stopping track: ${track.label}`);
        track.stop();
      });

      logWarn('Camera permission granted');
      return true;
    } catch (err) {
      addDebugInfo(`Camera permission error: ${err.name} - ${err.message}`);
      logError('Camera permission error:', err);

      // Determine the type of error
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        throw new Error('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('No camera found. Please connect a camera and try again.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        throw new Error('Camera is already in use by another application. Please close other apps using the camera.');
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        throw new Error('Camera does not support the required settings.');
      } else if (err.message && err.message.includes('HTTPS')) {
        throw err;
      } else {
        throw new Error(`Camera access failed: ${err.message || err.name || 'Unknown error'}`);
      }
    }
  };

  // Create container element for scanner
  useEffect(() => {
    if (Platform.OS === 'web' && !error) {
      addDebugInfo('Creating scanner container element...');

      // Create a div element directly in the body temporarily for testing
      const tempDiv = document.createElement('div');
      tempDiv.id = 'qr-reader-temp';
      tempDiv.style.position = 'fixed';
      tempDiv.style.top = '50%';
      tempDiv.style.left = '50%';
      tempDiv.style.transform = 'translate(-50%, -50%)';
      tempDiv.style.width = '90%';
      tempDiv.style.maxWidth = '500px';
      tempDiv.style.height = '400px';
      tempDiv.style.backgroundColor = '#f0f0f0';
      tempDiv.style.border = '2px solid #333';
      tempDiv.style.zIndex = '10000';
      document.body.appendChild(tempDiv);

      addDebugInfo(`Created temporary div with id: qr-reader-temp`);

      // Wait a moment for the div to be fully rendered
      setTimeout(() => {
        const checkElement = document.getElementById('qr-reader-temp');
        if (checkElement) {
          const rect = checkElement.getBoundingClientRect();
          addDebugInfo(`Temp element ready with dimensions: ${rect.width}x${rect.height}`);
          setContainerReady(true);
        } else {
          addDebugInfo('ERROR: Could not find temp element after creation');
        }
      }, 100);

      return () => {
        // Cleanup temp div
        const tempDiv = document.getElementById('qr-reader-temp');
        if (tempDiv && tempDiv.parentNode) {
          tempDiv.parentNode.removeChild(tempDiv);
          addDebugInfo('Removed temporary scanner container');
        }
      };
    }
  }, [error]);

  // Initialize scanner when component mounts
  useEffect(() => {
    if (!containerReady || error) {
      return;
    }

    const initScanner = async () => {
      try {
        addDebugInfo('Starting scanner initialization...');

        // Check camera permission first
        await checkCameraPermission();

        // Use the temporary div element
        const elementId = 'qr-reader-temp';
        const element = document.getElementById(elementId);

        if (!element) {
          throw new Error(`Element #${elementId} not found`);
        }

        const rect = element.getBoundingClientRect();
        addDebugInfo(`Using element #${elementId} with dimensions: ${rect.width}x${rect.height}`);

        // Create scanner instance
        addDebugInfo('Creating Html5Qrcode instance...');
        logWarn('Creating Html5Qrcode instance...');

        try {
          const scanner = new Html5Qrcode(elementId);
          scannerRef.current = scanner;
          addDebugInfo('Scanner instance created successfully');
          logWarn('Scanner instance created successfully');
        } catch (scannerErr) {
          addDebugInfo(`Failed to create scanner: ${scannerErr.message}`);
          throw new Error(`Scanner creation failed: ${scannerErr.message}`);
        }

        // Only start if component hasn't unmounted
        if (!hasUnmountedRef.current) {
          addDebugInfo('Component still mounted, ready to start scanning');
          setIsInitializing(false);
        }
      } catch (err) {
        addDebugInfo(`Initialization failed: ${err.message}`);
        logError('Failed to initialize scanner:', err);
        if (!hasUnmountedRef.current) {
          setError(err.message || 'Failed to initialize camera scanner');
          setIsInitializing(false);
        }
      }
    };

    // Add a small delay to ensure everything is ready
    const timer = setTimeout(initScanner, 200);

    // Cleanup function
    return () => {
      clearTimeout(timer);
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
  }, [containerReady, error]);

  // Start scanning when scanner is ready
  useEffect(() => {
    if (!scannerRef.current || hasScanned || error || isInitializing || hasUnmountedRef.current) {
      return;
    }

    const startScanning = async () => {
      try {
        // Don't start if already running
        if (isRunningRef.current) {
          addDebugInfo('Scanner already running, skipping start');
          logWarn('Scanner already running, skipping start');
          return;
        }

        addDebugInfo('Starting camera scanner...');
        logWarn('Starting camera scanner...');

        // Get available cameras first
        try {
          addDebugInfo('Getting camera list...');
          const cameras = await Html5Qrcode.getCameras();
          addDebugInfo(`Found ${cameras.length} camera(s)`);
          cameras.forEach((camera, index) => {
            addDebugInfo(`Camera ${index}: ${camera.label || camera.id}`);
          });
          logWarn(`Found ${cameras.length} camera(s):`, cameras);

          if (cameras.length === 0) {
            throw new Error('No cameras found on this device');
          }
        } catch (err) {
          addDebugInfo(`Error getting cameras: ${err.message}`);
          logError('Error getting cameras:', err);
          throw new Error('Failed to access camera list. Please ensure camera permissions are granted.');
        }

        // Create and store the start promise
        addDebugInfo('Calling scanner.start()...');
        const startPromise = scannerRef.current.start(
          { facingMode: "environment" }, // Use back camera if available
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText) => {
            addDebugInfo(`QR code detected: ${decodedText.substring(0, 20)}...`);
            handleScan(decodedText);
          },
          (errorMessage) => {
            // Silent - scanner continuously scans, these are normal scan failures
          }
        );

        startPromiseRef.current = startPromise;

        await startPromise;

        // Only mark as running if component hasn't unmounted
        if (!hasUnmountedRef.current) {
          isRunningRef.current = true;
          addDebugInfo('Scanner started successfully and is running');
          logWarn('Scanner started successfully');
        }

        // Clear the promise ref once it's resolved
        startPromiseRef.current = null;

      } catch (err) {
        addDebugInfo(`Failed to start scanner: ${err.message}`);
        logError('Failed to start scanner:', err);
        if (!hasUnmountedRef.current) {
          let errorMessage = 'Failed to start camera. ';

          if (err.message && err.message.includes('Permission')) {
            errorMessage += 'Please check camera permissions in your browser settings.';
          } else if (err.message && err.message.includes('No cameras')) {
            errorMessage += err.message;
          } else if (err.message && err.message.includes('NotAllowed')) {
            errorMessage += 'Camera access was denied. Please allow camera access and try again.';
          } else {
            errorMessage += err.message || 'Please check camera permissions and try again.';
          }

          setError(errorMessage);
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
    setPermissionDenied(false);
    setDebugInfo('');
    setContainerReady(false);
    isRunningRef.current = false; // Reset scanner state for retry
  };

  const handleClose = async () => {
    // Stop the scanner before closing
    await stopScanner();
    onClose();
  };

  const handleOpenSettings = () => {
    // Provide browser-specific instructions
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';

    if (userAgent.includes('chrome')) {
      instructions = 'Chrome: Click the camera icon in the address bar or go to Settings > Privacy and security > Site settings > Camera';
    } else if (userAgent.includes('firefox')) {
      instructions = 'Firefox: Click the lock icon in the address bar and adjust camera permissions';
    } else if (userAgent.includes('safari')) {
      instructions = 'Safari: Go to Safari > Settings > Websites > Camera and allow access for this site';
    } else if (userAgent.includes('brave')) {
      instructions = 'Brave: Click the lock icon in the address bar or go to Settings > Privacy and security > Site settings > Camera';
    } else {
      instructions = 'Please check your browser settings to allow camera access for this website';
    }

    alert(instructions);
  };

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing camera...</Text>
          <Text style={styles.loadingSubtext}>Please allow camera access when prompted</Text>
          {debugInfo && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info:</Text>
              <Text style={styles.debugText}>{debugInfo}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          {permissionDenied && (
            <TouchableOpacity
              style={[styles.settingsButton, { backgroundColor: theme.primary }]}
              onPress={handleOpenSettings}
            >
              <Text style={styles.settingsButtonText}>How to Enable Camera</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.primary }]}
            onPress={handleClose}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Cancel</Text>
          </TouchableOpacity>
          {debugInfo && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info:</Text>
              <Text style={styles.debugText}>{debugInfo}</Text>
            </View>
          )}
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
        <Text style={styles.scannerNote}>
          The camera view will appear in a popup window
        </Text>
      </View>
      {/* Scanner is rendered in a temporary div element created above */}
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>Camera view is active</Text>
        <Text style={styles.placeholderSubtext}>Position your QR code in front of the camera</Text>
      </View>
      <View style={styles.buttonContainer}>
        <ModalButton
          theme={theme}
          variant="secondary"
          label="Cancel"
          onPress={handleClose}
          fullWidth
        />
      </View>
      {debugInfo && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>
      )}
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
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
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
    marginBottom: 4,
  },
  scannerNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  placeholderContainer: {
    width: '100%',
    maxWidth: 500,
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
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
    maxWidth: 600,
  },
  errorText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  settingsButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    maxWidth: '100%',
    width: 500,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000',
  },
  debugText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
  },
});

export default WebQRScanner;