// === GOOGLE DRIVE SYNC ===
class GoogleDriveSync {
    constructor(app) {
        console.log('[GoogleDriveSync] Initializing...');
        this.app = app;
        this.isSignedIn = false;
        this.currentUser = null;
        this.accessToken = null;
        this.STACKMAP_FOLDER_NAME = 'StackMap Data';
        this.STACKMAP_FILE_NAME = 'stackmap-data.json';
        this.folderId = null;
        this.lastKnownRemoteVersion = 0;
        this.isSyncing = false;
        this.syncCheckInterval = null;
        
        // Initialize Google APIs
        this.initializeGoogleAPIs();
    }

    async initializeGoogleAPIs() {
        try {
            console.log('[GoogleDriveSync] Starting API initialization...');
            
            // Check if credentials are configured
            if (!CONFIG.GOOGLE_CLIENT_ID || !CONFIG.GOOGLE_API_KEY) {
                console.warn('Google Drive sync disabled: API credentials not configured');
                return;
            }
            
            console.log('[GoogleDriveSync] Credentials found, loading Google APIs...');
            
            // Wait for Google APIs to load with timeout
            await new Promise((resolve, reject) => {
                let checkCount = 0;
                const checkGoogleAPIs = () => {
                    if (window.gapi && window.google && window.google.accounts) {
                        resolve();
                    } else if (checkCount++ > 50) { // 5 seconds timeout
                        reject(new Error('Google APIs failed to load'));
                    } else {
                        setTimeout(checkGoogleAPIs, 100);
                    }
                };
                
                if (document.readyState === 'complete') {
                    checkGoogleAPIs();
                } else {
                    window.addEventListener('load', checkGoogleAPIs);
                }
            });

            // Initialize the gapi client
            await new Promise((resolve, reject) => {
                gapi.load('client', {
                    callback: resolve,
                    onerror: reject
                });
            });

            await gapi.client.init({
                apiKey: CONFIG.GOOGLE_API_KEY,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
            });

            // Initialize Google Identity Services
            this.initializeGoogleIdentity();
            
            // Check for stored auth token
            this.checkStoredAuth();
            
            console.log('[GoogleDriveSync] Google Drive API initialized successfully');
        } catch (error) {
            console.error('[GoogleDriveSync] Error loading Google APIs:', error);
            this.showSyncError('Failed to load Google services. Please refresh the page.');
        }
    }

    async checkStoredAuth() {
        const storedToken = localStorage.getItem('stackmap-google-token');
        if (storedToken) {
            this.accessToken = storedToken;
            
            // Validate token is still valid
            const isValid = await this.checkTokenValidity();
            if (isValid) {
                gapi.client.setToken({
                    access_token: this.accessToken
                });
                this.updateSignInStatus(true);
                // console.log('Restored Google Drive connection from storage');
                
                // Start sync checks
                this.startSyncCheckInterval();
                this.checkForRemoteChanges();
            } else {
                // Token expired, clean up
                localStorage.removeItem('stackmap-google-token');
                this.accessToken = null;
                // console.log('Stored token expired, need to re-authenticate');
            }
        }
    }

    initializeGoogleIdentity() {
        try {
            // Check if Google Identity Services is loaded
            if (!window.google || !window.google.accounts) {
                console.error('Google Identity Services not loaded');
                return;
            }

            // Skip initialization if no client ID
            if (!CONFIG.GOOGLE_CLIENT_ID) {
                console.warn('Google Client ID not configured');
                return;
            }

            // Initialize Google Identity Services for authentication
            google.accounts.id.initialize({
                client_id: CONFIG.GOOGLE_CLIENT_ID,
                callback: this.handleCredentialResponse.bind(this)
            });

            // Initialize Google Auth for token access
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CONFIG.GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.file',
                callback: this.handleTokenResponse.bind(this),
                error_callback: this.handleTokenError.bind(this)
            });

            // console.log('Google Identity Services initialized');
        } catch (error) {
            console.error('Error initializing Google Identity Services:', error);
        }
    }

    handleCredentialResponse(response) {
        // This handles the ID token, but we need access token for API calls
        // console.log('Credential response received');
    }

    handleTokenResponse(response) {
        if (response.error) {
            console.error('Token error:', response.error);
            this.showSyncError('Failed to get authorization. Please try again.');
            return;
        }

        this.accessToken = response.access_token;
        this.isSignedIn = true;
        
        // Store token for persistence
        localStorage.setItem('stackmap-google-token', this.accessToken);
        
        // Set the token for gapi client
        gapi.client.setToken({
            access_token: this.accessToken
        });

        this.updateSignInStatus(true);
        // console.log('Successfully signed in with access token');
        
        // Clear folder ID to force refresh on new sign-in
        this.folderId = null;
        
        // Start sync check interval
        this.startSyncCheckInterval();
        
        // Do initial sync check
        this.checkForRemoteChanges();
    }

    handleTokenError(error) {
        console.error('Token error callback:', error);
        this.showSyncError(`Authorization failed: ${error.message || 'Unknown error'}`);
    }

    updateSignInStatus(isSignedIn) {
        this.isSignedIn = isSignedIn;
        const signInBtn = document.getElementById('googleSignInBtn');
        const syncStatus = document.getElementById('syncStatus');
        const syncActions = document.getElementById('syncActions');
        const syncBtn = document.getElementById('syncBtn');
        const syncUser = document.getElementById('syncUser');

        if (isSignedIn) {
            // Update UI
            signInBtn.style.display = 'none';
            syncStatus.style.display = 'flex';
            syncActions.style.display = 'flex';
            syncUser.textContent = 'Connected to Google Drive';
            
            // Show sync button in grown-up mode
            if (this.app.grownupMode) {
                syncBtn.classList.remove('hidden');
            }
            
            // console.log('Signed in to Google Drive');
        } else {
            this.currentUser = null;
            this.accessToken = null;
            this.folderId = null;
            
            // Stop sync checks
            this.stopSyncCheckInterval();
            
            // Update UI
            signInBtn.style.display = 'block';
            syncStatus.style.display = 'none';
            syncActions.style.display = 'none';
            syncBtn.classList.add('hidden');
            
            // console.log('Signed out');
        }
    }

    startSyncCheckInterval() {
        // Check for remote changes every 10 seconds (reduced from 30)
        this.syncCheckInterval = setInterval(() => {
            if (this.isSignedIn && !this.isSyncing) {
                this.checkForRemoteChanges();
            }
        }, 10000);
    }

    stopSyncCheckInterval() {
        if (this.syncCheckInterval) {
            clearInterval(this.syncCheckInterval);
            this.syncCheckInterval = null;
        }
    }

    async signIn() {
        try {
            // Check if credentials are configured
            if (!CONFIG.GOOGLE_CLIENT_ID || !CONFIG.GOOGLE_API_KEY) {
                this.showSyncError('Google Drive sync is not configured. Please contact your administrator to set up Google API credentials.');
                console.info('To enable Google Drive sync:');
                console.info('1. Set up a Google Cloud project at https://console.cloud.google.com/');
                console.info('2. Enable the Google Drive API');
                console.info('3. Create OAuth 2.0 credentials');
                console.info('4. Add the Client ID and API Key to your environment configuration');
                return;
            }
            
            // Check if tokenClient is initialized
            if (!this.tokenClient) {
                console.error('Google Identity Services not initialized. Trying to initialize...');
                this.initializeGoogleIdentity();
                
                // If still no tokenClient, show error
                if (!this.tokenClient) {
                    this.showSyncError('Google Sign-In is not available. Please refresh the page.');
                    return;
                }
            }
            
            // Request access token
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (error) {
            console.error('Sign-in error:', error);
            this.showSyncError('Failed to sign in to Google Drive. Please try again.');
        }
    }

    async signOut() {
        try {
            if (this.accessToken) {
                google.accounts.oauth2.revoke(this.accessToken);
            }
            gapi.client.setToken(null);
            
            // Clear stored token
            localStorage.removeItem('stackmap-google-token');
            
            this.updateSignInStatus(false);
        } catch (error) {
            console.error('Sign-out error:', error);
            this.showSyncError('Failed to sign out. Please try again.');
        }
    }

    async checkTokenValidity() {
        if (!this.accessToken) return false;
        
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + this.accessToken);
            const data = await response.json();
            
            if (data.error) {
                // console.log('Token is invalid:', data.error);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error checking token:', error);
            return false;
        }
    }

    async refreshTokenIfNeeded() {
        const isValid = await this.checkTokenValidity();
        if (!isValid) {
            // console.log('Token expired, requesting new token...');
            // Clear invalid stored token
            localStorage.removeItem('stackmap-google-token');
            this.tokenClient.requestAccessToken({ prompt: '' });
            return false;
        }
        return true;
    }

    async checkForRemoteChanges() {
        if (!this.isSignedIn || this.isSyncing) return;
        
        try {
            const remoteData = await this.getRemoteData();
            if (!remoteData) return;
            
            const localVersion = this.app.appState.syncMetadata.version;
            const remoteVersion = remoteData.syncMetadata?.version || 0;
            
            if (remoteVersion > this.lastKnownRemoteVersion && remoteVersion !== localVersion) {
                // console.log(`Remote changes detected: v${remoteVersion} (local: v${localVersion})`);
                
                // Check if remote is newer than local
                if (remoteVersion > localVersion) {
                    this.handleRemoteUpdate(remoteData);
                } else if (remoteVersion < localVersion) {
                    // Local is newer, upload
                    this.uploadData();
                } else if (remoteData.syncMetadata?.deviceId !== this.app.appState.syncMetadata.deviceId) {
                    // Same version but different device - potential conflict
                    this.handleConflict(remoteData);
                }
            }
            
            this.lastKnownRemoteVersion = remoteVersion;
        } catch (error) {
            // console.log('Error checking for remote changes:', error);
        }
    }

    async getRemoteData() {
        try {
            const file = await this.findStackMapFile();
            if (!file) return null;

            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) return null;

            const responseText = await response.text();
            return JSON.parse(responseText);
        } catch (error) {
            console.error('Error getting remote data:', error);
            return null;
        }
    }

    handleRemoteUpdate(remoteData) {
        const remoteTime = new Date(remoteData.syncMetadata.lastModified).toLocaleString();
        const remoteDevice = remoteData.syncMetadata.deviceName;
        
        // Auto-apply updates for better real-time sync
        // Show subtle notification but apply changes immediately
        this.applyRemoteChanges(remoteData);
        this.showToast(`Updated from ${remoteDevice}`, 'success');
    }

    handleConflict(remoteData) {
        const localTime = new Date(this.app.appState.syncMetadata.lastModified).toLocaleString();
        const remoteTime = new Date(remoteData.syncMetadata.lastModified).toLocaleString();
        const localDevice = this.app.appState.syncMetadata.deviceName;
        const remoteDevice = remoteData.syncMetadata.deviceName;
        
        // Count users and total activities for better conflict info
        const localUsers = Object.keys(this.app.appState.users.profiles).length;
        const remoteUsers = remoteData.users ? Object.keys(remoteData.users.profiles).length : 1;
        
        const localTotalActivities = Object.values(this.app.appState.users.profiles)
            .reduce((sum, user) => sum + (user.activities?.length || 0) + (user.tomorrowActivities?.length || 0), 0);
        
        const remoteTotalActivities = remoteData.users 
            ? Object.values(remoteData.users.profiles)
                .reduce((sum, user) => sum + (user.activities?.length || 0) + (user.tomorrowActivities?.length || 0), 0)
            : (remoteData.activities?.length || 0);
        
        // Create conflict resolution modal
        this.showConflictModal({
            local: {
                device: localDevice,
                time: localTime,
                users: localUsers,
                activities: localTotalActivities
            },
            remote: {
                device: remoteDevice,
                time: remoteTime,
                users: remoteUsers,
                activities: remoteTotalActivities
            }
        }, remoteData);
    }

    showConflictModal(conflictInfo, remoteData) {
        // Create modal HTML
        const modal = document.createElement('div');
        modal.className = 'sync-conflict-modal';
        modal.innerHTML = `
            <div class="sync-conflict-content">
                <h2>Sync Conflict Detected</h2>
                <p>Changes were made on multiple devices. Choose which version to keep:</p>
                
                <div class="sync-conflict-options">
                    <div class="sync-conflict-option">
                        <h3>This Device (${conflictInfo.local.device})</h3>
                        <p>Modified: ${conflictInfo.local.time}</p>
                        <p>${conflictInfo.local.users} users, ${conflictInfo.local.activities} total activities</p>
                        <button class="btn btn--primary" id="keepLocal">Keep This Version</button>
                    </div>
                    
                    <div class="sync-conflict-option">
                        <h3>Other Device (${conflictInfo.remote.device})</h3>
                        <p>Modified: ${conflictInfo.remote.time}</p>
                        <p>${conflictInfo.remote.users} users, ${conflictInfo.remote.activities} total activities</p>
                        <button class="btn btn--secondary" id="keepRemote">Use Other Version</button>
                    </div>
                    
                    <div class="sync-conflict-option sync-conflict-option--merge">
                        <h3>Merge Both</h3>
                        <p>Combine all users and activities from both devices</p>
                        <button class="btn btn--secondary" id="mergeBoth">Merge</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('keepLocal').onclick = () => {
            document.body.removeChild(modal);
            this.uploadData(); // Force upload local version
        };
        
        document.getElementById('keepRemote').onclick = () => {
            document.body.removeChild(modal);
            this.applyRemoteChanges(remoteData);
        };
        
        document.getElementById('mergeBoth').onclick = () => {
            document.body.removeChild(modal);
            this.mergeChanges(remoteData);
        };
    }

    applyRemoteChanges(remoteData) {
        this.app.appState.importData(remoteData, false);
        this.app.saveToLocalStorage();
        this.app.updateTabTitle();
        this.app.render();
        this.showSyncSuccess('Updated with changes from ' + remoteData.syncMetadata.deviceName);
        
        // Update last known version
        this.lastKnownRemoteVersion = remoteData.syncMetadata.version;
    }

    mergeChanges(remoteData) {
        this.app.appState.mergeWithRemote(remoteData);
        this.app.saveToLocalStorage();
        this.app.updateTabTitle();
        this.app.render();
        this.showSyncSuccess('Successfully merged changes from both devices');
        
        // Upload merged version
        this.uploadData();
    }

    showSyncNotification(title, message, onAccept, onDismiss) {
        const notification = document.createElement('div');
        notification.className = 'sync-notification';
        notification.innerHTML = `
            <div class="sync-notification-content">
                <h4>${title}</h4>
                <p>${message}</p>
                <div class="sync-notification-actions">
                    <button class="btn btn--small btn--primary" id="acceptSync">Update</button>
                    <button class="btn btn--small btn--secondary" id="dismissSync">Later</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('sync-notification--visible');
        });
        
        const remove = () => {
            notification.classList.remove('sync-notification--visible');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        };
        
        document.getElementById('acceptSync').onclick = () => {
            remove();
            onAccept();
        };
        
        document.getElementById('dismissSync').onclick = () => {
            remove();
            onDismiss();
        };
        
        // Auto dismiss after 10 seconds
        setTimeout(remove, 10000);
    }

    async uploadData() {
        if (!this.isSignedIn || this.isSyncing) {
            return;
        }

        this.isSyncing = true;

        try {
            // Check token validity
            if (!await this.refreshTokenIfNeeded()) {
                this.showSyncError('Please sign in again to continue.');
                this.isSyncing = false;
                return;
            }

            this.showSyncProgress('Saving to Google Drive...');
            
            // Get current app data
            const data = this.app.appState.exportData();
            data.lastSync = new Date().toISOString();
            data.deviceInfo = {
                userAgent: navigator.userAgent,
                timestamp: Date.now()
            };

            // Ensure we have a folder
            await this.ensureStackMapFolder();

            // Check if file exists
            const existingFile = await this.findStackMapFile();
            
            let response;
            
            if (existingFile) {
                // Update existing file using simple media upload
                // console.log('Updating existing file:', existingFile.id);
                
                response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data, null, 2)
                });
            } else {
                // Create new file
                // console.log('Creating new file in folder:', this.folderId);
                
                const metadata = {
                    name: this.STACKMAP_FILE_NAME,
                    parents: [this.folderId],
                    mimeType: 'application/json'
                };

                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
                form.append('file', new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));

                response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    },
                    body: form
                });
            }

            const responseText = await response.text();
            // console.log('Upload response status:', response.status);
            
            if (response.ok) {
                this.showSyncSuccess('Saved to Google Drive');
                // console.log('Data uploaded successfully');
                
                // Update last known version
                this.lastKnownRemoteVersion = data.syncMetadata.version;
            } else {
                console.error('Upload failed:', response.status, responseText);
                
                if (response.status === 403) {
                    this.showSyncError('Permission denied. Please sign out and sign in again.');
                    // Force re-authentication
                    this.isSignedIn = false;
                    this.accessToken = null;
                } else {
                    throw new Error(`Upload failed: ${response.statusText}`);
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showSyncError(`Failed to save: ${error.message || 'Unknown error'}`);
        } finally {
            this.isSyncing = false;
        }
    }

    async downloadData() {
        if (!this.isSignedIn || this.isSyncing) {
            return;
        }

        this.isSyncing = true;

        try {
            // Check token validity
            if (!await this.refreshTokenIfNeeded()) {
                this.showSyncError('Please sign in again to continue.');
                this.isSyncing = false;
                return;
            }

            this.showSyncProgress('Loading from Google Drive...');

            const remoteData = await this.getRemoteData();
            if (!remoteData) {
                this.showSyncError('No StackMap data found in Google Drive.');
                this.isSyncing = false;
                return;
            }
            
            // Check for conflicts
            const localVersion = this.app.appState.syncMetadata.version;
            const remoteVersion = remoteData.syncMetadata?.version || 0;
            
            if (localVersion > remoteVersion) {
                // Local is newer
                if (confirm('Your local data is newer than the cloud version. Download anyway?')) {
                    this.applyRemoteChanges(remoteData);
                }
            } else if (localVersion === remoteVersion && 
                       remoteData.syncMetadata?.deviceId !== this.app.appState.syncMetadata.deviceId) {
                // Conflict
                this.handleConflict(remoteData);
            } else {
                // Remote is newer or same device
                this.applyRemoteChanges(remoteData);
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showSyncError(`Failed to load: ${error.message || 'Unknown error'}`);
        } finally {
            this.isSyncing = false;
        }
    }

    async ensureStackMapFolder() {
        try {
            // Search for existing folder
            const response = await gapi.client.drive.files.list({
                q: `name='${this.STACKMAP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                spaces: 'drive',
                fields: 'files(id, name)'
            });

            // console.log('Folder search response:', response.result);

            if (response.result.files && response.result.files.length > 0) {
                this.folderId = response.result.files[0].id;
                // console.log('Found existing folder:', this.folderId);
                return;
            }

            // Create folder if it doesn't exist
            const folderResponse = await gapi.client.drive.files.create({
                resource: {
                    name: this.STACKMAP_FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder'
                },
                fields: 'id'
            });

            this.folderId = folderResponse.result.id;
            // console.log('Created StackMap folder:', this.folderId);
        } catch (error) {
            console.error('Error ensuring folder:', error);
            throw error;
        }
    }

    async findStackMapFile() {
        try {
            if (!this.folderId) {
                await this.ensureStackMapFolder();
            }
            
            const response = await gapi.client.drive.files.list({
                q: `name='${this.STACKMAP_FILE_NAME}' and '${this.folderId}' in parents and trashed=false`,
                spaces: 'drive',
                fields: 'files(id, name)'
            });

            // console.log('File search response:', response.result);

            return response.result.files && response.result.files.length > 0 ? response.result.files[0] : null;
        } catch (error) {
            console.error('Error finding file:', error);
            throw error;
        }
    }

    getDeviceType(userAgent) {
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
            return 'mobile device';
        } else if (/Tablet/.test(userAgent)) {
            return 'tablet';
        } else {
            return 'computer';
        }
    }

    showSyncProgress(message) {
        // Update sync button with progress
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            const icon = syncBtn.querySelector('.material-icons');
            icon.textContent = 'sync';
            icon.classList.add('spinning');
            syncBtn.title = message;
        }
        
        // Show toast notification
        this.showToast(message, 'info');
    }

    showSyncSuccess(message) {
        // Reset sync button
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            const icon = syncBtn.querySelector('.material-icons');
            icon.textContent = 'cloud_done';
            icon.classList.remove('spinning');
            syncBtn.title = 'Sync with Google Drive';
            
            // Reset icon after 3 seconds
            setTimeout(() => {
                icon.textContent = 'sync';
            }, 3000);
        }
        
        this.showToast(message, 'success');
    }

    showSyncError(message) {
        // Reset sync button
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            const icon = syncBtn.querySelector('.material-icons');
            icon.textContent = 'sync_problem';
            icon.classList.remove('spinning');
            syncBtn.title = message;
            
            // Reset after 3 seconds
            setTimeout(() => {
                icon.textContent = 'sync';
                syncBtn.title = 'Sync with Google Drive';
            }, 3000);
        }
        
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        
        // Add to page
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('toast--visible');
        });
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('toast--visible');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Auto-sync when data changes (always enabled)
    async autoSync() {
        if (this.isSignedIn && !this.isSyncing) {
            try {
                await this.uploadData();
            } catch (error) {
                // console.log('Auto-sync failed, will try again next time');
            }
        }
    }
}

// Make available globally
window.GoogleDriveSync = GoogleDriveSync;