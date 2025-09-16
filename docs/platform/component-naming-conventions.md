# Component Naming Conventions

## Library Component Prefix Convention

To prevent confusion between Activity Library components and main screen activity components, we follow a clear naming convention using the "Library" prefix for all Activity Library components.

## Why This Convention Exists

Previously, components in the ActivityLibrary directory used generic names like `ActivityCard` and `ActivityGrid`, which caused confusion with similarly named components used on the main screen for displaying user activities. This naming ambiguity made it difficult to:

- Understand which components belong to which feature area
- Navigate the codebase efficiently
- Maintain clear separation of concerns
- Onboard new developers quickly

## Renamed Components

The following Activity Library components have been renamed with the "Library" prefix:

| Original Name | New Name | Purpose |
|---------------|----------|---------|
| `ActivityGrid.js` | `LibraryActivityGrid.js` | Renders grid layout of activities in library categories |
| `ActivityCard.js` | `LibraryActivityCard.js` | Individual activity card component for library display |
| `ActivityCardMenus.js` | `LibraryActivityMenus.js` | Menu helpers for library activity cards |

## Implementation Details

- Files were renamed using `git mv` to preserve commit history
- All import statements in dependent files were updated accordingly
- Test files were updated to reference the new component names
- Component exports and functionality remain unchanged

## Future Guidelines

When creating new components for the Activity Library:

1. **Use the "Library" prefix** for components that are specific to the Activity Library functionality
2. **Keep generic names** for truly reusable components that could be used across different parts of the app
3. **Document component purpose** clearly in the file header comments
4. **Update related test files** when renaming or creating components

## Related Files

Files that import these components have been updated:
- `src/components/ActivityLibrary/ActivityLibrary.js`
- `src/components/ActivityLibrary/CategorySectionComponent.js`
- `src/components/ActivityLibrary/LibraryActivityGrid.js`
- `src/components/ActivityLibrary/__tests__/ActivityGrid.test.js`
- `src/components/ActivityLibrary/__tests__/ActivityCard.test.js`
- `src/components/ActivityLibrary/__tests__/CategoryList.test.js`

This naming convention ensures clear separation between library components and main app components, improving code organization and developer experience.