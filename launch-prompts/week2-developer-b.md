# Week 2 Launch Prompts - Developer B

## Day 1-3: Pre-deployment Validation (Issue #17)

```
Create comprehensive pre-deployment validation to prevent broken deployments from reaching production.

Validation script should check:
1. All critical files exist (index.html, sw.js, manifest.json, etc.)
2. JavaScript syntax is valid (using node -c)
3. No missing imports or broken paths
4. Service worker version is incremented
5. Disk space is available (>15% free)
6. File permissions are correct
7. .htaccess syntax is valid

Also create post-deployment health checks:
- HTTP status checks for key endpoints
- Console error detection
- Performance baseline checks

Integrate into GitHub Actions workflow to fail deployment if validation fails.
```

## Day 4-5: CI/CD Pipeline Integration

```
Integrate all components into a cohesive CI/CD pipeline.

Tasks:
1. Combine build optimization with validation
2. Ensure artifacts flow correctly between jobs
3. Add deployment status badges to README
4. Create deployment dashboard/status page
5. Add metrics collection (deployment time, success rate)
6. Document the complete pipeline flow

The pipeline should be reliable and provide clear feedback at each stage.
```

## Context Files to Provide:
- `issues/issue-6-pre-deployment-checks.md`
- `/context/CICD_research.md` (lines 373-404)
- Current GitHub Actions workflows
- Build optimization work from Week 1