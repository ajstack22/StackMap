// === SYNC QUEUE IMPLEMENTATION ===
class SyncQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.retryCount = new Map();
        this.maxRetries = 3;
        this.retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s
        this.STORAGE_KEY = 'stackmap-sync-queue';
        this.QUEUE_VERSION = 1;
        
        // Load queue from localStorage on init
        this.loadQueue();
        
        // Network status monitoring
        this.isOnline = navigator.onLine;
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Periodic queue processing
        this.startPeriodicProcessing();
    }
    
    loadQueue() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                if (data.version === this.QUEUE_VERSION) {
                    this.queue = data.queue || [];
                    // Rebuild retry count map
                    this.queue.forEach(item => {
                        if (item.retryCount > 0) {
                            this.retryCount.set(item.id, item.retryCount);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('[SyncQueue] Error loading queue:', error);
            this.queue = [];
        }
    }
    
    saveQueue() {
        try {
            const data = {
                version: this.QUEUE_VERSION,
                queue: this.queue,
                timestamp: Date.now()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('[SyncQueue] Error saving queue:', error);
        }
    }
    
    enqueue(operation) {
        // Create operation with unique ID
        const item = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: operation.type,
            data: operation.data,
            timestamp: Date.now(),
            retryCount: 0
        };
        
        // Implement operation deduplication
        this.deduplicateAndAdd(item);
        
        // Save to localStorage
        this.saveQueue();
        
        // Try to process immediately if online
        if (this.isOnline && !this.processing) {
            this.processQueue();
        }
        
        return item.id;
    }
    
    deduplicateAndAdd(newItem) {
        // Remove older operations that would be superseded by this one
        if (newItem.type === 'upload') {
            // Remove all previous upload operations as the new one has the latest data
            this.queue = this.queue.filter(item => item.type !== 'upload');
        } else if (newItem.type === 'update-activity') {
            // Remove previous updates to the same activity
            const activityId = newItem.data.activityId;
            this.queue = this.queue.filter(item => 
                !(item.type === 'update-activity' && item.data.activityId === activityId)
            );
        } else if (newItem.type === 'delete-activity') {
            // Remove any updates to this activity and previous delete operations
            const activityId = newItem.data.activityId;
            this.queue = this.queue.filter(item => 
                !(item.type === 'update-activity' && item.data.activityId === activityId) &&
                !(item.type === 'delete-activity' && item.data.activityId === activityId)
            );
        }
        
        // Apply operation transformation for complex conflict resolution
        this.transformOperations(newItem);
        
        // Add the new item
        this.queue.push(newItem);
    }
    
    // Operation transformation for handling complex queued operations
    transformOperations(newOperation) {
        // Transform existing operations based on the new operation
        this.queue = this.queue.map(existingOp => {
            // Skip if same operation
            if (existingOp.id === newOperation.id) return existingOp;
            
            // Handle activity position changes
            if (newOperation.type === 'move-activity' && existingOp.type === 'move-activity') {
                // If both operations move the same activity, keep only the latest position
                if (existingOp.data.activityId === newOperation.data.activityId) {
                    return null; // Mark for removal
                }
                
                // Adjust positions if needed
                if (existingOp.data.fromIndex >= newOperation.data.fromIndex && 
                    existingOp.data.fromIndex <= newOperation.data.toIndex) {
                    existingOp.data.fromIndex--;
                } else if (existingOp.data.fromIndex <= newOperation.data.fromIndex && 
                           existingOp.data.fromIndex >= newOperation.data.toIndex) {
                    existingOp.data.fromIndex++;
                }
            }
            
            // Handle user switching
            if (newOperation.type === 'switch-user') {
                // Update user context for pending operations
                if (existingOp.type === 'update-activity' || existingOp.type === 'delete-activity') {
                    existingOp.data.previousUserId = existingOp.data.userId || null;
                    existingOp.data.userId = newOperation.data.userId;
                }
            }
            
            // Handle batch operations
            if (newOperation.type === 'batch-update' && existingOp.type === 'update-activity') {
                // Check if this activity is part of the batch
                const batchIds = newOperation.data.activityIds || [];
                if (batchIds.includes(existingOp.data.activityId)) {
                    // Merge updates
                    existingOp.data.updates = {
                        ...existingOp.data.updates,
                        ...newOperation.data.updates
                    };
                }
            }
            
            return existingOp;
        }).filter(op => op !== null); // Remove marked operations
    }
    
    async processQueue() {
        if (!this.isOnline || this.processing || this.queue.length === 0) {
            return;
        }
        
        this.processing = true;
        
        // Process items in order
        while (this.queue.length > 0 && this.isOnline) {
            const item = this.queue[0];
            
            try {
                // Process the operation
                await this.processOperation(item);
                
                // Success - remove from queue
                this.queue.shift();
                this.retryCount.delete(item.id);
                this.saveQueue();
                
                // Notify UI of successful sync
                this.notifyQueueUpdate();
                
            } catch (error) {
                console.error('[SyncQueue] Operation failed:', error);
                
                // Handle failure with retry logic
                const retries = this.retryCount.get(item.id) || 0;
                
                if (retries < this.maxRetries) {
                    // Increment retry count
                    this.retryCount.set(item.id, retries + 1);
                    item.retryCount = retries + 1;
                    item.lastError = error.message;
                    
                    // Move to end of queue for retry
                    this.queue.shift();
                    this.queue.push(item);
                    this.saveQueue();
                    
                    // Wait before continuing with exponential backoff
                    const delay = this.retryDelays[Math.min(retries, this.retryDelays.length - 1)];
                    await new Promise(resolve => setTimeout(resolve, delay));
                    
                } else {
                    // Max retries reached - move to failed queue
                    console.error('[SyncQueue] Max retries reached for operation:', item);
                    this.queue.shift();
                    this.handleFailedOperation(item);
                    this.saveQueue();
                }
            }
        }
        
        this.processing = false;
        this.notifyQueueUpdate();
    }
    
    async processOperation(item) {
        // This will be implemented by GoogleDriveSync
        if (this.operationProcessor) {
            return await this.operationProcessor(item);
        }
        throw new Error('Operation processor not set');
    }
    
    handleFailedOperation(item) {
        // Store failed operations separately for manual retry
        const failedKey = 'stackmap-failed-sync-operations';
        try {
            const failed = JSON.parse(localStorage.getItem(failedKey) || '[]');
            failed.push({
                ...item,
                failedAt: Date.now()
            });
            // Keep only last 50 failed operations
            if (failed.length > 50) {
                failed.splice(0, failed.length - 50);
            }
            localStorage.setItem(failedKey, JSON.stringify(failed));
        } catch (error) {
            console.error('[SyncQueue] Error storing failed operation:', error);
        }
    }
    
    handleOnline() {
        this.isOnline = true;
        this.notifyQueueUpdate();
        
        // Start processing queue after a short delay
        setTimeout(() => {
            if (this.queue.length > 0) {
                this.processQueue();
            }
        }, 1000);
    }
    
    handleOffline() {
        this.isOnline = false;
        this.notifyQueueUpdate();
    }
    
    startPeriodicProcessing() {
        // Try to process queue every 30 seconds if online
        setInterval(() => {
            if (this.isOnline && this.queue.length > 0 && !this.processing) {
                this.processQueue();
            }
        }, 30000);
    }
    
    notifyQueueUpdate() {
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('syncQueueUpdate', {
            detail: {
                queueLength: this.queue.length,
                isOnline: this.isOnline,
                processing: this.processing
            }
        }));
    }
    
    // Get queue status
    getStatus() {
        return {
            queueLength: this.queue.length,
            isOnline: this.isOnline,
            processing: this.processing,
            items: this.queue.map(item => ({
                id: item.id,
                type: item.type,
                timestamp: item.timestamp,
                retryCount: item.retryCount || 0
            }))
        };
    }
    
    // Clear queue (for testing/debugging)
    clearQueue() {
        this.queue = [];
        this.retryCount.clear();
        this.saveQueue();
        this.notifyQueueUpdate();
    }
    
    // Manual retry of failed operations
    retryFailed() {
        const failedKey = 'stackmap-failed-sync-operations';
        try {
            const failed = JSON.parse(localStorage.getItem(failedKey) || '[]');
            failed.forEach(item => {
                delete item.failedAt;
                delete item.retryCount;
                delete item.lastError;
                this.enqueue(item);
            });
            localStorage.removeItem(failedKey);
        } catch (error) {
            console.error('[SyncQueue] Error retrying failed operations:', error);
        }
    }
}

// === GOOGLE DRIVE SYNC ===
class GoogleDriveSync {
    constructor(app) {
        this.app = app;
        this.isSignedIn = false;
        this.currentUser = null;
        this.accessToken = null;
        this.tokenExpiresAt = null;
        this.STACKMAP_FOLDER_NAME = 'StackMap Data';
        this.STACKMAP_FILE_NAME = 'stackmap-data.json';
        this.folderId = null;
        this.lastKnownRemoteVersion = 0;
        this.isSyncing = false;
        this.syncCheckInterval = null;
        
        // Token refresh management
        this.tokenRefreshTimer = null;
        this.tokenRefreshRetryCount = 0;
        this.maxTokenRefreshRetries = 5;
        this.tokenRefreshBackoff = 1000; // Start with 1 second
        
        // Silent refresh iframe
        this.silentRefreshIframe = null;
        
        // Initialize sync queue
        this.syncQueue = new SyncQueue();
        this.syncQueue.operationProcessor = this.processSyncOperation.bind(this);
        
        // Initialize UI for sync queue
        this.initializeSyncQueueUI();
        
        // Initialize Google APIs
        this.initializeGoogleAPIs();
    }

    async initializeGoogleAPIs() {
        try {
            
            // Skip initialization in demo mode
            if (window.DEMO_MODE || localStorage.getItem('stackMapDemoMode') === 'true') {
                return;
            }
            
            // Check if credentials are configured
            if (!CONFIG.GOOGLE_CLIENT_ID || !CONFIG.GOOGLE_API_KEY) {
                console.warn('Google Drive sync disabled: API credentials not configured');
                return;
            }

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
                apiKey: CONFIG.GOOGLE_API_KEY
            });
            
            // Load the Drive API discovery document
            await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
            
            // Verify Drive API is loaded
            if (!gapi.client.drive) {
                throw new Error('Drive API failed to load');
            }

            // Initialize Google Identity Services
            this.initializeGoogleIdentity();
            
            // Check for stored auth token
            await this.checkStoredAuth();
            
        } catch (error) {
            console.error('[GoogleDriveSync] Error loading Google APIs:', error);
            this.showSyncError('Failed to load Google services. Please refresh the page.');
        }
    }

    async checkStoredAuth() {
        const storedToken = localStorage.getItem('stackmap-google-token');
        const storedExpiry = localStorage.getItem('stackmap-token-expiry');
        const storedEmail = localStorage.getItem('stackmap-user-email');
        
        if (storedToken && storedExpiry) {
            this.accessToken = storedToken;
            this.tokenExpiresAt = parseInt(storedExpiry);
            
            // Check if token is still valid
            const now = Date.now();
            const timeUntilExpiry = this.tokenExpiresAt - now;
            
            if (timeUntilExpiry > 60000) { // More than 1 minute left
                // Token is still valid
                gapi.client.setToken({
                    access_token: this.accessToken
                });
                
                // Ensure Drive API is loaded before using restored token
                if (!gapi.client.drive) {
                    try {
                        await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
                    } catch (error) {
                        console.error('[GoogleDriveSync] Failed to load Drive API:', error);
                        return;
                    }
                }
                
                this.updateSignInStatus(true);
                
                // Schedule token refresh before it expires
                this.scheduleTokenRefresh();
                
                // Start sync checks
                this.startSyncCheckInterval();
                this.checkForRemoteChanges();
            } else {
                // Token expired or about to expire, try silent refresh
                this.performSilentTokenRefresh();
            }
        } else {
            // No stored auth, check for returning user
            if (storedEmail) {
                // Try Google One Tap for returning user
                this.showGoogleOneTap(storedEmail);
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

            // Initialize Google One Tap
            google.accounts.id.initialize({
                client_id: CONFIG.GOOGLE_CLIENT_ID,
                callback: this.handleOneTapResponse.bind(this),
                auto_select: true, // Auto-select for returning users
                use_fedcm_for_prompt: true, // Future-proofing with FedCM API
                cancel_on_tap_outside: false,
                itp_support: true
            });

            // Initialize Google Auth for token access
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CONFIG.GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.file email',
                callback: async (response) => {
                    await this.handleTokenResponse(response);
                },
                error_callback: this.handleTokenError.bind(this),
                hint: localStorage.getItem('stackmap-user-email') || '' // Use stored email as hint
            });

        } catch (error) {
            console.error('Error initializing Google Identity Services:', error);
        }
    }

    showGoogleOneTap(loginHint = null) {
        try {
            const options = {
                client_id: CONFIG.GOOGLE_CLIENT_ID,
                auto_select: true,
                cancel_on_tap_outside: false
            };
            
            if (loginHint) {
                options.login_hint = loginHint;
            }
            
            google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    // One Tap not shown, fall back to regular sign-in
                }
            });
        } catch (error) {
            console.error('[GoogleDriveSync] Error showing One Tap:', error);
        }
    }

    async handleOneTapResponse(response) {
        
        // Decode the JWT to get user info
        const payload = this.parseJwt(response.credential);
        if (payload && payload.email) {
            // Store user email for future use
            localStorage.setItem('stackmap-user-email', payload.email);
        }
        
        // Request access token
        this.requestAccessToken();
    }

    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('[GoogleDriveSync] Error parsing JWT:', error);
            return null;
        }
    }

    async handleTokenResponse(response) {
        if (response.error) {
            console.error('Token error:', response.error);
            this.handleTokenError(response);
            return;
        }

        this.accessToken = response.access_token;
        this.isSignedIn = true;
        
        // Calculate token expiry (tokens typically last 1 hour)
        const expiresIn = response.expires_in || 3600; // Default to 1 hour
        this.tokenExpiresAt = Date.now() + (expiresIn * 1000);
        
        // Store token and expiry for persistence
        localStorage.setItem('stackmap-google-token', this.accessToken);
        localStorage.setItem('stackmap-token-expiry', this.tokenExpiresAt.toString());
        
        // Get user info if we don't have it
        if (!localStorage.getItem('stackmap-user-email')) {
            await this.fetchUserInfo();
        }
        
        // Set the token for gapi client
        gapi.client.setToken({
            access_token: this.accessToken
        });
        
        // Ensure Drive API is loaded before proceeding
        if (!gapi.client.drive) {
            try {
                await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
            } catch (error) {
                console.error('[GoogleDriveSync] Failed to load Drive API:', error);
                this.showSyncError('Failed to initialize Google Drive API');
                return;
            }
        }

        this.updateSignInStatus(true);
        
        // Clear folder ID to force refresh on new sign-in
        this.folderId = null;
        
        // Reset retry count on successful auth
        this.tokenRefreshRetryCount = 0;
        this.tokenRefreshBackoff = 1000;
        
        // Schedule token refresh
        this.scheduleTokenRefresh();
        
        // Start sync check interval
        this.startSyncCheckInterval();
        
        // Process any queued operations
        if (this.syncQueue && this.syncQueue.queue.length > 0) {
            this.syncQueue.processQueue();
        }
        
        // Do initial sync check
        this.checkForRemoteChanges();
    }

    async fetchUserInfo() {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (response.ok) {
                const userInfo = await response.json();
                if (userInfo.email) {
                    localStorage.setItem('stackmap-user-email', userInfo.email);
                }
            }
        } catch (error) {
            console.error('[GoogleDriveSync] Error fetching user info:', error);
        }
    }

    handleTokenError(error) {
        console.error('[GoogleDriveSync] Token error:', error);
        
        if (error.type === 'popup_closed' || error.type === 'popup_failed_to_open') {
            // Popup was blocked or closed, try silent refresh
            this.performSilentTokenRefresh();
        } else {
            // Apply exponential backoff for retries
            if (this.tokenRefreshRetryCount < this.maxTokenRefreshRetries) {
                this.tokenRefreshRetryCount++;
                const delay = Math.min(this.tokenRefreshBackoff * Math.pow(2, this.tokenRefreshRetryCount - 1), 60000); // Max 1 minute

                setTimeout(() => {
                    this.performSilentTokenRefresh();
                }, delay);
            } else {
                this.showSyncError(`Authorization failed: ${error.message || error.type || 'Unknown error'}`);
                this.updateSignInStatus(false);
            }
        }
    }

    scheduleTokenRefresh() {
        // Clear any existing timer
        if (this.tokenRefreshTimer) {
            clearTimeout(this.tokenRefreshTimer);
        }
        
        if (!this.tokenExpiresAt) return;
        
        const now = Date.now();
        const timeUntilExpiry = this.tokenExpiresAt - now;
        
        // Refresh 5 minutes before expiry
        const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 0);
        
        if (refreshTime > 0) {
            
            this.tokenRefreshTimer = setTimeout(() => {
                this.performSilentTokenRefresh();
            }, refreshTime);
        } else {
            // Token already expired or about to expire
            this.performSilentTokenRefresh();
        }
    }

    async performSilentTokenRefresh() {
        
        try {
            // First try iframe-based silent refresh
            const success = await this.silentIframeRefresh();
            
            if (!success) {
                // If iframe refresh fails, try requestAccessToken with no prompt
                this.requestAccessToken(false);
            }
        } catch (error) {
            console.error('[GoogleDriveSync] Silent refresh error:', error);
            this.handleTokenError({ type: 'silent_refresh_failed', message: error.message });
        }
    }

    async silentIframeRefresh() {
        return new Promise((resolve) => {
            try {
                // Create hidden iframe for silent auth
                if (this.silentRefreshIframe) {
                    document.body.removeChild(this.silentRefreshIframe);
                }
                
                this.silentRefreshIframe = document.createElement('iframe');
                this.silentRefreshIframe.style.display = 'none';
                this.silentRefreshIframe.setAttribute('aria-hidden', 'true');
                
                // Set up message listener for iframe response
                const messageListener = (event) => {
                    if (event.origin !== 'https://accounts.google.com') return;
                    
                    if (event.data && event.data.type === 'authResult') {
                        window.removeEventListener('message', messageListener);
                        
                        if (event.data.access_token) {
                            // Successfully got new token
                            this.handleTokenResponse({
                                access_token: event.data.access_token,
                                expires_in: event.data.expires_in
                            });
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    }
                };
                
                window.addEventListener('message', messageListener);
                
                // Build OAuth URL for iframe
                const params = new URLSearchParams({
                    client_id: CONFIG.GOOGLE_CLIENT_ID,
                    redirect_uri: window.location.origin,
                    response_type: 'token',
                    scope: 'https://www.googleapis.com/auth/drive.file email',
                    prompt: 'none',
                    login_hint: localStorage.getItem('stackmap-user-email') || '',
                    include_granted_scopes: 'true'
                });
                
                this.silentRefreshIframe.src = `https://accounts.google.com/oauth2/v2/auth?${params.toString()}`;
                document.body.appendChild(this.silentRefreshIframe);
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    window.removeEventListener('message', messageListener);
                    resolve(false);
                }, 5000);
                
            } catch (error) {
                console.error('[GoogleDriveSync] Iframe refresh error:', error);
                resolve(false);
            }
        });
    }

    requestAccessToken(showPrompt = true) {
        if (!this.tokenClient) {
            console.error('[GoogleDriveSync] Token client not initialized');
            return;
        }
        
        const options = {
            prompt: showPrompt ? 'consent' : ''
        };
        
        // Add login hint if available
        const userEmail = localStorage.getItem('stackmap-user-email');
        if (userEmail) {
            options.hint = userEmail;
            options.login_hint = userEmail;
        }
        
        this.tokenClient.requestAccessToken(options);
    }

    updateSignInStatus(isSignedIn) {
        this.isSignedIn = isSignedIn;
        const signInBtn = document.getElementById('googleSignInBtn');
        const syncStatus = document.getElementById('syncStatus');
        const syncActions = document.getElementById('syncActions');
        const syncBtn = document.getElementById('syncBtn');
        const syncUser = document.getElementById('syncUser');

        // Check if DOM elements exist before using them
        if (!signInBtn || !syncStatus || !syncActions || !syncBtn || !syncUser) {
            console.warn('[GoogleDriveSync] UI elements not found - sync state updated internally');
            // Don't return early - let internal state update even if UI is missing
        }

        // Update header sync status indicator
        this.updateHeaderSyncStatus(isSignedIn);

        if (isSignedIn) {
            // Update UI if elements exist
            if (signInBtn) signInBtn.style.display = 'none';
            if (syncStatus) syncStatus.style.display = 'flex';
            if (syncActions) syncActions.style.display = 'flex';
            
            const userEmail = localStorage.getItem('stackmap-user-email');
            if (syncUser) {
                syncUser.textContent = userEmail ? `Connected: ${userEmail}` : 'Connected to Google Drive';
            }
            
            // Show sync button in grown-up mode
            if (this.app?.grownupMode && syncBtn) {
                syncBtn.classList.remove('hidden');
            }
            
        } else {
            this.currentUser = null;
            this.accessToken = null;
            this.tokenExpiresAt = null;
            this.folderId = null;
            
            // Clear token refresh timer
            if (this.tokenRefreshTimer) {
                clearTimeout(this.tokenRefreshTimer);
                this.tokenRefreshTimer = null;
            }
            
            // Stop sync checks
            this.stopSyncCheckInterval();
            
            // Update UI if elements exist
            if (signInBtn) signInBtn.style.display = 'block';
            if (syncStatus) syncStatus.style.display = 'none';
            if (syncActions) syncActions.style.display = 'none';
            if (syncBtn) syncBtn.classList.add('hidden');
            
        }
    }

    startSyncCheckInterval() {
        // Check for remote changes every 30 seconds to reduce notification spam
        this.syncCheckInterval = setInterval(() => {
            if (this.isSignedIn && !this.isSyncing) {
                this.checkForRemoteChanges();
            }
        }, 30000);
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
            
            // Check if we have a stored email for One Tap
            const storedEmail = localStorage.getItem('stackmap-user-email');
            if (storedEmail) {
                // Try One Tap first for returning users
                this.showGoogleOneTap(storedEmail);
                
                // Also prepare regular sign-in as fallback
                setTimeout(() => {
                    // If not signed in after 3 seconds, show regular prompt
                    if (!this.isSignedIn) {
                        this.requestAccessToken(true);
                    }
                }, 3000);
            } else {
                // First time user, show regular sign-in
                this.requestAccessToken(true);
            }
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
            
            // Clear stored tokens but keep email for future One Tap
            localStorage.removeItem('stackmap-google-token');
            localStorage.removeItem('stackmap-token-expiry');
            // Keep stackmap-user-email for One Tap on next visit
            
            this.updateSignInStatus(false);
        } catch (error) {
            console.error('Sign-out error:', error);
            this.showSyncError('Failed to sign out. Please try again.');
        }
    }

    async checkTokenValidity() {
        if (!this.accessToken) return false;
        
        // First check local expiry
        if (this.tokenExpiresAt && Date.now() >= this.tokenExpiresAt) {
            return false;
        }
        
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + this.accessToken);
            const data = await response.json();
            
            if (data.error) {
                return false;
            }
            
            // Update expiry time if provided
            if (data.expires_in) {
                this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);
                localStorage.setItem('stackmap-token-expiry', this.tokenExpiresAt.toString());
            }
            
            return true;
        } catch (error) {
            console.error('[GoogleDriveSync] Error checking token:', error);
            return false;
        }
    }

    async refreshTokenIfNeeded() {
        const isValid = await this.checkTokenValidity();
        if (!isValid) {
            
            // Clear invalid stored token
            localStorage.removeItem('stackmap-google-token');
            localStorage.removeItem('stackmap-token-expiry');
            
            // Try silent refresh
            await this.performSilentTokenRefresh();
            
            // Check if refresh was successful
            return this.isSignedIn;
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
                // `);
                
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
            // 
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
        // Silently apply changes without notification for better UX
        this.applyRemoteChanges(remoteData);
        // Only log to console for debugging
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

    async uploadData(silent = false) {
        // If offline, queue the operation
        if (!navigator.onLine) {
            this.syncQueue.enqueue({
                type: 'upload',
                data: {
                    silent: silent,
                    appState: this.app.appState.exportData()
                }
            });
            if (!silent) {
                this.showSyncError('Offline - changes will sync when connection returns');
            }
            return;
        }
        
        if (!this.isSignedIn || this.isSyncing) {
            // Queue if not signed in
            if (!this.isSignedIn) {
                this.syncQueue.enqueue({
                    type: 'upload',
                    data: {
                        silent: silent,
                        appState: this.app.appState.exportData()
                    }
                });
            }
            return;
        }

        this.isSyncing = true;

        try {
            // Check token validity
            if (!await this.refreshTokenIfNeeded()) {
                this.showSyncError('Please sign in again to continue.');
                this.isSyncing = false;
                // Queue the operation
                this.syncQueue.enqueue({
                    type: 'upload',
                    data: {
                        silent: silent,
                        appState: this.app.appState.exportData()
                    }
                });
                return;
            }

            if (!silent) {
                this.showSyncProgress('Saving to Google Drive...');
            }
            
            // Use the extracted upload logic
            await this.performUpload(silent);
        } catch (error) {
            console.error('Upload error:', error);
            if (!silent) {
                this.showSyncError(`Failed to save: ${error.message || 'Unknown error'}`);
            }
        } finally {
            this.isSyncing = false;
        }
    }

    async downloadData() {
        // If offline, queue the operation
        if (!navigator.onLine) {
            this.showSyncError('Cannot download while offline');
            return;
        }
        
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
            // Make sure Drive API is loaded with retry
            if (!gapi.client.drive) {
                let retries = 3;
                while (retries > 0 && !gapi.client.drive) {
                    try {
                        await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
                        if (gapi.client.drive) {
                            break;
                        }
                    } catch (error) {
                        console.error('[GoogleDriveSync] Failed to load Drive API, retries left:', retries - 1);
                        retries--;
                        if (retries > 0) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    }
                }
                
                if (!gapi.client.drive) {
                    throw new Error('Failed to load Drive API after multiple attempts');
                }
            }
            
            // Search for existing folder
            const response = await gapi.client.drive.files.list({
                q: `name='${this.STACKMAP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                spaces: 'drive',
                fields: 'files(id, name)'
            });

            // 

            if (response.result.files && response.result.files.length > 0) {
                this.folderId = response.result.files[0].id;
                // 
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
            // 
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

            // 

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

    updateHeaderSyncStatus(isSignedIn, state = 'synced') {
        const headerStatus = document.getElementById('headerSyncStatus');
        if (!headerStatus) return;

        const icon = headerStatus.querySelector('.header-sync-icon');
        const text = headerStatus.querySelector('.header-sync-text');

        if (!isSignedIn) {
            headerStatus.style.display = 'none';
            headerStatus.classList.remove('active');
            return;
        }

        headerStatus.style.display = '';
        headerStatus.classList.add('active');
        headerStatus.className = 'header-sync-status active ' + state;

        switch (state) {
            case 'syncing':
                icon.textContent = 'sync';
                text.textContent = 'Backing up...';
                break;
            case 'synced':
                icon.textContent = 'cloud_done';
                text.textContent = 'Backed up';
                break;
            case 'error':
                icon.textContent = 'cloud_off';
                text.textContent = 'Backup failed';
                break;
        }

        // Update last sync time
        if (state === 'synced' && this.app.appState.syncSettings?.lastSync) {
            this.app.appState.syncSettings.lastSync = new Date().toISOString();
        }
    }

    showSyncProgress(message) {
        // Update header sync status
        this.updateHeaderSyncStatus(true, 'syncing');

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
        // Update header sync status
        this.updateHeaderSyncStatus(true, 'synced');

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
        // Update header sync status
        this.updateHeaderSyncStatus(true, 'error');

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
    async autoSync(silent = false) {
        // Always attempt upload - queue will handle offline/signed-out states
        try {
            await this.uploadData(silent);
        } catch (error) {
            console.error('Auto-sync failed:', error);
            if (!silent) {
                this.handleSyncError(error, 'auto-sync');
            }
        }
    }

    // Manual sync triggered by user (always shows notifications)
    async syncNow() {
        if (this.isSignedIn && !this.isSyncing) {
            try {
                // Always show notifications for manual syncs
                await this.uploadData(false);
            } catch (error) {
                console.error('Manual sync failed:', error);
                this.handleSyncError(error, 'manual-sync');
            }
        }
    }
    
    // Queue specific activity operations for fine-grained sync
    queueActivityUpdate(userId, activityId, updates) {
        this.syncQueue.enqueue({
            type: 'update-activity',
            data: {
                userId: userId,
                activityId: activityId,
                updates: updates,
                timestamp: Date.now()
            }
        });
    }
    
    queueActivityDelete(userId, activityId) {
        this.syncQueue.enqueue({
            type: 'delete-activity',
            data: {
                userId: userId,
                activityId: activityId,
                timestamp: Date.now()
            }
        });
    }
    
    queueActivityMove(userId, activityId, fromIndex, toIndex) {
        this.syncQueue.enqueue({
            type: 'move-activity',
            data: {
                userId: userId,
                activityId: activityId,
                fromIndex: fromIndex,
                toIndex: toIndex,
                timestamp: Date.now()
            }
        });
    }
    
    queueUserSwitch(newUserId) {
        this.syncQueue.enqueue({
            type: 'switch-user',
            data: {
                userId: newUserId,
                timestamp: Date.now()
            }
        });
    }
    
    queueBatchUpdate(userId, activityIds, updates) {
        this.syncQueue.enqueue({
            type: 'batch-update',
            data: {
                userId: userId,
                activityIds: activityIds,
                updates: updates,
                timestamp: Date.now()
            }
        });
    }

    // Process sync operation from queue
    async processSyncOperation(operation) {
        
        switch (operation.type) {
            case 'upload':
                // Restore app state from queued data if needed
                if (operation.data.appState) {
                    // Check if the queued data is newer than current
                    const queuedVersion = operation.data.appState.syncMetadata?.version || 0;
                    const currentVersion = this.app.appState.syncMetadata.version;
                    
                    if (queuedVersion > currentVersion) {
                        // Apply the queued state before uploading
                        this.app.appState.importData(operation.data.appState, false);
                        this.app.saveToLocalStorage();
                    }
                }
                
                // Perform the actual upload
                await this.performUpload(operation.data.silent);
                break;
                
            case 'download':
                await this.performDownload();
                break;
                
            case 'update-activity':
                await this.performActivityUpdate(operation.data);
                break;
                
            case 'delete-activity':
                await this.performActivityDelete(operation.data);
                break;
                
            case 'move-activity':
                await this.performActivityMove(operation.data);
                break;
                
            case 'batch-update':
                await this.performBatchUpdate(operation.data);
                break;
                
            case 'switch-user':
                await this.performUserSwitch(operation.data);
                break;
                
            default:
                throw new Error(`Unknown operation type: ${operation.type}`);
        }
    }
    
    // Extracted upload logic for queue processing
    async performUpload(silent = false) {
        if (!this.isSignedIn) {
            throw new Error('Not signed in');
        }
        
        // Get current app data
        const data = this.app.appState.exportData();
        data.lastSync = new Date().toISOString();
        data.deviceInfo = {
            userAgent: navigator.userAgent,
            timestamp: Date.now()
        };

        // Update sync settings with last sync time
        if (!this.app.appState.syncSettings) {
            this.app.appState.syncSettings = {};
        }
        this.app.appState.syncSettings.lastSync = data.lastSync;
        this.app.appState._triggerSave();

        // Ensure we have a folder
        await this.ensureStackMapFolder();

        // Check if file exists
        const existingFile = await this.findStackMapFile();
        
        let response;
        
        if (existingFile) {
            // Update existing file
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

        if (!response.ok) {
            const responseText = await response.text();
            throw new Error(`Upload failed: ${response.status} ${responseText}`);
        }
        
        // Update last known version
        this.lastKnownRemoteVersion = data.syncMetadata.version;
        
        if (!silent) {
            this.showSyncSuccess('Saved to Google Drive');
        }
    }
    
    // Extracted download logic for queue processing
    async performDownload() {
        if (!this.isSignedIn) {
            throw new Error('Not signed in');
        }
        
        const remoteData = await this.getRemoteData();
        if (!remoteData) {
            throw new Error('No remote data found');
        }
        
        // Apply remote changes
        this.applyRemoteChanges(remoteData);
    }
    
    // Granular sync operation implementations
    async performActivityUpdate(data) {
        
        // Phase 3: Use delta sync for efficient updates
        try {
            // Generate delta from recent operations
            const delta = this.app.appState.generateSyncDelta();
            
            if (!delta || delta.operations.length === 0) {
                // No operations to sync
                return;
            }
            
            // Check if we should compress
            const deltaSize = JSON.stringify(delta).length;
            let payload = delta;
            let isCompressed = false;
            
            if (deltaSize > 10 * 1024) { // 10KB threshold
                const compressed = this.app.appState.compressData(delta);
                const compressedSize = JSON.stringify(compressed).length;
                
                // Only use compression if it saves >20%
                if (compressedSize < deltaSize * 0.8) {
                    payload = compressed;
                    isCompressed = true;
                    console.log(`[Delta Sync] Compressed ${deltaSize} bytes to ${compressedSize} bytes`);
                }
            }
            
            // Send delta to Drive
            await this.uploadDelta({
                delta: payload,
                compressed: isCompressed,
                checksum: delta.checksum,
                deviceId: this.app.appState.syncMetadata.deviceId
            });
            
            // Mark operations as synced
            delta.operations.forEach(op => {
                this.app.appState._markOperationSynced(op.id);
            });
            
        } catch (error) {
            console.error('[Delta Sync] Activity update failed, falling back to full sync:', error);
            // Fall back to full sync if delta fails
            await this.performUpload(true);
        }
    }
    
    async performActivityDelete(data) {
        
        // Phase 3: Use delta sync for deletes
        try {
            const delta = this.app.appState.generateSyncDelta();
            
            if (!delta || delta.operations.length === 0) {
                return;
            }
            
            // For deletes, delta sync is usually small
            await this.uploadDelta({
                delta: delta,
                compressed: false,
                checksum: delta.checksum,
                deviceId: this.app.appState.syncMetadata.deviceId
            });
            
            // Mark operations as synced
            delta.operations.forEach(op => {
                this.app.appState._markOperationSynced(op.id);
            });
            
        } catch (error) {
            console.error('[Delta Sync] Activity delete failed, falling back to full sync:', error);
            await this.performUpload(true);
        }
    }
    
    async performActivityMove(data) {
        
        // Phase 3: Use delta sync for moves
        try {
            const delta = this.app.appState.generateSyncDelta();
            
            if (!delta || delta.operations.length === 0) {
                return;
            }
            
            // Move operations are typically small
            await this.uploadDelta({
                delta: delta,
                compressed: false,
                checksum: delta.checksum,
                deviceId: this.app.appState.syncMetadata.deviceId
            });
            
            // Mark operations as synced
            delta.operations.forEach(op => {
                this.app.appState._markOperationSynced(op.id);
            });
            
        } catch (error) {
            console.error('[Delta Sync] Activity move failed, falling back to full sync:', error);
            await this.performUpload(true);
        }
    }
    
    async performBatchUpdate(data) {
        
        // Phase 3: Use delta sync for batch updates
        try {
            const delta = this.app.appState.generateSyncDelta();
            
            if (!delta || delta.operations.length === 0) {
                return;
            }
            
            // Batch updates might be large, check for compression
            const deltaSize = JSON.stringify(delta).length;
            let payload = delta;
            let isCompressed = false;
            
            if (deltaSize > 10 * 1024) { // 10KB threshold
                const compressed = this.app.appState.compressData(delta);
                const compressedSize = JSON.stringify(compressed).length;
                
                if (compressedSize < deltaSize * 0.8) {
                    payload = compressed;
                    isCompressed = true;
                    console.log(`[Delta Sync] Batch compressed ${deltaSize} bytes to ${compressedSize} bytes`);
                }
            }
            
            await this.uploadDelta({
                delta: payload,
                compressed: isCompressed,
                checksum: delta.checksum,
                deviceId: this.app.appState.syncMetadata.deviceId
            });
            
            // Mark operations as synced
            delta.operations.forEach(op => {
                this.app.appState._markOperationSynced(op.id);
            });
            
        } catch (error) {
            console.error('[Delta Sync] Batch update failed, falling back to full sync:', error);
            await this.performUpload(true);
        }
    }
    
    async performUserSwitch(data) {
        
        // User switches don't need sync, just local state update
        // The actual data changes will be synced separately
        return;
    }
    
    // Upload delta changes to Google Drive
    async uploadDelta(deltaPayload) {
        if (!this.isSignedIn) {
            throw new Error('Not signed in');
        }
        
        // Ensure we have a folder
        await this.ensureStackMapFolder();
        
        // Create delta file name with timestamp
        const deltaFileName = `stackmap-delta-${Date.now()}.json`;
        
        // Upload delta file
        const metadata = {
            name: deltaFileName,
            parents: [this.folderId],
            mimeType: 'application/json',
            description: 'StackMap incremental sync delta'
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([JSON.stringify(deltaPayload)], { type: 'application/json' }));
        
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            },
            body: form
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Delta upload failed: ${error.error?.message || response.statusText}`);
        }
        
        // Also update the main file with new sync metadata
        await this.updateSyncMetadata();
        
        console.log('[Delta Sync] Successfully uploaded delta:', deltaFileName);
        return response.json();
    }
    
    // Update sync metadata in the main file
    async updateSyncMetadata() {
        try {
            // Get current file
            const existingFile = await this.findStackMapFile();
            if (!existingFile) return;
            
            // Get current data
            const currentData = await this.getRemoteData();
            if (!currentData) return;
            
            // Update only sync metadata
            currentData.syncMetadata = this.app.appState.syncMetadata;
            currentData.lastSync = new Date().toISOString();
            
            // Update file with new metadata
            await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(currentData, null, 2)
            });
            
        } catch (error) {
            console.error('[Delta Sync] Failed to update sync metadata:', error);
            // Non-fatal error, delta was still uploaded
        }
    }
    
    // Initialize sync queue UI
    initializeSyncQueueUI() {
        // Listen for queue updates
        window.addEventListener('syncQueueUpdate', (event) => {
            this.updateSyncQueueIndicator(event.detail);
        });
        
        // Create sync queue indicator element
        this.createSyncQueueIndicator();
    }
    
    createSyncQueueIndicator() {
        // Create indicator element
        const indicator = document.createElement('div');
        indicator.id = 'syncQueueIndicator';
        indicator.className = 'sync-queue-indicator';
        indicator.setAttribute('data-tooltip', 'Click to view sync queue details');
        indicator.innerHTML = `
            <i class="material-icons">cloud_queue</i>
            <span class="sync-queue-text">Offline</span>
            <span class="sync-queue-count">0</span>
        `;
        
        // Add click handler to show queue details
        indicator.addEventListener('click', () => this.showSyncQueueDetails());
        
        document.body.appendChild(indicator);
    }
    
    updateSyncQueueIndicator(status) {
        const indicator = document.getElementById('syncQueueIndicator');
        if (!indicator) return;
        
        const icon = indicator.querySelector('.material-icons');
        const text = indicator.querySelector('.sync-queue-text');
        const count = indicator.querySelector('.sync-queue-count');
        
        // Store previous queue length
        const prevLength = parseInt(count.textContent) || 0;
        
        // Update visibility
        if (status.queueLength > 0 || !status.isOnline) {
            indicator.classList.add('visible');
        } else {
            indicator.classList.remove('visible');
        }
        
        // Add pulse animation for new items
        if (status.queueLength > prevLength && status.queueLength > 0) {
            indicator.classList.add('has-new-items');
            setTimeout(() => indicator.classList.remove('has-new-items'), 2000);
        }
        
        // Update state classes
        indicator.classList.remove('offline', 'syncing', 'error', 'spinning');
        icon.classList.remove('spinning');
        
        if (!status.isOnline) {
            indicator.classList.add('offline');
            icon.textContent = 'cloud_off';
            text.textContent = 'Offline';
            indicator.setAttribute('data-tooltip', 'You are offline - changes will sync when connected');
        } else if (status.processing) {
            indicator.classList.add('syncing');
            icon.textContent = 'sync';
            icon.classList.add('spinning');
            text.textContent = 'Syncing';
            indicator.setAttribute('data-tooltip', 'Syncing changes to cloud...');
        } else if (status.queueLength > 0) {
            indicator.classList.add('syncing');
            icon.textContent = 'cloud_queue';
            text.textContent = 'Pending';
            indicator.setAttribute('data-tooltip', `${status.queueLength} pending changes - click for details`);
        }
        
        // Update count
        count.textContent = status.queueLength;
        count.style.display = status.queueLength > 0 ? 'inline-block' : 'none';
    }
    
    showSyncQueueDetails() {
        const status = this.syncQueue.getStatus();
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'sync-queue-modal';
        
        const content = document.createElement('div');
        content.className = 'sync-queue-modal-content';
        
        content.innerHTML = `
            <div class="sync-queue-modal-header">
                <h2><i class="material-icons">cloud_queue</i> Sync Queue Status</h2>
            </div>
            
            <div class="sync-queue-status">
                <div class="sync-queue-status-item ${status.isOnline ? 'online' : 'offline'}">
                    <div class="label">Network Status</div>
                    <div class="value">${status.isOnline ? 'Online' : 'Offline'}</div>
                </div>
                <div class="sync-queue-status-item">
                    <div class="label">Pending Items</div>
                    <div class="value">${status.queueLength}</div>
                </div>
                <div class="sync-queue-status-item">
                    <div class="label">Processing</div>
                    <div class="value">${status.processing ? 'Active' : 'Idle'}</div>
                </div>
            </div>
            
            <div class="sync-queue-operations">
                ${status.queueLength > 0 ? `
                    <h3>Pending Operations</h3>
                    ${status.items.map(item => `
                        <div class="sync-queue-operation-item">
                            <div class="sync-queue-operation-header">
                                <span class="sync-queue-operation-type">${item.type}</span>
                                <div class="sync-queue-operation-meta">
                                    <span class="sync-queue-operation-time">${new Date(item.timestamp).toLocaleString()}</span>
                                    ${item.retryCount > 0 ? `<span class="sync-queue-operation-retries">Retries: ${item.retryCount}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                ` : `
                    <div class="sync-queue-empty">
                        <i class="material-icons">check_circle</i>
                        <p>No pending operations</p>
                        <p style="font-size: 14px; color: #999;">All changes have been synchronized</p>
                    </div>
                `}
            </div>
            
            <div class="sync-queue-modal-actions">
                ${status.queueLength > 0 ? `
                    <button id="clearQueueBtn" class="btn-danger">Clear Queue</button>
                ` : ''}
                <button id="closeModalBtn" class="btn-primary">Close</button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            modal.classList.add('closing');
            setTimeout(() => document.body.removeChild(modal), 300);
        });
        
        const clearBtn = document.getElementById('clearQueueBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear the sync queue? Pending changes will be lost.')) {
                    this.syncQueue.clearQueue();
                    modal.classList.add('closing');
                    setTimeout(() => document.body.removeChild(modal), 300);
                }
            });
        }
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('closing');
                setTimeout(() => document.body.removeChild(modal), 300);
            }
        });
        
        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.classList.add('closing');
                setTimeout(() => document.body.removeChild(modal), 300);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
    
    // Add cleanup method
    cleanup() {
        this.stopSyncCheckInterval();
        
        if (this.autoSyncTimeout) {
            clearTimeout(this.autoSyncTimeout);
            this.autoSyncTimeout = null;
        }
        
        if (this.tokenRefreshTimer) {
            clearTimeout(this.tokenRefreshTimer);
            this.tokenRefreshTimer = null;
        }
        
        if (this.silentRefreshIframe && this.silentRefreshIframe.parentNode) {
            this.silentRefreshIframe.parentNode.removeChild(this.silentRefreshIframe);
            this.silentRefreshIframe = null;
        }
        
        // Clear any pending operations
        this.isSyncing = false;
    }

    // Add error handling helper
    handleSyncError(error, operation) {
        console.error(`Drive sync error during ${operation}:`, error);
        
        // Check for specific error types
        if (error.status === 401) {
            // Token expired or invalid
            this.showSyncError('Authentication expired. Please sign in again.');
            this.signOut();
        } else if (error.status === 403) {
            // Permission denied
            this.showSyncError('Permission denied. Please check your Google Drive permissions.');
        } else if (error.status === 404) {
            // File not found - might need to recreate folder
            this.folderId = null;
            this.showSyncError('Sync folder not found. Will recreate on next sync.');
        } else if (!navigator.onLine) {
            // Network error
            this.showSyncError('No internet connection. Sync will resume when online.');
        } else {
            // Generic error
            this.showSyncError(`Sync failed: ${error.message || 'Unknown error'}`);
        }
    }
    
    // Retry failed sync operations
    retryFailedOperations() {
        this.syncQueue.retryFailed();
        this.showToast('Retrying failed sync operations...', 'info');
    }
    
    // Get sync queue status for debugging
    getSyncQueueStatus() {
        return this.syncQueue.getStatus();
    }
    
    // Clear sync queue (use with caution)
    clearSyncQueue() {
        if (confirm('Are you sure you want to clear the sync queue? All pending changes will be lost.')) {
            this.syncQueue.clearQueue();
            this.showToast('Sync queue cleared', 'info');
        }
    }
}

// Make available globally
window.GoogleDriveSync = GoogleDriveSync;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if not already initialized
    if (!window.googleDriveSync) {
        window.googleDriveSync = new GoogleDriveSync();
    }
});