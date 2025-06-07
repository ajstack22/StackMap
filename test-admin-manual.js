// Manual test for admin tools
console.log('=== Manual Admin Tools Test ===');
console.log('1. Enter edit mode by clicking the settings button (right FAB)');
console.log('2. Answer the validation question or press Enter with empty field');
console.log('3. You should see the admin tools:');
console.log('   - Add Activity');
console.log('   - Export Data');
console.log('   - Import Data');
console.log('   - Add User');
console.log('\nTo test each tool:');
console.log('- Add Activity: Should show a modal to create new activity card');
console.log('- Export Data: Should download a JSON file with all data');
console.log('- Import Data: Should open file picker to import JSON file');
console.log('- Add User: Should show dialog to create new user');

// Add debugging helper
window.testAdminTools = {
    testExport: () => {
        console.log('Testing export...');
        if (window.appInstance && window.appInstance.exportData) {
            window.appInstance.exportData();
            console.log('Export triggered - check if download started');
        } else {
            console.error('Export method not available');
        }
    },
    
    testAddCard: () => {
        console.log('Testing add card...');
        if (window.appInstance && window.appInstance.showNewCardForm) {
            window.appInstance.showNewCardForm();
            console.log('Add card triggered - check if modal appeared');
        } else {
            console.error('Add card method not available');
        }
    },
    
    testImport: () => {
        console.log('Testing import...');
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.click();
            console.log('Import file picker triggered');
        } else {
            console.error('File input not found');
        }
    },
    
    testAddUser: () => {
        console.log('Testing add user...');
        if (window.appInstance && window.appInstance.addNewUser) {
            window.appInstance.addNewUser();
            console.log('Add user triggered');
        } else {
            console.error('Add user method not available');
        }
    }
};

console.log('\nYou can also test manually with:');
console.log('- testAdminTools.testExport()');
console.log('- testAdminTools.testAddCard()');
console.log('- testAdminTools.testImport()');
console.log('- testAdminTools.testAddUser()');
EOF < /dev/null