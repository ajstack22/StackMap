# StackMap Documentation Structure
**Last Optimized:** January 2025

## 📊 Documentation Statistics
- **Total Files:** 76 markdown files (down from 86)
- **Removed:** 10 redundant/outdated files
- **Consolidated:** Multiple troubleshooting guides merged into comprehensive docs
- **Better Organization:** Clear directory structure with single-purpose folders

## 📁 Optimized Directory Structure

```
/docs/
├── README.md                    # Main navigation index
├── ARCHITECTURE.md              # System architecture overview
├── DATA_STRUCTURE.md            # Data model documentation
├── STORE_ARCHITECTURE.md        # State management (Zustand)
├── API.md                       # Backend API reference
├── DEVELOPMENT.md               # Local development setup
├── TROUBLESHOOTING.md           # Common issues and solutions
├── TYPESCRIPT_ANALYSIS.md       # TypeScript migration status
├── ACCESSIBILITY_IMPLEMENTATION.md  # Accessibility features
├── CACHE_PREVENTION_STRATEGY.md    # Cache management
├── LINT_ANALYSIS.md            # Code quality analysis
├── MIGRATION_PROMPT_PACK.md    # Migration guides
├── MD_FILES_INDEX.md            # Complete file index
│
├── deployment/ (2 files)
│   ├── README.md                # Comprehensive deployment guide
│   └── DISTRIBUTION_GUIDE.md    # App store distribution
│
├── sync/ (8 files)
│   ├── README.md                # Sync system overview
│   ├── troubleshooting.md      # CONSOLIDATED troubleshooting guide
│   ├── security-architecture.md # CONSOLIDATED security + zero-knowledge
│   ├── SYNC_API_REFERENCE.md   # API endpoints
│   ├── data-sync-service.md    # Service implementation
│   ├── SYNC_MIGRATION_GUIDE.md # Migration procedures
│   ├── sync-queue-indicator.md # Queue UI component
│   └── index.md                 # Navigation index
│
├── platform/ (5 files)
│   ├── README.md                # Platform overview
│   ├── CROSS_PLATFORM_GUIDE.md # Cross-platform patterns
│   ├── ios/README.md           # iOS-specific guide
│   ├── android/README.md       # Android-specific guide
│   └── web/README.md           # Web/PWA guide
│
├── features/ (7 files)
│   ├── README.md                # Features overview
│   ├── field-conventions.md    # CRITICAL field naming standards
│   ├── edit-mode-refactor.md   # Edit mode implementation
│   ├── activity-library-system.md # Activity library
│   ├── import-export-system.md # Import/export functionality
│   ├── starter-cards.md        # Onboarding cards
│   └── typography-system.md    # Font system
│
├── testing/ (6 files)
│   ├── README.md                # Testing overview
│   ├── simple-testing-guide.md # Testing philosophy
│   ├── cross-platform-testing.md # Platform testing matrix
│   ├── import-export-qa-guide.md # Import/export QA
│   ├── testing-checklist.md    # Pre-deployment checklist
│   └── uat-testing-guide.md    # UAT procedures
│
├── onboarding/ (5 files)
│   ├── README.md                # Onboarding overview
│   ├── new-developer-guide.md  # Developer onboarding
│   ├── user-onboarding-system.md # User onboarding flow
│   ├── user-centered-guide.md  # User-focused implementation
│   └── onboarding-workflows.md # Workflow documentation
│
├── architecture/ (14 files)
│   └── [Various architecture and analysis documents]
│
├── setup/ (4 files)
│   ├── GITHUB_CLI_SETUP.md
│   ├── GITHUB_NOTIFICATIONS_SETUP.md
│   ├── SSH_SETUP_GUIDE.md
│   └── VSCODE_SSH_SETUP.md
│
├── development/ (5 files)
│   └── [Development-specific guides]
│
├── data/ (5 files)
│   └── [Data-related documentation]
│
└── internal/ (2 files)
    └── [Internal documentation]
```

## 🎯 Key Improvements

### 1. Consolidated Documentation
- **Sync Troubleshooting:** 4 guides → 1 comprehensive guide
- **Security Architecture:** 2 documents → 1 unified guide
- **Testing:** Removed 3 duplicate files from root

### 2. Better Organization
- **Setup Guides:** Moved to dedicated `/setup` directory
- **Architecture Docs:** Moved 10 files to `/architecture`
- **Root Directory:** Reduced from 40+ to 13 essential files

### 3. Removed Redundancy
- Deleted 6 duplicate testing/import guides
- Removed outdated sync documentation
- Eliminated redundant feature documentation

## 📚 Quick Reference - What to Share with Claude Code

### By Task Type
- **🚀 Deployment:** `/docs/deployment/README.md`
- **🔄 Sync Issues:** `/docs/sync/troubleshooting.md` + `/docs/sync/README.md`
- **📱 Platform Bug:** `/docs/platform/[platform]/README.md`
- **✨ New Feature:** `/docs/features/field-conventions.md` + relevant feature doc
- **🧪 Testing:** `/docs/testing/simple-testing-guide.md` + checklist
- **🏗️ Architecture:** `/docs/ARCHITECTURE.md` + `/docs/STORE_ARCHITECTURE.md`

### Critical Documents (Always Relevant)
1. `/CLAUDE.md` - Essential development guide
2. `/docs/features/field-conventions.md` - CRITICAL field naming
3. `/docs/platform/CROSS_PLATFORM_GUIDE.md` - Platform gotchas
4. `/docs/sync/troubleshooting.md` - Sync debugging

## ✅ Documentation Health
- **Current:** All sync docs updated for v2025.08.18+ complex architecture
- **Organized:** Clear directory structure with no overlap
- **Navigable:** README.md in each directory for easy discovery
- **Maintained:** Outdated content removed, current content preserved

The documentation is now optimized for both human navigation and AI assistant consumption, with clear pathways to find relevant information quickly.