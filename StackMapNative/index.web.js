import { AppRegistry } from 'react-native';
import App from './App';

// Register the app
AppRegistry.registerComponent('StackMap', () => App);

// Run the app on web
AppRegistry.runApplication('StackMap', {
  initialProps: {},
  rootTag: document.getElementById('root')
});