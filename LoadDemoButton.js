import React from 'react';
import { TouchableOpacity, View, Alert, Platform } from 'react-native';
import { Text } from './src/components/Typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { loadDemoData, clearExistingData, getDemoSummary } from './scripts/load-demo-data';

/**
 * Demo Data Load Button Component
 * 
 * Adds a button to load comprehensive demo data for testing and screenshots.
 * Place this in your app where convenient during development.
 */
const LoadDemoButton = ({ onDataLoaded, theme = { primary: '#4CAF50' } }) => {
  const handleLoadDemo = async () => {
    const confirmMessage = `This will replace all current data with demo content:
    
• 3 Users (Alex, Maya, Sam)
• 12 activities for Alex
• Template libraries for each user
• Different themes per user

Continue?`;

    const handleConfirm = async () => {
      try {
        // Clear existing data first
        await clearExistingData(AsyncStorage);
        
        // Load demo data
        const success = await loadDemoData(AsyncStorage);
        
        if (success) {
          // Show success message
          const summary = getDemoSummary();
          const successMessage = `Demo data loaded successfully!

👥 ${summary.totalUsers} users created
📋 ${summary.features.completedActivities}/${summary.users[0].activities} activities
📚 ${summary.users.reduce((acc, u) => acc + u.libraryCategories, 0)} library categories
🎨 ${summary.features.themes.length} different themes

Restart the app to see changes.`;

          if (Platform.OS === 'web') {
            alert(successMessage);
            if (onDataLoaded) {
              onDataLoaded();
            } else {
              // Reload the page on web
              window.location.reload();
            }
          } else {
            Alert.alert('Success', successMessage, [
              { 
                text: 'OK', 
                onPress: () => {
                  if (onDataLoaded) {
                    onDataLoaded();
                  }
                }
              }
            ]);
          }
        }
      } catch (error) {
        const errorMessage = `Failed to load demo data: ${error.message}`;
        if (Platform.OS === 'web') {
          alert(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    };

    // Show confirmation dialog
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        handleConfirm();
      }
    } else {
      Alert.alert(
        'Load Demo Data',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Load Demo', onPress: handleConfirm, style: 'destructive' }
        ]
      );
    }
  };

  return (
    <TouchableOpacity
      onPress={handleLoadDemo}
      style={{
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 100 : 80,
        right: 20,
        backgroundColor: theme.primary || '#4CAF50',
        borderRadius: 28,
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        zIndex: 1000
      }}
    >
      <Icon name="science" size={24} color="white" />
    </TouchableOpacity>
  );
};

/**
 * Inline Demo Loader (for development toolbar)
 */
export const InlineDemoLoader = ({ theme }) => {
  const handleQuickLoad = async (userName) => {
    try {
      const { getUserData } = require('./scripts/load-demo-data');
      const userData = getUserData(userName);
      
      if (userData) {
        // Load specific user's data
        await AsyncStorage.setItem('stackmap_currentUser', `user-${userName.toLowerCase()}`);
        await AsyncStorage.setItem('stackmap_activities', JSON.stringify(userData.activities));
        
        const message = `Loaded ${userName}'s data: ${userData.activities.length} activities`;
        if (Platform.OS === 'web') {
          alert(message);
          window.location.reload();
        } else {
          Alert.alert('Demo Data', message, [
            { text: 'OK', onPress: () => require('react-native').DevSettings.reload() }
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading demo user:', error);
    }
  };

  return (
    <View style={{ 
      flexDirection: 'row', 
      gap: 10, 
      padding: 10,
      backgroundColor: 'rgba(0,0,0,0.05)',
      borderRadius: 8
    }}>
      <Text style={{ fontSize: 12, color: '#666' }}>Load Demo:</Text>
      {['Alex', 'Maya', 'Sam'].map(name => (
        <TouchableOpacity 
          key={name}
          onPress={() => handleQuickLoad(name)}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            backgroundColor: theme.primary,
            borderRadius: 4
          }}
        >
          <Text style={{ fontSize: 12, color: 'white' }}>{name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default LoadDemoButton;