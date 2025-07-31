import React from 'react';
import {
  Modal,
  View,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';

const ModalContainer = ({
  visible,
  onClose,
  children,
  theme,
  animationType = 'slide',
  transparent = false,
  presentationStyle = 'pageSheet',
}) => {
  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent={transparent}
      statusBarTranslucent={true}
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? presentationStyle : 'fullScreen'}
    >
      {Platform.OS === 'android' && (
        <StatusBar 
          backgroundColor={theme.primary} 
          barStyle="light-content" 
          translucent={false}
        />
      )}
      <View style={[styles.container, { backgroundColor: theme.light }]}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {children}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 1000,
    elevation: 1000,
  },
  keyboardAvoid: {
    flex: 1,
  },
});

export default ModalContainer;