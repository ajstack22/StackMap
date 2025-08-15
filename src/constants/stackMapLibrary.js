// StackMap Library - Default activity groups provided by the app
// These are read-only and available to all users

export const STACKMAP_LIBRARY = {
  version: '1.0.0',
  lastUpdated: '2025-01-08',
  activityGroups: [
    {
      id: 'morning-activities',
      name: 'Morning Activities',
      activities: [
        { id: 'wake-up', text: 'Wake Up', icon: '🌅', description: 'Time to start the day!' },
        { id: 'turn-off-alarm', text: 'Turn Off Alarm', icon: '⏰', description: 'Press the button and get up' },
        { id: 'brush-teeth-am', text: 'Brush Teeth', icon: '🪥', description: '2 minutes, top and bottom' },
        { id: 'take-shower', text: 'Take Shower', icon: '🚿', description: 'Wash hair and body' },
        { id: 'wash-face', text: 'Wash Face', icon: '🧼', description: 'Splash with cool water' },
        { id: 'get-dressed', text: 'Get Dressed', icon: '👕', description: 'Pick today\'s outfit' },
        { id: 'make-bed', text: 'Make Bed', icon: '🛏️', description: 'Pull up covers and arrange pillows' },
        { id: 'pack-backpack', text: 'Pack Backpack', icon: '🎒', description: 'Books, homework, and supplies' },
        { id: 'take-medicine-am', text: 'Take Medicine', icon: '💊', description: 'Morning vitamins or medications' },
        { id: 'drink-water-am', text: 'Drink Water', icon: '🥛', description: 'Start the day hydrated' }
      ],
      order: 0,
      isSystemProvided: true
    },
    {
      id: 'food-activities',
      name: 'Food Activities',
      activities: [
        { id: 'eat-breakfast', text: 'Eat Breakfast', icon: '🥣', description: 'Fuel up for the morning' },
        { id: 'make-lunch', text: 'Make Lunch', icon: '🥪', description: 'Prepare or pack lunch' },
        { id: 'morning-snack', text: 'Morning Snack', icon: '🍎', description: 'Healthy mid-morning boost' },
        { id: 'eat-lunch', text: 'Eat Lunch', icon: '🍽️', description: 'Midday meal time' },
        { id: 'afternoon-snack', text: 'Afternoon Snack', icon: '🥤', description: 'Recharge after school' },
        { id: 'eat-dinner', text: 'Eat Dinner', icon: '🍝', description: 'Family meal time' },
        { id: 'evening-snack', text: 'Evening Snack', icon: '🍪', description: 'Small bedtime treat' },
        { id: 'help-cook', text: 'Help Cook', icon: '🥗', description: 'Assist with meal preparation' },
        { id: 'clear-table', text: 'Clear Table', icon: '🧹', description: 'Take dishes to sink' },
        { id: 'set-table', text: 'Set Table', icon: '🍴', description: 'Plates, utensils, and cups' }
      ],
      order: 1,
      isSystemProvided: true
    },
    {
      id: 'play-activities',
      name: 'Play Activities',
      activities: [
        { id: 'screen-time', text: 'Screen Time', icon: '🎮', description: 'Games, videos, or apps' },
        { id: 'reading-time', text: 'Reading Time', icon: '📚', description: 'Independent or together' },
        { id: 'art-crafts', text: 'Art & Crafts', icon: '🎨', description: 'Draw, paint, or create' },
        { id: 'outdoor-play', text: 'Outdoor Play', icon: '🏃', description: 'Run, jump, and explore' },
        { id: 'puzzles', text: 'Puzzles', icon: '🧩', description: 'Problem-solving fun' },
        { id: 'board-games', text: 'Board Games', icon: '🎲', description: 'Family game time' },
        { id: 'free-play', text: 'Free Play', icon: '🧸', description: 'Imagination time' },
        { id: 'music-time', text: 'Music Time', icon: '🎵', description: 'Listen, sing, or dance' },
        { id: 'building-blocks', text: 'Building Blocks', icon: '🏗️', description: 'Construct and create' },
        { id: 'sports-practice', text: 'Sports Practice', icon: '⚽', description: 'Physical activity time' }
      ],
      order: 2,
      isSystemProvided: true
    },
    {
      id: 'afternoon-activities',
      name: 'Afternoon Activities',
      activities: [
        { id: 'homework', text: 'Homework', icon: '📝', description: 'Complete school assignments' },
        { id: 'practice-instrument', text: 'Practice Instrument', icon: '🎹', description: 'Daily music practice' },
        { id: 'study-time', text: 'Study Time', icon: '📖', description: 'Review and learn' },
        { id: 'wash-hands-pm', text: 'Wash Hands', icon: '🧼', description: 'Clean up after school' },
        { id: 'change-clothes', text: 'Change Clothes', icon: '👕', description: 'Into play clothes' },
        { id: 'walk-pet', text: 'Walk Pet', icon: '🐕', description: 'Exercise time for pets' },
        { id: 'chores', text: 'Chores', icon: '🧹', description: 'Help around the house' },
        { id: 'call-family', text: 'Call Family', icon: '📞', description: 'Connect with relatives' },
        { id: 'activity-class', text: 'Activity Class', icon: '🎯', description: 'Sports, dance, or lessons' },
        { id: 'quiet-time', text: 'Quiet Time', icon: '💭', description: 'Rest and recharge' }
      ],
      order: 3,
      isSystemProvided: true
    },
    {
      id: 'evening-activities',
      name: 'Evening Activities',
      activities: [
        { id: 'take-bath', text: 'Take Bath', icon: '🛁', description: 'Warm water and bubbles' },
        { id: 'shower-evening', text: 'Shower', icon: '🧴', description: 'Quick evening rinse' },
        { id: 'put-on-pajamas', text: 'Put on Pajamas', icon: '👔', description: 'Comfy sleep clothes' },
        { id: 'brush-teeth-pm', text: 'Brush Teeth', icon: '🦷', description: 'Before bed cleaning' },
        { id: 'bedtime-story', text: 'Bedtime Story', icon: '📚', description: 'Wind down with books' },
        { id: 'family-time', text: 'Family Time', icon: '🤗', description: 'Connect and share' },
        { id: 'no-screens', text: 'No Screens', icon: '📱', description: 'Power down devices' },
        { id: 'tidy-room', text: 'Tidy Room', icon: '🧸', description: 'Quick toy cleanup' },
        { id: 'lights-out', text: 'Lights Out', icon: '💡', description: 'Time to sleep' },
        { id: 'bedtime', text: 'Bedtime', icon: '🌙', description: 'Sweet dreams' }
      ],
      order: 4,
      isSystemProvided: true
    },
    {
      id: 'therapy-wellness',
      name: 'Wellness Activities',
      activities: [
        { id: 'deep-breathing', text: 'Deep Breathing', icon: '🧘', description: 'Calm and center' },
        { id: 'feelings-check', text: 'Feelings Check', icon: '💭', description: 'How am I feeling?' },
        { id: 'journal-time', text: 'Journal Time', icon: '📓', description: 'Write or draw thoughts' },
        { id: 'stretching', text: 'Stretching', icon: '🤲', description: 'Move your body gently' },
        { id: 'speech-practice', text: 'Speech Practice', icon: '🗣️', description: 'Work on sounds and words' },
        { id: 'sensory-break', text: 'Sensory Break', icon: '✋', description: 'Calming sensory activities' },
        { id: 'focus-exercise', text: 'Focus Exercise', icon: '🎯', description: 'Attention building activity' },
        { id: 'calm-down-time', text: 'Calm Down Time', icon: '😌', description: 'Reset and regulate' },
        { id: 'pt-exercises', text: 'PT Exercises', icon: '💪', description: 'Physical therapy routine' },
        { id: 'brain-break', text: 'Brain Break', icon: '🧠', description: 'Mental reset activity' }
      ],
      order: 5,
      isSystemProvided: true
    }
  ]
};

export default STACKMAP_LIBRARY;