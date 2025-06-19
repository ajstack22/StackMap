# Alternative Qual Environment Setup

Since the /qual subdirectory isn't accessible via web, here are alternative approaches:

## Option 1: Create a Subdomain (Recommended)

1. In cPanel, go to "Domains" → "Subdomains"
2. Create subdomain: `qual.stackmap.app`
3. Set document root to: `/home/stachblx/public_html/qual`
4. The qual environment will be accessible at: https://qual.stackmap.app

## Option 2: Use a Different Directory Name

Some hosts block certain directory names. Try:
```bash
ssh stackmap-cpanel "mv ~/public_html/qual ~/public_html/staging"
```

Then access at: https://stackmap.app/staging/

## Option 3: Deploy Directly to a Test Subdirectory

Instead of using 'qual', use 'test':
```bash
ssh stackmap-cpanel "mv ~/public_html/qual ~/public_html/test"
```

## Current Setup

The qual environment is properly set up at:
- Server path: `/home/stachblx/public_html/qual`
- Git repository is there and working
- Files are deployed correctly

The only issue is web server access configuration.

## Quick Test

To verify the files are there:
```bash
ssh stackmap-cpanel "ls -la ~/public_html/qual/index.html"
```

## Updating CI/CD After Change

Once you choose an approach, update:
1. `.cpanel.yml` - deployment path
2. `.github/workflows/deploy.yml` - all references to qual path
3. Documentation - update URLs