# User Story Template

Use this template for Phase 2: Story Creation in the Atlas Full Workflow.

---

# User Story: [Feature Name]

## Story

**As a** [user type/persona]
**I want** [goal/desire]
**So that** [benefit/value]

### Context
[Brief background: Why is this needed? What problem does it solve?]

---

## Acceptance Criteria

### Must Have (Critical - Required for MVP):

1. [ ] **[Criterion 1]**: [Specific, testable requirement]
   - **Given**: [precondition]
   - **When**: [action]
   - **Then**: [expected result]

2. [ ] **[Criterion 2]**: [Specific, testable requirement]
   - **Given**: [precondition]
   - **When**: [action]
   - **Then**: [expected result]

3. [ ] **[Criterion 3]**: [Specific, testable requirement]
   - **Given**: [precondition]
   - **When**: [action]
   - **Then**: [expected result]

### Should Have (Important - Include if time allows):

1. [ ] **[Criterion 1]**: [Nice-to-have requirement]
2. [ ] **[Criterion 2]**: [Nice-to-have requirement]

### Could Have (Optional - Defer if needed):

1. [ ] **[Criterion 1]**: [Optional enhancement]
2. [ ] **[Criterion 2]**: [Optional enhancement]

### Platform-Specific Requirements:

- **iOS**:
  - [ ] [iOS-specific requirement]
  - [ ] [iOS-specific requirement]

- **Android**:
  - [ ] [Android-specific requirement]
  - [ ] [Android-specific requirement]

- **Web**:
  - [ ] [Web-specific requirement]
  - [ ] [Web-specific requirement]

---

## Success Metrics

Define how success will be measured:

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| [Metric 1] | [Target value] | [How to measure] |
| [Metric 2] | [Target value] | [How to measure] |
| [Metric 3] | [Target value] | [How to measure] |

### Examples:
- **Adoption**: 80% of active users use feature in first week
- **Performance**: Feature loads in < 3 seconds
- **Reliability**: 99%+ success rate (< 1% error rate)
- **User Satisfaction**: 4+ star rating in feedback

---

## Testing Scenarios

### Happy Path (Primary User Flow):

**Scenario 1: [Primary use case]**
1. [Step 1]
2. [Step 2]
3. [Step 3]
4. **Expected**: [What should happen]

**Scenario 2: [Secondary use case]**
1. [Step 1]
2. [Step 2]
3. **Expected**: [What should happen]

### Edge Cases:

**Empty State**:
- **Given**: [No data exists]
- **When**: [User accesses feature]
- **Then**: [Show empty state with clear messaging]

**Error State**:
- **Given**: [Network/server error occurs]
- **When**: [User performs action]
- **Then**: [Show error message with retry option]

**Offline Mode**:
- **Given**: [Device offline]
- **When**: [User performs action]
- **Then**: [Queue action for later OR show offline message]

**Large Data Set**:
- **Given**: [Many items (100+)]
- **When**: [User loads feature]
- **Then**: [Pagination OR virtualization, performance maintained]

**Slow Network**:
- **Given**: [Slow 3G connection]
- **When**: [User loads feature]
- **Then**: [Show loading state, graceful degradation]

**Concurrent Access**:
- **Given**: [Feature accessed on multiple devices]
- **When**: [Changes made on both]
- **Then**: [Sync correctly, handle conflicts]

**Old App Version**:
- **Given**: [User on older app version]
- **When**: [Feature accessed]
- **Then**: [Backwards compatible OR clear upgrade prompt]

---

## Dependencies

### External Dependencies:
- [External API, service, or package]
- [External API, service, or package]

### Internal Dependencies:
- [Internal module, component, or service]
- [Internal module, component, or service]

### Platform Dependencies:
- **iOS**: [iOS-specific SDK, permission, etc.]
- **Android**: [Android-specific SDK, permission, etc.]
- **Web**: [Browser API, polyfill, etc.]

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| [Risk 1] | High/Med/Low | High/Med/Low | [How to prevent/handle] |
| [Risk 2] | High/Med/Low | High/Med/Low | [How to prevent/handle] |
| [Risk 3] | High/Med/Low | High/Med/Low | [How to prevent/handle] |

### Common Risks:
- **Performance**: Slow load times → Mitigation: Lazy loading, caching
- **Security**: Data exposure → Mitigation: Encryption, authentication
- **Usability**: Confusing UI → Mitigation: User testing, clear messaging
- **Reliability**: Service downtime → Mitigation: Retry logic, offline support
- **Cost**: High cloud costs → Mitigation: Usage limits, optimization

---

## Out of Scope (Explicitly NOT Included)

Clearly state what is NOT part of this story:

1. [Feature/functionality explicitly excluded]
2. [Feature/functionality explicitly excluded]
3. [Feature/functionality explicitly excluded]

---

## Design Assets (if applicable)

- Wireframes: [Link to Figma, Sketch, etc.]
- Mockups: [Link to design files]
- User Flow: [Link to flow diagram]
- Prototype: [Link to interactive prototype]

---

## Technical Notes

- [Important technical consideration]
- [Important technical consideration]
- [Important technical consideration]

---

## Definition of Done

This story is complete when:

- [ ] All "Must Have" acceptance criteria met
- [ ] All testing scenarios pass
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Deployed to QUAL and tested
- [ ] Performance metrics meet targets
- [ ] No critical bugs
- [ ] Stakeholder sign-off (if required)

---

## Estimated Effort

| Phase | Estimated Time |
|-------|----------------|
| Research | [hours] |
| Planning | [hours] |
| Implementation | [hours] |
| Testing | [hours] |
| Documentation | [hours] |
| **Total** | **[hours]** |

---

## Example: Photo Attachments for Activities

# User Story: Photo Attachments for Activities

## Story

**As an** active StackMap user
**I want** to attach photos to my activities
**So that** I can add visual context and make my activity log more engaging and memorable

### Context
Users have requested the ability to add photos to activities to provide visual
proof, context, or simply make their logs more personal and engaging. This is
especially valuable for activities like "Went to the gym" (show workout),
"Cooked dinner" (show meal), "Went hiking" (show scenery).

---

## Acceptance Criteria

### Must Have:

1. [ ] **Photo Selection**: User can select photo from device gallery
   - **Given**: User editing an activity
   - **When**: User taps "Add Photo" button
   - **Then**: Device photo picker opens

2. [ ] **Camera Capture**: User can take new photo with camera
   - **Given**: User editing an activity
   - **When**: User taps "Add Photo" → "Take Photo"
   - **Then**: Camera opens, photo captured and attached

3. [ ] **Photo Limit**: Free users can attach up to 3 photos per activity
   - **Given**: User has attached 3 photos
   - **When**: User taps "Add Photo"
   - **Then**: Prompt to upgrade to premium (or replace existing photo)

4. [ ] **Thumbnail Display**: Photos display as thumbnails in activity card
   - **Given**: Activity has attached photos
   - **When**: Activity displayed in list
   - **Then**: Up to 3 thumbnails shown (compact layout)

5. [ ] **Full-Screen Viewer**: Tapping thumbnail opens full-screen viewer
   - **Given**: Activity has photos
   - **When**: User taps thumbnail
   - **Then**: Full-screen viewer opens with swipe navigation

6. [ ] **Photo Deletion**: User can delete attached photos
   - **Given**: Activity has photos
   - **When**: User taps delete icon on photo
   - **Then**: Confirmation prompt → Photo removed

7. [ ] **Photo Sync**: Photos sync across devices (URLs, not files)
   - **Given**: Photos attached on device A
   - **When**: User opens app on device B
   - **Then**: Photo URLs synced, photos display correctly

8. [ ] **Upload Progress**: Upload shows progress indicator
   - **Given**: User attaching large photo
   - **When**: Upload in progress
   - **Then**: Progress bar shows 0-100%

9. [ ] **Error Handling**: Failed uploads show error with retry
   - **Given**: Network error during upload
   - **When**: Upload fails
   - **Then**: Error message + "Retry" button shown

10. [ ] **Photo Optimization**: Photos compressed for performance
    - **Given**: User uploads 10MB photo
    - **When**: Photo processed
    - **Then**: Compressed to ~1MB max, thumbnail generated

### Should Have:

1. [ ] **Photo Reordering**: User can reorder photos (drag & drop)
2. [ ] **Photo Metadata**: Photos include timestamp/location
3. [ ] **Swipe Navigation**: Swipe gestures in full-screen viewer
4. [ ] **Share to Social**: Share photo to social media

### Platform-Specific:

- **iOS**:
  - [ ] Request camera permission (NSCameraUsageDescription)
  - [ ] Request photo library permission (NSPhotoLibraryUsageDescription)
  - [ ] Handle permission denial gracefully (clear message)

- **Android**:
  - [ ] Request camera permission (android.permission.CAMERA)
  - [ ] Request storage permission (android.permission.READ_EXTERNAL_STORAGE)
  - [ ] Handle permission denial gracefully (clear message)

- **Web**:
  - [ ] Use file input (no native picker available)
  - [ ] Support drag-and-drop photo upload
  - [ ] Show clear instructions for desktop users

---

## Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Adoption** | 80%+ of active users attach at least one photo in first week | Firebase Analytics event tracking |
| **Performance** | Average upload time < 3 seconds | Performance monitoring |
| **Performance** | Photo thumbnail display < 200ms | Performance monitoring |
| **Reliability** | 99%+ upload success rate | Error tracking |
| **Quality** | Zero storage-related crashes | Crash reporting |

---

## Testing Scenarios

### Happy Path:

**Scenario 1: Attach photo from gallery**
1. User edits activity
2. Taps "Add Photo"
3. Selects photo from gallery
4. Photo uploads with progress bar
5. Thumbnail displays in activity card
6. **Expected**: Photo attached successfully, thumbnail visible

**Scenario 2: Take photo with camera**
1. User edits activity
2. Taps "Add Photo" → "Take Photo"
3. Camera opens
4. User takes photo
5. Photo uploads
6. **Expected**: Photo attached from camera, thumbnail visible

### Edge Cases:

**Empty State**:
- **Given**: Activity has no photos
- **When**: Activity displayed
- **Then**: No photo thumbnails shown, compact layout

**Error State**:
- **Given**: Network error during upload
- **When**: Upload fails
- **Then**: Error message: "Upload failed. Check connection." + Retry button

**Offline Mode**:
- **Given**: Device offline
- **When**: User attaches photo
- **Then**: Photo queued, "Will upload when online" message shown

**Large Data Set**:
- **Given**: User has 100+ activities with photos
- **When**: User scrolls activity list
- **Then**: Lazy loading, only visible photos loaded, smooth scrolling

**Slow Network**:
- **Given**: Slow 3G connection
- **When**: User uploads photo
- **Then**: Progress bar shows, upload may take 10+ seconds, cancellable

**Permissions Denied**:
- **Given**: User denies camera/photo permission
- **When**: User taps "Add Photo"
- **Then**: Message: "Camera permission required. Enable in Settings."

**Storage Full**:
- **Given**: Firebase Storage quota exceeded
- **When**: User uploads photo
- **Then**: Error: "Storage full. Please delete old photos or upgrade."

---

## Dependencies

### External Dependencies:
- `expo-image-picker` - Photo selection and camera access
- `firebase-storage` - Cloud photo storage
- `react-native-fast-image` - Thumbnail caching and performance

### Internal Dependencies:
- `useAppStore` - Activity state management
- `syncService` - Photo URL syncing (not files)
- `dataNormalizer` - Photo data structure normalization

### Platform Dependencies:
- **iOS**: Info.plist permissions, iOS 11+
- **Android**: AndroidManifest.xml permissions, Android 5+
- **Web**: File API, drag-and-drop API

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| High storage costs | Medium | High | Compression, size limits, cleanup policy |
| Permission denial | High | Medium | Clear messaging, settings link, graceful fallback |
| Upload failures on poor network | High | Medium | Retry logic, offline queue, cancellable uploads |
| Photo deletion not synced | Low | High | Include deleted photo URLs in sync payload |
| Performance on old devices | Medium | Medium | Lazy loading, thumbnail optimization, memory limits |

---

## Out of Scope (Explicitly NOT Included)

1. Video attachments (future consideration)
2. Photo editing (crop, rotate, filters) - use native editor
3. Cloud photo library integration (Google Photos, iCloud)
4. Photo captions (may add in v2)
5. Unlimited photos (premium feature, not in this story)

---

## Design Assets

- Wireframes: [Link to Figma]
- Mockups: [Link to design files]
- User Flow: [Link to flow diagram]

---

## Technical Notes

- Photos stored in Firebase Storage, not in sync data (too large)
- Sync only photo URLs, not photo files
- Thumbnail generation: 200x200px, JPEG 80% quality
- Photo compression: Max 1080p, JPEG 85% quality
- Storage structure: `/photos/{userId}/{activityId}/{photoId}.jpg`

---

## Definition of Done

- [ ] All 10 "Must Have" acceptance criteria met
- [ ] All testing scenarios pass (happy path + edge cases)
- [ ] Code reviewed and approved
- [ ] Documentation updated (user guide, developer docs)
- [ ] Deployed to QUAL and tested on all platforms
- [ ] Performance metrics meet targets (< 3s upload, < 200ms display)
- [ ] No critical bugs
- [ ] Product team sign-off

---

## Estimated Effort

| Phase | Estimated Time |
|-------|----------------|
| Research | 0.5 hours |
| Story Creation | 0.25 hours |
| Planning | 0.5 hours |
| Adversarial Review | 0.25 hours |
| Implementation | 1.5 hours |
| Testing | 0.75 hours |
| Validation | 0.25 hours |
| Clean-up | 0.25 hours |
| Deployment | 0.5 hours |
| **Total** | **4.75 hours** |
