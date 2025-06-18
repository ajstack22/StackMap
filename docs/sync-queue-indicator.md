# Sync Queue Indicator Documentation

## Overview
The sync queue indicator is a visual component that shows the status of pending synchronization operations in StackMap. It appears in the bottom-left corner of the screen when there are pending changes or when the app is offline.

## Features

### Visual States
1. **Offline** (Yellow) - Shows when the app is not connected to the internet
   - Icon: `cloud_off`
   - Text: "Offline"
   - Tooltip: "You are offline - changes will sync when connected"

2. **Syncing** (Blue) - Shows when actively synchronizing data
   - Icon: `sync` (animated spinning)
   - Text: "Syncing"
   - Tooltip: "Syncing changes to cloud..."

3. **Pending** (Blue) - Shows when there are queued items waiting to sync
   - Icon: `cloud_queue`
   - Text: "Pending"
   - Tooltip: "[N] pending changes - click for details"

4. **Error** (Red) - Shows when sync errors occur (future enhancement)
   - Icon: `error`
   - Text: "Error"

### Interactions
- **Hover**: Shows tooltip with current status
- **Click**: Opens detailed sync queue modal
- **New Items**: Pulse animation when new items are added to queue

### Mobile Responsiveness
- On mobile devices (< 768px), the indicator appears above the navigation bar
- On very small screens (< 480px), it spans the full width

## Testing

### Manual Testing
1. Open `test-sync-queue.html` in a browser
2. Use the control buttons to test different states:
   - Toggle online/offline status
   - Add/remove queue items
   - Start/stop processing
   - Show/hide the indicator

### Testing in the App
1. **Test Offline Mode**:
   - Open Developer Tools (F12)
   - Go to Network tab
   - Select "Offline" from the throttling dropdown
   - Make changes to your activities
   - The indicator should show "Offline" status

2. **Test Queue Items**:
   - While offline, create/edit/delete activities
   - The indicator should show the count of pending changes
   - Click the indicator to see detailed queue information

3. **Test Sync Process**:
   - Go back online
   - The indicator should change to "Syncing" with spinning icon
   - Once complete, the indicator should disappear

## Implementation Details

### CSS Classes
- `.sync-queue-indicator` - Base styles
- `.sync-queue-indicator.visible` - Shows the indicator
- `.sync-queue-indicator.offline` - Offline state styling
- `.sync-queue-indicator.syncing` - Syncing state styling
- `.sync-queue-indicator.error` - Error state styling
- `.sync-queue-indicator.has-new-items` - Pulse animation for new items

### JavaScript Methods
- `createSyncQueueIndicator()` - Creates the indicator element
- `updateSyncQueueIndicator(status)` - Updates indicator based on queue status
- `showSyncQueueDetails()` - Shows the detailed modal

### Events
The indicator listens for `syncQueueUpdate` custom events dispatched by the SyncQueue class when:
- Items are added to the queue
- Items are processed
- Queue is cleared
- Online/offline status changes

## Troubleshooting

### Indicator Not Appearing
1. Check that `sync-modal.css` is loaded in index.html
2. Verify `initializeSyncQueueUI()` is called during DriveSync initialization
3. Check browser console for errors

### Styling Issues
1. Ensure CSS variables are loaded (`--primary-color`, `--card-bg`, etc.)
2. Check for CSS conflicts with other styles
3. Verify Material Icons font is loaded

### Modal Not Opening
1. Check for JavaScript errors in console
2. Verify click event handler is attached
3. Ensure z-index is high enough (10000)

## Future Enhancements
1. Add error state handling with retry options
2. Show sync progress percentage
3. Add notification sounds for sync completion
4. Implement sync history view
5. Add manual sync trigger button