# Android Fastlane Authentication Documentation

**Complete guide for Manylla, SmilePile, and future developers**

This documentation suite provides everything you need to understand and implement Android deployment authentication with Fastlane.

---

## 📚 Documentation Suite

### 1. [Quick Start Guide](./ANDROID_AUTH_QUICK_START.md) ⭐ **START HERE**
**Read this first!** 30-minute setup guide with essential commands.

**What's inside:**
- Two types of authentication explained
- Step-by-step setup (30 minutes)
- Deployment commands
- Common troubleshooting
- Security checklist

**When to use:** First-time setup, quick reference

---

### 2. [Complete Authentication Guide](./ANDROID_FASTLANE_AUTH_GUIDE.md)
**Deep dive into authentication architecture and implementation.**

**What's inside:**
- Authentication overview (Google Play + Keystore)
- Google Play Console setup (service accounts, permissions)
- Keystore creation and management
- macOS Keychain credential storage
- Fastlane configuration (Appfile, Fastfile)
- Four-tier deployment flow (QUAL → STAGE → BETA → PROD)
- Security best practices
- Product flavor architecture
- Appendices and resources

**When to use:** Detailed understanding, troubleshooting complex issues, team training

---

### 3. [Architecture Diagrams](./ANDROID_AUTH_ARCHITECTURE.md)
**Visual guide to authentication flow and system design.**

**What's inside:**
- Complete authentication architecture
- Credential flow details (Keystore + Google Play)
- Product flavor architecture
- Deployment decision tree
- Security boundaries
- Error handling flow

**When to use:** Understanding system design, explaining to team members, architecture reviews

---

### 4. [Troubleshooting Playbook](./ANDROID_AUTH_TROUBLESHOOTING.md)
**Solutions for common authentication and deployment issues.**

**What's inside:**
- Credential issues (Keychain, environment variables)
- Keystore problems (corrupted, missing, wrong password)
- Google Play upload errors (403 Forbidden, version conflicts)
- Build failures (R8, Metro bundler)
- Network and timeout issues
- Service account problems
- Debug commands and diagnostic scripts
- Emergency recovery procedures

**When to use:** Errors, debugging, production incidents

---

## 🎯 Quick Navigation by Task

### First-Time Setup
1. Read: [Quick Start Guide](./ANDROID_AUTH_QUICK_START.md)
2. Follow: Google Play Console setup
3. Run: `fastlane store_credentials_in_keychain`
4. Test: `./scripts/deploy.sh stage --android`

### Understanding the System
1. Read: [Complete Guide](./ANDROID_FASTLANE_AUTH_GUIDE.md) - Authentication Overview
2. Review: [Architecture Diagrams](./ANDROID_AUTH_ARCHITECTURE.md) - Authentication Flow
3. Explore: Fastlane configuration files

### Deploying to Android
1. Update: `PENDING_CHANGES.md`
2. Run: `./scripts/deploy.sh [tier] --android`
3. Check: Google Play Console for draft release
4. Publish: Manually in Play Console

### Troubleshooting Errors
1. Identify: Error message
2. Search: [Troubleshooting Playbook](./ANDROID_AUTH_TROUBLESHOOTING.md)
3. Run: Diagnostic script
4. Apply: Solution from playbook

### Team Onboarding
1. Share: [Quick Start Guide](./ANDROID_AUTH_QUICK_START.md)
2. Review: [Architecture Diagrams](./ANDROID_AUTH_ARCHITECTURE.md) together
3. Pair: First deployment with experienced team member
4. Reference: [Complete Guide](./ANDROID_FASTLANE_AUTH_GUIDE.md) for deep dives

---

## 🔑 Key Concepts Summary

### Two Authentication Types

**1. Google Play Console Authentication**
- **Purpose:** Upload builds to Google Play Store
- **Method:** Service account JSON key file
- **Setup:** Google Cloud Console → Create service account → Download JSON
- **Storage:** macOS Keychain (path stored) + Secure file location
- **Used by:** `upload_to_play_store` Fastlane action

**2. App Signing Authentication**
- **Purpose:** Sign APK/AAB files for distribution
- **Method:** Keystore file (.keystore) + passwords (store + key)
- **Setup:** Create with `keytool` OR use existing keystore
- **Storage:** File in `android/app/`, passwords in macOS Keychain
- **Used by:** Gradle build process

### Credential Storage Hierarchy

**macOS Keychain (Preferred):**
- ✅ Encrypted by OS
- ✅ Persistent across sessions
- ✅ No accidental commits
- ✅ Access control

**Environment Variables (Fallback):**
- ⚠️ Less secure
- ⚠️ Session-dependent
- ⚠️ Can leak in logs

**How it works:**
1. Fastlane checks Keychain first
2. Falls back to environment variables
3. Errors if neither found

### Four-Tier Deployment Strategy

```
QUAL → STAGE → BETA → PROD
```

| Tier | Auth Required | Database | Distribution | Frequency |
|------|---------------|----------|--------------|-----------|
| **QUAL** | ❌ None (debug) | Qual | Local (ADB) | Multiple/day |
| **STAGE** | ✅ Both | Qual | Play Internal | Before beta |
| **BETA** | ✅ Both | Prod | Play Closed | 1-2/week |
| **PROD** | ✅ Both | Prod | Play Production | Weekly/bi-weekly |

### Product Flavors

**What are flavors?**
Gradle build variants that create different versions of your app from the same codebase.

**StackMap flavors:**
- `qual`: Local testing (separate package ID: `com.stackmapnative.qual`)
- `stage`: Internal testing (base package ID: `com.stackmapnative`)
- `beta`: Closed beta testing (base package ID: `com.stackmapnative`)
- `prod`: Production release (base package ID: `com.stackmapnative`)

**Key difference:**
- QUAL uses separate package ID (can coexist with other builds on device)
- STAGE/BETA/PROD use same package ID (differentiated by Play Store tracks)

---

## 🚀 Common Workflows

### Deploy to Stage (Internal Testing)

```bash
# 1. Update release notes
vi PENDING_CHANGES.md
# Add: ## Title: [Your feature]
#      ### Changes Made:
#      - [Bullet points]

# 2. Deploy
./scripts/deploy.sh stage --android

# 3. Check Play Console
# Go to: https://play.google.com/console/
# Navigate to: Internal Testing
# Publish draft release

# 4. Test on device
# Install from Play Store (internal testers only)
```

**What happens behind the scenes:**
1. Master script validates `PENDING_CHANGES.md`
2. Increments version in `package.json`
3. Calls `deploy_stage.sh`
4. `deploy_stage.sh` calls Fastlane
5. Fastlane:
   - Gets passwords from Keychain
   - Builds signed AAB with stage flavor
   - Uploads to Play Store Internal Testing track
   - Creates draft release
6. You manually publish in Play Console

### Deploy to Beta (Closed Testing)

```bash
# 1. Ensure clean git state
git status
# Must show: "nothing to commit, working tree clean"

# 2. Update release notes
vi PENDING_CHANGES.md

# 3. Deploy
./scripts/deploy.sh beta --android

# 4. Publish in Play Console
# Go to: Closed Testing
# Publish to beta testers
```

**Differences from stage:**
- Requires clean git state (traceability)
- Uses `beta` flavor (connects to beta-api endpoint)
- Uploads to Closed Testing track (supports more testers)
- Uses production database (real-world testing)

### Rotate Service Account Key

```bash
# 1. Create new key in Google Cloud Console
# Go to: IAM & Admin > Service Accounts
# Select service account > Keys > Add Key > Create New Key
# Download JSON

# 2. Update Keychain
cd android
fastlane store_credentials_in_keychain
# Enter new JSON path

# 3. Test
fastlane validate_signing

# 4. Delete old key (security)
# In Google Cloud Console, delete previous key
```

**When to do this:**
- Annually (security best practice)
- If key is compromised
- When key approaches 90 days old

---

## 📋 Checklist for Manylla & SmilePile

### Initial Setup (One-Time)

- [ ] Read [Quick Start Guide](./ANDROID_AUTH_QUICK_START.md)
- [ ] Install Fastlane: `sudo gem install fastlane`
- [ ] Create Google Cloud project (if not exists)
- [ ] Enable Google Play Android Developer API
- [ ] Create service account
- [ ] Download service account JSON key
- [ ] Link service account to Play Console
- [ ] Grant service account permissions (View, Manage testing, Manage production)
- [ ] Verify keystore file exists: `android/app/stackmap-release.keystore`
- [ ] Store credentials in Keychain: `fastlane store_credentials_in_keychain`
- [ ] Validate setup: `fastlane validate_signing`
- [ ] Test deployment: `./scripts/deploy.sh stage --android`

### Before Each Deployment

- [ ] Update `PENDING_CHANGES.md` with release notes
- [ ] Run tests: `npm run test:critical`
- [ ] Check git status (clean for beta/prod)
- [ ] Verify version in `package.json` is correct
- [ ] Ensure credentials are valid (test: `fastlane validate_signing`)

### After Deployment

- [ ] Check Google Play Console for draft release
- [ ] Verify AAB details (version, size, supported devices)
- [ ] Review release notes
- [ ] Publish to testers
- [ ] Monitor crash reports
- [ ] Collect feedback

### Security Maintenance

- [ ] Rotate service account key annually
- [ ] Backup keystore to encrypted storage (quarterly)
- [ ] Test keystore password (quarterly): `keytool -list -v -keystore android/app/stackmap-release.keystore`
- [ ] Review service account permissions (annually)
- [ ] Audit who has Play Console access (quarterly)
- [ ] Verify credentials are NOT in git: `git log -p | grep -i "password\|secret" | head`

---

## 🆘 Getting Help

### Self-Service Resources

**For errors:**
1. Check [Troubleshooting Playbook](./ANDROID_AUTH_TROUBLESHOOTING.md)
2. Run diagnostic script (in troubleshooting guide)
3. Review deployment logs: `/tmp/stackmap-logs/fastlane-*.log`

**For understanding:**
1. Review [Architecture Diagrams](./ANDROID_AUTH_ARCHITECTURE.md)
2. Read [Complete Guide](./ANDROID_FASTLANE_AUTH_GUIDE.md) relevant section
3. Check Fastlane docs: [https://docs.fastlane.tools/](https://docs.fastlane.tools/)

**For quick reference:**
1. [Quick Start Guide](./ANDROID_AUTH_QUICK_START.md) - commands and checklist
2. `fastlane lanes` - list all available lanes
3. `fastlane action [action_name]` - action documentation

### When to Ask Team

**Ask if:**
- Troubleshooting playbook doesn't have solution
- Service account permissions changed unexpectedly
- Keystore file is corrupted (needs recovery)
- Multiple deployment failures in a row
- Google Play API returns unexpected errors

**Before asking, collect:**
1. Full error message (not snippet)
2. Steps to reproduce
3. Output from diagnostic script
4. Recent deployment logs
5. Git status and recent commits

---

## 🎓 Learning Path

### Week 1: Basics
- [ ] Read [Quick Start Guide](./ANDROID_AUTH_QUICK_START.md)
- [ ] Complete initial setup checklist
- [ ] Deploy to STAGE successfully
- [ ] Publish draft release in Play Console
- [ ] Install and test on device

### Week 2: Understanding
- [ ] Read [Complete Guide](./ANDROID_FASTLANE_AUTH_GUIDE.md) - Authentication Overview
- [ ] Review [Architecture Diagrams](./ANDROID_AUTH_ARCHITECTURE.md)
- [ ] Explore Fastlane configuration files
- [ ] Understand product flavors in `build.gradle`

### Week 3: Advanced
- [ ] Read [Complete Guide](./ANDROID_FASTLANE_AUTH_GUIDE.md) - Security section
- [ ] Set up local CI/CD testing
- [ ] Practice error recovery (intentionally break, then fix)
- [ ] Review [Troubleshooting Playbook](./ANDROID_AUTH_TROUBLESHOOTING.md)

### Week 4: Mastery
- [ ] Deploy to BETA successfully
- [ ] Rotate service account key
- [ ] Audit security setup
- [ ] Document team-specific procedures
- [ ] Train another team member

---

## 📝 Document Maintenance

### When to Update These Docs

**Update when:**
- Authentication process changes
- New Fastlane actions added
- Google Play API changes
- Security best practices evolve
- Common issues discovered
- Team grows and needs onboarding

**How to update:**
1. Edit relevant markdown file(s)
2. Update "Last Updated" date
3. Increment "Document Version"
4. Test all commands/scripts
5. Commit with descriptive message

### Documentation Owners

**Current:** Adam Stack (StackMap Developer)
**Intended audience:** Manylla, SmilePile, future team members

---

## 🔗 External Resources

### Official Documentation
- [Fastlane Getting Started](https://docs.fastlane.tools/getting-started/android/setup/)
- [Google Play Console API](https://developers.google.com/android-publisher)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [Gradle Build Variants](https://developer.android.com/studio/build/build-variants)

### StackMap-Specific
- [Main Deployment Guide](./docs/deployment/README.md)
- [Beta Deployment Guide](./docs/deployment/BETA_DEPLOYMENT_GUIDE.md)
- [Four-Tier Strategy](./docs/deployment/FOUR_TIER_BUILD_GUIDE.md)
- [Fastlane Roadmap](./docs/deployment/fastlane-roadmap/)

### Community Resources
- [Fastlane Community](https://github.com/fastlane/fastlane/discussions)
- [React Native Deployment Guide](https://reactnative.dev/docs/signed-apk-android)
- [Stack Overflow - Fastlane](https://stackoverflow.com/questions/tagged/fastlane)

---

## 📊 Document Statistics

**Total pages:** 4 comprehensive documents
**Estimated reading time:** 3-4 hours (complete suite)
**Quick start time:** 30 minutes
**Setup time:** 30 minutes (with guide)
**Troubleshooting coverage:** 15+ common issues

**Document breakdown:**
1. **Quick Start:** 600 lines - Essential commands and setup
2. **Complete Guide:** 1800 lines - Comprehensive authentication reference
3. **Architecture Diagrams:** 800 lines - Visual system design
4. **Troubleshooting Playbook:** 1400 lines - Error solutions and debugging

---

## ✅ Success Criteria

**You've mastered Android authentication when you can:**
- [ ] Explain two authentication types (Google Play + Keystore)
- [ ] Set up credentials from scratch in 30 minutes
- [ ] Deploy to all four tiers (QUAL, STAGE, BETA, PROD)
- [ ] Troubleshoot common errors without documentation
- [ ] Rotate service account keys confidently
- [ ] Explain security boundaries to team member
- [ ] Recover from lost credentials
- [ ] Onboard new team member to deployment process

---

## 🎯 Next Steps

**For Manylla and SmilePile:**

1. **Today:** Read [Quick Start Guide](./ANDROID_AUTH_QUICK_START.md)
2. **This week:** Complete initial setup checklist
3. **Next week:** Deploy to STAGE successfully
4. **This month:** Review [Complete Guide](./ANDROID_FASTLANE_AUTH_GUIDE.md) and [Architecture Diagrams](./ANDROID_AUTH_ARCHITECTURE.md)
5. **Ongoing:** Reference [Troubleshooting Playbook](./ANDROID_AUTH_TROUBLESHOOTING.md) as needed

**For future developers:**

1. Start with [Quick Start Guide](./ANDROID_AUTH_QUICK_START.md)
2. Pair with experienced team member for first deployment
3. Work through learning path (4 weeks)
4. Contribute improvements to documentation

---

**Happy Deploying! 🚀**

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Maintained by:** StackMap Development Team
**For:** Manylla, SmilePile, and future developers
