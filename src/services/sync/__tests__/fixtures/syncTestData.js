// Test data fixtures for sync system testing

export const testUsers = {
  user1: {
    id: 'user1',
    name: 'Test User 1',
    icon: '👤',
    theme: 'blue',
    celebration: 'rainbow',
    settings: {
      soundEnabled: true,
      vibrationEnabled: false,
    },
    days: {
      today: {
        activities: [
          { id: 'act1', text: 'Morning routine', icon: '☀️', completed: false },
          { id: 'act2', text: 'Exercise', icon: '🏃', completed: true },
        ],
      },
      tomorrow: {
        activities: [
          { id: 'act3', text: 'Meeting', icon: '📅', completed: false },
        ],
      },
    },
  },
  user2: {
    id: 'user2',
    name: 'Test User 2',
    icon: '👥',
    theme: 'green',
    celebration: 'confetti',
    settings: {
      soundEnabled: false,
      vibrationEnabled: true,
    },
    days: {
      today: {
        activities: [
          { id: 'act4', text: 'Work', icon: '💼', completed: false },
        ],
      },
    },
  },
};

export const testActivities = [
  { id: 'lib1', text: 'Brush teeth', icon: '🦷', category: 'Morning' },
  { id: 'lib2', text: 'Meditation', icon: '🧘', category: 'Wellness' },
  { id: 'lib3', text: 'Read book', icon: '📚', category: 'Evening' },
  { id: 'lib4', text: 'Walk dog', icon: '🐕', category: 'Exercise' },
];

export const testSettings = {
  currentUser: 'user1',
  syncEnabled: true,
  lastSyncTime: '2025-01-13T10:00:00Z',
  theme: 'system',
  appSettings: {
    notifications: true,
    darkMode: false,
  },
};

export const testLibrary = {
  Morning: [
    { id: 'lib1', text: 'Brush teeth', icon: '🦷' },
    { id: 'lib5', text: 'Shower', icon: '🚿' },
  ],
  Wellness: [
    { id: 'lib2', text: 'Meditation', icon: '🧘' },
    { id: 'lib6', text: 'Yoga', icon: '🧘‍♀️' },
  ],
  Exercise: [
    { id: 'lib4', text: 'Walk dog', icon: '🐕' },
    { id: 'lib7', text: 'Running', icon: '🏃' },
  ],
};

export const testSyncData = {
  users: testUsers,
  settings: testSettings,
  activities: testActivities,
  library: testLibrary,
  metadata: {
    version: '1.0.0',
    lastModified: '2025-01-13T10:00:00Z',
    deviceId: 'test-device-123',
  },
};

// Conflicting data for testing conflict resolution
export const conflictingData = {
  local: {
    users: {
      user1: {
        ...testUsers.user1,
        name: 'Local Name',
        icon: '🔥',
        days: {
          today: {
            activities: [
              {
                id: 'act1',
                text: 'Local activity',
                icon: '📝',
                completed: true,
              },
            ],
          },
        },
      },
    },
    settings: {
      ...testSettings,
      lastSyncTime: '2025-01-13T09:00:00Z',
    },
  },
  remote: {
    users: {
      user1: {
        ...testUsers.user1,
        name: 'Remote Name',
        icon: '💧',
        days: {
          today: {
            activities: [
              {
                id: 'act1',
                text: 'Remote activity',
                icon: '📄',
                completed: false,
              },
              {
                id: 'act5',
                text: 'New remote activity',
                icon: '🆕',
                completed: false,
              },
            ],
          },
        },
      },
    },
    settings: {
      ...testSettings,
      lastSyncTime: '2025-01-13T11:00:00Z',
    },
  },
};

// Large dataset for performance testing
export const generateLargeDataset = (size = 1000) => {
  const activities = [];
  const library = {};

  for (let i = 0; i < size; i++) {
    const activity = {
      id: `activity-${i}`,
      text: `Activity ${i}`,
      icon: '🎯',
      category: `Category-${Math.floor(i / 10)}`,
      completed: Math.random() > 0.5,
    };
    activities.push(activity);

    const categoryName = `Category-${Math.floor(i / 10)}`;
    if (!library[categoryName]) {
      library[categoryName] = [];
    }
    library[categoryName].push({
      id: activity.id,
      text: activity.text,
      icon: activity.icon,
    });
  }

  return { activities, library };
};

// Recovery phrases for testing
export const testRecoveryPhrases = {
  valid: '0123456789abcdef0123456789abcdef',
  invalid: 'invalid-phrase',
  short: '0123456789abcdef',
  withSpaces: '0123 4567 89ab cdef 0123 4567 89ab cdef',
};

// Encrypted data samples
export const encryptedTestData = {
  validEncrypted: 'base64encodedencrypteddata==',
  corruptedEncrypted: 'corrupted-data',
  emptyEncrypted: '',
};

// Network response mocks
export const networkResponses = {
  success: {
    status: 200,
    data: {
      success: true,
      data: testSyncData,
      lastModified: '2025-01-13T10:00:00Z',
    },
  },
  conflict: {
    status: 409,
    data: {
      success: false,
      error: 'Conflict',
      data: conflictingData.remote,
    },
  },
  notFound: {
    status: 404,
    data: {
      success: false,
      error: 'Sync not found',
    },
  },
  serverError: {
    status: 500,
    data: {
      success: false,
      error: 'Internal server error',
    },
  },
  rateLimited: {
    status: 429,
    data: {
      success: false,
      error: 'Too many requests',
    },
  },
};

// Field normalization test cases
export const fieldNormalizationCases = [
  {
    input: { name: 'Activity Name', emoji: '🎯' },
    expected: { text: 'Activity Name', icon: '🎯' },
  },
  {
    input: { title: 'Activity Title', icon: '📝' },
    expected: { text: 'Activity Title', icon: '📝' },
  },
  {
    input: { text: 'Activity Text', emoji: '✅' },
    expected: { text: 'Activity Text', icon: '✅' },
  },
];

export default {
  testUsers,
  testActivities,
  testSettings,
  testLibrary,
  testSyncData,
  conflictingData,
  generateLargeDataset,
  testRecoveryPhrases,
  encryptedTestData,
  networkResponses,
  fieldNormalizationCases,
};
