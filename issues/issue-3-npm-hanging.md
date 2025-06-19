# Issue: Fix npm install hanging for 30+ minutes in GitHub Actions

## Problem
`npm ci` hangs indefinitely in GitHub Actions due to:
- Puppeteer downloading ~170MB Chromium binary
- Memory exhaustion during post-install scripts
- Network timeouts
- No progress indication

This blocks the entire deployment pipeline.

## Solution
Optimize npm install with proper flags and skip unnecessary downloads.

## Implementation Details

### 1. Optimize npm install command
```yaml
- name: Install dependencies optimized
  run: |
    # Increase Node.js memory limit
    export NODE_OPTIONS="--max-old-space-size=8192"
    
    # Install with optimization flags
    npm ci \
      --prefer-offline \
      --no-audit \
      --no-fund \
      --progress=false
  env:
    # Skip Puppeteer Chromium download
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: true
    PUPPETEER_EXECUTABLE_PATH: /usr/bin/google-chrome
```

### 2. Add aggressive caching
```yaml
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### 3. For Puppeteer tests (if needed)
```yaml
- name: Install Chrome for Puppeteer
  run: |
    sudo apt-get update
    sudo apt-get install -y google-chrome-stable
```

### 4. Alternative: Skip dev dependencies in CI
```yaml
- name: Install production only
  run: npm ci --omit=dev
```

## Performance Improvements
- `--prefer-offline`: Reduces npm registry calls by 50-70%
- `--no-audit`: Skips vulnerability scanning (saves 30+ seconds)
- `--progress=false`: Removes progress bar overhead
- Memory limit: Prevents OOM errors
- Skip Chromium: Saves ~170MB download

## Testing Plan
1. Test with minimal package.json first
2. Add dependencies incrementally
3. Monitor install times
4. Test with and without cache
5. Verify Puppeteer tests still work (if needed)

## Success Criteria
- [ ] npm install completes in <3 minutes
- [ ] No hanging or timeouts
- [ ] Cache hit rate >80%
- [ ] All dependencies installed correctly
- [ ] Tests pass (if Puppeteer needed)

## Alternative Solutions
If npm continues to fail:
1. Commit node_modules (not recommended)
2. Use yarn instead of npm
3. Pre-build Docker image with dependencies
4. Skip all dev dependencies in CI

## References
- Research: [CICD_research.md lines 9-63]
- GitHub Actions timeout logs
- Puppeteer Chromium download issues