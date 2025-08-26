# Pending Changes

## Title: Fix sync clipboard copy and improve UI aesthetics

### Changes Made:
- Fixed clipboard copy error on web by implementing fallback methods for focus issues
- Added safe copyToClipboard helper with textarea fallback for browsers
- Redesigned sync key UI with better visual hierarchy
- Changed sync key to show by default (setShowRecoveryPhrase = true)
- Moved hide/show toggle to only affect key text, not buttons or QR code
- Made Copy Key and Copy URL buttons always visible with improved styling
- Added primary button styling (blue background, white text) for action buttons
- QR code now always visible regardless of key visibility state
- Improved button layout with consistent sizing and spacing

