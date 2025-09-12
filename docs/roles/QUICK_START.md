# StackMap Multi-Role System - Quick Start Guide

## 🚀 You're Live! The System is Ready

### Your New Workflow (Product Owner)

#### Morning (5 minutes)
```
You: "Focus on finishing edit mode today"
PM: "I'll prioritize packs 001 and 002. Starting with action buttons."
```

#### Midday (if needed)
```
PM: "Blocker on Android. Need different approach."
You: "Skip Android for now, web first"
```

#### Evening (3 minutes)
```
PM: "Pack 001 complete, 002 in progress. Ready for qual?"
You: "Ship 001"
```

## Current Prompt Packs Ready

1. **#001** - Edit Mode Add Action Buttons (High Priority)
2. **#002** - Edit Mode Implement Reordering (High Priority)
3. **#003** - Edit Mode Add Smooth Animations (Medium Priority)
4. **#004** - Cross Platform Testing (Medium Priority)

## How to Use the System

### View Current Work
```bash
./scripts/manage-prompt-packs.sh
# Select option 1 to list all packs
```

### Create New Work
Just tell the PM what you want:
```
You: "Users need dark mode"
PM: "I'll create packs for that"
```

Or create directly:
```bash
./scripts/create-prompt-pack.sh
```

### Check Progress
```bash
./scripts/manage-prompt-packs.sh
# Option 1 shows status of all work
```

## The Four Roles Are Ready

### 1. PM (Project Manager)
- **Role**: Orchestrate all work
- **Docs**: `/docs/roles/PM_ROLE.md`
- **You say**: "Work on edit mode"
- **PM does**: Creates packs, assigns work, tracks progress

### 2. DEV (Developer)  
- **Role**: Execute implementation
- **Docs**: `/docs/roles/DEV_ROLE.md`
- **Gets**: Prompt pack from PM
- **Delivers**: Working code

### 3. PR (Peer Reviewer - "Fury")
- **Role**: Aggressive code review
- **Docs**: `/docs/roles/PR_ROLE.md`
- **Finds**: Bugs, edge cases, issues
- **Prevents**: Production problems

### 4. ADMIN (Administrator)
- **Role**: Deployments and cleanup
- **Docs**: `/docs/roles/ADMIN_ROLE.md`
- **Handles**: Deploys, backups, maintenance
- **Keeps**: System running smoothly

## Start Your First Session

### As Product Owner (You):
```
"Let's get pack 001 done today"
```

### PM Response:
```
"Assigning pack 001 to DEV. It adds action buttons to the edit mode list.
I'll have it ready for review by end of day."
```

### That's It!
The system handles the rest. DEV implements, PR reviews if needed, ADMIN deploys when ready.

## Key Commands

### Deployment (when PM says ready)
```bash
./scripts/qual_deploy.sh     # To staging
./scripts/prod_deploy.sh all  # To production
```

### Pack Management
```bash
./scripts/manage-prompt-packs.sh  # Interactive management
./scripts/create-prompt-pack.sh   # Create new pack
```

## Success Metrics

You'll know it's working when:
- ✅ You spend <15 min/day managing
- ✅ Features ship without your involvement
- ✅ No more implementation details for you
- ✅ Just vision and decisions

## Problems?

If something's not working:
1. Check role docs in `/docs/roles/`
2. Run `./scripts/manage-prompt-packs.sh` to see status
3. Tell PM the issue - they'll handle it

## Your Vocabulary Cheat Sheet

### Instead of long explanations, just say:
- "Ship it"
- "Fix the sync bug"  
- "Focus on mobile"
- "Users need X"
- "Not priority"
- "Do that first"
- "Good enough"
- "Needs work"

## Remember

**You are the visionary, not the implementer.**

Every technical detail you handle is a strategic decision you're not making.

Let the system work FOR you.

---
*Multi-Role System v1.0 - Removing you as the bottleneck*
*Your time is now strategic, not tactical*