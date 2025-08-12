#!/usr/bin/env node

/**
 * Load Demo Data Script
 * 
 * This script loads demo data into StackMap for testing and screenshots.
 * It can be run directly or imported as a module.
 * 
 * Usage:
 *   node scripts/load-demo-data.js
 *   
 * Or in App.js:
 *   import { loadDemoData } from './scripts/load-demo-data';
 *   loadDemoData();
 */

const fs = require('fs');
const path = require('path');

// Demo data with illustrative content
const DEMO_DATA = require('../demo-data.json');

/**
 * Load demo data into AsyncStorage (for React Native)
 * This function can be imported and called from within the app
 */
const loadDemoData = async (AsyncStorage) => {
  try {
    console.log('📦 Loading demo data...');
    
    // Store each key separately as the app expects
    const dataToStore = {
      'stackmap_users': JSON.stringify(DEMO_DATA.users),
      'stackmap_currentUser': DEMO_DATA.currentUser,
      'stackmap_activities': JSON.stringify(DEMO_DATA.activities),
      'stackmap_myLibrary': JSON.stringify(DEMO_DATA.myLibrary),
      'stackmap_settings': JSON.stringify(DEMO_DATA.settings),
      'stackmap_syncData': JSON.stringify(DEMO_DATA.syncData),
      'stackmap_hasCompletedWelcome': 'true',
      'stackmap_version': '3'
    };
    
    // Store all data
    const promises = Object.entries(dataToStore).map(([key, value]) => 
      AsyncStorage.setItem(key, value)
    );
    
    await Promise.all(promises);
    
    console.log('✅ Demo data loaded successfully!');
    console.log('👥 Users: Alex (Developer), Maya (Artist), Sam (Chef)');
    console.log('📋 Alex has 12 activities for today (3 completed, 2 pinned)');
    console.log('📚 Each user has their own library templates');
    console.log('🎨 Different themes for each user');
    
    return true;
  } catch (error) {
    console.error('❌ Error loading demo data:', error);
    return false;
  }
};

/**
 * Clear existing data before loading demo
 */
const clearExistingData = async (AsyncStorage) => {
  try {
    console.log('🧹 Clearing existing data...');
    
    const keys = await AsyncStorage.getAllKeys();
    const stackmapKeys = keys.filter(key => key.startsWith('stackmap_'));
    
    if (stackmapKeys.length > 0) {
      await AsyncStorage.multiRemove(stackmapKeys);
      console.log(`  Cleared ${stackmapKeys.length} existing keys`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    return false;
  }
};

/**
 * Export individual user data for testing specific scenarios
 */
const getUserData = (userName) => {
  const userMap = {
    'alex': 'user-alex',
    'maya': 'user-maya',
    'sam': 'user-sam'
  };
  
  const userId = userMap[userName.toLowerCase()];
  if (!userId) {
    console.error(`User ${userName} not found. Available: alex, maya, sam`);
    return null;
  }
  
  return {
    user: DEMO_DATA.users[userId],
    activities: DEMO_DATA.activities.filter(a => a.userId === userId),
    library: DEMO_DATA.myLibrary[userId],
    settings: DEMO_DATA.settings[userId]
  };
};

/**
 * Generate a quick summary of the demo data
 */
const getDemoSummary = () => {
  const summary = {
    totalUsers: Object.keys(DEMO_DATA.users).length,
    users: Object.values(DEMO_DATA.users).map(u => ({
      name: u.name,
      icon: u.icon,
      theme: u.theme,
      activities: DEMO_DATA.activities.filter(a => a.userId === u.id).length,
      libraryCategories: DEMO_DATA.myLibrary[u.id]?.activityGroups?.length || 0
    })),
    features: {
      multiUser: true,
      sync: DEMO_DATA.syncData.syncEnabled,
      themes: [...new Set(Object.values(DEMO_DATA.users).map(u => u.theme))],
      pinnedActivities: DEMO_DATA.activities.filter(a => a.pinned).length,
      completedActivities: DEMO_DATA.activities.filter(a => a.completed).length
    }
  };
  
  return summary;
};

// Export for use in React Native app
module.exports = {
  loadDemoData,
  clearExistingData,
  getUserData,
  getDemoSummary,
  DEMO_DATA
};

// If run directly from command line
if (require.main === module) {
  console.log('StackMap Demo Data Loader');
  console.log('========================\n');
  
  const summary = getDemoSummary();
  console.log('📊 Demo Data Summary:');
  console.log(`   ${summary.totalUsers} Users Created`);
  
  summary.users.forEach(user => {
    console.log(`\n   ${user.icon} ${user.name}:`);
    console.log(`      Activities: ${user.activities}`);
    console.log(`      Library Categories: ${user.libraryCategories}`);
    console.log(`      Theme: ${user.theme}`);
  });
  
  console.log('\n📋 Features Demonstrated:');
  console.log(`   Multi-user: ${summary.features.multiUser ? '✅' : '❌'}`);
  console.log(`   Sync enabled: ${summary.features.sync ? '✅' : '❌'}`);
  console.log(`   Pinned activities: ${summary.features.pinnedActivities}`);
  console.log(`   Completed activities: ${summary.features.completedActivities}`);
  console.log(`   Themes: ${summary.features.themes.join(', ')}`);
  
  console.log('\n💡 To load this data in the app:');
  console.log('   1. Import in App.js:');
  console.log('      import { loadDemoData } from "./scripts/load-demo-data";');
  console.log('   2. Call in useEffect or button press:');
  console.log('      await loadDemoData(AsyncStorage);');
  console.log('   3. Restart the app to see changes');
}