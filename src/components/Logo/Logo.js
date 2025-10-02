import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import Svg, { Rect } from 'react-native-svg';

const Logo = ({ size = 32, theme, color, ...restProps }) => {
  const primaryColor = theme?.primary || '#667eea';
  const logoColor = color || 'white'; // Default to white if no color specified

  // Adjust size to match letter height (about 20 for a 32 font size)
  const logoHeight = size * 0.625; // roughly the x-height of the font
  const logoWidth = size; // keep width proportional

  return (
    <View style={{ width: logoWidth, height: logoHeight }} {...restProps}>
      <Svg width={logoWidth} height={logoHeight} viewBox={`0 0 32 20`}>
        {/* Top rectangle - 10% shorter */}
        <Rect
          x="4"
          y="0"
          width="24"
          height="3.6"
          rx="3"
          ry="3"
          fill={logoColor}
        />

        {/* Middle rectangle - 10% shorter */}
        <Rect
          x="4"
          y="5.6"
          width="24"
          height="3.6"
          rx="3"
          ry="3"
          fill={logoColor}
        />

        {/* Bottom rectangle - 5% taller */}
        <Rect
          x="4"
          y="11.2"
          width="24"
          height="8.4"
          rx="3"
          ry="3"
          fill={logoColor}
        />
      </Svg>
    </View>
  );
};

Logo.propTypes = {
  size: PropTypes.number,
  theme: PropTypes.object,
  color: PropTypes.string,
};

export default Logo;
