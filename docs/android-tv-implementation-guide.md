# StackMap Android TV Implementation Guide

## Executive Summary
This guide provides everything needed to build a focused Android TV version of StackMap that provides the core user mode experience with seamless sync. The TV app will be read-mostly with marking complete as the primary interaction, perfect for living room usage.

---

## Part 1: Core User Experience

### What Users Can Do on TV
1. **View activities** for Today/Tomorrow
2. **Mark activities complete** (primary interaction)
3. **Switch between users** (family support)
4. **Switch between Today/Tomorrow**
5. **View activity details** (emoji, title, description)
6. **See completion animations**

### What Users CANNOT Do (by design)
- Add new activities (sync from mobile/web)
- Edit activities
- Delete activities
- Reorder activities
- Access Activity Library
- Manage categories
- Configure settings beyond theme

This constraint makes the TV app simpler and focuses on the consumption experience.

---

## Part 2: Visual Design Specifications

### Theme System
```kotlin
// Use exact colors from StackMap
object StackMapThemes {
    data class Theme(
        val primary: String,
        val dark: String,
        val light: String
    )

    val themes = mapOf(
        "crimson" to Theme("#DC143C", "#B91C3C", "#E85D75"),
        "cherry" to Theme("#DE3163", "#C42953", "#E85A7F"),
        "scarlet" to Theme("#CD5C5C", "#B94545", "#D98181"),
        "rust" to Theme("#B7410E", "#963508", "#D4642E"),
        "tangerine" to Theme("#F28500", "#D47200", "#FF9A33"),
        "amber" to Theme("#D97706", "#B45309", "#F59E0B"),
        "gold" to Theme("#B8860B", "#996F09", "#D4A017"),
        "olive" to Theme("#6B8E23", "#556B2F", "#8FBC8F"),
        "emerald" to Theme("#2D8659", "#236B48", "#3FA760"),
        "forest" to Theme("#228B22", "#1C6E1C", "#3CB371"),
        "ocean" to Theme("#2C7A7B", "#1F5F5F", "#4C9A9B"),
        "sapphire" to Theme("#0F52BA", "#0B3D8A", "#3770CF"),
        "navy" to Theme("#2C5282", "#1E3A5F", "#3B6FA0"),
        "indigo" to Theme("#4C1D95", "#3B1674", "#6B46B5"),
        "plum" to Theme("#8B5CF6", "#7C3AED", "#A78BFA"),
        // Neurodiversity-friendly
        "sage" to Theme("#6B7F6B", "#556655", "#8B9F8B"),
        "dustyBlue" to Theme("#4A6480", "#3B5066", "#6B859F"),
        "stackBlue" to Theme("#5C7E9D", "#4A6680", "#7896B3"),
        "terracotta" to Theme("#A0522D", "#804020", "#C07550"),
        "lavender" to Theme("#7B68A6", "#65538C", "#9785BD"),
        "slate" to Theme("#64748B", "#475569", "#8B95A6")
    )
}
```

### Font Requirements
**CRITICAL:** Must use Comic Relief font family
```kotlin
// Typography.kt - Custom TextView that forces Comic Relief
class ComicTextView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : AppCompatTextView(context, attrs) {
    init {
        typeface = Typeface.createFromAsset(context.assets, "fonts/ComicRelief.ttf")
    }
}
```

### Card Design Specifications
```kotlin
// Activity Card Layout
data class CardDimensions(
    val width: Int = 320.dp, // Fixed width for TV
    val height: Int = 240.dp,
    val padding: Int = 20.dp,
    val emojiSize: Int = 60.sp,
    val titleSize: Int = 24.sp,
    val descriptionSize: Int = 18.sp,
    val cornerRadius: Int = 24.dp
)

// Card States
sealed class CardState {
    object Normal : CardState()
    object Focused : CardState()
    object Completed : CardState()
}

// Visual properties per state
fun getCardStyle(state: CardState, theme: Theme): CardStyle {
    return when(state) {
        Normal -> CardStyle(
            background = Color.WHITE,
            border = Color.parseColor(theme.primary),
            borderWidth = 2.dp,
            elevation = 4.dp
        )
        Focused -> CardStyle(
            background = Color.WHITE,
            border = Color.parseColor(theme.primary),
            borderWidth = 4.dp,
            elevation = 12.dp,
            scale = 1.05f
        )
        Completed -> CardStyle(
            background = Color.parseColor(theme.light),
            border = Color.parseColor(theme.primary),
            borderWidth = 2.dp,
            elevation = 4.dp,
            textColor = Color.WHITE
        )
    }
}
```

### Completion Circle Design
```kotlin
// Completion indicator overlay
class CompletionCircle(
    val size: Int = 48.dp,
    val uncheckedColor: String = "#f0f0f0",
    val uncheckedBorder: String = "#e0e0e0",
    val checkedColor: String = theme.primary,
    val checkmarkColor: String = "#FFFFFF",
    val position: Position = Position.TOP_LEFT,
    val margin: Int = 12.dp
)
```

---

## Part 3: Android TV Specific Adaptations

### Navigation Pattern
```kotlin
// D-pad navigation handler
class ActivityGridAdapter : RecyclerView.Adapter<ActivityViewHolder>() {

    override fun onBindViewHolder(holder: ActivityViewHolder, position: Int) {
        holder.itemView.apply {
            isFocusable = true
            isFocusableInTouchMode = true

            setOnFocusChangeListener { view, hasFocus ->
                if (hasFocus) {
                    // Scale up and elevate
                    animate()
                        .scaleX(1.05f)
                        .scaleY(1.05f)
                        .setDuration(200)
                        .start()
                    elevation = 12.dp
                } else {
                    // Return to normal
                    animate()
                        .scaleX(1.0f)
                        .scaleY(1.0f)
                        .setDuration(200)
                        .start()
                    elevation = 4.dp
                }
            }

            setOnClickListener {
                toggleActivityCompletion(activities[position])
            }
        }
    }
}
```

### Grid Layout for TV
```kotlin
// 4 columns on TV (vs 3 on web, 2 on tablet, 1 on phone)
val spanCount = when {
    isTV() -> 4
    isTablet() -> 2
    else -> 1
}

recyclerView.layoutManager = GridLayoutManager(context, spanCount).apply {
    spanSizeLookup = object : GridLayoutManager.SpanSizeLookup() {
        override fun getSpanSize(position: Int): Int {
            // Headers take full width
            return if (adapter.getItemViewType(position) == TYPE_HEADER) {
                spanCount
            } else {
                1
            }
        }
    }
}
```

### Remote Control Mapping
```kotlin
override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
    return when (keyCode) {
        KeyEvent.KEYCODE_DPAD_CENTER,
        KeyEvent.KEYCODE_ENTER -> {
            // Toggle completion on focused item
            toggleFocusedActivity()
            true
        }
        KeyEvent.KEYCODE_MENU -> {
            // Show user switcher
            showUserSwitcher()
            true
        }
        KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
            // Alternative completion trigger
            toggleFocusedActivity()
            true
        }
        KeyEvent.KEYCODE_BACK -> {
            // Show exit confirmation
            if (shouldConfirmExit()) {
                showExitDialog()
                true
            } else {
                super.onKeyDown(keyCode, event)
            }
        }
        else -> super.onKeyDown(keyCode, event)
    }
}
```

---

## Part 4: Simplified Sync Implementation

### Recovery Phrase Input for TV
Since TV input is painful, use one of these approaches:

#### Option 1: QR Code Scanning (Recommended)
```kotlin
// Generate QR on mobile/web with recovery phrase
// TV app uses camera (if available) or companion app

class QRSyncActivity : AppCompatActivity() {
    private val qrScanner = QRCodeScanner()

    fun onQRScanned(data: String) {
        // Format: "stackmap://sync/RECOVERY_PHRASE_HERE"
        if (data.startsWith("stackmap://sync/")) {
            val recoveryPhrase = data.substring(16)
            initializeSync(recoveryPhrase)
        }
    }
}
```

#### Option 2: Simplified Code Entry
```kotlin
// Use 6-character simplified codes for TV
class SimplifiedSyncCode {
    // User enters 6-char code on TV
    // This maps to full recovery phrase stored server-side
    // Temporary codes expire after 24 hours

    fun enterCode(code: String) {
        // Format: "ABC123"
        api.exchangeCodeForPhrase(code) { recoveryPhrase ->
            initializeSync(recoveryPhrase)
        }
    }
}
```

#### Option 3: Companion App Pairing
```kotlin
// Mobile app pushes config to TV on same network
class CompanionSync {
    fun discoverTVs(): List<TVDevice> {
        // Use mDNS/Bonjour to find TVs
        return NetworkServiceDiscovery.find("_stackmap-tv._tcp")
    }

    fun pushToTV(tv: TVDevice, recoveryPhrase: String) {
        // Secure local transfer
        tv.sendEncrypted(recoveryPhrase)
    }
}
```

### Minimal Sync Service for TV
```kotlin
class TVSyncService {
    private val API_BASE = "https://stackmap.app/api/sync"
    private var syncId: String? = null
    private var encryptionKey: ByteArray? = null

    suspend fun initialize(recoveryPhrase: String) {
        // Derive sync ID and key
        syncId = deriveHexId(recoveryPhrase)
        encryptionKey = deriveKey(recoveryPhrase)

        // Start periodic pull (no push from TV)
        startPeriodicSync()
    }

    private fun startPeriodicSync() {
        lifecycleScope.launch {
            while (isActive) {
                pullData()
                delay(30_000) // 30 seconds
            }
        }
    }

    suspend fun pullData() {
        val response = api.pull(syncId, lastPullTime)
        if (response.success && response.data != null) {
            val decrypted = decrypt(response.data, encryptionKey)
            val syncData = parseSyncData(decrypted)
            updateLocalData(syncData)
        }
    }

    suspend fun markComplete(activityId: String, completed: Boolean) {
        // Update local immediately
        updateActivity(activityId, completed)

        // Push change to server
        val currentData = gatherAllData()
        val encrypted = encrypt(currentData, encryptionKey)
        api.push(syncId, encrypted)
    }
}
```

### Encryption (Simplified NaCl)
```kotlin
// Use TweetNaCl-Java for Android
import com.iwebpp.crypto.TweetNaclFast

class Encryption {
    fun deriveKey(recoveryPhrase: String): ByteArray {
        // Simple key derivation - match StackMap's approach
        var key = recoveryPhrase.toByteArray()
        repeat(100_000) {
            key = TweetNaclFast.Hash.sha256(key)
        }
        return key.sliceArray(0..31) // 32 bytes for secretbox
    }

    fun encrypt(data: String, key: ByteArray): String {
        val nacl = TweetNaclFast.SecretBox(key)
        val nonce = generateNonce() // 24 random bytes
        val encrypted = nacl.box(data.toByteArray(), nonce)
        return base64Encode(nonce + encrypted)
    }

    fun decrypt(encrypted: String, key: ByteArray): String {
        val data = base64Decode(encrypted)
        val nonce = data.sliceArray(0..23)
        val ciphertext = data.sliceArray(24 until data.size)
        val nacl = TweetNaclFast.SecretBox(key)
        val decrypted = nacl.open(ciphertext, nonce)
        return String(decrypted)
    }
}
```

---

## Part 5: Data Structure & Field Mapping

### Critical Field Names
**MUST match exactly for sync compatibility:**
```kotlin
data class Activity(
    val id: String,
    val text: String,        // NOT title or name!
    val icon: String,        // NOT emoji!
    val completed: Boolean,
    val completedAt: Long?,
    val description: String?,
    val order: Int,
    val deleted: Boolean = false
)

data class User(
    val id: String,
    val name: String,
    val icon: String,        // NOT emoji!
    val createdAt: String,
    val lastActive: String,
    val days: UserDays
)

data class UserDays(
    val today: DayData,
    val tomorrow: DayData
)

data class DayData(
    val activities: List<Activity>
)
```

### Data Normalizer (CRITICAL)
```kotlin
// Always normalize on data boundaries
class DataNormalizer {
    fun normalizeActivity(input: Map<String, Any>): Activity {
        return Activity(
            id = input["id"] as String,
            // CRITICAL: Check all possible field names
            text = (input["text"] ?: input["title"] ?: input["name"]) as String,
            icon = (input["icon"] ?: input["emoji"]) as String? ?: "🎯",
            completed = input["completed"] as Boolean? ?: false,
            completedAt = input["completedAt"] as Long?,
            description = input["description"] as String?,
            order = input["order"] as Int? ?: 0,
            deleted = input["deleted"] as Boolean? ?: false
        )
    }

    fun normalizeUser(input: Map<String, Any>): User {
        // Similar normalization for users
        return User(
            id = input["id"] as String,
            name = input["name"] as String,
            icon = (input["icon"] ?: input["emoji"]) as String? ?: "👤",
            // ... rest of fields
        )
    }
}
```

---

## Part 6: User Mode Behaviors

### Activity Completion Logic
```kotlin
class ActivityManager {
    fun toggleActivity(activity: Activity) {
        val updatedActivity = activity.copy(
            completed = !activity.completed,
            completedAt = if (!activity.completed) {
                System.currentTimeMillis()
            } else {
                null
            }
        )

        // Update local storage
        updateActivity(updatedActivity)

        // Trigger celebration if enabled
        if (updatedActivity.completed) {
            celebrateCompletion(activity)
        }

        // Sync change
        syncService.pushChange(updatedActivity)
    }

    private fun celebrateCompletion(activity: Activity) {
        // Play sound if enabled
        if (settings.soundEnabled) {
            playCompletionSound()
        }

        // Show visual celebration
        when (settings.celebrationType) {
            "confetti" -> showConfetti()
            "checkmark" -> showCheckmark()
            "none" -> {} // No celebration
        }
    }
}
```

### User Switching
```kotlin
class UserSwitcher {
    fun showUserSwitcher() {
        // Display grid of users with their icons
        val dialog = Dialog(context, R.style.FullScreenDialog)
        dialog.setContentView(R.layout.user_grid)

        val recyclerView = dialog.findViewById<RecyclerView>(R.id.userGrid)
        recyclerView.adapter = UserAdapter(users) { selectedUser ->
            switchToUser(selectedUser)
            dialog.dismiss()
        }

        dialog.show()
    }

    private fun switchToUser(user: User) {
        currentUserId = user.id
        loadUserActivities(user)
        updateUIForUser(user)
    }
}
```

### Day Switching
```kotlin
class DayManager {
    enum class Day { TODAY, TOMORROW }

    var currentDay = Day.TODAY

    fun switchDay() {
        currentDay = when (currentDay) {
            Day.TODAY -> Day.TOMORROW
            Day.TOMORROW -> Day.TODAY
        }
        refreshActivities()
    }

    fun getActivities(): List<Activity> {
        val user = getCurrentUser()
        return when (currentDay) {
            Day.TODAY -> user.days.today.activities
            Day.TOMORROW -> user.days.tomorrow.activities
        }.filter { !it.deleted }
    }
}
```

---

## Part 7: TV-Specific UI Components

### Leanback Integration
```kotlin
// Use Android TV Leanback library
dependencies {
    implementation "androidx.leanback:leanback:1.2.0"
}

class MainFragment : BrowseSupportFragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Set up headers
        headersState = HEADERS_DISABLED // Simple mode

        // Create rows
        val rowsAdapter = ArrayObjectAdapter(ListRowPresenter())

        // Today row
        val todayHeader = HeaderItem(0, "Today")
        val todayAdapter = ArrayObjectAdapter(ActivityPresenter())
        todayAdapter.addAll(0, getTodayActivities())
        rowsAdapter.add(ListRow(todayHeader, todayAdapter))

        // Tomorrow row
        val tomorrowHeader = HeaderItem(1, "Tomorrow")
        val tomorrowAdapter = ArrayObjectAdapter(ActivityPresenter())
        tomorrowAdapter.addAll(0, getTomorrowActivities())
        rowsAdapter.add(ListRow(tomorrowHeader, tomorrowAdapter))

        adapter = rowsAdapter
    }
}
```

### Activity Presenter for TV
```kotlin
class ActivityPresenter : Presenter() {
    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.activity_card_tv, parent, false)
        return ActivityViewHolder(view)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val activity = item as Activity
        val holder = viewHolder as ActivityViewHolder

        holder.apply {
            emojiView.text = activity.icon
            titleView.text = activity.text
            descriptionView.text = activity.description

            // Update completion state
            if (activity.completed) {
                cardView.setBackgroundColor(theme.light)
                completionCircle.visibility = View.VISIBLE
            } else {
                cardView.setBackgroundColor(Color.WHITE)
                completionCircle.visibility = View.GONE
            }
        }
    }
}
```

---

## Part 8: Quick Implementation Checklist

### Phase 1: Core Setup (Week 1)
- [ ] Set up Android TV project with Leanback
- [ ] Implement Comic Relief font
- [ ] Create theme system with all 21 colors
- [ ] Design activity card layout
- [ ] Implement D-pad navigation

### Phase 2: Data & Sync (Week 2)
- [ ] Implement data models with correct field names
- [ ] Add data normalizer for field compatibility
- [ ] Implement TweetNaCl encryption
- [ ] Create sync service (pull-only initially)
- [ ] Add recovery phrase input method

### Phase 3: User Mode Features (Week 3)
- [ ] Activity completion toggle
- [ ] User switcher UI
- [ ] Today/Tomorrow toggle
- [ ] Completion animations
- [ ] Sound effects

### Phase 4: Polish (Week 4)
- [ ] Focus animations
- [ ] Loading states
- [ ] Error handling
- [ ] Settings screen (theme selector)
- [ ] Testing on actual TV hardware

---

## Part 9: Common Pitfalls to Avoid

### 1. Field Name Mismatches
**Problem:** Using `title` instead of `text` or `emoji` instead of `icon`
**Solution:** Always use the data normalizer, never trust raw data

### 2. Font Rendering
**Problem:** Android's default fonts breaking the StackMap look
**Solution:** Force Comic Relief everywhere using custom TextView

### 3. Focus Navigation
**Problem:** Focus jumping unexpectedly on TV
**Solution:** Explicitly set `nextFocus*` attributes in XML

### 4. Overscan Issues
**Problem:** UI elements cut off on some TVs
**Solution:** Use 5% margin on all screen edges

### 5. Performance with Large Lists
**Problem:** Lag when scrolling through many activities
**Solution:** Use RecyclerView with ViewHolder pattern, limit to 50 visible items

---

## Part 10: Testing on TV

### Emulator Setup
```bash
# Create TV AVD
sdkmanager "system-images;android-31;google_apis;x86_64"
avdmanager create avd -n Android_TV -k "system-images;android-31;google_apis;x86_64" -d "tv_1080p"

# Run emulator
emulator -avd Android_TV
```

### Key Test Scenarios
1. **D-pad only navigation** (no touch/mouse)
2. **Recovery phrase entry** (test all methods)
3. **30-second sync cycle**
4. **User switching with 5+ users**
5. **100+ activities performance**
6. **Theme changes**
7. **Completion animations**

### TV-Specific Edge Cases
- Remote with limited buttons
- No keyboard available
- Screen burn-in prevention
- Variable overscan per TV model
- 10-foot UI readability

---

## Conclusion

This Android TV implementation focuses on the core StackMap experience: viewing and completing activities with seamless sync. By constraining the feature set to consumption rather than creation, the TV app becomes simpler to build and more appropriate for the living room context.

Key success factors:
1. **Exact field name matching** for sync compatibility
2. **Comic Relief font** for brand consistency
3. **Simple recovery phrase entry** via QR/code/companion
4. **TV-optimized navigation** with D-pad focus
5. **Read-mostly design** with completion as primary action

The result should feel like StackMap on your TV - familiar, functional, and family-friendly.

---

## Appendix: Sample Sync Response Format

```json
{
  "success": true,
  "data": {
    "users": {
      "user123": {
        "id": "user123",
        "name": "Dad",
        "icon": "👨",
        "days": {
          "today": {
            "activities": [
              {
                "id": "act1",
                "text": "Morning Exercise",
                "icon": "🏃",
                "completed": false,
                "order": 0
              }
            ]
          },
          "tomorrow": {
            "activities": []
          }
        }
      }
    },
    "currentUser": "user123",
    "settings": {
      "theme": "stackBlue",
      "soundEnabled": true
    }
  },
  "timestamp": 1705363200000,
  "device_id": "tv_living_room"
}
```

Remember to decrypt this data using the encryption key derived from the recovery phrase before parsing.