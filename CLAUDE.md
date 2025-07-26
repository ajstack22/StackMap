# 🚨🚨🚨 CRITICAL DEPLOYMENT INFO - READ THIS FIRST 🚨🚨🚨

## ⚠️ NEVER EVER DO THIS ⚠️
### ❌ DO NOT COPY BUILD FILES TO REPOSITORY ROOT ❌
### ❌ NO `cp web/build/* .` ❌
### ❌ NO `cp -r web/build/* .` ❌
### ❌ BUILD FILES STAY IN web/build/ ❌

## ✅ HOW NAMECHEAP DEPLOYMENT ACTUALLY WORKS ✅

### 1. QUAL DEPLOYMENT (Testing)
```bash
# Files are served DIRECTLY from web/build/
# URL: https://stackmap.app/qual/web/build/
# Git pulls to: /public_html/qual/
# NO COPYING NEEDED - NAMECHEAP SERVES FROM web/build/
```

### 2. PRODUCTION DEPLOYMENT
```bash
# Use scripts/simple-deploy.sh
# This RSYNC's files from qual/ to production root
# ONLY simple-deploy.sh copies files - YOU DON'T
```

## 📁 CORRECT FILE STRUCTURE
```
/public_html/
├── qual/                    # Git repo clones here
│   ├── web/
│   │   └── build/          # BUILD FILES STAY HERE
│   │       ├── index.html
│   │       ├── bundle.*.js
│   │       └── ...
│   └── src/                # Source files
└── index.html              # Production (copied by simple-deploy.sh ONLY)
```

## 🔧 DEPLOYMENT COMMANDS

### To Qual (for testing):
```bash
# 1. Build with relative paths
NODE_ENV=production npm run build:web

# 2. Commit and push (DO NOT COPY FILES)
git add -A && git commit -m "message" && git push

# 3. Deploy
./scripts/deploy-to-qual.sh
# OR manually: ssh stackmap-cpanel "cd ~/public_html/qual && git pull"
```

### To Production:
```bash
# ONLY after qual is tested and working
./scripts/simple-deploy.sh
```

## 🚫 IGNORE THESE FILES
- `.cpanel.yml` - DOES NOT WORK on Namecheap
- `qual-htaccess` - NOT NEEDED, Namecheap serves from web/build/ directly

## 🎯 KEY FACTS
1. Qual URL: `https://stackmap.app/qual/web/build/`
2. Git clones directly to `/public_html/qual/`
3. Build outputs to `web/build/`
4. NEVER copy build files to root manually
5. Production deployment ONLY via simple-deploy.sh

## Recent Changes (December 28, 2024)
- Fixed drag and drop by removing automatic sorting
- Added direct delete button to activity cards in edit mode
- Implemented toast notification system with undo