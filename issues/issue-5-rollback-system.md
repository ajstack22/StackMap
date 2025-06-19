# Issue: Build one-click rollback system for instant recovery

## Problem
When deployments fail, recovery takes 30+ minutes of manual work:
- SSH into server
- Manually restore from Git or backups
- No clear rollback procedure
- High stress during outages
- No visibility into available versions

## Solution
Create web-based rollback interface for instant recovery without SSH.

## Implementation Details

### 1. Create rollback.php
Location: `/home/stachblx/rollback/rollback.php`

```php
<?php
// Simple authentication
$valid_password = 'CHANGE_THIS_PASSWORD';
session_start();

if (!isset($_SESSION['authenticated'])) {
    if ($_POST['password'] !== $valid_password) {
        ?>
        <form method="post">
            Password: <input type="password" name="password">
            <button type="submit">Login</button>
        </form>
        <?php
        exit;
    }
    $_SESSION['authenticated'] = true;
}

// Rollback logic
$releases_dir = '/home/stachblx/releases';
$current_link = '/home/stachblx/public_html';

function get_releases() {
    global $releases_dir;
    $dirs = scandir($releases_dir, SCANDIR_SORT_DESCENDING);
    return array_filter($dirs, function($d) use ($releases_dir) {
        return $d !== '.' && $d !== '..' && is_dir("$releases_dir/$d");
    });
}

function get_current() {
    global $current_link;
    return basename(readlink($current_link));
}

function rollback_to($release) {
    global $releases_dir, $current_link;
    $target = "$releases_dir/$release";
    
    if (!is_dir($target)) {
        return "Release not found: $release";
    }
    
    // Create backup of current
    $backup = "$releases_dir/rollback_" . date('YmdHis');
    shell_exec("cp -r $current_link $backup");
    
    // Switch symlink
    $temp = $current_link . '_tmp';
    symlink($target, $temp);
    rename($temp, $current_link);
    
    return "Successfully rolled back to $release";
}

// Handle rollback request
if ($_POST['rollback_to']) {
    $message = rollback_to($_POST['rollback_to']);
}

$current = get_current();
$releases = get_releases();
?>

<!DOCTYPE html>
<html>
<head>
    <title>StackMap Rollback Manager</title>
    <style>
        body { font-family: Arial; margin: 20px; }
        .current { background: #4CAF50; color: white; }
        .release { 
            margin: 10px 0; 
            padding: 10px; 
            border: 1px solid #ddd; 
            display: flex; 
            justify-content: space-between;
        }
        .btn { 
            background: #f44336; 
            color: white; 
            border: none; 
            padding: 5px 15px; 
            cursor: pointer; 
        }
        .message { 
            background: #2196F3; 
            color: white; 
            padding: 10px; 
            margin: 10px 0; 
        }
    </style>
</head>
<body>
    <h1>StackMap Rollback Manager</h1>
    
    <?php if ($message): ?>
        <div class="message"><?= htmlspecialchars($message) ?></div>
    <?php endif; ?>
    
    <h2>Available Releases</h2>
    <?php foreach ($releases as $release): ?>
        <div class="release <?= $release === $current ? 'current' : '' ?>">
            <span>
                <?= htmlspecialchars($release) ?>
                <?= $release === $current ? ' (CURRENT)' : '' ?>
            </span>
            <?php if ($release !== $current): ?>
                <form method="post" style="display: inline">
                    <input type="hidden" name="rollback_to" value="<?= htmlspecialchars($release) ?>">
                    <button class="btn" onclick="return confirm('Rollback to <?= htmlspecialchars($release) ?>?')">
                        Rollback
                    </button>
                </form>
            <?php endif; ?>
        </div>
    <?php endforeach; ?>
    
    <hr>
    <p>Current time: <?= date('Y-m-d H:i:s') ?></p>
    <form method="post">
        <button name="refresh" value="1">Refresh</button>
    </form>
</body>
</html>
```

### 2. Secure Access
Create `.htaccess` in rollback directory:
```apache
# IP Whitelist (optional)
Order Deny,Allow
Deny from all
Allow from YOUR.IP.ADDRESS

# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

# Prevent directory listing
Options -Indexes
```

### 3. Integration with Deployment
After each deployment:
```bash
# Log deployment
echo "$(date): Deployed $RELEASE_ID" >> /home/stachblx/deployments.log
```

## Benefits
- Rollback in <30 seconds
- No SSH required
- Visual interface
- Audit trail
- Works from phone during emergencies

## Security Considerations
- Strong password required
- Consider IP whitelist
- HTTPS only
- Session timeout
- Activity logging

## Testing Plan
1. Deploy rollback.php to protected directory
2. Test authentication
3. Create test releases
4. Verify symlink switching
5. Test from mobile device

## Success Criteria
- [ ] Can rollback in <30 seconds
- [ ] Interface accessible via HTTPS
- [ ] Authentication working
- [ ] Shows all available releases
- [ ] Rollback creates backup
- [ ] Works on mobile

## References
- Research: [CICD_research.md lines 235-352]
- Production outage recovery took 30+ minutes
- Need for emergency access without SSH