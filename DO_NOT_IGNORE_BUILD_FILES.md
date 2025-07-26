# 🚨 DO NOT ADD BUILD FILES TO .gitignore 🚨

## THE PROBLEM THAT WASTED HOURS:
Build files were in .gitignore, so after git pull on server, there was NO index.html = 403 ERROR

## THESE FILES MUST BE IN GIT:
- index.html
- bundle.*.js
- manifest.json
- service-worker.js
- workbox-*.js
- fonts/
- icons/
- *.png (the webpack hash-named ones)

## IF YOU GET 403 AFTER DEPLOYMENT:
1. Check .gitignore - are build files being ignored?
2. Check git status - are the files actually committed?
3. These files MUST be in the repository root for qual

## DEPLOYMENT THAT WORKS:
```bash
NODE_ENV=production npm run build:web
cp web/build/*.* . && cp -r web/build/fonts . && cp -r web/build/icons .
git add -A && git commit -m "Deploy" && git push
ssh stackmap-cpanel "cd ~/public_html/qual && git pull"
```

DO NOT CHANGE THIS. IT WORKS.