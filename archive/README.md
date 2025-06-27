# StackMap Archive

This directory contains archived versions of StackMap for historical reference.

## Contents

### `/legacy/`
- `stackmap-current.html` - The original monolithic version (3,868 lines)
- `index-original.html` - Original index file
- `manifest-original.json` - Original manifest

### `/refactor-attempt/`
- Previous modularization attempt that was running in parallel
- Kept for reference but not actively maintained

## Current Structure

The active StackMap now uses a modular architecture:
- `/index.html` - Main entry point
- `/src/stackmap.css` - All styles (1,506 lines)
- `/src/stackmap.js` - All JavaScript (2,206 lines)

## Migration Date
- Archived: June 26, 2025
- Reason: Successfully migrated to modular architecture while preserving all functionality