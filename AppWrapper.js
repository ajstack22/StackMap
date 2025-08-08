import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';

// Splash screen component that shows immediately
const SplashScreen = () => (
  <View style={{ 
    flex: 1, 
    backgroundColor: '#5C7E9D', 
    justifyContent: 'center', 
    alignItems: 'center' 
  }}>
    <ActivityIndicator size="large" color="#FFFFFF" />
  </View>
);

// Main app wrapper that lazy loads the actual App
const AppWrapper = () => {
  const [AppComponent, setAppComponent] = useState(null);
  
  useEffect(() => {
    // Lazy load the main App and its heavy dependencies
    const loadApp = async () => {
      console.log('[AppWrapper] Starting lazy load at', Date.now());
      
      // Load the main App component asynchronously
      const { default: App } = await import('./App');
      
      console.log('[AppWrapper] App loaded at', Date.now());
      setAppComponent(() => App);
    };
    
    // Start loading immediately but don't block render
    loadApp();
  }, []);
  
  // Show splash while loading
  if (!AppComponent) {
    return <SplashScreen />;
  }
  
  // Render the actual app
  return <AppComponent />;
};

export default AppWrapper;