# DEVELOPMENT CONSTRAINTS

## 🚨 ABSOLUTE REQUIREMENTS - NO EXCEPTIONS

### **1. NO ES6 IMPORT STATEMENTS**
```javascript
❌ WRONG: import { Component } from './component.js'
❌ WRONG: import React from 'react'
❌ WRONG: const { helper } = require('./helper')

✅ CORRECT: <script src="component.js"></script>
✅ CORRECT: window.Component access
✅ CORRECT: Script tag loading in index.html
```
**Reason:** Vanilla JS architecture for reliability and simplicity

### **2. NO FRAMEWORK DEPENDENCIES**
```javascript
❌ WRONG: React, Vue, Angular, jQuery
❌ WRONG: npm install [any framework]
❌ WRONG: CDN framework imports

✅ CORRECT: Pure vanilla JavaScript
✅ CORRECT: Native DOM manipulation
✅ CORRECT: Built-in browser APIs only
```
**Reason:** Zero dependencies for special needs families' reliability

### **3. NO BUILD PROCESS ASSUMPTIONS**
```javascript
❌ WRONG: webpack, rollup, vite configurations
❌ WRONG: npm run build commands
❌ WRONG: TypeScript compilation

✅ CORRECT: Direct file loading in browser
✅ CORRECT: Works without compilation
✅ CORRECT: Simple script tag architecture
```
**Reason:** Families need simple deployment and maintenance

### **4. SPECIAL NEEDS ACCESSIBILITY ALWAYS PRIORITY**
```css
✅ REQUIRED: Large touch targets (min 44px)
✅ REQUIRED: High contrast colors
✅ REQUIRED: ARIA labels for screen readers
✅ REQUIRED: Simple, predictable interactions
✅ REQUIRED: Clear completion feedback
```
**Reason:** This is the core mission - serving special needs children

### **5. TOUCH-FRIENDLY MOBILE DESIGN REQUIRED**
```css
✅ REQUIRED: Mobile-first responsive design
✅ REQUIRED: Large, easy-to-tap buttons
✅ REQUIRED: Gesture-friendly interactions
✅ REQUIRED: Avoid hover-dependent features
```
**Reason:** Primary use case is mobile devices by children

## 🛡️ BEFORE ANY CODE CHANGES

### **Step 1: Verify File Exists**
- Check Missing File Protocol
- Confirm file is in project knowledge
- If missing, STOP and ask Adam

### **Step 2: Check Dependencies**
- Review Component Inventory for existing functionality
- Check CSS Module Map for existing styles
- Verify no ES6 imports will be introduced

### **Step 3: Consider Special Needs Impact**
- Will this help or hinder children with special needs?
- Does it maintain accessibility standards?
- Is it touch-friendly for motor skill challenges?
- Does it preserve predictable behavior?

### **Step 4: Confirm Vanilla JS Approach**
- No framework dependencies introduced
- No build process required
- Works with script tag loading

## 🎯 DECISION-MAKING CRITERIA

### **Primary Question: "Does this serve special needs children better?"**
All technical decisions should prioritize:
1. **Accessibility** - Screen readers, motor skills, cognitive load
2. **Reliability** - Works offline, no complex dependencies
3. **Simplicity** - Parents can maintain and understand
4. **Predictability** - Consistent behavior for routine-dependent children

### **Secondary Questions:**
- Does this maintain the vanilla JS architecture?
- Can families deploy this without technical knowledge?
- Will this work offline for routine continuity?
- Does this respect the existing component system?

## 🚫 COMMON ANTI-PATTERNS TO AVOID

### **Framework Temptation:**
```javascript
❌ "React would make this easier"
❌ "Vue has better state management"  
❌ "Angular has good accessibility"

✅ "How can we do this in vanilla JS for reliability?"
```

### **Over-Engineering:**
```javascript
❌ "Let's add a complex state management system"
❌ "We need a build process for optimization"
❌ "TypeScript would prevent bugs"

✅ "What's the simplest solution that serves the kids?"
```

### **Accessibility Shortcuts:**
```javascript
❌ "We can add accessibility later"
❌ "Most users won't need screen readers"
❌ "Small buttons save space"

✅ "Accessibility is designed in from the start"
```

## 🎨 DESIGN PATTERNS TO FOLLOW

### **Component Pattern:**
- Extend existing components in components.js
- Use ComponentBuilder for DOM creation
- Follow special needs accessibility patterns

### **CSS Pattern:**
- Add to existing modules in /styles/
- Use CSS variables for theming
- Maintain responsive mobile-first design

### **Data Pattern:**
- Use AppState for all data management
- Follow existing schema in data/ files
- Maintain offline-first approach

### **Event Pattern:**
- Use native DOM events
- Touch-friendly event handling
- Accessibility keyboard support

## 🆘 EMERGENCY PROTOCOLS

### **When Constraints Seem Limiting:**
1. **STOP** and explain the limitation to Adam
2. **ASK** for guidance on vanilla JS approach
3. **EXPLORE** existing components that might solve the problem
4. **REMEMBER** the special needs mission takes priority

### **When External Libraries Seem Necessary:**
1. **QUESTION** if the feature is essential for special needs users
2. **RESEARCH** vanilla JS alternatives
3. **PROPOSE** simplified versions that serve the core mission
4. **GET APPROVAL** from Adam before adding any dependencies

### **When Architecture Seems Insufficient:**
1. **IDENTIFY** specific limitations
2. **PROPOSE** extensions to existing systems
3. **CONSIDER** special needs impact of changes
4. **MAINTAIN** vanilla JS and accessibility principles

## 💡 GUIDING PRINCIPLES

### **"Simple is Better"**
- Fewer dependencies = more reliable for families
- Easier to understand = parents can help maintain
- Direct code = children get consistent behavior

### **"Accessibility First"**
- Every feature designed for diverse abilities
- Touch-friendly for motor skill challenges
- Predictable for cognitive processing differences
- Screen reader compatible for visual impairments

### **"Offline Resilience"**
- Routines must work without internet
- No cloud dependencies for core functionality
- Local storage for reliability

**Remember: We're building for families navigating special needs challenges. Every technical decision should make their lives easier, not harder.**