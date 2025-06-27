# Mobile-First IndexedDB Implementation Guide

## Overview
This document outlines the mobile-first approach for StackMap's storage layer. No migration needed - we're building fresh for iOS/Android apps.

## Key Decisions
- **IndexedDB only** (localStorage as emergency fallback)
- **Mobile constraints first** (512MB RAM minimum)
- **Offline by default** (online is optional)
- **No progressive migration** (fresh installs only)

## Implementation Phases

### Phase 1: Core IndexedDB Storage (Issue #23)
Complete the Dexie.js integration that's currently stubbed out.

### Phase 2: Mobile Attachments (Issue #24)
Handle camera photos with compression and memory management.

### Phase 3: Testing Infrastructure (Issue #25)
Comprehensive testing including chaos scenarios.

## Technical Requirements

### Storage Architecture
```javascript
// Mobile-optimized storage
class MobileStorage {
    constructor() {
        this.db = new Dexie('StackMapMobile');
        this.setupSchema();
        this.offlineQueue = [];
    }
    
    setupSchema() {
        this.db.version(1).stores({
            tasks: '++id, created, modified, synced',
            settings: 'key',
            attachments: '++id, taskId, size',
            syncQueue: '++id, timestamp'
        });
    }
}
```

### Platform Considerations
- **Android**: WebView variations, storage clearing
- **iOS**: WKWebView, storage persistence
- **Memory**: 512MB minimum support
- **Offline**: 30+ days operation

### Safety Requirements
- Checksums on all data
- Write verification
- Automatic recovery
- RSD-safe error messages

## What We're NOT Doing
- ❌ 30-day progressive migration
- ❌ Parallel localStorage/IndexedDB operation  
- ❌ Complex browser compatibility
- ❌ Multi-device sync (yet)

## Success Metrics
- Zero data loss
- < 100ms operations
- < 50MB memory on 512MB devices
- 30+ days offline operation

## Current Status
- Storage abstraction exists ✅
- Dexie.js integration stubbed ⏳
- Attachment handling partial ⏳
- Testing infrastructure missing ❌