# Research Request: Voice UI/Interaction Patterns for ADHD Users

## Critical Context
**Note: I will not be available for follow-up questions. This document contains all necessary information for completing this research independently.**

## Project Background
StackMap is implementing voice memo attachments as part of our mobile attachment system. ADHD users often prefer voice input when text feels overwhelming, but poor voice UI can create new friction. We need research on voice patterns that specifically support executive dysfunction.

## Research Objectives

### Primary Questions
1. **Optimal Recording Length**: What duration limits prevent rambling but allow complete thoughts?
2. **Voice-to-Task Conversion**: Do users want transcription, and if so, when/how?
3. **Audio Feedback Patterns**: What sounds/haptics support without overwhelming?
4. **Hands-Free Operations**: Which voice commands are actually useful vs gimmicky?

### Secondary Questions
1. How do users prefer to review voice memos (visual waveform vs time display)?
2. Should voice memos auto-pause during silence?
3. What happens to abandoned recordings (auto-save vs discard)?
4. How to handle background noise and interruptions?

## Specific Research Areas

### 1. Recording Length Optimization
Research optimal durations for:
- **Quick thoughts**: 15-30 seconds?
- **Task explanations**: 1-2 minutes?
- **Brain dumps**: 2-5 minutes?
- **Maximum allowed**: Hard cut-off needed?

Consider:
- Storage implications
- Playback patience
- Cognitive load of long recordings
- Task granularity

### 2. Recording UI Patterns
Investigate effectiveness of:

**Start/Stop Mechanisms**
- Tap and hold (how long?)
- Toggle button (accidental stops?)
- Voice activated ("Start recording")
- Gesture based (swipe up?)

**Visual Feedback During Recording**
- Waveform animation
- Time counter
- Size indicator
- Pulse/breathing effect

**End of Recording Options**
- Auto-save
- Preview before save
- Quick re-record
- Add more

### 3. Playback Experience
Research preferences for:

**Visual Representation**
```
Option A: Waveform
[▁▃▅▇▅▃▁▃▅▇▅▃▁]

Option B: Time-based
[●────────────] 0:45/2:30

Option C: Compact
[🎤 2:30] (tap to expand)

Option D: Transcript preview
"Remember to call the..." [🎤 0:45]
```

**Playback Controls**
- Speed options (1x, 1.5x, 2x)
- Skip silence
- 10-second jump buttons
- Scrubbing sensitivity

### 4. Voice-to-Text Options
Investigate user needs:
- Automatic transcription?
- Manual request only?
- Accuracy requirements
- Edit capabilities
- Language detection

### 5. Error Handling
Research graceful failures:
- Microphone permission denied
- Storage full
- Recording interrupted
- Background app suspension
- Poor audio quality

## User Segments to Consider

### ADHD Subtypes & Voice Preferences
- **Hyperactive**: May record scattered, rapid thoughts
- **Inattentive**: May trail off or forget the point
- **Combined**: Need flexible options

### Use Case Scenarios
1. **Capture on the go**: Walking, driving, hands busy
2. **Bedtime thoughts**: Dark room, lying down
3. **Quick reminders**: Between tasks, time pressure
4. **Detailed planning**: Sitting, focused session
5. **Emotional processing**: Upset, overwhelmed

### Accessibility Needs
- **Motor differences**: Difficulty with precise taps
- **Speech differences**: Stutters, pauses, accents
- **Sensory preferences**: Audio feedback tolerance
- **Language processing**: Native vs second language

## Research Methods to Use

### Literature Review Topics
1. ADHD and verbal processing advantages
2. Voice UI accessibility guidelines
3. Cognitive load in audio interfaces
4. Memory retention: audio vs text
5. Speech patterns in neurodivergent populations

### Competitive Analysis
Study voice implementations in:
- **Just Press Record**: Simple, focused
- **Otter.ai**: Transcription-first
- **Day One**: Audio journals
- **Bear**: Voice notes in text
- **Google Keep**: Quick voice memos
- **Apple Voice Memos**: System default

### User Research to Reference
Look for studies on:
- Voice memo usage patterns
- Abandonment rates by length
- Playback frequency
- Transcription accuracy needs
- Privacy concerns

## Specific Interaction Patterns to Design

### 1. Quick Capture Flow
```
State 1: Ready
[🎤 Tap to record]

State 2: Recording
[⏺ Recording... 0:03]
[Waveform visual]
[Tap anywhere to stop]

State 3: Recorded
[▶ Play] [💾 Save] [🗑 Delete]
"Grocery list for tomorrow"
```

### 2. Hands-Free Flow
```
"Hey StackMap"
→ [Listening sound]

"Add voice note"
→ "What's your note?"

[Records until pause]
→ "Got it. Save this?"

"Yes"
→ [Success haptic]
```

### 3. Review and Edit Flow
```
Voice Memo (0:45)
├─ Play at: [1x] 1.5x 2x
├─ Jump: [<<10s] [10s>>]
├─ Transcript: [Generate]
└─ Actions: [Share] [Delete]
```

## Expected Deliverables

### 1. Recording Guidelines (Priority: HIGH)
Specific recommendations for:
```
Quick Capture Mode:
- Max length: 60 seconds
- Auto-stop on 3s silence
- One-tap record
- Auto-save
- Visual: Simple timer

Detailed Mode:
- Max length: 5 minutes
- Manual stop only
- Pause/resume capable
- Preview before save
- Visual: Waveform

Hands-Free Mode:
- Max length: 2 minutes
- Voice activated start/stop
- Confirmation required
- Background capable
- Audio: Tone feedback
```

### 2. UI Component Specifications (Priority: HIGH)
Detailed designs for:

**Recording Button States**
- Default (ready)
- Pressed (about to record)
- Recording (active)
- Processing (saving)
- Playback available

**Waveform Display**
- Live recording visualization
- Playback position indicator
- Touch-to-seek interaction
- Compact vs expanded views

**Time Indicators**
- During recording
- During playback
- In list views
- Relative times ("2 min ago")

### 3. Audio Feedback Library (Priority: MEDIUM)
Define sounds for:
- Record start (subtle vs obvious)
- Record stop
- Auto-save confirmation
- Error states
- Playback complete

Include:
- Frequency ranges (avoid sensory triggers)
- Duration (short is better)
- Volume recommendations
- Haptic alternatives

### 4. Voice Command Set (Priority: LOW)
If implementing voice control:
```
Essential Commands:
- "Start recording"
- "Stop recording"
- "Play that back"
- "Save it"
- "Delete recording"
- "Try again"

Advanced Commands:
- "Add to today's tasks"
- "Set reminder for [time]"
- "Tag as [category]"
- "Send to [person]"
```

### 5. Error Handling Patterns (Priority: HIGH)
User-friendly solutions for:

**Permission Denied**
- Clear explanation
- Direct to settings
- Alternative input options

**Storage Full**
- Warning before recording
- Compression options
- Clear old recordings prompt

**Recording Failed**
- Auto-recovery attempt
- Partial save option
- Non-technical explanation

## Critical Considerations

### Privacy and Security
- Recordings contain sensitive thoughts
- Encryption requirements
- Sharing permissions
- Deletion must be permanent
- Clear data ownership

### Performance Constraints
- File size limits (5MB target)
- Compression without quality loss
- Background recording impact
- Battery usage concerns
- Memory management

### Platform Differences
**iOS**
- Audio session management
- Background capabilities
- Siri integration potential

**Android**
- Foreground service requirements
- Device-specific audio APIs
- Google Assistant potential

**Web/PWA**
- MediaRecorder API limits
- No background recording
- Browser permissions

## Edge Cases to Address

### The Rambler Problem
User records 10-minute stream of consciousness:
- How to gently enforce limits?
- Chunking into multiple recordings?
- Summary generation?

### The Perfectionist Problem
User re-records same thought 20 times:
- Quick redo options?
- Version history?
- "Good enough" encouragement?

### The Background Noise Problem
Recording in noisy environment:
- Noise reduction?
- Quality warnings?
- Re-record prompts?

### The Accidental Recording Problem
Pocket recordings, butt dials:
- Detection mechanisms?
- Auto-discard rules?
- Privacy implications?

### The Multiple Language Problem
User switches languages mid-recording:
- Transcription handling?
- Language detection?
- Mixed language support?

## Success Criteria

Your research should provide:
1. **Exact duration limits** based on ADHD attention spans
2. **Specific UI patterns** that reduce recording friction
3. **Audio feedback guidelines** that don't overwhelm
4. **Error handling flows** that maintain user confidence
5. **Platform-specific recommendations** for best experience

## Output Format

Deliver findings as:

1. **Executive Summary** (1 page)
   - Top insights
   - Must-implement features
   - Must-avoid patterns

2. **Detailed Findings** (8-12 pages)
   - User behavior patterns
   - UI effectiveness data
   - Technical constraints
   - Accessibility requirements

3. **Design Specifications** (10-15 pages)
   - Component layouts
   - Interaction flows
   - State diagrams
   - Animation timings

4. **Implementation Guide** (5-7 pages)
   - API requirements
   - Data models
   - Performance targets
   - Testing criteria

5. **Appendices**
   - Research citations
   - Competitive screenshots
   - Audio file specifications
   - Platform guidelines

## Timeline
Complete within 7-10 days. Prioritize recording guidelines and UI specifications as these directly impact our attachment implementation.

## Final Notes

Remember:
- ADHD users may have racing thoughts that are hard to capture in text
- Voice memos should reduce friction, not add complexity
- Some users have speech differences or anxiety about their voice
- Privacy is paramount - these are personal thoughts
- The best voice UI is invisible when it works

The goal: Make voice memos so easy that users choose them naturally when text feels hard, not because we pushed them there.