# Story #55: Photo Storage Race Condition Prevention

## 🎯 User Story
As a user with ADHD in a hyperfocus state, I need to rapidly capture multiple photos for my tasks without the app crashing or losing any images, so that I can document my ideas at the speed of thought without technical interruptions.

## 📋 Context & Background

### The Critical Problem
- App crashes when users add photos rapidly (current state)
- ADHD hyperfocus = 40-50+ rapid photo captures
- Each crash loses work and triggers RSD (Rejection Sensitive Dysphoria)
- Current failures: SQLITE_BUSY errors, component unmounting, data corruption

### User Behavior Patterns
- **Hyperfocus states**: Rapid successive actions without waiting
- **Dopamine-seeking**: Delays feel punishing
- **Working memory limits**: Can't track upload states across photos
- **Low frustration tolerance**: "Please wait" = abandonment

### Technical Constraints
- SQLite single-writer limitation
- 40MB per photo memory overhead
- 6-8 browser connection limits
- iOS crashes at 23MB memory usage

## 🚀 Developer Launch Prompt

**Hello Developer!** You're fixing a critical bug that's making the app unusable for our most engaged users. When someone with ADHD is documenting their project, they need to capture photos as fast as their brain is moving.

### Your Mission:
1. **Read this entire story** to understand hyperfocus behavior
2. **Review the research report** for race condition patterns
3. **Create your implementation plan** in `4-PlanReview/55-photo-race-condition.md`
4. **Focus on these core requirements:**
   - Zero crashes during rapid photo addition
   - <100ms visual feedback
   - No data loss even under memory pressure
   - Graceful degradation, not failure

### Technical Requirements

#### 1. Three-Layer Architecture
```javascript
// Required architecture pattern
const PhotoStorageArchitecture = {
  // Layer 1: Optimistic UI (<100ms feedback)
  uiLayer: {
    instantPreview: true,
    determinateProgress: true, // NOT spinners
    nonBlockingUpdates: true
  },
  
  // Layer 2: Queue Management
  queueLayer: {
    library: 'p-queue',
    concurrency: 2, // Memory-aware
    retryLogic: 'exponential-backoff',
    prioritization: true
  },
  
  // Layer 3: Hybrid Storage
  storageLayer: {
    metadata: 'SQLite',      // <100KB
    thumbnails: 'SQLite',     // 64x64 optimized
    fullImages: 'FileSystem', // >1MB
    temporary: 'IndexedDB'    // During upload
  }
};
```

#### 2. Queue Implementation Pattern
```javascript
class PhotoUploadManager {
  constructor() {
    this.queue = new PQueue({
      concurrency: 2,
      timeout: 30000,
      throwOnTimeout: true
    });
    
    // Critical: Monitor memory pressure
    this.memoryMonitor = new MemoryMonitor({
      threshold: 0.8,
      onPressure: () => this.queue.concurrency = 1
    });
  }
  
  async addPhoto(imageData, metadata) {
    // 1. Generate temp ID immediately
    const tempId = generateTempId();
    
    // 2. Optimistic UI update (<100ms)
    this.updateUI({
      id: tempId,
      status: 'uploading',
      preview: await createThumbnail(imageData),
      progress: 0
    });
    
    // 3. Queue with retry
    return this.queue.add(
      () => this.uploadWithRetry(imageData, tempId),
      { priority: metadata.priority }
    );
  }
}
```

#### 3. Transaction Safety Pattern
```javascript
// Atomic operations across storage layers
async savePhotoWithMetadata(localUri, metadata) {
  return db.transaction(async (tx) => {
    // 1. Photo record
    const photoId = await tx.insert('photos', {
      local_uri: localUri,
      status: 'pending'
    });
    
    // 2. Queue entry
    await tx.insert('upload_queue', {
      photo_id: photoId,
      priority: metadata.priority
    });
    
    // 3. Temp storage
    await indexedDB.put('temp_uploads', {
      photoId,
      chunks: [],
      timestamp: Date.now()
    });
    
    return photoId;
  });
}
```

#### 4. Memory Management
```javascript
// Streaming uploads prevent memory overload
const chunkSize = 5 * 1024 * 1024; // 5MB chunks

async function* chunkImage(imageData) {
  const blob = await imageData.blob();
  for (let i = 0; i < blob.size; i += chunkSize) {
    yield blob.slice(i, i + chunkSize);
  }
}
```

### User Interface Requirements

#### Visual Feedback Pattern
```javascript
// ADHD-optimized progress indication
const PhotoUploadUI = {
  // Instant grid placement
  showOptimisticPreview: (tempId, thumbnail) => {
    grid.addPhoto({
      id: tempId,
      thumbnail,
      status: 'uploading',
      progress: 0
    });
  },
  
  // Determinate progress (NOT spinners)
  updateProgress: (tempId, percent) => {
    grid.updatePhoto(tempId, {
      progress: percent,
      progressText: `${Math.round(percent)}%`
    });
  },
  
  // Success without disruption
  completeUpload: (tempId, finalId) => {
    grid.updatePhoto(tempId, {
      id: finalId,
      status: 'complete',
      animation: 'subtle-glow' // Not jarring
    });
  }
};
```

#### Error Messaging (RSD-Safe)
```javascript
const errorMessages = {
  network: {
    icon: '🔄',
    message: "Internet hiccup! Your photos are safe - retrying...",
    action: 'automatic'
  },
  storage: {
    icon: '📦',
    message: "Almost out of space! Let's make room together",
    action: 'show-storage-helper'
  },
  timeout: {
    icon: '⏳',
    message: "Taking a bit longer - still working on it!",
    tone: 'encouraging'
  }
};
```

### Success Criteria
- ✅ Zero crashes during 50+ rapid photo additions
- ✅ Initial feedback within 100ms
- ✅ No data loss under memory pressure
- ✅ Graceful degradation to single upload
- ✅ Recovery from all failure modes
- ✅ RSD-safe error messaging

### Testing Requirements
```javascript
// Simulate real ADHD usage patterns
describe('Rapid Photo Tests', () => {
  it('handles 50 photos in 5 seconds', async () => {
    const photos = generatePhotoBurst(50, 100); // 100ms intervals
    const results = await Promise.allSettled(photos);
    
    expect(crashes).toBe(0);
    expect(dataLoss).toBe(0);
    expect(duplicates).toBe(0);
  });
  
  it('degrades gracefully under memory pressure', async () => {
    simulateMemoryPressure(0.9); // 90% usage
    const result = await addLargePhoto();
    
    expect(result.success).toBe(true);
    expect(queue.concurrency).toBe(1);
  });
});
```

### Anti-Patterns to Avoid
- ❌ Blocking UI with "Please wait..."
- ❌ Sequential processing bottlenecks
- ❌ "Upload failed" (use "Let's try again")
- ❌ Losing photos without recovery
- ❌ Indeterminate spinners
- ❌ Memory leaks from retained blobs

## 📚 Resources
- Research report with patterns: `2-ResearchReports/55.md`
- PQueue documentation: https://github.com/sindresorhus/p-queue
- Memory management guide in research

## 🎉 Definition of Done
- [ ] Queue system handles rapid additions
- [ ] Optimistic UI shows photos instantly
- [ ] Memory monitor prevents crashes
- [ ] All uploads eventually succeed
- [ ] No duplicate or lost photos
- [ ] Graceful degradation under pressure
- [ ] RSD-safe error messages

Remember: You're enabling someone in hyperfocus to capture their burst of creativity. Every crashed app is a creative flow interrupted. Make it bulletproof.