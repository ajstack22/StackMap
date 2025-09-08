# Pending Changes

## Title: Fix Material Icons on Web and Remove Share Dialog from Export

### Changes Made:
- Fixed Android export to remove broken Share.share dialog in DataModal
- Added proper CSP headers to allow Google Fonts and Material Icons
- Updated VectorIcons.web.js to handle CSP restrictions with local font fallback
- Added Content-Security-Policy headers to both root and qual .htaccess files
- CSP now allows fonts.googleapis.com for styles and fonts.gstatic.com for fonts
- Export on Android now shows helpful instructions instead of broken share functionality