# Mobile Architecture Research Prompts for Claude

## Prompt 1: ADHD/Special Needs Mobile Navigation Patterns

I'm rebuilding a task management app called StackMap that's specifically designed for users with ADHD, autism, and executive function challenges. We're moving from a web-first to mobile-first architecture.

Please research and provide:
1. Best practices for mobile navigation patterns for users with ADHD and executive function disorders
2. How view transitions and animations impact users with attention/focus challenges
3. Optimal navigation depth (how many taps/screens deep is too much?)
4. Gesture-based vs button-based navigation preferences for this demographic
5. Examples of successful mobile apps for special needs users and their navigation patterns

## Prompt 2: Cross-Platform Architecture for Special Needs Apps

I need to build an app that works identically across:
- Web browsers
- PWA (Progressive Web App)
- iOS native (via Capacitor)
- Android native (via Capacitor)  
- Google TV/Android TV
- Potentially Apple TV

Research and provide:
1. Current best practices for "write once, run everywhere" architectures
2. How other successful apps handle navigation differences between touch, mouse, and TV remote
3. Platform-specific considerations for accessibility features
4. Performance optimization strategies for low-end devices (many schools/programs use older hardware)

## Prompt 3: TV Interface Patterns for Special Needs Users

We're planning to support Google TV and potentially Apple TV. Our users have ADHD, autism, and motor control challenges.

Please research:
1. Best practices for TV navigation with D-pad/remote control
2. Focus management and visual indicators for users with attention challenges
3. Optimal button sizes and spacing for TV interfaces
4. How to handle complex interactions (like reordering items) with just a remote
5. Voice control integration patterns
6. Examples of accessible TV apps

## Prompt 4: Offline-First Architecture for Reliability

Our users depend on routine and consistency - the app MUST work reliably even without internet. 

Research and provide:
1. Best practices for offline-first mobile architectures
2. Sync strategies that don't confuse users (showing stale data vs. sync status)
3. How to handle offline/online transitions smoothly
4. Local storage strategies across different platforms
5. Conflict resolution patterns that make sense to users

## Prompt 5: Safe Modern JavaScript for Cross-Platform Apps

We're using vanilla JavaScript (no frameworks) and need to support older WebViews. We previously failed trying to implement ES6.

Please provide:
1. A compatibility matrix of ES6+ features across WebView versions (iOS 12+, Android 5+)
2. Which features are safe to use without transpilation
3. Common pitfalls when using modern JS in WebViews
4. Performance implications of different language features
5. Testing strategies for ensuring compatibility