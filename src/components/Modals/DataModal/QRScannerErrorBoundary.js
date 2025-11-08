import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { logError } from '../../../utils/logger';

/**
 * Error boundary specifically for the QR Scanner
 * Catches errors and displays a fallback UI instead of white screen
 */
class QRScannerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected error occurred'
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    logError('QR Scanner Error Boundary caught:', error, errorInfo);
  }

  handleClose = () => {
    // Reset error state and close
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  handleRetry = () => {
    // Reset error state to retry
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      const { theme = { primary: '#007AFF' } } = this.props;

      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Scanner Error</Text>
            <Text style={styles.errorText}>
              {this.state.errorMessage.includes('stop, scanner is not running')
                ? 'The camera scanner encountered an initialization error. Please try again.'
                : this.state.errorMessage}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={this.handleRetry}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.primary }]}
              onPress={this.handleClose}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    maxWidth: 400,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
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

export default QRScannerErrorBoundary;