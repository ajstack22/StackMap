import React from 'react';

// Web implementation of react-native-vector-icons using Material Icons font
// Now using ligatures instead of unicode for better compatibility

// Legacy map - no longer used but kept for reference
const iconMap = {
  // Common icons used in the app
  menu: '\ue5d2',
  close: '\ue5cd',
  add: '\ue145',
  edit: '\ue3c9',
  delete: '\ue872',
  check: '\ue5ca',
  settings: '\ue8b8',
  'arrow-back': '\ue5c4',
  'arrow-forward': '\ue5c8',
  'expand-more': '\ue5cf',
  'expand-less': '\ue5ce',
  'drag-handle': '\ue25d',
  'more-vert': '\ue5d4',
  refresh: '\ue5d5',
  save: '\ue161',
  undo: '\ue166',
  done: '\ue876',
  clear: '\ue14c',
  visibility: '\ue8f4',
  'visibility-off': '\ue8f5',
  lock: '\ue897',
  'lock-open': '\ue898',
  person: '\ue7fd',
  people: '\ue7fb',
  'library-add': '\ue02e',
  category: '\ue574',
  'unfold-more': '\ue5d7',
  'unfold-less': '\ue5d6',
  'arrow-upward': '\ue5d8',
  'arrow-downward': '\ue5db',
  backspace: '\ue14a',
  'file-download': '\ue2c4',
  'file-upload': '\ue2c6',
  palette: '\ue40a',
  'brightness-4': '\ue3a6',
  notifications: '\ue7f4',
  'volume-up': '\ue050',
  'volume-off': '\ue04f',
  celebration: '\uea65',
  star: '\ue838',
  'exit-to-app': '\ue879',
  today: '\ue8df',
  event: '\ue878',
  schedule: '\ue8b5',
  timer: '\ue425',
  alarm: '\ue855',
  snooze: '\ue046',
  'access-time': '\ue192',
  history: '\ue889',
  sync: '\ue627',
  'cloud-upload': '\ue2c3',
  'cloud-download': '\ue2c0',
  'cloud-done': '\ue2bf',
  'cloud-off': '\ue2c1',
};

const Icon = ({ name, size = 24, color = '#000', style }) => {
  // Use ligatures instead of unicode for proper rendering
  const iconStyle = {
    fontFamily: 'Material Icons, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: size,
    color: color,
    lineHeight: `${size}px`,
    height: size,
    width: size,
    textAlign: 'center',
    // Fix for proper icon centering - use flex to match React Native behavior
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // Material Icons specific settings
    fontWeight: 'normal',
    fontStyle: 'normal',
    letterSpacing: 'normal',
    textTransform: 'none',
    whiteSpace: 'nowrap',
    wordWrap: 'normal',
    direction: 'ltr',
    WebkitFontFeatureSettings: 'liga',
    WebkitFontSmoothing: 'antialiased',
    ...style,
  };

  // Add Material Icons font to the page if not already added
  React.useEffect(() => {
    if (!document.getElementById('material-icons-font')) {
      // First try local font file (avoids CSP issues)
      const style = document.createElement('style');
      style.id = 'material-icons-font';
      style.innerHTML = `
        @font-face {
          font-family: 'Material Icons';
          font-style: normal;
          font-weight: 400;
          src: url('/fonts/MaterialIcons-Regular.woff2') format('woff2'),
               url('/fonts/MaterialIcons-Regular.woff') format('woff'),
               url('/fonts/MaterialIcons-Regular.ttf') format('truetype');
        }
        .material-icons {
          font-family: 'Material Icons';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-feature-settings: 'liga';
          -webkit-font-smoothing: antialiased;
        }
      `;
      document.head.appendChild(style);
      
      // Fallback: Try Google Fonts (might be blocked by CSP)
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
      link.rel = 'stylesheet';
      link.onerror = () => {
        
      };
      document.head.appendChild(link);
    }
  }, []);

  // Material Icons uses underscores in ligatures, not hyphens
  // But some icons in our app use hyphens, so we need to handle both

  // Handle special cases - Material Icons uses underscores not hyphens
  const iconAliases = {
    'edit-off': 'edit_off', // This icon DOES exist in Material Icons
    'add-circle': 'add_circle',
    'add-photo-alternate': 'add_photo_alternate',
    'save-alt': 'save_alt',
    'folder-open': 'folder_open',
    'event-available': 'event_available',
    'collections-bookmark': 'collections_bookmark',
    'privacy-tip': 'privacy_tip',
    'chevron-right': 'chevron_right',
    'arrow-back': 'arrow_back',
    'arrow-forward': 'arrow_forward',
    'arrow-upward': 'arrow_upward',
    'arrow-downward': 'arrow_downward',
    'file-upload': '\ue2c6',
    'file-download': '\ue2c4',
  };

  // First check if we have an alias
  let iconName = iconAliases[name] || name;

  // Then convert any remaining hyphens to underscores for Material Icons
  iconName = iconName.replace(/-/g, '_');

  // Use unicode if we have it, otherwise use ligature
  const iconContent = iconMap[name] || iconName;

  // CRITICAL: Must use Text from react-native-web, not span!
  // Using span causes React error 130 when used inside React Native components
  const Text = require('react-native').Text;
  
  return <Text style={iconStyle}>{iconContent}</Text>;
};

// Export Icon as default to match react-native-vector-icons/MaterialIcons import pattern
export default Icon;
