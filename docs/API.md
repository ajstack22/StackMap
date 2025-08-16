# StackMap Sync API Documentation

## Overview

The StackMap Sync API provides zero-knowledge encrypted synchronization between devices. The server stores encrypted blobs without access to the actual data content.

## Base URLs

- **Production**: `https://stackmap.app/api/sync`
- **Qual**: `https://stackmap.app/qual/api/sync`
- **Local Development**: `http://localhost:3000/api/sync`

## Authentication

The API uses a combination of:
- **sync_id**: Derived from recovery phrase (identifies sync group)
- **device_id**: Unique device identifier
- **recovery_phrase**: 32-character hexadecimal string (client-side only)

## Endpoints

### Create Sync Group

**POST** `/create.php`

Creates a new sync group with initial encrypted data.

```json
{
  "sync_id": "16-byte-hex-string",
  "encrypted_blob": "base64-encrypted-data",
  "recovery_salt": "base64-salt",
  "device_id": "device-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "sync_id": "16-byte-hex-string",
  "version": 1
}
```

### Push Data

**POST** `/push.php`

Updates sync group with new encrypted data.

```json
{
  "sync_id": "16-byte-hex-string",
  "device_id": "device-uuid",
  "device_name": "My iPhone",
  "encrypted_blob": "base64-encrypted-data",
  "sync_type": "full" | "incremental"
}
```

**Response:**
```json
{
  "success": true,
  "version": 2,
  "lastModified": "2024-01-01T12:00:00Z"
}
```

### Pull Data

**GET** `/pull.php?sync_id={sync_id}&device_id={device_id}`

Retrieves latest encrypted data from sync group.

**Response:**
```json
{
  "sync_id": "16-byte-hex-string",
  "encrypted_blob": "base64-encrypted-data",
  "version": 3,
  "last_modified": "2024-01-01T12:00:00Z",
  "device_count": 2
}
```

### Delete Sync

**POST** `/delete.php`

Permanently deletes all sync data.

```json
{
  "sync_id": "16-byte-hex-string",
  "device_id": "device-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sync data deleted"
}
```

### Health Check

**GET** `/health.php`

Checks API availability.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Share API

### Create Share

**POST** `/create_share.php`

Creates a temporary share link for providers.

```json
{
  "sync_id": "16-byte-hex-string",
  "user_id": "user_123",
  "encrypted_data": "base64-encrypted-data",
  "access_token": "share-token",
  "expires_hours": 24,
  "recipient_name": "Dr. Smith",
  "share_note": "Weekly activities",
  "include_completed": true,
  "include_tomorrow": true,
  "auto_update": false,
  "device_name": "My iPhone",
  "share_version": 2
}
```

**Response:**
```json
{
  "success": true,
  "share_id": "share_123",
  "access_token": "share-token",
  "expires_at": "2024-01-02T12:00:00Z",
  "share_url": "https://stackmap.app?share=share-token"
}
```

### Update Share

**POST** `/update_share.php`

Updates existing share with fresh data.

```json
{
  "access_token": "share-token",
  "encrypted_data": "base64-encrypted-data"
}
```

### Delete Share

**POST** `/delete_share.php`

Removes a share link.

```json
{
  "share_id": "share_123"
}
```

## Encryption Details

### Client-Side Encryption

1. **Key Derivation**: PBKDF2 with 10,000 iterations
2. **Encryption**: NaCl secretbox (XSalsa20-Poly1305)
3. **Encoding**: Base64 for transport

### Data Format

Encrypted blob contains:
```javascript
{
  version: 3,
  users: { /* user data */ },
  globalSettings: { /* settings */ },
  templates: { /* activity templates */ },
  lastModified: 1234567890
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid sync_id format"
}
```

### 404 Not Found
```json
{
  "error": "Sync group not found"
}
```

### 409 Conflict
```json
{
  "error": "Version conflict",
  "current_version": 5,
  "your_version": 3
}
```

### 500 Server Error
```json
{
  "error": "Database error"
}
```

## Rate Limiting

- **Sync operations**: 60 requests per minute per sync_id
- **Share creation**: 10 shares per hour per sync_id
- **Health checks**: Unlimited

## Data Retention

- **Sync data**: Retained indefinitely until deleted
- **Share links**: Auto-expire after configured time
- **Logs**: 30-day retention for debugging

## Security Considerations

1. **Zero-Knowledge**: Server never sees decrypted data
2. **HTTPS Only**: All API calls must use HTTPS
3. **Recovery Phrase**: Never sent to server
4. **Encryption**: Happens client-side before transmission
5. **No Telemetry**: No tracking or analytics

## Best Practices

### Client Implementation

1. **Retry Logic**: Implement exponential backoff
2. **Conflict Resolution**: Handle version conflicts gracefully
3. **Queue Operations**: Queue syncs when offline
4. **Validate Data**: Check data integrity after decryption
5. **Cache Management**: Store encrypted data locally

### Sync Strategy

1. **Pull before Push**: Always pull latest before pushing
2. **Incremental Updates**: Use when changes are small
3. **Full Sync**: Use after conflicts or long offline periods
4. **Debounce**: Avoid rapid successive syncs

## Testing

### Test Endpoints

Use the qual environment for testing:
- Base URL: `https://stackmap.app/qual/api/sync`
- Same endpoints and parameters
- Separate database from production

### Example Recovery Phrase
```
a1b2c3d4e5f6789012345678901234567890123456789012345678901234567
```

### cURL Examples

**Create Sync:**
```bash
curl -X POST https://stackmap.app/api/sync/create.php \
  -H "Content-Type: application/json" \
  -d '{"sync_id":"abc123","encrypted_blob":"..."}'
```

**Pull Data:**
```bash
curl "https://stackmap.app/api/sync/pull.php?sync_id=abc123&device_id=device1"
```

## Troubleshooting

### Common Issues

1. **404 on Pull**: Sync group doesn't exist or was deleted
2. **Version Conflict**: Pull latest before pushing
3. **Decryption Failed**: Wrong recovery phrase
4. **Network Error**: Check internet connection
5. **Rate Limited**: Too many requests, implement backoff