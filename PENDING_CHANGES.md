## Fix: ESLint errors blocking deployment + version sync

### Changes Made:

- Fixed 2 ESLint errors in `src/services/api/dev/config/security.js`:
  - Removed undefined `secret` variable reference in unused HMAC call
  - Fixed `generateSecurePassword` to return the generated password (was returning undefined `hex`)
- Added `vendor/` to `.eslintignore` to exclude Ruby gem files from linting
- Synced version across all platforms for fresh deployment

### Technical Details:

- The `generateSecurePassword` function was dead code (never called) with bugs
- Vendor bundle files from Ruby gems were causing false ESLint errors
- No functional changes to application behavior

### Files Changed:

- `.eslintignore` - Added vendor/ exclusion
- `src/services/api/dev/config/security.js` - Fixed generateSecurePassword function

### Testing:

- `npx eslint . --ext .js,.jsx,.ts,.tsx --quiet` returns 0 errors
- No functional changes to test

### User Impact:

- **No functional changes** - build/deployment fix only
- **Breaking Changes**: None
- **Migration Required**: None

### Deployment Notes:

- Unblocks all deployment tiers
- Safe for all platforms (iOS, Android, Web)
