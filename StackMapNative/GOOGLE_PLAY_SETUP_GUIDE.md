# 🚀 Complete Google Play Internal Testing Setup Guide

## Prerequisites Checklist
- [ ] Google account
- [ ] $25 for developer registration
- [ ] 30-60 minutes for setup

---

## 📝 Step 1: Create Developer Account

1. **Open** [Google Play Console](https://play.google.com/console/signup)
2. **Sign in** and pay $25
3. **Wait** for email confirmation (usually instant, can take 48hrs)

---

## 🔐 Step 2: Create Signing Key

**Open Terminal and run:**

```bash
cd /Users/adamstack/StackMap/StackMap/StackMapNative/android/app
keytool -genkey -v -keystore stackmap-release.keystore -alias stackmap -keyalg RSA -keysize 2048 -validity 10000
```

**When prompted:**
- Password: `[Choose 6+ characters - SAVE THIS!]`
- Name: `Your Name`
- Organization: `Your Company/Name`
- Location: `Your City, State, Country`
- Confirm: `yes`
- Key password: `[Press ENTER to use same]`

**Save credentials:**
```bash
echo "Keystore: stackmap-release.keystore
Alias: stackmap
Password: YOUR_PASSWORD_HERE" > ../keystore-credentials.txt
```

---

## ⚙️ Step 3: Configure Build for Signing

**Add to `/android/gradle.properties`:**
```
MYAPP_RELEASE_STORE_FILE=stackmap-release.keystore
MYAPP_RELEASE_KEY_ALIAS=stackmap
MYAPP_RELEASE_STORE_PASSWORD=YOUR_PASSWORD_HERE
MYAPP_RELEASE_KEY_PASSWORD=YOUR_PASSWORD_HERE
```

**Update `/android/app/build.gradle`:**

Find the `android {` section and add:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## 📦 Step 4: Build Signed APK

```bash
cd /Users/adamstack/StackMap/StackMap/StackMapNative
./build-android-release.sh
```

Your signed APK will be at:
`android/app/build/outputs/apk/release/app-release.apk`

---

## 📱 Step 5: Create App in Play Console

1. **Go to** [Play Console](https://play.google.com/console)
2. **Click** "Create app"
3. **Fill in:**
   - App name: `StackMap`
   - Default language: `English (United States)`
   - App or game: `App`
   - Free or paid: `Free`
   - Accept declarations ✓

---

## 🧪 Step 6: Set Up Internal Testing

1. **In Play Console**, go to:
   - Testing → Internal testing

2. **Create release:**
   - Click "Create new release"
   - Upload your APK
   - Release name: `1.0.0 (1)` (auto-filled)
   - Release notes: 
     ```
     Initial beta release
     - Core task management features
     - User profiles
     - Activity tracking
     ```

3. **Review and roll out:**
   - Click "Review release"
   - Click "Start rollout to Internal testing"

---

## 👥 Step 7: Add Testers

1. **Go to** "Testers" tab
2. **Create email lists:**
   - Click "Create email list"
   - Name: `Beta Testers`
   - Add emails (comma-separated)

3. **Copy the opt-in link** (looks like):
   ```
   https://play.google.com/apps/internaltest/4923984729384
   ```

---

## 📧 Step 8: Invite Testers

**Send this email:**

```
Subject: You're invited to test StackMap on Android!

Hi [Name],

You're invited to beta test StackMap on Android.

How to join:
1. Click this link on your Android device: [OPT-IN LINK]
2. Click "Become a tester"
3. Click "Download it on Google Play"
4. Install and test!

The app may take 30 minutes to appear after joining.

Please report any issues to: [your email]

Thanks!
```

---

## 🔄 Step 9: Updating the App

**For each update:**

1. **Increment version** in `android/app/build.gradle`:
   ```gradle
   versionCode 2  // Always increment
   versionName "1.0.1"
   ```

2. **Build new APK:**
   ```bash
   ./build-android-release.sh
   ```

3. **Upload to Play Console:**
   - Testing → Internal testing
   - Create new release
   - Upload new APK

---

## ⏱️ Timeline

- Account setup: 5 minutes (+ verification wait)
- Keystore creation: 5 minutes
- First APK upload: 10 minutes
- Tester access: 5-30 minutes after opt-in

---

## 🆘 Troubleshooting

**"Package name already exists"**
- Change in `android/app/build.gradle`:
  ```gradle
  applicationId "com.yourname.stackmap"
  ```

**"Upload failed"**
- Check APK is signed
- Verify versionCode is higher than previous

**"Can't find app in Play Store"**
- Wait 30 minutes after opt-in
- Search exact name: "StackMap"
- Check "Internal testing" section

---

## 🎯 Next Steps

After setup:
1. Monitor crash reports in Play Console
2. Check user feedback
3. Graduate to "Closed testing" for more testers
4. Eventually release to production

---

## 🔒 Security Reminders

⚠️ **NEVER commit these files:**
- `*.keystore`
- `gradle.properties` (with passwords)
- `keystore-credentials.txt`

✅ **DO backup:**
- Your keystore file (encrypted)
- Your passwords (password manager)

**Lost keystore = can't update app ever!**