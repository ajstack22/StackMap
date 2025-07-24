# Manyla API Documentation

## Overview

Manyla uses a zero-trust architecture with client-side encryption and token-based sharing. The API provides endpoints for secure synchronization and temporary share links.

## Base URL

Production: `https://stackmap.app/manyla/api`
Development: `http://localhost/manyla/api`

## Authentication

Manyla uses a zero-trust model with no traditional user accounts:
- **Sync**: Uses recovery phrases that generate deterministic sync IDs
- **Sharing**: Uses temporary access tokens passed via URL parameters

## Share Endpoints

### Create Share Link

Creates a temporary share link with an access token.

**Endpoint:** `POST /share/create.php`

**Request Body:**
```json
{
  "profile_data": {
    "id": "string",
    "name": "string",
    "dateOfBirth": "ISO 8601 date",
    "preferredName": "string",
    "pronouns": "string",
    "photo": "base64 string (optional)",
    "entries": [...],
    "quickInfoPanels": [...],
    "categories": [...]
  },
  "access_token": "string (6-8 chars)",
  "expires_at": "ISO 8601 datetime",
  "recipient_name": "string (optional)",
  "share_note": "string (optional)",
  "selected_categories": ["string"],
  "include_quick_info": boolean
}
```

**Response:**
```json
{
  "success": true,
  "share_id": "uuid",
  "access_token": "string",
  "expires_at": "ISO 8601 datetime",
  "share_url": "https://stackmap.app/manyla?share=ACCESS_TOKEN"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Access Shared Profile

Retrieves shared profile data using an access token.

**Endpoint:** `GET /share/access.php?token=ACCESS_TOKEN`

**Query Parameters:**
- `token` (required): The access token from the share URL

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "string",
    "name": "string",
    "dateOfBirth": "ISO 8601 date",
    "preferredName": "string",
    "pronouns": "string",
    "photo": "base64 string",
    "entries": [...],
    "quickInfoPanels": [...],
    "categories": [...]
  },
  "recipient_name": "string",
  "share_note": "string",
  "expires_at": "ISO 8601 datetime"
}
```

**Error Responses:**
- `400 Bad Request`: Missing token parameter
- `404 Not Found`: Invalid or expired token
- `500 Internal Server Error`: Database error

## Sync Endpoints

### Create Sync Group

Creates a new sync group with encrypted data.

**Endpoint:** `POST /sync/create.php`

**Request Body:**
```json
{
  "sync_id": "string (from recovery phrase)",
  "encrypted_blob": "base64 encrypted data",
  "recovery_salt": "string",
  "device_id": "string"
}
```

**Response:**
```json
{
  "success": true,
  "sync_id": "string",
  "created_at": "ISO 8601 datetime"
}
```

### Pull Sync Data

Retrieves the latest encrypted data for a sync group.

**Endpoint:** `GET /sync/pull.php?sync_id=SYNC_ID`

**Query Parameters:**
- `sync_id` (required): The sync ID derived from recovery phrase

**Response:**
```json
{
  "success": true,
  "encrypted_blob": "base64 encrypted data",
  "last_modified": "ISO 8601 datetime",
  "version": integer
}
```

### Push Sync Data

Updates encrypted data for a sync group.

**Endpoint:** `POST /sync/push.php`

**Request Body:**
```json
{
  "sync_id": "string",
  "encrypted_blob": "base64 encrypted data",
  "device_id": "string",
  "version": integer
}
```

**Response:**
```json
{
  "success": true,
  "version": integer,
  "updated_at": "ISO 8601 datetime"
}
```

## Data Structures

### Profile Entry
```json
{
  "id": "string",
  "category": "string",
  "title": "string",
  "description": "string",
  "date": "ISO 8601 date",
  "visibility": "all|family|education|medical"
}
```

### Quick Info Panel
```json
{
  "id": "string",
  "displayName": "string",
  "value": "string",
  "isVisible": boolean,
  "order": integer
}
```

### Category Configuration
```json
{
  "id": "string",
  "name": "string",
  "displayName": "string",
  "color": "string (hex)",
  "isVisible": boolean,
  "order": integer,
  "isCustom": boolean
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE" // Optional error code
}
```

Common error codes:
- `INVALID_TOKEN`: Share token is invalid or expired
- `SYNC_CONFLICT`: Version conflict during sync
- `ENCRYPTION_ERROR`: Failed to encrypt/decrypt data
- `DATABASE_ERROR`: Database operation failed
- `VALIDATION_ERROR`: Invalid request data

## Security Considerations

1. **Encryption**: All profile data is encrypted client-side before transmission
2. **Token Generation**: Access tokens should be cryptographically random
3. **Expiration**: Share links expire after the specified duration
4. **No User Tracking**: No user accounts or persistent identifiers
5. **CORS**: Configured to allow only trusted origins
6. **Rate Limiting**: Implemented on all endpoints (10 requests/minute)

## Rate Limiting

All endpoints are rate-limited to prevent abuse:
- **Default**: 10 requests per minute per IP
- **Share Creation**: 5 requests per minute per IP
- **Sync Operations**: 20 requests per minute per sync ID

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## CORS Configuration

The API supports CORS with the following headers:
```
Access-Control-Allow-Origin: https://stackmap.app
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 3600
```

For development, update `cors.php` to include `http://localhost:3000`.