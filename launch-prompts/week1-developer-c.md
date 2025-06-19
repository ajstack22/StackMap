# Week 1 Launch Prompts - Developer C

## Day 1-3: Research & Planning Only

```
I need a detailed plan for creating a staging environment for StackMap on NameCheap cPanel hosting. We need staging.stackmap.app as a subdomain.

Research and document:
1. Step-by-step cPanel subdomain creation process
2. Directory structure for staging vs production
3. How to password-protect staging
4. Environment detection in JavaScript
5. DNS propagation timeline

Don't implement yet, just create a comprehensive plan with screenshots/examples where helpful.
```

## Day 4-5: Create Staging Environment (Issue #15)

```
Implement the staging environment plan for staging.stackmap.app on cPanel.

Steps needed:
1. Create subdomain in cPanel (document with screenshots)
2. Set up directory structure: /home/stachblx/staging.stackmap.app/
3. Add .htaccess for password protection
4. Create staging-specific configuration
5. Update GitHub Actions to deploy to staging first
6. Add manual approval gate before production

Provide:
- Setup documentation
- .htaccess template
- GitHub workflow modifications
- Testing checklist
```

## Context Files to Provide:
- `.github/workflows/deploy-fast.yml`
- `issues/issue-4-staging-environment.md`
- `/context/CICD_research.md` (lines 135-182)
- Current production `.htaccess` (if exists)