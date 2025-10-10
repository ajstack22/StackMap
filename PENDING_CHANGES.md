## Title: Fix Android Settings screen layout issues

### Changes Made:
- Reduced excessive spacing in Settings header (paddingVertical: SPACING.xl -> SPACING.md)
- Reduced header title margins (marginTop: SPACING.md -> SPACING.sm, marginBottom: SPACING.sm -> SPACING.xs)
- Reduced header description bottom margin (SPACING.md -> SPACING.sm)
- Reduced divider spacing (marginVertical: SPACING.lg -> SPACING.md)
- Reduced section margins (marginVertical: SPACING.sm -> SPACING.xs)
- Increased section padding for better content display (IS_MOBILE padding: SPACING.sm -> SPACING.md)
- Reduced setting description bottom margin (SPACING.lg -> SPACING.md)
- Removed flexGrow: 1 from ScrollView contentContainerStyle (was preventing scrolling)
- Enabled vertical scroll indicator on Android for debugging
- Added marginTop to buttonsList for better spacing
- Removed minHeight constraint from buttonsList that was causing layout issues

These changes fix:
1. Excessive spacing between header and first section
2. ScrollView not scrolling on Android
3. Button Order list items now properly visible and scrollable

### Deployment Date: 2025-10-10
