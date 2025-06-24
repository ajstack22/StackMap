/**
 * Voice Player - Audio playback with speed controls
 * Designed for ADHD users with simple, clear controls
 */

var VoicePlayer = (function() {
  'use strict';
  
  // Speed presets
  var SPEED_PRESETS = [
    { value: 0.75, label: '0.75x' },
    { value: 1, label: '1x' },
    { value: 1.5, label: '1.5x' },
    { value: 2, label: '2x' }
  ];
  
  // Constructor
  function VoicePlayer(container, options) {
    this.container = container;
    this.options = options || {};
    
    // Audio element
    this.audio = null;
    this.currentBlob = null;
    this.currentSpeed = 1;
    
    // UI elements
    this.playButton = null;
    this.progressBar = null;
    this.progressFill = null;
    this.timeDisplay = null;
    this.speedButtons = {};
    
    // State
    this.isPlaying = false;
    this.duration = 0;
    
    // Callbacks
    this.onComplete = this.options.onComplete || null;
    this.onError = this.options.onError || null;
    
    // Initialize UI
    this.createUI();
  }
  
  // Create player UI
  VoicePlayer.prototype.createUI = function() {
    var self = this;
    
    // Clear container
    this.container.innerHTML = '';
    this.container.className = 'voice-player';
    
    // Player controls container
    var controls = document.createElement('div');
    controls.className = 'voice-player-controls';
    
    // Play/Pause button
    this.playButton = document.createElement('button');
    this.playButton.className = 'voice-play-button';
    this.playButton.innerHTML = '▶';
    this.playButton.setAttribute('aria-label', 'Play');
    this.playButton.onclick = function() {
      self.togglePlayback();
    };
    controls.appendChild(this.playButton);
    
    // Progress bar
    var progressContainer = document.createElement('div');
    progressContainer.className = 'voice-progress-bar';
    progressContainer.onclick = function(e) {
      self.seek(e);
    };
    
    this.progressFill = document.createElement('div');
    this.progressFill.className = 'voice-progress-fill';
    progressContainer.appendChild(this.progressFill);
    controls.appendChild(progressContainer);
    
    // Time display
    this.timeDisplay = document.createElement('div');
    this.timeDisplay.className = 'voice-time-display';
    this.timeDisplay.textContent = '0:00 / 0:00';
    controls.appendChild(this.timeDisplay);
    
    this.container.appendChild(controls);
    
    // Speed controls
    var speedControls = document.createElement('div');
    speedControls.className = 'voice-speed-controls';
    
    for (var i = 0; i < SPEED_PRESETS.length; i++) {
      var preset = SPEED_PRESETS[i];
      var button = document.createElement('button');
      button.className = 'voice-speed-button';
      if (preset.value === this.currentSpeed) {
        button.className += ' active';
      }
      button.textContent = preset.label;
      button.setAttribute('data-speed', preset.value);
      button.onclick = (function(speed) {
        return function() {
          self.setSpeed(speed);
        };
      })(preset.value);
      
      this.speedButtons[preset.value] = button;
      speedControls.appendChild(button);
    }
    
    this.container.appendChild(speedControls);
  };
  
  // Load audio blob
  VoicePlayer.prototype.load = function(blob, callback) {
    var self = this;
    
    if (this.audio) {
      this.stop();
      this.audio = null;
    }
    
    try {
      // Create audio element
      this.audio = new Audio();
      this.currentBlob = blob;
      
      // Convert blob to URL
      var url = URL.createObjectURL(blob);
      this.audio.src = url;
      
      // Set up event handlers
      this.audio.onloadedmetadata = function() {
        self.duration = self.audio.duration;
        self.updateTimeDisplay();
        if (callback) callback(null);
      };
      
      this.audio.ontimeupdate = function() {
        self.updateProgress();
      };
      
      this.audio.onended = function() {
        self.onEnded();
      };
      
      this.audio.onerror = function(e) {
        var error = new Error('Failed to load audio');
        if (self.onError) self.onError(error);
        if (callback) callback(error);
      };
      
      // Load audio
      this.audio.load();
    } catch (err) {
      if (this.onError) this.onError(err);
      if (callback) callback(err);
    }
  };
  
  // Toggle playback
  VoicePlayer.prototype.togglePlayback = function() {
    if (!this.audio) return;
    
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  };
  
  // Play audio
  VoicePlayer.prototype.play = function() {
    var self = this;
    
    if (!this.audio) return;
    
    this.audio.play().then(function() {
      self.isPlaying = true;
      self.playButton.innerHTML = '⏸';
      self.playButton.setAttribute('aria-label', 'Pause');
      self.playButton.classList.add('playing');
    }).catch(function(err) {
      console.error('Playback failed:', err);
      if (self.onError) self.onError(err);
    });
  };
  
  // Pause audio
  VoicePlayer.prototype.pause = function() {
    if (!this.audio) return;
    
    this.audio.pause();
    this.isPlaying = false;
    this.playButton.innerHTML = '▶';
    this.playButton.setAttribute('aria-label', 'Play');
    this.playButton.classList.remove('playing');
  };
  
  // Stop audio
  VoicePlayer.prototype.stop = function() {
    if (!this.audio) return;
    
    this.pause();
    this.audio.currentTime = 0;
    this.updateProgress();
  };
  
  // Seek to position
  VoicePlayer.prototype.seek = function(event) {
    if (!this.audio || !this.duration) return;
    
    var progressBar = event.currentTarget;
    var rect = progressBar.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var percentage = x / rect.width;
    var time = percentage * this.duration;
    
    this.audio.currentTime = Math.max(0, Math.min(time, this.duration));
    this.updateProgress();
  };
  
  // Set playback speed
  VoicePlayer.prototype.setSpeed = function(speed) {
    this.currentSpeed = speed;
    
    if (this.audio) {
      this.audio.playbackRate = speed;
    }
    
    // Update button states
    for (var key in this.speedButtons) {
      if (this.speedButtons.hasOwnProperty(key)) {
        var button = this.speedButtons[key];
        var buttonSpeed = parseFloat(button.getAttribute('data-speed'));
        if (buttonSpeed === speed) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      }
    }
  };
  
  // Update progress bar
  VoicePlayer.prototype.updateProgress = function() {
    if (!this.audio || !this.duration) return;
    
    var percentage = (this.audio.currentTime / this.duration) * 100;
    this.progressFill.style.width = percentage + '%';
    
    this.updateTimeDisplay();
  };
  
  // Update time display
  VoicePlayer.prototype.updateTimeDisplay = function() {
    var current = this.audio ? this.audio.currentTime : 0;
    var duration = this.duration || 0;
    
    this.timeDisplay.textContent = 
      this.formatTime(current) + ' / ' + this.formatTime(duration);
  };
  
  // Format time in MM:SS
  VoicePlayer.prototype.formatTime = function(seconds) {
    var minutes = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return minutes + ':' + (secs < 10 ? '0' : '') + secs;
  };
  
  // Handle playback ended
  VoicePlayer.prototype.onEnded = function() {
    this.isPlaying = false;
    this.playButton.innerHTML = '▶';
    this.playButton.setAttribute('aria-label', 'Play');
    this.playButton.classList.remove('playing');
    
    if (this.onComplete) {
      this.onComplete();
    }
  };
  
  // Clean up resources
  VoicePlayer.prototype.destroy = function() {
    if (this.audio) {
      this.stop();
      
      // Revoke object URL
      if (this.audio.src && this.audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(this.audio.src);
      }
      
      this.audio = null;
    }
    
    this.currentBlob = null;
    this.container.innerHTML = '';
  };
  
  // Static method to check browser support
  VoicePlayer.isSupported = function() {
    return !!(window.Audio && window.URL && URL.createObjectURL);
  };
  
  return VoicePlayer;
})();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoicePlayer;
}