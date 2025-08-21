import React, { useState, useRef } from 'react';
import { Text } from '../../Typography';
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';
import { BuyMeCoffeeButton, Logo } from '../..';
import { getAndroidModalBottomHeight } from '../../../utils/modalHelpers';

// Import team photo
const teamPhotoSource = require('../../../../image_library/StackMapTeam.jpg');

const SupportModal = ({ visible, onClose, insets }) => {
  const [scrollKey, setScrollKey] = useState(0);
  const scrollRef = useRef(null);

  const renderContent = () => (
    <>
      <View style={styles.supportMessageBox}>
        <View style={styles.supportHeader}>
          <Logo size={80} color="#5C7E9D" style={{ marginBottom: 8 }} />
          <Text style={styles.stackMapText}>StackMap</Text>
        </View>

        <Text
          style={[styles.supportMessage, { fontSize: 17, marginBottom: 20 }]}
        >
          StackMap is free and always will be. Built by parents, for families
          everywhere.
        </Text>

        <View style={styles.photoAndImpactContainer}>
          <View style={styles.photoContainer}>
            <Image
              source={Platform.OS === 'web' ? { uri: teamPhotoSource } : teamPhotoSource}
              style={styles.teamPhoto}
              resizeMode="contain"
            />
            <Text style={styles.teamCaption}>The StackMap Team</Text>
          </View>

          <View style={styles.impactWrapper}>
            <Text
              style={[
                styles.contributionHeader,
                { textAlign: 'left', paddingLeft: 0 },
              ]}
            >
              Your contributions help us provide:
            </Text>

            <View style={[styles.impactSection, { alignItems: 'flex-start' }]}>
              <View style={styles.impactRow}>
                <View style={styles.impactIcon}>
                  <Icon name="lock" size={24} color="#5C7E9D" />
                </View>
                <View style={styles.impactContent}>
                  <Text style={styles.impactTitle}>
                    Private & Ad-Free Solutions
                  </Text>
                  <Text style={styles.impactDescription}>
                    No ads, no tracking, your data stays yours
                  </Text>
                </View>
              </View>

              <View style={styles.impactRow}>
                <View style={styles.impactIcon}>
                  <Icon name="cloud" size={24} color="#5C7E9D" />
                </View>
                <View style={styles.impactContent}>
                  <Text style={styles.impactTitle}>Free Sync Service</Text>
                  <Text style={styles.impactDescription}>
                    Convenient family sync and provider sharing
                  </Text>
                </View>
              </View>

              <View style={styles.impactRow}>
                <View style={styles.impactIcon}>
                  <Icon name="favorite" size={24} color="#5C7E9D" />
                </View>
                <View style={styles.impactContent}>
                  <Text style={styles.impactTitle}>Ongoing Development</Text>
                  <Text style={styles.impactDescription}>
                    Continuous improvements & support
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        {Platform.OS === 'web' && (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <BuyMeCoffeeButton
              style="button"
              theme={{ primary: '#5C7E9D' }}
              textStyle={{ fontSize: 18 }}
            />
            <Text style={{ fontSize: 12, color: '#718096', marginTop: 8 }}>
              via Buy Me a Coffee
            </Text>
          </View>
        )}
      </View>

      <View style={styles.supportWaysSection}>
        <Text style={styles.supportSectionTitle}>Ways to Contribute</Text>

        <View style={styles.supportOptionsGrid}>
          <View style={styles.supportOptionFun}>
            <Text style={styles.supportIconBig}>🎆</Text>
            <View style={styles.supportOptionContent}>
              <Text style={styles.supportOptionTitleFun}>Leave a Review</Text>
              <Text style={styles.supportOptionTextFun}>
                Help other families find us
              </Text>
            </View>
          </View>

          <View style={styles.supportOptionFun}>
            <Text style={styles.supportIconBig}>📣</Text>
            <View style={styles.supportOptionContent}>
              <Text style={styles.supportOptionTitleFun}>Tell a Friend</Text>
              <Text style={styles.supportOptionTextFun}>
                Share with someone who could use StackMap
              </Text>
            </View>
          </View>

          <View style={styles.supportOptionFun}>
            <Text style={styles.supportIconBig}>💬</Text>
            <View style={styles.supportOptionContent}>
              <Text style={styles.supportOptionTitleFun}>Share Your Story</Text>
              <Text style={styles.supportOptionTextFun}>
                We'd love to hear how StackMap helps
              </Text>
            </View>
          </View>

          <View style={styles.supportOptionFun}>
            <Text style={styles.supportIconBig}>💡</Text>
            <View style={styles.supportOptionContent}>
              <Text style={styles.supportOptionTitleFun}>Send Ideas</Text>
              <Text style={styles.supportOptionTextFun}>
                What would make StackMap better for you?
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.supportContactBox}>
        <Text style={styles.supportContactTitle}>Get in Touch</Text>
        <Text style={styles.supportContactText}>support@stackmap.app</Text>
      </View>

      <View style={styles.supportFooter}>
        <Text style={styles.supportFooterText}>
          Thank you for being part of StackMap
        </Text>
      </View>
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
          backgroundColor="#5C7E9D"
          barStyle="light-content"
          translucent={false}
        />
      )}
      <View style={styles.modalContainer}>
        {Platform.OS === 'android' && (
          <View
            style={{
              backgroundColor: '#5C7E9D',
              height: StatusBar.currentHeight || 24,
            }}
          />
        )}
        <SafeAreaView style={{ backgroundColor: '#5C7E9D' }}>
          <View style={[styles.modalHeader, { backgroundColor: '#5C7E9D' }]}>
            <View style={styles.headerLeft}>
              <Icon
                name="favorite"
                size={24}
                color="white"
                style={styles.headerIcon}
              />
              <Text style={[styles.modalTitle, { color: 'white' }]}>
                Support
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="close" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <View style={{ flex: 1, backgroundColor: '#f0f4f8' }}>
          {Platform.OS === 'android' ? (
            <FlatList
              ref={scrollRef}
              key={scrollKey}
              data={[{ key: 'content' }]}
              renderItem={() => (
                <View style={{ padding: 20, paddingTop: 40 }}>
                  {renderContent()}
                </View>
              )}
              keyExtractor={item => item.key}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            />
          ) : (
            <ScrollView
              style={styles.supportContent}
              contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {renderContent()}
            </ScrollView>
          )}
        </View>
        <SafeAreaView style={{ backgroundColor: '#f0f4f8' }} />
        {Platform.OS === 'android' && (
          <View
            style={{
              backgroundColor: '#f0f4f8',
              height: getAndroidModalBottomHeight(insets),
            }}
          />
        )}
      </View>
    </Modal>
  );
};

export default React.memo(SupportModal);
