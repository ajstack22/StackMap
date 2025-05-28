// === STATE MANAGEMENT ===
class AppState {
    constructor() {
        // Force loading of all default cards
        this.loadDefaultCards();
        
        // AUTO-SAVE CALLBACK
        this.onStateChange = null;
        
        // SYNC METADATA
        this.syncMetadata = {
            version: 1,
            lastModified: Date.now(),
            deviceId: this.getOrCreateDeviceId(),
            deviceName: this.getDeviceName()
        };
    }
    
    getOrCreateDeviceId() {
        let deviceId = localStorage.getItem('stackmap-device-id');
        if (!deviceId) {
            deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('stackmap-device-id', deviceId);
        }
        return deviceId;
    }
    
    getDeviceName() {
        const ua = navigator.userAgent;
        if (/iPhone|iPad/.test(ua)) return 'iOS Device';
        if (/Android/.test(ua)) return 'Android Device';
        if (/Windows/.test(ua)) return 'Windows PC';
        if (/Mac/.test(ua)) return 'Mac';
        return 'Web Browser';
    }
    
    loadDefaultCards() {
        this.activities = [
            // Default visible starter cards
            { title: "Good morning!", description: "It's time to get up!", icon: "☀️", visible: true, completed: false },
            { title: "Get dressed", description: "Gotta get ready!", icon: "👕", visible: true, completed: false },
            { title: "Go to school", description: "Let's get ready to learn!", icon: "🏫", visible: true, completed: false },
            
            // Hidden default routine cards for parents to enable as needed
            { title: "Wake up", description: "Rise and shine, sleepyhead!", icon: "⏰", visible: false, completed: false },
            { title: "Brush teeth", description: "Sparkle those pearly whites!", icon: "🦷", visible: false, completed: false },
            { title: "Wash face", description: "Splash away the sleepies!", icon: "💧", visible: false, completed: false },
            { title: "Eat breakfast", description: "Fuel up for an awesome day!", icon: "🥞", visible: false, completed: false },
            { title: "Take medicine", description: "Health heroes take their vitamins!", icon: "💊", visible: false, completed: false },
            { title: "Pack backpack", description: "Adventure gear ready to go!", icon: "🎒", visible: false, completed: false },
            { title: "Wash hands", description: "Squeaky clean superpower activated!", icon: "🧼", visible: false, completed: false },
            { title: "Use bathroom", description: "Even superheroes need pit stops!", icon: "🚽", visible: false, completed: false },
            { title: "Snack time", description: "Munch power to the rescue!", icon: "🍎", visible: false, completed: false },
            { title: "Do homework", description: "Brain training in session!", icon: "📚", visible: false, completed: false },
            { title: "Speech therapy", description: "Words are your superpower!", icon: "🗣️", visible: false, completed: false },
            { title: "Occupational therapy", description: "Skills building adventure time!", icon: "🧩", visible: false, completed: false },
            { title: "Physical therapy", description: "Strong body, strong mind!", icon: "💪", visible: false, completed: false },
            { title: "Quiet time", description: "Recharge your awesome batteries!", icon: "🧘", visible: false, completed: false },
            { title: "Deep breathing", description: "Inhale peace, exhale stress!", icon: "😮‍💨", visible: false, completed: false },
            { title: "Take break", description: "Even robots need downtime!", icon: "⏸️", visible: false, completed: false },
            { title: "Tidy room", description: "Make chaos behave itself!", icon: "🧹", visible: false, completed: false },
            { title: "Eat lunch", description: "Midday fuel for champions!", icon: "🥪", visible: false, completed: false },
            { title: "Play outside", description: "Go wild in the great outdoors!", icon: "🌳", visible: false, completed: false },
            { title: "Screen time", description: "Digital adventures await!", icon: "📱", visible: false, completed: false },
            { title: "Art time", description: "Unleash your creative genius!", icon: "🎨", visible: false, completed: false },
            { title: "Music time", description: "Let your soul sing out loud!", icon: "🎵", visible: false, completed: false },
            { title: "Help cooking", description: "Kitchen magic in the making!", icon: "👨‍🍳", visible: false, completed: false },
            { title: "Walk dog", description: "Paws for a friendly adventure!", icon: "🐕", visible: false, completed: false },
            { title: "Water plants", description: "Green thumb magic activated!", icon: "🪴", visible: false, completed: false },
            { title: "Eat dinner", description: "Family feast time begins!", icon: "🍽️", visible: false, completed: false },
            { title: "Take shower", description: "Wash the day's adventures away!", icon: "🚿", visible: false, completed: false },
            { title: "Comb hair", description: "Tame that magnificent mane!", icon: "💇", visible: false, completed: false },
            { title: "Put on pajamas", description: "Comfort mode: officially activated!", icon: "👔", visible: false, completed: false },
            { title: "Story time", description: "Journey to magical worlds!", icon: "📖", visible: false, completed: false },
            { title: "Bedtime routine", description: "Preparing for dream adventures!", icon: "🛏️", visible: false, completed: false },
            { title: "Say goodnight", description: "Sweet dreams are calling!", icon: "🌙", visible: false, completed: false },
            { title: "Apply sunscreen", description: "Shield up against sun rays!", icon: "☀️", visible: false, completed: false },
            { title: "Check weather", description: "What's Mother Nature planning today?", icon: "🌤️", visible: false, completed: false },
            { title: "Visit doctor", description: "Health checkup superhero style!", icon: "👩‍⚕️", visible: false, completed: false },
            { title: "Set alarm", description: "Tomorrow's adventure awaits planning!", icon: "⏰", visible: false, completed: false },
            { title: "Feed pets", description: "Furry friends need fuel too!", icon: "🐾", visible: false, completed: false },
            { title: "Make bed", description: "Tuck those sheets into submission!", icon: "🛏️", visible: false, completed: false },
            { title: "Check schedule", description: "What epic quests await today?", icon: "📅", visible: false, completed: false },
            { title: "Stretch body", description: "Wake up those sleepy muscles!", icon: "🤸", visible: false, completed: false },
            { title: "Practice skills", description: "Level up your awesome abilities!", icon: "🎯", visible: false, completed: false },
            { title: "Call family", description: "Spread some love through the airwaves!", icon: "📞", visible: false, completed: false },
            { title: "Sort laundry", description: "Tame the clothing mountain!", icon: "👗", visible: false, completed: false },
            { title: "Prep tomorrow", description: "Future you will thank present you!", icon: "📋", visible: false, completed: false },
            { title: "Gratitude time", description: "Count those daily victories!", icon: "🙏", visible: false, completed: false },
            { title: "Sensory break", description: "Recharge your super senses!", icon: "🌈", visible: false, completed: false }
        ];
        this.settings = {
            title: 'My StackMap',
            subtitle: 'Routine Ready',
            backgroundColor: '#667eea',
            showNumbers: false,
            isDefaultTitle: true,  // Track if using default title with logo
            newCardPosition: 'top'  // 'top' or 'bottom'
        };
        this.ui = {
            editMode: false,
            editingCardIndex: -1,
            selectedEmoji: CONFIG.DEFAULT_EMOJI,
            draggedElement: null,
            showingNewCardForm: false  // Track if new card form is open (false, 'top', or 'bottom')
        };
        
        // AUTO-SAVE CALLBACK
        this.onStateChange = null;
    }

    // HELPER TO TRIGGER SAVES
    _triggerSave() {
        // Update version and timestamp
        this.syncMetadata.version++;
        this.syncMetadata.lastModified = Date.now();
        
        if (this.onStateChange) {
            this.onStateChange();
        }
    }

    updateTheme(color) {
        this.settings.backgroundColor = color;
        this.applyTheme();
        this._triggerSave();
    }

    applyTheme() {
        const color = this.settings.backgroundColor;
        document.documentElement.style.setProperty('--primary-color', color);
        
        // Calculate darker variant
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
        const darkerColor = `rgb(${r}, ${g}, ${b})`;
        
        document.documentElement.style.setProperty('--primary-dark', darkerColor);
        document.documentElement.style.setProperty('--background-gradient-start', color);
        document.documentElement.style.setProperty('--background-gradient-end', darkerColor);
    }

    addActivity(activity) {
        if (this.activities.length >= CONFIG.MAX_ACTIVITIES) {
            throw new Error(`Maximum ${CONFIG.MAX_ACTIVITIES} activities allowed`);
        }
        
        const newActivity = { ...activity, visible: true, completed: false };
        
        if (this.settings.newCardPosition === 'bottom') {
            this.activities.push(newActivity);
        } else {
            this.activities.unshift(newActivity);
        }
        
        this._triggerSave();
    }

    removeActivity(index) {
        if (index >= 0 && index < this.activities.length) {
            this.activities.splice(index, 1);
            this._triggerSave();
        }
    }

    moveActivity(fromIndex, toIndex) {
        if (fromIndex >= 0 && fromIndex < this.activities.length && 
            toIndex >= 0 && toIndex < this.activities.length) {
            const item = this.activities.splice(fromIndex, 1)[0];
            this.activities.splice(toIndex, 0, item);
            this._triggerSave();
        }
    }

    toggleActivityVisibility(index) {
        if (index >= 0 && index < this.activities.length) {
            this.activities[index].visible = !this.activities[index].visible;
            this._triggerSave();
        }
    }

    toggleActivityCompletion(index) {
        if (index >= 0 && index < this.activities.length) {
            this.activities[index].completed = !this.activities[index].completed;
            this._triggerSave();
        }
    }

    updateActivity(index, updates) {
        if (index >= 0 && index < this.activities.length) {
            Object.assign(this.activities[index], updates);
            this._triggerSave();
        }
    }

    // Update title and track if it's custom
    updateTitle(newTitle) {
        this.settings.title = newTitle;
        this.settings.isDefaultTitle = (newTitle === 'My StackMap');
        this._triggerSave();
    }

    // Toggle new card position
    toggleNewCardPosition() {
        this.settings.newCardPosition = this.settings.newCardPosition === 'top' ? 'bottom' : 'top';
        this._triggerSave();
    }

    exportData() {
        return {
            ...this.settings,
            activities: this.activities,
            syncMetadata: this.syncMetadata,
            exportDate: new Date().toISOString()
        };
    }

    importData(data, updateVersion = true) {
        if (data.activities) this.activities = data.activities;
        if (data.title) {
            this.settings.title = data.title;
            // Check if imported title is default
            this.settings.isDefaultTitle = (data.title === 'My StackMap');
        }
        // Handle subtitle with default fallback
        if (data.subtitle !== undefined) {
            this.settings.subtitle = data.subtitle;
        } else {
            // Use default subtitle for legacy data without subtitle
            this.settings.subtitle = 'Routine Ready';
        }
        if (data.backgroundColor) this.settings.backgroundColor = data.backgroundColor;
        if (data.showNumbers !== undefined) this.settings.showNumbers = data.showNumbers;
        if (data.newCardPosition !== undefined) this.settings.newCardPosition = data.newCardPosition;
        // Handle legacy data without isDefaultTitle
        if (data.isDefaultTitle === undefined) {
            this.settings.isDefaultTitle = (this.settings.title === 'My StackMap');
        } else {
            this.settings.isDefaultTitle = data.isDefaultTitle;
        }
        
        // Import or update sync metadata
        if (data.syncMetadata) {
            // If importing from another device, maintain our device ID
            const ourDeviceId = this.syncMetadata.deviceId;
            this.syncMetadata = { ...data.syncMetadata };
            
            if (!updateVersion) {
                // Keep our device ID when merging
                this.syncMetadata.deviceId = ourDeviceId;
            }
        }
        
        this.applyTheme();
    }
    
    // Merge remote data with local data
    mergeWithRemote(remoteData) {
        const mergedActivities = new Map();
        
        // Add all local activities to map
        this.activities.forEach(activity => {
            const key = `${activity.title}-${activity.icon}`;
            mergedActivities.set(key, activity);
        });
        
        // Merge remote activities
        remoteData.activities.forEach(remoteActivity => {
            const key = `${remoteActivity.title}-${remoteActivity.icon}`;
            const localActivity = mergedActivities.get(key);
            
            if (!localActivity) {
                // New activity from remote
                mergedActivities.set(key, remoteActivity);
            } else {
                // Merge properties - prefer most recent changes
                if (remoteActivity.visible !== localActivity.visible) {
                    // Visibility changes are important - use most recent
                    mergedActivities.set(key, remoteActivity);
                }
            }
        });
        
        // Convert back to array
        this.activities = Array.from(mergedActivities.values());
        
        // Merge settings - prefer remote for most settings
        if (remoteData.title && remoteData.title !== this.settings.title) {
            this.settings.title = remoteData.title;
            this.settings.isDefaultTitle = remoteData.isDefaultTitle || false;
        }
        if (remoteData.subtitle !== undefined) {
            this.settings.subtitle = remoteData.subtitle;
        }
        if (remoteData.backgroundColor) {
            this.settings.backgroundColor = remoteData.backgroundColor;
        }
        if (remoteData.showNumbers !== undefined) {
            this.settings.showNumbers = remoteData.showNumbers;
        }
        if (remoteData.newCardPosition) {
            this.settings.newCardPosition = remoteData.newCardPosition;
        }
        
        // Update sync metadata
        this.syncMetadata.version = Math.max(this.syncMetadata.version, remoteData.syncMetadata.version) + 1;
        this.syncMetadata.lastModified = Date.now();
        
        this.applyTheme();
    }
}