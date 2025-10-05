## Title: Fix button icon alignment in Activity Library

### Changes Made:
- Replace Text "+" with Icon "add" component for add button (line 155)
- Replace Text "×" with Icon "close" component for delete button (line 177)
- Remove all platform-specific marginTop adjustments
- Icons now auto-center properly on all platforms without positioning hacks
- Cleaner, more maintainable code using Material Icons
