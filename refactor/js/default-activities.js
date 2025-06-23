/**
 * Default Activities for StackMap
 * ES5 compatible - no const/let, arrow functions, or destructuring
 * Total: 111 activities (18 default + 93 in library)
 */

(function() {
    'use strict';
    
    // Activity Categories
    var ACTIVITY_CATEGORIES = {
        DAILY_CARE: 'Daily Care',
        SCHOOL: 'School & Learning',
        THERAPY: 'Therapy & Health',
        SENSORY: 'Sensory & Breaks',
        SOCIAL: 'Social Skills',
        PLAY: 'Play & Fun',
        MEALS: 'Meals & Snacks',
        TRANSITIONS: 'Transitions',
        CHORES: 'Chores & Responsibilities',
        EXERCISE: 'Exercise & Movement',
        CALMING: 'Calming & Regulation'
    };
    
    // Default activities (18 total, 3 visible by default)
    var DEFAULT_ACTIVITIES = [
        // First 3 visible by default
        {
            title: 'Morning Stretch',
            description: 'Wake up your body!',
            icon: '🌞',
            visible: true,
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        },
        {
            title: 'Brush Teeth',
            description: 'Keep them clean and shiny!',
            icon: '🦷',
            visible: true,
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        },
        {
            title: 'Get Dressed',
            description: 'Pick your favorite outfit!',
            icon: '👕',
            visible: true,
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        },
        
        // Additional cards - hidden by default for parents to enable
        {
            title: 'Breakfast Time',
            description: 'Fuel up for adventures!',
            icon: '🥞',
            visible: false,
            category: ACTIVITY_CATEGORIES.MEALS
        },
        {
            title: 'Take Medicine',
            description: 'Super vitamins for super kids!',
            icon: '💊',
            visible: false,
            category: ACTIVITY_CATEGORIES.THERAPY
        },
        {
            title: 'Pack Backpack',
            description: 'Everything in its special place!',
            icon: '🎒',
            visible: false,
            category: ACTIVITY_CATEGORIES.SCHOOL
        },
        {
            title: 'School Bus',
            description: 'All aboard the learning express!',
            icon: '🚌',
            visible: false,
            category: ACTIVITY_CATEGORIES.TRANSITIONS
        },
        {
            title: 'Quiet Time',
            description: 'Shhh... brain recharging!',
            icon: '🤫',
            visible: false,
            category: ACTIVITY_CATEGORIES.CALMING
        },
        {
            title: 'Snack Break',
            description: 'Nom nom energy boost!',
            icon: '🍎',
            visible: false,
            category: ACTIVITY_CATEGORIES.MEALS
        },
        {
            title: 'Hand Washing',
            description: 'Bubble power activate!',
            icon: '🧼',
            visible: false,
            category: ACTIVITY_CATEGORIES.THERAPY
        },
        {
            title: 'Homework Time',
            description: 'Brain muscles getting stronger!',
            icon: '📚',
            visible: false,
            category: ACTIVITY_CATEGORIES.SCHOOL
        },
        {
            title: 'Sensory Break',
            description: 'Wiggle, squeeze, and breathe!',
            icon: '🧘',
            visible: false,
            category: ACTIVITY_CATEGORIES.SENSORY
        },
        {
            title: 'Play Time',
            description: 'Fun mode: ACTIVATED!',
            icon: '🎮',
            visible: false,
            category: ACTIVITY_CATEGORIES.PLAY
        },
        {
            title: 'Clean Up',
            description: 'Everything has a home!',
            icon: '🧹',
            visible: false,
            category: ACTIVITY_CATEGORIES.CHORES
        },
        {
            title: 'Dinner Time',
            description: 'Family feast o\'clock!',
            icon: '🍝',
            visible: false,
            category: ACTIVITY_CATEGORIES.MEALS
        },
        {
            title: 'Bath Time',
            description: 'Splish splash, you\'re awesome!',
            icon: '🛁',
            visible: false,
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        },
        {
            title: 'Story Time',
            description: 'Adventure awaits in every page!',
            icon: '📖',
            visible: false,
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        },
        {
            title: 'Bedtime',
            description: 'Sweet dreams, superstar!',
            icon: '😴',
            visible: false,
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        }
    ];
    
    // Extended activity library (93 activities)
    var ACTIVITY_LIBRARY = [
        // Morning Routine
        {
            key: 'wake_up',
            title: 'Wake Up',
            description: 'Good morning sunshine!',
            icon: '☀️',
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        },
        {
            key: 'make_bed',
            title: 'Make Bed',
            description: 'Smooth and cozy!',
            icon: '🛏️',
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        },
        {
            key: 'wash_face',
            title: 'Wash Face',
            description: 'Fresh face for the day!',
            icon: '💦',
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        },
        {
            key: 'comb_hair',
            title: 'Comb Hair',
            description: 'Looking sharp!',
            icon: '👱',
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        },
        
        // Evening Routine
        {
            key: 'pajama_time',
            title: 'Put on Pajamas',
            description: 'Cozy clothes time!',
            icon: '👔',
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        },
        {
            key: 'evening_routine',
            title: 'Evening Routine',
            description: 'Wind down wonderland!',
            icon: '🌙',
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        },
        {
            key: 'brush_hair',
            title: 'Brush Hair',
            description: 'Gentle brushing time!',
            icon: '🪮',
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        },
        {
            key: 'night_light',
            title: 'Turn on Night Light',
            description: 'Sweet dreams glow!',
            icon: '🌟',
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        },
        {
            key: 'goodnight_hugs',
            title: 'Goodnight Hugs',
            description: 'Love you to the moon!',
            icon: '🤗',
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        },
        
        // School/Learning
        {
            key: 'reading_time',
            title: 'Reading Time',
            description: 'Adventure in every book!',
            icon: '📖',
            category: ACTIVITY_CATEGORIES.SCHOOL
        },
        {
            key: 'writing_practice',
            title: 'Writing Practice',
            description: 'Making letters dance!',
            icon: '✏️',
            category: ACTIVITY_CATEGORIES.SCHOOL
        },
        {
            key: 'math_time',
            title: 'Math Time',
            description: 'Number ninjas unite!',
            icon: '🔢',
            category: ACTIVITY_CATEGORIES.SCHOOL
        },
        {
            key: 'art_project',
            title: 'Art Project',
            description: 'Create something amazing!',
            icon: '🎨',
            category: ACTIVITY_CATEGORIES.SCHOOL
        },
        {
            key: 'computer_time',
            title: 'Computer Time',
            description: 'Digital learning fun!',
            icon: '💻',
            category: ACTIVITY_CATEGORIES.SCHOOL
        },
        {
            key: 'library_visit',
            title: 'Library Visit',
            description: 'Book treasure hunt!',
            icon: '📚',
            category: ACTIVITY_CATEGORIES.SCHOOL
        },
        
        // Chores & Responsibilities
        {
            key: 'clean_room',
            title: 'Clean Room',
            description: 'Everything has a home!',
            icon: '🧹',
            category: ACTIVITY_CATEGORIES.CHORES
        },
        {
            key: 'put_toys_away',
            title: 'Put Toys Away',
            description: 'Toy parade to their homes!',
            icon: '🧸',
            category: ACTIVITY_CATEGORIES.CHORES
        },
        {
            key: 'feed_pet',
            title: 'Feed Pet',
            description: 'Happy pet, happy day!',
            icon: '🐾',
            category: ACTIVITY_CATEGORIES.CHORES
        },
        {
            key: 'water_plants',
            title: 'Water Plants',
            description: 'Help them grow strong!',
            icon: '🪴',
            category: ACTIVITY_CATEGORIES.CHORES
        },
        {
            key: 'set_table',
            title: 'Set Table',
            description: 'Dinner helper extraordinaire!',
            icon: '🍽️',
            category: ACTIVITY_CATEGORIES.CHORES
        },
        {
            key: 'laundry_helper',
            title: 'Help with Laundry',
            description: 'Sorting superstar!',
            icon: '👕',
            category: ACTIVITY_CATEGORIES.CHORES
        },
        {
            key: 'take_trash_out',
            title: 'Take Out Trash',
            description: 'Keeping things tidy!',
            icon: '🗑️',
            category: ACTIVITY_CATEGORIES.CHORES
        },
        {
            key: 'wipe_table',
            title: 'Wipe Table',
            description: 'Sparkle and shine!',
            icon: '🧽',
            category: ACTIVITY_CATEGORIES.CHORES
        },
        
        // Health & Hygiene
        {
            key: 'doctor_visit',
            title: 'Doctor Visit',
            description: 'Health check champion!',
            icon: '👨‍⚕️',
            category: ACTIVITY_CATEGORIES.THERAPY
        },
        {
            key: 'therapy_time',
            title: 'Therapy Time',
            description: 'Building new skills!',
            icon: '🏥',
            category: ACTIVITY_CATEGORIES.THERAPY
        },
        {
            key: 'speech_therapy',
            title: 'Speech Therapy',
            description: 'Words are your superpower!',
            icon: '💬',
            category: ACTIVITY_CATEGORIES.THERAPY
        },
        {
            key: 'occupational_therapy',
            title: 'OT Time',
            description: 'Building amazing skills!',
            icon: '🤹',
            category: ACTIVITY_CATEGORIES.THERAPY
        },
        {
            key: 'physical_therapy',
            title: 'PT Exercises',
            description: 'Strong body, strong mind!',
            icon: '🏃',
            category: ACTIVITY_CATEGORIES.THERAPY
        },
        {
            key: 'potty_time',
            title: 'Potty Time',
            description: 'You\'re doing great!',
            icon: '🚽',
            category: ACTIVITY_CATEGORIES.DAILY_CARE
        },
        
        // Social Skills
        {
            key: 'sharing_time',
            title: 'Sharing Time',
            description: 'Kindness is contagious!',
            icon: '🤝',
            category: ACTIVITY_CATEGORIES.SOCIAL
        },
        {
            key: 'circle_time',
            title: 'Circle Time',
            description: 'Friends together!',
            icon: '👥',
            category: ACTIVITY_CATEGORIES.SOCIAL
        },
        {
            key: 'say_hello',
            title: 'Say Hello',
            description: 'Friendly greetings!',
            icon: '👋',
            category: ACTIVITY_CATEGORIES.SOCIAL
        },
        {
            key: 'play_date',
            title: 'Play Date',
            description: 'Friend fun time!',
            icon: '👫',
            category: ACTIVITY_CATEGORIES.SOCIAL
        },
        {
            key: 'video_call',
            title: 'Video Call',
            description: 'Hello from far away!',
            icon: '📱',
            category: ACTIVITY_CATEGORIES.SOCIAL
        },
        {
            key: 'turn_taking',
            title: 'Take Turns',
            description: 'Your turn, my turn!',
            icon: '🔄',
            category: ACTIVITY_CATEGORIES.SOCIAL
        },
        {
            key: 'group_game',
            title: 'Group Game',
            description: 'Teamwork makes it fun!',
            icon: '🎲',
            category: ACTIVITY_CATEGORIES.SOCIAL
        },
        
        // Leisure & Fun
        {
            key: 'outdoor_play',
            title: 'Outdoor Play',
            description: 'Fresh air adventures!',
            icon: '🏞️',
            category: ACTIVITY_CATEGORIES.PLAY
        },
        {
            key: 'board_game',
            title: 'Board Game',
            description: 'Game on!',
            icon: '🎯',
            category: ACTIVITY_CATEGORIES.PLAY
        },
        {
            key: 'lego_time',
            title: 'Building Blocks',
            description: 'Master builder mode!',
            icon: '🧱',
            category: ACTIVITY_CATEGORIES.PLAY
        },
        {
            key: 'puzzle_time',
            title: 'Puzzle Time',
            description: 'Piece by piece!',
            icon: '🧩',
            category: ACTIVITY_CATEGORIES.PLAY
        },
        {
            key: 'music_time',
            title: 'Music Time',
            description: 'Dance and sing!',
            icon: '🎵',
            category: ACTIVITY_CATEGORIES.PLAY
        },
        {
            key: 'craft_time',
            title: 'Craft Time',
            description: 'Create and make!',
            icon: '✂️',
            category: ACTIVITY_CATEGORIES.PLAY
        },
        {
            key: 'screen_time',
            title: 'Screen Time',
            description: 'Digital fun zone!',
            icon: '📺',
            category: ACTIVITY_CATEGORIES.PLAY
        },
        {
            key: 'special_interest',
            title: 'Special Interest Time',
            description: 'Dive into your passion!',
            icon: '⭐',
            category: ACTIVITY_CATEGORIES.PLAY
        },
        
        // Meals & Nutrition
        {
            key: 'lunch_time',
            title: 'Lunch Time',
            description: 'Midday munchies!',
            icon: '🥪',
            category: ACTIVITY_CATEGORIES.MEALS
        },
        {
            key: 'water_break',
            title: 'Water Break',
            description: 'Hydration station!',
            icon: '💧',
            category: ACTIVITY_CATEGORIES.MEALS
        },
        {
            key: 'cook_together',
            title: 'Cook Together',
            description: 'Kitchen helper hero!',
            icon: '👨‍🍳',
            category: ACTIVITY_CATEGORIES.MEALS
        },
        {
            key: 'try_new_food',
            title: 'Try New Food',
            description: 'Brave taste explorer!',
            icon: '🥕',
            category: ACTIVITY_CATEGORIES.MEALS
        },
        
        // Exercise & Movement
        {
            key: 'exercise_time',
            title: 'Exercise Time',
            description: 'Move and groove!',
            icon: '🏃',
            category: ACTIVITY_CATEGORIES.EXERCISE
        },
        {
            key: 'yoga_time',
            title: 'Yoga Time',
            description: 'Stretch like a cat!',
            icon: '🧘',
            category: ACTIVITY_CATEGORIES.EXERCISE
        },
        {
            key: 'bike_ride',
            title: 'Bike Ride',
            description: 'Pedal power!',
            icon: '🚴',
            category: ACTIVITY_CATEGORIES.EXERCISE
        },
        {
            key: 'swimming',
            title: 'Swimming',
            description: 'Splash and swim!',
            icon: '🏊',
            category: ACTIVITY_CATEGORIES.EXERCISE
        },
        {
            key: 'dance_party',
            title: 'Dance Party',
            description: 'Boogie wonderland!',
            icon: '💃',
            category: ACTIVITY_CATEGORIES.EXERCISE
        },
        {
            key: 'walk_time',
            title: 'Walk Time',
            description: 'Step by step adventure!',
            icon: '🚶',
            category: ACTIVITY_CATEGORIES.EXERCISE
        },
        {
            key: 'playground',
            title: 'Playground Time',
            description: 'Swing and slide!',
            icon: '🛝',
            category: ACTIVITY_CATEGORIES.EXERCISE
        },
        {
            key: 'sports_time',
            title: 'Sports Time',
            description: 'Team player mode!',
            icon: '⚽',
            category: ACTIVITY_CATEGORIES.EXERCISE
        },
        
        // Calming & Regulation
        {
            key: 'deep_breathing',
            title: 'Deep Breathing',
            description: 'In and out, nice and slow!',
            icon: '🌬️',
            category: ACTIVITY_CATEGORIES.CALMING
        },
        {
            key: 'fidget_time',
            title: 'Fidget Time',
            description: 'Squeeze and fiddle!',
            icon: '🔮',
            category: ACTIVITY_CATEGORIES.SENSORY
        },
        {
            key: 'calm_corner',
            title: 'Calm Corner',
            description: 'Your peaceful place!',
            icon: '🛋️',
            category: ACTIVITY_CATEGORIES.CALMING
        },
        {
            key: 'weighted_blanket',
            title: 'Weighted Blanket',
            description: 'Cozy pressure hug!',
            icon: '🛌',
            category: ACTIVITY_CATEGORIES.SENSORY
        },
        {
            key: 'sensory_swing',
            title: 'Sensory Swing',
            description: 'Gentle swaying time!',
            icon: '🪑',
            category: ACTIVITY_CATEGORIES.SENSORY
        },
        {
            key: 'coloring_time',
            title: 'Coloring Time',
            description: 'Color your calm!',
            icon: '🖍️',
            category: ACTIVITY_CATEGORIES.CALMING
        },
        {
            key: 'listening_music',
            title: 'Calming Music',
            description: 'Soothing sounds!',
            icon: '🎧',
            category: ACTIVITY_CATEGORIES.CALMING
        },
        
        // Transitions
        {
            key: 'car_time',
            title: 'Car Ride',
            description: 'Adventure mobile ready!',
            icon: '🚗',
            category: ACTIVITY_CATEGORIES.TRANSITIONS
        },
        {
            key: 'waiting_time',
            title: 'Waiting Time',
            description: 'Patience champion mode!',
            icon: '⏳',
            category: ACTIVITY_CATEGORIES.TRANSITIONS
        },
        {
            key: 'get_ready',
            title: 'Get Ready',
            description: 'Preparation station!',
            icon: '⚡',
            category: ACTIVITY_CATEGORIES.TRANSITIONS
        },
        {
            key: 'pack_up',
            title: 'Pack Up',
            description: 'Time to go!',
            icon: '📦',
            category: ACTIVITY_CATEGORIES.TRANSITIONS
        },
        {
            key: 'transition_warning',
            title: '5 Minute Warning',
            description: 'Almost time to switch!',
            icon: '⏰',
            category: ACTIVITY_CATEGORIES.TRANSITIONS
        },
        
        // Additional sensory activities
        {
            key: 'deep_pressure',
            title: 'Squeeze Time',
            description: 'Big hugs for your body!',
            icon: '🤗',
            category: ACTIVITY_CATEGORIES.SENSORY
        },
        {
            key: 'sensory_bin',
            title: 'Sensory Bin',
            description: 'Explore and discover!',
            icon: '🏖️',
            category: ACTIVITY_CATEGORIES.SENSORY
        },
        {
            key: 'movement_break',
            title: 'Movement Break',
            description: 'Wiggle those wiggles out!',
            icon: '🕺',
            category: ACTIVITY_CATEGORIES.SENSORY
        },
        {
            key: 'chewing_gum',
            title: 'Chewing Gum',
            description: 'Oral motor time!',
            icon: '🍬',
            category: ACTIVITY_CATEGORIES.SENSORY
        },
        {
            key: 'noise_canceling',
            title: 'Quiet Headphones',
            description: 'Block out the noise!',
            icon: '🎧',
            category: ACTIVITY_CATEGORIES.SENSORY
        }
    ];
    
    /**
     * Initialize default activities in SQLite database or localStorage
     * Called on first run or when database is empty
     */
    function initializeDefaultActivities(callback) {
        // Check if we're using SQLite or localStorage
        var usingSQLite = window.TaskSQLite && window.TaskSQLite.isReady;
        
        if (!usingSQLite) {
            // Try localStorage fallback
            try {
                // Direct localStorage check without requiring StackMapApp
                if (typeof localStorage !== 'undefined' && localStorage !== null) {
                    initializeInLocalStorage(callback);
                    return;
                }
            } catch (e) {
                console.error('localStorage not available:', e);
            }
            
            console.error('Neither SQLite nor localStorage ready for activity initialization');
            if (callback) callback(false, 'Storage not ready');
            return;
        }
        
        // Check if activities already exist
        window.TaskSQLite.getTasks({ limit: 1 }, function(tasks, error) {
            if (error) {
                console.error('Failed to check existing activities:', error);
                if (callback) callback(false, error);
                return;
            }
            
            if (tasks && tasks.length > 0) {
                console.log('Activities already exist, skipping initialization');
                if (callback) callback(true, 'Already initialized');
                return;
            }
            
            // Initialize with default activities
            console.log('Initializing default activities...');
            var initialized = 0;
            var errors = 0;
            var totalToInit = DEFAULT_ACTIVITIES.length;
            
            // Process each default activity
            DEFAULT_ACTIVITIES.forEach(function(activity, index) {
                var task = {
                    title: activity.title,
                    description: activity.description,
                    metadata: {
                        icon: activity.icon,
                        category: activity.category,
                        visible: activity.visible,
                        isDefault: true,
                        order: index
                    }
                };
                
                window.TaskSQLite.createTask(task, function(result, error) {
                    if (error) {
                        errors++;
                        console.error('Failed to create activity:', activity.title, error);
                    } else {
                        initialized++;
                        console.log('Created activity:', activity.title);
                    }
                    
                    // Check if all activities processed
                    if (initialized + errors === totalToInit) {
                        console.log('Activity initialization complete:', initialized, 'success,', errors, 'errors');
                        
                        // Store initialization date
                        try {
                            localStorage.setItem('stackmap-activities-initialized', new Date().toISOString());
                        } catch (e) {
                            console.warn('Could not save initialization date:', e);
                        }
                        
                        if (callback) callback(errors === 0, errors === 0 ? null : 'Some activities failed');
                    }
                });
            });
        });
    }
    
    /**
     * Initialize default activities in localStorage
     * Fallback when SQLite is not available
     */
    function initializeInLocalStorage(callback) {
        try {
            // Check if already initialized
            var initialized = localStorage.getItem('stackmap-activities-initialized');
            if (initialized) {
                console.log('Activities already initialized in localStorage');
                if (callback) callback(true, 'Already initialized');
                return;
            }
            
            // Get existing tasks or create empty array
            var existingTasks = localStorage.getItem('stackmap-tasks');
            var tasks = existingTasks ? JSON.parse(existingTasks) : [];
            
            // Add default activities as tasks
            var activitiesToAdd = getVisibleActivities(); // Start with visible ones
            
            activitiesToAdd.forEach(function(activity, index) {
                tasks.push({
                    id: Date.now() + index,
                    title: activity.title,
                    description: activity.description,
                    completed: false,
                    priority: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    metadata: {
                        icon: activity.icon,
                        category: activity.category,
                        visible: activity.visible,
                        isDefault: true,
                        order: index
                    }
                });
            });
            
            // Save to localStorage
            localStorage.setItem('stackmap-tasks', JSON.stringify(tasks));
            localStorage.setItem('stackmap-activities-initialized', new Date().toISOString());
            
            console.log('Initialized', activitiesToAdd.length, 'default activities in localStorage');
            if (callback) callback(true);
            
        } catch (e) {
            console.error('Failed to initialize activities in localStorage:', e);
            if (callback) callback(false, e);
        }
    }
    
    /**
     * Get all activities (both default and library)
     */
    function getAllActivities() {
        var allActivities = [];
        
        // Add default activities
        DEFAULT_ACTIVITIES.forEach(function(activity) {
            allActivities.push(activity);
        });
        
        // Add library activities
        ACTIVITY_LIBRARY.forEach(function(activity) {
            allActivities.push({
                title: activity.title,
                description: activity.description,
                icon: activity.icon,
                visible: false,
                category: activity.category,
                key: activity.key
            });
        });
        
        return allActivities;
    }
    
    /**
     * Get activities by category
     */
    function getActivitiesByCategory(category) {
        return getAllActivities().filter(function(activity) {
            return activity.category === category;
        });
    }
    
    /**
     * Get visible activities (for initial display)
     */
    function getVisibleActivities() {
        return DEFAULT_ACTIVITIES.filter(function(activity) {
            return activity.visible === true;
        });
    }
    
    /**
     * Progressive Activity Loader
     * Loads activities in tiers to prevent blocking
     */
    var ActivityLoader = {
        isLoading: false,
        loadedCount: 0,
        callbacks: [],
        tieredActivities: null,
        
        /**
         * Initialize tiered loading structure
         */
        initTiers: function() {
            if (this.tieredActivities) return;
            
            var allActivities = DEFAULT_ACTIVITIES.concat(ACTIVITY_LIBRARY);
            
            // Split into 3 tiers
            this.tieredActivities = {
                tier1: allActivities.slice(0, 10),      // First 10 (critical)
                tier2: allActivities.slice(10, 35),     // Next 25 (important)
                tier3: allActivities.slice(35)          // Rest (nice to have)
            };
        },
        
        /**
         * Load activities progressively
         */
        loadTiered: function(callback) {
            var self = this;
            
            if (self.isLoading) {
                // Queue callback if already loading
                if (callback) self.callbacks.push(callback);
                return;
            }
            
            self.isLoading = true;
            self.initTiers();
            
            // Load Tier 1 immediately (first 10 activities)
            self.loadedCount = self.tieredActivities.tier1.length;
            
            // Notify app is interactive
            if (callback) callback(self.tieredActivities.tier1);
            
            // Load Tier 2 after short delay
            setTimeout(function() {
                self.loadedCount += self.tieredActivities.tier2.length;
                
                // Load Tier 3 after another delay
                setTimeout(function() {
                    self.loadedCount = DEFAULT_ACTIVITIES.length + ACTIVITY_LIBRARY.length;
                    self.isLoading = false;
                    
                    // Call all queued callbacks
                    while (self.callbacks.length > 0) {
                        var cb = self.callbacks.shift();
                        if (cb) cb(getAllActivities());
                    }
                }, 500);
            }, 100);
        },
        
        /**
         * Get currently loaded activities
         */
        getLoaded: function() {
            this.initTiers();
            
            if (this.loadedCount <= 10) {
                return this.tieredActivities.tier1;
            } else if (this.loadedCount <= 35) {
                return this.tieredActivities.tier1.concat(this.tieredActivities.tier2);
            } else {
                return getAllActivities();
            }
        }
    };
    
    // Expose API
    window.StackMapDefaultActivities = {
        CATEGORIES: ACTIVITY_CATEGORIES,
        DEFAULT_ACTIVITIES: DEFAULT_ACTIVITIES,
        ACTIVITY_LIBRARY: ACTIVITY_LIBRARY,
        initialize: initializeDefaultActivities,
        getAllActivities: getAllActivities,
        getActivitiesByCategory: getActivitiesByCategory,
        getVisibleActivities: getVisibleActivities,
        totalCount: DEFAULT_ACTIVITIES.length + ACTIVITY_LIBRARY.length,
        // Progressive loading API
        ActivityLoader: ActivityLoader,
        loadProgressive: function(callback) {
            return ActivityLoader.loadTiered(callback);
        },
        getLoadedActivities: function() {
            return ActivityLoader.getLoaded();
        }
    };
    
})();