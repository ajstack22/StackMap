# Rapid Security Fix: Zero-Knowledge URLs (2-Day Implementation)

## Executive Summary
With very few users having syncs/shares, we can fix the security issue immediately without complex migration. Just switch to secure URLs and notify the handful of affected users.

## Current User Impact Assessment
- **Syncs**: ~10-20 users (estimate)
- **Shares**: Even fewer (time-limited, most expired)
- **Decision**: Direct cutover is feasible

## Day 1: Implementation (4-6 hours)

### Step 1: Backend Changes (1 hour)

**1.1 Update Share Creation** (`/api/sync/create_share.php`)
```php
// Add this at the top of existing file
$version = $_POST['version'] ?? 2;

if ($version === 3) {
    // Generate separate ID for URL path
    $share_id = substr(md5(uniqid(mt_rand(), true)), 0, 16);
    
    // Store with share_id instead of token
    $stmt = $pdo->prepare("
        INSERT INTO shares (
            share_id,
            token,
            encrypted_data,
            expires_at,
            recipient_name,
            share_note
        ) VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $share_id,
        $access_token, // Keep for backward compat
        $encrypted_data,
        $expires_at,
        $recipient_name,
        $share_note
    ]);
    
    // Don't include key in URL - client will append as fragment
    echo json_encode([
        'success' => true,
        'share_id' => $share_id,
        'access_token' => $access_token,
        'share_url' => "https://stackmap.app/share/{$share_id}",
        'expires_at' => $expires_at
    ]);
    exit;
}
// ... existing v2 code continues
```

**1.2 Update Share Access** (`/api/sync/access_share.php`)
```php
// Support both old (?token=) and new (?id=) parameters
$token = $_GET['token'] ?? null;
$share_id = $_GET['id'] ?? null;

if ($share_id) {
    // New secure format - fetch by ID only
    $stmt = $pdo->prepare("
        SELECT * FROM shares 
        WHERE share_id = ? AND expires_at > NOW()
    ");
    $stmt->execute([$share_id]);
} else if ($token) {
    // Old format - backward compatibility
    $stmt = $pdo->prepare("
        SELECT * FROM shares 
        WHERE token = ? AND expires_at > NOW()
    ");
    $stmt->execute([$token]);
}
// ... rest stays the same
```

**1.3 Add .htaccess Rules** (root directory)
```apache
# Add these rules to existing .htaccess
RewriteEngine On

# Handle new share URLs
RewriteRule ^share/([a-zA-Z0-9]+)$ /index.html [L]

# Handle new sync URLs  
RewriteRule ^sync/([a-zA-Z0-9]+)$ /index.html [L]

# Redirect old format to new (optional grace period)
RewriteCond %{QUERY_STRING} ^share=([^&]+)$
RewriteRule ^/?$ /share-migrate.html?token=%1 [R=302,L]

RewriteCond %{QUERY_STRING} ^sync=([^&]+)$  
RewriteRule ^/?$ /sync-migrate.html?phrase=%1 [R=302,L]
```

### Step 2: Frontend Changes (2 hours)

**2.1 Quick React Router Setup** (`/index.html` or main app entry)
```javascript
// Add simple routing without library if needed
function handleRoute() {
  const path = window.location.pathname;
  
  // Handle share URLs
  if (path.startsWith('/share/')) {
    const shareId = path.split('/share/')[1];
    const encryptionKey = window.location.hash.substring(1);
    
    if (!encryptionKey) {
      // Missing key - might be old format being migrated
      showMigrationMessage();
      return;
    }
    
    loadShareView(shareId, encryptionKey);
    return;
  }
  
  // Handle sync URLs
  if (path.startsWith('/sync/')) {
    const inviteCode = path.split('/sync/')[1];
    const recoveryPhrase = window.location.hash.substring(1);
    
    if (recoveryPhrase) {
      joinSyncWithPhrase(recoveryPhrase);
    } else {
      showSyncMigrationMessage();
    }
    return;
  }
  
  // Handle old query params (backward compat)
  const params = new URLSearchParams(window.location.search);
  
  if (params.has('share')) {
    // Old share format - extract and redirect
    const token = params.get('share');
    // Split token to get ID and key (if combined)
    const shareId = token.substring(0, 16);
    const key = token.substring(16);
    window.location.href = `/share/${shareId}#${key}`;
    return;
  }
  
  if (params.has('sync')) {
    // Old sync format - show migration message
    const phrase = params.get('sync');
    showSyncMigrationWithPhrase(phrase);
    return;
  }
  
  // Normal app load
  loadMainApp();
}

// Run on load and hash changes
window.addEventListener('load', handleRoute);
window.addEventListener('popstate', handleRoute);
```

**2.2 Update Share Creation** (`/src/services/sync/syncStoreIntegration.js`)
```javascript
async createShareLink(selectedUserIds, expiresHours, recipientName, shareNote) {
  // ... existing encryption code ...
  
  // Request v3 format from server
  const requestBody = {
    ...existingBody,
    version: 3  // Request new format
  };
  
  const response = await fetch(shareUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  
  const result = await response.json();
  
  // Append encryption key as fragment (never sent to server)
  const secureShareUrl = `${result.share_url}#${accessToken}`;
  
  return {
    ...result,
    shareUrl: secureShareUrl  // Override with secure version
  };
}
```

**2.3 Update Share View** (`/src/components/ShareView/ShareView.js`)
```javascript
// Modify to handle both URL formats
const ShareView = (props) => {
  const [shareData, setShareData] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      let shareId, encryptionKey;
      
      // Check if we're using new format (path-based)
      if (window.location.pathname.startsWith('/share/')) {
        shareId = window.location.pathname.split('/share/')[1];
        encryptionKey = window.location.hash.substring(1);
      } 
      // Fallback to old format (query param)
      else {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('share') || props.shareToken;
        if (token) {
          shareId = token.substring(0, 16);
          encryptionKey = token.substring(16);
        }
      }
      
      if (!shareId || !encryptionKey) {
        setError('Invalid share link');
        return;
      }
      
      // Fetch with ID only (v3) or full token (v2)
      const endpoint = encryptionKey.length > 32 
        ? `/api/sync/access_share.php?id=${shareId}`
        : `/api/sync/access_share.php?token=${shareId}${encryptionKey}`;
        
      const response = await fetch(endpoint);
      // ... rest of decryption logic
    };
    
    loadData();
  }, []);
  
  // ... rest of component
};
```

### Step 3: Migration Messages (1 hour)

**3.1 Create Migration Helper Pages**

**`/share-migrate.html`**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Share Link Update - StackMap</title>
  <style>
    body { 
      font-family: 'Comic Sans MS', sans-serif;
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }
    .warning {
      background: #fff3cd;
      border: 2px solid #ffc107;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }
    .button {
      background: #667eea;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>📱 Share Link Security Update</h1>
  
  <div class="warning">
    <h2>This share link has expired or needs updating</h2>
    <p>We've improved our security! Old share links are no longer supported.</p>
    <p>Please ask the person who shared this with you to create a new share link.</p>
  </div>
  
  <button class="button" onclick="window.location.href='/'">
    Go to StackMap
  </button>
  
  <script>
    // Auto-redirect if we can extract the token
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token && token.length > 16) {
      // Try to split and redirect to new format
      const id = token.substring(0, 16);
      const key = token.substring(16);
      window.location.href = `/share/${id}#${key}`;
    }
  </script>
</body>
</html>
```

**`/sync-migrate.html`**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Sync Security Update - StackMap</title>
  <style>
    /* Same styles as above */
  </style>
</head>
<body>
  <h1>🔄 Sync Security Update</h1>
  
  <div class="warning">
    <h2>Important: Sync URL Format Has Changed</h2>
    <p>For your security, sync links now work differently.</p>
    
    <div id="phraseSection" style="display:none;">
      <h3>Your Recovery Phrase:</h3>
      <code id="phrase" style="background: #f0f0f0; padding: 10px; display: block; margin: 10px 0;"></code>
      <p>Save this phrase and enter it in the app's sync settings.</p>
    </div>
  </div>
  
  <button class="button" onclick="window.location.href='/'">
    Open StackMap
  </button>
  
  <script>
    // Show the phrase if present
    const params = new URLSearchParams(window.location.search);
    const phrase = params.get('phrase');
    if (phrase) {
      document.getElementById('phrase').textContent = phrase;
      document.getElementById('phraseSection').style.display = 'block';
    }
  </script>
</body>
</html>
```

## Day 2: Testing & Deployment (2-3 hours)

### Step 1: Local Testing Checklist (1 hour)
```bash
# 1. Test new share creation
- Create share with v3 format
- Verify URL is /share/[id]#[key]
- Confirm access works
- Check encryption key not in network requests

# 2. Test backward compatibility  
- Access old share URL (?share=token)
- Verify redirect/migration message
- Test data still accessible if valid

# 3. Test sync URLs
- Create sync with new format
- Verify phrase in fragment only
- Test joining sync

# 4. Browser DevTools verification
- Network tab: No keys in requests
- Console: No key logging
- Application tab: Check localStorage/cookies
```

### Step 2: Production Deployment (30 mins)

```bash
# 1. Backup database
mysqldump -u user -p stackmap > backup_$(date +%Y%m%d).sql

# 2. Add database column (if needed)
ALTER TABLE shares ADD COLUMN share_id VARCHAR(32) AFTER id;
UPDATE shares SET share_id = LEFT(token, 16) WHERE share_id IS NULL;
ALTER TABLE shares ADD INDEX idx_share_id (share_id);

# 3. Deploy files
scp -r ./api/sync/*.php server:/var/www/api/sync/
scp .htaccess server:/var/www/
scp *-migrate.html server:/var/www/
scp -r ./build/* server:/var/www/

# 4. Clear caches
ssh server "rm -rf /var/cache/nginx/*"

# 5. Test in production
curl https://stackmap.app/api/sync/create_share.php
```

### Step 3: User Communication (30 mins)

**Email to affected users (if you have contacts):**
```
Subject: Important: StackMap Security Update - Action May Be Required

Hi [User],

We've updated StackMap's sharing and sync features to be even more secure. 

What's changed:
- Share and sync links now use a more secure format
- Your data is even better protected

Action needed:
- If you have active sync: Please re-enable it in Settings
- If you have shared links: Please create new ones

This is a one-time change that makes StackMap truly zero-knowledge.

Questions? Reply to this email.

Best,
The StackMap Team
```

**In-app notification:**
```javascript
// Add to main app component
if (localStorage.getItem('sync_enabled') && !localStorage.getItem('v3_migration_done')) {
  showNotification({
    type: 'info',
    message: 'Sync has been updated for better security. Please check your sync settings.',
    action: 'Go to Settings',
    onAction: () => navigateToSettings()
  });
  localStorage.setItem('v3_migration_done', 'true');
}
```

## Total Time: ~8 hours of work

### Day 1 (Friday):
- Morning: Backend changes (1 hr)
- Afternoon: Frontend changes (2 hrs)
- Late afternoon: Migration pages (1 hr)

### Day 2 (Monday):
- Morning: Testing (1 hr)
- Afternoon: Deploy & monitor (1 hr)

## Rollback Plan (If Needed)

If issues arise, rollback is simple:
```bash
# 1. Restore .htaccess (removes redirects)
scp backup/.htaccess server:/var/www/

# 2. Revert API to support both formats
# (Keep backward compatibility code)

# 3. Clear caches
ssh server "rm -rf /var/cache/nginx/*"
```

## Success Metrics

After 1 week:
- [ ] Zero encryption keys in server logs
- [ ] All new shares use /share/[id]#[key] format  
- [ ] No user complaints about broken links
- [ ] Existing users successfully migrated

## Why This Works

1. **Few users = Low risk**: Direct communication is possible
2. **Shares expire**: Most old shares are already dead
3. **Simple change**: Just URL format, not core functionality
4. **Grace period**: Migration pages help confused users
5. **Quick win**: Massive security improvement in 2 days

## Next Steps After Success

Once this is working:
1. Remove backward compatibility code (after 30 days)
2. Delete migration pages
3. Clean up old database columns
4. Implement invite-based sync URLs (lower priority)

---

This is a "rip the bandaid off" approach that gets you to zero-knowledge security in 2 days with minimal user disruption. The key is doing it NOW while you have few users to migrate.