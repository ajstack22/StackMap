# Secure Android Signing Setup

## Current Configuration

Your signing credentials are now stored securely in environment variables!

### What we did:
1. Added passwords to `~/.zshrc` as environment variables
2. Updated `build.gradle` to read from environment variables first
3. Falls back to gradle.properties if env vars not found (for CI/CD)

### Security Benefits:
- ✅ Passwords not in project directory
- ✅ Can't accidentally commit passwords
- ✅ Works across all your projects
- ✅ Still supports gradle.properties as fallback

### To use in new terminal sessions:
```bash
source ~/.zshrc
```

Or just open a new terminal window.

### To verify it's working:
```bash
echo $STACKMAP_STORE_PASSWORD
# Should show your password
```

### For team members:
They can either:
1. Set their own environment variables
2. Use local gradle.properties (not committed)
3. Use ~/.gradle/gradle.properties

## Building Release APK

Now just run:
```bash
cd /Users/adamstack/StackMap/StackMap/StackMapNative
./build-android-release.sh
```

The build will automatically use your environment variables!