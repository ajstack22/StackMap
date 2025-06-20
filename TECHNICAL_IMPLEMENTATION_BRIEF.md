# StackMap Technical Implementation Brief for UX Researchers

## 🎯 Product Overview
**StackMap** is a visual schedule/routine management app designed specifically for children and adults with autism, ADHD, and other special needs. It helps users create visual task sequences with cards that can be checked off throughout the day.

## 📱 Current Technical Stack

### Frontend Architecture
- **Pure JavaScript** (ES6+) - No framework (React, Vue, etc.)
- **Web Components** - Custom elements for modular UI
- **Service Worker** - Offline-first PWA functionality
- **IndexedDB** - Local data storage
- **Google Drive API** - Optional cloud sync
- **Capacitor** - Native app wrapper for iOS/Android

### Key Technical Constraints
1. **No Build Process** - Direct JavaScript modules, no webpack/bundling
2. **Privacy-First** - No analytics, no tracking, no user accounts required
3. **Offline-First** - Must work without internet connection
4. **COPPA Compliant** - No data collection from children
5. **School Network Compatible** - Works behind restrictive firewalls

## 🔧 Current Drag & Drop Implementation

### Core Drag System (`js/state.js`)
```javascript
// Current implementation uses mouse/touch events directly
element.addEventListener('mousedown', startDrag);
element.addEventListener('touchstart', startDrag);

// No differentiation between tap and drag intent
// Immediate drag on touchstart causes scroll conflicts
```

### Card Structure
```html
<div class="activity-card sortable" data-id="123">
  <div class="card-content">
    <span class="activity-icon">🎨</span>
    <span class="activity-text">Art Time</span>
  </div>
  <button class="complete-btn">✓</button>
</div>
```

### Current Problems
1. **No Touch Slop** - Dragging starts immediately on touch
2. **No Gesture Recognition** - Can't differentiate scroll vs drag intent
3. **No Long Press** - Standard mobile pattern not implemented
4. **No Drag Handles** - Entire card is draggable
5. **No Haptic Feedback** - No tactile confirmation of actions

## 📐 Layout & Space Constraints

### Mobile Header Structure
```javascript
// Current header format
`${userName} ${userEmoji} ${dayOfWeek}` 
// Results in: "StackMap User 😊 Thursday" (too long!)
```

### Screen Real Estate Issues
- Header takes ~80px on mobile
- Navigation takes another ~60px
- Cards are 100px tall each
- Only 4-5 cards visible on typical phone

### Current Responsive Approach
- Basic media queries at 768px breakpoint
- No mobile-specific optimizations
- Same UI for desktop and mobile

## 👥 User Base Characteristics

### Primary Users
1. **Children with Autism** (ages 5-17)
   - Need predictable interactions
   - May have motor control challenges
   - Benefit from visual feedback
   
2. **Adults with ADHD**
   - Need quick, efficient interactions
   - Easily frustrated by UI friction
   - Benefit from minimal distractions

3. **Parents/Caregivers**
   - Setting up schedules for others
   - Need efficient management tools
   - Often using mobile devices

4. **Special Education Teachers**
   - Managing multiple students
   - Classroom iPads/tablets
   - Limited time for setup

### Accessibility Needs
- **Motor Control** - Some users have limited fine motor skills
- **Visual Processing** - Clear contrast, simple layouts needed
- **Cognitive Load** - Must minimize complexity
- **Sensory Sensitivity** - Avoid overwhelming animations/sounds

## 🏗️ Technical Debt & Limitations

### "Duct Tape" Areas
1. **Event Handling** - Mixed jQuery and vanilla JS patterns
2. **State Management** - Global variables, no proper state container
3. **Component Communication** - Direct DOM manipulation
4. **Memory Management** - Potential leaks from event listeners
5. **Touch Events** - Basic implementation, no gesture library

### Performance Issues
- Large DOMs with many cards can lag
- No virtual scrolling for long lists
- Animation frames not optimized
- Touch events not throttled

### Browser/Platform Quirks
- iOS Safari momentum scrolling conflicts
- Android Chrome 100vh issues
- PWA installation varies by platform
- Service Worker update delays

## 🔄 Current User Flows

### First-Time User Flow (BROKEN)
1. User lands on index.html
2. Should see welcome modal → **DOESN'T TRIGGER**
3. Defaults to "StackMap User" → **WASTES SPACE**
4. No emoji selection → **MISSING PERSONALIZATION**

### Schedule Creation Flow
1. User in "view mode" by default
2. Must find hidden menu to enter "edit mode"
3. Tap "+" to add cards (often missed)
4. Drag to reorder (conflicts with scroll)
5. No clear "save" action (auto-saves)

### Daily Usage Flow
1. Open app to today's schedule
2. Tap checkmarks to complete tasks
3. Visual/audio feedback on completion
4. Progress tracked visually
5. Optional celebration at 100%

## 💾 Data Architecture

### Local Storage Structure
```javascript
{
  schedules: {
    Monday: [...cards],
    Tuesday: [...cards],
    // etc
  },
  userData: {
    userName: "StackMap User",
    userEmoji: "😊",
    currentUser: "user1"
  },
  preferences: {
    sounds: true,
    celebrations: true
  }
}
```

### Card Object Structure
```javascript
{
  id: "unique-id",
  text: "Brush Teeth",
  icon: "🦷",
  color: "#4299e1",
  isCompleted: false,
  order: 0
}
```

## 🚀 Deployment & Platform Details

### PWA Capabilities
- **Install Prompt** - Supported but not prominent
- **Offline Mode** - Full functionality
- **Updates** - Service Worker with 24hr cache
- **Push Notifications** - Not implemented (privacy)

### Native App Wrapper
- **Capacitor 6.x** - Latest version
- **iOS** - WKWebView based
- **Android** - Chrome WebView
- **Platform Detection** - Basic implementation exists

### Current URLs
- **Production**: https://app.stackmap.io
- **PWA**: Installable from browser
- **Android**: APK available (debug build)
- **iOS**: Pending App Store submission

## 🎨 Design System

### Visual Language
- **Primary Color**: #667eea (purple)
- **Card Colors**: 8 predefined options
- **Typography**: System fonts (San Francisco, Roboto)
- **Icons**: Emoji-based (no icon fonts)
- **Animations**: CSS transitions (300ms default)

### Component Library
- No formal design system
- Inline styles mixed with CSS classes
- No component documentation
- Inconsistent spacing/sizing

## 🔑 Key Technical Decisions

### Why No Framework?
- Simplicity for contributors
- Smaller bundle size
- Better performance on low-end devices
- Easier offline caching

### Why Privacy-First?
- COPPA compliance for schools
- Parent trust
- Ethical stance on data collection
- Simpler architecture

### Why Emoji Icons?
- Universal support
- No loading delays
- Culturally inclusive
- Kid-friendly

## 🚧 Known Issues

### Mobile-Specific
1. **Scroll vs Drag** - Main friction point
2. **Keyboard Overlap** - Input fields hidden
3. **Safe Area Insets** - Not handled on iOS
4. **Touch Targets** - Some buttons too small (< 44px)
5. **Landscape Mode** - Layout breaks

### Performance
1. **Long Lists** - No virtualization
2. **Animation Jank** - Not GPU accelerated
3. **Memory Usage** - Cards never cleaned up
4. **Bundle Size** - 4.9MB APK seems large

### Accessibility
1. **Screen Readers** - Partial support
2. **Keyboard Navigation** - Not fully implemented
3. **Color Contrast** - Some combinations fail WCAG
4. **Focus Indicators** - Inconsistent
5. **Touch Announcements** - Missing

## 📊 Metrics We Care About

### User Success Metrics
- Time to create first schedule
- Daily active usage rate
- Task completion rates
- User retention (via localStorage)

### Technical Metrics
- First Contentful Paint (< 1.5s)
- Time to Interactive (< 3s)
- Scroll performance (60fps)
- Touch responsiveness (< 100ms)

### Accessibility Metrics
- Touch target success rate
- Error recovery rate
- Time to complete tasks
- User frustration indicators

## 🔮 Future Considerations

### Technical Modernization Options
1. **React Native** - True native performance
2. **Flutter** - Consistent cross-platform
3. **SolidJS** - Minimal reactive framework
4. **Web Components** - Double down on standards

### Feature Roadmap
1. Multiple user profiles
2. Teacher/classroom mode
3. Visual schedule templates
4. Progress tracking/analytics (local only)
5. Tablet-optimized layouts

### Platform Expansion
1. Apple Watch companion
2. Android Wear support
3. Desktop native apps
4. Classroom smart boards

## 💡 Research Recommendations

Focus research on:
1. **Touch gesture patterns** that don't conflict with scrolling
2. **Information density** for mobile screens
3. **Onboarding flows** that ensure setup completion
4. **Edit mode alternatives** to drag and drop
5. **Accessibility accommodations** for motor impairments

Avoid researching:
1. Complex gestures (pinch, rotate)
2. Account-based features
3. Social/sharing features
4. Data collection methods
5. Advertising/monetization

## 📞 Technical Contacts

For implementation questions:
- Architecture decisions: Review `app/StackMapApp.js`
- Drag system: See `js/state.js`
- PWA setup: Check `manifest.json` and `sw.js`
- Mobile wrapper: See `capacitor.config.json`

This brief should give researchers full context of our technical constraints, user needs, and implementation realities to make their recommendations actionable and feasible.