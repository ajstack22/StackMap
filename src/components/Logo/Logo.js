import React from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

const Logo = ({ size = 32, theme }) => {
  const primaryColor = theme?.primary || '#667eea';
  
  // Adjust size to match letter height (about 20 for a 32 font size)
  const logoHeight = size * 0.625; // roughly the x-height of the font
  const logoWidth = size; // keep width proportional
  
  return (
    <View style={{ width: logoWidth, height: logoHeight }}>
      <Svg width={logoWidth} height={logoHeight} viewBox={`0 0 32 20`}>
        {/* Top rectangle - white, 10% shorter */}
        <Rect 
          x="4" 
          y="0" 
          width="24" 
          height="3.6" 
          rx="3" 
          ry="3" 
          fill="white"
        />
        
        {/* Middle rectangle - white, 10% shorter */}
        <Rect 
          x="4" 
          y="5.6" 
          width="24" 
          height="3.6" 
          rx="3" 
          ry="3" 
          fill="white"
        />
        
        {/* Bottom rectangle - white, 5% taller */}
        <Rect 
          x="4" 
          y="11.2" 
          width="24" 
          height="8.4" 
          rx="3" 
          ry="3" 
          fill="white"
        />
      </Svg>
    </View>
  );
};

export default Logo;