# StackMap Brand Guidelines

**Version**: 1.0
**Last Updated**: January 2025
**Purpose**: Official branding standards for StackMap visual identity, design system, and marketing materials

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Logo & Visual Identity](#logo--visual-identity)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Design Principles](#design-principles)
6. [UI Design System](#ui-design-system)
7. [Marketing & Communications](#marketing--communications)
8. [Platform-Specific Guidelines](#platform-specific-guidelines)
9. [Accessibility Standards](#accessibility-standards)

---

## Brand Identity

### Mission
StackMap helps families organize daily activities through intuitive, visual scheduling on shared devices.

### Brand Personality
- **Friendly & Approachable**: Uses Comic Relief font for warmth and accessibility
- **Clear & Simple**: Minimalist design that reduces cognitive load
- **Inclusive**: Neurodiversity-friendly color themes and high-contrast design
- **Family-Focused**: Parent-child collaboration is central to the experience

### Brand Values
- Accessibility first
- Neurodiversity support
- Family collaboration
- Visual clarity
- Simplicity over complexity

---

## Logo & Visual Identity

### Primary Logo

**Design**: Three stacked horizontal white bars on StackMap blue background

**Concept**: Represents "stacked" activities or layers - the core metaphor of organizing daily tasks

**Logo Variations**:
- **Primary**: White bars on StackMap Blue (#5c7e9d)
- **Reverse**: Can be adapted for different theme colors
- **Monochrome**: White bars on black for high contrast contexts

**Logo Usage**:
- Minimum size: 48x48px for digital
- Clear space: Minimum 8px around logo on all sides
- Do not distort, rotate, or add effects to logo
- Do not change the three-bar design

**Logo Files**: `/ios/StackMapNative/Images.xcassets/AppIcon.appiconset/`

---

## Color Palette

### Primary Brand Color

**StackMap Blue** - The signature brand color
- Primary: `#5c7e9d` (92, 126, 157)
- Dark variant: `#4a6680`
- Light variant: `#7896b3`
- Subtle variant: `#8fa5b8`

**Usage**: App icon background, primary UI elements, branding materials

**RGB**: 92, 126, 157
**HSL**: 208°, 26%, 49%
**CMYK**: Approximate 41%, 20%, 0%, 38%

### Theme Colors

StackMap offers 20 theme colors organized into two categories:

#### Chromatic Themes (15 colors)
Rainbow spectrum from red to purple, all meeting WCAG AA contrast requirements with white text:

1. **Crimson**: `#DC143C` - Deep crimson red
2. **Cherry**: `#DE3163` - Bright cherry (rainbow red)
3. **Scarlet**: `#CD5C5C` - Softer red
4. **Rust**: `#B7410E` - Rust orange
5. **Tangerine**: `#F28500` - Bright tangerine (rainbow orange)
6. **Amber**: `#D97706` - Deep amber
7. **Gold**: `#B8860B` - Rich gold (rainbow yellow)
8. **Olive**: `#6B8E23` - Olive green
9. **Emerald**: `#2D8659` - Rich emerald (rainbow green)
10. **Forest**: `#228B22` - Forest green
11. **Ocean**: `#2C7A7B` - Ocean teal
12. **Sapphire**: `#0F52BA` - Bright sapphire (rainbow blue)
13. **Navy**: `#2C5282` - Navy blue
14. **Indigo**: `#4C1D95` - Deep indigo
15. **Plum**: `#8B5CF6` - Rich plum

#### Neurodiversity-Friendly Themes (5 colors)
Calming colors with reduced sensory load:

16. **Sage**: `#6B7F6B` - Calming sage (reduces anxiety)
17. **Dusty Blue**: `#4A6480` - Muted blue (ADHD focus)
18. **StackBlue**: `#5C7E9D` - StackMap blue (ADHD/neurodiverse friendly)
19. **Terracotta**: `#A0522D` - Warm earth (grounding)
20. **Lavender**: `#7B68A6` - Soft purple (sensory comfort)

### Supporting Colors

#### Text Colors
- **Primary Text**: `#000000` (black) - ALWAYS use for primary text
- **Secondary Text**: `#666666` - Use sparingly, prefer black
- **Disabled/Tertiary**: `#999999` - Only for inactive states

#### Semantic Colors
- **Success**: `#4caf50` (Material green)
- **Error**: `#f44336` (Material red)
- **Warning**: `#ff9800` (Material orange)
- **Info**: `#007aff` (iOS blue)

#### Neutral Grays
- 50: `#fafafa` - Lightest backgrounds
- 100: `#f5f5f5` - Very light gray backgrounds
- 200: `#f0f0f0` - Light gray backgrounds
- 300: `#e8e8e8` - Border colors
- 400: `#e0e0e0` - Dividers, light borders
- 500: `#bdbdbd` - Disabled text
- 600: `#757575` - Icons, secondary elements
- 700: `#616161` - Dark secondary text
- 800: `#424242` - Very dark text
- 900: `#212121` - Darkest gray

---

## Typography

### Primary Font: Comic Relief

**Font Family**: Comic Relief
**Weights**: Regular (400), Bold (700)

**Rationale**: Comic Relief provides:
- Friendly, approachable personality
- High readability for neurodivergent users
- Dyslexia-friendly letterforms
- Reduced formality that appeals to families

**Platform Implementation**:
- **iOS**: `ComicRelief-Regular`, `ComicRelief-Bold`
- **Android**: `ComicRelief-Regular`, `ComicRelief-Bold` (font variants, not weight property)
- **Web**: `'Comic Relief', 'Comic Sans MS', cursive`

### Type Scale

| Size | Pixels | Usage |
|------|--------|-------|
| xs   | 12px   | Labels, captions, metadata |
| sm   | 14px   | Secondary text, descriptions |
| md   | 16px   | Body text, default size |
| lg   | 18px   | Emphasized body text |
| xl   | 20px   | Small headings |
| xxl  | 24px   | Section headings |
| xxxl | 28px   | Page titles, hero text |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Normal | 400   | Body text, standard UI |
| Medium | 500   | Not used (Comic Relief only has Regular/Bold) |
| Semibold | 600 | Not used (Comic Relief only has Regular/Bold) |
| Bold   | 700   | Headings, emphasis, buttons |

**IMPORTANT**: Android requires font variants (ComicRelief-Bold) without the fontWeight property. The Typography component handles this automatically.

---

## Design Principles

### 1. **Accessibility First**

**CRITICAL RULE: NO GRAY TEXT**
- All primary text MUST be black (#000000)
- Avoid gray text for readability and accessibility
- Use only black text on all theme colors
- Gray text (#666, #999) is acceptable ONLY for:
  - Disabled states
  - Tertiary/helper text
  - When absolutely necessary for visual hierarchy

**Contrast Requirements**:
- All theme colors meet WCAG AA standards with white text
- Black text must be readable on all light backgrounds
- Test contrast with all 20 theme colors

### 2. **Neurodiversity Support**

- Offer calming color themes (sage, lavender, dusty blue)
- Minimize sensory overload with clean, simple designs
- Provide visual consistency and predictability
- Support multiple cognitive processing styles

### 3. **Visual Clarity**

- Use clear, obvious visual metaphors
- Minimize cognitive load through simplicity
- Prioritize content over decoration
- Use whitespace generously

### 4. **Family-Friendly**

- Design for shared device usage
- Support parent-child collaboration
- Use approachable, friendly visual language
- Avoid corporate or overly formal aesthetics

---

## UI Design System

### Shadows (4 Levels)

**Level 1 - Subtle** (Buttons, Edit buttons)
```
shadowColor: #000
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.08
shadowRadius: 4
elevation: 2
```

**Level 2 - Default** (Cards, Pills, Badges)
```
shadowColor: #000
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.12
shadowRadius: 8
elevation: 4
```

**Level 3 - Elevated** (FABs, Toasts, Modals)
```
shadowColor: #000
shadowOffset: { width: 0, height: 8 }
shadowOpacity: 0.16
shadowRadius: 16
elevation: 8
```

**Level 4 - High** (Dragging, Active states)
```
shadowColor: #000
shadowOffset: { width: 0, height: 12 }
shadowOpacity: 0.2
shadowRadius: 24
elevation: 12
```

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs    | 4px   | Tight spacing, icon padding |
| sm    | 8px   | Compact spacing, small gaps |
| md    | 16px  | Default spacing, card padding |
| lg    | 24px  | Section spacing, large gaps |
| xl    | 32px  | Major section breaks |
| xxl   | 48px  | Hero spacing, page margins |

### Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| sm    | 4px   | Small elements, tags |
| md    | 8px   | Buttons, inputs |
| lg    | 12px  | Cards, containers |
| xl    | 16px  | Large cards, modals |
| xxl   | 20px  | Hero cards, featured items |
| round | 9999px | Pills, badges, circular buttons |

### Animation Timing

| Speed  | Duration | Usage |
|--------|----------|-------|
| Fast   | 200ms    | Micro-interactions, hovers, simple fades |
| Normal | 300ms    | Standard transitions, modals |
| Slow   | 500ms    | Page transitions, complex animations |

**Note**: iOS performance requires simplified animations. Use 200ms fades instead of complex transitions.

### Borders

**Default Border**:
```
borderWidth: 2
borderColor: rgba(0, 0, 0, 0.08)
```

**Subtle Border**:
```
borderWidth: 2
borderColor: rgba(0, 0, 0, 0.1)
```

**Focus Border**:
```
borderWidth: 2
borderColor: rgba(102, 126, 234, 0.5)
```

---

## Marketing & Communications

### Voice & Tone

**Voice** (Consistent attributes):
- Friendly and warm
- Clear and straightforward
- Supportive, not condescending
- Conversational but professional

**Tone** (Context-dependent):
- **Onboarding**: Encouraging, helpful, patient
- **Features**: Enthusiastic, benefit-focused
- **Errors**: Apologetic, solution-oriented, calm
- **Success**: Celebratory, positive reinforcement

### Messaging Guidelines

**Do**:
- Use "you" and "your" (second person)
- Focus on benefits, not features
- Keep sentences short and clear
- Use active voice
- Speak to parents and families

**Don't**:
- Use jargon or technical terms
- Make assumptions about family structure
- Use corporate or formal language
- Overcomplicate explanations

### Brand Messaging

**Tagline Options**:
- "Organize your family's day, together"
- "Visual scheduling for busy families"
- "Your family's daily activities, simplified"

**Key Benefits**:
1. Visual organization reduces overwhelm
2. Shared device collaboration
3. Neurodiversity-friendly design
4. Simple, intuitive interface
5. Privacy-first with encryption

---

## Platform-Specific Guidelines

### iOS

**Design Language**: Follows iOS Human Interface Guidelines with StackMap branding
- Use native iOS components styled with StackMap colors
- Maintain iOS gesture conventions
- Use SF Symbols where appropriate (styled to match)

**Icon Sizes**:
- App Store: 1024x1024px
- Device icons: Multiple sizes (see Xcode asset catalog)

### Android

**Design Language**: Material Design principles with StackMap customization
- Adapt Material components with StackMap colors
- Follow Android navigation patterns
- Use Material icons styled to match

**Icon Sizes**:
- Play Store: 512x512px
- Device icons: mdpi (48px) to xxxhdpi (192px)

**CRITICAL - Font Handling**:
- MUST use font variants (ComicRelief-Bold) without fontWeight property
- Typography component handles this automatically
- Never manually set fontWeight on Android

### Web

**Design Language**: Responsive web design with mobile-first approach
- Progressive Web App (PWA) capabilities
- Accessible HTML semantics
- Keyboard navigation support

**Responsive Breakpoints**:
- Mobile: < 768px (1 column)
- Tablet: 768px - 1199px (2 columns)
- Desktop: ≥ 1200px (3 columns)

**CRITICAL - Layout Rules**:
- 3-column: width 31%, 2-column: width 48%, 1-column: width 100%
- Never use flexBasis: 'auto' for multi-column layouts
- Cards use percentage widths for consistent sizing

---

## Accessibility Standards

### WCAG Compliance

**Target Level**: WCAG 2.1 AA

**Key Requirements**:
1. **Color Contrast**: All theme colors meet 4.5:1 contrast ratio with white text
2. **Text Contrast**: Black text (#000) on all light backgrounds
3. **Focus Indicators**: Visible focus states on all interactive elements
4. **Touch Targets**: Minimum 44x44px (iOS) / 48x48dp (Android)
5. **Screen Reader Support**: Proper labels and hints on all UI elements

### Neurodiversity Considerations

1. **Color Options**: 5 dedicated neurodiversity-friendly themes
2. **Visual Simplicity**: Reduced visual noise and clutter
3. **Predictable Patterns**: Consistent UI patterns and navigation
4. **Clear Hierarchy**: Obvious information architecture
5. **Flexible Customization**: User-controlled themes and preferences

### Font Accessibility

- Comic Relief chosen for dyslexia-friendly characteristics
- High x-height for improved readability
- Clear letter differentiation (b/d, p/q)
- Generous spacing between letters

---

## AI-Generated Assets Guidelines

When generating images, icons, or marketing materials using AI (DALL-E, Midjourney, etc.):

### Must Include in Prompts

1. **Brand Elements**:
   - StackMap logo (three stacked white bars)
   - StackMap blue (#5c7e9d) as primary color
   - Comic Relief font aesthetic (friendly, approachable, rounded)

2. **Visual Style**:
   - Clean, minimalist composition
   - Professional but friendly
   - Family-focused imagery
   - Modern app design aesthetic

3. **Color Palette**:
   - Primary: StackMap blue (#5c7e9d)
   - Accents: Use theme colors when appropriate
   - Backgrounds: Light, clean, uncluttered
   - Text: Black (#000) for maximum readability

4. **Family Theme**:
   - Parent-child collaboration imagery
   - Shared tablet/device usage
   - Diverse family representations
   - Warm, inviting environments

### Example AI Prompt Structure

```
[Content description], featuring StackMap branding with three stacked bars logo
in StackMap blue (#5c7e9d), Comic Relief font style, [family/parent-child theme],
clean minimalist design, professional marketing material, warm and friendly,
modern app aesthetic, HD quality
```

### Avoid in AI-Generated Assets

- Corporate/cold aesthetics
- Cluttered or busy compositions
- Low-contrast color combinations
- Formal or technical imagery
- Generic stock photo aesthetics

---

## Technical Implementation

### Code References

**Theme Constants**: `/src/constants/theme.js`
**Color Constants**: `/src/constants/colors.js`
**Typography Component**: `/src/components/common/Typography.js`

### Usage in Code

```javascript
import { THEMES, SHADOWS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import { COLORS } from '../constants/colors';

// Using brand colors
backgroundColor: COLORS.brand.stackBlue

// Using theme colors
backgroundColor: THEMES.stackBlue.primary

// Using spacing
padding: SPACING.md

// Using shadows
...SHADOWS.level2
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2025 | Initial brand guidelines document created |

---

## Contact & Governance

**Brand Owner**: StackMap Development Team
**Questions**: Refer to `/docs/` directory for additional documentation
**Updates**: All brand guideline changes must be documented in this file with version increments

---

## Quick Reference Card

**Logo**: Three white stacked bars on StackMap blue
**Primary Color**: #5c7e9d (StackMap Blue)
**Font**: Comic Relief (Regular, Bold)
**Text Color**: #000000 (Black - NO GRAY TEXT)
**Design Principle**: Accessibility first, family-friendly, neurodiversity support
**Voice**: Friendly, clear, supportive
**Target**: Families with shared devices, neurodivergent users

---

*For detailed implementation guides, see:*
- `/docs/platform/` - Platform-specific guidelines
- `/docs/features/` - Feature design specifications
- `CLAUDE.md` - Development rules and gotchas
