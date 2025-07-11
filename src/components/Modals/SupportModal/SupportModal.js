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
          <View style={{ backgroundColor: '#ff6b9d', height: StatusBar.currentHeight || 24 }} />
        )}
        <SafeAreaView style={{ backgroundColor: '#ff6b9d' }}>
          <View style={[styles.modalHeader, { backgroundColor: '#ff6b9d' }]}>
            <Text style={[styles.modalTitle, { color: 'white' }]}>Support StackMap 💖</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        <View style={{ flex: 1, backgroundColor: '#fff5f8' }}>
          <ScrollView style={styles.supportContent}>
            <View style={styles.supportHeader}>
              <Text style={styles.supportHeart}>💖</Text>
              <Text style={styles.supportTitle}>Support StackMap!</Text>
              <Text style={styles.supportSubtitle}>
                Made with love for families everywhere ✨
              </Text>
            </View>
            
            <View style={styles.supportMessageBox}>
              <Text style={styles.supportMessage}>
                StackMap is completely free and always will be! 🎉 We're built by a small team who believes every family deserves amazing tools.
              </Text>
            </View>
            
            <View style={styles.supportWaysSection}>
              <Text style={styles.supportSectionTitle}>Amazing Ways You Can Help! 🌟</Text>
              
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
                    We love hearing how StackMap helps your family! Your feedback guides everything we build. 💜
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
        <SafeAreaView style={{ backgroundColor: '#fff5f8' }} />
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: '#fff5f8', height: getAndroidModalBottomHeight(insets) }} />
        )}
      </View>
    </Modal>
  );
};

export default React.memo(SupportModal);