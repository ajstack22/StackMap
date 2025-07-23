# StackMap Sync - Zero-Knowledge Architecture

## System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Device 1"
        A1[StackMap App]
        B1[Local Storage]
        C1[Encryption Service]
        D1[Sync Service]
        E1[Recovery Phrase]
        
        A1 --> B1
        A1 --> D1
        D1 --> C1
        E1 --> C1
    end
    
    subgraph "Client Device 2"
        A2[StackMap App]
        B2[Local Storage]
        C2[Encryption Service]
        D2[Sync Service]
        E2[Recovery Phrase]
        
        A2 --> B2
        A2 --> D2
        D2 --> C2
        E2 --> C2
    end
    
    subgraph "Zero-Knowledge Sync Server"
        F[PHP API Endpoints]
        G[MySQL Database]
        H[Rate Limiter]
        I[Metrics Service]
        
        F --> G
        F --> H
        F --> I
        
        subgraph "Encrypted Storage"
            J[sync_data table]
            K[sync_devices table]
            L[sync_metrics table]
        end
        
        G --> J
        G --> K
        G --> L
    end
    
    D1 -.->|"Encrypted Data"| F
    D2 -.->|"Encrypted Data"| F
    
    style C1 fill:#ff6b6b,color:#fff
    style C2 fill:#ff6b6b,color:#fff
    style J fill:#51cf66,color:#fff
    style E1 fill:#ffd93d,color:#000
    style E2 fill:#ffd93d,color:#000
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant App
    participant EncryptionService
    participant SyncService
    participant Server
    participant Database
    
    Note over User,Database: Initial Sync Setup
    User->>App: Enable Sync
    App->>EncryptionService: Generate Recovery Phrase
    EncryptionService-->>App: Recovery Phrase + Sync ID
    App->>User: Display Recovery Phrase
    
    Note over User,Database: Encryption Process
    App->>EncryptionService: Encrypt(App State)
    EncryptionService->>EncryptionService: Derive Key from Phrase
    EncryptionService->>EncryptionService: TweetNaCl.secretbox()
    EncryptionService-->>App: Encrypted Blob
    
    Note over User,Database: Sync Process
    App->>SyncService: Push Data
    SyncService->>Server: POST /push.php
    Server->>Server: Validate Device ID
    Server->>Database: Store Encrypted Blob
    Database-->>Server: Success
    Server-->>SyncService: Version Number
    
    Note over User,Database: Another Device Syncs
    User->>App: Enter Recovery Phrase
    App->>EncryptionService: Derive Key
    App->>SyncService: Pull Data
    SyncService->>Server: GET /pull.php
    Server->>Database: Fetch Encrypted Blob
    Database-->>Server: Encrypted Data
    Server-->>SyncService: Encrypted Blob
    SyncService->>EncryptionService: Decrypt(Blob)
    EncryptionService-->>App: App State
    App->>User: Restored Data
```

## Component Architecture

```mermaid
graph LR
    subgraph "Client-Side Components"
        subgraph "React Native App"
            A[App.js]
            B[EditModeSettingsModal]
            C[Zustand Store]
        end
        
        subgraph "Sync Services"
            D[syncService.js]
            E[encryptionService.js]
        end
        
        subgraph "Storage"
            F[AsyncStorage]
            G[Device Key]
            H[Stored Recovery Phrase]
        end
        
        A --> B
        B --> D
        A --> C
        C --> D
        D --> E
        E --> F
        F --> G
        F --> H
    end
    
    subgraph "Server-Side Components"
        subgraph "API Layer"
            I[create.php]
            J[push.php]
            K[pull.php]
            L[delete.php]
            M[cleanup.php]
        end
        
        subgraph "Services"
            N[Database.php]
            O[RateLimiter.php]
            P[Validator.php]
        end
        
        subgraph "Database Tables"
            Q[sync_data]
            R[sync_devices]
            S[sync_metrics]
            T[rate_limits]
        end
        
        I --> N
        J --> N
        K --> N
        L --> N
        M --> N
        
        I --> O
        J --> O
        K --> O
        L --> O
        
        N --> Q
        N --> R
        N --> S
        N --> T
    end
    
    D -.->|"HTTPS"| I
    D -.->|"HTTPS"| J
    D -.->|"HTTPS"| K
    D -.->|"HTTPS"| L
```

## Encryption Flow

```mermaid
graph TD
    A[User's Recovery Phrase] --> B[PBKDF-like Key Derivation]
    B --> C[Master Key 256-bit]
    
    D[App State JSON] --> E[Stringify + Timestamp]
    E --> F[TweetNaCl secretbox]
    C --> F
    
    F --> G[Encrypted Bytes]
    G --> H[Combine with Nonce]
    H --> I[Base64 Encode]
    I --> J[Send to Server]
    
    K[Fixed Salt] --> B
    
    style A fill:#ffd93d,color:#000
    style C fill:#ff6b6b,color:#fff
    style J fill:#51cf66,color:#fff
```

## Zero-Knowledge Properties

```mermaid
graph TD
    subgraph "What Client Knows"
        A[Recovery Phrase]
        B[Encryption Key]
        C[Plain Text Data]
        D[Sync ID]
    end
    
    subgraph "What Server Knows"
        E[Sync ID]
        F[Encrypted Blob]
        G[Device IDs]
        H[Timestamps]
        I[Blob Size]
    end
    
    subgraph "What Server CANNOT Know"
        J[Recovery Phrase ❌]
        K[Encryption Key ❌]
        L[User Data ❌]
        M[Activity Names ❌]
        N[User Names ❌]
    end
    
    A -.->|"Never Sent"| J
    B -.->|"Never Sent"| K
    C -.->|"Only Encrypted"| L
    
    style J fill:#ff6b6b,color:#fff
    style K fill:#ff6b6b,color:#fff
    style L fill:#ff6b6b,color:#fff
    style M fill:#ff6b6b,color:#fff
    style N fill:#ff6b6b,color:#fff
```

## Security Layers

```mermaid
graph TB
    subgraph "Transport Security"
        A[HTTPS/TLS 1.3]
    end
    
    subgraph "Application Security"
        B[End-to-End Encryption]
        C[Device Authentication]
        D[Rate Limiting]
    end
    
    subgraph "Data Security"
        E[TweetNaCl Encryption]
        F[Random Nonces]
        G[Key Derivation]
    end
    
    subgraph "Operational Security"
        H[No Logs of Keys]
        I[Automatic Cleanup]
        J[User-Controlled Deletion]
    end
    
    A --> B
    B --> E
    C --> D
    E --> F
    E --> G
    B --> H
    H --> I
    H --> J
    
    style B fill:#51cf66,color:#fff
    style E fill:#51cf66,color:#fff
```

## Key Components Summary

### Client-Side
- **TweetNaCl.js**: Provides secretbox encryption
- **Recovery Phrase**: User's only key (never sent to server)
- **Device Key**: For local recovery phrase storage
- **Sync Service**: Manages sync operations
- **Encryption Service**: Handles all crypto operations

### Server-Side
- **PHP API**: Simple REST endpoints
- **MySQL**: Stores only encrypted blobs
- **Rate Limiter**: Prevents abuse
- **No Key Storage**: Server never sees keys
- **Cascade Deletes**: Clean data removal

### Security Properties
- **Zero-Knowledge**: Server can't decrypt data
- **End-to-End**: Encryption happens on device
- **No Accounts**: No user credentials to leak
- **User Control**: Can delete everything
- **Forward Secrecy**: Each sync has unique nonce