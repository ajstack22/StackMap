# [ARCHIVED] Phase 5 Action Plan: Service Worker Fallback

> **Note**: This document is archived. The project has pivoted to a mobile-first approach without progressive migration.
## Integrating Research Findings into Implementation

### 🎯 Phase 5 Overview
Building on Phase 4's inline fallback UI, Phase 5 implements service worker-based offline resilience that maintains functionality without triggering anxiety in neurodivergent users.

---

## 📊 Research Integration Summary

The new research provides critical implementation details for all 8 areas. Here's how they inform Phase 5 and beyond:

### Immediate Phase 5 Applications:

1. **Service Worker Architecture** (Research Area 1)
   - Cache-first strategy with task data priority
   - Calming blue (#4A90E2) offline indicators
   - Routine-aware update scheduling
   - 30-day task data retention

2. **PWA Install Timing** (Research Area 2)
   - Detect hyperfocus (>15 actions in 5 minutes)
   - 10-word install prompts
   - 24-hour re-engagement cooldown
   - Platform-specific visual guides

---

## Phase 5 Implementation Steps

### Step 1: Service Worker Foundation (Week 1)

#### 1.1 Cache Strategy Implementation
```javascript
// Priority-based caching from research
const CACHE_STRATEGY = {
  taskData: {
    cacheName: 'stackmap-tasks-v1',
    retention: 30 * 24 * 60 * 60 * 1000, // 30 days
    strategy: 'cache-first'
  },
  uiAssets: {
    cacheName: 'stackmap-ui-v1',
    retention: 7 * 24 * 60 * 60 * 1000, // 7 days
    strategy: 'stale-while-revalidate'
  },
  analytics: {
    cacheName: 'stackmap-analytics-v1',
    retention: 0, // network-only
    strategy: 'network-only'
  }
};
```

#### 1.2 Anxiety-Safe Status Indicators
- Use #4A90E2 (calming blue) for offline state
- Implement slide-in animations with prefers-reduced-motion
- Message: "Your tasks are available offline" (not "No connection")
- Position: bottom-right, non-intrusive

#### 1.3 Routine-Aware Updates
- Detect user activity patterns
- Schedule updates during natural breaks
- Never interrupt hyperfocus sessions
- <2s offline detection latency

### Step 2: Progressive Enhancement (Week 2)

#### 2.1 Device Capability Detection
```javascript
// From research findings
const deviceCapabilities = {
  memory: navigator.deviceMemory || 4,
  connection: navigator.connection?.effectiveType || '4g',
  saveData: navigator.connection?.saveData || false
};

// Adapt features based on capabilities
if (deviceCapabilities.memory <= 1) {
  // Load lite components
  // Disable animations
  // Limit cache size
}
```

#### 2.2 Cache Size Management
- Critical resources: 5MB limit
- Images: 10MB limit  
- API responses: 2MB limit
- Auto-cleanup when approaching limits

### Step 3: PWA Install Flow (Week 3)

#### 3.1 Timing Intelligence
```javascript
// Hyperfocus detection from research
const hyperfocusDetector = {
  actionCount: 0,
  timeWindow: 5 * 60 * 1000, // 5 minutes
  threshold: 15,
  
  isInHyperfocus() {
    return this.actionCount > this.threshold;
  }
};
```

#### 3.2 Install Prompt Design
- Max 10 words: "Add StackMap to your home screen"
- Visual preview of home screen icon
- One-tap installation (no secondary choices)
- Recovery after 24-hour cooldown

### Step 4: Integration Testing (Week 4)

#### 4.1 Test Scenarios
- [ ] Offline task creation/editing
- [ ] Online/offline transitions
- [ ] Service worker updates during use
- [ ] Low-memory device performance
- [ ] PWA install on iOS/Android

#### 4.2 Success Metrics
- Zero data loss during offline
- <2s offline detection
- >40% PWA install rate
- <50MB memory on 512MB devices
- No anxiety-triggering messages

---

## 🔄 Integration with Completed Phases

### Phase 4 Error Detection Enhancement
Add offline-specific error handling:
```javascript
// Extend existing error detection
if (!navigator.onLine) {
  // Don't trigger error fallback
  // Show calm offline indicator instead
  showOfflineStatus();
}
```

### Data Preservation Sync
Integrate with Phase 4's preservation system:
```javascript
// Queue preserved data for sync
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.ready.then(reg => {
    return reg.sync.register('stackmap-sync');
  });
}
```

---

## 📅 Future Phase Planning

### Phase 6: Cognitive Load Monitoring
- Implement rage click detection (≥3 clicks in 2s within 50px)
- Navigation loop analysis (>3 revisits in 5min)
- Privacy-preserving analytics (ε=0.1)
- <500ms detection latency

### Phase 7: Multi-Device Sync
- Integrate Yjs CRDT library (~90KB bundle)
- Zero conflict dialogs
- Selective sync (data yes, settings no)
- <3s device switching

### Phase 8: Family Accounts
- Age/ability permission matrix
- Visual consent flows (7:1 contrast)
- Break-glass emergency access
- <2 minute setup flow

---

## 🎯 Key Research Insights Applied

1. **Memory Optimization** (512MB devices)
   - Preact instead of React (4.5KB vs 15MB)
   - AVIF images (50% smaller than JPEG)
   - <50KB initial bundle

2. **Notification Timing** (ADHD patterns)
   - Detect >90min sessions as hyperfocus
   - Batch to 5 daily notifications
   - 8 AM, 12 PM, 6 PM windows
   - >70% engagement target

3. **Error Messaging** (RSD prevention)
   - 0% trigger words ("error", "failed")
   - System-focused language
   - Acknowledge + Guide + Encourage

4. **Privacy Architecture** (family needs)
   - Progressive permissions by age
   - Emergency access tiers
   - Immutable audit trails
   - COPPA compliance

---

## 📋 Development Checklist

### Week 1: Service Worker Core
- [ ] Implement priority caching strategy
- [ ] Add anxiety-safe offline indicators
- [ ] Build routine-aware update system
- [ ] Test on Android 5 devices

### Week 2: Progressive Enhancement
- [ ] Add device capability detection
- [ ] Implement cache size limits
- [ ] Build lite component system
- [ ] Optimize for 3G networks

### Week 3: PWA Install
- [ ] Create hyperfocus detector
- [ ] Design 10-word prompts
- [ ] Build platform guides
- [ ] Add recovery mechanism

### Week 4: Integration
- [ ] Run all test scenarios
- [ ] Measure success metrics
- [ ] Document learnings
- [ ] Prepare Phase 6

---

## 🚀 Ready to Implement

With this research-informed action plan, Phase 5 can deliver:
- Anxiety-free offline experience
- Intelligent PWA installation
- Optimized performance on low-end devices
- Foundation for future phases

The research has transformed theoretical concepts into concrete implementation steps with specific metrics, code patterns, and user-focused design decisions.