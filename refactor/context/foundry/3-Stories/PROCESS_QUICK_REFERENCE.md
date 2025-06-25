# 🚀 Quick Process Reference Card

## Your Story Implementation Checklist

### ☐ Phase 1: PLANNING (Before ANY coding!)
```bash
# 1. Navigate to project
cd /Users/adamstack/StackMap/StackMap

# 2. Read your story
cat refactor/context/foundry/3-Stories/r3_dev[X]_story_[XX]_*.md

# 3. Create your plan
touch refactor/context/foundry/4-PlanReview/r3_dev[X]_story_[XX]_plan.md
```

**Plan MUST include:**
- [ ] Files to modify
- [ ] Specific changes
- [ ] Testing approach
- [ ] Risk assessment

### ☐ Phase 2: APPROVAL WAIT
- Submit plan to `4-PlanReview`
- **STOP and WAIT** for approval
- Check for feedback
- Update plan if requested

### ☐ Phase 3: IMPLEMENTATION (After approval ONLY!)
```bash
# Start coding according to plan
# Test as you go
# No console.log statements!
```

### ☐ Phase 4: TESTING
- [ ] All acceptance criteria met
- [ ] Mobile viewports (320px, 375px, 768px)
- [ ] Safe mode (`?safe=true`)
- [ ] No console errors
- [ ] Integration with other features

### ☐ Phase 5: DOCUMENTATION
```bash
# Create close report
touch refactor/context/foundry/6-CodeReview/r3_dev[X]_story_[XX]_close_report.md
```

## 🛑 STOP Signs

**STOP if you haven't:**
- ❌ Created a plan
- ❌ Received plan approval  
- ❌ Tested your changes
- ❌ Documented implementation

## 📁 File Locations

- **Your Story**: `/3-Stories/r3_dev[X]_story_[XX]_*.md`
- **Your Plan**: `/4-PlanReview/r3_dev[X]_story_[XX]_plan.md`
- **Your Report**: `/6-CodeReview/r3_dev[X]_story_[XX]_close_report.md`
- **Process Guide**: `/3-Stories/DEVELOPER-STANDARD-PROCESS.md`

## 🎯 Remember

1. **PLAN FIRST** - No code without approved plan
2. **TEST EVERYTHING** - Especially mobile
3. **DOCUMENT ACCURATELY** - Report must match code

## ⚡ Quick Commands

```bash
# See all Round 3 stories
ls refactor/context/foundry/3-Stories/r3_*

# Check plan status
ls refactor/context/foundry/4-PlanReview/

# Run the app
open refactor/index.html

# Test safe mode
open refactor/index.html?safe=true
```

---
**The Golden Rule**: If you haven't written a plan, don't write code!