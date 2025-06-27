# Story: Photo Attachment UI Optimization

## 🚀 Developer Launch Prompt

**Hello Developer!** You're optimizing photo attachments for ADHD users with motor and visual processing challenges. Your mission:

1. **Read this entire story** to understand the 64x64px thumbnail requirement
2. **Create your implementation plan** in `4-PlanReview/53-photo-attachments.md`
3. **Focus on**: 6-photo max display, 48x48px touch targets, <500ms performance
4. **Test on**: 512MB RAM Android device (this is critical!)

Ready? Let's make photo attachments work for users who need visual memory aids!

---

**GitHub Issue**: #53 - UI: Photo Attachments Display (No Upload)
**Research**: Optimal photo attachment UI design for adult ADHD task apps

## User Story
As an ADHD user, I want to attach and view photos on my tasks with minimal cognitive load, so that I can use visual aids for memory support without getting overwhelmed or frustrated by complex interactions.

## Acceptance Criteria
- [ ] Photos display as 64x64px thumbnails in task cards
- [ ] Maximum 6 photos visible per screen (3x2 grid)
- [ ] All touch targets minimum 48x48px (60x60px for primary actions)
- [ ] Tap to view full screen with zoom controls
- [ ] Clear visual indicator when photos attached (count badge)
- [ ] Works smoothly on 512MB RAM devices
- [ ] Photo operations complete within 500ms

## Technical Requirements

### Architecture
```javascript
// Components needed
PhotoAttachmentUI.js      // Main UI component
PhotoThumbnailGrid.js     // Grid display (max 6)
PhotoViewer.js            // Full screen viewer
PhotoOptimizer.js         // Already exists
```

### Display Specifications
- **Thumbnail size**: 64x64px (optimal recognition without overwhelm)
- **Grid layout**: 3x2 maximum (6 photos visible)
- **Spacing**: 16px between thumbnails
- **Touch targets**: 48x48px minimum overlay on thumbnails
- **Load strategy**: Progressive (skeleton → thumbnail → full)

### Performance Requirements
- Thumbnail generation: <200ms
- Grid render: <100ms  
- Full photo load: <500ms
- Memory usage: <50MB for 6 photos
- Smooth scrolling: 60fps

### ADHD-Specific Features
1. **Visual Density Control**
   - Max 6 photos visible (prevents overwhelm)
   - Clear spacing between elements
   - Option to view as list (23% more effective)

2. **Motor Accessibility**
   - Large touch targets (48x48px min)
   - Tap-based zoom (not pinch)
   - Plus/minus zoom buttons at 48x48px

3. **Cognitive Load Reduction**
   - Progressive disclosure (show 3, tap for more)
   - Color coding by category
   - Chronological ordering by default

## Implementation Plan

### Phase 1: Thumbnail Display
- Integrate with existing PhotoOptimizer.js
- Create 64x64px thumbnail generation
- Implement 3x2 grid layout
- Add to task card display

### Phase 2: Full Screen Viewer
- Tap thumbnail to open viewer
- Button-based zoom controls
- Swipe between photos
- Close with large X button (60x60px)

### Phase 3: Performance & Polish
- Implement progressive loading
- Add skeleton screens
- Optimize for low-RAM devices
- Add haptic feedback

## Testing Requirements
- [ ] Test on 512MB RAM Android device
- [ ] Verify all touch targets ≥48x48px
- [ ] Measure response times <500ms
- [ ] Test with 1-6 photos per task
- [ ] Verify accessibility with TalkBack/VoiceOver
- [ ] Test rapid photo switching

## Dependencies
- PhotoOptimizer.js (exists)
- Attachment storage system (exists)
- Task display system (exists)

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Performance targets achieved
- [ ] Works on low-end devices
- [ ] No memory leaks
- [ ] Smooth 60fps scrolling
- [ ] Accessibility verified
- [ ] User feedback positive

## References
- Research: Performance thresholds show 500ms critical threshold
- Design: Material Design accessibility (48dp targets)
- Related: #24 (Attachment system), #55 (Storage fixes)