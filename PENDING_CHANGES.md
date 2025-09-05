# Pending Changes

## Title: Unified Invite Code System for Zero-Knowledge Sync & Share

### Changes Made:

#### Security Implementation (Zero-Knowledge)
- Implemented secure invite code system for sync (XXXX-XXXX format)
- Updated all URLs to use fragments (#) that never reach server
- Server never sees or logs encryption keys/recovery phrases
- Achieved true zero-knowledge architecture

#### Frontend Updates
- Updated OnboardingUserCentered.js to accept `ABCD-1234#recoveryPhrase` format
- Modified DataModal.js with invite code generation and join functionality
- Updated ShareView.js to handle unified invite code format
- Added parsing for both new invite codes and legacy formats

#### Backend Updates
- Created invite code system (create_invite.php, validate_invite.php, use_invite.php)
- Updated create_share.php to generate XXXX-XXXX format for V3 shares
- Modified access_share.php to accept both invite codes and legacy hex IDs
- Added sync_invites database table for temporary invite management

#### Sync Service Integration
- Added createInviteCode(), joinWithInviteCode(), validateInviteCode() methods
- Updated syncStoreIntegration.js to expose new invite methods
- Maintained backwards compatibility with existing sync groups

#### Documentation & Infrastructure
- Updated .htaccess to route both /share/ and /sync/ with invite codes
- Consolidated sync documentation in docs/sync/README.md
- Removed outdated migration and security fix documentation
- Created migration pages for users with old URL formats

### Key Benefits:
1. **True Zero-Knowledge**: Server never sees encryption keys
2. **User-Friendly**: `ABCD-1234` easier than 32-character keys
3. **Unified Format**: Same pattern for both sync and share
4. **Secure**: Keys in URL fragments, invisible to server logs
5. **Backwards Compatible**: Old URLs redirect to migration pages

### Technical Details:
- Both sync and share use: `https://stackmap.app/[feature]/XXXX-XXXX#encryptionKey`
- Invite codes expire (1-168 hours) with usage limits (1-10 uses)
- No ambiguous characters in codes (no 0/O, 1/I/L)
- Fragment (#) leverages browser security to keep keys client-side