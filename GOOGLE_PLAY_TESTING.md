# Google Play Internal Testing Setup (TestFlight Alternative)

## 🎯 Overview
Google Play Internal Testing is the Android equivalent of TestFlight, allowing you to distribute beta versions through the Play Store to invited testers.

## 🚀 Quick Setup Steps

### 1. Create Google Play Developer Account
- Go to [Google Play Console](https://play.google.com/console/signup)
- Pay one-time $25 fee
- Complete identity verification

### 2. Create Your App
1. Click **"Create app"**
2. Fill in:
   - App name: `StackMap`
   - Default language: `English`
   - App category: `Productivity`
   - Free/Paid: `Free`

### 3. Sign Your APK
```bash
cd android
./sign-apk.sh
# Follow prompts to create keystore
# SAVE YOUR PASSWORD!
```

### 4. Upload to Internal Testing
1. In Play Console → **Testing** → **Internal testing**
2. Click **"Create new release"**
3. Upload your signed APK
4. Add release notes
5. Click **"Review release"** → **"Start rollout"**

### 5. Add Testers
1. Go to **"Testers"** tab
2. Create email list with tester emails
3. Copy the **opt-in link**
4. Send to testers:

```
Subject: Test StackMap on Android

Hi [Name],

You're invited to test StackMap on Android!

1. Click this link: [OPT-IN LINK]
2. Accept the invitation
3. Download from Play Store (may take 30 min to appear)

Thanks for testing!
```

## ⚡ Benefits Over Direct APK

- ✅ **Automatic Updates**: Testers get new versions automatically
- ✅ **Play Store Installation**: More trusted, no "Unknown Sources"
- ✅ **Crash Reporting**: Automatic crash logs in Play Console
- ✅ **Pre-launch Reports**: Google tests on various devices
- ✅ **Version Management**: Track who has which version

## 📊 Testing Tracks Comparison

| Track | Testers | Review Time | Visibility |
|-------|---------|-------------|------------|
| **Internal** | 100 | Minutes | Invite only |
| **Closed** | Unlimited | Hours | Invite only |
| **Open** | Unlimited | Hours | Public link |
| **Production** | Everyone | Days | Public |

## 🔄 Uploading Updates

```bash
# 1. Increment versionCode in build.gradle
# 2. Build new signed APK
./build-android-release.sh

# 3. Upload to Play Console
# Testing → Internal testing → Create new release
```

## 🎯 Best Practices

1. **Start with Internal Testing** (fastest, most control)
2. **Use Google Groups** for easier tester management
3. **Include release notes** for each version
4. **Monitor crashes** in Play Console
5. **Graduate to Closed Testing** when ready for more testers

## 🆚 TestFlight vs Play Internal Testing

| Feature | TestFlight | Play Internal |
|---------|------------|---------------|
| Setup Time | 1 hour | 30 minutes |
| First Upload | 24-48h review | 5-30 min |
| Updates | 24h review | Minutes |
| Tester Limit | 10,000 | 100 (internal) |
| Public Link | ✅ | ✅ (open test) |
| Crash Reports | ✅ | ✅ |
| Device Testing | ❌ | ✅ (pre-launch) |

## 🚨 Important Notes

- **Keep your keystore safe!** You need it for all future updates
- **Don't lose the password!** It's unrecoverable
- **Back up**: `android/app/stackmap-release.keystore`
- Internal testers can leave public reviews (unlike TestFlight)

## 📱 Tester Experience

1. Tester clicks opt-in link
2. Accepts invitation
3. Waits ~30 minutes
4. Searches "StackMap" in Play Store
5. Sees "StackMap (Beta)" with Install button
6. Updates arrive automatically

## 🔗 Useful Links

- [Play Console](https://play.google.com/console)
- [Testing Documentation](https://support.google.com/googleplay/android-developer/answer/9845334)
- [Signing Guide](https://developer.android.com/studio/publish/app-signing)