# SSH Setup Guide for cPanel

## Prerequisites

1. **SSH Access Enabled** - Your hosting provider must have SSH enabled for your account
2. **SSH Credentials**:
   - Username (usually your cPanel username)
   - Password (usually your cPanel password)
   - Server hostname or IP address
   - Port number (default is 22, but many hosts use custom ports like 2222)

## Method 1: Using Terminal (Mac/Linux)

### Basic SSH Command
```bash
ssh username@your-server.com
```

### With Custom Port
```bash
ssh -p 2222 username@your-server.com
```

### Example for your setup
```bash
ssh stachblx@your-cpanel-server.com -p 22
```

## Method 2: First Time Setup

1. **Find Your SSH Details in cPanel**:
   - Log into cPanel
   - Look for "SSH Access" or "Terminal"
   - Note the connection information shown

2. **Common Hosting Providers SSH Info**:
   - **Bluehost**: Port 22, use cPanel username
   - **HostGator**: Port 2222, use cPanel username
   - **SiteGround**: Port 18765, use cPanel username
   - **GoDaddy**: Port 22, may need to enable first
   - **Namecheap**: Port 21098, use cPanel username

3. **Test Connection**:
   ```bash
   # Replace with your actual details
   ssh -p YOUR_PORT YOUR_USERNAME@YOUR_SERVER
   ```

## Method 3: Using SSH Key Authentication (More Secure)

### Generate SSH Key (if you don't have one)
```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

### Copy Key to Server
```bash
# Method 1: Using ssh-copy-id
ssh-copy-id -p PORT username@server

# Method 2: Manual copy
cat ~/.ssh/id_rsa.pub
# Then paste into cPanel → SSH Access → Manage SSH Keys → Import Key
```

## Common Issues and Solutions

### "Connection refused"
- SSH might not be enabled
- Wrong port number
- Firewall blocking connection

### "Permission denied"
- Wrong username or password
- SSH keys not set up correctly
- Account doesn't have SSH access

### "Host key verification failed"
- First time connecting to server
- Type "yes" when prompted to add host key

## Finding Your SSH Information

### Option 1: Check cPanel
1. Log into cPanel
2. Look for "SSH Access" section
3. Connection details are usually shown there

### Option 2: Check Welcome Email
Your hosting provider's welcome email often contains:
- Server hostname
- SSH port
- Username

### Option 3: Ask Your Host
Contact support and ask for:
- SSH hostname/IP
- SSH port number
- Confirm your username

## Quick Setup Script

Save this as `~/.ssh/config` for easy access:

```
Host stackmap
    HostName your-server.com
    Port 22
    User stachblx
```

Then you can just type:
```bash
ssh stackmap
```

## For Windows Users

### Option 1: Windows Terminal/PowerShell
```powershell
ssh username@server -p port
```

### Option 2: PuTTY
1. Download PuTTY from putty.org
2. Enter hostname and port
3. Click "Open"
4. Enter username and password when prompted

## Security Tips

1. **Use SSH Keys** instead of passwords
2. **Use non-standard ports** if possible
3. **Disable root login**
4. **Use strong passwords**
5. **Keep your SSH client updated**

## Testing Your Connection

Once connected, try these commands:
```bash
# Check where you are
pwd

# List files
ls -la

# Go to your web directory
cd ~/public_html

# Check disk usage
df -h

# Exit SSH
exit
```

## Automation Helper

Create this script locally as `connect-stackmap.sh`:

```bash
#!/bin/bash
echo "Connecting to StackMap cPanel..."
ssh -p 22 stachblx@your-server.com
```

Make it executable:
```bash
chmod +x connect-stackmap.sh
./connect-stackmap.sh
```