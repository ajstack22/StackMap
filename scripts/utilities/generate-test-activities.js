#!/usr/bin/env node

const activities = [];
const emojis = ['📝', '✅', '🎯', '🚀', '💡', '📚', '🏃', '🎨', '🍕', '☕'];
const titles = [
  'Review documentation',
  'Write unit tests',
  'Team meeting',
  'Code review',
  'Update dependencies',
  'Fix bug',
  'Implement feature',
  'Deploy to production',
  'Write blog post',
  'Customer call'
];

const descriptions = [
  'Need to complete this task today',
  'High priority item',
  'Follow up from last week',
  'Scheduled for this afternoon',
  'Waiting for feedback',
  'In progress',
  'Almost done',
  'Starting tomorrow',
  'Blocked by another task',
  'Optional but would be nice'
];

// Generate 150 test activities
for (let i = 0; i < 150; i++) {
  activities.push({
    id: `test-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
    text: `${titles[i % titles.length]} #${i + 1}`,
    description: descriptions[i % descriptions.length],
    emoji: emojis[i % emojis.length],
    completed: Math.random() > 0.7,
    pinned: Math.random() > 0.9,
    time: Math.random() > 0.5 ? `${Math.floor(Math.random() * 12) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : null
  });
}

console.log('Generated test activities:');
console.log(JSON.stringify(activities, null, 2));
console.log(`\nTotal activities generated: ${activities.length}`);
console.log('\nTo use these activities:');
console.log('1. Copy the JSON output above');
console.log('2. In the app, open the Data modal in edit mode');
console.log('3. Paste the activities into the appropriate user/day');