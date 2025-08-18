# Pending Changes

## Title: User-Centered Onboarding Experience

### Changes Made:
1. **Created new onboarding component** (`OnboardingUserCentered.js`)
   - Replaced product-centric flow with user journey approach
   - Added behavioral questions instead of technical configuration
   - Implemented native sync code generation (no web redirect)
   - Added back navigation and skip options throughout

2. **Updated App.js**
   - Added `OnboardingUserCentered` import
   - Set new onboarding as default with `useUserCenteredOnboarding = true`
   - Maintains backward compatibility with old onboarding

3. **Key Features Added:**
   - **Welcome Screen**: StackMap branding with logo, name, and tagline
   - **Journey-based flow**: "New to StackMap" vs "Already use StackMap" 
   - **Existing user options**: Choose between "Join Sync" or "Import Backup"
   - **Smart routing**: Skip irrelevant steps based on user choices
   - **Footer links**: Privacy Policy (all platforms) + Support StackMap (web only)
   - **Native sync**: Generate/enter sync codes directly in app

4. **Created documentation** (`prompts/onboarding-user-centered-guide.md`)
   - Detailed user flows and state management
   - Technical implementation details
   - Benefits and migration notes

### User Experience Improvements:
- **Reduced cognitive load**: Questions about behavior, not features
- **Clearer value props**: Features explained in context of user needs
- **Better defaults**: PIN for helpers, sync for multi-device users
- **Faster onboarding**: Skip irrelevant steps automatically
- **Professional branding**: Logo, tagline, and consistent theming

### Technical Details:
- Fully compatible with existing sync service and data structures
- Uses same encryption and sync mechanisms
- Maintains all existing functionality
- Can be toggled off by setting `useUserCenteredOnboarding = false`

---

## Title: Sync Data Flow Documentation Update

### Changes Made:
1. **Updated SYNC_API_REFERENCE.md**
   - Added complete data flow overview (Client→Server and Server→Client)
   - Detailed encryption process with code examples
   - Added field normalization rules and v4 data structure
   - Clarified authentication components (recovery phrase, sync ID, master key)

2. **Updated data-sync-service.md**
   - Added complete data flow section with step-by-step breakdown
   - Updated sync flow diagram to show actual process
   - Added realistic code examples showing store integration
   - Detailed field normalization and encryption process

### Key Clarifications:
- **Data Flow**: Local State → Normalize → Encrypt → Push → Server → Pull → Decrypt → Validate → Merge → Local State
- **Field Naming**: Activities use `text` (not name/title) and `icon` (not emoji)
- **Encryption**: PBKDF2 key derivation + NaCl secretbox with prepended nonce
- **Stores**: Data split across 4 stores (users, library, settings, app)
- **Import/Export**: v4 format stores activities inside user.days structure

---

## Title: Sync Service Reversion - AsyncStorage Promise Resolution Fix

### Changes Made:

#### Core Service Changes:
1. **Reverted sync service to commit 009b47c** (before TypeScript simplification)
   - File was truncated at 84 lines, restored full ~2600 line service
   - Converted from TypeScript to JavaScript by removing all type annotations
   - Fixed AsyncStorage promise hanging issues that prevented sync

2. **Fixed import in SyncPreviewModal**
   - Changed from `syncServiceSimple` to `syncService`

#### Documentation Updates:
1. **CLAUDE.md**
   - Updated sync system from "Simplified - v2025.08.17" to "Reverted to Complex - v2025.08.18"
   - Added note about reverting due to AsyncStorage issues
   - Updated sync features list to include queue, throttling, network monitoring

2. **docs/SYNC_API_REFERENCE.md**
   - Updated strategy from "simple last-write-wins" to "complex sync architecture"
   - Added support for incremental sync, offline queue, throttling
   - Updated sync strategy section header to v2025.08.18

3. **docs/data/data-sync-service.md**
   - Updated components list to include all complex architecture files:
     - syncQueue.js, networkMonitor.js, changeTracker.js
     - syncThrottle.js, syncHistory.js
   - Updated main service description to mention complex architecture

4. **prompts/NEW_DEVELOPER_ONBOARDING.md**
   - Changed "Recently Fixed" to "Recently Changed" section
   - Updated sync architecture from simplified to complex
   - Updated file list showing JavaScript files with full component list
   - Added note about reverting due to AsyncStorage issues

5. **docs/TROUBLESHOOTING.md**
   - Already contained sync troubleshooting for complex architecture
   - No updates needed

### Technical Details:
- Sync service now uses full complex JavaScript architecture with:
  - Queue system for offline changes
  - Network monitoring and automatic retry
  - Throttling to prevent excessive syncs
  - Change tracking for incremental updates
  - 30-second periodic sync timer
  - Complex conflict resolution with field-level merging

### Reason for Reversion:
The simplified TypeScript sync service had critical AsyncStorage promise hanging issues on web platform that prevented sync from working. The complex JavaScript version has been battle-tested and works reliably across all platforms.

