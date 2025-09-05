# StackMap API Reference - Quick Lookup

## Base URLs
```
Production: https://stackmap.app/api/sync/
Qual/Stage: https://stackmap.app/qual/api/sync/
```

## Sync Endpoints (Actual Implementation)

### POST /create_timestamp.php
Initialize new sync group.
```json
Request: {
  "sync_id": "32-char-hex",
  "encrypted_blob": "base64",
  "timestamp": 1704830400000,
  "device_id": "32-char-hex",
  "device_name": "iPhone 12"
}
Response: {
  "success": true,
  "sync_id": "32-char-hex",
  "timestamp": 1704830400000
}
```

### POST /push_timestamp.php  
Upload encrypted data with timestamp.
```json
Request: {
  "sync_id": "32-char-hex",
  "device_id": "32-char-hex",
  "encrypted_blob": "base64",
  "timestamp": 1704830400000
}
Response: {
  "success": true,
  "timestamp": 1704830400000
}
```

### GET /pull_timestamp.php
Retrieve encrypted data since timestamp.
```
GET /pull_timestamp.php?sync_id=xxx&device_id=yyy&since=1704830400000

Response: {
  "success": true,
  "encrypted_blob": "base64",
  "timestamp": 1704830400000,
  "has_data": true
}
```

### POST /join_timestamp.php
Join existing sync group.
```json
Request: {
  "sync_id": "32-char-hex",
  "device_id": "32-char-hex",
  "device_name": "iPad"
}
Response: {
  "success": true,
  "encrypted_blob": "base64",
  "timestamp": 1704830400000
}
```

## Share Endpoints

### POST /create_share.php
Create time-limited share.
```json
Request: {
  "encrypted_data": "base64",
  "expires_in_hours": 168,
  "recipient_name": "Grandma",
  "share_note": "Weekly schedule"
}
Response: {
  "success": true,
  "access_token": "url-safe-token",
  "share_id": "unique-share-id",
  "expires_at": "2025-01-20T10:00:00Z",
  "share_url": "https://stackmap.app?share=xxx"
}
```

### GET /access_share.php
Access shared data.
```
GET /access_share.php?token=xxx

Response: {
  "success": true,
  "encrypted_data": "base64",
  "created_at": "2025-01-13T10:00:00Z",
  "expires_at": "2025-01-20T10:00:00Z",
  "recipient_name": "Grandma",
  "share_note": "Weekly schedule",
  "version": 2
}
```

## Error Responses

All endpoints return consistent error format:
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `INVALID_SYNC_ID` - Sync ID format invalid
- `SYNC_NOT_FOUND` - Sync group doesn't exist
- `DECRYPTION_FAILED` - Can't decrypt data
- `EXPIRED_SHARE` - Share link expired
- `RATE_LIMITED` - Too many requests
- `SERVER_ERROR` - Internal server error

## Headers

### Required Headers
```
Content-Type: application/json
Accept: application/json
```

### Optional Headers
```
X-Device-ID: 32-char-hex
X-App-Version: 2025.01.13
X-Platform: ios|android|web
```

## Rate Limits
- Push: 60 requests/minute per sync_id
- Pull: 120 requests/minute per sync_id
- Share: 10 creates/hour per IP
- Global: 1000 requests/hour per IP

## Data Formats

### Sync ID
32 character hexadecimal string derived from recovery phrase using nacl.hash.
```
Example: a1b2c3d4e5f6789012345678901234567
```

### Recovery Phrase  
32 character hexadecimal string, user-facing.
```
Example: f47ac10b58cc4372a5670e02b2c3d479
```

### Device ID
32 character hexadecimal string, unique per device.
```
Example: d4e5f6789012345678901234567890ab
```

### Encrypted Blob
Base64 encoded: 24-byte nonce + encrypted data.
```
Structure: base64(nonce[24] + ciphertext[n])
```

### Timestamp
Unix timestamp in milliseconds.
```
Example: 1704830400000 (2025-01-13 10:00:00 UTC)
```

## Quick Integration Examples

### JavaScript/React Native (Actual Implementation)
```javascript
// Using minimalSyncService
import minimalSyncService from './services/sync/minimalSyncService';

// Enable sync
await minimalSyncService.enableSync(recoveryPhrase, true); // true = new sync

// Push data manually
await minimalSyncService.pushData(appData);

// Pull data manually
await minimalSyncService.pullData(true); // true = force full pull
```

### Direct API Call
```javascript
// Push data
const response = await fetch(`${API_BASE}/push_timestamp.php`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sync_id: derivedSyncId,
    encrypted_blob: encryptedData,
    timestamp: Date.now(),
    device_id: deviceId
  })
});
```

### PHP Backend
```php
// Receive and store
$input = json_decode(file_get_contents('php://input'), true);
$stmt = $pdo->prepare("
  INSERT INTO sync_data (sync_id, encrypted_blob, timestamp, device_id)
  VALUES (?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE 
    encrypted_blob = VALUES(encrypted_blob),
    timestamp = VALUES(timestamp)
");
$stmt->execute([
  $input['sync_id'],
  $input['encrypted_blob'],
  $input['timestamp'],
  $input['device_id']
]);
```

### cURL Testing
```bash
# Create sync group
curl -X POST https://stackmap.app/api/sync/create_timestamp.php \
  -H "Content-Type: application/json" \
  -d '{
    "sync_id": "a1b2c3d4e5f6789012345678901234567",
    "encrypted_blob": "base64data...",
    "timestamp": 1704830400000,
    "device_id": "device123",
    "device_name": "Test Device"
  }'

# Pull data  
curl "https://stackmap.app/api/sync/pull_timestamp.php?sync_id=a1b2c3&device_id=dev123&since=0"
```

## Implementation Notes

### Key Derivation (IMPORTANT)
The actual implementation uses **nacl.hash iterations**, NOT PBKDF2:
```javascript
// 100,000 iterations of nacl.hash
let key = encodeUTF8(phrase + salt);
for (let i = 0; i < 100000; i++) {
  key = nacl.hash(key);
}
return key.slice(0, 32);
```

### UTF-8 Encoding (iOS Fix)
Manual UTF-8 implementation is used because tweetnacl-util is broken on iOS:
```javascript
// Manual UTF-8 encoding for iOS compatibility
const bytes = [];
for (let i = 0; i < str.length; i++) {
  const char = str.charCodeAt(i);
  if (char < 0x80) bytes.push(char);
  // ... handle multi-byte
}
return new Uint8Array(bytes);
```

## Security Notes

1. **Always use HTTPS** - Never send data over HTTP
2. **Never log recovery phrases** - Only log sync_id
3. **Validate all inputs** - Check formats before processing
4. **Rate limit by sync_id** - Prevent abuse
5. **Expire old data** - 6-month retention policy
6. **Zero-knowledge** - Server never decrypts

---

*Quick reference for StackMap API - Actual Implementation*
*Full docs: [Sync System](./README.md) | [Share System](./share-system.md)*
*Note: This reflects actual endpoints, not idealized names*