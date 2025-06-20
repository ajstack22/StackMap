# StackMap Mobile UX Round 1: Critical Touch/Scroll Fixes

## 🎯 Your Mission
Fix the critical scroll vs drag conflict that makes the mobile app frustrating to use. Users currently can't scroll without accidentally grabbing cards.

## 🚨 Critical User Feedback
"I just experienced something with the mobile version. If you are in edit mode, you can't scroll down to see cards off screen without grabbing the card, and if you go to today and click and drag you also will grab a card instead of scrolling. It's not great."

## 📱 Current Problem
- **Edit Mode**: Can't scroll without grabbing cards
- **View Mode**: Clicking and dragging grabs cards instead of scrolling
- **Impact**: App feels like "duct tape barely holding on"

## 🛠️ Technical Context

### Current Drag Implementation (js/state.js)
```javascript
// Problem: No differentiation between scroll and drag
element.addEventListener('touchstart', startDrag);
// Drag starts IMMEDIATELY on touch - no touch slop or long press
```

### Mobile UX Fix Already Started (js/mobile-ux-fixes.js)
A partial implementation exists with:
- Long press detection (400ms)
- Touch slop (10 pixels)
- Onboarding flow fix
- Header optimization

**Key improvement already coded:**
```javascript
handleTouchStart(e) {
  // Long press timer for drag
  this.longPressTimer = setTimeout(() => {
    if ('vibrate' in navigator) navigator.vibrate(50);
    this.isDragging = true;
    card.classList.add('drag-ready');
  }, this.LONG_PRESS_DURATION);
}
```

## ✅ Required Fixes

### 1. Integrate Long Press into Main Drag System
- Connect mobile-ux-fixes.js with the main drag system in state.js
- Ensure cards only become draggable after 400ms hold
- Add visual feedback when card is "grabbed"

### 2. Fix Scroll in Edit Mode
- Allow vertical scrolling without triggering drag
- Implement touch slop (10px movement cancels drag)
- Consider adding explicit drag handles

### 3. Fix Missing Onboarding
- The welcome modal code exists but doesn't trigger
- Should prompt for name (max 15 chars) and emoji
- Default to "Me" instead of "StackMap User"

### 4. Optimize Header
- Current: "StackMap User 😊 Thursday" (too long!)
- Mobile: "😊 Thu" (much better)
- Desktop: Keep full format

## 📂 Key Files to Modify

1. **js/mobile-ux-fixes.js** - Has good foundation, needs integration
2. **js/state.js** - Main drag system needs mobile awareness
3. **js/main.js** - Ensure mobile-ux-fixes.js is imported
4. **index.html** - Verify script loading order

## 🎯 Success Metrics
1. Users can scroll naturally without grabbing cards
2. Long press (400ms) required to start dragging
3. Haptic feedback confirms drag start
4. Onboarding shows on first launch
5. Header uses compact format on mobile

## 💡 Implementation Tips
- The mobile detection already works: `/Android|webOS|iPhone|iPad/i.test(navigator.userAgent)`
- Capacitor is configured with HTTPS schemes (see capacitor.config.json)
- The app uses pure JavaScript - no frameworks
- Test with `npm run android:build:debug` and `npm run android:install`

## ⚠️ Constraints
- Must work offline
- No external dependencies
- Maintain accessibility for users with motor difficulties
- Keep it simple - these users have special needs

## 🚀 Quick Start
1. Read the existing mobile-ux-fixes.js implementation
2. Find where drag is initialized in state.js
3. Connect the long press logic to the drag system
4. Test scrolling vs dragging behavior
5. Ensure onboarding triggers for new users

The foundation is already there - just needs to be properly integrated!