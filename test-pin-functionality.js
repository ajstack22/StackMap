// Test pin functionality
console.log('Testing pin functionality...');

// Check if appInstance exists
if (!window.appInstance) {
    console.error('❌ appInstance not found!');
} else {
    console.log('✅ appInstance exists');
    
    // Check if toggleKeep function exists
    if (typeof window.appInstance.toggleKeep === 'function') {
        console.log('✅ toggleKeep function exists');
        
        // Get current user and activities
        const user = window.appInstance.appState.getCurrentUser();
        const activities = user.activities || [];
        
        console.log(`Current user: ${user.name}`);
        console.log(`Number of activities: ${activities.length}`);
        
        if (activities.length > 0) {
            // Test toggling the first activity
            const firstActivity = activities[0];
            const wasKept = firstActivity.keep || false;
            
            console.log(`First activity: "${firstActivity.title}"`);
            console.log(`Current keep status: ${wasKept}`);
            
            // Try to toggle
            try {
                window.appInstance.toggleKeep(0);
                console.log(`✅ toggleKeep(0) called successfully`);
                
                // Check if it changed
                const isNowKept = activities[0].keep || false;
                if (wasKept !== isNowKept) {
                    console.log(`✅ Keep status changed from ${wasKept} to ${isNowKept}`);
                } else {
                    console.log(`❌ Keep status did not change`);
                }
            } catch (error) {
                console.error('❌ Error calling toggleKeep:', error);
            }
        } else {
            console.log('⚠️ No activities to test with');
        }
    } else {
        console.error('❌ toggleKeep function not found!');
    }
}

// Also test direct button click
setTimeout(() => {
    const keepButtons = document.querySelectorAll('.btn--keep');
    console.log(`\nFound ${keepButtons.length} keep buttons`);
    
    if (keepButtons.length > 0) {
        const firstButton = keepButtons[0];
        console.log('First keep button:', firstButton);
        console.log('Button onclick:', firstButton.onclick);
        
        // Check if button is clickable
        const styles = window.getComputedStyle(firstButton);
        console.log('Button pointer-events:', styles.pointerEvents);
        console.log('Button z-index:', styles.zIndex);
        console.log('Button position:', styles.position);
        
        // Check parent card
        const card = firstButton.closest('.card');
        if (card) {
            const cardStyles = window.getComputedStyle(card);
            console.log('Card pointer-events:', cardStyles.pointerEvents);
        }
    }
}, 1000);