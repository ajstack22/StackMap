# Pending Changes

## Title: Fix card deletion sync by extending timestamp window

### Changes Made:
- Extended field timestamp window from 1s to 3s for better deletion handling
- Reduced pull debounce from 2s to 1s for faster sync
- When user data differs by >3 seconds, take newer version entirely
- This ensures card deletions sync properly (deleted state wins)

