# Qual Deployment Instructions

After pushing to git, you need to:

1. Copy qual-htaccess to /public_html/qual/.htaccess on the server
   ```
   cp qual-htaccess /public_html/qual/.htaccess
   ```

2. The build files stay in web/build/ - do NOT copy them to root

3. The .htaccess will serve files from web/build/ automatically

## File Structure on Server
```
/public_html/qual/
├── .htaccess (copied from qual-htaccess)
├── web/
│   └── build/
│       ├── index.html
│       ├── bundle.*.js
│       ├── manifest.json
│       ├── service-worker.js
│       ├── icons/
│       └── fonts/
└── src/
```

## Important
- NEVER copy build files to repository root
- The qual .htaccess handles serving from web/build/
- For production deployment, use simple-deploy.sh