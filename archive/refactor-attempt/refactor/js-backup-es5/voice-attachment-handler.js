/**
 * Voice Attachment Handler
 * Integrates voice recording components with the attachment system
 */

(function() {
  'use strict';
  
  var VoiceAttachmentHandler = {
    // Core components
    recorder: null,
    waveform: null,
    player: null,
    storage: null,
    
    // UI elements
    recordButton: null,
    waveformCanvas: null,
    playerContainer: null,
    
    // State
    isInitialized: false,
    isRecording: false,
    currentTaskId: null,
    currentMode: 'quickThought',
    
    /**
     * Initialize the voice attachment handler
     */
    init: function() {
      var self = this;
      
      // Check browser support
      if (!VoiceRecorder.isSupported()) {
        console.warn('Voice recording not supported');
        return false;
      }
      
      // Initialize storage if available
      if (window.TaskSQLite && window.TaskSQLite.isReady) {
        this.storage = new VoiceAttachment(window.TaskSQLite);
        this.storage.initialize();
      }
      
      // Check for recovery on startup
      VoiceRecovery.instance.checkForRecovery(function(err, recovery) {
        if (recovery) {
          self.showRecoveryPrompt(recovery);
        }
      });
      
      this.isInitialized = true;
      return true;
    },
    
    /**
     * Create voice recording UI for task
     */
    createRecordingUI: function(container, taskId) {
      var self = this;
      
      // Store current task ID
      this.currentTaskId = taskId;
      
      // Create recording container
      var recordingDiv = document.createElement('div');
      recordingDiv.className = 'voice-recording-container';
      recordingDiv.id = 'voice-recording-' + taskId;
      
      // Mode selector
      var modeSelector = this.createModeSelector();
      recordingDiv.appendChild(modeSelector);
      
      // Record button
      this.recordButton = document.createElement('button');
      this.recordButton.className = 'voice-record-button';
      this.recordButton.innerHTML = '<span class="recording-indicator"></span>Tap to Record';
      this.recordButton.onclick = function() {
        self.toggleRecording();
      };
      recordingDiv.appendChild(this.recordButton);
      
      // Waveform canvas
      this.waveformCanvas = document.createElement('canvas');
      this.waveformCanvas.className = 'voice-waveform-canvas';
      recordingDiv.appendChild(this.waveformCanvas);
      
      // Recording info
      var infoDiv = document.createElement('div');
      infoDiv.className = 'voice-recording-info';
      infoDiv.innerHTML = '<span class="recording-duration">0:00</span><span class="recording-size">0 KB</span>';
      recordingDiv.appendChild(infoDiv);
      
      // Controls
      var controlsDiv = document.createElement('div');
      controlsDiv.className = 'voice-recording-controls';
      
      var pauseBtn = document.createElement('button');
      pauseBtn.className = 'voice-control-button';
      pauseBtn.textContent = 'Pause';
      pauseBtn.onclick = function() {
        self.pauseRecording();
      };
      controlsDiv.appendChild(pauseBtn);
      
      var saveBtn = document.createElement('button');
      saveBtn.className = 'voice-control-button primary';
      saveBtn.textContent = 'Save';
      saveBtn.onclick = function() {
        self.stopRecording(true);
      };
      controlsDiv.appendChild(saveBtn);
      
      var discardBtn = document.createElement('button');
      discardBtn.className = 'voice-control-button danger';
      discardBtn.textContent = 'Discard';
      discardBtn.onclick = function() {
        self.stopRecording(false);
      };
      controlsDiv.appendChild(discardBtn);
      
      recordingDiv.appendChild(controlsDiv);
      
      // Player container (hidden initially)
      this.playerContainer = document.createElement('div');
      this.playerContainer.style.display = 'none';
      recordingDiv.appendChild(this.playerContainer);
      
      container.appendChild(recordingDiv);
      
      // Initialize waveform
      this.waveform = new VoiceWaveform(this.waveformCanvas, {
        onAudioLevel: function(level) {
          // Update screen reader with audio level
          self.announceAudioLevel(level);
        }
      });
      
      return recordingDiv;
    },
    
    /**
     * Create mode selector
     */
    createModeSelector: function() {
      var self = this;
      
      var selector = document.createElement('div');
      selector.className = 'voice-mode-selector';
      
      var modes = [
        { id: 'quickThought', label: 'Quick', duration: '30s' },
        { id: 'taskExplanation', label: 'Task', duration: '45s' },
        { id: 'brainDump', label: 'Brain Dump', duration: '3min' }
      ];
      
      modes.forEach(function(mode) {
        var button = document.createElement('button');
        button.className = 'voice-mode-button';
        if (mode.id === self.currentMode) {
          button.className += ' active';
        }
        button.innerHTML = mode.label + '<span class="mode-duration">' + mode.duration + '</span>';
        button.onclick = function() {
          self.selectMode(mode.id);
          // Update active state
          selector.querySelectorAll('.voice-mode-button').forEach(function(btn) {
            btn.classList.remove('active');
          });
          button.classList.add('active');
        };
        selector.appendChild(button);
      });
      
      return selector;
    },
    
    /**
     * Select recording mode
     */
    selectMode: function(mode) {
      this.currentMode = mode;
    },
    
    /**
     * Toggle recording
     */
    toggleRecording: function() {
      if (this.isRecording) {
        this.stopRecording(true);
      } else {
        this.startRecording();
      }
    },
    
    /**
     * Start recording
     */
    startRecording: function() {
      var self = this;
      var startTime = performance.now();
      
      // Create recorder with pre-warm
      this.recorder = new VoiceRecorder({
        mode: this.currentMode,
        preWarm: true
      });
      
      // Set up event handlers
      this.recorder.on('start', function(data) {
        console.log('Recording started with latency:', data.latency + 'ms');
        self.onRecordingStarted(data);
      });
      
      this.recorder.on('data', function(data) {
        self.updateRecordingInfo(data);
      });
      
      this.recorder.on('stop', function(data) {
        self.onRecordingStopped(data);
      });
      
      this.recorder.on('error', function(error) {
        self.handleRecordingError(error);
      });
      
      this.recorder.on('sizelimit', function() {
        alert('Recording size limit reached. Saving automatically.');
      });
      
      this.recorder.on('autostop', function(data) {
        self.showNotification('Recording auto-stopped: ' + data.reason);
      });
      
      // Start recording
      this.recorder.start(function(err, latency) {
        if (err) {
          self.handleRecordingError(err);
        } else {
          // Start auto-save
          VoiceRecovery.instance.startAutoSave(self.recorder, self.currentTaskId, self.currentMode);
        }
      });
    },
    
    /**
     * Pause recording
     */
    pauseRecording: function() {
      if (!this.recorder || !this.isRecording) return;
      
      var self = this;
      this.recorder.pause(function(err) {
        if (!err) {
          self.recordButton.classList.add('paused');
          self.recordButton.innerHTML = '<span class="recording-indicator"></span>Resume Recording';
          self.waveform.pause();
        }
      });
    },
    
    /**
     * Stop recording
     */
    stopRecording: function(save) {
      var self = this;
      
      if (!this.recorder || !this.isRecording) return;
      
      // Stop auto-save
      VoiceRecovery.instance.stopAutoSave();
      
      this.recorder.stop(function(err) {
        if (err) {
          self.handleRecordingError(err);
        }
      });
      
      // Save flag will be handled in onRecordingStopped
      this._shouldSave = save;
    },
    
    /**
     * Handle recording started
     */
    onRecordingStarted: function(data) {
      this.isRecording = true;
      
      // Update UI
      this.recordButton.classList.add('recording');
      this.recordButton.innerHTML = '<span class="recording-indicator"></span>Recording...';
      
      var container = this.recordButton.closest('.voice-recording-container');
      container.classList.add('active');
      
      // Connect waveform to stream
      if (this.recorder.stream) {
        this.waveform.connectStream(this.recorder.stream);
        this.waveform.start('recording');
      }
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Update info
      this.updateDuration();
    },
    
    /**
     * Handle recording stopped
     */
    onRecordingStopped: function(data) {
      var self = this;
      
      this.isRecording = false;
      
      // Update UI
      this.recordButton.classList.remove('recording', 'paused');
      this.recordButton.innerHTML = '<span class="recording-indicator"></span>Tap to Record';
      
      var container = this.recordButton.closest('.voice-recording-container');
      container.classList.remove('active');
      
      // Stop waveform
      if (this.waveform) {
        this.waveform.stop();
      }
      
      // Clear recovery data
      VoiceRecovery.instance.clearRecovery();
      
      // Save or discard
      if (this._shouldSave && data.blob && data.blob.size > 0) {
        this.saveRecording(data);
      } else {
        this.discardRecording();
      }
      
      // Cleanup
      if (this.recorder) {
        this.recorder.cleanup();
        this.recorder = null;
      }
    },
    
    /**
     * Save recording
     */
    saveRecording: function(data) {
      var self = this;
      
      if (!this.storage) {
        console.error('Voice storage not initialized');
        return;
      }
      
      var metadata = {
        duration: data.duration,
        mode: this.currentMode,
        format: data.blob.type
      };
      
      this.storage.save(this.currentTaskId, data.blob, metadata, function(err, attachment) {
        if (err) {
          console.error('Failed to save recording:', err);
          alert('Failed to save recording. Please try again.');
        } else {
          // Success feedback
          self.showNotification('Voice memo saved!');
          
          // Show player
          self.showPlayer(data.blob);
          
          // Trigger attachment added event
          document.dispatchEvent(new CustomEvent('attachmentAdded', {
            detail: {
              taskId: self.currentTaskId,
              attachment: attachment,
              type: 'voice'
            }
          }));
        }
      });
    },
    
    /**
     * Discard recording
     */
    discardRecording: function() {
      this.showNotification('Recording discarded');
    },
    
    /**
     * Show player for recorded audio
     */
    showPlayer: function(blob) {
      if (!this.playerContainer) return;
      
      // Show container
      this.playerContainer.style.display = 'block';
      
      // Create player
      this.player = new VoicePlayer(this.playerContainer, {
        onComplete: function() {
          console.log('Playback complete');
        }
      });
      
      // Load audio
      this.player.load(blob);
    },
    
    /**
     * Update recording duration
     */
    updateDuration: function() {
      var self = this;
      
      if (!this.isRecording || !this.recorder) return;
      
      var duration = this.recorder.getDuration();
      var minutes = Math.floor(duration / 60);
      var seconds = duration % 60;
      var formatted = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
      
      var durationEl = document.querySelector('.recording-duration');
      if (durationEl) {
        durationEl.textContent = formatted;
      }
      
      // Update again in 1 second
      setTimeout(function() {
        self.updateDuration();
      }, 1000);
    },
    
    /**
     * Update recording info
     */
    updateRecordingInfo: function(data) {
      var sizeEl = document.querySelector('.recording-size');
      if (sizeEl) {
        var sizeKB = Math.round(data.size / 1024);
        sizeEl.textContent = sizeKB + ' KB';
      }
    },
    
    /**
     * Handle recording error
     */
    handleRecordingError: function(error) {
      console.error('Recording error:', error);
      
      var message = 'Recording failed';
      if (error.code === 'PERMISSION_DENIED') {
        message = 'Microphone access denied. Please check your browser settings.';
      } else if (error.code === 'NOT_SUPPORTED') {
        message = 'Voice recording is not supported in your browser.';
      }
      
      alert(message);
      
      // Reset UI
      this.isRecording = false;
      this.recordButton.classList.remove('recording', 'paused');
      this.recordButton.innerHTML = '<span class="recording-indicator"></span>Tap to Record';
    },
    
    /**
     * Show recovery prompt
     */
    showRecoveryPrompt: function(recovery) {
      var self = this;
      
      VoiceRecovery.instance.showRecoveryPrompt(recovery, {
        onKeep: function(data) {
          // Save recovered recording
          self.currentTaskId = data.taskId;
          self.saveRecording({
            blob: data.blob,
            duration: data.duration,
            size: data.size
          });
        },
        onDiscard: function() {
          console.log('Recovery discarded');
        }
      });
    },
    
    /**
     * Announce audio level for screen readers
     */
    announceAudioLevel: function(level) {
      // Create or update live region
      var announcer = document.getElementById('voice-level-announcer');
      if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'voice-level-announcer';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.style.position = 'absolute';
        announcer.style.left = '-10000px';
        document.body.appendChild(announcer);
      }
      
      announcer.textContent = 'Audio level: ' + level;
    },
    
    /**
     * Show notification
     */
    showNotification: function(message) {
      // Could integrate with a notification system
      console.log('Notification:', message);
    },
    
    /**
     * Clean up resources
     */
    destroy: function() {
      if (this.recorder) {
        this.recorder.cleanup();
        this.recorder = null;
      }
      
      if (this.waveform) {
        this.waveform.destroy();
        this.waveform = null;
      }
      
      if (this.player) {
        this.player.destroy();
        this.player = null;
      }
      
      this.isRecording = false;
      this.currentTaskId = null;
    }
  };
  
  // Export to global scope
  window.VoiceAttachmentHandler = VoiceAttachmentHandler;
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      VoiceAttachmentHandler.init();
    });
  } else {
    VoiceAttachmentHandler.init();
  }
})();