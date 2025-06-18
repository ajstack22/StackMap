/**
 * Google Drive API Mock for Testing
 * Simulates Google API responses without actual authentication
 */

class GoogleDriveMock {
    constructor() {
        this.isSignedIn = false;
        this.currentUser = null;
        this.files = new Map(); // Simulate Drive storage
        this.responses = {
            success: true,
            delay: 100 // Simulate network delay
        };
    }

    // Mock the gapi object that would be injected by Google
    createGapiMock() {
        return {
            load: (api, callback) => {
                setTimeout(() => {
                    if (this.responses.success) {
                        callback();
                    } else {
                        throw new Error('Failed to load Google API');
                    }
                }, this.responses.delay);
            },
            
            client: {
                init: async (config) => {
                    if (!config.apiKey || !config.clientId) {
                        throw new Error('Missing API credentials');
                    }
                    return Promise.resolve();
                },
                
                setToken: (token) => {
                    this.currentToken = token;
                },
                
                drive: {
                    files: {
                        list: async (params) => {
                            const mockFiles = Array.from(this.files.values())
                                .filter(f => !f.trashed);
                            
                            return {
                                result: {
                                    files: mockFiles.map(f => ({
                                        id: f.id,
                                        name: f.name,
                                        mimeType: f.mimeType,
                                        modifiedTime: f.modifiedTime
                                    }))
                                }
                            };
                        },
                        
                        create: async (params) => {
                            const fileId = `mock-file-${Date.now()}`;
                            const file = {
                                id: fileId,
                                name: params.resource.name,
                                mimeType: params.resource.mimeType || 'application/json',
                                content: params.media?.body || '',
                                modifiedTime: new Date().toISOString(),
                                trashed: false
                            };
                            
                            this.files.set(fileId, file);
                            
                            return {
                                result: {
                                    id: fileId,
                                    name: file.name
                                }
                            };
                        },
                        
                        update: async (params) => {
                            const file = this.files.get(params.fileId);
                            if (!file) {
                                throw new Error('File not found');
                            }
                            
                            if (params.media?.body) {
                                file.content = params.media.body;
                            }
                            file.modifiedTime = new Date().toISOString();
                            
                            return {
                                result: {
                                    id: file.id,
                                    modifiedTime: file.modifiedTime
                                }
                            };
                        },
                        
                        get: async (params) => {
                            const file = this.files.get(params.fileId);
                            if (!file) {
                                throw new Error('File not found');
                            }
                            
                            // Return file content based on alt parameter
                            if (params.alt === 'media') {
                                return {
                                    body: file.content
                                };
                            }
                            
                            return {
                                result: file
                            };
                        },
                        
                        delete: async (params) => {
                            const file = this.files.get(params.fileId);
                            if (!file) {
                                throw new Error('File not found');
                            }
                            
                            file.trashed = true;
                            return { result: {} };
                        }
                    }
                }
            },
            
            auth2: {
                getAuthInstance: () => ({
                    isSignedIn: {
                        get: () => this.isSignedIn,
                        listen: (callback) => {
                            this.signInListener = callback;
                        }
                    },
                    
                    currentUser: {
                        get: () => ({
                            getBasicProfile: () => ({
                                getEmail: () => this.currentUser?.email || 'test@example.com',
                                getName: () => this.currentUser?.name || 'Test User'
                            }),
                            
                            getAuthResponse: () => ({
                                access_token: 'mock-access-token',
                                expires_at: Date.now() + 3600000
                            }),
                            
                            hasGrantedScopes: (scope) => true
                        })
                    },
                    
                    signIn: async () => {
                        this.isSignedIn = true;
                        this.currentUser = {
                            email: 'test@example.com',
                            name: 'Test User'
                        };
                        
                        if (this.signInListener) {
                            this.signInListener(true);
                        }
                        
                        return Promise.resolve();
                    },
                    
                    signOut: async () => {
                        this.isSignedIn = false;
                        this.currentUser = null;
                        
                        if (this.signInListener) {
                            this.signInListener(false);
                        }
                        
                        return Promise.resolve();
                    },
                    
                    disconnect: async () => {
                        this.isSignedIn = false;
                        this.currentUser = null;
                        this.files.clear();
                        
                        return Promise.resolve();
                    }
                })
            }
        };
    }

    // Mock Google Identity Services (for One Tap)
    createGoogleMock() {
        return {
            accounts: {
                id: {
                    initialize: (config) => {
                        this.oneTapConfig = config;
                    },
                    
                    prompt: (callback) => {
                        // Simulate user selecting an account
                        setTimeout(() => {
                            if (this.responses.success) {
                                callback({
                                    isDisplayed: () => true,
                                    isNotDisplayed: () => false,
                                    getNotDisplayedReason: () => null
                                });
                            }
                        }, this.responses.delay);
                    },
                    
                    renderButton: (element, config) => {
                        // Create a mock sign-in button
                        const button = document.createElement('button');
                        button.textContent = 'Sign in with Google';
                        button.className = 'g_id_signin';
                        button.onclick = () => {
                            if (this.oneTapConfig?.callback) {
                                this.oneTapConfig.callback({
                                    credential: 'mock-jwt-credential',
                                    select_by: 'btn'
                                });
                            }
                        };
                        
                        if (element) {
                            element.appendChild(button);
                        }
                    },
                    
                    disableAutoSelect: () => {
                        // Mock implementation
                    }
                },
                
                oauth2: {
                    initTokenClient: (config) => ({
                        requestAccessToken: () => {
                            if (config.callback) {
                                config.callback({
                                    access_token: 'mock-access-token',
                                    expires_in: 3600,
                                    scope: config.scope
                                });
                            }
                        }
                    })
                }
            }
        };
    }

    // Helper methods for testing
    setSignedIn(signedIn) {
        this.isSignedIn = signedIn;
        if (this.signInListener) {
            this.signInListener(signedIn);
        }
    }

    setResponseSuccess(success) {
        this.responses.success = success;
    }

    setNetworkDelay(delay) {
        this.responses.delay = delay;
    }

    clearFiles() {
        this.files.clear();
    }

    getFile(fileName) {
        for (const file of this.files.values()) {
            if (file.name === fileName) {
                return file;
            }
        }
        return null;
    }

    // Inject mocks into the page
    inject(page) {
        return page.evaluateOnNewDocument((mockCode) => {
            // Create the mock before any scripts run
            const mockModule = eval(`(${mockCode})`);
            const mock = new mockModule();
            
            window.gapi = mock.createGapiMock();
            window.google = mock.createGoogleMock();
            
            // Store reference for test access
            window.__driveMock = mock;
        }, this.constructor.toString());
    }
}

module.exports = GoogleDriveMock;