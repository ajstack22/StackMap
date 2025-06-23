# Issue #14: Fix npm install Hanging in GitHub Actions

## 🚨 CRITICAL: Development Process
1. **BEFORE IMPLEMENTING**: Post your DETAILED implementation plan to Issue #14 on GitHub for PM adversarial review
2. **AFTER COMPLETING**: Update Issue #14 with completion status for final adversarial review
3. **DO NOT MERGE**: Until PM completes adversarial review and approves
4. **THINK HARD**: This is SUPER IMPORTANT - blocks all automated testing and deployment

## Problem Statement
npm install hangs for 30+ minutes in GitHub Actions, making CI/CD unusable. This blocks:
- Automated testing on PRs
- Deployment automation
- Security updates
- Developer productivity

## Current Symptoms
- npm install hangs indefinitely
- No error messages
- Works fine locally
- Affects all branches

## Diagnosis Approach

### 1. Enable Verbose Logging
```yaml
# .github/workflows/test.yml
- name: Install dependencies with verbose logging
  run: |
    npm config set loglevel verbose
    npm install --verbose
  timeout-minutes: 10 # Force fail instead of hanging
```

### 2. Common Causes to Check

#### Network Issues
```yaml
- name: Test npm registry connectivity
  run: |
    curl -I https://registry.npmjs.org
    npm config get registry
    nslookup registry.npmjs.org
```

#### Package Lock Conflicts
```yaml
- name: Clean install
  run: |
    rm -rf node_modules package-lock.json
    npm cache clean --force
    npm install
```

#### Git Dependencies
```bash
# Check package.json for git URLs
grep -E "(git\+|github:)" package.json

# These can hang on auth
"some-package": "git+https://github.com/user/repo.git"
```

#### Platform-Specific Packages
```yaml
- name: Install with platform flags
  run: |
    npm install --platform=linux --arch=x64
```

## Potential Solutions

### Solution 1: Use npm ci
```yaml
# Faster, more reliable for CI
- name: Clean install
  run: npm ci
```

### Solution 2: Cache Dependencies
```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
      
- name: Install dependencies
  run: npm ci --prefer-offline --no-audit
```

### Solution 3: Use Yarn Instead
```yaml
- name: Setup Yarn
  run: |
    npm install -g yarn
    yarn install --frozen-lockfile
```

### Solution 4: Mirror/Proxy Registry
```yaml
- name: Use npm mirror
  run: |
    npm config set registry https://registry.npmjs.cf/
    npm install
```

## Implementation Plan

### Phase 1: Diagnosis
Create diagnostic workflow:
```yaml
name: Diagnose npm hang
on: workflow_dispatch

jobs:
  diagnose:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: System info
        run: |
          echo "Node version: $(node -v)"
          echo "npm version: $(npm -v)"
          echo "OS: $(uname -a)"
          
      - name: Network tests
        run: |
          ping -c 5 registry.npmjs.org
          traceroute registry.npmjs.org
          
      - name: npm config
        run: npm config list
        
      - name: Try install with timeout
        timeout-minutes: 5
        run: npm install --verbose
```

### Phase 2: Implement Fix
Based on diagnosis, implement solution:

#### Option A: npm ci with cache
```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --no-audit --no-fund
        timeout-minutes: 5
        
      - name: Run tests
        run: npm test
```

#### Option B: Yarn migration
```yaml
      - name: Install Yarn
        run: npm install -g yarn
        
      - name: Install with Yarn
        run: yarn install --frozen-lockfile --network-timeout 100000
```

### Phase 3: Optimization
```yaml
# Parallel job setup
strategy:
  matrix:
    node-version: [16.x, 18.x]
    os: [ubuntu-latest, macos-latest]
    
# Dependency caching
- uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      ~/.cache
    key: ${{ runner.os }}-${{ matrix.node-version }}-${{ hashFiles('**/package-lock.json') }}
```

## Testing the Fix

### Verification Steps
1. Create test PR with workflow
2. Verify install completes <3 minutes
3. Test on multiple runners
4. Verify cache works
5. Monitor for 1 week

### Success Metrics
```javascript
const CIMetrics = {
    installTime: '<3 minutes',
    cacheHitRate: '>80%',
    failureRate: '<5%',
    parallelJobs: true
};
```

## Monitoring
```yaml
- name: Report metrics
  if: always()
  run: |
    echo "Install time: ${{ steps.install.outputs.time }}"
    echo "Cache hit: ${{ steps.cache.outputs.cache-hit }}"
```

## Definition of Done
- [ ] npm install completes in <3 minutes
- [ ] Solution works on all branches
- [ ] Cache improves subsequent runs
- [ ] No random failures
- [ ] Documentation updated
- [ ] Monitoring added
- [ ] Team notified of fix

## Alternative: Docker Approach
If npm issues persist:
```dockerfile
# .github/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
```

```yaml
- name: Build Docker image
  run: docker build -t app .
```

Remember: This blocks ALL automation. Fix it right, test thoroughly!