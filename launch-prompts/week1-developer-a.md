# Week 1 Launch Prompts - Developer A

## Day 1-3: FTP Deployment Migration (Issue #12)

```
I need to replace our failing SSH-based GitHub Actions deployment with FTP-Deploy-Action for StackMap. Current workflow is in .github/workflows/deploy-fast.yml which uses SSH on port 21098 to deploy to NameCheap cPanel hosting. 

Context:
- SSH deployments are timing out and failing authentication
- Need to use SamKirkland/FTP-Deploy-Action@v4.3.5
- Must preserve .well-known directory (SSL certificates)
- Must exclude node_modules, tests, docs, scripts
- Server details will be in GitHub secrets

Please:
1. Update deploy-fast.yml to use FTP instead of SSH
2. Create a test workflow file for dry-run testing
3. Document what GitHub secrets need to be added
4. Ensure critical directories are excluded from deployment
```

## Day 4-5: Testing FTP Deployment

```
The FTP deployment workflow has been created. Now I need comprehensive testing before we switch from SSH.

Please create:
1. A test script that verifies FTP connection using the same action
2. A checklist of all critical files/directories to verify post-deployment
3. A rollback plan if FTP deployment fails
4. Documentation on how to manually deploy via FTP client as emergency backup

Test on a non-critical directory first, then staging (once Dev C sets it up).
```

## Context Files to Provide:
- `.github/workflows/deploy-fast.yml`
- `issues/issue-1-ftp-deployment.md`
- `/context/CICD_research.md` (lines 105-212)