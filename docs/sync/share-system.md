# StackMap Share System - Technical Documentation

## Overview

The Share system enables users to create **secure, time-limited, read-only snapshots** of their data that can be shared via URL. This is separate from the Sync system and designed for one-way sharing (e.g., parents sharing schedules with caregivers).

## Key Differences: Share vs Sync vs Export

| Feature | Share | Sync | Export |
|---------|--------|------|---------|
| Purpose | Read-only viewing | Real-time collaboration | Backup/migration |
| Direction | One-way (view only) | Bidirectional | One-way (download) |
| Persistence | Time-limited (24h-30d) | Permanent | File-based |
| Updates | Snapshot at creation | Live updates | Static snapshot |
| Access | URL with token | Recovery phrase | File download |
| Encryption | Client-side optional | Always encrypted | Plaintext JSON |

## Architecture

### System Flow
```
User Creates Share
├── Select users to share
├── Set expiration (24h to 30 days)
├── Add optional note & recipient
├── Generate share data snapshot
├── Encrypt client-side (v2)
└── Get shareable URL

Recipient Accesses Share
├── Open URL with token
├── Fetch encrypted data from server
├── Decrypt client-side (v2)
├── Display read-only view
└── No edit capabilities
```

### Technical Components

#### Frontend (ShareTab.js)
```javascript
// Share creation flow
1. Gather selected users' data
2. Create snapshot with metadata
3. Encrypt using nacl.secretbox
4. POST to /api/sync/create_share.php
5. Receive share token
6. Generate URL: stackmap.app/share/[token]
```

#### Backend (create_share.php, access_share.php)
```php
// Zero-knowledge storage
- Stores encrypted blob only
- Associates with token (URL-safe base64)
- Enforces expiration timestamps
- No decryption capability on server
```

#### Viewer (ShareView.js)
```javascript
// Read-only display
1. Extract token from URL
2. Fetch encrypted data
3. Decrypt client-side
4. Render responsive, themed view
5. No edit capabilities
```

## Implementation Details

### 1. Creating a Share

```javascript
// ShareTab component - share creation
const createShare = async () => {
  // Gather data snapshot
  const shareData = {
    version: 2,
    created_at: new Date().toISOString(),
    users: selectedUsers.map(user => ({
      ...user,
      activities: getUserActivities(user.id)
    })),
    metadata: {
      creator: currentUser.name,
      note: shareNote,
      recipient: recipientName
    }
  };
  
  // Generate encryption key
  const shareKey = nacl.randomBytes(32);
  
  // Encrypt data
  const nonce = nacl.randomBytes(24);
  const encrypted = nacl.secretbox(
    util.decodeUTF8(JSON.stringify(shareData)),
    nonce,
    shareKey
  );
  
  // Combine nonce + ciphertext
  const encryptedBlob = util.encodeBase64(
    new Uint8Array([...nonce, ...encrypted])
  );
  
  // Create share on server
  const response = await fetch('/api/sync/create_share.php', {
    method: 'POST',
    body: JSON.stringify({
      encrypted_data: encryptedBlob,
      expires_in_hours: expirationHours,
      recipient_name: recipientName,
      share_note: shareNote
    })
  });
  
  const { token } = await response.json();
  
  // Server returns the complete share URL
  // Format: https://stackmap.app?share=[token]
  return response.share_url;
};
```

### 2. Share URL Structure

```
https://stackmap.app?share=[token]

- token: Combined server identifier + encryption key (URL-safe base64)
- Query parameter format for compatibility
- Token contains all necessary data for decryption
```

### 3. Accessing a Share

```javascript
// ShareView component - viewing shared data
const loadShareData = async () => {
  // ShareView receives shareToken as a prop
  // The token contains both identifier and encryption key
  
  // Fetch encrypted data
  const response = await fetch(`/api/sync/access_share.php?token=${shareToken}`);
  const { encrypted_data, version } = await response.json();
  
  if (version === 2) {
    // Decrypt using key derived from token
    const paddedToken = shareToken.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (paddedToken.length % 4)) % 4;
    const fullToken = paddedToken + '='.repeat(padding);
    const shareKey = util.decodeBase64(fullToken);
    
    // Decrypt client-side
    const combined = util.decodeBase64(encrypted_data);
    const nonce = combined.slice(0, 24);
    const ciphertext = combined.slice(24);
    
    const decrypted = nacl.secretbox.open(ciphertext, nonce, shareKey);
    const shareData = JSON.parse(util.encodeUTF8(decrypted));
    
    // Display read-only view
    renderShareView(shareData);
  }
};
```

### 4. Share View Features

```javascript
// Read-only calendar view with:
- User selector (if multiple users shared)
- Day navigation (Today, Tomorrow, etc.)
- Activity cards with times and icons
- Completion status (view only)
- Responsive layout
- Theme support (inherits from share creator)
- No edit capabilities
- Auto-refresh prevention
- Expiration notice
```

## Security Model

### Encryption (v2 Shares)
- **Client-side only**: Server never sees plaintext
- **nacl.secretbox**: Symmetric encryption (XSalsa20-Poly1305)
- **Token-embedded key**: Encryption key derived from the share token
- **No key reuse**: Each share has unique key

### Access Control
- **Time-limited**: 24 hours to 30 days
- **Read-only**: No modification capability
- **Token-based**: Unguessable URL tokens
- **No authentication**: Anyone with URL can view

### Privacy Considerations
```javascript
// What's shared
✓ Selected users' names and icons
✓ Activities for those users
✓ Completion status at share time
✓ Optional note from sharer

// What's NOT shared
✗ Other users' data
✗ Sync recovery phrases
✗ Account settings
✗ Historical data
✗ Future changes after share creation
```

## Database Schema

```sql
CREATE TABLE shares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  encrypted_data MEDIUMTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  access_count INT DEFAULT 0,
  recipient_name VARCHAR(100),
  share_note TEXT,
  creator_metadata JSON,
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
);

-- Cleanup expired shares
DELETE FROM shares WHERE expires_at < NOW();
```

## User Experience Flow

### Creating a Share (Parent/Creator)
1. Navigate to Settings → Share tab
2. Select which family members to share
3. Choose expiration (24h, 7d, 30d)
4. Optionally add recipient name and note
5. Tap "Create Share Link"
6. Copy URL to share via text/email

### Viewing a Share (Grandparent/Recipient)
1. Receive URL from family member
2. Open in any web browser
3. View read-only schedule
4. Navigate between days
5. See completion status (snapshot)
6. No app installation required

## Platform Considerations

### Web
- Full share creation and viewing
- Copy-to-clipboard for URLs
- Responsive design for all screens

### Mobile (iOS/Android)
- Share creation via native Share Sheet
- Opens share URLs in browser
- No in-app share viewing (uses web)

## Common Use Cases

### 1. Grandparent Access
```javascript
// Parent creates weekly share
- Selects all children
- Sets 7-day expiration
- Adds note: "This week's schedule"
- Shares URL via text
```

### 2. Babysitter Instructions
```javascript
// Parent creates daily share
- Selects specific child
- Sets 24-hour expiration  
- Adds note: "Today's routine - call if questions!"
- Shares via messaging app
```

### 3. Co-Parent Coordination
```javascript
// One parent shares with other
- Selects all family members
- Sets 30-day expiration
- Regular sync preferred for real-time
- Share used for read-only reference
```

## Limitations & Considerations

### What Share is NOT
- Not real-time (snapshot only)
- Not bidirectional (read-only)
- Not permanent (time-limited)
- Not for backup (use Export)
- Not for collaboration (use Sync)

### Performance
- Snapshots limited to reasonable data size
- Client-side decryption may be slow on old devices
- No caching (fresh fetch each load)

### Future Enhancements
```javascript
// Potential improvements
- Selective activity sharing (filter by time/type)
- Share templates (recurring shares)
- Access analytics for creator
- Password protection option
- Share revocation capability
- QR code generation
- Email delivery integration
```

## Troubleshooting

### "Share link not working"
1. Check expiration hasn't passed
2. Verify complete URL copied (including #fragment)
3. Try different browser
4. Check server logs for token

### "Can't create share"
1. Verify user has data to share
2. Check network connection
3. Ensure proper permissions
4. Try shorter expiration period

### "Shared data looks wrong"
1. Remember it's a snapshot (not live)
2. Verify correct users selected
3. Check share creation timestamp
4. Consider creating new share

## API Reference

### POST /api/sync/create_share.php
```json
// Request
{
  "encrypted_data": "base64string",
  "expires_in_hours": 168,
  "recipient_name": "Grandma",
  "share_note": "This week's schedule"
}

// Response
{
  "success": true,
  "token": "url-safe-token",
  "expires_at": "2025-01-20T10:00:00Z",
  "share_url": "https://stackmap.app/share/[token]"
}
```

### GET /api/sync/access_share.php
```json
// Request
GET /api/sync/access_share.php?token=abc123

// Response
{
  "success": true,
  "encrypted_data": "base64string",
  "created_at": "2025-01-13T10:00:00Z",
  "expires_at": "2025-01-20T10:00:00Z",
  "recipient_name": "Grandma",
  "share_note": "This week's schedule"
}
```

## Summary for LLM Developers

The Share system provides a **privacy-focused, time-limited, read-only sharing mechanism** that complements the real-time Sync system. Key insights for implementing similar systems:

1. **Separation of Concerns**: Share ≠ Sync ≠ Export
2. **Zero-Knowledge**: End-to-end encryption with key in URL fragment
3. **Simplicity**: No accounts, no authentication, just URLs
4. **Time-Limited**: Automatic expiration reduces risk
5. **Read-Only**: Prevents accidental modifications
6. **Snapshot Based**: Simpler than real-time sync
7. **URL Design**: Token identifies, fragment holds key

This pattern works well for any app needing to share read-only data without requiring recipients to install apps or create accounts.

---

*Last Updated: January 2025*
*Related: [Sync System](./README.md) | [Import/Export](../features/import-export-system.md)*