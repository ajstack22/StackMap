# StackMap Sync Implementation Plan

Based on the comprehensive research report, this document outlines the practical implementation steps for Phase 1 of the cross-device sync feature.

## Phase 1: Core Infrastructure (Weeks 1-3)

### Week 1: Backend Setup & Database Schema

#### Day 1-2: Database Setup
1. **Create MySQL database and tables on Namecheap**
   ```sql
   -- Create database
   CREATE DATABASE IF NOT EXISTS stackmap_sync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE stackmap_sync;

   -- Main sync data table
   CREATE TABLE sync_data (
     sync_id VARCHAR(36) PRIMARY KEY,
     encrypted_blob LONGBLOB NOT NULL,
     recovery_salt VARCHAR(32) NOT NULL,
     version INT DEFAULT 1,
     device_count INT DEFAULT 1,
     last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     INDEX idx_last_modified (last_modified)
   );

   -- Device tracking table
   CREATE TABLE sync_devices (
     device_id VARCHAR(36) PRIMARY KEY,
     sync_id VARCHAR(36) NOT NULL,
     device_name VARCHAR(100),
     last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     is_active BOOLEAN DEFAULT TRUE,
     FOREIGN KEY (sync_id) REFERENCES sync_data(sync_id) ON DELETE CASCADE,
     INDEX idx_sync_id (sync_id)
   );

   -- Metrics table (privacy-respecting)
   CREATE TABLE sync_metrics (
     id INT AUTO_INCREMENT PRIMARY KEY,
     event VARCHAR(50) NOT NULL,
     metadata JSON,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     INDEX idx_event_date (event, created_at)
   );

   -- Rate limiting table
   CREATE TABLE rate_limits (
     identifier VARCHAR(255) PRIMARY KEY,
     endpoint VARCHAR(100) NOT NULL,
     request_count INT DEFAULT 0,
     window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     INDEX idx_endpoint (endpoint)
   );
   ```

2. **Create database connection script**
   - Location: `/public_html/api/config/database.php`
   - Use PDO with prepared statements
   - Connection pooling for performance

#### Day 3-4: PHP API Structure
1. **Set up API directory structure**
   ```
   /public_html/
   ├── api/
   │   ├── config/
   │   │   ├── database.php
   │   │   ├── cors.php
   │   │   └── rate-limiter.php
   │   ├── sync/
   │   │   ├── create.php
   │   │   ├── push.php
   │   │   ├── pull.php
   │   │   └── pair.php
   │   ├── utils/
   │   │   ├── validation.php
   │   │   └── response.php
   │   └── .htaccess
   ```

2. **Implement base API functionality**
   - CORS headers for cross-origin requests
   - JSON request/response handling
   - Error handling and logging
   - Rate limiting logic

#### Day 5: Core API Endpoints
1. **Implement `/api/sync/create.php`**
   - Accept sync_id, encrypted_blob, recovery_salt
   - Validate inputs
   - Store in database
   - Return success/error response

2. **Implement `/api/sync/push.php`**
   - Accept sync_id, encrypted_blob, device_id
   - Verify device authorization
   - Update sync_data
   - Return latest version number

3. **Implement `/api/sync/pull.php`**
   - Accept sync_id, device_id
   - Verify device authorization
   - Return encrypted_blob and metadata

### Week 2: Encryption Implementation

#### Day 6-7: TweetNaCl.js Integration
1. **Add TweetNaCl to project**
   ```bash
   npm install tweetnacl tweetnacl-util
   ```

2. **Create encryption service**
   - Location: `src/services/crypto.service.ts`
   - Implement all encryption methods
   - Add proper TypeScript types

3. **Create key management service**
   - Secure key generation
   - Key derivation from recovery phrase
   - Platform-specific secure storage integration

#### Day 8-9: Platform-Specific Storage
1. **iOS/Android secure storage**
   - Use react-native-keychain for master key
   - Store sync_id in AsyncStorage
   - Handle biometric authentication

2. **Web secure storage**
   - Use Web Crypto API for key operations
   - IndexedDB for encrypted local storage
   - Session management

#### Day 10: Testing Encryption
1. **Unit tests for crypto service**
   - Encryption/decryption roundtrip
   - Key derivation consistency
   - Error handling

2. **Cross-platform compatibility tests**
   - Ensure encrypted data from iOS can be decrypted on Android/Web
   - Performance benchmarks

### Week 3: WebSocket Relay & Integration

#### Day 11-12: WebSocket Implementation
1. **Option A: PHP WebSocket server**
   - Use Ratchet PHP library
   - Run on separate port if allowed by Namecheap

2. **Option B: External WebSocket service**
   - Use Pusher or similar service
   - Implement relay logic
   - Free tier should be sufficient for pairing

#### Day 13-14: QR Code Pairing
1. **QR generation (primary device)**
   - Generate channel ID and key
   - Create QR data structure
   - Display with timeout

2. **QR scanning (secondary device)**
   - Implement camera permissions
   - Parse QR data
   - Connect to WebSocket channel

#### Day 15: Integration Testing
1. **End-to-end pairing test**
   - Generate QR on device A
   - Scan with device B
   - Verify key exchange
   - Test sync functionality

## Implementation Files

### 1. Database Configuration
```php
// api/config/database.php
<?php
class Database {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        $host = 'localhost';
        $db = 'stackmap_sync';
        $user = 'your_db_user';
        $pass = 'your_db_password';
        
        try {
            $this->pdo = new PDO(
                "mysql:host=$host;dbname=$db;charset=utf8mb4",
                $user,
                $pass,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw $e;
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->pdo;
    }
}
```

### 2. Crypto Service
```typescript
// src/services/crypto.service.ts
import nacl from 'tweetnacl';
import { encode as base64Encode, decode as base64Decode } from 'tweetnacl-util';
import * as bip39 from 'bip39';

export interface EncryptedPayload {
  version: number;
  algorithm: string;
  ciphertext: string;
  nonce: string;
  timestamp: number;
}

export class CryptoService {
  private textEncoder = new TextEncoder();
  private textDecoder = new TextDecoder();

  generateMasterKey(): Uint8Array {
    return nacl.randomBytes(32);
  }

  generateRecoveryPhrase(): string {
    const entropy = nacl.randomBytes(16);
    return bip39.entropyToMnemonic(Buffer.from(entropy));
  }

  async deriveKeyFromRecovery(phrase: string, salt: Uint8Array): Promise<Uint8Array> {
    if (!bip39.validateMnemonic(phrase)) {
      throw new Error('Invalid recovery phrase');
    }
    
    const seed = await bip39.mnemonicToSeed(phrase);
    // Use PBKDF2 with high iteration count
    const iterations = 200000;
    const key = await this.pbkdf2(seed, salt, iterations, 32);
    return key;
  }

  async encryptData(data: object, key: Uint8Array): Promise<EncryptedPayload> {
    const nonce = nacl.randomBytes(24);
    const message = this.textEncoder.encode(JSON.stringify(data));
    const ciphertext = nacl.secretbox(message, nonce, key);
    
    return {
      version: 1,
      algorithm: 'xsalsa20-poly1305',
      ciphertext: base64Encode(ciphertext),
      nonce: base64Encode(nonce),
      timestamp: Date.now()
    };
  }

  async decryptData(payload: EncryptedPayload, key: Uint8Array): Promise<object> {
    const ciphertext = base64Decode(payload.ciphertext);
    const nonce = base64Decode(payload.nonce);
    
    const decrypted = nacl.secretbox.open(ciphertext, nonce, key);
    if (!decrypted) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
    
    return JSON.parse(this.textDecoder.decode(decrypted));
  }

  generateChannelKey(): { id: string; key: Uint8Array } {
    return {
      id: this.generateUUID(),
      key: nacl.randomBytes(32)
    };
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private async pbkdf2(
    password: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    keyLen: number
  ): Promise<Uint8Array> {
    // Use SubtleCrypto on web, react-native-crypto on mobile
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const key = await window.crypto.subtle.importKey(
        'raw',
        password,
        'PBKDF2',
        false,
        ['deriveBits']
      );
      
      const bits = await window.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt,
          iterations,
          hash: 'SHA-256'
        },
        key,
        keyLen * 8
      );
      
      return new Uint8Array(bits);
    } else {
      // Fallback for React Native - use react-native-crypto
      throw new Error('PBKDF2 implementation needed for this platform');
    }
  }
}
```

### 3. Sync Store Integration
```typescript
// src/stores/syncStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CryptoService } from '../services/crypto.service';
import { SecureStorage } from '../services/secure-storage.service';

interface SyncStore {
  // State
  syncEnabled: boolean;
  syncId: string | null;
  deviceId: string | null;
  lastSyncTime: Date | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'pairing';
  syncError: string | null;
  
  // Actions
  initiatePairing: () => Promise<PairingData>;
  completePairing: (qrData: QRData) => Promise<void>;
  performSync: () => Promise<void>;
  disableSync: () => Promise<void>;
  
  // Internal
  _cryptoService: CryptoService;
  _masterKey: Uint8Array | null;
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      // Initial state
      syncEnabled: false,
      syncId: null,
      deviceId: null,
      lastSyncTime: null,
      syncStatus: 'idle',
      syncError: null,
      
      _cryptoService: new CryptoService(),
      _masterKey: null,
      
      // Implementations will go here
      initiatePairing: async () => {
        // Implementation
      },
      
      completePairing: async (qrData) => {
        // Implementation
      },
      
      performSync: async () => {
        // Implementation
      },
      
      disableSync: async () => {
        // Implementation
      }
    }),
    {
      name: 'stackmap-sync',
      partialize: (state) => ({
        syncEnabled: state.syncEnabled,
        syncId: state.syncId,
        deviceId: state.deviceId,
        lastSyncTime: state.lastSyncTime
      })
    }
  )
);
```

## Next Steps

After completing Phase 1:

1. **Phase 2 (Weeks 4-6)**: Client UI implementation
   - QR code generation/scanning screens
   - Sync settings UI
   - Status indicators

2. **Phase 3 (Weeks 7-8)**: Conflict resolution
   - Field-level timestamps
   - Merge logic
   - Conflict UI

3. **Phase 4 (Weeks 9-10)**: Testing & optimization
   - Security audit
   - Performance testing
   - User testing

4. **Phase 5 (Weeks 11-12)**: Production deployment
   - Monitoring setup
   - Documentation
   - User onboarding

## Risk Mitigation

1. **Namecheap Limitations**
   - Have fallback plan for WebSocket (polling if needed)
   - Monitor PHP execution limits
   - Prepare CDN integration if needed

2. **Security Concerns**
   - Regular security audits
   - Penetration testing
   - Bug bounty program consideration

3. **Performance Issues**
   - Database query optimization
   - Caching strategy
   - Load testing

## Success Metrics

- Pairing success rate > 95%
- Sync completion time < 2 seconds
- Zero data loss incidents
- User satisfaction > 4.5/5