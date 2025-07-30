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
import { BuyMeCoffeeButton, Logo } from '../..';

const SupportModal = ({
  visible,
  onClose,
  getAndroidModalBottomHeight,
  insets,
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
          <View style={{ backgroundColor: '#5C7E9D', height: StatusBar.currentHeight || 24 }} />
        )}
        <SafeAreaView style={{ backgroundColor: '#5C7E9D' }}>
          <View style={[styles.modalHeader, { backgroundColor: '#5C7E9D' }]}>
            <View style={styles.headerLeft}>
              <Icon name="favorite" size={24} color="white" style={styles.headerIcon} />
              <Text style={[styles.modalTitle, { color: 'white' }]}>Support StackMap</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        <View style={{ flex: 1, backgroundColor: '#f0f4f8' }}>
          <ScrollView style={styles.supportContent}>
            <View style={styles.supportHeader}>
              <Logo size={80} color="#5C7E9D" style={{ marginBottom: 16 }} />
              <Text style={styles.supportTitle}>Support StackMap!</Text>
              <Text style={styles.supportSubtitle}>
                Made with love for families everywhere ✨
              </Text>
            </View>
            
            <View style={styles.supportMessageBox}>
              <Text style={[styles.supportMessage, { fontSize: 17, marginBottom: 16 }]}>
                StackMap is completely free and always will be! 🎉 We're built by a small team who believes every family deserves amazing tools. While the app is free, your contributions help cover the costs of keeping it running for everyone.
              </Text>
              <Text style={[styles.supportMessage, { fontSize: 16, textAlign: 'left', marginBottom: 8 }]}>
                Specifically your contributions help fund:
              </Text>
              <Text style={[styles.supportMessage, { fontSize: 15, textAlign: 'left', paddingLeft: 16 }]}>
                • Keeping the app 100% free with no ads or data collection{'\n'}
                • Maintaining codebase and secure cloud sync servers{'\n'}
                • Continuing development on new features and services{'\n'}
                • Ongoing support to families who need it
              </Text>
              {Platform.OS === 'web' && (
                <View style={{ marginTop: 20, alignItems: 'center' }}>
                  <BuyMeCoffeeButton 
                    style="button"
                    theme={{ primary: '#5C7E9D' }}
                    textStyle={{ fontSize: 18 }}
                  />
                </View>
              )}
            </View>
            
            <View style={styles.supportWaysSection}>
              <Text style={styles.supportSectionTitle}>Other Amazing Ways You Can Help! 🌟</Text>
              
              <View style={styles.supportOptionFun}>
                <Text style={styles.supportIconBig}>🎆</Text>
                <View style={styles.supportOptionContent}>
                  <Text style={styles.supportOptionTitleFun}>Rate & Review Us!</Text>
                  <Text style={styles.supportOptionTextFun}>
                    App Store reviews help other families discover StackMap. Your 5-star review makes our day! ⭐⭐⭐⭐⭐
                  </Text>
                </View>
              </View>
              
              <View style={styles.supportOptionFun}>
                <Text style={styles.supportIconBig}>📣</Text>
                <View style={styles.supportOptionContent}>
                  <Text style={styles.supportOptionTitleFun}>Spread the Word!</Text>
                  <Text style={styles.supportOptionTextFun}>
                    Tell friends, family, therapists, and support groups. Word of mouth is our superpower! 💪
                  </Text>
                </View>
              </View>
              
              <View style={styles.supportOptionFun}>
                <Text style={styles.supportIconBig}>💬</Text>
                <View style={styles.supportOptionContent}>
                  <Text style={styles.supportOptionTitleFun}>Send Us Your Stories!</Text>
                  <Text style={styles.supportOptionTextFun}>
                    We love hearing how StackMap helps your family! Your feedback guides everything we build. 💙
                  </Text>
                </View>
              </View>
              
              <View style={styles.supportOptionFun}>
                <Text style={styles.supportIconBig}>💡</Text>
                <View style={styles.supportOptionContent}>
                  <Text style={styles.supportOptionTitleFun}>Share Your Ideas!</Text>
                  <Text style={styles.supportOptionTextFun}>
                    Got ideas for new features? We're all ears! Email us anytime. 🚀
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.supportContactBox}>
              <Text style={styles.supportContactTitle}>Questions? We're Here! 😊</Text>
              <Text style={styles.supportContactText}>
                Email us at support@stackmap.app
              </Text>
            </View>
            
            
            <View style={styles.supportFooter}>
              <Text style={styles.supportFooterText}>
                Thank you for being part of our amazing community! 🌈
              </Text>
            </View>
          </ScrollView>
        </View>
        <SafeAreaView style={{ backgroundColor: '#f0f4f8' }} />
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: '#f0f4f8', height: getAndroidModalBottomHeight(insets) }} />
        )}
      </View>
    </Modal>
  );
};

export default React.memo(SupportModal);