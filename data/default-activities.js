// data/default-activities.js - Default activity templates for special needs children
// NO ES6 IMPORTS - This file is loaded via script tag

const DEFAULT_ACTIVITIES = [
    // First 3 visible by default
    {
        title: 'Morning Stretch',
        description: 'Wake up your body!',
        icon: '🌞',
        visible: true
    },
    {
        title: 'Brush Teeth',
        description: 'Keep them clean and shiny!',
        icon: '🦷',
        visible: true
    },
    {
        title: 'Get Dressed',
        description: 'Pick your favorite outfit!',
        icon: '👕',
        visible: true
    },
    
    // Additional cards - hidden by default for parents to enable as needed
    {
        title: 'Breakfast Time',
        description: 'Fuel up for adventures!',
        icon: '🥞',
        visible: false
    },
    {
        title: 'Take Medicine',
        description: 'Super vitamins for super kids!',
        icon: '💊',
        visible: false
    },
    {
        title: 'Pack Backpack',
        description: 'Everything in its special place!',
        icon: '🎒',
        visible: false
    },
    {
        title: 'School Bus',
        description: 'All aboard the learning express!',
        icon: '🚌',
        visible: false
    },
    {
        title: 'Quiet Time',
        description: 'Shhh... brain recharging!',
        icon: '🤫',
        visible: false
    },
    {
        title: 'Snack Break',
        description: 'Nom nom energy boost!',
        icon: '🍎',
        visible: false
    },
    {
        title: 'Hand Washing',
        description: 'Bubble power activate!',
        icon: '🧼',
        visible: false
    },
    {
        title: 'Homework Time',
        description: 'Brain muscles getting stronger!',
        icon: '📚',
        visible: false
    },
    {
        title: 'Sensory Break',
        description: 'Wiggle, squeeze, and breathe!',
        icon: '🧘',
        visible: false
    },
    {
        title: 'Play Time',
        description: 'Fun mode: ACTIVATED!',
        icon: '🎮',
        visible: false
    },
    {
        title: 'Clean Up',
        description: 'Everything has a home!',
        icon: '🧹',
        visible: false
    },
    {
        title: 'Dinner Time',
        description: 'Family feast o\'clock!',
        icon: '🍝',
        visible: false
    },
    {
        title: 'Bath Time',
        description: 'Splish splash, you\'re awesome!',
        icon: '🛁',
        visible: false
    },
    {
        title: 'Story Time',
        description: 'Adventure awaits in every page!',
        icon: '📖',
        visible: false
    },
    {
        title: 'Bedtime',
        description: 'Sweet dreams, superstar!',
        icon: '😴',
        visible: false
    }
];

// Categories for future expansion
const ACTIVITY_CATEGORIES = {
    DAILY_CARE: 'Daily Care',
    SCHOOL: 'School & Learning',
    THERAPY: 'Therapy & Health',
    SENSORY: 'Sensory & Breaks',
    SOCIAL: 'Social Skills',
    PLAY: 'Play & Fun',
    MEALS: 'Meals & Snacks',
    TRANSITIONS: 'Transitions'
};

// Extended activity library for future use
const ACTIVITY_LIBRARY = {
    // Daily Care
    morning_routine: {
        title: 'Morning Routine',
        description: 'Rise and shine sequence!',
        icon: '☀️',
        category: ACTIVITY_CATEGORIES.DAILY_CARE
    },
    evening_routine: {
        title: 'Evening Routine',
        description: 'Wind down wonderland!',
        icon: '🌙',
        category: ACTIVITY_CATEGORIES.DAILY_CARE
    },
    potty_time: {
        title: 'Potty Time',
        description: 'You\'re doing great!',
        icon: '🚽',
        category: ACTIVITY_CATEGORIES.DAILY_CARE
    },
    
    // Therapy & Health
    speech_therapy: {
        title: 'Speech Therapy',
        description: 'Words are your superpower!',
        icon: '💬',
        category: ACTIVITY_CATEGORIES.THERAPY
    },
    occupational_therapy: {
        title: 'OT Time',
        description: 'Building amazing skills!',
        icon: '🤹',
        category: ACTIVITY_CATEGORIES.THERAPY
    },
    physical_therapy: {
        title: 'PT Exercises',
        description: 'Strong body, strong mind!',
        icon: '🏃',
        category: ACTIVITY_CATEGORIES.THERAPY
    },
    
    // Sensory
    deep_pressure: {
        title: 'Squeeze Time',
        description: 'Big hugs for your body!',
        icon: '🤗',
        category: ACTIVITY_CATEGORIES.SENSORY
    },
    sensory_bin: {
        title: 'Sensory Bin',
        description: 'Explore and discover!',
        icon: '🏖️',
        category: ACTIVITY_CATEGORIES.SENSORY
    },
    movement_break: {
        title: 'Movement Break',
        description: 'Wiggle those wiggles out!',
        icon: '🕺',
        category: ACTIVITY_CATEGORIES.SENSORY
    },
    
    // Social Skills
    sharing_time: {
        title: 'Sharing Time',
        description: 'Kindness is contagious!',
        icon: '🤝',
        category: ACTIVITY_CATEGORIES.SOCIAL
    },
    circle_time: {
        title: 'Circle Time',
        description: 'Friends together!',
        icon: '👥',
        category: ACTIVITY_CATEGORIES.SOCIAL
    },
    
    // Transitions
    car_time: {
        title: 'Car Ride',
        description: 'Adventure mobile ready!',
        icon: '🚗',
        category: ACTIVITY_CATEGORIES.TRANSITIONS
    },
    waiting_time: {
        title: 'Waiting Time',
        description: 'Patience champion mode!',
        icon: '⏳',
        category: ACTIVITY_CATEGORIES.TRANSITIONS
    },
    
    // Meals
    lunch_time: {
        title: 'Lunch Time',
        description: 'Midday munchies!',
        icon: '🥪',
        category: ACTIVITY_CATEGORIES.MEALS
    },
    water_break: {
        title: 'Water Break',
        description: 'Hydration station!',
        icon: '💧',
        category: ACTIVITY_CATEGORIES.MEALS
    }
};

// Make available globally
window.DEFAULT_ACTIVITIES = DEFAULT_ACTIVITIES;
window.ACTIVITY_CATEGORIES = ACTIVITY_CATEGORIES;
window.ACTIVITY_LIBRARY = ACTIVITY_LIBRARY;