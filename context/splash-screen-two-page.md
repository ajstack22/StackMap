# Two-Page Splash Screen Implementation

## Overview
The welcome splash screen has been split into two separate pages to improve user onboarding experience.

## Page Structure

### Page 1: Welcome/Introduction
- StackMap logo
- Welcome message and app description
- 3-step instructions on how to use the app
- "Next" button to proceed to page 2

### Page 2: User Setup
- StackMap logo
- Personalization message
- Name input field
- Emoji picker with refresh button
- "Back" button to return to page 1
- "Let's Get Started!" button (disabled until name is entered)

## Technical Implementation

### HTML Structure
- Both pages are contained within the same splash screen container
- Page 1: `splash-page-1` class with `id="splashPage1"`
- Page 2: `splash-page-2` class with `id="splashPage2"` (initially hidden)

### CSS Animations
- Slide transitions between pages:
  - `slideOutLeft`: Page slides out to the left when transitioning forward
  - `slideInRight`: New page slides in from the right
- Animation duration: 400ms
- Proper cleanup of animation classes after transitions

### JavaScript Logic
- Page navigation handled in `setupSplashScreen()` method
- Next button: Transitions from page 1 to page 2
- Back button: Returns from page 2 to page 1
- Emoji picker shows random emojis when entering page 2
- Name input focus automatically when reaching page 2
- Keyboard support: Escape key to close (only if not first visit)

### Responsive Design
- Mobile-optimized button layout
- Button group stacks vertically on mobile
- Adjusted font sizes and spacing for smaller screens

## Testing
Use these functions in the browser console:
- `testSplash()` - Clear splash seen flag and reload
- `showSplash()` - Show splash screen without reload (for testing)

## Key Features
1. **Progressive disclosure**: Instructions shown first, then user setup
2. **Smooth transitions**: Animated page changes for better UX
3. **Accessibility**: Proper focus management and keyboard navigation
4. **Mobile-friendly**: Responsive design with touch-friendly buttons
5. **State preservation**: Animation classes properly cleaned up

## File Changes
1. `/index.html` - Updated splash screen HTML structure
2. `/styles/splash-screen.css` - Added two-page styling and animations
3. `/app/StackMapApp.js` - Updated JavaScript logic for page navigation
4. `/dev-tools.js` - Added test functions