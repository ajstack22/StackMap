# Undo System - Issue #47

## 📋 Story Overview

**As a** user with ADHD experiencing RSD (Rejection Sensitive Dysphoria)  
**I want** a forgiving undo system with a 30-second golden window  
**So that** I can recover from mistakes without emotional cascade

## 🎯 Key Requirements

### Timing Windows
- **30-second golden window**: Minimal anxiety, instant undo
- **2-minute threshold**: Manageable with clear feedback
- **10-minute point**: Psychological damage already done

### Visual Design
- **Colors**: Soft blues/greens (calm), warm amber warnings (no harsh reds)
- **Shapes**: Rounded corners, organic shapes, gentle gradients
- **Animation**: 200-300ms with ease-in-out curves

### Language Requirements
- **Never say**: "Error", "Failed", "Invalid", "Wrong", "Mistake"
- **Instead say**: "Let's try a different approach", "Want to go back?"

## 🚀 Developer Launch Prompt

**Hello Developer!** You're implementing an ADHD-friendly undo system that prevents emotional cascades.

1. **Read this entire story** to understand the 30-second golden window
2. **Create your implementation plan** in `4-PlanReview/46-undo-system.md`
3. **Focus on**:
   - Command pattern with intelligent batching
   - Visual previews of what will be undone
   - Progressive disclosure (simple → advanced)
   - Memory-efficient snapshots

## 📊 Technical Requirements

### Core Features
1. **Instant Undo** (<30 seconds)
   - Visible undo button immediately after actions
   - No confirmation needed for recent actions
   - Keyboard shortcut (Ctrl/Cmd+Z)

2. **Smart Grouping**
   - Batch micro-operations (individual keystrokes)
   - Group related actions (drag operations)
   - Clear scope indicators

3. **Visual Feedback**
   - Preview what will change
   - Gentle animations (no jarring transitions)
   - Clear success indicators

### Performance Targets
- Undo operation: <100ms
- Preview generation: <200ms
- Memory usage: <5MB for history
- History depth: Last 50 operations

## 🧪 Testing Scenarios

1. **Distraction Recovery**
   - User makes change, gets distracted for 45 seconds
   - Returns and immediately sees undo option
   - One-click recovery

2. **Hyperfocus Protection**
   - Rapid series of changes
   - Grouped intelligently
   - Can undo entire sequence

3. **RSD Prevention**
   - Accidental deletion
   - Immediate, visible recovery
   - Encouraging messaging

## ✅ Acceptance Criteria

- [ ] 30-second golden window implemented
- [ ] RSD-safe language throughout
- [ ] Visual previews before undo
- [ ] Progressive disclosure working
- [ ] Memory-efficient storage
- [ ] All timing thresholds met
- [ ] Accessibility verified

## 🔗 References

- Research: `2-ResearchReports/Designing ADHD-Friendly Undo Systems.md`
- Issue: #47
- Priority: High (RSD prevention critical)