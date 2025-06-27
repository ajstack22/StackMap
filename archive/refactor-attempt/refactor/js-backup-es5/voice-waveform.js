/**
 * Voice Waveform - Real-time audio visualization
 * 60fps rendering with high contrast for ADHD users
 */

var VoiceWaveform = (function() {
  'use strict';
  
  // Constructor
  function VoiceWaveform(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.options = options || {};
    
    // Visualization settings
    this.barWidth = this.options.barWidth || 3;
    this.barGap = this.options.barGap || 2;
    this.barCount = Math.floor(canvas.width / (this.barWidth + this.barGap));
    this.smoothing = this.options.smoothing || 0.8;
    this.minHeight = this.options.minHeight || 2;
    this.maxHeight = canvas.height * 0.9;
    
    // Colors for different states
    this.colors = {
      recording: this.options.recordingColor || '#DC2626', // Red
      paused: this.options.pausedColor || '#F59E0B',      // Amber
      playing: this.options.playingColor || '#10B981',    // Green
      inactive: this.options.inactiveColor || '#6B7280'   // Gray
    };
    
    // Audio analysis
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.animationId = null;
    this.isActive = false;
    this.currentState = 'inactive';
    
    // Performance optimization
    this.lastDrawTime = 0;
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;
    
    // Accessibility
    this.audioLevelCallback = this.options.onAudioLevel || null;
    this.lastAudioLevel = 'silent';
    this.audioLevelUpdateInterval = 2000; // Update every 2 seconds
    this.lastAudioLevelUpdate = 0;
    
    // Initialize canvas
    this.setupCanvas();
  }
  
  // Set up canvas for high DPI displays
  VoiceWaveform.prototype.setupCanvas = function() {
    var dpr = window.devicePixelRatio || 1;
    var rect = this.canvas.getBoundingClientRect();
    
    // Set actual canvas size
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    // Scale context to match device pixel ratio
    this.ctx.scale(dpr, dpr);
    
    // Set canvas CSS size
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    // Recalculate bar count
    this.barCount = Math.floor(rect.width / (this.barWidth + this.barGap));
  };
  
  // Connect to audio stream for recording
  VoiceWaveform.prototype.connectStream = function(stream) {
    var self = this;
    
    try {
      // Create audio context if needed
      if (!this.audioContext) {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
      }
      
      // Create analyser
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = this.smoothing;
      
      // Connect stream to analyser
      var source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);
      
      // Create data array for frequency data
      var bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      return true;
    } catch (err) {
      console.error('Failed to connect audio stream:', err);
      return false;
    }
  };
  
  // Connect to audio element for playback
  VoiceWaveform.prototype.connectAudio = function(audioElement) {
    var self = this;
    
    try {
      // Create audio context if needed
      if (!this.audioContext) {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
      }
      
      // Create analyser
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = this.smoothing;
      
      // Connect audio element to analyser
      var source = this.audioContext.createMediaElementSource(audioElement);
      source.connect(this.analyser);
      source.connect(this.audioContext.destination);
      
      // Create data array
      var bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      return true;
    } catch (err) {
      console.error('Failed to connect audio element:', err);
      return false;
    }
  };
  
  // Start visualization
  VoiceWaveform.prototype.start = function(state) {
    this.currentState = state || 'recording';
    this.isActive = true;
    this.lastDrawTime = 0;
    this.draw();
  };
  
  // Stop visualization
  VoiceWaveform.prototype.stop = function() {
    this.isActive = false;
    this.currentState = 'inactive';
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Clear canvas
    this.clear();
  };
  
  // Pause visualization
  VoiceWaveform.prototype.pause = function() {
    this.currentState = 'paused';
  };
  
  // Resume visualization
  VoiceWaveform.prototype.resume = function() {
    this.currentState = 'recording';
  };
  
  // Main draw loop
  VoiceWaveform.prototype.draw = function() {
    var self = this;
    var now = Date.now();
    var elapsed = now - this.lastDrawTime;
    
    // Request next frame
    if (this.isActive) {
      this.animationId = requestAnimationFrame(function() {
        self.draw();
      });
    }
    
    // Limit frame rate for performance
    if (elapsed < this.frameInterval) return;
    
    this.lastDrawTime = now - (elapsed % this.frameInterval);
    
    // Clear canvas
    this.clear();
    
    // Get audio data
    var levels = this.getAudioLevels();
    
    // Update accessibility audio level
    this.updateAudioLevel(levels);
    
    // Draw bars
    this.drawBars(levels);
  };
  
  // Get audio levels from analyser
  VoiceWaveform.prototype.getAudioLevels = function() {
    var levels = [];
    
    if (this.analyser && this.dataArray) {
      // Get frequency data
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Sample data points for visualization
      var samplesPerBar = Math.floor(this.dataArray.length / this.barCount);
      
      for (var i = 0; i < this.barCount; i++) {
        var sum = 0;
        var start = i * samplesPerBar;
        var end = start + samplesPerBar;
        
        // Average the samples for this bar
        for (var j = start; j < end && j < this.dataArray.length; j++) {
          sum += this.dataArray[j];
        }
        
        var average = sum / samplesPerBar;
        var normalized = average / 255; // Normalize to 0-1
        levels.push(normalized);
      }
    } else {
      // Generate idle animation
      for (var k = 0; k < this.barCount; k++) {
        var phase = Date.now() / 1000 + k * 0.1;
        var idle = (Math.sin(phase) + 1) / 2 * 0.1; // 0-0.1 range
        levels.push(idle);
      }
    }
    
    return levels;
  };
  
  // Draw visualization bars
  VoiceWaveform.prototype.drawBars = function(levels) {
    var rect = this.canvas.getBoundingClientRect();
    var centerY = rect.height / 2;
    
    // Set color based on state
    this.ctx.fillStyle = this.colors[this.currentState];
    
    // Draw each bar
    for (var i = 0; i < levels.length; i++) {
      var x = i * (this.barWidth + this.barGap);
      var height = Math.max(this.minHeight, levels[i] * this.maxHeight);
      var y = centerY - height / 2;
      
      // Draw bar with rounded corners
      this.roundRect(x, y, this.barWidth, height, 1);
    }
  };
  
  // Draw rounded rectangle
  VoiceWaveform.prototype.roundRect = function(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    this.ctx.fill();
  };
  
  // Clear canvas
  VoiceWaveform.prototype.clear = function() {
    var rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
  };
  
  // Update audio level for accessibility
  VoiceWaveform.prototype.updateAudioLevel = function(levels) {
    var now = Date.now();
    
    if (now - this.lastAudioLevelUpdate < this.audioLevelUpdateInterval) {
      return;
    }
    
    this.lastAudioLevelUpdate = now;
    
    // Calculate average level
    var sum = 0;
    for (var i = 0; i < levels.length; i++) {
      sum += levels[i];
    }
    var average = sum / levels.length;
    
    // Determine level category
    var level;
    if (average < 0.1) {
      level = 'silent';
    } else if (average < 0.3) {
      level = 'low';
    } else if (average < 0.6) {
      level = 'medium';
    } else {
      level = 'high';
    }
    
    // Trigger callback if level changed
    if (level !== this.lastAudioLevel) {
      this.lastAudioLevel = level;
      if (this.audioLevelCallback) {
        this.audioLevelCallback(level);
      }
    }
  };
  
  // Clean up resources
  VoiceWaveform.prototype.destroy = function() {
    this.stop();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.dataArray = null;
  };
  
  // Static method to check browser support
  VoiceWaveform.isSupported = function() {
    return !!(window.AudioContext || window.webkitAudioContext);
  };
  
  return VoiceWaveform;
})();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceWaveform;
}