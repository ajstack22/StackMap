import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, Platform, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BuyMeCoffeeButton = ({ 
  style = 'button', // 'button', 'link', 'widget'
  theme,
  containerStyle,
  textStyle,
  onPress, // Optional custom onPress handler
}) => {
  // Only render on web
  if (Platform.OS !== 'web') {

    return null;
  }

  // Widget style - loads the official Buy Me a Coffee widget script
  if (style === 'widget') {
    useEffect(() => {
      const script = document.createElement('script');
      const div = document.getElementById('buymeacoffee-widget');
      
      if (!div) return;

      script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js';
      script.setAttribute('data-name', 'bmc-button');
      script.setAttribute('data-slug', 'stackmap');
      script.setAttribute('data-color', '#5c7e9d');
      script.setAttribute('data-emoji', '💖');
      script.setAttribute('data-font', 'Comic');
      script.setAttribute('data-text', 'Help Keep StackMap Free');
      script.setAttribute('data-outline-color', '#ffffff');
      script.setAttribute('data-font-color', '#ffffff');
      script.setAttribute('data-coffee-color', '#FFDD00');
      
      script.async = true;
      
      script.onload = function () {
        var evt = document.createEvent('Event');
        evt.initEvent('DOMContentLoaded', false, false);
        window.dispatchEvent(evt);
      };
      
      div.appendChild(script);

      return () => {
        if (div && script.parentNode === div) {
          div.removeChild(script);
        }
      };
    }, []);

    return <div id="buymeacoffee-widget" style={containerStyle} />;
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      Linking.openURL('https://www.buymeacoffee.com/stackmap');
    }
  };

  // Link style - simple text link
  if (style === 'link') {
    return (
      <TouchableOpacity 
        onPress={handlePress}
        style={[{ flexDirection: 'row', alignItems: 'center', padding: 8 }, containerStyle]}
      >
        <Text style={[{ color: theme?.primary || '#5c7e9d', fontSize: 14 }, textStyle]}>
          ☕ Buy us a coffee
        </Text>
      </TouchableOpacity>
    );
  }

  // Button style - styled button that matches app design
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        {
          backgroundColor: theme?.primary || '#5c7e9d',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 25,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        },
        containerStyle,
      ]}
    >
      <Text style={[{ color: 'white', fontSize: 16, fontWeight: 'bold' }, textStyle]}>
        ☕ Support StackMap
      </Text>
    </TouchableOpacity>
  );
};

export default BuyMeCoffeeButton;