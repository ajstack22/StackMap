# Story 2: User Dropdown Interface - Claude Code Package

## 📁 **Context Folder Setup**

Before running this prompt, populate your `/context` folder with these files:

### **Required Context Files:**
```
/context/
├── constraints.md (copy Development Constraints.md)
├── css-module-map.md (copy CSS Module Map.md) 
├── component-inventory.md (copy Component Inventory.md)
└── architecture.md (copy StackMap Codebase Documentation.md)
```

**Note:** Claude Code will have access to all current files directly - no need to copy them to context folder.

---

## 🎯 **Story 2: User Dropdown Interface**

### **Story Overview**
Replace the current static title in StackMap's header with an interactive dropdown that allows users to switch between family members and add new users. This enables multiple family members to maintain separate routines on a shared device.

### **Critical Context for Implementation**

#### **StackMap Architecture Constraints:**
- **Vanilla JavaScript ONLY** - No ES6 imports, no frameworks
- **Special Needs Accessibility** - 44px minimum touch targets, high contrast
- **Mobile-First** - Primary use case is touch devices
- **Modular CSS** - Never create new CSS files, extend existing modules
- **Window Globals** - All components use `window.ComponentName` pattern

#### **Current State (After Story 1):**
- Multi-user data architecture is complete and tested
- User management methods exist: `addUser()`, `switchUser()`, `getAllUsers()`
- Current UI still shows static title - this story adds the dropdown

#### **Files That Need Modification:**
1. `index.html` - Replace title with dropdown structure
2. `styles/layout.css` - Style the dropdown header components  
3. `styles/forms.css` - Add dropdown-specific styles
4. `StackMapApp.js` - Add user switching event handlers
5. `renderer.js` - Update header rendering logic

---

## 📋 **Implementation Requirements**

### **UI Requirements:**
- Replace static title with `<select>` dropdown + add user button
- Dropdown shows current user and all available users
- Add user button (➕) appears only in grown-up mode
- Both static and fixed headers need synchronized dropdowns
- Maintain 44px touch targets for accessibility

### **Functional Requirements:**
- Dropdown selection switches users and renders their data
- Add user button opens simple prompt for name input
- User names limited to 20 characters max
- Maximum 6 users total (enforced by existing backend)
- Switching preserves all data isolation

### **Technical Requirements:**
- Follow existing StackMap event handler patterns
- Use existing CSS variable system for theming
- Maintain responsive behavior at 768px and 480px breakpoints
- Preserve all accessibility features

---

## 🎨 **Design Specifications**

### **Header Structure:**
```html
<!-- Replace title with user selector container -->
<div class="user-selector-container">
    <select id="userSelector" class="user-dropdown">
        <!-- Options populated by JavaScript -->
    </select>
    <button id="addUserBtn" class="btn btn--add-user">
        <span class="material-icons">person_add</span>
    </button>
</div>
```

### **Styling Requirements:**
- Dropdown: White background with rounded corners, primary color accent
- Add button: Circular, 36px, Material Icons person_add
- Mobile: Reduce sizes proportionally but maintain 44px touch targets
- Typography: Match existing title font weight and size

### **Behavior Requirements:**
- Dropdown change triggers `switchUser(selectedValue)`
- Add button click opens `prompt()` for user name
- Invalid names (empty, too long) show appropriate errors
- User switching immediately updates UI and applies user's theme

---

## 🧪 **Validation Suite**

Include this validation script in your implementation to verify Story 2:

```javascript
// Story 2 Validation Suite
const validateStory2 = () => {
    console.log('=== STORY 2 VALIDATION ===');
    
    // Test 1: UI Elements Present
    const userSelector = document.getElementById('userSelector');
    const fixedUserSelector = document.getElementById('fixedUserSelector');
    const addUserBtn = document.getElementById('addUserBtn');
    const fixedAddUserBtn = document.getElementById('fixedAddUserBtn');
    
    console.log('✅ Static dropdown present:', !!userSelector);
    console.log('✅ Fixed dropdown present:', !!fixedUserSelector);
    console.log('✅ Add user button present:', !!addUserBtn);
    console.log('✅ Fixed add user button present:', !!fixedAddUserBtn);
    
    // Test 2: Dropdown Population
    if (userSelector) {
        console.log('✅ Dropdown options count:', userSelector.options.length);
        console.log('✅ Current selection:', userSelector.value);
        
        // List all available users
        const users = Array.from(userSelector.options).map(opt => opt.text);
        console.log('✅ Available users:', users);
    }
    
    // Test 3: Add User Button Visibility
    const isGrownupMode = document.body.classList.contains('grownup-mode');
    const addBtnVisible = addUserBtn && getComputedStyle(addUserBtn).display !== 'none';
    console.log('✅ Grown-up mode:', isGrownupMode);
    console.log('✅ Add button visible in grown-up mode:', isGrownupMode ? addBtnVisible : 'N/A (child mode)');
    
    // Test 4: Touch Targets (Mobile Accessibility)
    if (userSelector) {
        const dropdownRect = userSelector.getBoundingClientRect();
        const touchTarget = Math.min(dropdownRect.width, dropdownRect.height);
        console.log('✅ Dropdown touch target size:', touchTarget + 'px', touchTarget >= 44 ? '(PASS)' : '(FAIL - needs 44px+)');
    }
    
    if (addUserBtn) {
        const btnRect = addUserBtn.getBoundingClientRect();
        const btnTouchTarget = Math.min(btnRect.width, btnRect.height);
        console.log('✅ Add button touch target:', btnTouchTarget + 'px', btnTouchTarget >= 44 ? '(PASS)' : '(FAIL - needs 44px+)');
    }
    
    // Test 5: Event Handlers
    console.log('✅ User switching method exists:', typeof appInstance.switchUser === 'function');
    console.log('✅ Add user method exists:', typeof appInstance.showAddUserDialog === 'function');
    
    // Test 6: Responsive Design
    const isMobile = window.innerWidth <= 768;
    console.log('✅ Current viewport:', window.innerWidth + 'px', isMobile ? '(Mobile)' : '(Desktop)');
    
    console.log('=== VALIDATION COMPLETE ===');
    
    // Return summary
    const passed = userSelector && fixedUserSelector && addUserBtn && 
                  userSelector.options.length > 0 && 
                  typeof appInstance.switchUser === 'function';
    
    return passed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌';
};

// Auto-run validation
console.log(validateStory2());
```

---

## 🎯 **Implementation Notes**

### **Integration Points:**
- Hook into existing `setupEventListeners()` method in StackMapApp.js
- Extend `updateHeader()` method in renderer.js  
- Use existing CSS variable system for consistent theming
- Follow existing button patterns from preferences panel

### **Error Handling:**
- Validate user names (length, non-empty)
- Handle dropdown selection changes gracefully
- Prevent adding users beyond limit (6 max)
- Maintain data integrity during user switching

### **Accessibility Considerations:**
- All dropdown options have proper labels
- Add user button has aria-label and title
- Keyboard navigation works for dropdown
- Screen reader announces user changes

---

## ✅ **Success Criteria**

After implementation, this validation should all pass:

1. **Visual**: Dropdown appears where title was, shows current user
2. **Functional**: Can switch between users via dropdown selection  
3. **Add User**: Add button works in grown-up mode, validates input
4. **Data Isolation**: Switching users shows correct activities/themes
5. **Responsive**: Works on mobile with adequate touch targets
6. **Accessibility**: Keyboard navigation and screen reader support
7. **Validation Script**: `validateStory2()` returns "ALL TESTS PASSED ✅"

---

## 🚀 **Claude Code Prompt**

Implement Story 2 based on this specification, using the context files for current codebase understanding. Focus on:

1. **Header Structure**: Replace static titles with dropdown containers
2. **CSS Integration**: Extend existing layout.css and forms.css (never create new files)
3. **JavaScript Integration**: Add user switching handlers to StackMapApp.js
4. **Rendering Updates**: Modify renderer.js to handle dropdown updates
5. **Testing**: Include the validation suite for immediate verification

Maintain all existing functionality while adding the multi-user dropdown interface. Follow StackMap's vanilla JavaScript patterns and accessibility requirements throughout.