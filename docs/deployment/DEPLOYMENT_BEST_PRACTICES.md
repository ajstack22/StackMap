# Deployment Best Practices

## Build Output Management

### ✅ DO:
- Build to `web/build/` directory
- Keep build artifacts in `web/build/`
- Deploy directly from `web/build/` to server
- Use `.gitignore` to exclude build artifacts from root

### ❌ DON'T:
- Copy build files to root directory (`cp -r web/build/* .`)
- Commit build artifacts to git
- Mix source files with build output

## Correct Build Process

```bash
# 1. Build the web app
NODE_ENV=production npm run build:web

# 2. Files are built to web/build/
# - bundle.*.js
# - index.html
# - service-worker.js
# - etc.

# 3. Deploy from web/build/ to server
# DO NOT copy to root first!
```

## Why This Matters

1. **Clean Repository**: Source files stay separate from build output
2. **Faster Git Operations**: No large binary files in history
3. **Clear Structure**: Easy to see what's source vs. generated
4. **Better Caching**: Build hashes change only when needed

## If You've Already Copied to Root

Run the cleanup script:
```bash
./cleanup-root.sh
```

This will remove:
- Bundle files (`bundle.*.js`)
- Built assets (hash-named `.png` files)
- Service worker files
- Test/debug HTML files
- Duplicate directories (`fonts/`, `icons/`)