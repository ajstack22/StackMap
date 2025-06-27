# StackMap Refactor - Project Context

## Executive Summary
We are modernizing StackMap, a visual activity card app that helps children (especially those with ADHD/autism) map out their daily routines. The legacy app works well but uses older technology. The refactor aims to maintain the same user experience while upgrading to modern, maintainable code.

## Key Project Goals
1. **Preserve User Experience**: The app must feel exactly the same to users
2. **Modern Technology**: Upgrade from ES5/mixed to consistent ES6+
3. **Better Architecture**: Modular, maintainable, testable code
4. **Mobile-First**: Optimized for phones and tablets
5. **Reliability**: Comprehensive error handling for users with executive function challenges

## Technology Comparison

| Aspect | Legacy | Refactor |
|--------|--------|----------|
| JavaScript | ES5/ES6 mixed | Modern ES6+ |
| Storage | LocalStorage only | SQLite + LocalStorage |
| Architecture | Monolithic StackMapApp | Modular components |
| Error Handling | Basic | Comprehensive with fallbacks |

## Current Status
- ✅ Core infrastructure complete
- ✅ Storage layer implemented  
- 🔄 Converting "tasks" terminology to "activities"
- 🎯 Implementing core UI components
- ⏳ Need header navigation system

## Critical User Context
Our users have ADHD and executive function challenges. This means:
- **Stability is paramount** - crashes disrupt routines
- **Consistency matters** - unexpected changes cause anxiety
- **Performance required** - delays increase frustration
- **Clear visual feedback** - ambiguity creates confusion

## Development Process
1. **Story Assignment**: Each developer gets a specific story
2. **Research Phase**: Understand existing code before changing
3. **Plan Creation**: Detailed, file-by-file modification plan
4. **PM Review**: Plan goes to 4-PlanReview folder
5. **Implementation**: Only after plan approval
6. **Testing**: Comprehensive testing before completion

## Key Principles
- **Don't break what works**: Test every change
- **Match user expectations**: UI should feel familiar
- **Modern but compatible**: ES6+ but still script tags
- **Mobile-first**: Design for constraints
- **Incremental progress**: Small, safe changes

## File Organization
```
/refactor/
├── js/           # All JavaScript files
├── css/          # All stylesheets  
├── index.html    # Single page app
└── context/
    └── foundry/
        ├── 3-Stories/      # Active stories
        ├── 4-PlanReview/   # Plans awaiting review
        └── 5-ReadyToDevelop/  # Approved for coding
```

## Legacy App Key Features
- Header with customizable title
- Subtitle "pill" shows user emoji + day
- Clicking pill opens user/day selector
- Hybrid panels slide from left/right
- Activity cards with emoji + text
- Edit mode for parents
- Grownup mode protects settings

Remember: We're not reinventing - we're modernizing while preserving what works.