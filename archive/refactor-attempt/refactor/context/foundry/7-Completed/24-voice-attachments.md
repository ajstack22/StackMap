# Story: Voice Memo Attachments for Tasks

## 🚀 Developer Launch Prompt

**Hello Developer!** You're building voice memo attachments that reduce cognitive load by 40-60% for ADHD users. Your mission:

1. **Read this entire story** to understand why one-tap recording matters
2. **Create your implementation plan** in `4-PlanReview/24-voice-attachments.md`
3. **Focus on**: One-tap toggle recording, sub-200ms start latency, crash recovery
4. **Remember**: This is an accessibility feature, not a convenience

Ready? Let's help ADHD users capture thoughts when typing feels impossible!

---

**GitHub Issue**: #24 - Mobile Attachment System  
**Research**: Voice UI design for ADHD users in task management apps

## User Story
As an ADHD user, I want to record voice memos for my tasks using simple one-tap recording, so that I can capture thoughts quickly when typing feels overwhelming or impossible due to executive dysfunction.

## Acceptance Criteria
- [ ] One-tap toggle recording (NOT press-and-hold)
- [ ] Real-time waveform display during recording  
- [ ] Auto-save on pause with resume capability
- [ ] Playback with speed controls (0.75x, 1x, 1.5x, 2x)
- [ ] Recording limits: 30s (quick), 45s (task), 3min (brain dump)
- [ ] Sub-200ms recording start latency
- [ ] Automatic crash recovery with "Keep/Discard" prompt
- [ ] Works offline with local storage

## Technical Requirements

### Architecture
```javascript
// Core components
VoiceRecorder.js          // MediaRecorder API wrapper
VoiceWaveform.js          // Real-time visualization  
VoicePlayer.js            // Playback with controls
VoiceAttachment.js        // Integration with tasks
VoiceRecovery.js          // Crash/interruption handling
```

### Recording Specifications
- **Audio format**: AAC-LC 64kbps mono (optimal quality/size)
- **Start latency**: <200ms (critical for impulsive capture)
- **Visual feedback**: Waveform at 44px+ height, high contrast
- **Touch target**: Record button minimum 48x48pt
- **File size**: ~480KB for 1 minute

### Duration Limits & Auto-stop
```javascript
const RECORDING_MODES = {
  quickThought: { 
    maxDuration: 30,
    autoStop: true,
    silenceDetection: 3 // seconds
  },
  taskExplanation: { 
    maxDuration: 45,
    pauseEnabled: true,
    autoStop: false
  },
  brainDump: { 
    maxDuration: 180,
    segmentAt: 120, // auto-segment at 2min
    pauseEnabled: true
  }
};
```

### Progressive Disclosure
1. **First 5 uses**: Show only record button
2. **After 5 uses**: Enable pause/resume
3. **After 10 uses**: Show playback speed controls  
4. **After 20 uses**: Enable transcription option

### Platform Implementation

**Web/PWA**:
```javascript
// Feature detection
if (navigator.mediaDevices && MediaRecorder) {
  // Full implementation
} else {
  // Graceful degradation message
}
```

**iOS**: Use Speech framework for future transcription
**Android**: MediaRecorder.AudioSource.VOICE_RECOGNITION

## ADHD Design Principles

1. **Reduce Cognitive Load**
   - One-tap recording (40-60% less cognitive load)
   - Visual waveform confirms recording active
   - Auto-save prevents loss from distraction

2. **Handle Interruptions**
   - Pause/resume for ADHD interruptions
   - Auto-save on app blur/background
   - Recovery prompt on restart

3. **Prevent Overwhelm**
   - Simple UI: record button, timer, waveform
   - Progressive disclosure of features
   - Clear visual feedback at every step

## Implementation Phases

### Phase 1: Basic Recording (2 days)
- [ ] MediaRecorder implementation
- [ ] One-tap toggle recording
- [ ] Basic waveform visualization
- [ ] Save to attachment storage

### Phase 2: Playback & Controls (2 days)
- [ ] Audio player with scrubbing
- [ ] Speed controls (preset buttons)
- [ ] Visual playback indicator
- [ ] Delete/re-record options

### Phase 3: Recovery & Polish (1 day)
- [ ] Interruption handling
- [ ] Crash recovery system
- [ ] Progressive disclosure logic
- [ ] Haptic feedback

## Error Handling
- **Microphone denied**: Clear visual guide to settings
- **Storage full**: Proactive warning at 90%
- **Recording interrupted**: Auto-save + resume prompt
- **App crash**: localStorage recovery on restart

## Testing Requirements
- [ ] Start latency <200ms verified
- [ ] Test all interruption scenarios
- [ ] Verify auto-save works
- [ ] Test on noisy environments
- [ ] Memory usage stays under 10MB
- [ ] Battery drain <5% per hour

## Performance Targets
- Recording start: <200ms
- Waveform render: 60fps
- Playback start: <100ms
- File save: <500ms
- Recovery check: <50ms on app start

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Works offline completely
- [ ] Graceful degradation on unsupported browsers
- [ ] No audio glitches or drops
- [ ] Accessibility verified (screen readers)
- [ ] Progressive disclosure implemented
- [ ] Error messages are ADHD-friendly

## References
- Research: 40-60% cognitive load reduction with voice
- Related: #53 (Photo attachments share UI patterns)
- Platform docs: Web Audio API, MediaRecorder