# StackMap Onboarding Technical Sheet
## Extended Architecture & UX Patterns for SmilePile Implementation

*Version: January 2025*
*Purpose: Technical reference for implementing similar guided onboarding in Kotlin/Swift*

---

## Executive Summary

StackMap's onboarding system is a sophisticated multi-path wizard that adapts to user context, progressively collects data, and seamlessly transitions users into the app. The system prioritizes user agency while providing gentle guidance, using a state machine architecture with branching paths based on user type and intent.

### Key Principles
1. **Context-Aware Entry**: Detects first-time vs returning users, sync invites, and restoration needs
2. **Progressive Disclosure**: Only shows relevant options based on previous choices
3. **Minimal Friction**: Collects only essential data, with smart defaults
4. **Educational Integration**: Teaches through doing, not reading
5. **Graceful Degradation**: Handles errors without losing user progress

---

## 1. Architecture Overview

### State Machine Design

```
┌─────────────────────────────────────────────────┐
│                 ENTRY DETECTION                  │
│  • First-time user (empty state)                 │
│  • Sync invite URL (deep link)                   │
│  • Data restoration (returning user)             │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│              NAVIGATION CONTROLLER               │
│  • Step-based progression                        │
│  • History stack for back navigation             │
│  • Conditional branching                         │
│  • Animation orchestration                       │
└─────────────────────────────────────────────────┘
```

### Core Components

| Component | Responsibility | Platform Considerations |
|-----------|---------------|------------------------|
| **Entry Detector** | Determines initial state and path | URL parsing (web), UserDefaults/SharedPrefs (mobile) |
| **Step Manager** | Controls flow and transitions | NavigationController (iOS), Fragment/Activity (Android) |
| **Data Collector** | Temporary state management | Local component state, not persisted |
| **Validator** | Input verification and formatting | Platform-specific keyboard handling |
| **Completion Handler** | Commits data and transitions to app | Atomic writes to persistent storage |

---

## 2. User Flow Patterns

### Decision Tree Architecture

```
                    [Welcome Screen]
                    /              \
            New User                Existing User
                |                        |
          [User Type]              [Restore Choice]
         /     |     \              /          \
      Self  Helper  Group    Sync Join    Backup Import
        |      |      |           |              |
   [Device]  [PIN]  [PIN]    [Enter Code]  [Select File]
        |      |      |           |              |
   Single/Multi                   |              |
        |                    [Preview]      [Preview]
        |                         |              |
  [User Setup]              [Auto Import]  [Manual Import]
        |                         |              |
   [Optional]                     └──────┬──────┘
   - PIN Setup                           |
   - Sync Enable                    [Complete]
        |
   [Complete]
```

### Path Routing Logic

```kotlin
// Kotlin example for SmilePile
sealed class OnboardingPath {
    object NewUser : OnboardingPath()
    object ExistingUser : OnboardingPath()
    data class SyncInvite(val code: String) : OnboardingPath()
}

class OnboardingRouter {
    fun determineInitialPath(context: Context): OnboardingPath {
        return when {
            hasDeepLink(context) -> parseSyncInvite(context)
            hasExistingData(context) -> OnboardingPath.ExistingUser
            else -> OnboardingPath.NewUser
        }
    }

    fun getStepsForPath(path: OnboardingPath): List<OnboardingStep> {
        return when (path) {
            is OnboardingPath.NewUser -> listOf(
                Welcome, UserType, DeviceStrategy, UserSetup, OptionalFeatures
            )
            is OnboardingPath.ExistingUser -> listOf(
                Welcome, RestoreChoice, DataImport, Complete
            )
            is OnboardingPath.SyncInvite -> listOf(
                SyncImport, AutoProcess, Complete
            )
        }
    }
}
```

```swift
// Swift example for SmilePile
enum OnboardingPath {
    case newUser
    case existingUser
    case syncInvite(code: String)
}

class OnboardingCoordinator {
    func determineInitialPath() -> OnboardingPath {
        if let deepLink = parseDeepLink() {
            return .syncInvite(code: deepLink.code)
        } else if UserDefaults.standard.bool(forKey: "hasExistingData") {
            return .existingUser
        } else {
            return .newUser
        }
    }

    func stepsForPath(_ path: OnboardingPath) -> [OnboardingStep] {
        switch path {
        case .newUser:
            return [.welcome, .userType, .deviceStrategy, .userSetup, .optionalFeatures]
        case .existingUser:
            return [.welcome, .restoreChoice, .dataImport, .complete]
        case .syncInvite:
            return [.syncImport, .autoProcess, .complete]
        }
    }
}
```

---

## 3. Data Collection Strategy

### Progressive Information Gathering

| Step | Data Collected | Required | Validation | Default Value |
|------|---------------|----------|------------|---------------|
| **User Type** | Role (self/helper/group) | Yes | Enum | None |
| **Device Strategy** | Single/Multi device | Yes | Enum | Single |
| **User Setup** | Name, Icon | Yes | Non-empty string | "User", 👤 |
| **PIN Setup** | 4-digit code | Conditional | Length=4, numeric | None |
| **Sync Setup** | Recovery phrase | Optional | 32 hex chars | Generated |

### Collection Philosophy

1. **Ask Once, Use Everywhere**: Data collected during onboarding seeds the entire app experience
2. **Smart Defaults**: Pre-select most common options (single device, no PIN for personal use)
3. **Conditional Paths**: Only show PIN setup for helper/group modes
4. **Immediate Value**: Each piece of data has immediate visible effect

### State Management Pattern

```kotlin
// Kotlin - Temporary state during onboarding
data class OnboardingState(
    val currentStep: OnboardingStep = OnboardingStep.Welcome,
    val navigationHistory: List<OnboardingStep> = listOf(),
    val userData: UserData = UserData(),
    val journey: JourneyData = JourneyData()
)

data class UserData(
    val name: String = "",
    val icon: String = "👤",
    val additionalUsers: List<User> = emptyList()
)

data class JourneyData(
    val userType: UserType? = null,
    val deviceStrategy: DeviceStrategy? = null,
    val syncEnabled: Boolean = false,
    val pinEnabled: Boolean = false
)

// State is NOT persisted until completion
class OnboardingViewModel {
    private val _state = MutableStateFlow(OnboardingState())

    fun completeOnboarding() {
        // Only now write to persistent storage
        persistentStore.saveUsers(_state.value.userData)
        persistentStore.setOnboardingComplete(true)
    }
}
```

---

## 4. UX Patterns & Interactions

### Visual Hierarchy

```
┌─────────────────────────────────────┐
│         [Back] Title                 │  <- Navigation
├─────────────────────────────────────┤
│                                     │
│          Main Content               │  <- Primary focus
│         (Cards/Forms)               │
│                                     │
├─────────────────────────────────────┤
│        [Secondary Actions]          │  <- Optional
├─────────────────────────────────────┤
│         [Primary Action]            │  <- Clear CTA
└─────────────────────────────────────┘
```

### Interaction Patterns

#### Card Selection Pattern
Used for: User type, device strategy, restore options

```kotlin
// Visual feedback for selection
@Composable
fun SelectionCard(
    title: String,
    icon: String,
    selected: Boolean,
    onSelect: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect() }
            .animateContentSize(),
        elevation = if (selected) 8.dp else 2.dp,
        backgroundColor = if (selected) primaryColor else surfaceColor
    ) {
        // Content
    }
}
```

**Key Elements:**
- Immediate visual feedback (elevation, color)
- Full card is tappable (large touch target)
- Auto-advance after selection (reduces taps)
- Animation confirms selection

#### Form Input Pattern
Used for: User name, PIN entry, sync code

```swift
// Swift - Progressive validation
struct UserNameInput: View {
    @State private var name: String = ""
    @State private var isValid: Bool = false

    var body: some View {
        VStack {
            TextField("Enter name", text: $name)
                .onChange(of: name) { newValue in
                    isValid = !newValue.trimmingCharacters(in: .whitespaces).isEmpty
                }

            if !name.isEmpty && !isValid {
                Text("Name cannot be empty")
                    .foregroundColor(.red)
                    .transition(.opacity)
            }

            Button("Continue") {
                // Action
            }
            .disabled(!isValid)
            .opacity(isValid ? 1.0 : 0.5)
        }
    }
}
```

**Key Elements:**
- Real-time validation feedback
- Clear error states
- Disabled state for invalid input
- Keyboard management (auto-focus, done button)

### Animation Strategy

```kotlin
// Platform-optimized animations
object OnboardingAnimations {
    fun getTransitionDuration(platform: Platform): Long {
        return when (platform) {
            Platform.IOS -> 100L  // Minimal to prevent freezes
            Platform.ANDROID -> 200L  // Standard material
            Platform.WEB -> 150L  // Balanced
        }
    }

    fun animateStepTransition(
        fromStep: OnboardingStep,
        toStep: OnboardingStep,
        onComplete: () -> Unit
    ) {
        // Fade out current
        fadeOut(duration = getTransitionDuration() / 2) {
            // Update content
            updateContent(toStep)
            // Fade in new
            fadeIn(duration = getTransitionDuration() / 2) {
                onComplete()
            }
        }
    }
}
```

---

## 5. Educational Integration

### Learning Through Doing

Instead of tutorial screens, StackMap uses **starter activities** that teach features:

```kotlin
data class StarterActivity(
    val id: String,
    val title: String,
    val icon: String,
    val description: String,
    val teachesFeature: Feature
)

val starterActivities = listOf(
    StarterActivity(
        title = "Welcome to SmilePile!",
        icon = "👋",
        description = "Tap activities to mark them complete",
        teachesFeature = Feature.BASIC_INTERACTION
    ),
    StarterActivity(
        title = "Try Edit Mode",
        icon = "✏️",
        description = "Use edit button to organize activities",
        teachesFeature = Feature.EDIT_MODE
    )
    // ... more educational tasks
)
```

**Advantages:**
- Users learn by using actual features
- No separate tutorial to skip
- Tasks remain as reference
- Natural progression of complexity

### Contextual Hints

```swift
struct SyncCodeInput: View {
    @State private var code: String = ""

    var formatHint: String {
        if code.contains("#") {
            return "Invite: \(inviteCode) • Key: \(keyLength)/32"
        } else if code.count > 0 {
            return "\(code.count)/32 characters"
        } else {
            return "Enter invite code or recovery phrase"
        }
    }
}
```

---

## 6. Sync & Restoration Flow

### Sync Architecture for Onboarding

```
User Chooses Sync → Generate Keys → Create Invite → Display Options
                         ↓
                  [32-char hex phrase]
                         ↓
              ┌──────────┴──────────┐
              │                     │
         [QR Code]            [Invite Code]
         (Full phrase)        (ABCD-1234)
              │                     │
              └──────────┬──────────┘
                         ↓
                  Store Locally &
                  Enable Sync
```

### Deep Link Handling

```kotlin
// Android - Handle sync deep links
class OnboardingActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Check for deep link
        intent?.data?.let { uri ->
            when {
                uri.path?.startsWith("/sync/") == true -> {
                    val parts = uri.path!!.split("/")
                    if (parts.size >= 3) {
                        startSyncImport(
                            inviteCode = parts[2],
                            recoveryPhrase = parts.getOrNull(3)
                        )
                    }
                }
                uri.getQueryParameter("sync") != null -> {
                    startSyncImport(
                        recoveryPhrase = uri.getQueryParameter("sync")
                    )
                }
                else -> startNormalOnboarding()
            }
        } ?: startNormalOnboarding()
    }
}
```

```swift
// iOS - Handle sync deep links
class OnboardingCoordinator {
    func handleDeepLink(_ url: URL) -> Bool {
        if url.path.starts(with: "/sync/") {
            let components = url.path.split(separator: "/")
            if components.count >= 3 {
                startSyncImport(
                    inviteCode: String(components[2]),
                    recoveryPhrase: components.count > 3 ? String(components[3]) : nil
                )
                return true
            }
        } else if let syncParam = URLComponents(url: url, resolvingAgainstBaseURL: false)?
            .queryItems?
            .first(where: { $0.name == "sync" })?
            .value {
            startSyncImport(recoveryPhrase: syncParam)
            return true
        }
        return false
    }
}
```

### Preview Before Import

```kotlin
data class SyncPreview(
    val userCount: Int,
    val users: List<UserPreview>,
    val hasActivityLibrary: Boolean,
    val lastSyncTime: String?
)

suspend fun fetchSyncPreview(recoveryPhrase: String): SyncPreview {
    val encryptedData = syncService.fetchData(recoveryPhrase)
    val decrypted = decrypt(encryptedData, recoveryPhrase)

    return SyncPreview(
        userCount = decrypted.users.size,
        users = decrypted.users.map { UserPreview(it.name, it.icon) },
        hasActivityLibrary = decrypted.library?.isNotEmpty() == true,
        lastSyncTime = decrypted.metadata?.lastSync
    )
}

// Display preview before committing
@Composable
fun SyncPreviewScreen(preview: SyncPreview, onConfirm: () -> Unit) {
    Column {
        Text("Found SmilePile data with:")

        Row {
            Icon("👥")
            Text("${preview.userCount} users")
        }

        LazyRow {
            items(preview.users) { user ->
                UserChip(user.name, user.icon)
            }
        }

        if (preview.hasActivityLibrary) {
            Row {
                Icon("📚")
                Text("Activity library included")
            }
        }

        Button("Import This Data", onClick = onConfirm)
    }
}
```

---

## 7. Transition to Main App

### Completion Handler Pattern

```kotlin
class OnboardingCompletionHandler(
    private val userStore: UserStore,
    private val settingsStore: SettingsStore,
    private val syncService: SyncService
) {
    suspend fun completeOnboarding(data: OnboardingData) {
        when (data) {
            is OnboardingData.NewUser -> handleNewUser(data)
            is OnboardingData.SyncImport -> handleSyncImport(data)
            is OnboardingData.BackupRestore -> handleBackupRestore(data)
        }

        // Mark complete AFTER data is saved
        settingsStore.setOnboardingComplete(true)

        // Trigger main app launch
        navigateToMainApp()
    }

    private suspend fun handleNewUser(data: OnboardingData.NewUser) {
        // Create users with starter content
        val users = data.users.mapIndexed { index, userData ->
            User(
                id = generateUserId(),
                name = userData.name,
                icon = userData.icon,
                activities = if (index == 0) getStarterActivities() else emptyList()
            )
        }

        userStore.setUsers(users)
        userStore.setCurrentUser(users.first().id)

        // Handle optional features
        if (data.pinEnabled) {
            secureStorage.savePin(data.pin)
        }

        if (data.syncEnabled) {
            syncService.enable(data.recoveryPhrase)
        }
    }
}
```

### Seamless Handoff

```swift
// iOS - Transition animation
class OnboardingViewController: UIViewController {
    func completeOnboarding() {
        // Save data
        onboardingHandler.complete(collectedData) { [weak self] in
            // Animate transition
            UIView.animate(withDuration: 0.3, animations: {
                self?.view.alpha = 0
            }) { _ in
                // Switch root view controller
                let mainVC = MainViewController()
                self?.view.window?.rootViewController = mainVC

                // Fade in main app
                mainVC.view.alpha = 0
                UIView.animate(withDuration: 0.3) {
                    mainVC.view.alpha = 1
                }

                // Show success toast
                ToastManager.show("Welcome to SmilePile!")
            }
        }
    }
}
```

---

## 8. Error Handling & Recovery

### Graceful Degradation Strategy

```kotlin
sealed class OnboardingError {
    object NetworkTimeout : OnboardingError()
    object InvalidSyncCode : OnboardingError()
    object StorageFailure : OnboardingError()
    data class Unknown(val message: String) : OnboardingError()
}

class OnboardingErrorHandler {
    fun handle(error: OnboardingError, context: OnboardingContext): ErrorRecovery {
        return when (error) {
            is NetworkTimeout -> ErrorRecovery.Retry(
                message = "Connection timed out. Check your internet and try again.",
                canContinueOffline = true
            )

            is InvalidSyncCode -> ErrorRecovery.UserAction(
                message = "Invalid sync code. Please check and try again.",
                showAlternatives = true,
                alternatives = listOf("Start fresh", "Import backup")
            )

            is StorageFailure -> ErrorRecovery.Critical(
                message = "Unable to save data. Please check storage permissions.",
                allowRestart = true
            )

            is Unknown -> ErrorRecovery.Report(
                message = "Something went wrong. Would you like to report this?",
                fallbackAction = "Start fresh without sync"
            )
        }
    }
}
```

### State Preservation

```swift
// Preserve progress during interruptions
class OnboardingStateManager {
    private let tempKey = "onboarding_temp_state"

    func saveProgress(_ state: OnboardingState) {
        // Save to temporary storage (not UserDefaults)
        let encoded = try? JSONEncoder().encode(state)
        FileManager.default.temporaryDirectory
            .appendingPathComponent(tempKey)
            .write(encoded)
    }

    func restoreProgress() -> OnboardingState? {
        guard let data = try? Data(contentsOf:
            FileManager.default.temporaryDirectory
                .appendingPathComponent(tempKey)
        ) else { return nil }

        return try? JSONDecoder().decode(OnboardingState.self, from: data)
    }

    func clearProgress() {
        try? FileManager.default.removeItem(at:
            FileManager.default.temporaryDirectory
                .appendingPathComponent(tempKey)
        )
    }
}
```

---

## 9. Platform-Specific Considerations

### iOS Optimization

```swift
// Minimize animation complexity for iOS
struct IOSOptimizedTransitions {
    static let duration: Double = 0.1  // 100ms max
    static let useSpringAnimation = false  // Avoid spring physics
    static let useGPUAcceleration = true

    static func transition(from: AnyView, to: AnyView) -> AnyView {
        // Simple fade only
        return AnyView(
            to.transition(.opacity)
                .animation(.linear(duration: duration))
        )
    }
}

// Debounce AsyncStorage writes
class DebouncedStorage {
    private var writeTimer: Timer?
    private let delay: TimeInterval = 2.0  // 2 second delay

    func scheduleSave(_ data: Any) {
        writeTimer?.invalidate()
        writeTimer = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { _ in
            self.performSave(data)
        }
    }
}
```

### Android Optimization

```kotlin
// Material Design compliance
object AndroidOnboardingTheme {
    val cardElevation = 4.dp
    val selectedElevation = 8.dp
    val cornerRadius = 8.dp
    val rippleEffect = true

    @Composable
    fun OnboardingCard(
        content: @Composable () -> Unit
    ) {
        Card(
            elevation = cardElevation,
            shape = RoundedCornerShape(cornerRadius),
            modifier = Modifier.clickable(
                indication = rememberRipple(),
                interactionSource = remember { MutableInteractionSource() }
            ) { /* click */ }
        ) {
            content()
        }
    }
}

// Handle back button properly
class OnboardingActivity : AppCompatActivity() {
    override fun onBackPressed() {
        if (viewModel.canGoBack()) {
            viewModel.goBack()
        } else {
            // Show confirmation dialog
            showExitConfirmation()
        }
    }
}
```

### Responsive Web Design

```typescript
// Web-specific responsive breakpoints
const OnboardingContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 10px;
    max-width: 100%;
  }

  @media (min-width: 1200px) {
    max-width: 800px;
  }
`;

// QR code generation for web
function generateSyncQR(recoveryPhrase: string): string {
  const url = `${window.location.origin}/sync/${recoveryPhrase}`;
  return QRCode.toDataURL(url, {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
}
```

---

## 10. Testing & Validation

### Test Scenarios

```kotlin
class OnboardingTestScenarios {
    @Test
    fun `test new user flow with sync`() {
        // 1. Start fresh
        launchOnboarding(clearData = true)

        // 2. Select new user
        selectOption("I'm new to SmilePile")

        // 3. Choose helper mode (triggers PIN)
        selectOption("Helper/Provider")

        // 4. Choose multi-device (triggers sync)
        selectOption("Multiple devices")

        // 5. Create user
        enterText("userName", "Test Helper")
        selectEmoji("👨‍⚕️")
        clickButton("Add User")

        // 6. Set PIN
        enterPin("1234")
        confirmPin("1234")

        // 7. Enable sync
        selectOption("Enable Sync")

        // 8. Verify completion
        assertDataSaved()
        assertSyncEnabled()
        assertPinSet()
        assertNavigatedToMainApp()
    }

    @Test
    fun `test sync invite deep link`() {
        // 1. Launch with deep link
        launchWithUrl("/sync/ABCD-1234/0123456789abcdef...")

        // 2. Verify auto-navigation to import
        assertCurrentStep("syncImport")

        // 3. Verify auto-fetch preview
        waitForPreview()
        assertPreviewDisplayed()

        // 4. Verify auto-import
        waitForImport()
        assertDataImported()
        assertSyncEnabled()
    }
}
```

### Metrics to Track

| Metric | Purpose | Target |
|--------|---------|--------|
| **Completion Rate** | % who finish onboarding | >85% |
| **Time to Complete** | Average duration | <2 minutes |
| **Drop-off Points** | Where users abandon | Identify friction |
| **Path Distribution** | Which flows are used | Understand user types |
| **Error Rate** | Failed sync/imports | <5% |
| **Retry Success** | Recovery from errors | >70% |
| **Feature Adoption** | PIN/Sync enablement | Track engagement |

---

## 11. Lessons Learned & Best Practices

### What Works Well

1. **Auto-advance reduces friction**: After selecting an option, automatically move to next step
2. **Preview builds trust**: Showing what will be imported before committing
3. **Starter activities teach better than tutorials**: Learning by doing is more effective
4. **Platform-specific optimizations matter**: iOS needs minimal animations, Android wants Material Design
5. **Deep links accelerate adoption**: Sync invites bypass most of onboarding
6. **Progressive disclosure prevents overwhelm**: Only show options relevant to user's path

### Common Pitfalls to Avoid

1. **Don't persist state too early**: Keep onboarding data temporary until completion
2. **Don't over-animate on iOS**: Causes freezes and poor experience
3. **Don't require network**: Allow offline completion with sync later
4. **Don't make assumptions**: Always provide escape hatches and alternatives
5. **Don't block on validation**: Show errors inline, don't prevent progress

### Implementation Recommendations for SmilePile

1. **Start with the simplest path**: Build new user flow first, add restoration later
2. **Use native navigation**: UINavigationController (iOS), Navigation Component (Android)
3. **Keep state local**: Don't write to persistent storage until onboarding completes
4. **Design for interruption**: Save progress temporarily, allow resume
5. **Test with real devices**: Simulators hide performance issues
6. **Measure everything**: Track every step transition and error
7. **Provide alternatives**: Always have a "skip" or "do later" option
8. **Respect platform conventions**: Don't force iOS to look like Android or vice versa

### Architecture Decision Records

| Decision | Rationale | Alternative Considered |
|----------|-----------|----------------------|
| **Step-based navigation** | Clear progress, easy back button | Free-form wizard |
| **Local state management** | Avoid corrupting app data | Direct store writes |
| **Auto-advance on selection** | Reduces taps, feels responsive | Explicit "Next" button |
| **Preview before import** | Builds trust, prevents surprises | Blind import |
| **Starter activities** | Learn by doing | Separate tutorial |
| **Deep link support** | Accelerates multi-device setup | Manual code entry only |

---

## 12. Code Structure Recommendations

### Kotlin/Android Structure

```
onboarding/
├── OnboardingActivity.kt           # Main container
├── OnboardingViewModel.kt          # State management
├── navigation/
│   ├── OnboardingNavHost.kt       # Navigation graph
│   └── OnboardingRouter.kt        # Path logic
├── screens/
│   ├── WelcomeScreen.kt
│   ├── UserTypeScreen.kt
│   ├── UserSetupScreen.kt
│   └── ...
├── components/
│   ├── SelectionCard.kt
│   ├── EmojiPicker.kt
│   └── PinInput.kt
├── data/
│   ├── OnboardingState.kt
│   └── OnboardingRepository.kt
└── utils/
    ├── DeepLinkHandler.kt
    └── ValidationUtils.kt
```

### Swift/iOS Structure

```
Onboarding/
├── OnboardingCoordinator.swift     # Flow management
├── OnboardingViewModel.swift       # State management
├── Screens/
│   ├── WelcomeView.swift
│   ├── UserTypeView.swift
│   ├── UserSetupView.swift
│   └── ...
├── Components/
│   ├── SelectionCard.swift
│   ├── EmojiPicker.swift
│   └── PinInputView.swift
├── Models/
│   ├── OnboardingState.swift
│   └── OnboardingPath.swift
├── Services/
│   ├── OnboardingService.swift
│   └── DeepLinkService.swift
└── Utils/
    ├── Animations.swift
    └── Validation.swift
```

---

## Conclusion

StackMap's onboarding represents a mature, battle-tested approach to user onboarding that balances simplicity with flexibility. The key insight is that onboarding is not just about collecting data—it's about building confidence, setting expectations, and creating a smooth transition into the app experience.

For SmilePile's implementation in Kotlin and Swift, focus on:
1. **State machine architecture** for predictable flow
2. **Progressive disclosure** to avoid overwhelming users
3. **Platform-native patterns** for familiar interactions
4. **Error resilience** with graceful recovery
5. **Measurement and iteration** based on real usage data

The patterns and principles documented here are platform-agnostic and can be adapted to any native mobile development framework while maintaining the core user experience philosophy that makes the onboarding successful.