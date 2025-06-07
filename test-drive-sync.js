// Test Google Drive Sync UI
console.log('Testing Google Drive Sync UI...');

// Test functions
window.testDriveSync = {
    // Open sync settings
    openSync: function() {
        console.log('Opening sync settings...');
        if (window.hybridPanelManager) {
            window.hybridPanelManager.openPanel('right');
            window.hybridPanelManager.openSyncSettings();
            console.log('✓ Sync settings opened');
        } else {
            console.error('✗ HybridPanelManager not initialized');
        }
    },
    
    // Check sync status
    checkStatus: function() {
        const driveSync = window.appInstance?.driveSync;
        if (driveSync) {
            console.log('Drive Sync Status:');
            console.log('- Signed in:', driveSync.isSignedIn);
            console.log('- Currently syncing:', driveSync.isSyncing);
            console.log('- Access token exists:', !!driveSync.accessToken);
            console.log('- Folder ID:', driveSync.folderId);
            console.log('- Last known remote version:', driveSync.lastKnownRemoteVersion);
        } else {
            console.error('✗ GoogleDriveSync not initialized');
        }
    },
    
    // Test sync metadata
    checkMetadata: function() {
        const metadata = window.appInstance?.appState?.syncMetadata;
        if (metadata) {
            console.log('Sync Metadata:');
            console.log('- Version:', metadata.version);
            console.log('- Last modified:', metadata.lastModified);
            console.log('- Device ID:', metadata.deviceId);
            console.log('- Device name:', metadata.deviceName);
        } else {
            console.error('✗ Sync metadata not found');
        }
    },
    
    // Simulate sign in
    simulateSignIn: function() {
        console.log('Note: Actual sign-in requires user interaction');
        console.log('Click "Sign in with Google" button in the sync settings panel');
    },
    
    // Force a sync
    forceSync: function() {
        const driveSync = window.appInstance?.driveSync;
        if (driveSync && driveSync.isSignedIn) {
            console.log('Forcing sync...');
            driveSync.uploadData();
        } else {
            console.error('✗ Not signed in to Google Drive');
        }
    }
};

// Add to global for console access
window.testSync = window.testDriveSync;

console.log(`
Google Drive Sync Test Commands:
================================
testSync.openSync()      - Open sync settings panel
testSync.checkStatus()   - Check current sync status
testSync.checkMetadata() - View sync metadata
testSync.forceSync()     - Force upload to Drive
testSync.simulateSignIn()- Info about signing in

Note: Make sure you're in Edit Mode first!
`);