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
    TRANSITIONS: 'Transitions',
    CHORES: 'Chores & Responsibilities',
    EXERCISE: 'Exercise & Movement',
    CALMING: 'Calming & Regulation'
};

// Extended activity library for future use
const ACTIVITY_LIBRARY = {
    // Morning Routine
    wake_up: {
        title: 'Wake Up',
        description: 'Good morning sunshine!',
        icon: '☀️',
        category: ACTIVITY_CATEGORIES.DAILY_CARE
    },
    make_bed: {
        title: 'Make Bed',
        description: 'Smooth and cozy!',
        icon: '🛏️',
        category: ACTIVITY_CATEGORIES.DAILY_CARE
    },
    morning_stretch: {
        title: 'Morning Stretch',
        description: 'Wake up your body!',
        icon: '🌞',
        category: ACTIVITY_CATEGORIES.DAILY_CARE
    },
    wash_face: {
        title: 'Wash Face',
        description: 'Fresh face for the day!',
        icon: '💦',
        category: ACTIVITY_CATEGORIES.DAILY_CARE
    },
    comb_hair: {
        title: 'Comb Hair',
        description: 'Looking sharp!',
        icon: '👱',
        category: ACTIVITY_CATEGORIES.DAILY_CARE
    },
    
    // Evening Routine
    pajama_time: {
        title: 'Put on Pajamas',
        description: 'Cozy clothes time!',
        icon: '👔',
        category: ACTIVITY_CATEGORIES.DAILY_CARE
    },
    evening_routine: {
        title: 'Evening Routine',
        description: 'Wind down wonderland!',
        icon: '🌙',
        category: ACTIVITY_CATEGORIES.DAILY_CARE
    },
    brush_hair: {
        title: 'Brush Hair',
        description: 'Gentle brushing time!',
        icon: '🪮',
        category: ACTIVITY_CATEGORIES.DAILY_CARE
    },
    night_light: {
        title: 'Turn on Night Light',
        description: 'Sweet dreams glow!',
        icon: '🌟',
        category: ACTIVITY_CATEGORIES.DAILY_CARE
    },
    goodnight_hugs: {
        title: 'Goodnight Hugs',
        description: 'Love you to the moon!',
        icon: '🤗',
        category: ACTIVITY_CATEGORIES.DAILY_CARE
    },
    
    // School/Learning
    pack_backpack: {
        title: 'Pack Backpack',
        description: 'Everything in its place!',
        icon: '🎒',
        category: ACTIVITY_CATEGORIES.SCHOOL
    },
    homework_time: {
        title: 'Homework Time',
        description: 'Brain power activate!',
        icon: '📚',
        category: ACTIVITY_CATEGORIES.SCHOOL
    },
    reading_time: {
        title: 'Reading Time',
        description: 'Adventure in every book!',
        icon: '📖',
        category: ACTIVITY_CATEGORIES.SCHOOL
    },
    writing_practice: {
        title: 'Writing Practice',
        description: 'Making letters dance!',
        icon: '✏️',
        category: ACTIVITY_CATEGORIES.SCHOOL
    },
    math_time: {
        title: 'Math Time',
        description: 'Number ninjas unite!',
        icon: '🔢',
        category: ACTIVITY_CATEGORIES.SCHOOL
    },
    art_project: {
        title: 'Art Project',
        description: 'Create something amazing!',
        icon: '🎨',
        category: ACTIVITY_CATEGORIES.SCHOOL
    },
    computer_time: {
        title: 'Computer Time',
        description: 'Digital learning fun!',
        icon: '💻',
        category: ACTIVITY_CATEGORIES.SCHOOL
    },
    library_visit: {
        title: 'Library Visit',
        description: 'Book treasure hunt!',
        icon: '📚',
        category: ACTIVITY_CATEGORIES.SCHOOL
    },
    
    // Chores & Responsibilities
    clean_room: {
        title: 'Clean Room',
        description: 'Everything has a home!',
        icon: '🧹',
        category: ACTIVITY_CATEGORIES.CHORES
    },
    put_toys_away: {
        title: 'Put Toys Away',
        description: 'Toy parade to their homes!',
        icon: '🧸',
        category: ACTIVITY_CATEGORIES.CHORES
    },
    feed_pet: {
        title: 'Feed Pet',
        description: 'Happy pet, happy day!',
        icon: '🐾',
        category: ACTIVITY_CATEGORIES.CHORES
    },
    water_plants: {
        title: 'Water Plants',
        description: 'Help them grow strong!',
        icon: '🪴',
        category: ACTIVITY_CATEGORIES.CHORES
    },
    set_table: {
        title: 'Set Table',
        description: 'Dinner helper extraordinaire!',
        icon: '🍽️',
        category: ACTIVITY_CATEGORIES.CHORES
    },
    laundry_helper: {
        title: 'Help with Laundry',
        description: 'Sorting superstar!',
        icon: '👕',
        category: ACTIVITY_CATEGORIES.CHORES
    },
    take_trash_out: {
        title: 'Take Out Trash',
        description: 'Keeping things tidy!',
        icon: '🗑️',
        category: ACTIVITY_CATEGORIES.CHORES
    },
    wipe_table: {
        title: 'Wipe Table',
        description: 'Sparkle and shine!',
        icon: '🧽',
        category: ACTIVITY_CATEGORIES.CHORES
    },
    
    // Health & Hygiene
    hand_washing: {
        title: 'Wash Hands',
        description: 'Bubble power activate!',
        icon: '🧼',
        category: ACTIVITY_CATEGORIES.THERAPY
    },
    take_medicine: {
        title: 'Take Medicine',
        description: 'Super vitamins time!',
        icon: '💊',
        category: ACTIVITY_CATEGORIES.THERAPY
    },
    doctor_visit: {
        title: 'Doctor Visit',
        description: 'Health check champion!',
        icon: '👨‍⚕️',
        category: ACTIVITY_CATEGORIES.THERAPY
    },
    therapy_time: {
        title: 'Therapy Time',
        description: 'Building new skills!',
        icon: '🏥',
        category: ACTIVITY_CATEGORIES.THERAPY
    },
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
    potty_time: {
        title: 'Potty Time',
        description: 'You\'re doing great!',
        icon: '🚽',
        category: ACTIVITY_CATEGORIES.DAILY_CARE
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
    say_hello: {
        title: 'Say Hello',
        description: 'Friendly greetings!',
        icon: '👋',
        category: ACTIVITY_CATEGORIES.SOCIAL
    },
    play_date: {
        title: 'Play Date',
        description: 'Friend fun time!',
        icon: '👫',
        category: ACTIVITY_CATEGORIES.SOCIAL
    },
    video_call: {
        title: 'Video Call',
        description: 'Hello from far away!',
        icon: '📱',
        category: ACTIVITY_CATEGORIES.SOCIAL
    },
    turn_taking: {
        title: 'Take Turns',
        description: 'Your turn, my turn!',
        icon: '🔄',
        category: ACTIVITY_CATEGORIES.SOCIAL
    },
    group_game: {
        title: 'Group Game',
        description: 'Teamwork makes it fun!',
        icon: '🎲',
        category: ACTIVITY_CATEGORIES.SOCIAL
    },
    
    // Leisure & Fun
    play_time: {
        title: 'Play Time',
        description: 'Fun mode activated!',
        icon: '🎮',
        category: ACTIVITY_CATEGORIES.PLAY
    },
    outdoor_play: {
        title: 'Outdoor Play',
        description: 'Fresh air adventures!',
        icon: '🏞️',
        category: ACTIVITY_CATEGORIES.PLAY
    },
    board_game: {
        title: 'Board Game',
        description: 'Game on!',
        icon: '🎯',
        category: ACTIVITY_CATEGORIES.PLAY
    },
    lego_time: {
        title: 'Building Blocks',
        description: 'Master builder mode!',
        icon: '🧱',
        category: ACTIVITY_CATEGORIES.PLAY
    },
    puzzle_time: {
        title: 'Puzzle Time',
        description: 'Piece by piece!',
        icon: '🧩',
        category: ACTIVITY_CATEGORIES.PLAY
    },
    music_time: {
        title: 'Music Time',
        description: 'Dance and sing!',
        icon: '🎵',
        category: ACTIVITY_CATEGORIES.PLAY
    },
    craft_time: {
        title: 'Craft Time',
        description: 'Create and make!',
        icon: '✂️',
        category: ACTIVITY_CATEGORIES.PLAY
    },
    screen_time: {
        title: 'Screen Time',
        description: 'Digital fun zone!',
        icon: '📺',
        category: ACTIVITY_CATEGORIES.PLAY
    },
    special_interest: {
        title: 'Special Interest Time',
        description: 'Dive into your passion!',
        icon: '⭐',
        category: ACTIVITY_CATEGORIES.PLAY
    },
    
    // Meals & Nutrition
    breakfast_time: {
        title: 'Breakfast Time',
        description: 'Fuel up for adventures!',
        icon: '🥞',
        category: ACTIVITY_CATEGORIES.MEALS
    },
    lunch_time: {
        title: 'Lunch Time',
        description: 'Midday munchies!',
        icon: '🥪',
        category: ACTIVITY_CATEGORIES.MEALS
    },
    dinner_time: {
        title: 'Dinner Time',
        description: 'Family feast time!',
        icon: '🍝',
        category: ACTIVITY_CATEGORIES.MEALS
    },
    snack_time: {
        title: 'Snack Time',
        description: 'Yummy energy boost!',
        icon: '🍎',
        category: ACTIVITY_CATEGORIES.MEALS
    },
    water_break: {
        title: 'Water Break',
        description: 'Hydration station!',
        icon: '💧',
        category: ACTIVITY_CATEGORIES.MEALS
    },
    cook_together: {
        title: 'Cook Together',
        description: 'Kitchen helper hero!',
        icon: '👨‍🍳',
        category: ACTIVITY_CATEGORIES.MEALS
    },
    try_new_food: {
        title: 'Try New Food',
        description: 'Brave taste explorer!',
        icon: '🥕',
        category: ACTIVITY_CATEGORIES.MEALS
    },
    
    // Exercise & Movement
    exercise_time: {
        title: 'Exercise Time',
        description: 'Move and groove!',
        icon: '🏃',
        category: ACTIVITY_CATEGORIES.EXERCISE
    },
    yoga_time: {
        title: 'Yoga Time',
        description: 'Stretch like a cat!',
        icon: '🧘',
        category: ACTIVITY_CATEGORIES.EXERCISE
    },
    bike_ride: {
        title: 'Bike Ride',
        description: 'Pedal power!',
        icon: '🚴',
        category: ACTIVITY_CATEGORIES.EXERCISE
    },
    swimming: {
        title: 'Swimming',
        description: 'Splash and swim!',
        icon: '🏊',
        category: ACTIVITY_CATEGORIES.EXERCISE
    },
    dance_party: {
        title: 'Dance Party',
        description: 'Boogie wonderland!',
        icon: '💃',
        category: ACTIVITY_CATEGORIES.EXERCISE
    },
    walk_time: {
        title: 'Walk Time',
        description: 'Step by step adventure!',
        icon: '🚶',
        category: ACTIVITY_CATEGORIES.EXERCISE
    },
    playground: {
        title: 'Playground Time',
        description: 'Swing and slide!',
        icon: '🛝',
        category: ACTIVITY_CATEGORIES.EXERCISE
    },
    sports_time: {
        title: 'Sports Time',
        description: 'Team player mode!',
        icon: '⚽',
        category: ACTIVITY_CATEGORIES.EXERCISE
    },
    
    // Calming & Regulation
    quiet_time: {
        title: 'Quiet Time',
        description: 'Peaceful moments!',
        icon: '🤫',
        category: ACTIVITY_CATEGORIES.CALMING
    },
    deep_breathing: {
        title: 'Deep Breathing',
        description: 'In and out, nice and slow!',
        icon: '🌬️',
        category: ACTIVITY_CATEGORIES.CALMING
    },
    sensory_break: {
        title: 'Sensory Break',
        description: 'Reset and recharge!',
        icon: '🧘',
        category: ACTIVITY_CATEGORIES.SENSORY
    },
    fidget_time: {
        title: 'Fidget Time',
        description: 'Squeeze and fiddle!',
        icon: '🔮',
        category: ACTIVITY_CATEGORIES.SENSORY
    },
    calm_corner: {
        title: 'Calm Corner',
        description: 'Your peaceful place!',
        icon: '🛋️',
        category: ACTIVITY_CATEGORIES.CALMING
    },
    weighted_blanket: {
        title: 'Weighted Blanket',
        description: 'Cozy pressure hug!',
        icon: '🛌',
        category: ACTIVITY_CATEGORIES.SENSORY
    },
    sensory_swing: {
        title: 'Sensory Swing',
        description: 'Gentle swaying time!',
        icon: '🪑',
        category: ACTIVITY_CATEGORIES.SENSORY
    },
    coloring_time: {
        title: 'Coloring Time',
        description: 'Color your calm!',
        icon: '🖍️',
        category: ACTIVITY_CATEGORIES.CALMING
    },
    listening_music: {
        title: 'Calming Music',
        description: 'Soothing sounds!',
        icon: '🎧',
        category: ACTIVITY_CATEGORIES.CALMING
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
    school_bus: {
        title: 'School Bus',
        description: 'All aboard!',
        icon: '🚌',
        category: ACTIVITY_CATEGORIES.TRANSITIONS
    },
    get_ready: {
        title: 'Get Ready',
        description: 'Preparation station!',
        icon: '⚡',
        category: ACTIVITY_CATEGORIES.TRANSITIONS
    },
    pack_up: {
        title: 'Pack Up',
        description: 'Time to go!',
        icon: '📦',
        category: ACTIVITY_CATEGORIES.TRANSITIONS
    },
    transition_warning: {
        title: '5 Minute Warning',
        description: 'Almost time to switch!',
        icon: '⏰',
        category: ACTIVITY_CATEGORIES.TRANSITIONS
    },
    
    // Additional sensory activities
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
    chewing_gum: {
        title: 'Chewing Gum',
        description: 'Oral motor time!',
        icon: '🍬',
        category: ACTIVITY_CATEGORIES.SENSORY
    },
    noise_canceling: {
        title: 'Quiet Headphones',
        description: 'Block out the noise!',
        icon: '🎧',
        category: ACTIVITY_CATEGORIES.SENSORY
    }
};

// Make available globally
window.DEFAULT_ACTIVITIES = DEFAULT_ACTIVITIES;
window.ACTIVITY_CATEGORIES = ACTIVITY_CATEGORIES;
window.ACTIVITY_LIBRARY = ACTIVITY_LIBRARY;