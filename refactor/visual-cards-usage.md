# Visual Activity Cards - Usage Guide

## Overview
The Visual Activity Cards system provides an emoji-first, visual interface for managing tasks. It's designed for users with ADHD, autism, and other special needs who benefit from visual representations.

## Current Status
- ✅ Visual cards system is functional
- ✅ Cards are stored in localStorage
- ✅ Default cards are created for new users
- ⚠️ SQLite integration is pending (using localStorage for now)

## How to Use

### Viewing Visual Cards
1. The system should automatically show visual cards if you have any
2. If you see regular task cards, look for a "Switch to Visual View" button
3. Cards display with large emojis and optional short titles

### Creating Cards
1. Enable Edit Mode (click the edit button in the header)
2. Click the "Add Card" button (shows as a + sign)
3. In the card creator:
   - Choose an emoji (required)
   - Add a short title (optional, 13 chars max)
   - Select a background color
   - Choose card type:
     - Single Use: Complete once and done
     - Daily: Resets every day
     - Frequent: Always available

### Interacting with Cards
- **Normal Mode**: Tap/click a card to mark it complete
- **Edit Mode**: Tap/click a card to see edit/delete options

### Card Types
- **Single Use** (1️⃣): One-time tasks that stay completed
- **Daily** (🔄): Reset automatically at midnight
- **Frequent** (♾️): Can be completed multiple times

## Troubleshooting

### Cards Not Showing
1. Clear your browser cache and reload
2. Check browser console for errors
3. Visual cards are stored in localStorage under 'stackmap_visual_cards'

### To Reset Cards
In browser console:
```javascript
localStorage.removeItem('stackmap_visual_cards');
localStorage.removeItem('stackmap_visual_cards_initialized');
location.reload();
```

## Test Page
A test page is available at `test-visual-cards.html` for debugging and testing the visual cards system.

## Known Issues
- Clusterize.min.js has a minification error (doesn't affect visual cards)
- Voice attachment export error (doesn't affect visual cards)
- SQLite integration pending (using localStorage fallback)