# NPM Install Optimization Guide for GitHub Actions

## Problem
- `npm ci` was taking 30+ minutes in GitHub Actions
- Primary culprit: Puppeteer downloading ~170MB Chromium binary
- Tests don't actually run in CI, making devDependencies unnecessary

## Solutions Implemented

### 1. Skip Puppeteer Chromium Download
```yaml
env:
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: true
  PUPPETEER_SKIP_DOWNLOAD: true
```

### 2. Add Memory Limits
```yaml
env:
  NODE_OPTIONS: "--max-old-space-size=4096"
```

### 3. Use NPM Optimization Flags
```bash
npm ci --prefer-offline --no-audit --no-fund --loglevel=error
```

### 4. Enable NPM Caching
```yaml
- uses: actions/setup-node@v3
  with:
    node-version: '18'
    cache: 'npm'
```

### 5. Skip DevDependencies Entirely (Fastest Option)
```bash
npm ci --production --prefer-offline --no-audit --no-fund
```

## Performance Comparison

| Method | Install Time | What's Installed |
|--------|-------------|------------------|
| Original `npm ci` | 30+ minutes | Everything + Chromium |
| With Puppeteer skip | ~5 minutes | Everything - Chromium |
| Production only | <3 minutes | No devDependencies |

## Workflow Options

### Option A: ci.yml (Optimized with devDependencies)
- Skips Chromium download
- Installs all dependencies
- Use when you need dev tools but not Puppeteer

### Option B: ci-fast.yml (Production only)
- Skips ALL devDependencies
- Fastest option (<3 minutes)
- Use for deployment validation

### Option C: deploy-fast.yml (No npm install)
- Skips npm install entirely
- Just validates files exist
- Use for emergency deployments

## Additional Optimizations

### 1. Use npm clean-install
```bash
npm clean-install --prefer-offline
```

### 2. Parallel Jobs
Split validation and install into separate jobs that run in parallel.

### 3. Cache node_modules
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### 4. Consider pnpm
pnpm is faster and more efficient than npm:
```yaml
- uses: pnpm/action-setup@v2
  with:
    version: 8
```

## Debugging Slow Installs

To debug what's taking time:
```bash
npm ci --timing
```

To see what's being downloaded:
```bash
npm ci --verbose
```

## Environment Variables Reference

| Variable | Purpose |
|----------|---------|
| `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` | Skip Chromium download |
| `PUPPETEER_SKIP_DOWNLOAD` | Alternative env var |
| `NODE_OPTIONS` | Set Node.js memory limits |
| `npm_config_loglevel` | Control npm verbosity |
| `npm_config_audit` | Disable security audit |
| `npm_config_fund` | Disable funding messages |

## Recommendations

1. **For regular CI**: Use the optimized ci.yml with Puppeteer skip
2. **For deployment**: Use ci-fast.yml with production-only deps
3. **For emergency**: Use deploy-fast.yml with no npm install
4. **Long term**: Consider removing Puppeteer if tests don't use it