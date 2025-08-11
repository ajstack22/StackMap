import React from 'react';
import { Text } from './Typography';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TYPOGRAPHY, SPACING } from '../../constants';

const ModalHeader = ({
  title,
  icon,
  onClose,
  theme,
  leftAction,
  rightAction,
  subtitle,
}) => {
  return (
    <>
      {Platform.OS === 'android' && (
        <View style={{ backgroundColor: theme.primary, height: StatusBar.currentHeight || 24 }} />
      )}
      <SafeAreaView style={{ backgroundColor: theme.primary }}>
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <View style={styles.headerLeft}>
            {leftAction ? (
              leftAction
            ) : icon ? (
              <Icon name={icon} size={24} color="white" style={styles.headerIcon} />
            ) : null}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
          <View style={styles.headerRight}>
            {rightAction}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: SPACING.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    color: 'white',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginTop: 2,
  },
  closeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
});

export default ModalHeader;