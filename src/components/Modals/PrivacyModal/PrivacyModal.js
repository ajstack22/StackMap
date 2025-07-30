import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';
import { BuyMeCoffeeButton } from '../..';

const PrivacyModal = ({
  visible,
  onClose,
  getAndroidModalBottomHeight,
  insets,
  onShowSupport,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.modalContainer}>
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: '#2c3e50', height: StatusBar.currentHeight || 24 }} />
        )}
        <SafeAreaView style={{ backgroundColor: '#2c3e50' }}>
          <View style={[styles.modalHeader, { backgroundColor: '#2c3e50' }]}>
            <Text style={[styles.modalTitle, { color: 'white' }]}>Privacy Policy</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
          <ScrollView style={styles.privacyContent}>
            <View style={styles.privacyHeader}>
              <Text style={styles.privacyTitle}>Privacy Policy</Text>
              <Text style={styles.privacyDate}>
                Last updated: June 18, 2025
              </Text>
            </View>
            
            <View style={styles.privacySection}>
              <Text style={styles.privacySubtitle}>Overview</Text>
              <Text style={styles.privacyText}>
                StackMap is designed with privacy as a core principle. We believe families, especially those with special needs children, deserve tools that respect their privacy and give them control over their data.
              </Text>
            </View>
            
            <View style={styles.privacySection}>
              <Text style={styles.privacySubtitle}>Data Collection</Text>
              <Text style={styles.privacyText}>
                <Text style={styles.privacyBold}>We collect NO personal data by default.</Text> StackMap works entirely offline on your device.
              </Text>
            </View>
            
            <View style={styles.privacySection}>
              <Text style={styles.privacySubtitle}>Data Storage</Text>
              <View style={styles.privacyList}>
                <Text style={styles.privacyListItem}>• All routine data is stored locally on your device</Text>
                <Text style={styles.privacyListItem}>• No data is sent to our servers</Text>
                <Text style={styles.privacyListItem}>• Your routines, progress, and settings stay on your device</Text>
              </View>
            </View>
            
            <View style={styles.privacySection}>
              <Text style={styles.privacySubtitle}>Children's Privacy</Text>
              <Text style={styles.privacyText}>
                StackMap is designed for use by children with adult supervision:
              </Text>
              <View style={styles.privacyList}>
                <Text style={styles.privacyListItem}>• We don't collect any information from children</Text>
                <Text style={styles.privacyListItem}>• No accounts or sign-ups required</Text>
                <Text style={styles.privacyListItem}>• No social features or communication between users</Text>
                <Text style={styles.privacyListItem}>• No behavioral tracking or analytics</Text>
              </View>
            </View>
            
            <View style={styles.privacySection}>
              <Text style={styles.privacySubtitle}>Third-Party Services</Text>
              <Text style={styles.privacyText}>StackMap uses minimal third-party services:</Text>
              <View style={styles.privacyList}>
                <Text style={styles.privacyListItem}>• <Text style={styles.privacyBold}>No analytics</Text> - We don't track usage</Text>
                <Text style={styles.privacyListItem}>• <Text style={styles.privacyBold}>No advertising</Text> - We don't show ads</Text>
                <Text style={styles.privacyListItem}>• <Text style={styles.privacyBold}>No external APIs</Text> - Everything runs locally</Text>
              </View>
            </View>
            
            <View style={styles.privacySection}>
              <Text style={styles.privacySubtitle}>Your Rights</Text>
              <Text style={styles.privacyText}>You have complete control:</Text>
              <View style={styles.privacyList}>
                <Text style={styles.privacyListItem}>• Export your data anytime</Text>
                <Text style={styles.privacyListItem}>• Delete your data anytime</Text>
                <Text style={styles.privacyListItem}>• Use the app without any account</Text>
                <Text style={styles.privacyListItem}>• Sync is always optional</Text>
              </View>
            </View>
            
            <View style={styles.privacySection}>
              <Text style={styles.privacySubtitle}>Contact</Text>
              <Text style={styles.privacyText}>
                Questions about privacy? Email: privacy@stackmap.app
              </Text>
            </View>
            
            <View style={styles.privacyFooter}>
              <Text style={styles.privacyFooterText}>
                StackMap's code is open source. You can verify our privacy practices at: github.com/ajstack22/StackMap
              </Text>
            </View>
            
            {Platform.OS === 'web' && (
              <View style={[styles.privacySection, { backgroundColor: '#f0f8ff', padding: 20, marginTop: 20, borderRadius: 12 }]}>
                <Text style={[styles.privacySubtitle, { textAlign: 'center' }]}>Keep StackMap Free & Private</Text>
                <Text style={[styles.privacyText, { textAlign: 'center', marginTop: 8 }]}>
                  We don't sell data or show ads. Your support helps us maintain our privacy-first approach while keeping StackMap free for families who need it.
                </Text>
                <View style={{ marginTop: 16, alignItems: 'center' }}>
                  <BuyMeCoffeeButton 
                    style="button"
                    theme={{ primary: '#3498db' }}
                    onPress={onShowSupport}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </View>
        <SafeAreaView style={{ backgroundColor: '#f8f9fa' }} />
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: '#f8f9fa', height: getAndroidModalBottomHeight(insets) }} />
        )}
      </View>
    </Modal>
  );
};

export default React.memo(PrivacyModal);