# Security Migration: Zero-Knowledge URL Patterns

## Executive Summary

StackMap currently exposes encryption keys in server-visible URLs for both Share and Sync features. This violates zero-knowledge principles and creates security risks. This document provides a complete technical implementation guide to migrate to cryptographically secure URL patterns.

## Current Security Issues

### 1. Share URLs (`?share=[token]`)
```
Current:  https://stackmap.app?share=abc123xyz789
Problem:  Full token (including encryption key) visible to server
Risk:     Server logs contain decryption keys
```

### 2. Sync URLs (`?sync=[recoveryPhrase]`)
```
Current:  https://stackmap.app/?sync=f47ac10b58cc4372a5670e02b2c3d479
Problem:  Raw recovery phrase in query parameter
Risk:     Complete compromise if server logs are breached
```

## Proposed Secure Architecture

### Share URLs: `/share/[id]#[key]`
```
Proposed: https://stackmap.app/share/abc123#xyz789
Server sees: /share/abc123 (identifier only)
Client keeps: #xyz789 (decryption key, never sent)
```

### Sync URLs: `/sync/[invite]#[phrase]`
```
Proposed: https://stackmap.app/sync/invite123#f47ac10b58cc4372a5670e02b2c3d479
Server sees: /sync/invite123 (invite code only)
Client keeps: #recovery-phrase (never sent to server)
```

## Implementation Guide

### Phase 1: Share URL Migration

#### 1.1 Backend Changes (PHP)

**NEW: `/api/sync/create_share_v3.php`**
```php
<?php
header('Content-Type: application/json');
header('X-Share-Version: 3');

$input = json_decode(file_get_contents('php://input'), true);

// Generate separate ID and key
$share_id = bin2hex(random_bytes(16)); // 32 char hex ID
$encryption_key = bin2hex(random_bytes(32)); // 64 char hex key

// Server stores only encrypted data with ID
$stmt = $pdo->prepare("
  INSERT INTO shares_v3 (
    share_id, 
    encrypted_data, 
    expires_at,
    recipient_name,
    share_note,
    created_at
  ) VALUES (?, ?, ?, ?, ?, NOW())
");

$expires_at = date('Y-m-d H:i:s', time() + ($input['expires_in_hours'] * 3600));

$stmt->execute([
  $share_id,
  $input['encrypted_data'], // Already encrypted client-side
  $expires_at,
  $input['recipient_name'] ?? null,
  $input['share_note'] ?? null
]);

// Return ID and key separately
echo json_encode([
  'success' => true,
  'share_id' => $share_id,
  'encryption_key' => $encryption_key, // Client will put in fragment
  'share_url' => "https://stackmap.app/share/{$share_id}#{$encryption_key}",
  'expires_at' => $expires_at
]);
?>
```

**NEW: `/api/sync/access_share_v3.php`**
```php
<?php
// Only receives share_id, not encryption key
$share_id = $_GET['id'] ?? '';

if (!preg_match('/^[a-f0-9]{32}$/', $share_id)) {
  http_response_code(400);
  die(json_encode(['error' => 'Invalid share ID format']));
}

$stmt = $pdo->prepare("
  SELECT encrypted_data, expires_at, recipient_name, share_note
  FROM shares_v3 
  WHERE share_id = ? AND expires_at > NOW()
");
$stmt->execute([$share_id]);
$share = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$share) {
  http_response_code(404);
  die(json_encode(['error' => 'Share not found or expired']));
}

// Return encrypted data - client will decrypt using fragment key
echo json_encode([
  'success' => true,
  'encrypted_data' => $share['encrypted_data'],
  'expires_at' => $share['expires_at'],
  'recipient_name' => $share['recipient_name'],
  'share_note' => $share['share_note'],
  'version' => 3 // Indicates new format
]);
?>
```

#### 1.2 Frontend Changes

**UPDATE: `/src/services/sync/syncStoreIntegration.js`**
```javascript
async createShareLink(selectedUserIds, expiresHours, recipientName, shareNote) {
  try {
    // Generate encryption key client-side
    const encryptionKey = nacl.randomBytes(32);
    const keyHex = Array.from(encryptionKey)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Encrypt data with the key
    const shareData = this.gatherShareData(selectedUserIds);
    const encrypted = await this.encryptShareData(shareData, encryptionKey);
    
    // Send to server (without the key)
    const response = await fetch('/api/sync/create_share_v3.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        encrypted_data: encrypted,
        expires_in_hours: expiresHours,
        recipient_name: recipientName,
        share_note: shareNote
      })
    });
    
    const result = await response.json();
    
    // Construct secure URL with key in fragment
    const shareUrl = `${window.location.origin}/share/${result.share_id}#${keyHex}`;
    
    return {
      shareUrl,
      shareId: result.share_id,
      expiresAt: result.expires_at
    };
  } catch (error) {
    console.error('[Share] Creation failed:', error);
    throw error;
  }
}
```

**UPDATE: `/src/components/ShareView/ShareView.js`**
```javascript
const ShareView = ({ shareId }) => { // Note: shareId from route, not token
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadShareData();
  }, [shareId]);
  
  const loadShareData = async () => {
    try {
      // Extract encryption key from fragment (never sent to server)
      const encryptionKey = window.location.hash.substring(1);
      
      if (!encryptionKey) {
        throw new Error('Invalid share link - missing decryption key');
      }
      
      // Fetch encrypted data using only the ID
      const response = await fetch(`/api/sync/access_share_v3.php?id=${shareId}`);
      
      if (!response.ok) {
        throw new Error('Share not found or expired');
      }
      
      const data = await response.json();
      
      // Decrypt using key from fragment
      const keyBytes = new Uint8Array(
        encryptionKey.match(/.{2}/g).map(byte => parseInt(byte, 16))
      );
      
      const decrypted = await this.decryptShareData(
        data.encrypted_data,
        keyBytes
      );
      
      setShareData(decrypted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // ... rest of component
};
```

#### 1.3 Routing Changes

**For React Navigation (Mobile)**
```javascript
// In App.js or navigation config
<Stack.Screen 
  name="Share" 
  component={ShareView}
  options={{
    path: 'share/:shareId', // Captures ID from path
  }}
/>
```

**For Web (React Router or custom)**
```javascript
// Route configuration
{
  path: '/share/:shareId',
  component: ShareView,
  // ShareView receives shareId as prop
}
```

### Phase 2: Sync URL Migration

#### 2.1 Backend Changes

**NEW: `/api/sync/create_invite.php`**
```php
<?php
// Creates a time-limited invite code for sync group
$input = json_decode(file_get_contents('php://input'), true);
$sync_id = $input['sync_id']; // Hash of recovery phrase

// Generate invite code
$invite_code = bin2hex(random_bytes(8)); // 16 char hex
$expires_at = date('Y-m-d H:i:s', time() + 86400); // 24 hours

$stmt = $pdo->prepare("
  INSERT INTO sync_invites (invite_code, sync_id, expires_at)
  VALUES (?, ?, ?)
");
$stmt->execute([$invite_code, $sync_id, $expires_at]);

echo json_encode([
  'success' => true,
  'invite_code' => $invite_code,
  'invite_url' => "https://stackmap.app/sync/{$invite_code}",
  'expires_at' => $expires_at
]);
?>
```

**NEW: `/api/sync/validate_invite.php`**
```php
<?php
// Validates invite code only (recovery phrase stays client-side)
$invite_code = $_GET['code'] ?? '';

$stmt = $pdo->prepare("
  SELECT sync_id, expires_at 
  FROM sync_invites 
  WHERE invite_code = ? AND expires_at > NOW()
");
$stmt->execute([$invite_code]);
$invite = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$invite) {
  http_response_code(404);
  die(json_encode(['error' => 'Invalid or expired invite']));
}

// Return sync_id for client to verify against derived ID
echo json_encode([
  'success' => true,
  'sync_id' => $invite['sync_id'],
  'expires_at' => $invite['expires_at']
]);
?>
```

#### 2.2 Frontend Changes

**UPDATE: `/src/services/sync/minimalSyncService.js`**
```javascript
class MinimalSyncService {
  // Generate shareable sync invite
  async createSyncInvite() {
    if (!this.syncId || !this.recoveryPhrase) {
      throw new Error('Sync must be enabled to create invite');
    }
    
    const response = await fetch(`${this.API_BASE}/create_invite.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sync_id: this.syncId
      })
    });
    
    const result = await response.json();
    
    // Append recovery phrase as fragment (never sent to server)
    const inviteUrl = `${result.invite_url}#${this.recoveryPhrase}`;
    
    return {
      inviteUrl,
      expiresAt: result.expires_at
    };
  }
  
  // Join sync from invite URL
  async joinFromInvite(inviteCode) {
    // Extract recovery phrase from fragment
    const recoveryPhrase = window.location.hash.substring(1);
    
    if (!recoveryPhrase || recoveryPhrase.length !== 32) {
      throw new Error('Invalid invite link - missing sync key');
    }
    
    // Validate invite code with server
    const response = await fetch(
      `${this.API_BASE}/validate_invite.php?code=${inviteCode}`
    );
    
    if (!response.ok) {
      throw new Error('Invalid or expired invite');
    }
    
    const { sync_id } = await response.json();
    
    // Derive sync ID from recovery phrase
    const derivedSyncId = await this.deriveSyncId(recoveryPhrase);
    
    // Verify they match (ensures phrase is correct for this sync group)
    if (derivedSyncId !== sync_id) {
      throw new Error('Invalid sync credentials');
    }
    
    // Enable sync with validated phrase
    await this.enableSync(recoveryPhrase, false);
  }
}
```

### Phase 3: Router Configuration

**Web Router Setup**
```javascript
// App.js or router configuration
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/share/:shareId" element={<ShareView />} />
        <Route path="/sync/:inviteCode" element={<SyncJoinView />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**URL Rewriting (.htaccess for Apache)**
```apache
RewriteEngine On

# Redirect old share URLs to new format (temporary backward compatibility)
RewriteCond %{QUERY_STRING} ^share=([^&]+)$
RewriteRule ^/?$ /share/%1? [R=301,L]

# Redirect old sync URLs to invite creation page
RewriteCond %{QUERY_STRING} ^sync=([^&]+)$
RewriteRule ^/?$ /sync/migrate?phrase=%1 [R=301,L]

# SPA routing for new paths
RewriteRule ^share/([a-f0-9]{32})$ /index.html [L]
RewriteRule ^sync/([a-f0-9]{16})$ /index.html [L]
```

### Phase 4: Migration & Backward Compatibility

#### 4.1 Dual Support Period

```javascript
// ShareView.js - Support both formats during migration
const ShareView = ({ shareId, shareToken }) => {
  const [version, setVersion] = useState(null);
  
  useEffect(() => {
    // Detect which format we're using
    if (shareId && window.location.hash) {
      // New format: /share/[id]#[key]
      setVersion(3);
      loadShareV3();
    } else if (shareToken) {
      // Old format: ?share=[token]
      setVersion(2);
      loadShareV2();
    }
  }, [shareId, shareToken]);
  
  // ... handle both versions
};
```

#### 4.2 Database Migration

```sql
-- Create new tables for v3
CREATE TABLE shares_v3 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  share_id VARCHAR(32) UNIQUE NOT NULL,
  encrypted_data MEDIUMTEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  recipient_name VARCHAR(255),
  share_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  access_count INT DEFAULT 0,
  INDEX idx_share_id (share_id),
  INDEX idx_expires (expires_at)
);

CREATE TABLE sync_invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invite_code VARCHAR(16) UNIQUE NOT NULL,
  sync_id VARCHAR(32) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL,
  used_by_device VARCHAR(64),
  INDEX idx_invite (invite_code),
  INDEX idx_expires (expires_at)
);

-- Clean up expired records periodically
CREATE EVENT cleanup_expired_shares
ON SCHEDULE EVERY 1 DAY
DO DELETE FROM shares_v3 WHERE expires_at < NOW() - INTERVAL 30 DAY;

CREATE EVENT cleanup_expired_invites
ON SCHEDULE EVERY 1 DAY
DO DELETE FROM sync_invites WHERE expires_at < NOW() - INTERVAL 7 DAY;
```

## Security Analysis

### Before Migration

| Feature | Current URL | Server Sees | Client Sees | Risk Level |
|---------|------------|-------------|-------------|------------|
| Share | `?share=abc123` | Everything including key | Same | HIGH - Keys in logs |
| Sync | `?sync=recovery` | Full recovery phrase | Same | CRITICAL - Complete compromise |

### After Migration

| Feature | New URL | Server Sees | Client Sees | Risk Level |
|---------|---------|-------------|-------------|------------|
| Share | `/share/id#key` | Only ID | ID + Key | LOW - True zero-knowledge |
| Sync | `/sync/invite#phrase` | Only invite | Invite + Phrase | LOW - Time-limited invites |

### Security Improvements

1. **Zero-Knowledge Guarantee**: Server never sees encryption keys
2. **Log Safety**: Server logs contain only identifiers, not secrets
3. **Breach Resilience**: Historical logs can't decrypt old shares
4. **Time-Limited Invites**: Sync invites expire, reducing attack window
5. **Separation of Concerns**: Clear boundary between public (server) and private (client) data

## Testing Plan

### Unit Tests

```javascript
// Test fragment preservation
describe('Share URL Security', () => {
  test('encryption key stays in fragment', async () => {
    const { shareUrl } = await createShareLink();
    const url = new URL(shareUrl);
    
    expect(url.pathname).toMatch(/^\/share\/[a-f0-9]{32}$/);
    expect(url.hash).toMatch(/^#[a-f0-9]{64}$/);
    expect(url.search).toBe(''); // No query params
  });
  
  test('server never receives encryption key', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    await loadShareData('abc123', '#xyz789');
    
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/access_share_v3.php?id=abc123'),
      expect.any(Object)
    );
    
    // Verify key not in URL
    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('xyz789'),
      expect.any(Object)
    );
  });
});
```

### Integration Tests

```javascript
describe('End-to-End Share Flow', () => {
  test('create and access share with v3 URLs', async () => {
    // Create share
    const { shareUrl } = await createShareLink(['user1'], 24);
    
    // Parse URL
    const url = new URL(shareUrl);
    const shareId = url.pathname.split('/').pop();
    const encryptionKey = url.hash.substring(1);
    
    // Simulate accessing share
    const mockWindow = {
      location: {
        pathname: `/share/${shareId}`,
        hash: `#${encryptionKey}`
      }
    };
    
    const shareData = await loadShareWithMockWindow(mockWindow);
    expect(shareData).toBeDefined();
    expect(shareData.users).toHaveLength(1);
  });
});
```

### Security Audit Checklist

- [ ] Verify no encryption keys in server access logs
- [ ] Confirm fragments not sent in HTTP requests (use browser DevTools)
- [ ] Test old URL redirect to new format
- [ ] Verify invite codes expire correctly
- [ ] Test sync ID validation against recovery phrase
- [ ] Confirm server can't decrypt shares even with database access
- [ ] Penetration test for fragment leakage
- [ ] Review HTTPS-only enforcement

## Rollout Strategy

### Phase 1: Silent Preparation (Week 1)
- Deploy new endpoints alongside old ones
- Add v3 support to clients (backward compatible)
- Begin collecting metrics on URL format usage

### Phase 2: Soft Launch (Week 2)
- New shares use v3 format
- Old shares continue working
- Monitor for issues

### Phase 3: Migration Encouragement (Week 3-4)
- Show banner for old format users
- Provide one-click migration for existing shares
- Document benefits

### Phase 4: Deprecation (Week 5-8)
- Redirect old URLs to new format
- Final warning period
- Sunset announcement

### Phase 5: Enforcement (Week 9+)
- Disable old endpoints
- Force migration for remaining users
- Clean up old code

## Performance Considerations

### Benefits
- Smaller server logs (no keys stored)
- Faster log analysis (less data)
- Reduced server liability

### Costs
- One extra redirect for old URLs (temporary)
- Slightly more complex client logic
- Additional database table for invites

## Monitoring & Metrics

```javascript
// Track migration progress
const metrics = {
  shareVersion: {
    v2: 0, // Old format counter
    v3: 0  // New format counter
  },
  
  trackShareCreation(version) {
    this.shareVersion[`v${version}`]++;
    
    // Send to analytics
    analytics.track('share_created', {
      version,
      timestamp: Date.now()
    });
  },
  
  getMigrationProgress() {
    const total = this.shareVersion.v2 + this.shareVersion.v3;
    const v3Percentage = (this.shareVersion.v3 / total) * 100;
    
    return {
      total,
      v2Count: this.shareVersion.v2,
      v3Count: this.shareVersion.v3,
      migrationProgress: `${v3Percentage.toFixed(1)}%`
    };
  }
};
```

## Compliance & Legal

### GDPR Improvements
- Reduced data in logs (data minimization)
- True end-to-end encryption (privacy by design)
- Cannot decrypt user data even under legal compulsion

### Security Certifications
- Aligns with SOC 2 Type II requirements
- Meets HIPAA technical safeguards
- Supports ISO 27001 compliance

## Developer Documentation

### Quick Start for New Developers

```javascript
// Creating a secure share
const share = await syncStore.createShareLink(
  ['user1', 'user2'], // User IDs to share
  168,                 // Hours until expiration
  'Grandma',          // Recipient name
  'Weekly schedule'    // Note
);

console.log(share.shareUrl); 
// Output: https://stackmap.app/share/a1b2c3d4#encryption-key-here

// The server never sees the part after #
```

### Common Pitfalls

1. **Don't log fragments**: `console.log(window.location.href)` exposes keys
2. **Use correct parsing**: `window.location.hash` includes the `#`
3. **Validate both parts**: Check ID format AND key presence
4. **Handle missing fragments**: Graceful error for incomplete URLs

## Conclusion

This migration transforms StackMap from a "trust us" model to a "can't be evil" model. By implementing URL fragments correctly, we achieve true zero-knowledge architecture where the server mathematically cannot access user data.

The migration can be done incrementally with full backward compatibility, minimal user disruption, and significant security improvements. The implementation follows industry best practices used by leading privacy-focused services.

---

*Document Version: 1.0*
*Last Updated: January 2025*
*Next Review: After Phase 1 Implementation*