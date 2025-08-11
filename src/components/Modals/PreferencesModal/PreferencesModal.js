import React, { useRef, useEffect } from 'react';
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

const PreferencesModal = ({
  visible,
  onClose,
  theme,
  insets,
  // State
  currentTheme,
  setCurrentTheme,
  bannerPosition,
  setBannerPosition,
  displayMode,
  setDisplayMode,
  taskCelebration,
  setTaskCelebration,
  routineCelebration,
  setRoutineCelebration,
  preferencesScrollKey,
  setPreferencesScrollKey,
  // Actions
  onSaveTheme,
  onSaveBannerPosition,
  onSaveDisplayMode,
  onSaveCelebration,
  onPrivacyPress,
  onSupportPress,
  // Android specific
  getAndroidModalBottomHeight,
}) => {
  const preferencesScrollRef = useRef(null);
  
  const handleThemeChange = (color) => {
    setCurrentTheme(color);
    onSaveTheme(color);
  };

  const handleBannerPositionChange = (position) => {
    setBannerPosition(position);
    onSaveBannerPosition(position);
  };

  const handleDisplayModeChange = (mode) => {
    setDisplayMode(mode);
    onSaveDisplayMode(mode);
  };

  const handleTaskCelebrationChange = (celebration) => {
    setTaskCelebration(celebration);
    onSaveCelebration('task', celebration);
  };

  const handleRoutineCelebrationChange = (celebration) => {
    setRoutineCelebration(celebration);
    onSaveCelebration('routine', celebration);
  };

  const renderContent = () => (
    <>
      {/* Theme Color Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme Color</Text>
        <View style={styles.colorGrid}>
        {(() => {
          // Put stackBlue (default) first, then all other themes
          const themeKeys = Object.keys(THEMES);
          const reorderedThemes = ['stackBlue', ...themeKeys.filter(key => key !== 'stackBlue')];
          
          // Only show first 20 themes (4x5 grid)
          return reorderedThemes.slice(0, 20).map((color) => (
          <View key={color} style={{ width: '20%', padding: 5, alignItems: 'center' }}>
            <TouchableOpacity
              style={[
                styles.colorOption,
                { backgroundColor: THEMES[color].primary },
                currentTheme === color && styles.colorSelected
              ]}
              onPress={() => handleThemeChange(color)}
            >
              {currentTheme === color && (
                <Icon name="check" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        ))
      })()}
        </View>
      </View>
      
      {/* Banner Position Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Banner Position</Text>
        <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggle, bannerPosition === 'top' && styles.toggleActive]}
          onPress={() => handleBannerPositionChange('top')}
        >
          <Text style={[styles.toggleText, bannerPosition === 'top' && styles.toggleTextActive]}>
            Top
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggle, bannerPosition === 'bottom' && styles.toggleActive]}
          onPress={() => handleBannerPositionChange('bottom')}
        >
          <Text style={[styles.toggleText, bannerPosition === 'bottom' && styles.toggleTextActive]}>
            Bottom
          </Text>
        </TouchableOpacity>
        </View>
      </View>
      
      {/* Display Mode Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Display</Text>
        <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggle, displayMode === 'none' && styles.toggleActive]}
          onPress={() => handleDisplayModeChange('none')}
        >
          <Text style={[styles.toggleText, displayMode === 'none' && styles.toggleTextActive]}>
            None
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggle, displayMode === 'numbers' && styles.toggleActive]}
          onPress={() => handleDisplayModeChange('numbers')}
        >
          <Text style={[styles.toggleText, displayMode === 'numbers' && styles.toggleTextActive]}>
            Numbers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggle, displayMode === 'time' && styles.toggleActive]}
          onPress={() => handleDisplayModeChange('time')}
        >
          <Text style={[styles.toggleText, displayMode === 'time' && styles.toggleTextActive]}>
            Time
          </Text>
        </TouchableOpacity>
        </View>
      </View>
      
      {/* Celebrations Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Task Celebration</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.celebrationScrollView}>
        <View style={styles.celebrationOptions}>
          {['none', 'random', 'rainbow', 'blue', 'orange', 'pink', 'purple', 'gold', 'green'].map((celebration) => (
            <TouchableOpacity
              key={celebration}
              style={[
                styles.celebrationOption,
                taskCelebration === celebration && [styles.celebrationActive, { backgroundColor: theme.primary, borderColor: theme.primary }]
              ]}
              onPress={() => handleTaskCelebrationChange(celebration)}
            >
              <Text style={[
                styles.celebrationText,
                taskCelebration === celebration && styles.celebrationTextActive
              ]}>
                {celebration.charAt(0).toUpperCase() + celebration.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        </ScrollView>
        
        <Text style={styles.sectionTitle}>Routine Celebration</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.celebrationScrollView}>
        <View style={styles.celebrationOptions}>
          {['none', 'random', 'rainbow', 'blue', 'orange', 'pink', 'purple', 'gold', 'green'].map((celebration) => (
            <TouchableOpacity
              key={celebration}
              style={[
                styles.celebrationOption,
                routineCelebration === celebration && [styles.celebrationActive, { backgroundColor: theme.primary, borderColor: theme.primary }]
              ]}
              onPress={() => handleRoutineCelebrationChange(celebration)}
            >
              <Text style={[
                styles.celebrationText,
                routineCelebration === celebration && styles.celebrationTextActive
              ]}>
                {celebration.charAt(0).toUpperCase() + celebration.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        </ScrollView>
      </View>
      
      {/* Info Section */}
      <View style={[styles.section, styles.infoSection]}>
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={onPrivacyPress}
        >
          <Text style={styles.infoButtonText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={onSupportPress}
        >
          <Text style={styles.infoButtonText}>Support Us</Text>
        </TouchableOpacity>
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
          backgroundColor={theme.primary} 
          barStyle="light-content" 
          translucent={false}
        />
      )}
      <View style={[styles.modalContainer, { backgroundColor: theme.light }]}>
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.primary, height: StatusBar.currentHeight || 24 }} />
        )}
        <SafeAreaView style={{ backgroundColor: theme.primary }}>
          <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
            <View style={styles.headerLeft}>
              <Icon name="palette" size={24} color="white" style={styles.headerIcon} />
              <Text style={styles.modalTitle}>Preferences</Text>
            </View>
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
        
        <View style={{ flex: 1, backgroundColor: theme.light }}>
          {/* Use FlatList wrapper for better Android performance */}
          <FlatList
            ref={preferencesScrollRef}
            key={preferencesScrollKey}
            data={[{ key: 'content' }]}
            renderItem={() => (
              <View style={styles.modalContent}>
                {renderContent()}
              </View>
            )}
            keyExtractor={item => item.key}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </View>
        <SafeAreaView style={{ backgroundColor: theme.light }} />
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.light, height: Math.max(insets.bottom, 20) }} />
        )}
      </View>
    </Modal>
  );
};

export default React.memo(PreferencesModal);