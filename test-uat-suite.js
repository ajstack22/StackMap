/**
 * Comprehensive User Acceptance Testing Suite for StackMap
 * Run from console with: runUAT()
 */

class UATSuite {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
        this.currentTest = null;
    }

    // Utility methods
    log(message, type = 'info') {
        const styles = {
            info: 'color: #2196F3',
            success: 'color: #4CAF50; font-weight: bold',
            error: 'color: #f44336; font-weight: bold',
            warning: 'color: #ff9800',
            header: 'color: #9C27B0; font-size: 16px; font-weight: bold'
        };
        console.log(`%c${message}`, styles[type] || '');
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    startTest(name, category) {
        this.currentTest = {
            name,
            category,
            status: 'running',
            assertions: [],
            startTime: Date.now()
        };
        this.log(`\nTesting: ${name}`, 'info');
    }

    assert(condition, description, isManual = false) {
        const result = {
            passed: condition,
            description,
            isManual
        };
        
        if (this.currentTest) {
            this.currentTest.assertions.push(result);
        }
        
        if (condition) {
            this.log(`  ✓ ${description}`, 'success');
        } else {
            this.log(`  ✗ ${description}`, 'error');
        }
        
        return condition;
    }

    manualTest(description) {
        this.log(`  ⚠ MANUAL CHECK: ${description}`, 'warning');
        this.currentTest.assertions.push({
            passed: null,
            description: `MANUAL: ${description}`,
            isManual: true
        });
    }

    endTest() {
        if (!this.currentTest) return;
        
        const failed = this.currentTest.assertions.filter(a => a.passed === false).length;
        const manual = this.currentTest.assertions.filter(a => a.isManual).length;
        
        this.currentTest.duration = Date.now() - this.currentTest.startTime;
        this.currentTest.status = failed > 0 ? 'failed' : (manual > 0 ? 'needs-review' : 'passed');
        
        if (failed === 0 && manual === 0) {
            this.results.passed++;
        } else if (failed > 0) {
            this.results.failed++;
        } else {
            this.results.warnings++;
        }
        
        this.results.tests.push(this.currentTest);
        this.currentTest = null;
    }

    // Test Categories
    async testHeaderSystem() {
        this.log('\n=== HEADER SYSTEM TESTS ===', 'header');
        
        // Test 1: Unified App Header
        this.startTest('Unified App Header', 'Header System');
        const appHeader = document.querySelector('.app-header');
        const headerWrapper = document.querySelector('.header-wrapper');
        this.assert(!!appHeader, 'App header element exists');
        this.assert(!!headerWrapper, 'Header wrapper element exists');
        
        if (headerWrapper) {
            const wrapperStyles = window.getComputedStyle(headerWrapper);
            this.assert(wrapperStyles.position === 'fixed', 'Header wrapper has fixed positioning');
            this.assert(wrapperStyles.display !== 'none', 'Header wrapper is visible');
            this.assert(wrapperStyles.top === '0px', 'Header wrapper is at top of viewport');
            
            // Check header contents
            const logo = appHeader.querySelector('.stackmap-logo');
            const title = appHeader.querySelector('.title');
            const subtitle = appHeader.querySelector('.subtitle');
            this.assert(!!logo, 'StackMap logo exists in header');
            this.assert(!!title && title.textContent === 'StackMap', 'Title shows "StackMap"');
            this.assert(!!subtitle, 'Subtitle exists in header');
        }
        this.endTest();

        // Test 2: Header Always Fixed (no scroll behavior)
        this.startTest('Header Fixed Positioning', 'Header System');
        if (headerWrapper) {
            // Test at different scroll positions
            const originalScroll = window.scrollY;
            window.scrollTo(0, 0);
            await this.wait(100);
            
            let wrapperStyles = window.getComputedStyle(headerWrapper);
            this.assert(wrapperStyles.position === 'fixed', 'Header wrapper fixed at top of page');
            
            window.scrollTo(0, 200);
            await this.wait(100);
            
            wrapperStyles = window.getComputedStyle(headerWrapper);
            this.assert(wrapperStyles.position === 'fixed', 'Header wrapper remains fixed when scrolled');
            this.assert(wrapperStyles.top === '0px', 'Header wrapper stays at top when scrolled');
            
            window.scrollTo(0, originalScroll);
        }
        this.endTest();

        // Test 3: Body Padding for Fixed Header
        this.startTest('Body Padding for Fixed Header', 'Header System');
        const bodyPaddingTop = parseInt(window.getComputedStyle(document.body).paddingTop);
        this.assert(bodyPaddingTop >= 80, `Body has adequate padding (${bodyPaddingTop}px) for fixed header`);
        this.endTest();

        // Test 4: No Duplicate Headers
        this.startTest('No Duplicate Headers', 'Header System');
        const oldStaticHeader = document.querySelector('.static-header');
        const oldFixedHeader = document.querySelector('.fixed-header');
        this.assert(!oldStaticHeader, 'Old static header removed');
        this.assert(!oldFixedHeader, 'Old fixed header removed');
        this.assert(document.querySelectorAll('header').length === 1, 'Only one header element exists');
        this.endTest();
    }

    async testDrawerSystem() {
        this.log('\n=== DRAWER SYSTEM TESTS ===', 'header');
        
        // Test 1: Drawer Elements
        this.startTest('Drawer DOM Elements', 'Drawer System');
        const drawerHandle = document.getElementById('drawerHandle');
        const drawerExtension = document.getElementById('drawerExtension');
        const backdrop = document.querySelector('.drawer-backdrop');
        
        this.assert(!!drawerHandle, 'Drawer handle element exists');
        this.assert(!!drawerExtension, 'Drawer extension element exists');
        this.assert(!!backdrop, 'Backdrop element exists');
        
        // Check drawer handle attributes
        this.assert(drawerHandle.getAttribute('role') === 'button', 'Drawer handle has button role');
        this.assert(drawerHandle.getAttribute('tabindex') === '0', 'Drawer handle is keyboard accessible');
        this.endTest();

        // Test 2: Open/Close Functionality
        this.startTest('Drawer Open/Close', 'Drawer System');
        
        // Open drawer
        drawerHandle.click();
        await this.wait(300);
        
        this.assert(drawerExtension.classList.contains('open'), 'Drawer extension opens on handle click');
        this.assert(backdrop.classList.contains('visible'), 'Backdrop becomes visible when drawer opens');
        this.assert(drawerHandle.getAttribute('aria-expanded') === 'true', 'aria-expanded updates to true');
        
        // Close via handle click again
        drawerHandle.click();
        await this.wait(300);
        
        this.assert(!drawerExtension.classList.contains('open'), 'Drawer closes via handle click');
        this.assert(!backdrop.classList.contains('visible'), 'Backdrop hides when drawer closes');
        this.assert(drawerHandle.getAttribute('aria-expanded') === 'false', 'aria-expanded updates to false');
        this.endTest();

        // Test 3: Drawer Contents
        this.startTest('Drawer Contents', 'Drawer System');
        const userSection = document.getElementById('userSection');
        const daySelect = document.getElementById('drawerDaySelect');
        
        this.assert(!!userSection, 'User section exists in drawer');
        this.assert(!!daySelect || document.querySelector('[data-value="today"]'), 'Day selector exists in drawer');
        
        // Open drawer to test contents
        drawerHandle.click();
        await this.wait(300);
        
        this.manualTest('Verify user dropdown/button appears correctly');
        this.manualTest('Verify day dropdown shows Today/Tomorrow options');
        
        doneBtn.click();
        await this.wait(300);
        this.endTest();

        // Test 4: Backdrop Behavior
        this.startTest('Backdrop Click to Close', 'Drawer System');
        drawerHandle.click();
        await this.wait(300);
        
        backdrop.click();
        await this.wait(300);
        
        this.assert(!drawerExtension.classList.contains('open'), 'Drawer closes on backdrop click');
        this.manualTest('Verify drawer can be closed by clicking outside (backdrop)');
        this.endTest();

        // Test 5: Keyboard Support
        this.startTest('Drawer Keyboard Support', 'Drawer System');
        this.manualTest('Press Enter or Space on drawer handle to open');
        this.manualTest('Press Escape key to close drawer when open');
        this.endTest();
    }

    async testUserManagement() {
        this.log('\n=== USER MANAGEMENT TESTS ===', 'header');
        
        // Test 1: Get User Data
        this.startTest('User Data Structure', 'User Management');
        const appInstance = window.appInstance;
        this.assert(!!appInstance, 'App instance exists');
        
        const allUsers = appInstance?.appState?.getAllUsers() || [];
        const currentUser = appInstance?.appState?.getCurrentUser();
        this.assert(allUsers.length > 0, `Found ${allUsers.length} user(s)`);
        this.assert(!!currentUser, 'Current user exists');
        this.assert(!!currentUser.id, 'Current user has ID');
        this.assert(!!currentUser.name, 'Current user has name');
        this.endTest();

        // Test 2: Drawer User Section
        this.startTest('User Section in Drawer', 'User Management');
        const drawerHandle = document.getElementById('drawerHandle');
        
        // Open drawer
        drawerHandle.click();
        await this.wait(300);
        
        const userSection = document.getElementById('userSection');
        this.assert(!!userSection, 'User section exists in drawer');
        
        if (allUsers.length > 1) {
            // Multiple users - should show dropdown button
            const userSelectBtn = document.getElementById('drawerUserSelect');
            this.assert(!!userSelectBtn, 'User select button exists for multiple users');
            this.assert(userSelectBtn.textContent.includes(currentUser.name), 'Shows current user name');
            
            // Test custom dropdown
            userSelectBtn.click();
            await this.wait(100);
            const dropdownModal = document.getElementById('dropdownModal');
            this.assert(!dropdownModal.classList.contains('hidden'), 'Custom dropdown modal opens');
            
            // Close modal
            const closeBtn = dropdownModal.querySelector('.dropdown-modal-close');
            closeBtn.click();
            await this.wait(100);
        } else {
            // Single user - check for add user button in edit mode
            if (appInstance.grownupMode) {
                const addUserBtn = document.getElementById('drawerAddUser');
                this.assert(!!addUserBtn, 'Add User button exists for single user in edit mode');
                this.manualTest('Click Add User button and verify modal opens');
            } else {
                this.assert(userSection.querySelector('.disabled'), 'Disabled user display for single user in non-edit mode');
            }
        }
        
        // Close drawer
        document.getElementById('drawerDone').click();
        await this.wait(300);
        this.endTest();

        // Test 3: Edit Mode Add User Button
        this.startTest('Add User Button in Edit Mode', 'User Management');
        if (allUsers.length === 1) {
            // Enter edit mode
            const grownupBtn = document.getElementById('grownupBtn');
            this.assert(!!grownupBtn, 'Grownup mode button exists');
            
            if (!appInstance.grownupMode) {
                this.manualTest('Click edit button and answer validation to enter edit mode');
                this.manualTest('Open drawer and verify Add User button appears');
            } else {
                // Already in edit mode
                drawerHandle.click();
                await this.wait(300);
                
                const addUserBtn = document.getElementById('drawerAddUser');
                this.assert(!!addUserBtn, 'Add User button visible in edit mode');
                
                drawerHandle.click();
                await this.wait(300);
            }
        } else {
            this.log('  ℹ Add User button test skipped (multiple users)', 'info');
        }
        this.endTest();

        // Test 4: User Switching
        this.startTest('User Switching', 'User Management');
        if (allUsers.length > 1) {
            this.manualTest('Open drawer and click user dropdown');
            this.manualTest('Select different user from custom modal');
            this.manualTest('Verify title/subtitle updates for new user');
            this.manualTest('Verify activities change to new user\'s activities');
        } else {
            this.log('  ℹ User switching test skipped (single user)', 'info');
        }
        this.endTest();

        // Test 5: User Data Persistence
        this.startTest('User Data Persistence', 'User Management');
        const savedData = localStorage.getItem('stackMapData');
        this.assert(!!savedData, 'Data saved to localStorage');
        
        try {
            const parsed = JSON.parse(savedData);
            this.assert(!!parsed.users, 'Users data exists in saved data');
            this.assert(!!parsed.users.profiles, 'User profiles exist');
            this.assert(!!parsed.users.currentUserId, 'Current user ID saved');
            
            const userCount = Object.keys(parsed.users.profiles).length;
            this.assert(userCount === allUsers.length, `Saved user count (${userCount}) matches loaded users`);
        } catch (e) {
            this.assert(false, 'Failed to parse saved data: ' + e.message);
        }
        this.endTest();
    }

    async testDaySelection() {
        this.log('\n=== DAY SELECTION TESTS ===', 'header');
        
        // Test 1: Day Selector in Drawer
        this.startTest('Day Selector Elements', 'Day Selection');
        const appInstance = window.appInstance;
        const currentDay = appInstance?.appState?.getCurrentDay();
        this.assert(currentDay === 'today' || currentDay === 'tomorrow', `Current day is valid: ${currentDay}`);
        
        // Open drawer to test day selector
        const drawerHandle = document.getElementById('drawerHandle');
        drawerHandle.click();
        await this.wait(300);
        
        const daySelect = document.getElementById('drawerDaySelect');
        const daySelectBtn = document.querySelector('[data-value="today"], [data-value="tomorrow"]');
        
        this.assert(!!daySelect || !!daySelectBtn, 'Day selector exists in drawer');
        
        if (daySelectBtn) {
            // Custom dropdown button
            this.assert(daySelectBtn.textContent.includes('Today') || daySelectBtn.textContent.includes('Tomorrow'), 
                'Day button shows current day');
            
            // Test custom dropdown
            daySelectBtn.click();
            await this.wait(100);
            const dropdownModal = document.getElementById('dropdownModal');
            this.assert(!dropdownModal.classList.contains('hidden'), 'Day dropdown modal opens');
            
            // Close modal
            const closeBtn = dropdownModal.querySelector('.dropdown-modal-close');
            closeBtn.click();
            await this.wait(100);
        }
        
        // Close drawer
        document.getElementById('drawerDone').click();
        await this.wait(300);
        this.endTest();

        // Test 2: Day Switching Functionality
        this.startTest('Day Switching', 'Day Selection');
        const originalDay = appInstance.appState.getCurrentDay();
        this.manualTest('Open drawer and click day dropdown');
        this.manualTest('Select different day (Today/Tomorrow)');
        this.manualTest('Verify activities change to show selected day\'s tasks');
        this.manualTest('Verify body class changes (viewing-today or viewing-tomorrow)');
        this.endTest();

        // Test 3: Day State Persistence
        this.startTest('Day Selection Persistence', 'Day Selection');
        const savedData = localStorage.getItem('stackMapData');
        try {
            const parsed = JSON.parse(savedData);
            const user = parsed.users.profiles[parsed.users.currentUserId];
            this.assert(!!user.activities, 'Today activities exist');
            this.assert(!!user.tomorrowActivities, 'Tomorrow activities exist');
            this.assert(parsed.ui?.currentDay === 'today' || parsed.ui?.currentDay === 'tomorrow', 
                'Current day saved in UI state');
        } catch (e) {
            this.assert(false, 'Failed to parse saved data: ' + e.message);
        }
        this.endTest();
    }

    async testTitleSubtitle() {
        this.log('\n=== TITLE/SUBTITLE TESTS ===', 'header');
        
        // Test 1: Title/Subtitle Display
        this.startTest('Title/Subtitle Display', 'Title/Subtitle');
        const mainTitle = document.getElementById('mainTitle');
        const mainSubtitle = document.getElementById('subtitle');
        
        this.assert(!!mainTitle, 'Main title element exists');
        this.assert(!!mainSubtitle, 'Main subtitle element exists');
        
        // Check default values
        this.assert(mainTitle.textContent === 'StackMap', 'Main title shows "StackMap"');
        
        const appInstance = window.appInstance;
        const currentUser = appInstance?.appState?.getCurrentUser();
        if (currentUser?.customTitle) {
            this.assert(mainTitle.textContent === currentUser.customTitle, 'Shows custom title');
        }
        if (currentUser?.customSubtitle) {
            this.assert(mainSubtitle.textContent === currentUser.customSubtitle, 'Shows custom subtitle');
        }
        this.endTest();

        // Test 2: Title/Subtitle Edit Mode
        this.startTest('Title/Subtitle Editing', 'Title/Subtitle');
        if (appInstance.grownupMode) {
            // Test inline editing
            this.assert(mainTitle.getAttribute('tabindex') === '0', 'Title is focusable');
            this.assert(mainSubtitle.getAttribute('tabindex') === '0', 'Subtitle is focusable');
            
            this.manualTest('Click on title and verify it becomes editable');
            this.manualTest('Edit title text and press Enter or blur');
            this.manualTest('Verify title saves and updates in both headers');
            this.manualTest('Repeat for subtitle');
        } else {
            this.manualTest('Enter edit mode first');
            this.manualTest('Click on title/subtitle to edit inline');
        }
        this.endTest();

        // Test 3: Per-User Customization
        this.startTest('Per-User Title/Subtitle', 'Title/Subtitle');
        const allUsers = appInstance?.appState?.getAllUsers() || [];
        if (allUsers.length > 1) {
            this.manualTest('Switch to different user via drawer');
            this.manualTest('Verify title/subtitle changes to that user\'s custom values');
            this.manualTest('Edit title for one user and switch to another');
            this.manualTest('Verify each user maintains their own title/subtitle');
        } else {
            this.log('  ℹ Per-user test skipped (single user)', 'info');
        }
        this.endTest();

        // Test 4: Title/Subtitle Persistence
        this.startTest('Title/Subtitle Persistence', 'Title/Subtitle');
        const savedData = localStorage.getItem('stackMapData');
        try {
            const parsed = JSON.parse(savedData);
            const user = parsed.users.profiles[parsed.users.currentUserId];
            this.assert(!!user, 'Current user data exists');
            
            if (user.customTitle || user.customSubtitle) {
                this.assert(user.customTitle === mainTitle.textContent, 'Saved title matches displayed');
                this.assert(user.customSubtitle === mainSubtitle.textContent, 'Saved subtitle matches displayed');
            }
        } catch (e) {
            this.assert(false, 'Failed to check persistence: ' + e.message);
        }
        this.endTest();
    }

    async testEditMode() {
        this.log('\n=== EDIT MODE TESTS ===', 'header');
        
        // Test 1: Grownup Mode Button
        this.startTest('Grownup Mode Toggle', 'Edit Mode');
        const grownupBtn = document.getElementById('grownupBtn');
        const appInstance = window.appInstance;
        
        this.assert(!!grownupBtn, 'Grownup mode button exists');
        
        const icon = grownupBtn.querySelector('.material-icons');
        if (appInstance.grownupMode) {
            this.assert(icon.textContent === 'face', 'Shows face icon in edit mode');
            this.assert(grownupBtn.title === 'User Mode', 'Button title is "User Mode"');
        } else {
            this.assert(icon.textContent === 'edit', 'Shows edit icon in user mode');
            this.assert(grownupBtn.title === 'Edit Mode', 'Button title is "Edit Mode"');
        }
        
        // Test validation modal
        if (!appInstance.grownupMode) {
            grownupBtn.click();
            await this.wait(100);
            
            const validationModal = document.getElementById('validationModal');
            this.assert(!validationModal.classList.contains('hidden'), 'Validation modal appears');
            
            // Cancel validation
            const cancelBtn = validationModal.querySelector('.btn--secondary');
            cancelBtn.click();
            await this.wait(100);
            
            this.manualTest('Click edit button and answer validation question correctly');
            this.manualTest('Verify body gets "grownup-mode" class when in edit mode');
        }
        this.endTest();

        // Test 2: UI Changes in Edit Mode
        this.startTest('Edit Mode UI Changes', 'Edit Mode');
        this.assert(document.body.classList.contains('grownup-mode') === appInstance.grownupMode, 
            'Body class matches edit mode state');
        
        if (appInstance.grownupMode) {
            // Test preferences button icon change
            const prefBtn = document.getElementById('preferencesBtn');
            const prefIcon = prefBtn?.querySelector('.material-icons');
            this.assert(prefIcon?.textContent === 'settings', 'Preferences button shows settings in edit mode');
            
            this.manualTest('Verify titles become editable (click to edit)');
            this.manualTest('Verify activity cards show edit controls');
            this.manualTest('Verify "Add Activity" buttons appear');
        } else {
            this.manualTest('Enter edit mode to test UI changes');
        }
        this.endTest();

        // Test 3: Drawer Add User Button
        this.startTest('Add User Button Visibility', 'Edit Mode');
        const allUsers = appInstance?.appState?.getAllUsers() || [];
        
        if (allUsers.length === 1 && appInstance.grownupMode) {
            // Open drawer
            const drawerHandle = document.getElementById('drawerHandle');
            drawerHandle.click();
            await this.wait(300);
            
            const addUserBtn = document.getElementById('drawerAddUser');
            this.assert(!!addUserBtn, 'Add User button exists in drawer for single user');
            this.assert(addUserBtn.textContent.includes('Add User'), 'Button shows "Add User" text');
            
            // Close drawer
            drawerHandle.click();
            await this.wait(300);
        } else if (allUsers.length === 1) {
            this.manualTest('Enter edit mode and open drawer');
            this.manualTest('Verify "Add User" button appears in user section');
        } else {
            this.log('  ℹ Add User button test skipped (multiple users)', 'info');
        }
        this.endTest();

        // Test 4: Edit Mode Persistence
        this.startTest('Edit Mode State', 'Edit Mode');
        this.assert(appInstance.grownupMode === appInstance.appState.ui.editMode, 
            'Edit mode state synchronized');
        this.manualTest('Toggle edit mode and refresh page');
        this.manualTest('Verify app returns to user mode after refresh (edit mode not persisted)');
        this.endTest();
    }

    async testMobileResponsiveness() {
        this.log('\n=== MOBILE RESPONSIVENESS TESTS ===', 'header');
        
        // Test 1: Mobile Detection
        this.startTest('Mobile View Detection', 'Mobile');
        const isMobile = window.innerWidth <= 768;
        this.log(`  ℹ Current viewport: ${window.innerWidth}px (${isMobile ? 'Mobile' : 'Desktop'})`, 'info');
        this.endTest();

        // Test 2: Mobile Header
        this.startTest('Mobile Header Configuration', 'Mobile');
        if (isMobile) {
            const staticHeader = document.querySelector('.static-header');
            const fixedHeader = document.querySelector('.fixed-header');
            
            const staticStyles = window.getComputedStyle(staticHeader);
            const fixedStyles = window.getComputedStyle(fixedHeader);
            
            this.assert(staticStyles.position === 'fixed', 'Static header is fixed on mobile');
            this.assert(fixedStyles.display === 'none', 'Fixed header hidden on mobile');
            this.assert(parseFloat(window.getComputedStyle(document.body).paddingTop) > 100, 
                'Body has padding for fixed header');
        } else {
            this.log('  ℹ Mobile header test skipped (desktop view)', 'info');
        }
        this.endTest();

        // Test 3: Touch Targets
        this.startTest('Touch Target Sizes', 'Mobile');
        const criticalButtons = [
            { el: document.getElementById('grownupBtn'), name: 'Edit button' },
            { el: document.getElementById('preferencesBtn'), name: 'Preferences button' },
            { el: document.getElementById('drawerHandle'), name: 'Drawer handle' },
            { el: document.getElementById('drawerDone'), name: 'Drawer done button' }
        ];
        
        const minSize = 44; // Apple's recommended minimum
        criticalButtons.forEach(({ el, name }) => {
            if (el) {
                const rect = el.getBoundingClientRect();
                this.assert(rect.width >= minSize && rect.height >= minSize, 
                    `${name} meets touch target (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
            }
        });
        this.endTest();

        // Test 4: Mobile Drawer
        this.startTest('Mobile Drawer Behavior', 'Mobile');
        if (isMobile) {
            const drawerExtension = document.getElementById('drawerExtension');
            this.assert(!!drawerExtension, 'Drawer extension exists');
            
            this.manualTest('Open drawer and verify it slides down from header');
            this.manualTest('Verify dropdowns stack vertically on mobile');
            this.manualTest('Test drawer can be closed by tapping Done or backdrop');
        } else {
            this.log('  ℹ Mobile drawer test skipped (desktop view)', 'info');
        }
        this.endTest();

        // Test 5: Mobile Layout
        this.startTest('Mobile Layout and Scrolling', 'Mobile');
        if (isMobile) {
            const mainContainer = document.querySelector('.main-container');
            const containerStyles = window.getComputedStyle(mainContainer);
            
            this.assert(containerStyles.gridTemplateColumns.includes('1fr'), 
                'Cards stack in single column on mobile');
            this.assert(document.documentElement.scrollWidth <= window.innerWidth, 
                'No horizontal scroll on mobile');
            
            this.manualTest('Scroll vertically and verify header stays fixed');
            this.manualTest('Verify floating buttons stay accessible while scrolling');
        } else {
            this.log('  ℹ Mobile layout test skipped (desktop view)', 'info');
        }
        this.endTest();
    }

    async testIntegrationPoints() {
        this.log('\n=== INTEGRATION TESTS ===', 'header');
        
        // Test 1: State Management
        this.startTest('State Management Integration', 'Integration');
        const appInstance = window.appInstance;
        this.assert(!!appInstance, 'App instance exists');
        this.assert(!!appInstance.appState, 'App state exists');
        
        const state = appInstance.appState;
        this.assert(!!state.users, 'Users object in state');
        this.assert(!!state.users.currentUserId, 'Current user ID in state');
        this.assert(!!state.ui, 'UI state exists');
        this.assert(state.ui.currentDay === 'today' || state.ui.currentDay === 'tomorrow', 
            'Valid current day in UI state');
        this.endTest();

        // Test 2: Local Storage
        this.startTest('Local Storage Integration', 'Integration');
        const savedData = localStorage.getItem('stackMapData');
        this.assert(!!savedData, 'Data persists to localStorage');
        
        try {
            const parsed = JSON.parse(savedData);
            this.assert(!!parsed, 'Saved data is valid JSON');
            this.assert(parsed.users.currentUserId === state.users.currentUserId, 
                'Saved current user matches app state');
            this.assert(!!parsed.version, 'Data version exists');
        } catch (e) {
            this.assert(false, 'Failed to parse saved data: ' + e.message);
        }
        this.endTest();

        // Test 3: Event System
        this.startTest('Event System Integration', 'Integration');
        this.assert(typeof appInstance.appState.onStateChange === 'function', 'State change handler exists');
        
        this.manualTest('Add/edit/delete an activity and verify it auto-saves');
        this.manualTest('Switch users and verify state updates correctly');
        this.manualTest('Change day and verify activities update');
        this.endTest();

        // Test 4: Component Communication
        this.startTest('Component Communication', 'Integration');
        this.manualTest('Change user in drawer and verify:');
        this.manualTest('  - Title/subtitle updates');
        this.manualTest('  - Activities refresh');
        this.manualTest('  - Theme/colors update if different');
        this.manualTest('Edit title inline and verify both headers update');
        this.manualTest('Toggle edit mode and verify all UI elements update');
        this.endTest();

        // Test 5: Data Integrity
        this.startTest('Data Integrity', 'Integration');
        const currentUser = state.getCurrentUser();
        this.assert(!!currentUser, 'Can retrieve current user');
        this.assert(Array.isArray(currentUser.activities), 'User has activities array');
        this.assert(Array.isArray(currentUser.tomorrowActivities), 'User has tomorrow activities');
        
        if (currentUser.activities.length > 0) {
            const activity = currentUser.activities[0];
            this.assert(!!activity.title, 'Activity has title');
            this.assert(!!activity.icon, 'Activity has icon');
            this.assert(activity.hasOwnProperty('visible'), 'Activity has visible property');
            this.assert(activity.hasOwnProperty('completed'), 'Activity has completed property');
        }
        this.endTest();
    }

    // Generate comprehensive report
    generateReport() {
        this.log('\n\n=== UAT REPORT SUMMARY ===', 'header');
        
        const total = this.results.passed + this.results.failed + this.results.warnings;
        const passRate = total > 0 ? (this.results.passed / total * 100).toFixed(1) : 0;
        
        this.log(`\nTotal Tests: ${total}`);
        this.log(`Passed: ${this.results.passed}`, 'success');
        this.log(`Failed: ${this.results.failed}`, 'error');
        this.log(`Need Manual Review: ${this.results.warnings}`, 'warning');
        this.log(`Pass Rate: ${passRate}%\n`);
        
        // Detailed breakdown by category
        const categories = {};
        this.results.tests.forEach(test => {
            if (!categories[test.category]) {
                categories[test.category] = {
                    passed: 0,
                    failed: 0,
                    needsReview: 0,
                    tests: []
                };
            }
            
            categories[test.category].tests.push(test);
            if (test.status === 'passed') categories[test.category].passed++;
            else if (test.status === 'failed') categories[test.category].failed++;
            else categories[test.category].needsReview++;
        });
        
        this.log('=== BREAKDOWN BY CATEGORY ===', 'header');
        Object.entries(categories).forEach(([category, data]) => {
            this.log(`\n${category}:`);
            this.log(`  ✓ Passed: ${data.passed}`);
            this.log(`  ✗ Failed: ${data.failed}`);
            this.log(`  ⚠ Manual Review: ${data.needsReview}`);
        });
        
        // Failed tests detail
        const failedTests = this.results.tests.filter(t => t.status === 'failed');
        if (failedTests.length > 0) {
            this.log('\n=== FAILED TESTS DETAIL ===', 'header');
            failedTests.forEach(test => {
                this.log(`\n${test.name}:`, 'error');
                test.assertions.filter(a => a.passed === false).forEach(a => {
                    this.log(`  - ${a.description}`, 'error');
                });
            });
        }
        
        // Manual tests summary
        const manualTests = [];
        this.results.tests.forEach(test => {
            test.assertions.filter(a => a.isManual).forEach(a => {
                manualTests.push({
                    category: test.category,
                    test: test.name,
                    action: a.description
                });
            });
        });
        
        if (manualTests.length > 0) {
            this.log('\n=== MANUAL TESTING CHECKLIST ===', 'header');
            manualTests.forEach((mt, i) => {
                this.log(`${i + 1}. [${mt.category}] ${mt.action}`, 'warning');
            });
        }
        
        // Recommendations
        this.log('\n=== RECOMMENDATIONS ===', 'header');
        if (this.results.failed > 0) {
            this.log('⚠️  Address failed tests before deployment', 'error');
        }
        if (this.results.warnings > 5) {
            this.log('⚠️  Many manual tests required - consider automation', 'warning');
        }
        if (passRate < 80) {
            this.log('⚠️  Pass rate below 80% - critical issues present', 'error');
        } else if (passRate === 100) {
            this.log('✅ All automated tests passing!', 'success');
        }
        
        // Export results
        this.log('\n=== EXPORT ===', 'header');
        this.log('Results saved to window.uatResults');
        this.log('Run copy(JSON.stringify(window.uatResults, null, 2)) to copy report');
        
        return this.results;
    }

    // Main test runner
    async runAll() {
        this.log('Starting Comprehensive UAT Suite...', 'header');
        this.log('This will test all major components and features\n');
        
        try {
            await this.testHeaderSystem();
            await this.testDrawerSystem();
            await this.testUserManagement();
            await this.testDaySelection();
            await this.testTitleSubtitle();
            await this.testEditMode();
            await this.testMobileResponsiveness();
            await this.testIntegrationPoints();
        } catch (error) {
            this.log(`\nTest suite error: ${error.message}`, 'error');
            console.error(error);
        }
        
        const report = this.generateReport();
        window.uatResults = report;
        
        return report;
    }
}

// Global test runner function
window.runUAT = async function() {
    const suite = new UATSuite();
    return await suite.runAll();
};

// Individual category runners
window.runUAT.header = async function() {
    const suite = new UATSuite();
    await suite.testHeaderSystem();
    return suite.generateReport();
};

window.runUAT.drawer = async function() {
    const suite = new UATSuite();
    await suite.testDrawerSystem();
    return suite.generateReport();
};

window.runUAT.users = async function() {
    const suite = new UATSuite();
    await suite.testUserManagement();
    return suite.generateReport();
};

window.runUAT.mobile = async function() {
    const suite = new UATSuite();
    await suite.testMobileResponsiveness();
    return suite.generateReport();
};

// Auto-run if loaded directly
if (typeof module === 'undefined' && typeof window !== 'undefined') {
    console.log('%cUAT Suite Loaded!', 'color: #4CAF50; font-size: 20px; font-weight: bold');
    console.log('Run tests with: runUAT()');
    console.log('Run specific category: runUAT.header(), runUAT.drawer(), etc.');
    console.log('View results: window.uatResults');
}