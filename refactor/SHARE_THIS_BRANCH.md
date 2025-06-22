# How to Share This Mobile-First Refactor

## GitHub URL
```
https://github.com/ajstack22/StackMap/tree/mobile-first-refactor
```

## For Other Claude Instances

When starting a new Claude session, provide this context:

```
I'm working on the mobile-first-refactor branch of StackMap. Please checkout this branch:

git checkout mobile-first-refactor

The refactor is in the /refactor directory with:
- Single HTML architecture (no page navigation)
- ES5-compatible JavaScript (Android 5 support)
- Research-backed design (2-3 nav levels, 200-300ms animations)
- Built-in adversarial review process
- TV and offline-first support

Key files to read:
- /refactor/CLAUDE.md (auto-loaded)
- /refactor/CONTEXT_RULES.md
- /refactor/docs/critical-fixes-needed.md
```

## Current Status

### ✅ Completed
- Mobile-first architecture foundation
- Research integration (5 reports analyzed)
- Adversarial review process
- Development guides and context
- Platform detection framework
- Basic navigation system

### 🔴 Critical Issues to Fix
1. **JavaScript compatibility** - const/let will crash on Android 5
2. **Navigation depth** - Not limited to 2-3 levels yet
3. **Offline storage** - Not implemented
4. **TV navigation** - Basic implementation needs spatial algorithm

### 📋 Next Steps
1. Fix all ES6 compatibility issues (replace const/let with var)
2. Implement navigation depth tracking
3. Add offline storage layer (IndexedDB/SQLite)
4. Enhance TV navigation with LRUD algorithm
5. Add focus management for accessibility

## Commands for New Session

```bash
# Clone and setup
git clone https://github.com/ajstack22/StackMap.git
cd StackMap
git checkout mobile-first-refactor

# View refactor
cd refactor
open index.html

# Run adversarial review
/review

# Check all platforms
/check-platforms
```

## Research Findings Applied

- **Navigation**: 2-3 levels max, tab-based > hamburger
- **Animation**: 200-300ms for ADHD (not 300ms)
- **Targets**: 44x44pt mobile, 48x48dp TV minimum
- **JavaScript**: NO const/let/arrows on Android 5!
- **Offline**: SQLite mobile, IndexedDB web

## Branch Contains

```
/refactor/
├── index.html              # Single page app
├── js/app.js              # Main app (needs ES5 fixes!)
├── css/base.css           # Mobile-first styles
├── research/              # 5 research reports
├── docs/                  # Architecture & issues
├── scripts/               # Adversarial review
└── CLAUDE.md             # Auto-loaded context
```

The architecture is solid but needs the critical JavaScript fixes before it can run on older Android devices used in schools.