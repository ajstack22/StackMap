# Issue #24: Mobile Attachment Handling - Implementation Plan

## Executive Summary
This implementation extends the existing photo attachment system (Issue #55) to support multiple file types (PDFs, voice memos, text notes, links) on mobile devices. Both dependencies (Issue #55 photo storage and Issue #23 SQLite storage) are confirmed complete and working.

## Development Approach

### Phase 1: Core Infrastructure (Day 1)
**Goal**: Establish the foundation for multi-type attachment handling

1. **Create Attachment Manager** (`js/attachment-manager.js`)
   - Unified interface for all attachment types
   - Type detection based on file extension and MIME type
   - Handler registration system
   - Size validation per type
   - Error handling with user-friendly messages

2. **Extend SQLite Schema**
   - Add `attachments` table with proper foreign keys
   - Include fields for type-specific metadata (duration, page count, etc.)
   - Maintain backward compatibility with existing photos
   - Create migration script for existing photo data

3. **Base Handler Architecture**
   - Abstract `AttachmentHandler` class
   - Common methods: process(), store(), retrieve(), delete()
   - Type-specific validation
   - Thumbnail/preview generation interface

### Phase 2: Type-Specific Handlers (Day 2-3)
**Goal**: Implement handlers for each attachment type

1. **PDFHandler** (`js/attachment-handlers/pdf-handler.js`)
   - PDF.js integration for thumbnail generation (first page)
   - Page count extraction
   - Text extraction for searchability (future feature)
   - Capacitor Filesystem storage for native, IndexedDB for web

2. **VoiceHandler** (`js/attachment-handlers/voice-handler.js`)
   - Audio duration calculation
   - Waveform visualization using Web Audio API
   - Playback controls integration
   - Compression options for storage efficiency

3. **NoteHandler** (`js/attachment-handlers/note-handler.js`)
   - Plain text and Markdown support
   - Character limit enforcement (100KB)
   - Quick preview generation
   - Direct SQLite storage (small size)

4. **LinkHandler** (`js/attachment-handlers/link-handler.js`)
   - URL validation
   - Metadata extraction (title, description, favicon)
   - Preview card generation
   - Offline caching of metadata

### Phase 3: UI Components (Day 3-4)
**Goal**: Create intuitive interface for attachment management

1. **Attachment Grid Component** (`css/attachments.css`)
   - Responsive grid layout (2-3 columns mobile, 4-6 desktop)
   - Type-specific styling and icons
   - Loading states and skeletons
   - Smooth animations for add/remove

2. **Quick Capture UI**
   - Floating action button with type options
   - One-tap camera access (photos)
   - Voice recording interface with visual feedback
   - File picker integration
   - Drag-and-drop support (web/desktop)

3. **Attachment Viewer Modal**
   - Full-screen preview for all types
   - PDF viewer with page navigation
   - Audio player with scrubbing
   - Text viewer with syntax highlighting
   - Share and export options

### Phase 4: Platform Integration (Day 4-5)
**Goal**: Ensure seamless native and web functionality

1. **Capacitor Integration**
   - FilePicker plugin for document selection
   - Microphone plugin for voice recording
   - Filesystem plugin for large file storage
   - Share plugin for import/export

2. **Progressive Enhancement**
   - Feature detection for capabilities
   - Graceful fallbacks for web
   - Permission handling with clear prompts
   - Offline-first architecture

3. **Memory Management**
   - Implement cache limits (50MB default)
   - Automatic cleanup of old thumbnails
   - Lazy loading for attachment lists
   - Memory pressure handling

## Technical Decisions

### Storage Strategy
- **Photos**: Continue using IndexedDB (existing system)
- **PDFs**: Capacitor Filesystem (native) / IndexedDB chunks (web)
- **Voice**: Same as PDFs with audio optimization
- **Notes**: Direct SQLite storage (small text)
- **Links**: Metadata in SQLite, preview cache in IndexedDB

### Performance Targets
- **Add attachment**: <2 seconds including thumbnail
- **Load attachment grid**: <500ms for 10 items
- **Quick capture**: <500ms to ready state
- **Memory usage**: <50MB active cache

### Migration Strategy
1. Create new `attachments` table alongside existing photos
2. Migrate photo records to attachments table
3. Update photo-attachment-storage.js to use new schema
4. Maintain backward compatibility during transition
5. Clean up after successful migration

## Risk Mitigation

### Technical Risks
- **PDF.js bundle size**: Use dynamic import, load on-demand
- **Audio processing performance**: Use Web Workers for waveform generation
- **Storage quotas**: Implement quota monitoring and user warnings
- **Cross-platform differences**: Extensive testing matrix, feature flags

### User Experience Risks
- **Complexity**: Progressive disclosure, smart defaults
- **Performance**: Aggressive lazy loading, preview caching
- **Data loss**: Automatic backups, recovery mechanisms
- **Learning curve**: Inline tutorials, helpful empty states

## Testing Strategy

### Unit Tests
- Type detection accuracy
- Handler processing logic
- Storage operations
- Memory management

### Integration Tests
- End-to-end attachment flow
- Platform-specific features
- Migration scenarios
- Error recovery

### Manual Testing Matrix
- iOS Safari (PWA)
- iOS Native (Capacitor)
- Android Chrome (PWA)
- Android Native (Capacitor)
- Desktop Chrome/Firefox/Safari

## Success Metrics
- **3-tap rule**: Any attachment added in 3 taps or less
- **Performance**: All operations under target times
- **Reliability**: Zero data loss, graceful error handling
- **Accessibility**: Full keyboard navigation, screen reader support
- **User satisfaction**: Intuitive without documentation

## Implementation Order
1. Core infrastructure and schema
2. Photo migration to new system
3. PDF support (most requested)
4. Voice memo support (ADHD priority)
5. Text notes and links
6. Polish and optimization

## Deliverables
- [ ] Working attachment system for all types
- [ ] Comprehensive test suite
- [ ] Performance benchmarks
- [ ] Migration tool and instructions
- [ ] Video demo of all features
- [ ] Documentation updates

This plan prioritizes reliability, performance, and user experience while building on the solid foundation of Issues #55 and #23. The phased approach allows for incremental testing and validation.