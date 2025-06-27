# Neurodivergent-Friendly Conflict Resolution UX: A Practical Implementation Guide

## Communicating sync conflicts without causing anxiety

Research reveals that both ADHD and autistic users experience heightened anxiety around decision-making and unexpected changes. Academic studies show autistic individuals have "low tolerance to uncertainty" while ADHD users struggle with "choice paralysis" when faced with multiple options.

**Key communication strategies:**
- Lead with reassurance: "Your work is safe—we've saved both versions"
- Use progressive disclosure to reveal complexity gradually
- Avoid time pressure indicators or countdown timers
- Frame conflicts as normal occurrences: "This happens when teammates work together"

**Recommended notification pattern:**
```
✓ Two versions of your file exist
Both are safely saved. You can review the differences 
and choose which to keep when you're ready.

[Review Now] [Remind Me Later]
```

## Visual metaphors for ADHD users

ADHD users process concrete visual metaphors better than abstract concepts. Research shows they respond well to familiar, tangible representations rather than technical abstractions.

**Effective visual metaphors:**
- **Side-by-side documents:** Show conflicting versions as two physical papers rather than abstract "branches"
- **Traffic lights:** Use color coding (green=resolved, yellow=needs attention, red=conflict) with clear labels
- **Journey paths:** Represent resolution as steps on a path with clear progress indicators
- **Puzzle pieces:** Show how different edits can fit together or clash

**Implementation example:**
```
Your Version        Their Version
[Doc icon]          [Doc icon]
│                   │
└───── ? ──────┘
   Which to keep?
```

## Auto-resolution vs user choice

Research strongly indicates different preferences between ADHD and autistic users. Autistic users prefer predictability and control, while ADHD users benefit from reduced decision points but need safeguards against impulsivity.

**Recommended hybrid approach:**
1. **Default to auto-resolution** for minor conflicts (formatting, timestamps)
2. **Always provide undo** with clear 30-day retention
3. **Flag significant conflicts** requiring human judgment
4. **Offer user preferences** to customize automation level

**Progressive decision flow:**
```
Conflict detected → Auto-resolve if possible → 
Show notification with undo → 
If manual needed → Present simplified choice → 
Allow preview before confirming
```

## Specific preferences for autistic users

Autistic users strongly prefer explicit, predictable interfaces with clear cause-and-effect relationships. Research emphasizes their need for consistency and control over their environment.

**Design requirements:**
- **Explicit actions:** Always use clear labels like "Keep my version" rather than icons alone
- **Predictable patterns:** Maintain consistent conflict resolution flow across all file types
- **User control:** Allow saving preferences for future conflicts
- **No surprises:** Warn before any automatic actions

**Preference settings example:**
```
Conflict Resolution Preferences
□ Always ask me before resolving conflicts
□ Show me a preview of changes
□ Keep both versions when unsure
□ Notify me via: [Email] [In-app] [None]
```

## UI patterns that reduce cognitive load

Both ADHD and autistic users benefit from reduced cognitive load through careful information architecture and progressive disclosure.

**Effective patterns:**
1. **Three-option maximum:** Present no more than 3 choices initially
2. **Visual hierarchy:** Use size, color, and spacing to guide attention
3. **Chunked information:** Break complex conflicts into steps
4. **Escape routes:** Always provide "Cancel" or "Decide later" options

**Conflict resolution card pattern:**
```
┌─────────────────────────────┐
│ File: ProjectPlan.docx      │
│ ━━━━━━━━━━━━━━━━━━━━━━    │
│ Two edits at the same time  │
│                             │
│ [Keep Mine]  [Keep Theirs]  │
│                             │
│ [▼ See differences]         │
└─────────────────────────────┘
```

## Copy that reduces "fear of doing it wrong"

Research shows neurodivergent users experience significant anxiety about making irreversible mistakes. Copy should emphasize safety and provide reassurance throughout.

**Anxiety-reducing copy examples:**
- "Choose what works best (you can change this anytime)"
- "Both versions are saved—nothing will be lost"
- "Preview your choice before confirming"
- "Many people choose this option"
- "There's no wrong answer here"

**Button labels that provide clarity:**
- Instead of "Resolve" → "Keep my edits (undo available)"
- Instead of "Merge" → "Combine both versions safely"
- Instead of "Discard" → "Use their version (yours is backed up)"

## Decision-making support strategies

Academic research identifies executive dysfunction as a core challenge for both ADHD and autism, affecting decision-making capacity.

**Support mechanisms:**
1. **Visual comparison:** Side-by-side diff view with changes highlighted
2. **Decision aids:** "If you want X, choose this option"
3. **Save for later:** Allow postponing decisions without losing work
4. **Guided mode:** Step-by-step wizard for complex conflicts

**Decision support example:**
```
What matters most to you?
○ Keeping my recent changes
  → We'll preserve your edits from today
○ Getting everyone's input
  → We'll combine both versions
○ Having the latest info
  → We'll use their more recent version
```

## Successful app examples

Several apps have implemented neurodivergent-friendly conflict resolution:

**Google Docs:** Uses real-time collaboration to minimize conflicts, with automatic conflict file creation when needed. Clear naming like "Document [Conflict]" reduces ambiguity.

**Notion:** Provides version history with visual timeline, allowing users to preview and restore any version without fear of data loss.

**Dropbox:** Creates "conflicted copy" files automatically, preserving all versions with clear timestamps and device information.

## Academic research insights

Key findings from neurodiversity HCI research:

- **Cognitive Load Theory:** Neurodivergent users have reduced working memory capacity, requiring simplified interfaces
- **Enhanced Perceptual Processing:** Autistic users can process more visual information but are more susceptible to overload
- **Executive Function Support:** Both populations benefit from external memory aids and structured decision paths
- **Anxiety Triggers:** Unpredictability, time pressure, and ambiguous instructions significantly impact performance

## Specific implementation recommendations

**Visual design:**
- Use muted colors: Soft blues (#E3F2FD), greens (#E8F5E9), grays (#F5F5F5)
- Maintain 1.5x line spacing minimum
- Limit to 4-5 colors total
- Provide high contrast mode option

**Interaction patterns:**
- 10-second delay before allowing impulsive actions
- Auto-save every 30 seconds with visible confirmation
- Progressive disclosure with clear "Show more/less" controls
- Consistent button placement across all screens

**Copy guidelines:**
- 8th-grade reading level
- Active voice throughout
- 20 words per sentence maximum
- Avoid jargon completely

**Example implementation for 5% manual conflicts:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Team Planning Doc needs your input

What happened:
Sarah edited section 2
You also edited section 2
Both happened at 3:47 PM

Your options:
[Use my version]     [Use Sarah's version]
        [Compare side-by-side]
        
✓ No rush - take your time
✓ Both versions are saved
✓ You can undo any choice

[Decide later]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

This research-based approach balances the needs of ADHD users (reduced choices, visual clarity, impulsivity controls) with autistic users' requirements (predictability, explicit actions, user control) while reducing anxiety and cognitive load for all neurodivergent users.