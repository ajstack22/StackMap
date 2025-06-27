/**
 * Voice Recorder - ES5 compatible MediaRecorder wrapper
 * Optimized for sub-200ms start latency for ADHD users
 */

var VoiceRecorder = (function() {
  'use strict';
  
  // Recording modes configuration
  var RECORDING_MODES = {
    quickThought: { 
      maxDuration: 30,
      autoStop: true,
      silenceDetection: 3
    },
    taskExplanation: { 
      maxDuration: 45,
      pauseEnabled: true,
      autoStop: false
    },
    brainDump: { 
      maxDuration: 180,
      segmentAt: 120,
      pauseEnabled: true
    }
  };
  
  // Supported audio formats in priority order
  var SUPPORTED_FORMATS = [
    'audio/webm;codecs=opus',
    'audio/mp4',
    'audio/ogg',
    'audio/wav'
  ];
  
  // Format-specific bitrates for size estimation
  var BITRATES = {
    'audio/webm;codecs=opus': 64000,  // ~480KB/min
    'audio/mp4': 96000,                // ~720KB/min
    'audio/ogg': 80000,                // ~600KB/min
    'audio/wav': 705600                // ~5.3MB/min (uncompressed)
  };
  
  // Constructor
  function VoiceRecorder(options) {
    this.options = options || {};
    this.mode = this.options.mode || 'quickThought';
    this.stream = null;
    this.mediaRecorder = null;
    this.chunks = [];
    this.startTime = null;
    this.pausedDuration = 0;
    this.lastPauseTime = null;
    this.isRecording = false;
    this.isPaused = false;
    this.currentSize = 0;
    this.silenceTimer = null;
    this.durationTimer = null;
    this.callbacks = {};
    
    // Pre-warm stream for faster start
    if (this.options.preWarm) {
      this.initialize();
    }
  }
  
  // Get supported audio format
  VoiceRecorder.prototype.getSupportedFormat = function() {
    if (!window.MediaRecorder) return null;
    
    for (var i = 0; i < SUPPORTED_FORMATS.length; i++) {
      if (MediaRecorder.isTypeSupported && 
          MediaRecorder.isTypeSupported(SUPPORTED_FORMATS[i])) {
        return SUPPORTED_FORMATS[i];
      }
    }
    
    // Default to webm if isTypeSupported not available
    return 'audio/webm';
  };
  
  // Initialize recorder (pre-warm for fast start)
  VoiceRecorder.prototype.initialize = function(callback) {
    var self = this;
    
    // Check browser support
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      var error = new Error('Voice recording not supported');
      error.code = 'NOT_SUPPORTED';
      if (callback) callback(error);
      return Promise.reject(error);
    }
    
    // Get supported format
    var format = this.getSupportedFormat();
    if (!format) {
      var formatError = new Error('No supported audio format');
      formatError.code = 'NO_FORMAT';
      if (callback) callback(formatError);
      return Promise.reject(formatError);
    }
    
    // Request microphone access
    return navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    }).then(function(stream) {
      self.stream = stream;
      
      try {
        // Create MediaRecorder with optimal settings
        self.mediaRecorder = new MediaRecorder(stream, {
          mimeType: format,
          audioBitsPerSecond: BITRATES[format] || 64000
        });
        
        // Set up event handlers
        self.setupEventHandlers();
        
        if (callback) callback(null);
        return self;
      } catch (err) {
        self.cleanup();
        if (callback) callback(err);
        throw err;
      }
    }).catch(function(err) {
      // Handle permission denial
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        err.code = 'PERMISSION_DENIED';
      }
      if (callback) callback(err);
      throw err;
    });
  };
  
  // Set up MediaRecorder event handlers
  VoiceRecorder.prototype.setupEventHandlers = function() {
    var self = this;
    
    // Collect audio chunks
    this.mediaRecorder.ondataavailable = function(event) {
      if (event.data && event.data.size > 0) {
        self.chunks.push(event.data);
        self.currentSize += event.data.size;
        
        // Check size limit (10MB)
        if (self.currentSize > 10485760) {
          self.stop();
          self.trigger('sizelimit');
        } else if (self.currentSize > 8388608) { // 8MB warning
          self.trigger('sizewarning', {
            size: self.currentSize,
            remaining: self.getRemainingTime()
          });
        }
        
        // Trigger data event for auto-save
        self.trigger('data', {
          chunks: self.chunks,
          size: self.currentSize
        });
      }
    };
    
    // Handle recording stop
    this.mediaRecorder.onstop = function() {
      self.isRecording = false;
      self.isPaused = false;
      self.clearTimers();
      
      // Create blob from chunks
      var blob = new Blob(self.chunks, { 
        type: self.mediaRecorder.mimeType 
      });
      
      self.trigger('stop', {
        blob: blob,
        duration: self.getDuration(),
        size: blob.size
      });
    };
    
    // Handle errors
    this.mediaRecorder.onerror = function(event) {
      self.trigger('error', event.error);
    };
  };
  
  // Start recording
  VoiceRecorder.prototype.start = function(callback) {
    var self = this;
    var startMark = Date.now(); // Mark for latency measurement
    
    // Initialize if not ready
    if (!this.mediaRecorder) {
      return this.initialize(function(err) {
        if (err) {
          if (callback) callback(err);
          return;
        }
        self.start(callback);
      });
    }
    
    try {
      // Reset state
      this.chunks = [];
      this.currentSize = 0;
      this.startTime = Date.now();
      this.pausedDuration = 0;
      this.lastPauseTime = null;
      
      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      
      // Set up auto-stop timer
      this.setupDurationTimer();
      
      // Set up silence detection
      if (RECORDING_MODES[this.mode].silenceDetection) {
        this.setupSilenceDetection();
      }
      
      // Measure and report latency
      var latency = Date.now() - startMark;
      console.log('Recording start latency:', latency + 'ms');
      
      this.trigger('start', {
        mode: this.mode,
        maxDuration: RECORDING_MODES[this.mode].maxDuration,
        latency: latency
      });
      
      if (callback) callback(null, latency);
    } catch (err) {
      this.trigger('error', err);
      if (callback) callback(err);
    }
  };
  
  // Stop recording
  VoiceRecorder.prototype.stop = function(callback) {
    if (!this.isRecording || !this.mediaRecorder) {
      if (callback) callback(new Error('Not recording'));
      return;
    }
    
    try {
      this.mediaRecorder.stop();
      if (callback) callback(null);
    } catch (err) {
      this.trigger('error', err);
      if (callback) callback(err);
    }
  };
  
  // Pause recording
  VoiceRecorder.prototype.pause = function(callback) {
    if (!this.isRecording || this.isPaused || !RECORDING_MODES[this.mode].pauseEnabled) {
      if (callback) callback(new Error('Cannot pause'));
      return;
    }
    
    if (this.mediaRecorder.pause) {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.lastPauseTime = Date.now();
      this.trigger('pause');
      if (callback) callback(null);
    } else {
      if (callback) callback(new Error('Pause not supported'));
    }
  };
  
  // Resume recording
  VoiceRecorder.prototype.resume = function(callback) {
    if (!this.isRecording || !this.isPaused) {
      if (callback) callback(new Error('Not paused'));
      return;
    }
    
    if (this.mediaRecorder.resume) {
      if (this.lastPauseTime) {
        this.pausedDuration += Date.now() - this.lastPauseTime;
      }
      this.mediaRecorder.resume();
      this.isPaused = false;
      this.trigger('resume');
      if (callback) callback(null);
    } else {
      if (callback) callback(new Error('Resume not supported'));
    }
  };
  
  // Get current recording duration in seconds
  VoiceRecorder.prototype.getDuration = function() {
    if (!this.startTime) return 0;
    
    var elapsed = Date.now() - this.startTime - this.pausedDuration;
    if (this.isPaused && this.lastPauseTime) {
      elapsed -= (Date.now() - this.lastPauseTime);
    }
    
    return Math.floor(elapsed / 1000);
  };
  
  // Get remaining time based on current size and format
  VoiceRecorder.prototype.getRemainingTime = function() {
    var format = this.mediaRecorder ? this.mediaRecorder.mimeType : null;
    var bitrate = BITRATES[format] || 96000;
    var bytesPerSecond = bitrate / 8;
    var remainingBytes = 10485760 - this.currentSize; // 10MB limit
    return Math.floor(remainingBytes / bytesPerSecond);
  };
  
  // Set up duration timer for auto-stop
  VoiceRecorder.prototype.setupDurationTimer = function() {
    var self = this;
    var maxDuration = RECORDING_MODES[this.mode].maxDuration;
    
    if (!maxDuration || !RECORDING_MODES[this.mode].autoStop) return;
    
    this.durationTimer = setTimeout(function() {
      if (self.isRecording) {
        self.stop();
        self.trigger('autostop', { reason: 'duration' });
      }
    }, maxDuration * 1000);
  };
  
  // Set up silence detection
  VoiceRecorder.prototype.setupSilenceDetection = function() {
    // TODO: Implement Web Audio API silence detection
    // For now, this is a placeholder
  };
  
  // Clear all timers
  VoiceRecorder.prototype.clearTimers = function() {
    if (this.durationTimer) {
      clearTimeout(this.durationTimer);
      this.durationTimer = null;
    }
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  };
  
  // Clean up resources
  VoiceRecorder.prototype.cleanup = function() {
    this.clearTimers();
    
    if (this.mediaRecorder && this.isRecording) {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(function(track) {
        track.stop();
      });
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.chunks = [];
    this.isRecording = false;
  };
  
  // Event handling
  VoiceRecorder.prototype.on = function(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  };
  
  VoiceRecorder.prototype.trigger = function(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(function(callback) {
        callback(data);
      });
    }
  };
  
  // Static method to check browser support
  VoiceRecorder.isSupported = function() {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              window.MediaRecorder);
  };
  
  // Static method to get supported formats
  VoiceRecorder.getSupportedFormats = function() {
    if (!window.MediaRecorder) return [];
    
    var supported = [];
    for (var i = 0; i < SUPPORTED_FORMATS.length; i++) {
      if (MediaRecorder.isTypeSupported && 
          MediaRecorder.isTypeSupported(SUPPORTED_FORMATS[i])) {
        supported.push(SUPPORTED_FORMATS[i]);
      }
    }
    return supported;
  };
  
  return VoiceRecorder;
})();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceRecorder;
}