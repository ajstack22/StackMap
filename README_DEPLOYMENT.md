# 🚨🚨🚨 DEPLOYMENT - READ THIS FIRST 🚨🚨🚨

## WHY WE HAD 403 ERRORS FOR HOURS:

**Build files were in .gitignore!** So after git pull, there was NO index.html on the server!

## QUAL DEPLOYMENT (THE ONLY WAY THAT WORKS):

```bash
# Option 1: Use the npm script
npm run deploy:qual
git add -A && git commit -m "Deploy" && git push
ssh stackmap-cpanel "cd ~/public_html/qual && git pull"

# Option 2: Manual
NODE_ENV=production npm run build:web
cp web/build/*.* . && cp -r web/build/fonts . && cp -r web/build/icons .
git add -A && git commit -m "Deploy" && git push
ssh stackmap-cpanel "cd ~/public_html/qual && git pull"
```

## PRODUCTION DEPLOYMENT:
```bash
./scripts/simple-deploy.sh
```

## IF YOU GET 403:
1. **CHECK .gitignore** - Are these files commented out?
   - /index.html
   - /bundle.*.js
   - /manifest.json
   - /service-worker.js
   - /workbox-*.js
   - /fonts/
   - /icons/
   - /*.png

2. **CHECK GIT STATUS** - Are the files committed?
   ```bash
   git ls-files index.html  # Should show the file, not empty
   ```

## DO NOT:
- ❌ Add build files to .gitignore
- ❌ Try to serve from /web/build/ with htaccess tricks
- ❌ Overcomplicate this

## DO:
- ✅ Copy build files to repository root
- ✅ Commit them to git
- ✅ Push and pull

THIS IS THE WAY. DON'T CHANGE IT.