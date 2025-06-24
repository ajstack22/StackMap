# Research Request: Time Perception & Task Aging for ADHD Users

## Critical Context
**Note: I will not be available for follow-up questions. This document contains all necessary information for completing this research independently.**

## Project Background
StackMap is implementing a "Today/Tomorrow" feature to address time blindness in ADHD users. We need research on how users perceive task age and staleness to design appropriate visual indicators and rollover behaviors that help rather than shame.

## Research Objectives

### Primary Questions
1. **Time Perception Patterns**: How do ADHD users experience the passage of time for undone tasks?
2. **Staleness Thresholds**: At what point does a task feel "stale" vs "abandoned" vs "still relevant"?
3. **Visual Aging Indicators**: What visual cues effectively communicate task age without inducing shame?
4. **Rollover Preferences**: How often should tasks automatically move forward vs require manual intervention?

### Secondary Questions
1. Does showing exact age (e.g., "5 days old") help or hurt?
2. How does task type affect acceptable aging (e.g., appointments vs someday tasks)?
3. What metaphors resonate (e.g., "aging" vs "waiting" vs "resting")?
4. Should age indicators be always visible or revealed on hover/tap?

## Specific Research Areas

### 1. Time Blindness Patterns
Research how ADHD users experience:
- **Yesterday**: Is it recent or ancient history?
- **Last Week**: Does it exist in memory?
- **Last Month**: Completely forgotten or source of guilt?
- **Seasonal Tasks**: How to handle recurring but infrequent tasks?

### 2. Visual Aging Systems
Investigate effectiveness of:
- **Color Gradients**: Fresh → Stale (which colors?)
- **Opacity Changes**: Fading older tasks
- **Size Changes**: Shrinking older tasks
- **Icon Indicators**: Clock, calendar, aging symbols
- **Text Indicators**: Relative vs absolute time
- **Progressive Disclosure**: Hidden by default, shown on request

### 3. Emotional Impact
Understand user feelings about:
- Seeing old undone tasks
- Tasks that auto-rollover
- Tasks that require manual movement
- Hidden vs visible task counts
- Group vs individual task aging

### 4. Behavioral Patterns
Document common behaviors:
- Task abandonment thresholds
- Re-engagement triggers
- Procrastination cycles
- Shame avoidance tactics
- Success patterns

## User Segments to Consider

### ADHD Presentations
- **Time Blind**: No sense of passing time
- **Time Anxious**: Hyper-aware and stressed
- **Time Optimistic**: Always think they have more time
- **Time Inconsistent**: Varies by context/mood

### Task Relationships
- **Guilt-Driven**: Old tasks = personal failure
- **Out-of-Sight**: Forgotten tasks don't exist
- **Perfectionist**: Can't mark partial completion
- **Avoider**: Ignore until crisis

### Coping Strategies
- **Fresh Start**: Delete everything and begin again
- **Batch Process**: Deal with all old tasks at once
- **Selective Blindness**: Pretend they don't exist
- **Constant Rollover**: Everything moves to tomorrow

## Research Methods to Use

### Literature Review Focus
1. ADHD time perception studies
2. Prospective memory research
3. Task aging in project management
4. Behavioral psychology of procrastination
5. Visual perception of temporal information

### Existing Studies to Find
- Studies on ADHD and temporal processing
- Research on task management and executive function
- UX studies on reminder systems
- Psychology of guilt and shame in task completion

### Competitive Analysis
Research how others handle task aging:
- **Things 3**: "Anytime" list
- **OmniFocus**: Defer dates
- **Todoist**: Rescheduling patterns
- **Any.do**: Moment feature
- **TickTick**: Overdue task handling

## Specific Design Patterns to Investigate

### Aging Indicators
Research effectiveness of:

1. **Subtle Aging** (Low Shame)
```
Today: Full opacity, normal size
1-3 days: 95% opacity, warm gray tint
4-7 days: 90% opacity, cooler gray
7+ days: 85% opacity, blue-gray
```

2. **Badge System** (Medium Visibility)
```
New: No badge
1-3 days: Small dot
4-7 days: Number badge
7+ days: "↻" symbol
```

3. **Progressive Hiding** (Out of Sight)
```
Today: Visible
Tomorrow: Visible
3+ days: Collapsed section
7+ days: Hidden (count only)
```

### Rollover Behaviors
Compare effectiveness of:

1. **Automatic Daily Rollover**
- All incomplete → Tomorrow at 4 AM
- Pros/cons for different user types

2. **Decay System**
- Today → Tomorrow (auto)
- Tomorrow → This Week (prompt)
- This Week → Someday (manual)

3. **Stacking System**
- Accumulate in Today until acted upon
- Visual indication of "pile height"

4. **Freshness Reset**
- User can "refresh" task to reset age
- Maintains history but appears new

## Expected Deliverables

### 1. Aging Indicator Framework (Priority: HIGH)
Provide specific recommendations:
```
Task Age 0-1 days:
- Visual: 100% opacity, no indicators
- Label: No age shown
- Behavior: Normal
- Emotion: Neutral/positive

Task Age 2-3 days:
- Visual: 95% opacity, subtle warm tint
- Label: Still no age shown
- Behavior: Gentle pulse on hover
- Emotion: Gentle reminder

Task Age 4-7 days:
- Visual: 90% opacity, date badge appears
- Label: "From [day]" (not "X days old")
- Behavior: Suggest refresh option
- Emotion: Supportive

Task Age 7+ days:
- Visual: 85% opacity, special section
- Label: "Waiting for you"
- Behavior: Offer archive/refresh/delete
- Emotion: Non-judgmental
```

### 2. Language Guidelines (Priority: HIGH)
Non-shameful ways to describe aging:
- ❌ "Overdue for 5 days"
- ✅ "From last Tuesday"
- ❌ "Ancient task"
- ✅ "Been waiting a while"
- ❌ "Failed to complete"
- ✅ "Still here when ready"

### 3. Interaction Patterns (Priority: HIGH)
Detail user flows for:
- Viewing aged tasks
- Refreshing old tasks
- Bulk time management
- Setting task "expiration"
- Acknowledging without completing

### 4. Configuration Options (Priority: MEDIUM)
What settings to offer:
- Aging visibility (always/hover/never)
- Rollover time (midnight/4am/custom)
- Auto-archive threshold
- Shame-free mode options

### 5. Implementation Specifications (Priority: HIGH)
Technical requirements:
```javascript
// Data model additions
task.createdAt // timestamp
task.lastRolledOver // timestamp
task.rolloverCount // integer
task.freshnessResetAt // timestamp
task.userAcknowledgedAge // boolean

// Visual states
.task-fresh // 0-1 days
.task-aging // 2-6 days
.task-aged // 7+ days
.task-refreshed // User reset age
```

## Critical Edge Cases

### The Returning User Problem
User opens app after 30 days absence:
- How to present 30 days of aged tasks?
- Bulk operations needed?
- Welcome back messaging?

### The Important but Procrastinated
Some tasks are critical but avoided:
- Medical appointments
- Tax filings
- Difficult conversations
How to age these differently?

### The Seasonal Task
Tasks that are only relevant periodically:
- Holiday shopping
- Seasonal maintenance
- Annual renewals
How to handle their aging?

### The Someday/Maybe Confusion
Tasks without clear timeline:
- "Learn piano"
- "Read that book"
- "Call old friend"
Should these age at all?

## Research Constraints

### Ethical Considerations
- Never shame users for old tasks
- Respect neurodivergent time perception
- Avoid productivity toxic culture
- Support self-compassion

### Technical Limitations
- Performance with 1000+ tasks
- Visual accessibility requirements
- Animation performance on old devices
- Storage of temporal metadata

### Cultural Factors
- Different cultures view time differently
- Work week variations
- Holiday and weekend handling
- International date formats

## Success Metrics for Research

Your research should enable us to:
1. Define exact aging thresholds that feel natural to ADHD users
2. Design visual indicators that inform without shaming
3. Create rollover rules that reduce cognitive load
4. Write messaging that acknowledges time blindness with compassion
5. Build features that work with, not against, ADHD brains

## Output Format

Structure your findings as:
1. **Executive Summary** (1 page)
   - Key insights
   - Top 5 recommendations
   - Critical warnings

2. **Detailed Findings** (10-15 pages)
   - Time perception patterns
   - Visual design recommendations
   - Behavioral insights
   - Supporting research

3. **Design Specifications** (5-7 pages)
   - Exact visual states
   - Animation timings
   - Color/opacity values
   - Typography rules

4. **Implementation Guide** (3-5 pages)
   - Data model requirements
   - State management
   - Performance considerations
   - A/B test suggestions

5. **Appendices**
   - Research citations
   - User quotes if available
   - Competitive screenshots
   - Related studies

## Timeline
Complete within 10-14 days. Prioritize the aging indicator framework and visual specifications as these directly impact our Today/Tomorrow implementation.

Remember: Time blindness is not a character flaw. It's a neurological difference. Our design should support, not shame.