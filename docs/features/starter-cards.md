# StackMap Starter Cards - Complete Feature Discovery

## Current Starter Cards (4 cards shown initially)

1. **Welcome to StackMap!** 👋
   - Tap activities to mark them complete

2. **Try Edit Mode** ✏️
   - Use the edit button to add, remove, and organize activities

3. **Switch Users** 👤
   - Tap your user pill to switch users or check-in

4. **Share with Providers** 🔗
   - Share your activities with caregivers via QR code or link

## Expanded Starter Cards Set

### Core Functionality Cards (Priority 1)

5. **Check the Library** 📚
   - Browse pre-made activities organized by category
   - Find activities for daily routines, chores, school, and more
   - Add activities to your schedule with one tap

6. **Import Templates** 📥
   - Quick-start with ready-made schedules
   - Choose from morning routines, bedtime routines, or school days
   - Customize templates to match your needs

7. **Export Your Data** 📤
   - Save a backup of your StackMap
   - Share schedules with family members
   - Transfer to a new device easily

8. **Sync Across Devices** 🔄
   - Keep your data synchronized
   - Use on phone, tablet, and web
   - Zero-knowledge encryption keeps data private

### Organization Cards (Priority 2)

9. **Plan Tomorrow** 📅
   - Use the calendar to set up tomorrow's activities
   - Copy today's schedule as a starting point
   - Review completed activities from past days

10. **Create Categories** 📁
    - Organize activities into custom groups
    - Create categories like "Morning", "School", "Chores"
    - Find activities faster in Edit Mode

11. **Pin Important Tasks** 📌
    - Pin activities to keep them at the top
    - Pinned items stay visible when scrolling
    - Great for medicine reminders or critical tasks

12. **Reorder Activities** ↕️
    - In Edit Mode, use arrow buttons to reorder
    - Drag and drop on touchscreen devices
    - Create the perfect flow for your day

### Customization Cards (Priority 3)

13. **Choose Your Theme** 🎨
    - Tap the palette to pick your color theme
    - High contrast options for accessibility
    - Themes sync across all your devices

14. **Set Celebrations** 🎉
    - Choose animations for task completion
    - Pick between confetti, stars, or simple check
    - Different celebrations for tasks vs full routines

15. **Adjust Display** 👁️
    - Change text size for easier reading
    - Toggle descriptions on or off
    - Customize what information shows

16. **Create Custom Icons** 😊
    - Use emojis as activity icons
    - Search emoji picker by keyword
    - Icons help with quick recognition

### Advanced Features Cards (Priority 4)

17. **Set Up PIN Protection** 🔒
    - Protect Edit Mode with a PIN
    - Prevent accidental changes
    - Keep each user's settings secure

18. **Track Progress** 📊
    - View completion history
    - See patterns and streaks
    - Celebrate achievements

19. **Multi-User Setup** 👨‍👩‍👧‍👦
    - Add family members
    - Each person gets their own schedule
    - Quick switching between users

20. **Offline Mode** ✈️
    - StackMap works without internet
    - Changes sync when reconnected
    - Never lose your progress

### Help & Support Cards (Priority 5)

21. **Reset Your Day** 🔄
    - Start fresh if needed
    - Uncheck all activities at once
    - Available in Settings

22. **Get Help** ❓
    - Access tutorials and guides
    - Find answers to common questions
    - Contact support if needed

23. **Share Feedback** 💬
    - Help improve StackMap
    - Report issues or bugs
    - Suggest new features

24. **Support Development** ☕
    - Learn about supporting StackMap
    - Available on web version
    - Help keep StackMap free

## Implementation Strategy

### Progressive Disclosure
Show cards based on user progression:

**Day 1 (First 4 cards)**
- Welcome, Edit Mode, Switch Users, Share

**Day 2 (Add 4 more)**
- Library, Import, Export, Sync

**Day 3 (Add 4 more)**
- Tomorrow, Categories, Pin, Reorder

**Week 2 (Remaining cards)**
- Gradually introduce advanced features

### Smart Card Selection

Based on user type selection during onboarding:

**Helper Mode**
- Prioritize: Multi-User, PIN Protection, Share
- De-prioritize: Complex customization

**Self Mode**
- Prioritize: Customization, Progress Tracking
- De-prioritize: Multi-user features

**Multiple People Mode**
- Prioritize: User switching, PIN, Sync
- Show all sharing features

### Card Completion Tracking

```javascript
const StarterCard = {
  id: string,
  text: string,
  icon: string,
  description: string,
  category: 'core' | 'organize' | 'customize' | 'advanced' | 'help',
  priority: 1 | 2 | 3 | 4 | 5,
  completed: boolean,
  completedAt: timestamp,
  action: 'navigate' | 'demo' | 'info',
  actionTarget: string, // Screen or feature to navigate to
};
```

### Interactive Card Actions

Each card can trigger specific actions when tapped:

```javascript
const cardActions = {
  'Check the Library': () => navigate('ActivityLibrary'),
  'Import Templates': () => navigate('ImportExport', { mode: 'import' }),
  'Export Your Data': () => navigate('ImportExport', { mode: 'export' }),
  'Sync Across Devices': () => navigate('SyncSettings'),
  'Plan Tomorrow': () => navigate('Calendar', { day: 'tomorrow' }),
  'Choose Your Theme': () => navigate('Preferences', { section: 'theme' }),
  'Set Up PIN Protection': () => navigate('PinSetup'),
  // ... etc
};
```

## Card Display Logic

### Initial Display
```javascript
const getInitialCards = (userType) => {
  const baseCards = [
    'Welcome to StackMap!',
    'Try Edit Mode',
    'Switch Users',
    'Share with Providers'
  ];
  
  // Add context-specific cards
  if (userType === 'helper') {
    baseCards.push('Set Up PIN Protection');
  } else if (userType === 'multi') {
    baseCards.push('Sync Across Devices');
  } else {
    baseCards.push('Check the Library');
  }
  
  return baseCards.slice(0, 5);
};
```

### Progressive Reveal
```javascript
const getAvailableCards = (daysUsed, completedCards) => {
  const allCards = getCardsByPriority();
  const revealed = [];
  
  // Reveal by priority and usage
  if (daysUsed >= 1) revealed.push(...allCards.priority1);
  if (daysUsed >= 2) revealed.push(...allCards.priority2);
  if (daysUsed >= 7) revealed.push(...allCards.priority3);
  if (completedCards.length > 10) revealed.push(...allCards.priority4);
  
  // Filter out completed
  return revealed.filter(card => !completedCards.includes(card.id));
};
```

## Success Metrics

### Engagement
- **Card Completion Rate**: % of cards marked complete
- **Action Trigger Rate**: % of cards that led to feature use
- **Retention Impact**: Users who complete >5 cards vs <5

### Discovery
- **Feature Adoption**: Which features get discovered via cards
- **Time to Discovery**: How long until key features are found
- **Skip Pattern**: Which cards are dismissed without action

### User Satisfaction
- **Helpful Ratings**: User feedback on card usefulness
- **Confusion Points**: Cards that generate support requests
- **Repeat Access**: Cards users return to multiple times

## A/B Testing Opportunities

### Test 1: Card Quantity
- A: Show 4 initial cards
- B: Show 8 initial cards
- Measure: Overwhelm vs engagement

### Test 2: Card Persistence
- A: Cards disappear when completed
- B: Cards remain but show checkmark
- Measure: Reference value vs clutter

### Test 3: Card Interactivity
- A: Cards are informational only
- B: Cards navigate to features
- Measure: Feature discovery rate

## Notes for Implementation

1. **Don't Overwhelm**: Start with few cards, reveal more over time
2. **Make Interactive**: Cards should lead to action, not just inform
3. **Track Progress**: Show users their learning progress
4. **Allow Dismissal**: Users can hide cards they don't need
5. **Provide Value**: Each card should teach something useful
6. **Maintain Context**: Cards should adapt to user's setup choices