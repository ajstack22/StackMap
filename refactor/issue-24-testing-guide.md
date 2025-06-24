# Issue #24: Mobile Attachment Testing Guide

## Testing Overview
The mobile attachment system has been implemented with support for photos and voice memos. Maximum 5 attachments per task, with voice memos limited to 2 minutes.

## Test Files
- **Manual Test Page**: `/refactor/test-attachments.html`
- **Integration**: Task edit modal in main app

## Testing Instructions

### 1. Test Page Testing (Recommended First)
1. Open `/refactor/test-attachments.html` in browser
2. Test photo upload:
   - Click "📷 Photo" button
   - Select an image file
   - Verify it appears in the list
   - Check file size displayed
3. Test voice recording:
   - Click "🎤 Voice" button
   - Allow microphone access
   - Record for a few seconds
   - Click the button again to stop
   - Verify voice memo appears with duration
4. Test limits:
   - Try adding more than 5 attachments
   - Should see error message
5. Test deletion:
   - Click × on any attachment
   - Confirm deletion
   - Verify it's removed

### 2. Main App Integration Testing
1. Open main app (`/refactor/index.html`)
2. Create or edit a task
3. In the edit modal, scroll to Attachments section
4. Test same photo/voice functionality
5. Save task and verify attachments persist
6. Re-open task to verify attachments load

### 3. Platform-Specific Testing

#### Web Browser (Chrome/Safari/Firefox)
- Basic functionality should work
- Voice recording requires HTTPS or localhost
- Test file input and microphone permissions

#### iOS Safari (PWA)
- Install as PWA first
- Test camera capture (should open camera)
- Test voice recording permissions
- Verify offline functionality

#### Android Chrome (PWA)
- Install as PWA
- Test file picker and camera
- Test voice recording
- Check memory usage

#### Native Apps (Capacitor)
- SQLite storage for voice memos
- Photo storage in IndexedDB
- Test with airplane mode

### 4. Edge Cases to Test
1. **Large files**:
   - Photos > 2MB (should compress)
   - Voice > 5MB (auto-stops at 2 min)
2. **Permissions**:
   - Deny camera/microphone
   - Should show appropriate errors
3. **Storage**:
   - Fill up storage quota
   - Should handle gracefully
4. **Concurrent**:
   - Try recording while uploading photo
   - Should queue properly

## Expected Behavior

### Photos
- Max 3 photos per task (from Issue #55)
- Auto-compression if > 2MB
- Thumbnails generated (200x200)
- Stored in IndexedDB

### Voice Memos
- Max 2 minutes duration
- Auto-compression if > 5MB
- Waveform visualization (100 samples)
- Small files (<1MB) in SQLite, larger in IndexedDB

### UI/UX
- Clear attachment count hints
- Smooth animations
- Accessible (keyboard nav, screen readers)
- Safe mode compatible (larger touch targets)

## Known Limitations
1. Voice recording requires modern browser with MediaRecorder API
2. No audio playback UI yet (future enhancement)
3. No photo preview/zoom yet (future enhancement)
4. PDF/Links support deferred to v2

## Performance Targets
- Add attachment: <2 seconds
- Load attachments: <500ms
- Memory usage: <50MB total cache

## Debugging
Check browser console for:
- `AttachmentManager: Initialized` message
- Any IndexedDB or SQLite errors
- Memory warnings

## Success Criteria
✅ Photos upload and display  
✅ Voice records up to 2 min  
✅ 5 attachment limit enforced  
✅ Works offline  
✅ Cross-platform compatible