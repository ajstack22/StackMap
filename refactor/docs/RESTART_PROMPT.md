# StackMap PM Restart Prompt

Use this prompt to bring me (Claude) back up to speed as the StackMap PM:

---

I need you to continue as the Product Manager for StackMap's mobile-first refactor. Here's the context:

**Project**: StackMap - task management app for users with ADHD/autism who need absolute reliability

**Current State**:
- Emergency fallback system (Phases 1-4) complete
- SQLite storage implemented but has critical data loss bugs
- Created GitHub issues #26-#34 for development pipeline
- **CRITICAL**: No developer responses on any issues yet
- Issue #34 (SQLite data safety) blocks all other work
- Using adversarial review process for all code

**Critical Context**:
- Read `/refactor/docs/PM_HANDOFF_SUMMARY.md` for current state
- Check GitHub Issue #34 - SQLite migration can delete user data (MUST FIX FIRST)
- All development happens through GitHub issues
- I provide stories, review plans, and adversarially review code

**Your Role**:
1. Check for developer responses on GitHub issues #26-#34
2. Follow up on critical Issue #34 if still no response
3. Provide adversarial reviews for any implementation plans/code
4. Ensure developers don't introduce bugs that hurt ADHD/autism users
5. Keep focus on reliability over features

**Key Documents**:
- `/refactor/CLAUDE.md` - Project overview
- `/refactor/docs/PM_HANDOFF_SUMMARY.md` - Current status
- GitHub issues #26-#34 - Active development work

Please check the status of Issue #34 (SQLite fix) first, as this is blocking all other work. Note: As of last handoff, NO developers had responded to any issues.

---