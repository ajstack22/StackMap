/**
 * Test file for ADHD-friendly undo system
 * Tests the 30-second golden window and command pattern implementation
 */

(function() {
    'use strict';
    
    console.log('=== Starting Undo System Tests ===');
    
    let passedTests = 0;
    let failedTests = 0;
    
    function assert(condition, testName) {
        if (condition) {
            console.log('✅ PASS:', testName);
            passedTests++;
        } else {
            console.error('❌ FAIL:', testName);
            failedTests++;
        }
    }
    
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async function runTests() {
        // Test 1: UndoManager initialization
        assert(window.UndoManager !== undefined, 'UndoManager should be available');
        assert(window.UndoUI !== undefined, 'UndoUI should be available');
        assert(window.TaskCommands !== undefined, 'TaskCommands should be available');
        
        // Initialize undo system
        window.UndoManager.init();
        window.UndoUI.init();
        
        // Test 2: Command creation
        const addCommand = window.TaskCommands.createAddCommand({
            text: 'Test task',
            id: 'test_' + Date.now()
        });
        assert(addCommand.type === 'add-task', 'Add command should have correct type');
        assert(addCommand.description.includes('Test task'), 'Add command should have description');
        
        // Test 3: Execute command
        let executed = false;
        try {
            await window.UndoManager.execute(addCommand);
            executed = true;
        } catch (e) {
            console.error('Execute failed:', e);
        }
        assert(executed, 'Command should execute successfully');
        
        // Test 4: Check undo availability
        assert(window.UndoManager.canUndo(), 'Should be able to undo after executing command');
        assert(!window.UndoManager.canRedo(), 'Should not be able to redo before undoing');
        
        // Test 5: Check golden window
        const goldenWindowCommands = window.UndoManager.getGoldenWindowCommands();
        assert(goldenWindowCommands.length > 0, 'Should have commands in golden window');
        assert(goldenWindowCommands[0].type === 'add-task', 'Golden window should contain add command');
        
        // Test 6: Undo operation
        let undone = false;
        try {
            await window.UndoManager.undo();
            undone = true;
        } catch (e) {
            console.error('Undo failed:', e);
        }
        assert(undone, 'Should be able to undo command');
        assert(!window.UndoManager.canUndo(), 'Should not be able to undo after undoing');
        assert(window.UndoManager.canRedo(), 'Should be able to redo after undoing');
        
        // Test 7: Redo operation
        let redone = false;
        try {
            await window.UndoManager.redo();
            redone = true;
        } catch (e) {
            console.error('Redo failed:', e);
        }
        assert(redone, 'Should be able to redo command');
        
        // Test 8: Multiple commands
        const commands = [];
        for (let i = 0; i < 5; i++) {
            const cmd = window.TaskCommands.createAddCommand({
                text: 'Task ' + i,
                id: 'test_' + Date.now() + '_' + i
            });
            commands.push(cmd);
            await window.UndoManager.execute(cmd);
            await wait(100); // Small delay between commands
        }
        
        assert(window.UndoManager.history.length >= 6, 'History should contain all commands');
        
        // Test 9: Undo multiple
        let undoCount = 0;
        while (window.UndoManager.canUndo() && undoCount < 3) {
            await window.UndoManager.undo();
            undoCount++;
        }
        assert(undoCount === 3, 'Should be able to undo 3 commands');
        
        // Test 10: Storage persistence
        window.UndoManager.saveToStorage();
        const stored = sessionStorage.getItem('stackmap_undo_history');
        assert(stored !== null, 'Undo history should be saved to storage');
        
        // Test 11: Golden window timeout (simulate)
        console.log('Testing golden window timeout (this will take a moment)...');
        const oldCommand = window.TaskCommands.createAddCommand({
            text: 'Old task',
            id: 'old_test'
        });
        
        // Manually set timestamp to be outside golden window
        oldCommand.timestamp = Date.now() - 31000; // 31 seconds ago
        window.UndoManager.history.push(oldCommand);
        window.UndoManager.currentIndex++;
        
        const goldenCommands = window.UndoManager.getGoldenWindowCommands();
        const hasOldCommand = goldenCommands.some(cmd => cmd.data.id === 'old_test');
        assert(!hasOldCommand, 'Old commands should not be in golden window');
        
        // Test 12: Batchable commands
        const edit1 = window.TaskCommands.createEditCommand('task1', 'Hello', 'Hello ');
        const edit2 = window.TaskCommands.createEditCommand('task1', 'Hello ', 'Hello World');
        
        assert(edit1.batchable === true, 'Edit commands should be batchable');
        
        await window.UndoManager.execute(edit1);
        await window.UndoManager.execute(edit2);
        
        // Since they're batchable and for the same task, they might be combined
        // This depends on the batch window implementation
        
        // Test 13: Error handling
        const badCommand = {
            type: 'bad-command',
            execute: async function() {
                throw new Error('Test error');
            },
            undo: async function() {
                throw new Error('Test undo error');
            }
        };
        
        let errorCaught = false;
        try {
            await window.UndoManager.execute(badCommand);
        } catch (e) {
            errorCaught = true;
        }
        assert(errorCaught, 'Should catch and handle command errors');
        
        // Test 14: UI Toast display
        const toastCommand = window.TaskCommands.createAddCommand({
            text: 'Toast test task',
            id: 'toast_test'
        });
        
        await window.UndoManager.execute(toastCommand);
        
        // Check if toast was created
        await wait(100); // Wait for UI update
        const toastElement = document.querySelector('.undo-toast');
        assert(toastElement !== null, 'Undo toast should be displayed');
        
        if (toastElement) {
            const hasGoldenClass = toastElement.classList.contains('golden-window');
            assert(hasGoldenClass, 'Toast should have golden window class');
            
            const undoButton = toastElement.querySelector('.undo-button');
            assert(undoButton !== null, 'Toast should have undo button');
        }
        
        // Test 15: History panel
        const historyButton = document.getElementById('undo-history-button');
        assert(historyButton !== null, 'History button should be added to UI');
        
        // Clean up
        console.log('\n=== Cleaning up test data ===');
        
        // Clear undo history
        window.UndoManager.clear();
        assert(window.UndoManager.history.length === 0, 'History should be cleared');
        
        // Remove UI elements
        const container = document.getElementById('undo-container');
        if (container) {
            container.remove();
        }
        
        // Summary
        console.log('\n=== Test Summary ===');
        console.log('Passed:', passedTests);
        console.log('Failed:', failedTests);
        console.log('Total:', passedTests + failedTests);
        
        if (failedTests === 0) {
            console.log('✅ All tests passed!');
        } else {
            console.error('❌ Some tests failed');
        }
        
        return failedTests === 0;
    }
    
    // Run tests when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runTests);
    } else {
        runTests();
    }
})();