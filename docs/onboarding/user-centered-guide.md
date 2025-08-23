# User-Centered Onboarding Guide

## Overview
The new user-centered onboarding experience (`OnboardingUserCentered.js`) focuses on understanding the user's needs and journey before presenting configuration options. It replaces the product-centric approach with a conversational, guided flow.

## Key Features

### 1. Journey-Based Navigation
- **Welcome**: Immediate choice between "New to StackMap" vs "Already use StackMap"
- **Smart Routing**: Based on user choices, skips irrelevant steps
- **Back Navigation**: Users can go back to any previous step
- **Progress Tracking**: Navigation history maintained throughout

### 2. User Type Discovery
Instead of asking technical questions, we ask behavioral ones:
- "Who will use StackMap?" (Just Me / Helping Someone / Multiple People)
- "How many devices?" (Single Device / Multiple Devices)
- These choices automatically configure appropriate defaults

### 3. Native Sync Implementation
- **No Web Redirect**: Sync is created directly on iOS/Android
- **Simple Code Generation**: 32-character hex code generated locally
- **Copy to Clipboard**: One-tap copy functionality
- **Preview Before Import**: Shows user count and data before importing

### 4. Conditional Features
Features are offered based on user journey:
- **Self Users**: Skip PIN by default, simple setup
- **Helpers**: PIN recommended, multiple user support
- **Multi-Device**: Sync automatically suggested
- **Single Device**: Sync skippable, local-first

## User Flows

### Flow 1: New User, Single Device
```
Welcome → "New to StackMap" → User Type → Single Device → Create User → Complete
```

### Flow 2: New User, Multi-Device
```
Welcome → "New to StackMap" → User Type → Multiple Devices → Create User → Generate Sync Code → Complete
```

### Flow 3: Existing User with Sync Code
```
Welcome → "Already use StackMap" → Enter Sync Code → Preview Data → Import → Complete
```

### Flow 4: Helper/Parent Setup
```
Welcome → "New to StackMap" → "Helping Someone" → Device Strategy → Create Users → PIN Setup → Sync (if multi-device) → Complete
```

## Technical Implementation

### State Management
```javascript
const [userJourney, setUserJourney] = useState({
  journeyType: null,     // 'new' or 'existing'
  userType: null,        // 'self', 'helper', 'group'
  deviceStrategy: null,  // 'single' or 'multi'
  syncEnabled: false,
  pinEnabled: false,
});
```

### Step Components
Each step is a self-contained component:
- `WelcomeStep`: Initial decision point
- `UserTypeStep`: Understand who's using the app
- `DeviceStrategyStep`: Single vs multi-device
- `UserSetupStep`: Create user profiles
- `PinSetupStep`: Optional PIN protection
- `SyncCreateStep`: Generate new sync code
- `SyncImportStep`: Join existing sync
- `CompleteStep`: Summary and finish

### Sync Integration
The component integrates directly with the existing sync service:
```javascript
// Generate sync code locally
const generateNewSyncCode = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Create sync using existing service
await syncService.initialize(syncCode);
await syncService.createSync();
```

## Activation

The user-centered onboarding is the primary onboarding implementation used in App.js. It is directly imported and used when onboarding is needed:
```javascript
import OnboardingUserCentered from './src/components/Onboarding/OnboardingUserCentered';
```

This is the main onboarding flow for all new users.

## Benefits

1. **Reduced Cognitive Load**: Questions are behavioral, not technical
2. **Faster Time to Value**: Skip irrelevant steps based on user type
3. **Native Experience**: No web redirects for sync setup
4. **Better Defaults**: Configuration matches user intent
5. **Clearer Value Props**: Features explained in context

## Migration Notes

- The onboarding is fully compatible with the existing data structure
- It uses the same sync service and encryption
- All data formats remain unchanged
- This is the primary onboarding implementation for all users

## Future Enhancements

1. **Animated Transitions**: Smoother step-to-step animations
2. **Progress Indicator**: Visual progress through onboarding
3. **Smart Defaults**: Learn from user choices to suggest options
4. **Offline Support**: Handle sync setup when offline
5. **Tutorial Integration**: Optional guided tour after setup