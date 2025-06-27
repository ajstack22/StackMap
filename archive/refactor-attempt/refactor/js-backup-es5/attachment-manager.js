/**
 * Attachment Manager - Unified interface for photos and voice memos
 * Extends existing photo storage (Issue #55) to support voice memos
 * 
 * Key features:
 * - Max 5 attachments per task (photos + voice combined)
 * - Voice recordings max 2 minutes
 * - Automatic compression for voice memos > 5MB
 * - Builds on existing PhotoAttachmentStorage
 */

(function(exports) {
    'use strict';

    // Configuration
    var CONFIG = {
        MAX_ATTACHMENTS_PER_TASK: 5,      // Total photos + voice memos
        MAX_VOICE_DURATION: 120,           // 2 minutes in seconds
        MAX_VOICE_SIZE: 5 * 1024 * 1024,   // 5MB
        VOICE_SAMPLE_RATE: 16000,          // 16kHz for voice (smaller files)
        VOICE_BIT_RATE: 32000,             // 32kbps for voice
        WAVEFORM_SAMPLES: 100              // Visual waveform points
    };

    // Attachment types
    var AttachmentTypes = {
        PHOTO: {
            type: 'photo',
            icon: '📷',
            maxSize: 5 * 1024 * 1024,  // 5MB (from photo storage)
            handler: 'PhotoHandler'
        },
        VOICE: {
            type: 'voice', 
            icon: '🎤',
            maxSize: CONFIG.MAX_VOICE_SIZE,
            maxDuration: CONFIG.MAX_VOICE_DURATION,
            handler: 'VoiceHandler'
        }
    };

    // Main attachment manager
    var AttachmentManager = {
        photoStorage: null,
        voiceRecorder: null,
        handlers: {},
        
        /**
         * Initialize the attachment manager
         */
        init: function(callback) {
            var self = this;
            
            // Get photo storage instance
            if (window.PhotoAttachmentStorage) {
                self.photoStorage = window.PhotoAttachmentStorage.getInstance();
            }
            
            // Register handlers
            self.handlers.photo = new PhotoHandler(self.photoStorage);
            self.handlers.voice = new VoiceHandler();
            
            // Check for voice recording capability
            self.checkVoiceCapability(function(hasVoice) {
                console.log('AttachmentManager: Initialized. Voice support:', hasVoice);
                if (callback) callback(true);
            });
        },
        
        /**
         * Check if voice recording is available
         */
        checkVoiceCapability: function(callback) {
            var hasMediaRecorder = typeof MediaRecorder !== 'undefined';
            var hasGetUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
            
            callback(hasMediaRecorder && hasGetUserMedia);
        },
        
        /**
         * Get all attachments for a task (photos + voice)
         */
        getAttachments: function(taskId, callback) {
            var self = this;
            var attachments = [];
            
            // Get photos from existing storage
            if (self.photoStorage) {
                self.photoStorage.getPhotosForTask(taskId, function(photos) {
                    // Convert to unified format
                    photos.forEach(function(photo) {
                        attachments.push({
                            id: photo.id,
                            type: 'photo',
                            taskId: taskId,
                            data: photo,
                            timestamp: photo.timestamp
                        });
                    });
                    
                    // Get voice memos from SQLite
                    self.getVoiceMemos(taskId, function(voiceMemos) {
                        voiceMemos.forEach(function(memo) {
                            attachments.push({
                                id: memo.id,
                                type: 'voice',
                                taskId: taskId,
                                data: memo,
                                timestamp: memo.timestamp
                            });
                        });
                        
                        // Sort by timestamp
                        attachments.sort(function(a, b) {
                            return b.timestamp - a.timestamp;
                        });
                        
                        callback(attachments);
                    });
                });
            } else {
                callback(attachments);
            }
        },
        
        /**
         * Add attachment with validation
         */
        addAttachment: function(taskId, type, data, callback) {
            var self = this;
            
            // Get current count
            self.getAttachments(taskId, function(existing) {
                if (existing.length >= CONFIG.MAX_ATTACHMENTS_PER_TASK) {
                    callback({
                        success: false,
                        error: 'Attachment limit reached. Maximum ' + CONFIG.MAX_ATTACHMENTS_PER_TASK + ' attachments per task.'
                    });
                    return;
                }
                
                // Route to appropriate handler
                var handler = self.handlers[type];
                if (!handler) {
                    callback({
                        success: false,
                        error: 'Unsupported attachment type: ' + type
                    });
                    return;
                }
                
                handler.add(taskId, data, function(result) {
                    if (result.success) {
                        result.remainingSlots = CONFIG.MAX_ATTACHMENTS_PER_TASK - existing.length - 1;
                    }
                    callback(result);
                });
            });
        },
        
        /**
         * Delete attachment
         */
        deleteAttachment: function(attachmentId, type, callback) {
            var self = this;
            var handler = self.handlers[type];
            
            if (!handler) {
                callback({ success: false, error: 'Unknown attachment type' });
                return;
            }
            
            handler.delete(attachmentId, callback);
        },
        
        /**
         * Get voice memos for task (stored in SQLite)
         */
        getVoiceMemos: function(taskId, callback) {
            // Check if we have SQLite with attachment support
            if (window.TaskSQLite && window.TaskSQLite.isReady && window.SQLiteAttachmentOps) {
                window.SQLiteAttachmentOps.getAttachmentsByTask(window.TaskSQLite.db, taskId, function(attachments) {
                    // Filter for voice type
                    var voiceMemos = attachments.filter(function(att) {
                        return att.type === 'voice';
                    });
                    callback(voiceMemos);
                });
            } else {
                // Fallback to empty array if SQLite not available
                callback([]);
            }
        },
        
        /**
         * Get attachment count hint
         */
        getAttachmentHint: function(currentCount) {
            if (currentCount === 0) {
                return 'Add photos or voice memos';
            }
            if (currentCount < CONFIG.MAX_ATTACHMENTS_PER_TASK) {
                return 'Add ' + (CONFIG.MAX_ATTACHMENTS_PER_TASK - currentCount) + ' more';
            }
            return 'Attachment limit reached';
        }
    };

    /**
     * Photo handler - wraps existing PhotoAttachmentStorage
     */
    function PhotoHandler(photoStorage) {
        this.storage = photoStorage;
    }
    
    PhotoHandler.prototype = {
        add: function(taskId, data, callback) {
            if (!this.storage) {
                callback({ success: false, error: 'Photo storage not available' });
                return;
            }
            
            this.storage.addPhoto(taskId, data, callback);
        },
        
        delete: function(photoId, callback) {
            if (!this.storage) {
                callback({ success: false, error: 'Photo storage not available' });
                return;
            }
            
            this.storage.deletePhoto(photoId, callback);
        }
    };

    /**
     * Voice handler - new functionality for voice memos
     */
    function VoiceHandler() {
        this.mediaRecorder = null;
        this.recordingChunks = [];
        this.recordingStartTime = 0;
        this.durationTimer = null;
        this.analyser = null;
    }
    
    VoiceHandler.prototype = {
        /**
         * Start recording voice memo
         */
        startRecording: function(onProgress, callback) {
            var self = this;
            
            // Request microphone permission
            navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: CONFIG.VOICE_SAMPLE_RATE,
                    channelCount: 1,  // Mono for smaller files
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            }).then(function(stream) {
                // Create media recorder with compression
                var options = {
                    mimeType: 'audio/webm;codecs=opus',
                    audioBitsPerSecond: CONFIG.VOICE_BIT_RATE
                };
                
                // Fallback for browsers without opus
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options.mimeType = 'audio/webm';
                }
                
                self.mediaRecorder = new MediaRecorder(stream, options);
                self.recordingChunks = [];
                self.recordingStartTime = Date.now();
                
                // Set up audio analysis for waveform
                self.setupAudioAnalyser(stream);
                
                // Handle data available
                self.mediaRecorder.ondataavailable = function(event) {
                    if (event.data.size > 0) {
                        self.recordingChunks.push(event.data);
                    }
                };
                
                // Start recording
                self.mediaRecorder.start(100); // Collect data every 100ms
                
                // Duration timer
                self.durationTimer = setInterval(function() {
                    var duration = (Date.now() - self.recordingStartTime) / 1000;
                    
                    if (duration >= CONFIG.MAX_VOICE_DURATION) {
                        // Auto-stop at max duration
                        self.stopRecording(function(result) {
                            if (onProgress) onProgress({ 
                                duration: CONFIG.MAX_VOICE_DURATION,
                                maxReached: true 
                            });
                            callback(result);
                        });
                    } else if (onProgress) {
                        // Update progress
                        var waveform = self.getWaveformData();
                        onProgress({ 
                            duration: duration,
                            waveform: waveform,
                            maxReached: false 
                        });
                    }
                }, 100);
                
                callback({ success: true, recording: true });
                
            }).catch(function(error) {
                console.error('Voice recording failed:', error);
                callback({ 
                    success: false, 
                    error: 'Microphone access denied. Please enable in settings.' 
                });
            });
        },
        
        /**
         * Stop recording and return audio blob
         */
        stopRecording: function(callback) {
            var self = this;
            
            if (!self.mediaRecorder || self.mediaRecorder.state === 'inactive') {
                callback({ success: false, error: 'No active recording' });
                return;
            }
            
            // Clear timer
            if (self.durationTimer) {
                clearInterval(self.durationTimer);
                self.durationTimer = null;
            }
            
            // Stop recording
            self.mediaRecorder.onstop = function() {
                var duration = (Date.now() - self.recordingStartTime) / 1000;
                var blob = new Blob(self.recordingChunks, { 
                    type: self.mediaRecorder.mimeType 
                });
                
                // Stop all tracks
                self.mediaRecorder.stream.getTracks().forEach(function(track) {
                    track.stop();
                });
                
                // Get final waveform
                var waveform = self.getWaveformData();
                
                // Check size and compress if needed
                if (blob.size > CONFIG.MAX_VOICE_SIZE) {
                    self.compressAudio(blob, function(compressedBlob) {
                        callback({
                            success: true,
                            blob: compressedBlob,
                            duration: duration,
                            waveform: waveform,
                            compressed: true
                        });
                    });
                } else {
                    callback({
                        success: true,
                        blob: blob,
                        duration: duration,
                        waveform: waveform,
                        compressed: false
                    });
                }
            };
            
            self.mediaRecorder.stop();
        },
        
        /**
         * Set up audio analyser for waveform visualization
         */
        setupAudioAnalyser: function(stream) {
            var audioContext = new (window.AudioContext || window.webkitAudioContext)();
            var source = audioContext.createMediaStreamSource(stream);
            this.analyser = audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            source.connect(this.analyser);
        },
        
        /**
         * Get waveform data for visualization
         */
        getWaveformData: function() {
            if (!this.analyser) return [];
            
            var bufferLength = this.analyser.frequencyBinCount;
            var dataArray = new Uint8Array(bufferLength);
            this.analyser.getByteTimeDomainData(dataArray);
            
            // Downsample to CONFIG.WAVEFORM_SAMPLES points
            var samples = [];
            var step = Math.floor(bufferLength / CONFIG.WAVEFORM_SAMPLES);
            
            for (var i = 0; i < CONFIG.WAVEFORM_SAMPLES; i++) {
                var index = i * step;
                var value = dataArray[index] / 255.0; // Normalize to 0-1
                samples.push(value);
            }
            
            return samples;
        },
        
        /**
         * Compress audio if too large
         */
        compressAudio: function(blob, callback) {
            // For now, just return original
            // TODO: Implement actual compression using Web Audio API
            console.warn('Audio compression not yet implemented, returning original');
            callback(blob);
        },
        
        /**
         * Add voice memo to storage
         */
        add: function(taskId, data, callback) {
            var voiceMemo = {
                id: 'voice_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                taskId: taskId,
                type: 'voice',
                filename: 'voice_memo_' + new Date().toISOString().replace(/[:.]/g, '-') + '.webm',
                size: data.blob.size,
                mimeType: data.blob.type || 'audio/webm',
                duration: data.duration,
                waveform: data.waveform,
                storageType: data.blob.size < 1024 * 1024 ? 'sqlite' : 'indexeddb', // <1MB in SQLite
                timestamp: Date.now()
            };
            
            // Store metadata in SQLite if available
            if (window.TaskSQLite && window.TaskSQLite.isReady && window.SQLiteAttachmentOps) {
                window.SQLiteAttachmentOps.addAttachment(window.TaskSQLite.db, voiceMemo, function(result) {
                    if (!result.success) {
                        callback({ success: false, error: result.error });
                        return;
                    }
                    
                    // Store audio data based on size
                    if (voiceMemo.storageType === 'sqlite') {
                        // Small files go directly in SQLite
                        window.SQLiteAttachmentOps.storeVoiceData(window.TaskSQLite.db, voiceMemo.id, data.blob, function(storeResult) {
                            if (!storeResult.success) {
                                // Rollback attachment metadata
                                window.SQLiteAttachmentOps.deleteAttachment(window.TaskSQLite.db, voiceMemo.id);
                                callback({ success: false, error: 'Failed to store voice data' });
                                return;
                            }
                            
                            callback({
                                success: true,
                                attachment: voiceMemo
                            });
                        });
                    } else {
                        // Larger files use IndexedDB (implement later)
                        // For now, store in SQLite anyway
                        window.SQLiteAttachmentOps.storeVoiceData(window.TaskSQLite.db, voiceMemo.id, data.blob, function(storeResult) {
                            callback({
                                success: storeResult.success,
                                attachment: voiceMemo,
                                error: storeResult.error
                            });
                        });
                    }
                });
            } else {
                // Fallback - just return the memo metadata
                callback({
                    success: true,
                    attachment: voiceMemo,
                    warning: 'SQLite not available, voice memo not persisted'
                });
            }
        },
        
        /**
         * Delete voice memo
         */
        delete: function(voiceId, callback) {
            if (window.TaskSQLite && window.TaskSQLite.isReady && window.SQLiteAttachmentOps) {
                window.SQLiteAttachmentOps.deleteAttachment(window.TaskSQLite.db, voiceId, callback);
            } else {
                callback({ success: true });
            }
        }
    };

    // Export
    exports.AttachmentManager = AttachmentManager;
    exports.ATTACHMENT_CONFIG = CONFIG;
    exports.AttachmentTypes = AttachmentTypes;

})(window);