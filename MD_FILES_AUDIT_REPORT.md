# StackMap Documentation Audit Report

## Executive Summary
This audit identifies which MD files should be kept, updated, or deleted to avoid confusion for future Claudes and maintain critical knowledge.

---

## 🗂️ Table of Contents for Effective Documentation

### 🚨 CRITICAL - Deployment & Infrastructure
1. **[CLAUDE.md](./CLAUDE.md)** - Main deployment truth & instructions
2. **[README_DEPLOYMENT.md](./README_DEPLOYMENT.md)** - Step-by-step deployment guide  
3. **[DO_NOT_IGNORE_BUILD_FILES.md](./DO_NOT_IGNORE_BUILD_FILES.md)** - Critical gitignore warning

### 🏗️ Development & Implementation
4. **[COMPLETE_DAY_MODAL_PROMPT.md](./COMPLETE_DAY_MODAL_PROMPT.md)** - Complete Day feature spec
5. **[EDIT_MODE_MENU_STRATEGY.md](./EDIT_MODE_MENU_STRATEGY.md)** - Toolbar overflow strategy
6. **[docs/STACKMAP_COMPREHENSIVE_DOCUMENTATION.md](./docs/STACKMAP_COMPREHENSIVE_DOCUMENTATION.md)** - Full system docs

### 🔧 Platform-Specific Guides
7. **[android/SECURE_SIGNING_SETUP.md](./android/SECURE_SIGNING_SETUP.md)** - Android signing
8. **[docs/android/GOOGLE_PLAY_SETUP_GUIDE.md](./docs/android/GOOGLE_PLAY_SETUP_GUIDE.md)** - Play Store setup
9. **[docs/ios/XCODE_FIX.md](./docs/ios/XCODE_FIX.md)** - iOS build fixes

### 🔄 Sync & API
10. **[api/sync/README.md](./api/sync/README.md)** - Sync API documentation
11. **[docs/SYNC_API_REFERENCE.md](./docs/SYNC_API_REFERENCE.md)** - API endpoints

### 🧪 Testing
12. **[QUICK_TEST_CHECKLIST.md](./QUICK_TEST_CHECKLIST.md)** - Quick test guide
13. **[tests/TESTING_FRAMEWORK.md](./tests/TESTING_FRAMEWORK.md)** - Test framework

### 🔐 Security & Privacy
14. **[STACKMAP_PRIVACY_SECURITY_WHITEPAPER.md](./STACKMAP_PRIVACY_SECURITY_WHITEPAPER.md)** - Security docs

---

## 📊 Detailed Recommendations

### ✅ KEEP (Critical & Current)

| File | Reason | Priority |
|------|--------|----------|
| **CLAUDE.md** | THE source of deployment truth | 🔴 CRITICAL |
| **README_DEPLOYMENT.md** | Clear deployment steps | 🔴 CRITICAL |
| **DO_NOT_IGNORE_BUILD_FILES.md** | Prevents 403 errors | 🔴 CRITICAL |
| **COMPLETE_DAY_MODAL_PROMPT.md** | Active feature spec | 🟡 HIGH |
| **EDIT_MODE_MENU_STRATEGY.md** | Documents complex logic | 🟡 HIGH |
| **docs/STACKMAP_COMPREHENSIVE_DOCUMENTATION.md** | Main system docs | 🟡 HIGH |
| **QUICK_TEST_CHECKLIST.md** | Essential for testing | 🟡 HIGH |
| **android/SECURE_SIGNING_SETUP.md** | Android deployment | 🟢 MEDIUM |
| **api/sync/README.md** | Sync system docs | 🟢 MEDIUM |
| **docs/SYNC_API_REFERENCE.md** | API documentation | 🟢 MEDIUM |
| **STACKMAP_PRIVACY_SECURITY_WHITEPAPER.md** | User-facing security | 🟢 MEDIUM |

### 🔄 UPDATE (Contains valuable info but needs revision)

| File | Issue | Action Required |
|------|-------|-----------------|
| **docs/CLAUDE.md** | Outdated, references old structure | Merge useful parts into main CLAUDE.md |
| **docs/DEPLOYMENT.md** | Incomplete, missing critical steps | Update with lessons from 403 error |
| **docs/README.md** | Generic, not helpful | Create proper docs index |
| **README.md** | Basic React Native template | Add StackMap-specific info |

### 🗑️ DELETE (Outdated, Confusing, or Redundant)

| File | Reason for Deletion | Alternative |
|------|---------------------|-------------|
| **cleanup-analysis.md** | One-time cleanup task, outdated | Delete after cleanup |
| **docs/development/SCROLLING_ISSUE_RESEARCH_REQUEST.md** | Old research request | Archive if needed |
| **docs/development/SCROLLING_ISSUE_RESEARCH_RESPONSE.md** | Old research response | Archive if needed |
| **docs/MIGRATION_GUIDE.md** | Old migration, no longer relevant | Delete |
| **docs/MIGRATION_STRATEGY.md** | Old migration, no longer relevant | Delete |
| **docs/PHASE_1_COMPLETION_SUMMARY.md** | Historical, not actionable | Archive |
| **docs/PHASE_2_COMPLETION_SUMMARY.md** | Historical, not actionable | Archive |
| **docs/peer_review.md** | Old review, not current | Delete |
| **docs/operation-log-system.md** | Appears unused | Delete if not implemented |
| **docs/data-structure-v2.md** | Old version | Keep only if current |
| **docs/Manyla/*.md** | All 5 files - unused system | Delete entire directory |
| **docs/deployment/DEPLOYMENT_BEST_PRACTICES.md** | Generic, not StackMap-specific | Merge any useful parts |
| **docs/deployment/DEPLOYMENT_SIMPLE.md** | Redundant with scripts | Delete |
| **vendor/bundle/**/*.md** | All vendor docs | Ignore - not project docs |
| **ios/Pods/**/*.md** | All pod docs | Ignore - not project docs |

### 🆕 CREATE (Missing Documentation)

| New File Needed | Purpose |
|-----------------|---------|
| **ARCHITECTURE.md** | Document React Native + Web architecture |
| **TROUBLESHOOTING.md** | Common issues & solutions (403 error, etc.) |
| **docs/INDEX.md** | Proper documentation index with categories |

---

## 🎯 Action Plan

### Immediate Actions (Do Now):
1. **Delete** all files marked for deletion
2. **Create** MD_FILES_INDEX.md with the table of contents above
3. **Update** CLAUDE.md to reference this audit

### Short-term Actions (This Week):
1. **Merge** docs/CLAUDE.md useful content into main CLAUDE.md
2. **Update** docs/DEPLOYMENT.md with 403 error lessons
3. **Create** TROUBLESHOOTING.md with common issues

### Long-term Actions (This Month):
1. **Create** proper ARCHITECTURE.md
2. **Update** README.md with StackMap-specific content
3. **Archive** historical docs to a separate directory

---

## 📝 Documentation Standards Going Forward

1. **One Source of Truth**: Each topic should have ONE authoritative file
2. **Clear Naming**: Files should clearly indicate their purpose
3. **Update Dates**: Add "Last Updated: YYYY-MM-DD" to critical docs
4. **Deprecation Notices**: Mark outdated docs clearly before deletion
5. **Cross-References**: Use relative links between related docs

---

## 🚨 Critical Knowledge That Must Be Preserved

1. **Build files MUST be committed to git** (not in .gitignore)
2. **Qual deployment requires files in root**, not just web/build
3. **Simple-deploy.sh is the ONLY way to deploy to production**
4. **.cpanel.yml does NOT work on Namecheap**
5. **Comic Relief font requires platform-specific handling**

This audit ensures future Claudes have clear, accurate documentation without confusion from outdated or duplicate files.