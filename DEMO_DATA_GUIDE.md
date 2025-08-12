# StackMap Demo Data Guide

## 🎭 Overview
Comprehensive demo data for testing, screenshots, and showcasing StackMap features.

## 👥 Demo Users

### Alex - The Developer 🧑‍💻
- **Theme**: Green (#4CAF50)
- **Today**: 12 activities (3 completed, 2 pinned)
- **Library**: Dev Routine, Wellness, Learning
- **Persona**: Organized developer managing daily tasks

### Maya - The Artist 🎨
- **Theme**: Purple (#9C27B0)
- **Today**: No activities (fresh start)
- **Library**: Art Process, Creative Breaks
- **Persona**: Creative professional with visual workflows

### Sam - The Chef 👨‍🍳
- **Theme**: Orange (#FF5722)
- **Today**: No activities (fresh start)
- **Library**: Kitchen Prep, Recipe Development
- **Persona**: Culinary expert with structured prep

## 📋 Alex's Day (Main Demo)

### Morning ✅ (Completed)
1. ✅ 🧘 Morning meditation
2. ✅ 👀 Review pull requests
3. ✅ 👥 Team standup meeting (Pinned)

### In Progress
4. 📌 🐛 Fix navigation bug (Pinned)
5. 🍕 Lunch break
6. ✅ Write unit tests
7. 🚀 Deploy to staging
8. 📝 Update documentation
9. 🔍 Code review for Sarah

### Evening
10. 🚶 Evening walk
11. 📚 Read tech article
12. 📋 Prep tomorrow's tasks

## 🚀 Quick Load Methods

### Method 1: Import Button (Development)
```javascript
// In App.js, add temporarily:
import LoadDemoButton from './LoadDemoButton';

// In your main view:
{__DEV__ && <LoadDemoButton onDataLoaded={() => {
  // Restart app or refresh state
}} />}
```

### Method 2: Command Line
```bash
# Run the summary
node scripts/load-demo-data.js
```

### Method 3: Manual Import (Settings Modal)
1. Open Data Management
2. Select "Import Data"
3. Choose `demo-data.json`
4. Confirm import

### Method 4: Direct AsyncStorage (Debug)
```javascript
// In React Native Debugger console:
const { loadDemoData } = require('./scripts/load-demo-data');
await loadDemoData(AsyncStorage);
```

## 📸 Perfect Screenshot Scenarios

### 1. Home Screen - Active Day
- **User**: Alex
- **Shows**: Mix of completed/pending, pinned items
- **Highlights**: Progress through day, organization

### 2. Empty State
- **User**: Maya or Sam
- **Shows**: Clean start screen
- **Highlights**: Onboarding potential

### 3. Activity Library
- **User**: Any
- **Shows**: Categorized templates
- **Highlights**: Pre-built routines, customization

### 4. Multi-User
- **Action**: Switch between users
- **Shows**: Different themes, separate data
- **Highlights**: Family/team usage

### 5. Themes
- **Action**: Show all three users
- **Shows**: Green, Purple, Orange themes
- **Highlights**: Personalization

### 6. Edit Mode
- **User**: Alex
- **Shows**: Reorder, delete options
- **Highlights**: Customization capabilities

### 7. Add Activity
- **User**: Any
- **Shows**: Template selection, emoji picker
- **Highlights**: Easy input methods

### 8. Sync Setup
- **Shows**: Sync configuration
- **Highlights**: Cross-device capability

## 🎯 Testing Scenarios

### Swipe-to-Dismiss Fix
1. Load Alex's data (12 activities)
2. Open Activity Management modal
3. Scroll down in Library tab
4. Try scrolling up quickly
5. Verify modal doesn't dismiss

### Grid Layouts
- **Phone Portrait**: 1 column (12 cards)
- **Phone Landscape**: 2 columns (6x2)
- **Tablet Portrait**: 2 columns (6x2)
- **Tablet Landscape**: 3 columns (4x3)

### Drag & Drop
1. Use Alex's activities
2. Enter edit mode
3. Drag "Fix navigation bug" to top
4. Verify numbering updates

### Completion Flow
1. Use Alex's data
2. Complete remaining activities
3. Verify animations
4. Check 100% completion state

## 📊 Feature Coverage

### ✅ Demonstrated
- Multi-user support (3 users)
- Activity management (12 items)
- Completion tracking (3/12 done)
- Pinned items (2 pinned)
- Template library (8 categories)
- Different themes (3 colors)
- User icons/emojis
- Sync configuration

### 🎨 Visual Elements
- Progress indicators (25% complete)
- Mixed states (completed/pending)
- Priority items (pinned)
- Categories & organization
- Rich emoji usage
- Color coordination

## 🔄 Reset to Demo

### Clear & Reload
```javascript
const { clearExistingData, loadDemoData } = require('./scripts/load-demo-data');
await clearExistingData(AsyncStorage);
await loadDemoData(AsyncStorage);
// Restart app
```

### Quick Switch Users
```javascript
// Switch to Maya
await AsyncStorage.setItem('stackmap_currentUser', 'user-maya');

// Switch to Sam
await AsyncStorage.setItem('stackmap_currentUser', 'user-sam');

// Back to Alex
await AsyncStorage.setItem('stackmap_currentUser', 'user-alex');
```

## 💡 Tips

1. **Screenshots**: Alex's account is most photogenic with mixed states
2. **Empty State**: Use Maya or Sam for clean onboarding shots
3. **Features**: Each user demonstrates different use cases
4. **Themes**: Shows accessibility and personalization
5. **Library**: Pre-populated with realistic templates

## 🐛 Troubleshooting

### Data Not Loading
```bash
# Check AsyncStorage keys
npx react-native log-android | grep stackmap_
npx react-native log-ios | grep stackmap_
```

### Wrong User Showing
```javascript
// Force specific user
AsyncStorage.setItem('stackmap_currentUser', 'user-alex');
```

### Activities Not Visible
```javascript
// Check activities are loaded
const activities = await AsyncStorage.getItem('stackmap_activities');
console.log(JSON.parse(activities));
```

---

**Demo Data Version**: 1.0
**Created**: January 2025
**Purpose**: Testing, Screenshots, App Store Assets