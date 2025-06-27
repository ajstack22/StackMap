# GitHub Issues Batch 5: Device Ecosystems & Sensory Design

## Based on Final Research Reports

### From Device Ecosystems Research

#### 54. [P1-high] Support educational device constraints
**Labels**: `P1-high`, `compatibility`, `education`  
**Milestone**: v0.1 - ES5 Compatibility

Educational deployments have specific constraints:
- Chromebooks: 60% market share, Chrome OS 126-127
- iPads: 94% tablet share, iPadOS 17-18
- Android: Budget option, Android 13-14 (23.6%)
- Minimum specs: 8GB RAM, 256GB storage
- MDM compliance requirements

#### 55. [P2-medium] Optimize for 4-year device cycles
**Labels**: `P2-medium`, `performance`, `education`  
**Milestone**: v0.2 - Core Navigation

Standard educational refresh cycle considerations:
- Performance degradation over 4 years
- Battery life reduction
- Storage accumulation
- Graceful feature degradation
- Support for older OS versions

### From Sensory Design Research

#### 56. [P0-critical] Implement core sensory presets
**Labels**: `P0-critical`, `feature`, `autism`, `adhd`, `sensory`  
**Milestone**: v0.4 - Accessibility

90% of autistic users have sensory differences:
- "Focus Mode" - ADHD-optimized
- "Calm Mode" - Autism-friendly  
- "Energy Mode" - Sensory-seeking
- "Minimal Mode" - Overwhelm reduction
- Default to reduced-sensory approach

#### 57. [P0-critical] Create safe color palette system
**Labels**: `P0-critical`, `design`, `autism`, `sensory`  
**Milestone**: v0.4 - Accessibility

Autistic users see colors 85% more intensely:
```css
/* Safe colors */
--calm-green: #5a6c40;
--soft-blue: #7acedc;
--neutral-base: #f2f2ff;
--earth-tone: #a4b262;

/* Avoid */
/* Yellow, pure white, fluorescent */
```
- 6:1 to 7:1 contrast ratios
- No pure white/black backgrounds

#### 58. [P1-high] Optimize animation timing windows
**Labels**: `P1-high`, `feature`, `adhd`, `performance`  
**Milestone**: v0.4 - Accessibility

Specific timing requirements:
- 100-200ms: Micro-interactions
- 200-300ms: Medium animations
- 300-400ms: Maximum duration
- Mobile: 30% faster than desktop
- Default to reduced motion

#### 59. [P1-high] Implement platform-specific haptics
**Labels**: `P1-high`, `feature`, `sensory`, `mobile`  
**Milestone**: v0.4 - Accessibility

Customizable haptic feedback:
- iOS: Intensity 0.2-0.5, sharpness 0.3-0.8
- Android: 10-15ms duration, 100-180 intensity
- User-controlled profiles
- Preview before enabling
- Silent mode option

#### 60. [P1-high] Add time-based adaptations
**Labels**: `P1-high`, `feature`, `sensory`, `adhd`  
**Milestone**: v0.4 - Accessibility

Circadian rhythm support:
- Morning: Higher contrast, cooler colors
- Afternoon: Standard settings
- Evening: Warmer colors, reduced blue
- Night: Dark mode, minimal stimulation
- Manual override always available

#### 61. [P2-medium] Build sensory preference sharing
**Labels**: `P2-medium`, `feature`, `community`  
**Milestone**: v0.9 - Community Features

Community-driven presets:
- Export/import JSON preferences
- Share via QR codes
- Community rating system
- Clinical validation markers
- Privacy-preserving sharing

#### 62. [P0-critical] Prevent harmful sensory patterns
**Labels**: `P0-critical`, `bug`, `autism`, `safety`  
**Milestone**: v0.2 - Core Navigation

Critical safety requirements:
- No parallax scrolling
- No auto-playing content
- No rapid color changes (>3 flashes/second)
- No infinite scroll
- Clear stop/pause controls

## New Milestone

### v0.9 - Community Features (NEW)
- Sensory preference sharing
- Profile templates
- Community validation

## Updated Statistics

### Device Ecosystem Reality
- **60%** of schools use Chromebooks
- **94%** of educational tablets are iPads
- **4-year** standard refresh cycle
- **13-14.7%** actual IDEA funding (vs 40% promised)
- **$400** average per-student iPad deployment cost

### Sensory Processing Impact
- **90%** of autistic users have sensory differences
- **69%** of ADHD users have sensory sensitivities
- **85%** more intense color perception (autism)
- **69%** photophobia in ADHD (vs 28% general)
- **100:1 ROI** on accessibility improvements

## Implementation Priority

### Immediate (P0-critical)
1. **Core sensory presets** - Foundation for all users
2. **Safe color palette** - Prevent sensory overload
3. **Harmful pattern prevention** - Safety first

### High Priority (P1-high)
1. **Animation timing** - Critical for ADHD
2. **Platform haptics** - Essential feedback
3. **Time-based adaptation** - Circadian support
4. **Device constraints** - Educational reality

### Medium Priority (P2-medium)
1. **4-year optimization** - Long-term planning
2. **Preference sharing** - Community building

## GitHub CLI Commands

```bash
# Create sensory presets issue
gh issue create --title "[P0-critical] Implement core sensory presets" \
  --label "P0-critical,feature,autism,adhd,sensory" \
  --milestone "v0.4 - Accessibility" \
  --body "90% of autistic users have sensory processing differences"

# Create color palette issue
gh issue create --title "[P0-critical] Create safe color palette system" \
  --label "P0-critical,design,autism,sensory" \
  --milestone "v0.4 - Accessibility" \
  --body "Autistic users see colors 85% more intensely"

# Create harmful patterns issue
gh issue create --title "[P0-critical] Prevent harmful sensory patterns" \
  --label "P0-critical,bug,autism,safety" \
  --milestone "v0.2 - Core Navigation" \
  --body "No parallax, auto-play, or rapid flashing"
```

## Key Takeaways

1. **Sensory design is not optional** - 90% of autistic users affected
2. **Educational constraints are real** - Plan for 4-year old Chromebooks
3. **Reduced-sensory-first** - Start calm, add stimulation by choice
4. **Platform differences matter** - Customize haptics per OS
5. **Safety over features** - Prevent harmful patterns first