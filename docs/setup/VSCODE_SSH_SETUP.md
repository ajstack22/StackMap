# VS Code SSH Setup for cPanel

## Installing Remote - SSH Extension

1. Open VS Code
2. Click the Extensions icon (or press `Cmd+Shift+X`)
3. Search for "Remote - SSH"
4. Install the official Microsoft extension "Remote - SSH"
5. You'll see a new icon in the Activity Bar (looks like a monitor with a small icon)

## Setting Up SSH Connection

### Method 1: Quick Connect

1. Press `Cmd+Shift+P` (Command Palette)
2. Type "Remote-SSH: Connect to Host..."
3. Enter your connection string:
   ```
   <cpanel-user>@your-server.com -p 22
   ```
4. Enter your password when prompted

### Method 2: Save Connection (Recommended)

1. Press `Cmd+Shift+P`
2. Type "Remote-SSH: Open SSH Configuration File..."
3. Select the first option (usually `~/.ssh/config`)
4. Add your server configuration:

```
Host stackmap-cpanel
    HostName your-server.com
    Port 22
    User <cpanel-user>
```

5. Save the file
6. Now when you connect, you can just select "stackmap-cpanel" from the list

## Connecting to Your Server

1. Click the Remote Explorer icon in the Activity Bar (green icon)
2. You'll see your saved connections under "SSH Targets"
3. Click the connect icon (→) next to "stackmap-cpanel"
4. Choose "Linux" when asked about the platform
5. Enter your password

## First Time Setup

When you first connect, VS Code will:
- Install VS Code Server on your cPanel server (automatic)
- Set up the remote development environment
- This takes a minute or two

## Working with Your Files

Once connected:

1. **Open a folder**: Click "Open Folder" and navigate to:
   - `/home/<cpanel-user>/qual` - Your staging site
   - `/home/<cpanel-user>/public_html` - Your production site
   - `/home/<cpanel-user>` - Your home directory

2. **Terminal Access**: 
   - Press `` Ctrl+` `` to open integrated terminal
   - You're now in a terminal on your server!

3. **Edit Files Directly**:
   - All changes save directly to the server
   - No need to upload/download files

## Useful VS Code SSH Features

### 1. Multiple Terminals
- Click the `+` icon in terminal to open multiple sessions
- Name them: "Deployment", "Logs", "Monitoring"

### 2. Port Forwarding
- Access your qual site locally:
  - In terminal: `cd ~/qual && python -m http.server 8080`
  - VS Code auto-forwards the port
  - Visit `localhost:8080` in your browser

### 3. File Search
- `Cmd+P` - Quick file open
- `Cmd+Shift+F` - Search across all files

### 4. Split Editor
- Work on qual and prod files side by side
- Right-click tab → "Split Right"

## Recommended Workspace Setup

1. **Create a workspace file** locally:

`stackmap-cpanel.code-workspace`:
```json
{
    "folders": [
        {
            "name": "📦 Qual (Staging)",
            "uri": "vscode-remote://ssh-remote+stackmap-cpanel/home/<cpanel-user>/qual"
        },
        {
            "name": "🌐 Production",
            "uri": "vscode-remote://ssh-remote+stackmap-cpanel/home/<cpanel-user>/public_html"
        },
        {
            "name": "🔧 Scripts",
            "uri": "vscode-remote://ssh-remote+stackmap-cpanel/home/<cpanel-user>/scripts"
        }
    ],
    "settings": {
        "files.autoSave": "off",
        "editor.formatOnSave": false
    }
}
```

2. Open with: File → Open Workspace from File

## SSH Key Setup (Optional but Recommended)

To avoid entering your password every time:

1. **Generate SSH key** (if you don't have one):
   ```bash
   ssh-keygen -t rsa -b 4096
   ```

2. **Copy to server**:
   ```bash
   ssh-copy-id -p 22 <cpanel-user>@your-server.com
   ```

3. **Test connection**:
   ```bash
   ssh -p 22 <cpanel-user>@your-server.com
   ```

## Troubleshooting

### "Could not establish connection"
- Check your internet connection
- Verify SSH details are correct
- Ensure SSH is enabled on your hosting account

### "Permission denied"
- Check username and password
- Some hosts require you to enable SSH access first

### VS Code Server Installation Fails
- Check you have enough disk space
- Try: `rm -rf ~/.vscode-server` on the server and reconnect

### Slow Connection
- First connection is always slower (installing VS Code Server)
- Consider using SSH keys instead of passwords
- Check with your host about connection limits

## Pro Tips

1. **Save your password** (Mac):
   - VS Code will offer to save in Keychain
   - Accept for convenience

2. **Create aliases** in your remote `.bashrc`:
   ```bash
   alias cdqual='cd ~/qual'
   alias cdprod='cd ~/public_html'
   alias deploy='bash ~/scripts/cpanel-deploy-to-prod.sh'
   alias logs='tail -f ~/deployment-logs/latest.log'
   ```

3. **Install helpful extensions** for remote work:
   - "Path Intellisense" - Autocomplete filenames
   - "Live Server" - Preview changes locally
   - "GitLens" - See git blame and history

4. **Set up tasks** for common operations:
   - `.vscode/tasks.json` in your workspace
   - Create tasks for deployment, backup, etc.

## Security Notes

- VS Code creates a secure tunnel to your server
- Your files never leave the server
- All editing happens remotely
- Safe to use on public WiFi

## Quick Start Commands

After setup, your workflow becomes:

1. Open VS Code
2. Click Remote Explorer
3. Click your saved connection
4. Start coding directly on the server!

No more FTP, no more file syncing - just direct server development!