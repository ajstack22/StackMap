## Title: Simplify Sync Authentication - Remove Invite Code System

### Changes Made:

**Simplified sync to use recovery phrase only (removed invite code system)**

#### Removed Files (5):
- api/sync/create_invite.php - Invite code generation endpoint
- api/sync/validate_invite.php - Invite code validation endpoint
- api/sync/use_invite.php - Invite code usage tracking endpoint
- api/sync/migrations/create_sync_invites_table.sql - Invite table schema
- src/components/Modals/DataModal/deviceInvite.js - Device invite UI component

#### Modified Files (13):
- src/services/sync/minimalSyncService.js - Removed createInviteCode(), validateInviteCode(), joinWithInviteCode() methods (~150 lines)
- src/components/Onboarding/OnboardingUserCentered/screens/SyncImportScreen.js - Removed invite code field, simplified to recovery phrase only
- src/components/Modals/DataModal/RecoveryPhrase.js - Removed "Add Device" button and invite generation UI, added setup instructions
- src/components/Modals/DataModal/DataModal.js - Removed invite code state and props passed to RecoveryPhrase
- src/components/Onboarding/OnboardingUserCentered/index.js - Removed invite code logic, fixed joinSync method call
- src/components/Onboarding/OnboardingUserCentered/screens/SyncSuccessScreen.js - Removed generatedInviteCode prop and display
- src/services/sync/syncStoreIntegration.js - Removed createInviteCode(), validateInviteCode(), joinWithInviteCode() wrapper methods
- src/services/sync/__tests__/minimalSyncService.test.js - Removed invite code tests, removed empty describe blocks, cleaned up comments
- src/components/Modals/DataModal/__tests__/RecoveryPhrase.test.js - Removed invite code tests, updated mocks
- src/constants/messages.js - Removed unused invite code error messages (INVITE_INVALID, INVITE_EXPIRED)
- src/components/Modals/DataModal/styles.js - Removed unused invite code styles (inviteSection, sectionDescription, inviteInput)
- api/sync/migrations/drop_sync_invites.sql - Database migration to drop invite system
- PENDING_CHANGES.md - This file

#### Database Migration:
- api/sync/migrations/drop_sync_invites.sql - Drops sync_invites table and active_sync_invites view

#### Impact:
- **Simpler UX**: One credential (recovery phrase) instead of multiple options
- **Cleaner codebase**: Removed ~750 lines of code across 17 files
- **Better separation**: Sync (permanent/personal) vs Share (temporary/others)
- **No backward compatibility needed**: Invite codes never used in production
- **All tests passing**: 1,945 tests passing, 79 test suites
- **TypeScript cleanup**: Fixed 3 type errors related to removed invite code props

### Deployment Date: [Auto-filled by deployment script]
