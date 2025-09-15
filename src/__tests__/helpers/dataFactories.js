/**
 * Data Factories for Integration Tests
 * Provides consistent mock data generation for testing
 */

// Common themes available in the app
export const THEMES = [
  'stackBlue', 'stackGreen', 'stackOrange', 'stackRed',
  'stackYellow', 'stackPurple', 'stackPink', 'crimson'
];

// Common celebration modes
export const CELEBRATION_MODES = ['rainbow', 'confetti', 'stars', 'none'];

// Common display modes
export const DISPLAY_MODES = ['numbers', 'checkmarks', 'progress'];

// Common activity icons
export const ACTIVITY_ICONS = [
  '🎯', '📚', '🏃‍♂️', '🍎', '💤', '🧘‍♀️', '🎵', '🎨',
  '💻', '📱', '🌱', '🏠', '🚗', '✈️', '🎮', '📖'
];

// Common user icons
export const USER_ICONS = [
  '👤', '👨', '👩', '🧑', '👦', '👧', '🐶', '🐱',
  '🦄', '🌟', '🔥', '⚡', '🎭', '🎪', '🎨', '🎯'
];

// Common category icons
export const CATEGORY_ICONS = [
  '☀️', '🌙', '🍽️', '🏠', '💼', '🎮', '📚', '🏃‍♂️',
  '🧘‍♀️', '🎵', '🎨', '💻', '🌱', '🧹', '🛒', '📞'
];

/**
 * Generate a unique ID
 */
export const generateId = (prefix = 'id') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get random item from array
 */
export const randomChoice = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Generate realistic activity names
 */
export const ACTIVITY_NAMES = [
  'Brush Teeth', 'Take Shower', 'Eat Breakfast', 'Read Book',
  'Exercise', 'Meditate', 'Take Medicine', 'Water Plants',
  'Clean Room', 'Do Homework', 'Practice Piano', 'Walk Dog',
  'Call Friend', 'Grocery Shopping', 'Cook Dinner', 'Take Vitamins',
  'Stretch', 'Journal Writing', 'Check Email', 'Tidy Up'
];

/**
 * Generate realistic category names
 */
export const CATEGORY_NAMES = [
  'Morning Routine', 'Evening Routine', 'Meals', 'Exercise',
  'Self Care', 'Hobbies', 'Work Tasks', 'Household',
  'Learning', 'Social', 'Health', 'Entertainment'
];

/**
 * Activity Factory
 */
export class ActivityFactory {
  static create(overrides = {}) {
    return {
      id: generateId('activity'),
      text: randomChoice(ACTIVITY_NAMES),
      icon: randomChoice(ACTIVITY_ICONS),
      completed: false,
      timestamp: Date.now(),
      ...overrides
    };
  }

  static createMultiple(count = 3, overrides = {}) {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        text: `${randomChoice(ACTIVITY_NAMES)} ${index + 1}`,
        ...overrides
      })
    );
  }

  static createCompleted(overrides = {}) {
    return this.create({
      completed: true,
      timestamp: Date.now() - (Math.random() * 3600000), // Random time in last hour
      ...overrides
    });
  }

  static createWithSpecificText(text, overrides = {}) {
    return this.create({
      text,
      ...overrides
    });
  }
}

/**
 * Category Factory
 */
export class CategoryFactory {
  static create(overrides = {}) {
    const name = randomChoice(CATEGORY_NAMES);
    return {
      id: generateId('category'),
      name,
      icon: randomChoice(CATEGORY_ICONS),
      activities: ActivityFactory.createMultiple(3),
      ...overrides
    };
  }

  static createWithActivities(activityCount = 5, overrides = {}) {
    return this.create({
      activities: ActivityFactory.createMultiple(activityCount),
      ...overrides
    });
  }

  static createEmpty(overrides = {}) {
    return this.create({
      activities: [],
      ...overrides
    });
  }

  static createMorningRoutine() {
    return this.create({
      name: 'Morning Routine',
      icon: '☀️',
      activities: [
        ActivityFactory.createWithSpecificText('Wake Up', { icon: '⏰' }),
        ActivityFactory.createWithSpecificText('Brush Teeth', { icon: '🪥' }),
        ActivityFactory.createWithSpecificText('Take Shower', { icon: '🚿' }),
        ActivityFactory.createWithSpecificText('Eat Breakfast', { icon: '🍳' }),
        ActivityFactory.createWithSpecificText('Check Weather', { icon: '🌤️' })
      ]
    });
  }

  static createEveningRoutine() {
    return this.create({
      name: 'Evening Routine',
      icon: '🌙',
      activities: [
        ActivityFactory.createWithSpecificText('Dinner', { icon: '🍽️' }),
        ActivityFactory.createWithSpecificText('Brush Teeth', { icon: '🪥' }),
        ActivityFactory.createWithSpecificText('Read Book', { icon: '📚' }),
        ActivityFactory.createWithSpecificText('Set Alarm', { icon: '⏰' }),
        ActivityFactory.createWithSpecificText('Sleep', { icon: '💤' })
      ]
    });
  }
}

/**
 * User Factory
 */
export class UserFactory {
  static create(overrides = {}) {
    return {
      id: generateId('user'),
      name: 'Test User',
      icon: randomChoice(USER_ICONS),
      settings: {
        theme: randomChoice(THEMES),
        celebration: randomChoice(CELEBRATION_MODES),
        soundEnabled: true,
        displayMode: randomChoice(DISPLAY_MODES)
      },
      days: {
        today: { activities: [] },
        tomorrow: { activities: [] }
      },
      ...overrides
    };
  }

  static createWithActivities(day = 'today', activityCount = 3, overrides = {}) {
    const activities = ActivityFactory.createMultiple(activityCount);
    return this.create({
      days: {
        today: { activities: day === 'today' ? activities : [] },
        tomorrow: { activities: day === 'tomorrow' ? activities : [] }
      },
      ...overrides
    });
  }

  static createFamily() {
    return [
      this.create({
        name: 'Parent',
        icon: '👨',
        settings: { theme: 'stackBlue' }
      }),
      this.create({
        name: 'Child 1',
        icon: '👦',
        settings: { theme: 'stackGreen' }
      }),
      this.create({
        name: 'Child 2',
        icon: '👧',
        settings: { theme: 'stackPink' }
      })
    ];
  }

  static createWithCompletedActivities(completedCount = 2, totalCount = 5) {
    const activities = [
      ...ActivityFactory.createMultiple(completedCount, { completed: true }),
      ...ActivityFactory.createMultiple(totalCount - completedCount, { completed: false })
    ];

    return this.create({
      days: {
        today: { activities }
      }
    });
  }
}

/**
 * Library Factory
 */
export class LibraryFactory {
  static create(overrides = {}) {
    return {
      categories: [
        CategoryFactory.createMorningRoutine(),
        CategoryFactory.createEveningRoutine(),
        CategoryFactory.create({ name: 'Exercise', icon: '🏃‍♂️' })
      ],
      userActivityIds: [],
      ...overrides
    };
  }

  static createEmpty() {
    return {
      categories: [],
      userActivityIds: []
    };
  }

  static createWithUserActivities(userActivityCount = 3) {
    const userActivityIds = Array.from({ length: userActivityCount }, () => generateId('user-activity'));
    return this.create({
      userActivityIds
    });
  }

  static createLarge(categoryCount = 10, activitiesPerCategory = 8) {
    const categories = Array.from({ length: categoryCount }, () =>
      CategoryFactory.createWithActivities(activitiesPerCategory)
    );

    return {
      categories,
      userActivityIds: Array.from({ length: 20 }, () => generateId('user-activity'))
    };
  }
}

/**
 * Settings Factory
 */
export class SettingsFactory {
  static create(overrides = {}) {
    return {
      currentTheme: randomChoice(THEMES),
      soundEnabled: true,
      hasCompletedOnboarding: false,
      taskCelebration: randomChoice(CELEBRATION_MODES),
      routineCelebration: randomChoice(CELEBRATION_MODES),
      displayMode: randomChoice(DISPLAY_MODES),
      bannerPosition: 'top',
      dayMode: 'today',
      syncSkipped: false,
      toolbarOrder: null,
      moreButtonPosition: 'left',
      ...overrides
    };
  }

  static createOnboarded() {
    return this.create({
      hasCompletedOnboarding: true
    });
  }

  static createWithSync(syncId = 'test-sync-id') {
    return this.create({
      hasCompletedOnboarding: true,
      // Note: sync settings are actually in useSyncStore, not useSettingsStore
      // This method is for backwards compatibility
    });
  }
}

/**
 * Sync Factory
 */
export class SyncFactory {
  static create(overrides = {}) {
    return {
      syncEnabled: false,
      syncId: null,
      lastSyncTime: null,
      isConnected: true,
      isSyncing: false,
      syncError: null,
      autoSyncEnabled: false,
      ...overrides
    };
  }

  static createEnabled(syncId = 'test-sync-id') {
    return this.create({
      syncEnabled: true,
      syncId,
      autoSyncEnabled: true,
      lastSyncTime: Date.now() - 30000 // 30 seconds ago
    });
  }

  static createWithError(error = 'Sync failed') {
    return this.create({
      syncEnabled: true,
      syncError: error,
      lastSyncTime: Date.now() - 60000 // 1 minute ago
    });
  }

  static createOffline() {
    return this.create({
      isConnected: false,
      syncEnabled: true,
      autoSyncEnabled: false
    });
  }
}

/**
 * Complete App State Factory
 */
export class AppStateFactory {
  static create(config = {}) {
    const {
      userCount = 1,
      withLibrary = true,
      withSync = false,
      onboarded = false
    } = config;

    // Create users
    const users = {};
    const userIds = [];

    for (let i = 0; i < userCount; i++) {
      const user = UserFactory.createWithActivities('today', 3, {
        name: `User ${i + 1}`,
        settings: { theme: THEMES[i % THEMES.length] }
      });
      users[user.id] = user;
      userIds.push(user.id);
    }

    const currentUser = userIds[0] || null;

    // Create library
    const library = withLibrary ? LibraryFactory.create() : LibraryFactory.createEmpty();

    // Create settings
    const settings = SettingsFactory.create({
      hasCompletedOnboarding: onboarded
    });

    // Create sync
    const sync = withSync ? SyncFactory.createEnabled() : SyncFactory.create();

    return {
      users,
      currentUser,
      library,
      settings,
      sync
    };
  }

  static createFamily() {
    const familyUsers = UserFactory.createFamily();
    const users = {};

    familyUsers.forEach(user => {
      users[user.id] = UserFactory.createWithActivities('today', 3, user);
    });

    return {
      users,
      currentUser: Object.keys(users)[0],
      library: LibraryFactory.create(),
      settings: SettingsFactory.createOnboarded(),
      sync: SyncFactory.create()
    };
  }

  static createForPerformanceTesting() {
    const users = {};

    // Create 10 users with lots of activities
    for (let i = 0; i < 10; i++) {
      const user = UserFactory.createWithActivities('today', 20, {
        name: `User ${i + 1}`
      });
      users[user.id] = user;
    }

    return {
      users,
      currentUser: Object.keys(users)[0],
      library: LibraryFactory.createLarge(15, 10),
      settings: SettingsFactory.createOnboarded(),
      sync: SyncFactory.createEnabled()
    };
  }
}

export default {
  ActivityFactory,
  CategoryFactory,
  UserFactory,
  LibraryFactory,
  SettingsFactory,
  SyncFactory,
  AppStateFactory,
  generateId,
  randomChoice,
  THEMES,
  CELEBRATION_MODES,
  DISPLAY_MODES,
  ACTIVITY_ICONS,
  USER_ICONS,
  CATEGORY_ICONS
};