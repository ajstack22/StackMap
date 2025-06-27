/**
 * Voice Recovery - Crash and interruption recovery system
 * Ensures no voice recordings are lost due to app crashes or interruptions
 */

const VoiceRecovery = (function() {
  'use strict';
  
  // Recovery storage keys
  const RECOVERY_KEY = 'voice_recovery';
  const RECOVERY_METADATA_KEY = 'voice_recovery_meta';
  
  // Recovery check interval (5 seconds during recording)
  const AUTO_SAVE_INTERVAL = 5000;
  
  // Constructor
  function VoiceRecovery() {
    this.isRecovering = false;
    this.autoSaveTimer = null;
    this.currentRecording = null;
  }
  
  // Check for recoverable recordings on startup
  VoiceRecovery.prototype.checkForRecovery = function(callback) {
    try {
      const recoveryData = localStorage.getItem(RECOVERY_KEY);
      const metadata = localStorage.getItem(RECOVERY_METADATA_KEY);
      
      if (!recoveryData || !metadata) {
        if (callback) callback(null, null);
        return null;
      }
      
      // Parse metadata
      const meta = JSON.parse(metadata);
      
      // Check if recovery is too old (> 24 hours)
      const age = Date.now() - meta.timestamp;
      if (age > 86400000) {
        this.clearRecovery();
        if (callback) callback(null, null);
        return null;
      }
      
      // Convert base64 back to blob
      const blob = this.base64ToBlob(recoveryData, meta.mimeType);
      
      const recovery = {
        blob: blob,
        taskId: meta.taskId,
        timestamp: meta.timestamp,
        duration: meta.duration,
        mode: meta.mode,
        size: blob.size
      };
      
      if (callback) callback(null, recovery);
      return recovery;
    } catch (err) {
      console.error('Failed to check recovery:', err);
      // Clear corrupted recovery data
      this.clearRecovery();
      if (callback) callback(err, null);
      return null;
    }
  };
  
  // Start auto-save for recording
  VoiceRecovery.prototype.startAutoSave = function(recorder, taskId, mode) {
    const self = this;
    
    // Clear any existing timer
    this.stopAutoSave();
    
    // Store current recording info
    this.currentRecording = {
      recorder: recorder,
      taskId: taskId,
      mode: mode,
      startTime: Date.now()
    };
    
    // Save immediately
    this.saveRecoveryData();
    
    // Set up periodic saves
    this.autoSaveTimer = setInterval(function() {
      self.saveRecoveryData();
    }, AUTO_SAVE_INTERVAL);
  };
  
  // Stop auto-save
  VoiceRecovery.prototype.stopAutoSave = function() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    this.currentRecording = null;
  };
  
  // Save current recording to recovery storage
  VoiceRecovery.prototype.saveRecoveryData = function() {
    if (!this.currentRecording) return;
    
    try {
      const recorder = this.currentRecording.recorder;
      
      // Request current data from recorder
      if (recorder.mediaRecorder && recorder.mediaRecorder.state === 'recording') {
        recorder.mediaRecorder.requestData();
      }
      
      // Wait a bit for data to be available
      const self = this;
      setTimeout(function() {
        self.saveChunks();
      }, 100);
    } catch (err) {
      console.error('Failed to save recovery data:', err);
    }
  };
  
  // Save chunks to localStorage
  VoiceRecovery.prototype.saveChunks = function() {
    if (!this.currentRecording) return;
    
    const recorder = this.currentRecording.recorder;
    const chunks = recorder.chunks;
    
    if (!chunks || chunks.length === 0) return;
    
    try {
      // Create blob from chunks
      const blob = new Blob(chunks, { 
        type: recorder.mediaRecorder.mimeType 
      });
      
      // Check size limit (localStorage typically has 5-10MB limit)
      if (blob.size > 5242880) { // 5MB safety limit
        console.warn('Recording too large for recovery storage');
        return;
      }
      
      // Convert to base64
      const self = this;
      this.blobToBase64(blob, function(base64) {
        try {
          // Save to localStorage
          localStorage.setItem(RECOVERY_KEY, base64);
          
          // Save metadata
          const metadata = {
            taskId: self.currentRecording.taskId,
            mode: self.currentRecording.mode,
            timestamp: self.currentRecording.startTime,
            duration: recorder.getDuration(),
            mimeType: recorder.mediaRecorder.mimeType,
            size: blob.size
          };
          
          localStorage.setItem(RECOVERY_METADATA_KEY, JSON.stringify(metadata));
        } catch (err) {
          if (err.name === 'QuotaExceededError') {
            console.warn('Recovery storage full');
          } else {
            console.error('Failed to save recovery:', err);
          }
        }
      });
    } catch (err) {
      console.error('Failed to create recovery blob:', err);
    }
  };
  
  // Show recovery prompt to user
  VoiceRecovery.prototype.showRecoveryPrompt = function(recoveryData, callbacks) {
    const self = this;
    this.isRecovering = true;
    
    // Format duration for display
    const duration = recoveryData.duration || 0;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const durationText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    // Create recovery UI
    const promptHtml = 
      `<div class="voice-recovery-prompt" role="dialog" aria-labelledby="recovery-title"><div class="recovery-content"><h3 id="recovery-title">Recover Recording?</h3><p>Found an unsaved recording (${durationText})</p><div class="recovery-info"><span class="recovery-size">${this.formatSize(recoveryData.size)}</span><span class="recovery-time">${this.formatTime(recoveryData.timestamp)}</span></div><div class="recovery-actions"><button class="btn-keep" onclick="VoiceRecovery.handleKeep()">Keep Recording</button><button class="btn-discard" onclick="VoiceRecovery.handleDiscard()">Discard</button></div></div></div>`;
    
    // Add to DOM
    const container = document.createElement('div');
    container.innerHTML = promptHtml;
    document.body.appendChild(container.firstElementChild);
    
    // Store callbacks
    this.recoveryCallbacks = callbacks || {};
    
    // Focus on keep button
    setTimeout(function() {
      const keepBtn = document.querySelector('.btn-keep');
      if (keepBtn) keepBtn.focus();
    }, 100);
  };
  
  // Handle keep recovery
  VoiceRecovery.handleKeep = function() {
    const instance = VoiceRecovery.instance;
    if (!instance) return;
    
    instance.checkForRecovery(function(err, recovery) {
      if (err || !recovery) {
        instance.hideRecoveryPrompt();
        return;
      }
      
      // Clear recovery storage
      instance.clearRecovery();
      instance.hideRecoveryPrompt();
      
      // Trigger callback
      if (instance.recoveryCallbacks.onKeep) {
        instance.recoveryCallbacks.onKeep(recovery);
      }
    });
  };
  
  // Handle discard recovery
  VoiceRecovery.handleDiscard = function() {
    const instance = VoiceRecovery.instance;
    if (!instance) return;
    
    // Clear recovery storage
    instance.clearRecovery();
    instance.hideRecoveryPrompt();
    
    // Trigger callback
    if (instance.recoveryCallbacks.onDiscard) {
      instance.recoveryCallbacks.onDiscard();
    }
  };
  
  // Hide recovery prompt
  VoiceRecovery.prototype.hideRecoveryPrompt = function() {
    const prompt = document.querySelector('.voice-recovery-prompt');
    if (prompt) {
      prompt.remove();
    }
    this.isRecovering = false;
  };
  
  // Clear recovery storage
  VoiceRecovery.prototype.clearRecovery = function() {
    try {
      localStorage.removeItem(RECOVERY_KEY);
      localStorage.removeItem(RECOVERY_METADATA_KEY);
    } catch (err) {
      console.error('Failed to clear recovery:', err);
    }
  };
  
  // Convert blob to base64
  VoiceRecovery.prototype.blobToBase64 = function(blob, callback) {
    const reader = new FileReader();
    
    reader.onload = function() {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      callback(base64);
    };
    
    reader.onerror = function() {
      callback(null);
    };
    
    reader.readAsDataURL(blob);
  };
  
  // Convert base64 to blob
  VoiceRecovery.prototype.base64ToBlob = function(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };
  
  // Format file size for display
  VoiceRecovery.prototype.formatSize = function(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };
  
  // Format timestamp for display
  VoiceRecovery.prototype.formatTime = function(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minutes ago`;
    } else if (diff < 86400000) { // Less than 24 hours
      const hours = Math.floor(diff / 3600000);
      return `${hours} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Create singleton instance
  VoiceRecovery.instance = new VoiceRecovery();
  
  return VoiceRecovery;
})();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceRecovery;
}