import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

const Logo = ({ size = 32, theme }) => {
  const primaryColor = theme?.primary || '#667eea';
  const darkColor = theme?.dark || '#4a5bc7';
  
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        {/* White circle background */}
        <Circle 
          cx="16" 
          cy="16" 
          r="15" 
          fill="rgba(255, 255, 255, 0.9)" 
          stroke="rgba(255, 255, 255, 0.7)" 
          strokeWidth="1"
        />
        
        {/* Top rectangle - theme color */}
        <Rect 
          x="7" 
          y="10" 
          width="18" 
          height="2.5" 
          rx="1.25" 
          fill={primaryColor}
        />
        
        {/* Middle rectangle - theme color */}
        <Rect 
          x="7" 
          y="14.5" 
          width="18" 
          height="2.5" 
          rx="1.25" 
          fill={primaryColor}
        />
        
        {/* Bottom rectangle - darker theme color, twice as tall */}
        <Rect 
          x="7" 
          y="19" 
          width="18" 
          height="5" 
          rx="2.5" 
          fill={darkColor}
        />
      </Svg>
    </View>
  );
};

export default Logo;