# Restructured StackMap Development Roadmap
## Restoring Legacy Functionality with Modern Inclusivity

### Core Philosophy
**"Complete the core before adding the clever"** - Focus on restoring all legacy StackMap functionality with enhanced accessibility and neurodivergent-friendly design before adding new intelligent features.

---

## 🚨 Round 6 REVISED: Critical Core Completion
**Theme**: "Make it work like StackMap again"

### Story #98: Enhanced Edit Mode UX (Dev 2) - IN PROGRESS
- Complete the CSS implementation
- Restore direct manipulation interface
- **Status**: JavaScript done, CSS needed

### Story #108: Day Management System (Dev 3) - MOVED UP
**Priority**: CRITICAL - This is THE core feature
- Today/Tomorrow toggle in header
- Smooth day switching with animations
- URL state management (?day=tomorrow)
- Activity filtering by day
- **Why now**: Users literally cannot use Tomorrow without this

### Story #110: Complete Day Workflow (Dev 1) - MOVED UP
**Priority**: CRITICAL - Daily planning cornerstone
- Full legacy workflow implementation
- Move tomorrow → today
- Keep pinned items for tomorrow
- Clear unpinned from tomorrow
- **Why now**: Core daily planning ritual must work

---

## Round 7: Core Legacy Restoration
**Theme**: "Complete the essential daily workflow foundation"

### Story #107: User Data Separation (Dev 1) - CRITICAL
**Priority**: CRITICAL - Multi-user households broken
- Complete user profile isolation
- Per-user activity storage
- User-specific settings and custom titles
- Guest mode improvements
- **Enhanced**: Visual user avatars and color coding

### Story #111: Someday Support (Dev 2) - CRITICAL
**Priority**: CRITICAL - Missing core timeframe
- Add "Someday" to Today/Tomorrow view
- Move activities to Someday bucket
- Someday activity management and editing
- Visual differentiation from Today/Tomorrow
- **Enhanced**: Someday as "parking lot" for overwhelmed users

### Story #112: Complete Day Workflow (Dev 3) - CRITICAL
**Priority**: CRITICAL - Core daily ritual missing
- "Complete Day" button functionality
- Move today → yesterday, tomorrow → today
- Keep pinned activities for tomorrow
- Rollover incomplete items with choices
- **Enhanced**: Gentle completion celebration and fresh start feeling

---

## Round 8: Essential Activity Features
**Theme**: "Pin system and activity types - core workflow building blocks"

### Story #115: Pin/Keep System (Dev 1) - CRITICAL  
**Priority**: CRITICAL - Activities that survive day completion
- Pin activities to stay for tomorrow
- Visual pin indicators on cards
- Pin toggle in edit mode and inline controls
- Pinned items persist through Complete Day
- **Enhanced**: Different pin types (daily habits, ongoing projects)

### Story #116: Activity Types & Categories (Dev 2) - CRITICAL
**Priority**: CRITICAL - Missing activity organization
- Recurring activities (daily/weekly patterns)
- Frequent activities (reusable templates)
- Single-use activities (one-time tasks)
- Visual type indicators and colors
- **Enhanced**: ADHD-friendly visual categorization system

### Story #117: Display Modes (Dev 3) - CRITICAL
**Priority**: CRITICAL - User preference for time display
- Numbers mode (1, 2, 3, 4 hour estimates)
- Times mode (9:00 AM, 10:30 AM scheduled times)
- Toggle between modes per user preference
- Mode persistence and user settings
- **Enhanced**: Time blindness accommodations in both modes

---

## Round 9: Enhanced Search & Organization
**Theme**: "Find and organize activities efficiently"

### Story #118: Card Library System (Dev 1) - HIGH
**Priority**: HIGH - Essential activity management
- Browse comprehensive activity library
- Search and filter activities by category
- Add from library to any timeframe
- Custom activity creation and templates
- **Enhanced**: ADHD-friendly categorization and visual search

### Story #119: Enhanced Filtering & Search (Dev 2) - HIGH  
**Priority**: HIGH - Edit mode search capabilities
- Filter activities by type, category, completion
- Search activities by title and description
- Quick filter buttons (pinned, recurring, etc.)
- Save filter preferences per user
- **Enhanced**: Smart filter suggestions based on usage patterns

### Story #120: Bulk Operations (Dev 3) - MEDIUM
**Priority**: MEDIUM - Efficiency for power users
- Select multiple activities (checkbox mode)
- Bulk delete selected activities  
- Bulk move between timeframes
- Bulk pin/unpin operations
- **Enhanced**: Undo support for all bulk operations

---

## Round 10: Data Safety & Backup
**Theme**: "Protect user data and enable portability"

### Story #121: Backup & Export System (Dev 1) - HIGH
**Priority**: HIGH - Data safety and portability
- Automatic local backups (daily/weekly)
- Export to common formats (JSON, CSV, PDF)
- Manual backup creation and management
- Visual backup timeline and status
- **Enhanced**: ADHD-friendly automated data protection

### Story #122: Import & Data Recovery (Dev 2) - HIGH
**Priority**: HIGH - Data portability and recovery
- Import from CSV, JSON, other task apps
- Conflict resolution during import
- Data validation and cleanup
- Restore from backup files
- **Enhanced**: Smart duplicate detection and merging

### Story #123: Activity History & Archive (Dev 3) - MEDIUM
**Priority**: MEDIUM - Long-term activity tracking
- Completed activity history view
- Search historical activities
- Archive old completed activities
- Restore activities from archive
- **Enhanced**: Visual history browser with date filters

---

## Round 11: Intelligence Layer (Only After Core is Rock-Solid)
**Theme**: "Smart suggestions and gentle insights - NO PRESSURE"

### Story #124: Smart Activity Suggestions (Dev 1) - LOW
**Priority**: LOW - Optional intelligence layer  
- Context-aware activity suggestions
- Learning from user patterns (privacy-first)
- Gentle suggestion system (easily dismissed)
- Smart category suggestions
- **Enhanced**: ADHD-friendly suggestions (helpful, not overwhelming)

### Story #125: Gentle Progress Insights (Dev 2) - LOW
**Priority**: LOW - Supportive analytics (NO SHAME)
- Non-judgmental progress patterns
- Celebration of any completion
- Gentle pattern recognition
- Supportive insights (never critical)
- **Enhanced**: ADHD-friendly metrics focused on wins

### Story #126: Intelligent Scheduling Support (Dev 3) - LOW  
**Priority**: LOW - Optional scheduling assistance
- Smart time estimation suggestions
- Energy-level aware scheduling
- Gentle scheduling recommendations
- Flexible scheduling patterns
- **Enhanced**: ADHD-friendly scheduling that adapts to real life
- Activity breakdown assistance
- Smart time estimates
- Context-aware suggestions
- **Enhanced**: User remains in control

---

## Round 12: Advanced Features (Future Vision)
**Theme**: "Beyond the original"

### Story #120: Collaboration Features
- Share activities with family/team
- Delegate activities
- Shared templates
- Activity comments

### Story #121: Integration Hub
- Calendar app sync
- Task app import/export
- API for third-party tools
- Webhook support

### Story #122: Accessibility Excellence
- Screen reader optimization
- Voice control throughout
- Switch control support
- Cognitive load indicators

## Round 12: Time Management Enhancement  
**Theme**: "Advanced time features for those who want them"

### Story #127: Enhanced Time Fields (Dev 1) - MEDIUM
**Priority**: MEDIUM - Advanced time input
- Dedicated time input fields and pickers
- Duration vs deadline differentiation  
- Visual time representations and helpers
- Time estimation learning system
- **Enhanced**: Time blindness accommodations and gentle time awareness

### Story #128: Calendar Integration (Dev 2) - MEDIUM
**Priority**: MEDIUM - Calendar view and planning
- Week/month calendar views
- Drag activities to calendar slots
- Visual time blocking interface
- Calendar import/export
- **Enhanced**: ADHD-friendly visual density controls

### Story #129: Reminders & Notifications (Dev 3) - MEDIUM
**Priority**: MEDIUM - Gentle executive function support
- Customizable reminder system
- Multiple notification styles
- Smart reminder timing
- Do Not Disturb modes
- **Enhanced**: Sensory-friendly notification options

## Round 13: Polish & Accessibility Excellence
**Theme**: "Perfecting the experience for everyone"

### Story #130: Accessibility Audit & Enhancement (Dev 1) - HIGH
**Priority**: HIGH - Universal access
- Comprehensive screen reader optimization
- Voice control throughout app
- Switch control support
- Cognitive load indicators and reduction
- **Enhanced**: Multiple accessibility preference profiles

### Story #131: Performance & Stability Final Pass (Dev 2) - HIGH  
**Priority**: HIGH - Rock-solid reliability
- Performance optimization final audit
- Memory leak detection and fixes
- Battery usage optimization
- Offline reliability enhancement
- **Enhanced**: ADHD-friendly error recovery and stability

### Story #132: Visual Polish & Animation Refinement (Dev 3) - MEDIUM
**Priority**: MEDIUM - Delightful micro-interactions
- Refined animation timing and easing
- Improved visual feedback systems
- Enhanced state transitions
- Sensory preference respect
- **Enhanced**: Reduced motion respect and alternative feedback

## Round 14: Launch Preparation & Documentation
**Theme**: "Ready for the world"

### Story #133: User Testing & Feedback Integration (All Devs) - HIGH
**Priority**: HIGH - Real-world validation
- Comprehensive user testing with ADHD/autism community
- Feedback integration and iteration
- Accessibility testing with disabled users
- Performance testing across devices
- **Enhanced**: Inclusive testing methodology

### Story #134: Documentation & Help System (All Devs) - HIGH
**Priority**: HIGH - User onboarding and support
- Interactive tutorial system
- Context-sensitive help
- Accessibility guide
- Troubleshooting documentation  
- **Enhanced**: Multiple learning style accommodations

### Story #135: Launch Infrastructure (All Devs) - HIGH
**Priority**: HIGH - Production readiness
- Production deployment pipeline
- Error monitoring and reporting
- Performance monitoring
- User feedback collection system
- **Enhanced**: Privacy-first analytics and monitoring

---

## Key Principles for All Stories

### 1. **Legacy First**
Every legacy feature must be restored before adding new intelligence

### 2. **Inclusive Enhancement**
Each restored feature should be MORE accessible than the original

### 3. **ADHD/Autism Friendly**
- No judgment or shame
- Flexible and forgiving
- Visual and clear
- Predictable behavior

### 4. **Mobile-First Implementation**
- Touch-friendly (60px targets in safe mode)
- Gesture support
- Offline-first
- Performance focused

### 5. **Progressive Disclosure**
- Simple by default
- Power features discoverable
- No overwhelming interfaces
- Clear information hierarchy

---

## Success Metrics

### Round 6 Complete When:
- Users can manage both Today and Tomorrow
- Complete day workflow fully functional
- Edit mode provides direct manipulation

### Rounds 7-8 Complete When:
- All legacy features restored
- Multi-user support functional
- Data safety guaranteed

### Rounds 9-10 Complete When:
- Time management enhanced beyond original
- Progress tracking without judgment
- Full feature parity plus improvements

### Intelligence Layer (11+) Only When:
- Core is rock-solid
- Users explicitly request smart features
- All suggestions are optional

---

## Migration Notes

### Immediate Actions:
1. Move Story #108 & #110 to Round 6
2. Create new stories for missing legacy features
3. Push intelligence features to Round 11+
4. Add inclusive enhancements to each story

### Communication:
- Inform all developers of priority shift
- Emphasize "restoration before innovation"
- Share ADHD/autism-friendly principles
- Celebrate legacy feature completions

---

**The goal: Make StackMap everything it was, but more accessible, more reliable, and more inclusive - THEN add the smart features.**