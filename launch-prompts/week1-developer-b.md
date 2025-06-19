# Week 1 Launch Prompts - Developer B

## Day 1-3: Fix npm Hanging (Issue #14)

```
Our GitHub Actions workflow hangs for 30+ minutes on 'npm ci' when installing dependencies. This is blocking all deployments. The issue is primarily Puppeteer downloading Chromium.

Current setup:
- Using Node 18 with npm
- package.json has puppeteer in devDependencies
- Tests don't actually run in CI (we skip them)

Please fix the npm install step by:
1. Adding memory limit (NODE_OPTIONS)
2. Skipping Puppeteer Chromium download
3. Using --prefer-offline and --no-audit flags
4. Implementing proper npm caching
5. Consider skipping devDependencies entirely if tests don't run

The fix should reduce install time from 30+ minutes to under 3 minutes.
```

## Day 4-5: Optimize Build Process

```
Now that npm install is fixed, optimize the entire build process for our static site.

Current process:
- Install dependencies
- No actual build step (static files)
- Deploy everything except excluded directories

Optimize by:
1. Creating a proper build artifact (only deployable files)
2. Using GitHub Actions artifacts to pass between jobs
3. Separating build from deploy jobs
4. Adding file size checks to prevent deploying bloated builds
5. Implementing build caching where possible
```

## Context Files to Provide:
- `.github/workflows/deploy.yml`
- `.github/workflows/deploy-fast.yml`
- `package.json`
- `issues/issue-3-npm-hanging.md`
- `/context/CICD_research.md` (lines 245-286)