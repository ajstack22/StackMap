# Debug Activities Console Script

Copy and paste this entire block into your browser console:

```javascript
// Check the current activities in your store
const state = useAppStore.getState();
const currentUser = state.currentUser;
const currentDay = state.currentDay;
const activities = state.users[currentUser]?.days?.[currentDay]?.activities || [];

console.log('=== ACTIVITY DEBUG INFO ===');
console.log('Current User:', currentUser);
console.log('Current Day:', currentDay);
console.log('Total activities:', activities.length);
console.log('\nAll activities:');
activities.forEach((a, i) => {
  console.log(`${i + 1}. "${a.text || a.name || a.title || 'NO TEXT'}"`, {
    id: a.id,
    deleted: a.deleted,
    hidden: a.hidden,
    completed: a.completed,
    pinned: a.pinned
  });
});

// Check for "Switch Users" specifically
const switchUser = activities.find(a => 
  (a.text || a.name || '').toLowerCase().includes('switch')
);
if (switchUser) {
  console.log('\n=== SWITCH USERS CARD FOUND ===');
  console.log('Full object:', switchUser);
}

// Check filtering
const visibleOnMain = activities.filter(a => !a.deleted);
console.log('\n=== FILTERING ===');
console.log('Non-deleted activities:', visibleOnMain.length);
console.log('Deleted activities:', activities.filter(a => a.deleted).length);

// Check for duplicates
const texts = activities.map(a => a.text || a.name || a.title || 'NO TEXT');
const duplicates = texts.filter((text, index) => texts.indexOf(text) !== index);
if (duplicates.length > 0) {
  console.log('\n=== DUPLICATES FOUND ===');
  console.log('Duplicate texts:', duplicates);
}

// Check edit mode
console.log('\n=== APP STATE ===');
console.log('Edit Mode:', state.isEditMode || false);
console.log('Last Modified:', new Date(state.lastModified).toLocaleString());
```

After running this, please also let me know:
1. Are you in edit mode or normal mode on the main screen?
2. Does refreshing the page change anything?
3. When did you first notice this issue?