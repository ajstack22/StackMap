# Sync API Reference

## Overview

This document provides a complete reference for the StackMap Sync API endpoints, including request/response formats, error codes, and implementation examples.

## Base URL

```
https://stackmap.app/api/sync
```

## Authentication

The API uses zero-knowledge authentication based on sync IDs and device IDs. No traditional authentication tokens or API keys are required.

## Endpoints

### 1. Create Sync Group

Creates a new sync group with initial encrypted data.

**Endpoint:** `POST /create.php`

**Request Body:**
```json
{
  "sync_id": "string (32 hex characters)",
  "encrypted_blob": "string (base64 encoded)",
  "recovery_salt": "string (base64 encoded)",
  "device_id": "string (32 hex characters)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sync group created successfully",
  "version": 1,
  "sync_id": "string"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid input format
- `409 Conflict` - Sync group already exists
- `413 Payload Too Large` - Encrypted blob exceeds size limit

**Example:**
```javascript
const response = await fetch('https://stackmap.app/api/sync/create.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sync_id: generateSyncId(recoveryPhrase),
    encrypted_blob: encryptData(initialState),
    recovery_salt: salt,
    device_id: getDeviceId()
  })
});
```

### 2. Push Data

Updates sync data with a new encrypted blob.

**Endpoint:** `POST /push.php`

**Request Body:**
```json
{
  "sync_id": "string",
  "device_id": "string",
  "device_name": "string (optional)",
  "encrypted_blob": "string (base64)",
  "sync_type": "full|incremental"
}
```

**Response:**
```json
{
  "success": true,
  "version": 2,
  "last_modified": "2024-01-20T12:34:56Z",
  "message": "Data synchronized successfully"
}
```

**Error Responses:**
- `404 Not Found` - Sync group doesn't exist
- `409 Conflict` - Version conflict detected
- `429 Too Many Requests` - Rate limit exceeded

### 3. Pull Data

Retrieves the latest encrypted data for a sync group.

**Endpoint:** `GET /pull.php`

**Query Parameters:**
- `sync_id` (required) - The sync group identifier
- `device_id` (required) - The requesting device ID
- `version` (optional) - Request specific version

**Response:**
```json
{
  "success": true,
  "encrypted_blob": "string (base64)",
  "version": 2,
  "last_modified": "2024-01-20T12:34:56Z",
  "device_id": "string",
  "device_name": "string"
}
```

**Error Responses:**
- `404 Not Found` - Sync group doesn't exist
- `304 Not Modified` - No newer version available

**Example:**
```javascript
const response = await fetch(
  `https://stackmap.app/api/sync/pull.php?sync_id=${syncId}&device_id=${deviceId}`
);
```

### 4. Delete Sync Data

Permanently deletes all data for a sync group.

**Endpoint:** `POST /delete.php`

**Request Body:**
```json
{
  "sync_id": "string",
  "device_id": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sync data deleted successfully",
  "deleted_count": 1
}
```

**Error Responses:**
- `404 Not Found` - Sync group doesn't exist
- `403 Forbidden` - Device not authorized

### 5. Health Check

Checks API availability and server status.

**Endpoint:** `GET /health.php`

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-20T12:34:56Z"
}
```

## Data Formats

### Encrypted Blob Structure

The encrypted blob is a base64-encoded string containing:
```
[24 bytes nonce][remaining bytes encrypted data]
```

When decrypted, the data structure is:
```json
{
  "version": 3,
  "syncType": "full|incremental",
  "syncTimestamp": 1705761296000,
  "deviceInfo": {
    "id": "device_id",
    "name": "Device Name"
  },
  "currentDay": "today",
  "users": {},
  "templates": [],
  "completedActivities": [],
  "globalSettings": {},
  "hasCompletedOnboarding": true
}
```

### Incremental Sync Format

For incremental syncs, the decrypted data includes a patch:
```json
{
  "type": "incremental",
  "baseVersion": 1,
  "patch": {
    "users": { /* only changed users */ },
    "templates": [ /* only changed templates */ ]
  },
  "syncTimestamp": 1705761296000
}
```

## Error Handling

### Standard Error Response

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional information
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_SYNC_ID` | 400 | Sync ID format is invalid |
| `INVALID_DEVICE_ID` | 400 | Device ID format is invalid |
| `INVALID_BLOB` | 400 | Encrypted blob format is invalid |
| `SYNC_NOT_FOUND` | 404 | Sync group doesn't exist |
| `VERSION_CONFLICT` | 409 | Concurrent modification detected |
| `RATE_LIMIT` | 429 | Too many requests |
| `PAYLOAD_TOO_LARGE` | 413 | Encrypted blob exceeds 5MB |
| `SERVER_ERROR` | 500 | Internal server error |

## Rate Limiting

- **Limit:** 30 requests per minute per IP
- **Window:** 60 seconds sliding window
- **Headers:** Rate limit info in response headers
  - `X-RateLimit-Limit: 30`
  - `X-RateLimit-Remaining: 25`
  - `X-RateLimit-Reset: 1705761356`

## Security Headers

All responses include:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## CORS Policy

Allowed origins:
- `https://stackmap.app`
- `https://www.stackmap.app`
- `http://localhost:*` (development only)

## Implementation Examples

### Complete Sync Flow

```javascript
class SyncClient {
  constructor(apiBase) {
    this.apiBase = apiBase;
  }

  async createSync(recoveryPhrase, initialData) {
    // Generate sync ID from recovery phrase
    const syncId = await this.generateSyncId(recoveryPhrase);
    
    // Derive encryption key
    const { key, salt } = await this.deriveKey(recoveryPhrase);
    
    // Encrypt initial data
    const encrypted = this.encrypt(initialData, key);
    
    // Create sync group
    const response = await fetch(`${this.apiBase}/create.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sync_id: syncId,
        encrypted_blob: encrypted,
        recovery_salt: salt,
        device_id: this.getDeviceId()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Sync creation failed: ${response.status}`);
    }
    
    return response.json();
  }

  async sync(syncId, key) {
    // Pull latest data
    const remoteData = await this.pull(syncId);
    
    if (!remoteData) {
      // First sync
      return this.push(syncId, this.getLocalData(), key);
    }
    
    // Decrypt remote data
    const decrypted = this.decrypt(remoteData.encrypted_blob, key);
    
    // Merge with local
    const merged = this.mergeData(this.getLocalData(), decrypted);
    
    // Push merged data
    return this.push(syncId, merged, key);
  }

  async pull(syncId) {
    const response = await fetch(
      `${this.apiBase}/pull.php?sync_id=${syncId}&device_id=${this.getDeviceId()}`
    );
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Pull failed: ${response.status}`);
    }
    
    return response.json();
  }

  async push(syncId, data, key) {
    const encrypted = this.encrypt(data, key);
    
    const response = await fetch(`${this.apiBase}/push.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sync_id: syncId,
        device_id: this.getDeviceId(),
        device_name: this.getDeviceName(),
        encrypted_blob: encrypted,
        sync_type: 'full'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Push failed: ${response.status}`);
    }
    
    return response.json();
  }
}
```

### Error Handling

```javascript
async function syncWithRetry(syncClient, syncId, key, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await syncClient.sync(syncId, key);
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors
      if (error.message.includes('4')) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

## Versioning

The API uses URL versioning. The current version is v1, implicit in the base URL. Future versions will be explicitly versioned (e.g., `/api/sync/v2/`).

## Deprecation Policy

- Deprecated endpoints will return a `Deprecation` header
- Minimum 6-month notice before endpoint removal
- Migration guides provided for breaking changes

## Support

For API issues or questions:
- GitHub Issues: [StackMap Repository]
- Email: support@stackmap.app
- Status Page: status.stackmap.app