# Deployment Checklist

## Pre-Deployment Checks

- [ ] **Issue exists** for the changes being deployed
- [ ] **Service worker version** bumped in `sw.js`
- [ ] **CSS version** bumped in `index.html` if styles changed
- [ ] **Demo tested** at `/demo` to ensure no breaking changes
- [ ] **Console clear** - No errors in browser console
- [ ] **Mobile tested** - At least in responsive mode

## Deployment Steps

1. [ ] Upload changed files via cPanel
2. [ ] Clear CloudFlare cache (if applicable)
3. [ ] Test in incognito window
4. [ ] Verify service worker update prompt appears
5. [ ] Test core functionality still works

## Post-Deployment

- [ ] **Create release tag**:
  ```bash
  git tag -a v1.6.x -m "Brief description"
  git push --tags
  ```
- [ ] **Close related issues** with deployment note
- [ ] **Update CHANGELOG.md** if significant changes
- [ ] **Monitor** for any error reports

## Common Issues to Check

### CSS/Layout Issues
- Grid shows correct columns (3 on desktop, 2 on tablet, 1 on mobile)
- No duplicate CSS rules across files
- Demo and main site look consistent

### Sync Issues  
- Sync queue indicator appears when offline
- Delta sync not creating too many files in Drive
- No console errors during sync

### JavaScript Issues
- No syntax errors preventing app load
- All console.logs removed from production
- Service worker updates properly

## Rollback Plan

If issues found:
1. Revert files in cPanel to previous version
2. Bump service worker version again
3. Clear caches
4. Document issue for fix