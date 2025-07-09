// Web-specific implementations for native modules

// Default export for react-native-fs
const RNFS = {
  DocumentDirectoryPath: '',
  DownloadDirectoryPath: '',
  ExternalDirectoryPath: '',
  CachesDirectoryPath: '',
  ExternalStorageDirectoryPath: '',
  
  writeFile: async (path, content) => {
    // For web, we'll use browser's download functionality
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return Promise.resolve();
  },
  
  readFile: async () => {
    return Promise.reject(new Error('File reading not supported on web'));
  },
  
  readDir: async () => {
    return Promise.resolve([]);
  },
  
  mkdir: async () => {
    return Promise.resolve();
  },
  
  unlink: async () => {
    return Promise.resolve();
  }
};

// Document picker polyfill
const DocumentPicker = null;

// Export RNFS as default for react-native-fs alias
export default RNFS;

// Export other modules separately
export { DocumentPicker };