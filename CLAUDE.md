# 🚨 STACKMAP DEPLOYMENT - THE TRUTH 🚨

## 📚 Documentation Guide
- **[MD_FILES_INDEX.md](./MD_FILES_INDEX.md)** - Start here! Index of all documentation
- **[MD_FILES_AUDIT_REPORT.md](./MD_FILES_AUDIT_REPORT.md)** - Which docs to trust/ignore
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues & solutions

## ✅ WHAT ACTUALLY WORKS ✅

### For Qual Deployment:
1. Build: `NODE_ENV=production npm run build:web`
2. Copy build files to root: `cp web/build/*.* . && cp -r web/build/fonts . && cp -r web/build/icons .`
3. Commit and push
4. Pull on server: `ssh stackmap-cpanel "cd ~/public_html/qual && git pull"`

### For Production:
Use `./scripts/simple-deploy.sh` (it rsyncs from qual to prod)

## 📁 YES, FILES GO IN ROOT FOR QUAL
```
/public_html/qual/
├── index.html          # YES, in root
├── bundle.*.js         # YES, in root  
├── manifest.json       # YES, in root
├── service-worker.js   # YES, in root
├── fonts/              # YES, in root
├── icons/              # YES, in root
├── web/build/          # Source of truth, but we copy from here
└── src/                # Source code
```

## 🎯 THE FACTS
1. We DO copy build files to root for qual (despite what I said before)
2. This is what has always worked
3. Production uses simple-deploy.sh to rsync from qual
4. .cpanel.yml doesn't work on Namecheap - ignore it
5. No htaccess tricks needed - just files in root

## Recent Changes (December 28, 2024)
- Fixed drag and drop by removing automatic sorting
- Added direct delete button to activity cards in edit mode
- Implemented toast notification system with undo