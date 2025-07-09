// Web-specific implementations for native modules

// Default export for react-native-fs
const RNFS = {
  DocumentDirectoryPath: '/tmp',
  DownloadDirectoryPath: '/downloads',
  ExternalDirectoryPath: '/external',
  CachesDirectoryPath: '/cache',
  ExternalStorageDirectoryPath: '/external-storage',
  
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

// Document picker polyfill for web
const DocumentPicker = {
  pick: async (options) => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = options?.type === 'application/json' ? '.json' : '*/*';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const text = await file.text();
            resolve([{
              uri: URL.createObjectURL(file),
              name: file.name,
              type: file.type,
              content: text // Add content for easy access
            }]);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('No file selected'));
        }
      };
      
      input.click();
    });
  },
  
  types: {
    allFiles: '*/*',
    plainText: 'text/plain',
    json: 'application/json'
  }
};

// Export RNFS as default for react-native-fs alias
export default RNFS;

// Export other modules separately
export { DocumentPicker };