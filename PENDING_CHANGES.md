## Title: Remove sync diagnostic tool from Support page

### Change Description:
Removed the "Open Sync Diagnostic Tool" button from the Support page as it's no longer needed.

### Changes Made:
**src/components/Modals/SupportModal/SupportModal.js**:
- Removed sync diagnostic button (lines 174-190)
- Removed `onSyncDiagnostic` prop from component signature

**App.js**:
- Removed `onSyncDiagnostic={() => {}}` prop from both SupportModal instances (lines 5264, 5678)

### Impact:
- ✅ Cleaner Support page UI
- ✅ Removed unused debug/diagnostic functionality
- ✅ No impact on user-facing features

### Deployment Date: [To be filled by deployment script]
