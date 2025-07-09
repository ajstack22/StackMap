import { AppRegistry } from 'react-native';
import App from './App';

// Import Comic Relief fonts
import ComicReliefRegular from './assets/fonts/ComicRelief-Regular.ttf';
import ComicReliefBold from './assets/fonts/ComicRelief-Bold.ttf';

// Create font face styles
const fontStyles = document.createElement('style');
fontStyles.innerHTML = `
  @font-face {
    font-family: 'Comic Relief';
    src: url(${ComicReliefRegular}) format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Comic Relief';
    src: url(${ComicReliefBold}) format('truetype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }
  
  /* Critical: Ensure React Native Web respects viewport constraints */
  #root > div:first-child {
    height: 100% !important;
    max-height: 100% !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  /* Ensure nested containers also respect height */
  #root > div > div {
    height: 100% !important;
    max-height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
  }
`;
document.head.appendChild(fontStyles);

// Register the app
AppRegistry.registerComponent('StackMap', () => App);

// Run the app on web
AppRegistry.runApplication('StackMap', {
  initialProps: {},
  rootTag: document.getElementById('root')
});