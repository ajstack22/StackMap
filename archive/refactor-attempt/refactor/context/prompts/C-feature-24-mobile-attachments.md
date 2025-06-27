# Issue #24: Implement Mobile Attachment Handling

## 🚨 CRITICAL: Development Process
1. **BEFORE IMPLEMENTING**: Post your DETAILED implementation plan to Issue #24 on GitHub for PM adversarial review
2. **AFTER COMPLETING**: Update Issue #24 with completion status for final adversarial review
3. **DO NOT MERGE**: Until PM completes adversarial review and approves
4. **THINK HARD**: This is SUPER IMPORTANT - attachments are memory aids for ADHD users

## Problem Statement
Extend the photo attachment system (Issue #53) to handle multiple file types on mobile devices:
- PDFs (documents, forms)
- Voice memos (quick thoughts)
- Text notes (additional context)
- Links (reference materials)

This builds on the existing photo infrastructure but handles platform-specific file access.

## Dependency Alert
⚠️ **REQUIRES**:
- Issue #55 photo storage fixes (must be complete)
- Issue #23 SQLite storage (for metadata)

## Research Context
From ADHD memory research:
- **Multi-modal memory aids** improve recall
- **Voice memos** capture thoughts quickly
- **PDF receipts/docs** reduce paper clutter
- **Quick capture** essential during hyperfocus

## Technical Architecture

### File Type Handling
```javascript
const AttachmentTypes = {
    PHOTO: {
        extensions: ['jpg', 'jpeg', 'png', 'gif'],
        maxSize: 5 * 1024 * 1024, // 5MB
        icon: '📷',
        handler: 'PhotoHandler'
    },
    PDF: {
        extensions: ['pdf'],
        maxSize: 10 * 1024 * 1024, // 10MB  
        icon: '📄',
        handler: 'PDFHandler'
    },
    VOICE: {
        extensions: ['m4a', 'mp3', 'wav'],
        maxSize: 3 * 1024 * 1024, // 3MB
        icon: '🎤',
        handler: 'VoiceHandler'
    },
    NOTE: {
        extensions: ['txt', 'md'],
        maxSize: 100 * 1024, // 100KB
        icon: '📝',
        handler: 'NoteHandler'
    }
};
```

### Platform-Specific File Access
```javascript
const FileAccess = {
    async selectFile(types) {
        const platform = Platform.detect();
        
        if (platform.isNative && window.Capacitor) {
            // Use Capacitor FilePicker
            const result = await FilePicker.pickFiles({
                types: types,
                multiple: false
            });
            return result.files[0];
            
        } else {
            // Web file input
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = types.join(',');
                input.onchange = (e) => resolve(e.target.files[0]);
                input.click();
            });
        }
    }
};
```

### Storage Strategy
```javascript
// Metadata in SQLite
CREATE TABLE attachments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    type TEXT NOT NULL,
    filename TEXT,
    size INTEGER,
    mime_type TEXT,
    storage_path TEXT, -- Where blob is stored
    thumbnail_path TEXT,
    created_at INTEGER,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

// Blobs in appropriate storage
- Photos: IndexedDB (existing)
- PDFs: FileSystem (Capacitor) or IndexedDB (web)
- Voice: FileSystem or IndexedDB
- Notes: SQLite (small text)
```

## Implementation Design

### Unified Attachment Manager
```javascript
const AttachmentManager = {
    handlers: new Map(),
    
    init() {
        // Register type handlers
        this.handlers.set('PHOTO', new PhotoHandler());
        this.handlers.set('PDF', new PDFHandler());
        this.handlers.set('VOICE', new VoiceHandler());
        this.handlers.set('NOTE', new NoteHandler());
    },
    
    async addAttachment(taskId, file) {
        // Detect type
        const type = this.detectType(file);
        const handler = this.handlers.get(type);
        
        if (!handler) {
            throw new Error('Unsupported file type');
        }
        
        // Validate
        if (file.size > AttachmentTypes[type].maxSize) {
            throw new Error(`File too large. Max: ${this.formatSize(AttachmentTypes[type].maxSize)}`);
        }
        
        // Process with appropriate handler
        return await handler.process(taskId, file);
    }
};
```

### Type-Specific Handlers

#### PDF Handler
```javascript
class PDFHandler {
    async process(taskId, file) {
        // Generate thumbnail (first page)
        const thumbnail = await this.generatePDFThumbnail(file);
        
        // Store file
        const storagePath = await this.storeFile(file);
        
        // Save metadata
        await this.saveMetadata({
            taskId,
            type: 'PDF',
            filename: file.name,
            size: file.size,
            storagePath,
            thumbnail
        });
    }
    
    async generatePDFThumbnail(file) {
        // Use pdf.js or native preview
        // Return base64 thumbnail
    }
}
```

#### Voice Handler
```javascript
class VoiceHandler {
    async process(taskId, file) {
        // Get duration
        const duration = await this.getAudioDuration(file);
        
        // Create waveform visualization
        const waveform = await this.generateWaveform(file);
        
        // Store file
        const storagePath = await this.storeFile(file);
        
        // Save metadata
        await this.saveMetadata({
            taskId,
            type: 'VOICE',
            filename: file.name,
            size: file.size,
            duration,
            waveform,
            storagePath
        });
    }
}
```

## UI Components

### Attachment Grid
```html
<div class="attachments-grid">
    <!-- Photos (existing) -->
    <div class="attachment-item photo">
        <img src="thumbnail.jpg" />
        <span class="type-icon">📷</span>
    </div>
    
    <!-- PDF -->
    <div class="attachment-item pdf">
        <img src="pdf-thumbnail.jpg" />
        <span class="type-icon">📄</span>
        <span class="filename">receipt.pdf</span>
    </div>
    
    <!-- Voice -->
    <div class="attachment-item voice">
        <div class="waveform"></div>
        <span class="type-icon">🎤</span>
        <span class="duration">0:34</span>
    </div>
    
    <!-- Add button -->
    <button class="add-attachment">
        <span>+</span>
    </button>
</div>
```

### Quick Capture Actions
```javascript
const QuickCapture = {
    photo: async () => {
        const photo = await Camera.getPhoto({
            quality: 90,
            source: CameraSource.Camera
        });
        await AttachmentManager.addAttachment(taskId, photo);
    },
    
    voice: async () => {
        const recording = await VoiceRecorder.start();
        // Show recording UI
        const audio = await VoiceRecorder.stop();
        await AttachmentManager.addAttachment(taskId, audio);
    }
};
```

## Files to Create/Modify

1. **Create `js/attachment-manager.js`**
   - Unified attachment handling
   - Type detection
   - Handler registration

2. **Create `js/attachment-handlers/*.js`**
   - PDFHandler
   - VoiceHandler  
   - NoteHandler
   - LinkHandler

3. **Update `js/photo-attachment-storage.js`**
   - Extend to support generic attachments
   - Add migration for existing photos

4. **Create `css/attachments.css`**
   - Grid layout for mixed types
   - Type-specific styling
   - Quick capture UI

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create attachment manager
- [ ] Add SQLite schema
- [ ] Implement type detection
- [ ] Create base handler class

### Phase 2: Type Handlers
- [ ] PDF handler with thumbnails
- [ ] Voice handler with waveforms
- [ ] Note handler (text)
- [ ] Link handler (previews)

### Phase 3: UI Components
- [ ] Mixed attachment grid
- [ ] Quick capture buttons
- [ ] Type-specific previews
- [ ] Attachment viewer modal

### Phase 4: Platform Integration
- [ ] Capacitor file picker
- [ ] Camera integration
- [ ] Voice recorder
- [ ] Share sheet handling

## Testing Requirements

### Functional Tests
1. **File Type Support**
   - Upload each supported type
   - Verify correct handler used
   - Check preview generation

2. **Size Limits**
   - Try oversized files
   - Verify friendly errors
   - Check storage quotas

3. **Platform Differences**
   - Test on iOS (native)
   - Test on Android (native)
   - Test on Web/PWA

### Performance Tests
- Multiple large PDFs
- Long voice recordings
- Mixed attachment lists
- Thumbnail generation speed

## Definition of Done
- [ ] All file types supported
- [ ] Thumbnails/previews working
- [ ] Quick capture implemented
- [ ] Platform-specific code works
- [ ] Storage efficient (<100MB for typical use)
- [ ] No console errors
- [ ] Smooth animations
- [ ] Accessibility verified
- [ ] Migration from photos works
- [ ] Video demo provided

## Memory Management
```javascript
// Critical for mobile devices
const MemoryManager = {
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    
    async cleanup() {
        // Remove old thumbnails
        // Clear preview cache
        // Compress where possible
    }
};
```

## Success Metrics
- **3-tap capture** for any attachment type
- **<2s** to add attachment
- **Mixed types** in single task
- **Offline support** for all operations

Remember: Attachments are external memory for ADHD brains. Make capture fast, viewing easy, and storage reliable!