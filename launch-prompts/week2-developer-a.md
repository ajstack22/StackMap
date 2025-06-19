# Week 2 Launch Prompts - Developer A

## Day 1-3: Atomic Deployment Structure (Issue #13)

```
Implement atomic deployment structure using symlinks to achieve zero-downtime deployments.

Current structure: Files deployed directly to /home/stachblx/public_html/
Target structure: 
- /releases/20240620_143022/ (timestamped releases)
- /shared/ (uploads, logs, .well-known)
- /public_html -> symlink to current release

Create:
1. Deployment script that creates timestamped release directories
2. Symlink switching logic (atomic operation)
3. Shared directory linking for persistent data
4. Cleanup script to keep only last 5 releases
5. Integration with FTP deployment workflow

The deployment should have zero downtime and enable instant rollback by switching symlinks.
```

## Day 4-5: Atomic Deployment Testing

```
Test and refine the atomic deployment system.

Testing needed:
1. Simulate partial deployment failure - verify rollback works
2. Test symlink switching under load
3. Verify shared directories maintain state
4. Test cleanup of old releases
5. Document manual atomic deployment process
6. Create troubleshooting guide

Fix any issues found and ensure zero-downtime is actually achieved.
```

## Context Files to Provide:
- `issues/issue-2-atomic-deployment.md`
- `/context/CICD_research.md` (lines 183-234)
- Current directory structure
- FTP deployment workflow (from Week 1)