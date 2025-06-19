# Week 2 Launch Prompts - Developer C

## Day 1-3: Staging Deployment Pipeline

```
Complete the staging deployment pipeline with automated testing.

Requirements:
1. Every push to main deploys to staging automatically
2. Run automated tests against staging URL
3. Visual regression testing setup (at least screenshots)
4. Performance testing (page load time)
5. Manual approval gate with checklist
6. Slack/email notification when staging is ready
7. Auto-cleanup of old staging deployments

Create GitHub Actions workflow that enforces staging validation before production.
```

## Day 4-5: Rollback System Part 1 (Issue #16)

```
Begin implementing the one-click rollback system.

Create rollback.php with:
1. Authentication system (not just password in code)
2. List of available releases with metadata
3. Current release indicator
4. One-click rollback functionality
5. Backup creation before rollback
6. Activity logging
7. Mobile-responsive design

Security requirements:
- HTTPS enforcement
- Session management
- IP whitelisting option
- Rate limiting

Start with core functionality, we'll add UI polish in week 3.
```

## Context Files to Provide:
- `issues/issue-5-rollback-system.md`
- `/context/CICD_research.md` (lines 235-352)
- Staging environment setup from Week 1
- Atomic deployment structure (if available)