import React, { useState, useRef } from 'react';
import { Text } from '../Typography';
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  FlatList,
  
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';
import { BuyMeCoffeeButton } from '../..';
import { getAndroidModalBottomHeight } from '../../../utils/modalHelpers';

const PrivacyModal = ({
  visible,
  onClose,
  insets,
  onShowSupport,
}) => {
  const [scrollKey, setScrollKey] = useState(0);
  const scrollRef = useRef(null);

  const renderContent = () => (
    <>
      <View style={styles.privacyHeader}>
        <Text style={styles.privacyTitle}>Privacy Policy</Text>
        <Text style={styles.privacyDate}>
          Last updated: August 8, 2025
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
          <Text style={styles.privacyListItem}>• All routine data is stored locally on your device by default</Text>
          <Text style={styles.privacyListItem}>• No data is sent to our servers unless you enable sync</Text>
          <Text style={styles.privacyListItem}>• Your routines, progress, and settings stay on your device</Text>
        </View>
      </View>
      
      <View style={styles.privacySection}>
        <Text style={styles.privacySubtitle}>Zero-Knowledge Sync (Optional)</Text>
        <Text style={styles.privacyText}>
          If you choose to enable sync between devices:
        </Text>
        <View style={styles.privacyList}>
          <Text style={styles.privacyListItem}>• <Text style={styles.privacyBold}>Zero-knowledge architecture:</Text> Your data is encrypted on your device before syncing</Text>
          <Text style={styles.privacyListItem}>• <Text style={styles.privacyBold}>We cannot read your data:</Text> Only you have the decryption key</Text>
          <Text style={styles.privacyListItem}>• <Text style={styles.privacyBold}>Your sync key is your only access:</Text> If lost, data cannot be recovered</Text>
          <Text style={styles.privacyListItem}>• <Text style={styles.privacyBold}>Automatic cleanup:</Text> Inactive sync data is deleted after 6 months</Text>
          <Text style={styles.privacyListItem}>• <Text style={styles.privacyBold}>No accounts required:</Text> Sync works with just your recovery phrase</Text>
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
          <Text style={styles.privacyListItem}>• <Text style={styles.privacyBold}>No external APIs</Text> - Everything runs locally except optional sync</Text>
          <Text style={styles.privacyListItem}>• <Text style={styles.privacyBold}>Sync servers (optional)</Text> - Only store encrypted data you cannot decrypt</Text>
        </View>
      </View>
      
      <View style={styles.privacySection}>
        <Text style={styles.privacySubtitle}>Your Rights</Text>
        <Text style={styles.privacyText}>You have complete control:</Text>
        <View style={styles.privacyList}>
          <Text style={styles.privacyListItem}>• Export your data anytime</Text>
          <Text style={styles.privacyListItem}>• Delete your data anytime (local or synced)</Text>
          <Text style={styles.privacyListItem}>• Use the app without any account or sync</Text>
          <Text style={styles.privacyListItem}>• Sync is always optional and can be disabled</Text>
          <Text style={styles.privacyListItem}>• Request deletion of synced data via the app</Text>
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
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      onShow={() => {
        // Force layout update on Android to fix scrolling
        if (Platform.OS === 'android') {
          setTimeout(() => {
            setScrollKey(prev => prev + 1);
          }, 0);
        }
      }}
    >
      {Platform.OS === 'android' && (
        <StatusBar 
          backgroundColor="#2c3e50" 
          barStyle="light-content" 
          translucent={false}
        />
      )}
      <View style={styles.modalContainer}>
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: '#2c3e50', height: StatusBar.currentHeight || 24 }} />
        )}
        <SafeAreaView style={{ backgroundColor: '#2c3e50' }}>
          <View style={[styles.modalHeader, { backgroundColor: '#2c3e50' }]}>
            <Text style={[styles.modalTitle, { color: 'white' }]}>Privacy Policy</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon name="close" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
          {Platform.OS === 'android' ? (
            <FlatList
              ref={scrollRef}
              key={scrollKey}
              data={[{ key: 'content' }]}
              renderItem={() => (
                <View style={[styles.privacyContent, { flex: undefined }]}>
                  {renderContent()}
                </View>
              )}
              keyExtractor={item => item.key}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            />
          ) : (
            <ScrollView 
              style={styles.privacyContent}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {renderContent()}
            </ScrollView>
          )}
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