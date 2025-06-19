# CI/CD Development Launch Prompts

This directory contains ready-to-use launch prompts for implementing the CI/CD improvement plan with a 3-developer team.

## 🚀 Quick Start

Each developer should start with their Week 1 prompt and progress sequentially. The prompts are self-contained and include all necessary context.

## 📁 File Structure

### Week 1: Critical Fixes
- `week1-developer-a.md` - FTP Deployment Migration (Issues #12)
- `week1-developer-b.md` - Fix npm Hanging (Issue #14)
- `week1-developer-c.md` - Staging Environment Planning & Setup (Issue #15)

### Week 2: Foundation Building
- `week2-developer-a.md` - Atomic Deployment Structure (Issue #13)
- `week2-developer-b.md` - Pre-deployment Validation (Issue #17)
- `week2-developer-c.md` - Staging Pipeline & Rollback Part 1 (Issue #16)

### Week 3: Safety & Polish
- `week3-developer-a.md` - Production Hardening & Integration Lead
- `week3-developer-b.md` - Performance Monitoring & Metrics
- `week3-developer-c.md` - Rollback System Completion & Recovery

### Integration
- `team-integration.md` - Final integration and go-live coordination

## 👥 Team Assignment

### Developer A: Infrastructure & Deployment Lead
- **Focus:** FTP migration, atomic deployments, production hardening
- **Issues:** #12, #13
- **Skills:** DevOps, shell scripting, server management

### Developer B: Build Pipeline Specialist
- **Focus:** npm fixes, build optimization, validation, monitoring
- **Issues:** #14, #17
- **Skills:** Node.js, GitHub Actions, performance optimization

### Developer C: Environment & Recovery Systems
- **Focus:** Staging setup, rollback system, disaster recovery
- **Issues:** #15, #16
- **Skills:** Full-stack, security, UI/UX for admin tools

## 📋 How to Use These Prompts

1. **Copy the entire prompt** from the relevant week/developer file
2. **Paste into Claude Code** exactly as written
3. **Provide context files** listed at the bottom of each prompt
4. **Follow the implementation** as Claude Code guides you
5. **Test thoroughly** before moving to the next task

## ⚡ Priority Order

If resources are limited, implement in this order:
1. FTP Deployment (Developer A, Week 1) - Stops SSH failures
2. Fix npm Hanging (Developer B, Week 1) - Unblocks pipeline
3. Staging Environment (Developer C, Week 1) - Enables safe testing
4. Atomic Deployments (Developer A, Week 2) - Zero downtime
5. Rollback System (Developer C, Week 2) - Quick recovery

## 🎯 Success Metrics

Track these metrics to measure success:
- **Deployment Time:** From 30+ min → <3 min
- **Rollback Time:** From 30+ min → <30 sec
- **Success Rate:** From ~60% → >99%
- **Downtime:** From variable → 0 seconds
- **Manual Work:** From always → rarely

## 🚨 Emergency Contacts

If deployment fails during implementation:
1. Check `/scripts/emergency-rollback.sh`
2. Use FTP client for manual deployment
3. Restore from Git if needed
4. Document the issue for post-mortem

## 📚 Reference Documents

- **Research:** `/context/CICD_research.md`
- **Issues:** `/issues/` directory
- **Current Workflows:** `.github/workflows/`
- **Development Plan:** `DEVELOPMENT_PLAN.md`

## 💡 Tips for Success

1. **Test in staging first** - Never test in production
2. **Keep backups ready** - Always have a rollback plan
3. **Communicate changes** - Let team know about deployments
4. **Document everything** - Future you will thank you
5. **Ask for help** - If stuck, reach out to team lead

---

Remember: The goal is to fix our deployment pipeline that has caused multiple production outages. Take it step by step, test thoroughly, and we'll have a robust CI/CD system!