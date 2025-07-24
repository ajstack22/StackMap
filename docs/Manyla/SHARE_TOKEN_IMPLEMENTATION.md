# Manyla Share Token Implementation Guide

## Overview

Manyla implements token-based sharing through URL parameters (`?share=TOKEN`) to enable temporary, secure access to filtered profile information. This guide details the complete implementation from frontend to backend.

## Architecture

### Share Flow
1. User selects what to share and generates a token
2. Frontend sends profile data to backend API
3. Backend stores encrypted data with token
4. Share URL generated: `https://stackmap.app/manyla?share=TOKEN`
5. Recipient opens URL, token auto-authenticates
6. Backend validates token and returns filtered data
7. Frontend displays read-only shared view

## Frontend Implementation

### 1. Share Dialog Component (`ShareDialog.tsx`)

The dialog handles share creation and token generation:

```typescript
const handleGenerateLink = () => {
  // Generate random 6-8 character token
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  setAccessCode(code);
  
  // Store in localStorage for local testing
  const existingShares = localStorage.getItem('manyla_shares');
  const shares = existingShares ? JSON.parse(existingShares) : {};
  
  // Filter profile based on selections
  const sharedProfile = {
    ...profile,
    entries: profile.entries.filter(entry => 
      selectedCategories.includes(entry.category)
    ),
    quickInfoPanels: includeQuickInfo 
      ? profile.quickInfoPanels.filter(panel => panel.isVisible)
      : []
  };
  
  shares[code] = {
    profile: sharedProfile,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000),
    recipientName,
    note: shareNote
  };
  
  localStorage.setItem('manyla_shares', JSON.stringify(shares));
  
  // With backend: POST to API
  if (process.env.REACT_APP_API_URL) {
    await createShareLink({
      profile_data: sharedProfile,
      access_token: code,
      expires_at: shares[code].expiresAt,
      recipient_name: recipientName,
      share_note: shareNote,
      selected_categories: selectedCategories,
      include_quick_info: includeQuickInfo
    });
  }
  
  const shareDomain = process.env.REACT_APP_SHARE_DOMAIN || 'https://stackmap.app/manyla';
  setGeneratedLink(`${shareDomain}?share=${code}`);
};
```

### 2. URL Parameter Detection (`App.tsx`)

The main app component checks for share tokens on load:

```typescript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('share');
  
  if (code) {
    // Share link detected - show shared view
    setShareCode(code);
    setIsSharedView(true);
    setShowOnboarding(false);
  } else {
    // Normal app flow
    checkForExistingProfile();
  }
}, []);

// Render shared view for share links
if (isSharedView && shareCode) {
  return (
    <ManylaThemeProvider>
      <SharedView shareCode={shareCode} />
    </ManylaThemeProvider>
  );
}
```

### 3. Shared View Component (`SharedView.tsx`)

Auto-authenticates and displays shared data:

```typescript
export const SharedView: React.FC<{ shareCode: string }> = ({ shareCode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sharedProfile, setSharedProfile] = useState<ChildProfile | null>(null);
  
  useEffect(() => {
    const loadSharedData = async () => {
      try {
        // Try localStorage first (for demo/dev)
        const storedShares = localStorage.getItem('manyla_shares');
        if (storedShares) {
          const shares = JSON.parse(storedShares);
          const shareData = shares[shareCode];
          
          if (shareData && new Date(shareData.expiresAt) > new Date()) {
            setSharedProfile(parseProfile(shareData.profile));
            setIsAuthenticated(true);
            return;
          }
        }
        
        // Production: fetch from API
        if (process.env.REACT_APP_API_URL) {
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/share/access.php?token=${shareCode}`
          );
          
          if (response.ok) {
            const data = await response.json();
            setSharedProfile(parseProfile(data.profile));
            setIsAuthenticated(true);
          } else {
            setError('Invalid or expired share link');
          }
        }
      } catch (err) {
        setError('Failed to load shared data');
      }
    };
    
    loadSharedData();
  }, [shareCode]);
  
  // Render shared profile (read-only)
  return (
    <Container>
      <Alert severity="info">
        You are viewing shared information for {sharedProfile?.name}.
        This is a temporary link that will expire.
      </Alert>
      {/* Profile display components */}
    </Container>
  );
};
```

## Backend Implementation

### 1. Database Schema

The `share_links` table stores token-based shares:

```sql
CREATE TABLE share_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    share_id VARCHAR(36) UNIQUE NOT NULL,
    access_token VARCHAR(8) UNIQUE NOT NULL,
    encrypted_profile TEXT NOT NULL,
    recipient_name VARCHAR(255),
    share_note TEXT,
    selected_categories JSON,
    include_quick_info BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    accessed_count INT DEFAULT 0,
    last_accessed_at TIMESTAMP NULL,
    INDEX idx_token (access_token),
    INDEX idx_expires (expires_at)
);
```

### 2. Create Share Endpoint (`/api/share/create.php`)

```php
// Validate token format (6-8 uppercase alphanumeric)
$accessToken = Validator::validateToken($data['access_token']);

// Filter profile data based on selections
$profileData = $data['profile_data'];
if (!empty($data['selected_categories'])) {
    $profileData['entries'] = array_filter(
        $profileData['entries'],
        fn($entry) => in_array($entry['category'], $data['selected_categories'])
    );
}

// Store encrypted
$encryptedProfile = base64_encode(json_encode($profileData));

$stmt = $db->prepare("
    INSERT INTO share_links (
        share_id, access_token, encrypted_profile,
        recipient_name, share_note, selected_categories,
        include_quick_info, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");

$stmt->execute([
    bin2hex(random_bytes(16)),
    $accessToken,
    $encryptedProfile,
    $data['recipient_name'] ?? '',
    $data['share_note'] ?? '',
    json_encode($data['selected_categories'] ?? []),
    $data['include_quick_info'] ? 1 : 0,
    $data['expires_at']
]);

// Return share URL
echo json_encode([
    'success' => true,
    'share_url' => 'https://stackmap.app/manyla?share=' . $accessToken
]);
```

### 3. Access Share Endpoint (`/api/share/access.php`)

```php
// Extract token from query parameter
$token = $_GET['token'] ?? '';
$token = Validator::validateToken($token);

// Fetch and validate
$stmt = $db->prepare("
    SELECT encrypted_profile, recipient_name, share_note, expires_at
    FROM share_links
    WHERE access_token = ?
    AND expires_at > NOW()
");

$stmt->execute([$token]);
$share = $stmt->fetch();

if (!$share) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Invalid or expired token']);
    exit();
}

// Update access count
$updateStmt = $db->prepare("
    UPDATE share_links 
    SET accessed_count = accessed_count + 1,
        last_accessed_at = NOW()
    WHERE access_token = ?
");
$updateStmt->execute([$token]);

// Return decrypted profile
$profileData = json_decode(base64_decode($share['encrypted_profile']), true);

echo json_encode([
    'success' => true,
    'profile' => $profileData,
    'recipient_name' => $share['recipient_name'],
    'share_note' => $share['share_note'],
    'expires_at' => $share['expires_at']
]);
```

## Security Features

### 1. Token Generation
- 6-8 character random tokens
- Uppercase alphanumeric only
- Cryptographically secure generation
- No sequential or predictable patterns

### 2. Access Control
- Tokens expire after set duration
- One token per share (no reuse)
- Access count tracking
- IP-based rate limiting

### 3. Data Filtering
- Only selected categories shared
- Quick info panels optional
- No sync data exposed
- Read-only access enforced

### 4. Validation
```php
public static function validateToken($token) {
    if (empty($token)) {
        throw new InvalidArgumentException("Token is required");
    }
    
    if (!preg_match('/^[A-Z0-9]{6,8}$/', $token)) {
        throw new InvalidArgumentException("Invalid token format");
    }
    
    return $token;
}
```

## User Experience

### 1. Share Creation Flow
1. User clicks "Share Profile" button
2. Selects recipient type (teacher, doctor, etc.)
3. Chooses what information to include
4. Sets expiration (24 hours to 1 year)
5. Clicks "Generate Secure Link"
6. Receives shareable URL with token

### 2. Share Access Flow
1. Recipient receives URL: `https://stackmap.app/manyla?share=ABC123`
2. Opens link in browser
3. App detects token in URL
4. Auto-authenticates (no manual entry needed)
5. Shows filtered, read-only profile
6. Displays expiration notice

### 3. Error Handling
- Invalid token: "This share link is invalid or has expired"
- Expired token: "This share link has expired"
- Network error: "Unable to load shared data"

## Testing Share Implementation

### 1. Create Test Share
```bash
# Create share with backend
curl -X POST https://stackmap.app/manyla/api/share/create.php \
  -H "Content-Type: application/json" \
  -d '{
    "profile_data": {
      "name": "Test Child",
      "entries": [{"category": "goals", "title": "Test Goal"}]
    },
    "access_token": "TEST123",
    "expires_at": "2024-12-31 23:59:59",
    "selected_categories": ["goals"],
    "include_quick_info": true
  }'
```

### 2. Access Test Share
```bash
# Access via token
curl https://stackmap.app/manyla/api/share/access.php?token=TEST123

# Or open in browser
https://stackmap.app/manyla?share=TEST123
```

### 3. Local Testing
For development without backend:
1. Create share in app (uses localStorage)
2. Copy generated link
3. Open in new browser tab
4. Verify shared view loads

## Monitoring & Analytics

### 1. Share Metrics Query
```sql
-- Active shares by recipient type
SELECT 
    recipient_name,
    COUNT(*) as share_count,
    AVG(accessed_count) as avg_accesses
FROM share_links
WHERE expires_at > NOW()
GROUP BY recipient_name;

-- Share usage over time
SELECT 
    DATE(created_at) as share_date,
    COUNT(*) as shares_created,
    SUM(accessed_count) as total_accesses
FROM share_links
GROUP BY DATE(created_at)
ORDER BY share_date DESC
LIMIT 30;
```

### 2. Cleanup Process
```php
// Run hourly via cron
DELETE FROM share_links WHERE expires_at < NOW();
```

## Migration & Deployment

### 1. Enable Token Sharing
```bash
# 1. Deploy database schema
mysql -u user -p manyla_db < share_schema.sql

# 2. Deploy PHP files
scp -r api/share/ server:/var/www/manyla/api/

# 3. Update frontend environment
echo "REACT_APP_API_URL=https://stackmap.app/manyla/api" >> .env.production

# 4. Build and deploy frontend
npm run build
scp -r build/* server:/var/www/manyla/
```

### 2. Verify Implementation
1. Create test share via UI
2. Check database for token entry
3. Access share URL in private window
4. Verify auto-authentication works
5. Check expiration handling

## Troubleshooting

### Common Issues

1. **Token not found in URL**
   - Check URL encoding
   - Verify query parameter parsing
   - Test with simple token (no special chars)

2. **Auto-auth not working**
   - Verify useEffect dependencies
   - Check localStorage/API precedence
   - Review CORS configuration

3. **Expired tokens accessible**
   - Check server timezone settings
   - Verify database timestamp columns
   - Review cleanup cron job

4. **Share creation fails**
   - Check token uniqueness constraint
   - Verify data size limits
   - Review rate limiting settings