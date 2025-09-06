# Pending Changes

## Title: Add inline HTML script to capture hash before any JavaScript loads

### Changes Made:
- Added inline script in index.html to capture hash immediately on page load
- Script runs before any external JavaScript or frameworks load
- Stores hash in window.__initialHash and parsed sync data in window.__earlySyncData
- Updated App.js to use HTML-captured data as primary source
- Enhanced debug panel to show HTML capture status

