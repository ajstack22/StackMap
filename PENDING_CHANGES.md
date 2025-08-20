# Pending Changes

## Title: Fix 404 Errors on API by Correcting .htaccess Rewrite Rules

### Root Cause Analysis

The persistent 404 errors are not a client-side issue. The problem is in the server's `.htaccess` configuration, which was incorrectly routing all API requests from the `/qual/` path to `index.html`.

The current rule only allows requests that start with `/api/` to pass through. Our "qual" requests start with `/qual/api/`, so they were being blocked.

### Solution

Modify the `.htaccess` file to correctly handle requests for both the production (`/api/`) and qualification (`/qual/api/`) API paths.

**Proposed Change to `.htaccess`:**

Update the rewrite conditions to exclude both API paths from being redirected to the Single Page Application's `index.html`.

```apache
# Change this:
RewriteCond %{REQUEST_URI} !^/api/

# To this:
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !^/qual/api/
```

This change will ensure that requests to both `https://stackmap.app/api/sync/...` and `https://stackmap.app/qual/api/sync/...` are correctly routed to the PHP scripts instead of being handled by the client-side application.

This is the definitive fix for the 404 errors. All other client-side debugging can be stopped.