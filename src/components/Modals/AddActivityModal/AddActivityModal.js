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
import AddTabContent from '../ActivityManagementModal/AddTabContent';

const AddActivityModal = ({
  visible,
  onClose,
  theme,
  onAddActivity,
  showToast,
  prefilledActivity = null,
  prefilledCategory = null,
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
                name="add-circle"
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
                Add Activity
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
            <AddTabContent
              theme={theme}
              onAddActivity={onAddActivity}
              showToast={showToast}
              prefilledActivity={prefilledActivity}
              prefilledCategory={prefilledCategory}
              onClose={onClose}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default AddActivityModal;
