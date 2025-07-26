# 🚨🚨🚨 CRITICAL DEPLOYMENT INFO - READ THIS FIRST 🚨🚨🚨

## ⚠️ NEVER EVER DO THIS ⚠️
### ❌ DO NOT COPY BUILD FILES TO REPOSITORY ROOT ❌
### ❌ NO `cp web/build/* .` ❌
### ❌ NO `cp -r web/build/* .` ❌
### ❌ BUILD FILES STAY IN web/build/ ❌

## ✅ HOW NAMECHEAP DEPLOYMENT ACTUALLY WORKS ✅

### 1. QUAL DEPLOYMENT (Testing)
```bash
# URL: https://stackmap.app/qual/
# Git pulls to: /public_html/qual/
# Files are in: /public_html/qual/web/build/
# .htaccess magic: Serves web/build/ content at /qual/
# IMPORTANT: Copy qual-htaccess to /public_html/qual/.htaccess
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

# 4. CRITICAL: Copy htaccess
ssh stackmap-cpanel "cp ~/public_html/qual/qual-htaccess ~/public_html/qual/.htaccess"
```

### To Production:
```bash
# ONLY after qual is tested and working
./scripts/simple-deploy.sh
```

## 🚫 IGNORE THESE FILES
- `.cpanel.yml` - DOES NOT WORK on Namecheap

## 🎯 KEY FACTS
1. Qual URL: `https://stackmap.app/qual/` (NOT /qual/web/build/)
2. Git clones directly to `/public_html/qual/`
3. Build outputs to `web/build/`
4. NEVER copy build files to root manually
5. Production deployment ONLY via simple-deploy.sh
6. **AFTER GIT PULL**: Copy qual-htaccess to .htaccess in qual directory

## Recent Changes (December 28, 2024)
- Fixed drag and drop by removing automatic sorting
- Added direct delete button to activity cards in edit mode
- Implemented toast notification system with undo