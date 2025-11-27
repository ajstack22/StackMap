import React from 'react';
import { Text } from '../../Typography';
import {
  Modal,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LibraryTabContent from '../ActivityManagementModal/LibraryTabContent';

const ActivityLibraryModal = ({
  visible,
  onClose,
  theme,
  categories,
  onSaveCategories,
  onSelectActivity,
  onSelectMultipleActivities,
  showToast,
  stackMapLibrary,
  myLibrary,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      {Platform.OS === 'android' && (
        <StatusBar
          backgroundColor={theme.primary}
          barStyle="light-content"
          translucent={false}
        />
      )}
      <View style={{ flex: 1, backgroundColor: theme.primary }}>
        {Platform.OS === 'android' && (
          <View
            style={{
              backgroundColor: theme.primary,
              height: StatusBar.currentHeight || 24,
            }}
          />
        )}

        <SafeAreaView style={{ flex: 1, backgroundColor: theme.primary }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: theme.primary,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon
                name="bookmark"
                size={24}
                color="white"
                style={{ marginRight: 12 }}
              />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: 'white',
                }}
              >
                Activity Library
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

          {/* Content */}
          <View style={{ flex: 1, backgroundColor: theme.light }}>
            <LibraryTabContent
              theme={theme}
              categories={categories}
              onSaveCategories={onSaveCategories}
              onSelectActivity={onSelectActivity}
              onSelectMultipleActivities={onSelectMultipleActivities}
              showToast={showToast}
              stackMapLibrary={stackMapLibrary}
              myLibrary={myLibrary}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default ActivityLibraryModal;
