import React, { useRef, useEffect, useState } from 'react';
import { Text } from '../../Typography';
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
import { THEMES } from '../../../constants';
import { styles } from './styles';
import { BUILD_VERSION } from '../../../utils/version';

const PreferencesModal = ({
  visible,
  onClose,
  theme,
  insets,
  // State
  currentTheme,
  setCurrentTheme,
  preferencesScrollKey,
  setPreferencesScrollKey,
  // Actions
  onSaveTheme,
  onPrivacyPress,
  onSupportPress,
  // Android specific
  getAndroidModalBottomHeight,
}) => {
  const preferencesScrollRef = useRef(null);
  
  // Safety check: ensure theme is valid
  const safeTheme = theme && theme.primary && theme.dark && theme.light 
    ? theme 
    : THEMES.stackBlue;

  const handleThemeChange = color => {
    // Safety check: ensure the theme exists
    if (!THEMES[color]) {
//       console.error(`Cannot set invalid theme: "${color}"`);
      return;
    }
    setCurrentTheme(color);
    onSaveTheme(color);
  };

  const renderContent = () => (
    <>
      {/* Single Consolidated Panel */}
      <View style={styles.section}>
        {/* Header */}
        <View style={styles.standardTabContainer}>
          <Icon name="palette" size={48} color={safeTheme.primary} />
          <Text style={styles.standardTabTitle}>Theme</Text>
          <Text style={styles.standardTabDescription}>
            Choose your preferred color theme
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />
        <View style={styles.colorGrid}>
          {(() => {
            // Put stackBlue (default) first, then all other themes
            const themeKeys = Object.keys(THEMES);
            const reorderedThemes = [
              'stackBlue',
              ...themeKeys.filter(key => key !== 'stackBlue'),
            ];

            // Only show first 20 themes (4x5 grid)
            return reorderedThemes.slice(0, 20).map(color => {
              // Safety check: ensure the theme exists before rendering
              if (!color || !THEMES[color]) {
//                 
                return null;
              }
              
              // Validate currentTheme to prevent comparison issues
              const isSelected = currentTheme && THEMES[currentTheme] 
                ? currentTheme === color 
                : false;
              
              return (
                <View
                  key={color}
                  style={{ width: '20%', padding: 5, alignItems: 'center' }}
                >
                  <TouchableOpacity
                    style={[
                      styles.colorOption,
                      { backgroundColor: THEMES[color].primary },
                      isSelected && styles.colorSelected,
                    ]}
                    onPress={() => handleThemeChange(color)}
                  >
                    {isSelected && (
                      <Icon name="check" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                </View>
              );
            }).filter(Boolean);
          })()}
        </View>
      </View>

      {/* Info Section */}
      <View style={[styles.section, styles.infoSection]}>
        <TouchableOpacity style={styles.infoButton} onPress={onPrivacyPress}>
          <Text style={styles.infoButtonText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.infoButton} onPress={onSupportPress}>
          <Text style={styles.infoButtonText}>Support Us</Text>
        </TouchableOpacity>
      </View>

      {/* Version Number - Subtle display at bottom */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>v{BUILD_VERSION}</Text>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
      onShow={() => {
        // Force layout update on Android to fix scrolling
        if (Platform.OS === 'android') {
          setTimeout(() => {
            setPreferencesScrollKey(prev => prev + 1);
          }, 0);
        }
      }}
    >
      {Platform.OS === 'android' && (
        <StatusBar
          backgroundColor={safeTheme.primary}
          barStyle="light-content"
          translucent={false}
        />
      )}
      <View style={[styles.modalContainer, { backgroundColor: safeTheme.light }]}>
        {Platform.OS === 'android' && (
          <View
            style={{
              backgroundColor: safeTheme.primary,
              height: StatusBar.currentHeight || 24,
            }}
          />
        )}
        <SafeAreaView style={{ backgroundColor: safeTheme.primary }}>
          <View
            style={[styles.modalHeader, { backgroundColor: safeTheme.primary }]}
          >
            <View style={styles.headerLeft}>
              <Icon
                name="palette"
                size={24}
                color="white"
                style={styles.headerIcon}
              />
              <Text style={styles.modalTitle}>Theme</Text>
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

        <View style={{ flex: 1, backgroundColor: safeTheme.light }}>
          {/* Use FlatList wrapper for better Android performance */}
          <FlatList
            ref={preferencesScrollRef}
            key={preferencesScrollKey}
            data={[{ key: 'content' }]}
            renderItem={() => (
              <View style={styles.modalContent}>{renderContent()}</View>
            )}
            keyExtractor={item => item.key}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </View>
        <SafeAreaView style={{ backgroundColor: safeTheme.light }} />
        {Platform.OS === 'android' && (
          <View
            style={{
              backgroundColor: safeTheme.light,
              height: Math.max(insets.bottom, 20),
            }}
          />
        )}
      </View>
    </Modal>
  );
};

export default React.memo(PreferencesModal);
