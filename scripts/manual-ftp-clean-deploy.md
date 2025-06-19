# Manual FTP Clean Deployment Guide

This guide helps you do a clean deployment manually using an FTP client to avoid orphaned files.

## Why Clean Deployment?

When you just upload files, old files that were deleted from the repo remain on the server. This causes:
- Confusion about which files are active
- Potential security issues from old code
- Larger backup sizes
- Inconsistent state between repo and server

## Method 1: Using FTP Client (Recommended)

### For Qual Deployment:

1. **Connect to FTP**
   - Server: `ftp.stackmap.app` 
   - Username: `file-transer@stackmap.app`
   - Password: [Your FTP password]

2. **Navigate to qual directory**
   ```
   cd /public_html/qual/
   ```

3. **Backup current qual (optional)**
   - Download entire qual folder to your computer
   - Or rename on server: `qual` → `qual-backup-YYYYMMDD`

4. **Clean the directory**
   - Delete all contents of `/public_html/qual/`
   - Keep the `qual` folder itself

5. **Upload fresh copy**
   - Upload all files from your local StackMap folder
   - Skip these folders/files:
     - `.git/`
     - `node_modules/`
     - `tests/`
     - `scripts/`
     - `.github/`
     - `docs/`
     - `issues/`
     - `launch-prompts/`

### For Production Deployment:

1. **Connect to FTP** (same as above)

2. **Navigate to public_html**
   ```
   cd /public_html/
   ```

3. **CRITICAL: Identify what to preserve**
   ```
   These must NOT be deleted:
   - .well-known/     (SSL certificates)
   - qual/           (qual environment)
   - Any user uploads/data directories
   ```

4. **Clean deployment approach**
   - Create a temporary folder: `temp-deploy/`
   - Move preserved folders there temporarily
   - Delete everything else in public_html
   - Upload fresh files
   - Move preserved folders back

## Method 2: Using Sync Feature (If Available)

Some FTP clients have a "sync" feature that can:
- Compare local vs remote
- Delete files not in local
- Upload only changed files

Popular FTP clients with sync:
- FileZilla (use "Synchronized browsing")
- Cyberduck (use "Synchronize")
- Transmit (use "Sync")

## Method 3: Script-Assisted Deployment

1. **Generate file list locally**
   ```bash
   # In your StackMap directory
   find . -type f \
     -not -path "./.git/*" \
     -not -path "./node_modules/*" \
     -not -path "./tests/*" \
     -not -path "./scripts/*" \
     -not -path "./.github/*" \
     > deployment-files.txt
   ```

2. **Use this list to**
   - Know exactly what should be on server
   - Delete anything not on this list
   - Upload files from this list

## Post-Deployment Checklist

After clean deployment:

- [ ] Site loads correctly
- [ ] All features work
- [ ] No 404 errors in console
- [ ] Service worker updates
- [ ] Clear browser cache and test
- [ ] Test on mobile device
- [ ] Verify qual still works (if deployed to prod)

## Automation Available

Instead of manual deployment, you can use:
- `deploy-ftp-clean.yml` workflow - Has "clean deploy" option
- `deploy-ftp.yml` workflow - Standard deployment (may leave orphaned files)

The automated workflows handle all exclusions and preserve important directories automatically.