# Research to Implementation Mapping
## How Each Research Finding Maps to StackMap Development

### 🗺️ Overview
This document maps specific research findings from "Implementation Guidance for StackMap: 8 Critical Areas" to concrete development tasks across all phases.

---

## 1. Service Worker Resilience Patterns

### Research Finding → Implementation
- **95% ADHD users have executive dysfunction** → Cache-first strategy for task data
- **Calming blue (#4A90E2) reduces anxiety** → Replace red error indicators
- **<2s offline detection needed** → Immediate status feedback
- **30-day retention for task data** → IndexedDB with expiration

### Phase 5 Tasks:
```javascript
// manifest.json
{
  "theme_color": "#4A90E2", // Calming blue from research
  "background_color": "#ffffff"
}

// service-worker.js
const TASK_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
```

---

## 2. PWA Install Flow Intelligence

### Research Finding → Implementation
- **2-8 hour hyperfocus sessions** → Never interrupt during high activity
- **>15 actions in 5 minutes = hyperfocus** → Activity counter implementation
- **10 words max for prompts** → "Add StackMap to your home screen"
- **24-hour cooldown after dismissal** → localStorage timestamp tracking

### Phase 5 Tasks:
- Implement `HyperfocusDetector` class
- Create visual install guides for iOS/Android
- Build re-engagement timer system

---

## 3. Cognitive Load Metrics

### Research Finding → Implementation
- **≥3 clicks in 2s within 50px = rage click** → Event listener implementation
- **>3 page revisits in 5min = confusion** → Navigation tracking
- **ε=0.1 differential privacy** → Local-only analytics
- **<500ms detection latency** → 100ms buffer analysis

### Phase 6 Tasks:
```javascript
class CognitiveLoadMonitor {
  constructor() {
    this.rageClickRadius = 50; // pixels
    this.rageClickTime = 2000; // ms
    this.rageClickThreshold = 3;
  }
}
```

---

## 4. Multi-Device Sync Strategy

### Research Finding → Implementation
- **Yjs ~90KB vs Automerge ~2MB** → Use Yjs for CRDT
- **Zero conflict dialogs** → Automatic resolution only
- **Green #22c55e = synced** → Status indicator colors
- **<3s device switching** → User-specific document caching

### Phase 7 Tasks:
- Integrate Yjs library
- Build visual sync indicators
- Implement delta sync optimization
- Create family account switching

---

## 5. Error Message Linguistics

### Research Finding → Implementation
- **99% ADHD have RSD** → Zero trigger words policy
- **"Error" → "Let's try different approach"** → Message mapping system
- **System-focused language** → Blame deflection patterns
- **Acknowledge + Guide + Encourage** → Three-part structure

### Immediate Implementation:
```javascript
const messageTransforms = {
  'Error: Invalid input': 'Let\'s adjust this entry',
  'Failed to save': 'Keeping your work safe. Trying again...',
  'Connection failed': 'Working offline - your data is safe'
};
```

---

## 6. 512MB Device Optimization

### Research Finding → Implementation
- **16-32MB heap limits** → Aggressive memory management
- **Preact 4.5KB vs React 15MB** → Framework switch
- **AVIF 50% smaller than JPEG** → Image optimization
- **<50KB initial bundle** → Code splitting strategy

### Cross-Phase Tasks:
- Migrate to Preact (Phase 6)
- Implement AVIF with fallbacks
- Add onTrimMemory callbacks
- Progressive feature loading

---

## 7. ADHD Notification Timing

### Research Finding → Implementation
- **"Time blindness" in ADHD** → Visual time representations
- **>90min + density >0.8 = hyperfocus** → Session monitoring
- **5 daily notification limit** → Batching system
- **8 AM, 12 PM, 6 PM windows** → Circadian timing

### Phase 8 Tasks:
```javascript
const notificationConfig = {
  maxDaily: 5,
  windows: [
    { start: 8, end: 9 },
    { start: 12, end: 13 },
    { start: 18, end: 19 }
  ],
  hyperfocusThreshold: 90 * 60 * 1000 // 90 minutes
};
```

---

## 8. Family Privacy Architecture

### Research Finding → Implementation
- **Age brackets: <13, 13-16, 16-18, 18+** → Permission tiers
- **7:1 contrast for consent flows** → WCAG AAA compliance
- **6th-grade reading level** → Simplified language
- **<2 minute setup** → Streamlined onboarding

### Phase 9 Tasks:
- Build permission matrix system
- Create visual consent components
- Implement break-glass protocols
- Add audit trail logging

---

## 🎯 Priority Implementation Order

### Immediate (Current Development)
1. **Error messaging transforms** - Can implement today
2. **Calming color palette** - Update CSS variables
3. **Service worker caching** - Phase 5 foundation

### Short-term (Next Sprint)
4. **Hyperfocus detection** - For PWA timing
5. **Memory optimization** - Device detection
6. **Offline indicators** - UI components

### Medium-term (Next Quarter)
7. **Cognitive load monitoring** - Phase 6
8. **CRDT sync** - Phase 7
9. **Notification timing** - Phase 8

### Long-term (Roadmap)
10. **Family accounts** - Phase 9
11. **Full Preact migration** - Major refactor
12. **Advanced privacy controls** - Enterprise features

---

## 📊 Success Metrics from Research

### User Experience
- **0% trigger words** in all messages
- **<2s** offline detection
- **>40%** PWA install rate
- **>70%** notification engagement

### Performance
- **<50MB** memory usage
- **<3s** initial load on 3G
- **<50KB** initial bundle
- **90%+** features on low-end devices

### Reliability
- **Zero** data loss offline
- **Zero** conflict dialogs
- **100%** sync consistency
- **<500ms** overwhelm detection

### Accessibility
- **7:1** contrast ratios
- **6th grade** reading level
- **WCAG 2.2 AA** compliance
- **<2 minute** family setup

---

## 🔧 Implementation Tools

### Libraries Identified
- **Yjs** - CRDT implementation
- **Preact** - React alternative
- **Workbox** - Service worker toolkit
- **AVIF polyfill** - Image optimization

### Design Tokens
```css
:root {
  /* From research */
  --color-offline: #4A90E2; /* Calming blue */
  --color-synced: #22c55e; /* Success green */
  --color-syncing: #3b82f6; /* Process blue */
  --color-offline-text: #6b7280; /* Neutral gray */
  
  /* Timing */
  --hyperfocus-threshold: 90min;
  --notification-limit: 5;
  --sync-timeout: 3s;
}
```

### Monitoring Metrics
```javascript
// Based on research thresholds
const METRICS = {
  rageClick: { threshold: 3, timeWindow: 2000, radius: 50 },
  navigationLoop: { threshold: 3, timeWindow: 300000 }, // 5 min
  hyperfocus: { threshold: 90, density: 0.8 },
  cognitiveLoad: { threshold: 0.8, bufferMs: 100 }
};
```

---

This mapping ensures every research insight translates to actionable development tasks with specific implementation details, metrics, and timelines.