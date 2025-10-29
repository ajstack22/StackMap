import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, TextInput } from '../../../Typography';
import { ModalButton } from '../../../ModalUtilities';
import SyncQRScanner from '../../../Modals/DataModal/SyncQRScanner';

import { styles } from '../styles';

const SyncImportScreen = ({
  theme,
  recoveryPhrase,
  setRecoveryPhrase,
  syncLoading,
  syncError,
  isImporting,
  importError,
  onImport,
}) => {
  // State for QR scanner modal
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Handle successful QR code scan
  const handleQRScanSuccess = (syncKey) => {
    setRecoveryPhrase(syncKey);
    setShowQRScanner(false);
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Join Sync Group</Text>
      <Text style={styles.subtitle}>
        Enter your recovery phrase to join sync
      </Text>

      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          placeholder="Recovery Phrase (32 characters)"
          value={recoveryPhrase}
          onChangeText={setRecoveryPhrase}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <ModalButton
          theme={theme}
          variant="secondary"
          label="Scan QR Code"
          icon="qr-code-scanner"
          onPress={() => setShowQRScanner(true)}
          fullWidth
          style={{ marginTop: 12 }}
        />
      </View>

    {(syncLoading || isImporting) && (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.processingText}>
          {isImporting ? 'Joining sync...' : 'Validating recovery phrase...'}
        </Text>
        <Text style={styles.processingSubtext}>This may take a moment</Text>
      </View>
    )}

    {(syncError || importError) && (
      <Text style={styles.errorText}>{syncError || importError}</Text>
    )}

    <View style={styles.optionsContainer}>
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.primary }]}
        onPress={onImport}
        disabled={isImporting || !recoveryPhrase || recoveryPhrase.length !== 32}
      >
        <Text style={styles.buttonText}>Join Sync</Text>
      </TouchableOpacity>
    </View>

    {/* QR Scanner Modal */}
    <SyncQRScanner
      visible={showQRScanner}
      onClose={() => setShowQRScanner(false)}
      onScanSuccess={handleQRScanSuccess}
      theme={theme}
    />
  </View>
  );
};

export default SyncImportScreen;