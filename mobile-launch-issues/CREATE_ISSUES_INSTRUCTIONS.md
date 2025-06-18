# Instructions for Creating GitHub Issues

Since the GitHub CLI (gh) is not available in this environment, I've created detailed issue templates that can be used to create issues via the GitHub web interface or CLI.

## Repository
- **Repository**: https://github.com/ajstack22/StackMap

## Issues to Create

### 1. PWA Store Readiness
- **Title**: PWA Store Readiness - Make StackMap PWA ready for app store requirements
- **Labels**: enhancement, mobile, pwa
- **Content**: See `issue-1-pwa-store-readiness.md`

### 2. Android TWA Wrapper
- **Title**: Android TWA Wrapper - Create Android app using Trusted Web Activity
- **Labels**: enhancement, mobile, android, twa
- **Content**: See `issue-2-android-twa-wrapper.md`

### 3. iOS PWA Wrapper
- **Title**: iOS PWA Wrapper - Create iOS app wrapper for StackMap
- **Labels**: enhancement, mobile, ios, swift
- **Content**: See `issue-3-ios-pwa-wrapper.md`

### 4. Store Metadata
- **Title**: Store Metadata - Prepare all store listing materials for StackMap
- **Labels**: enhancement, mobile, marketing, content
- **Content**: See `issue-4-store-metadata.md`

## How to Create Issues

### Option 1: GitHub Web Interface
1. Go to https://github.com/ajstack22/StackMap/issues
2. Click "New issue"
3. Copy the title and content from each markdown file
4. Add the specified labels
5. Submit the issue

### Option 2: GitHub CLI (if available)
```bash
# Install gh CLI first if not available
# brew install gh (macOS)
# or see: https://cli.github.com/

# Authenticate
gh auth login

# Create each issue
gh issue create --title "PWA Store Readiness - Make StackMap PWA ready for app store requirements" --body-file mobile-launch-issues/issue-1-pwa-store-readiness.md --label "enhancement" --label "mobile" --label "pwa"

gh issue create --title "Android TWA Wrapper - Create Android app using Trusted Web Activity" --body-file mobile-launch-issues/issue-2-android-twa-wrapper.md --label "enhancement" --label "mobile" --label "android" --label "twa"

gh issue create --title "iOS PWA Wrapper - Create iOS app wrapper for StackMap" --body-file mobile-launch-issues/issue-3-ios-pwa-wrapper.md --label "enhancement" --label "mobile" --label "ios" --label "swift"

gh issue create --title "Store Metadata - Prepare all store listing materials for StackMap" --body-file mobile-launch-issues/issue-4-store-metadata.md --label "enhancement" --label "mobile" --label "marketing" --label "content"
```

## Issue Dependencies
1. **PWA Store Readiness** - This is the foundation and should be completed first
2. **Android TWA Wrapper** - Depends on PWA readiness
3. **iOS PWA Wrapper** - Depends on PWA readiness
4. **Store Metadata** - Can be worked on in parallel but needs input from wrapper implementations

## Timeline
- Total timeline: 2 weeks
- Week 1: PWA Store Readiness + Start Store Metadata
- Week 2: Android/iOS Wrappers + Finalize Store Metadata

## Additional Notes
- These issues are designed to be worked on by LLM developers
- Each issue contains detailed technical guidance and acceptance criteria
- The issues can be assigned to different AI agents for parallel development
- Regular sync meetings recommended to ensure consistency across platforms