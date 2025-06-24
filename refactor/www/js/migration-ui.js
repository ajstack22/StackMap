/**
 * Migration UI Component
 * Provides RSD-aware user feedback during data migration
 * Shows progress, handles long migrations, and communicates safety
 */

(function() {
    'use strict';
    
    var MigrationUI = {
        // UI state
        modalElement: null,
        progressBar: null,
        statusText: null,
        detailsText: null,
        startTime: null,
        
        /**
         * Show migration modal with progress
         */
        show: function() {
            var self = this;
            
            // Create modal if not exists
            if (!self.modalElement) {
                self.createModal();
            }
            
            // Reset and show
            self.startTime = Date.now();
            self.modalElement.style.display = 'flex';
            self.updateProgress('Preparing to upgrade your storage...', 0);
            
            // Prevent dismissal during migration
            self.modalElement.onclick = function(e) {
                if (e.target === self.modalElement) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
        },
        
        /**
         * Create the migration modal UI
         */
        createModal: function() {
            var self = this;
            
            // Create modal container
            self.modalElement = document.createElement('div');
            self.modalElement.className = 'migration-modal';
            self.modalElement.innerHTML = [
                '<div class="migration-content">',
                '  <h2>Upgrading Your Storage 🚀</h2>',
                '  <p class="migration-intro">We\'re making your data safer and faster. Your tasks are protected!</p>',
                '  ',
                '  <div class="migration-status">',
                '    <p class="status-text">Preparing...</p>',
                '    <div class="progress-container">',
                '      <div class="progress-bar"></div>',
                '    </div>',
                '    <p class="details-text"></p>',
                '  </div>',
                '  ',
                '  <div class="migration-info">',
                '    <h3>What\'s happening?</h3>',
                '    <ul>',
                '      <li>✅ Creating a safety backup (kept for 30 days)</li>',
                '      <li>✅ Moving to faster, more reliable storage</li>',
                '      <li>✅ Verifying everything worked perfectly</li>',
                '      <li>✅ Your data is safe throughout this process</li>',
                '    </ul>',
                '  </div>',
                '  ',
                '  <div class="migration-time">',
                '    <p>This usually takes 10-30 seconds</p>',
                '    <p class="elapsed-time"></p>',
                '  </div>',
                '</div>'
            ].join('');
            
            // Add styles
            self.addStyles();
            
            // Cache elements
            self.progressBar = self.modalElement.querySelector('.progress-bar');
            self.statusText = self.modalElement.querySelector('.status-text');
            self.detailsText = self.modalElement.querySelector('.details-text');
            
            // Append to body
            document.body.appendChild(self.modalElement);
            
            // Update elapsed time
            setInterval(function() {
                if (self.modalElement.style.display === 'flex' && self.startTime) {
                    var elapsed = Math.floor((Date.now() - self.startTime) / 1000);
                    var elapsedElement = self.modalElement.querySelector('.elapsed-time');
                    if (elapsedElement) {
                        elapsedElement.textContent = 'Time elapsed: ' + elapsed + ' seconds';
                    }
                }
            }, 1000);
        },
        
        /**
         * Add modal styles
         */
        addStyles: function() {
            if (document.getElementById('migration-styles')) return;
            
            var style = document.createElement('style');
            style.id = 'migration-styles';
            style.textContent = [
                '.migration-modal {',
                '  position: fixed;',
                '  top: 0;',
                '  left: 0;',
                '  right: 0;',
                '  bottom: 0;',
                '  background: rgba(0, 0, 0, 0.8);',
                '  display: none;',
                '  align-items: center;',
                '  justify-content: center;',
                '  z-index: 10000;',
                '  animation: fadeIn 0.3s ease;',
                '}',
                '',
                '.migration-content {',
                '  background: white;',
                '  border-radius: 12px;',
                '  padding: 32px;',
                '  max-width: 500px;',
                '  width: 90%;',
                '  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);',
                '  animation: slideIn 0.3s ease;',
                '}',
                '',
                '.migration-content h2 {',
                '  margin: 0 0 16px 0;',
                '  color: #1a202c;',
                '  font-size: 24px;',
                '}',
                '',
                '.migration-intro {',
                '  color: #4a5568;',
                '  margin-bottom: 24px;',
                '  font-size: 16px;',
                '}',
                '',
                '.migration-status {',
                '  margin-bottom: 32px;',
                '}',
                '',
                '.status-text {',
                '  font-weight: 600;',
                '  color: #2b6cb0;',
                '  margin-bottom: 12px;',
                '  font-size: 18px;',
                '}',
                '',
                '.progress-container {',
                '  background: #e2e8f0;',
                '  border-radius: 8px;',
                '  height: 8px;',
                '  overflow: hidden;',
                '  margin-bottom: 8px;',
                '}',
                '',
                '.progress-bar {',
                '  background: linear-gradient(90deg, #3182ce, #63b3ed);',
                '  height: 100%;',
                '  width: 0%;',
                '  transition: width 0.3s ease;',
                '  border-radius: 8px;',
                '}',
                '',
                '.details-text {',
                '  color: #718096;',
                '  font-size: 14px;',
                '  margin: 0;',
                '}',
                '',
                '.migration-info {',
                '  background: #f7fafc;',
                '  border-radius: 8px;',
                '  padding: 20px;',
                '  margin-bottom: 20px;',
                '}',
                '',
                '.migration-info h3 {',
                '  margin: 0 0 12px 0;',
                '  color: #2d3748;',
                '  font-size: 16px;',
                '}',
                '',
                '.migration-info ul {',
                '  margin: 0;',
                '  padding-left: 20px;',
                '  color: #4a5568;',
                '}',
                '',
                '.migration-info li {',
                '  margin-bottom: 8px;',
                '  line-height: 1.5;',
                '}',
                '',
                '.migration-time {',
                '  text-align: center;',
                '  color: #718096;',
                '  font-size: 14px;',
                '}',
                '',
                '.elapsed-time {',
                '  font-weight: 600;',
                '  color: #4a5568;',
                '}',
                '',
                '@keyframes fadeIn {',
                '  from { opacity: 0; }',
                '  to { opacity: 1; }',
                '}',
                '',
                '@keyframes slideIn {',
                '  from {',
                '    transform: translateY(-20px);',
                '    opacity: 0;',
                '  }',
                '  to {',
                '    transform: translateY(0);',
                '    opacity: 1;',
                '  }',
                '}',
                '',
                '/* Success state */',
                '.migration-modal.success .migration-content {',
                '  animation: successPulse 0.5s ease;',
                '}',
                '',
                '.migration-modal.success .status-text {',
                '  color: #38a169;',
                '}',
                '',
                '.migration-modal.success .progress-bar {',
                '  background: linear-gradient(90deg, #38a169, #68d391);',
                '}',
                '',
                '@keyframes successPulse {',
                '  0%, 100% { transform: scale(1); }',
                '  50% { transform: scale(1.02); }',
                '}',
                '',
                '/* Error state */',
                '.migration-modal.error .status-text {',
                '  color: #e53e3e;',
                '}',
                '',
                '/* Mobile adjustments */',
                '@media (max-width: 600px) {',
                '  .migration-content {',
                '    padding: 24px;',
                '    width: 95%;',
                '  }',
                '  .migration-content h2 {',
                '    font-size: 20px;',
                '  }',
                '}',
                '',
                '/* Safe mode adjustments */',
                '.safe-mode .migration-modal {',
                '  animation: none;',
                '}',
                '.safe-mode .migration-content {',
                '  animation: none;',
                '}',
                '.safe-mode .progress-bar {',
                '  transition: none;',
                '}'
            ].join('\n');
            
            document.head.appendChild(style);
        },
        
        /**
         * Update migration progress
         */
        updateProgress: function(status, percent) {
            var self = this;
            
            if (!self.modalElement) return;
            
            // Update status text
            if (self.statusText) {
                self.statusText.textContent = status;
            }
            
            // Update progress bar
            if (self.progressBar) {
                self.progressBar.style.width = percent + '%';
            }
            
            // Update details based on progress
            if (self.detailsText) {
                if (percent < 20) {
                    self.detailsText.textContent = 'Creating multiple backups for safety...';
                } else if (percent < 40) {
                    self.detailsText.textContent = 'Checking your data integrity...';
                } else if (percent < 60) {
                    self.detailsText.textContent = 'Moving to new storage system...';
                } else if (percent < 80) {
                    self.detailsText.textContent = 'Verifying everything transferred correctly...';
                } else if (percent < 100) {
                    self.detailsText.textContent = 'Setting up monitoring...';
                } else {
                    self.detailsText.textContent = 'Complete! Your data is safe.';
                }
            }
        },
        
        /**
         * Show completion state
         */
        showComplete: function(message) {
            var self = this;
            
            if (!self.modalElement) return;
            
            // Add success class
            self.modalElement.classList.add('success');
            
            // Update UI
            self.updateProgress(message || "Perfect! Everything moved safely.", 100);
            
            // Auto-hide after delay
            setTimeout(function() {
                self.hide();
            }, 3000);
        },
        
        /**
         * Show error state
         */
        showError: function(message) {
            var self = this;
            
            if (!self.modalElement) return;
            
            // Add error class
            self.modalElement.classList.add('error');
            
            // Update UI with reassuring message
            self.updateProgress(message || "No worries! Your data is still safe.", 0);
            
            // Add retry button
            var retryButton = document.createElement('button');
            retryButton.textContent = 'Try Again';
            retryButton.className = 'retry-button';
            retryButton.style.cssText = 'margin-top: 20px; padding: 12px 24px; background: #3182ce; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;';
            retryButton.onclick = function() {
                self.hide();
                // Trigger retry
                if (window.StackMapMigrationSafety) {
                    window.StackMapMigrationSafety.safeMigrate();
                }
            };
            
            var content = self.modalElement.querySelector('.migration-content');
            if (content && !content.querySelector('.retry-button')) {
                content.appendChild(retryButton);
            }
        },
        
        /**
         * Hide modal
         */
        hide: function() {
            var self = this;
            
            if (self.modalElement) {
                self.modalElement.style.display = 'none';
                self.modalElement.classList.remove('success', 'error');
                
                // Remove any retry buttons
                var retryButton = self.modalElement.querySelector('.retry-button');
                if (retryButton) {
                    retryButton.remove();
                }
            }
        },
        
        /**
         * Show alert for verification or other messages
         */
        showAlert: function(type, message) {
            var alert = document.createElement('div');
            alert.className = 'migration-alert ' + type;
            alert.style.cssText = [
                'position: fixed;',
                'top: 20px;',
                'right: 20px;',
                'background: ' + (type === 'success' ? '#48bb78' : '#ed8936') + ';',
                'color: white;',
                'padding: 16px 24px;',
                'border-radius: 8px;',
                'box-shadow: 0 4px 12px rgba(0,0,0,0.15);',
                'font-size: 16px;',
                'z-index: 10001;',
                'animation: slideInRight 0.3s ease;',
                'max-width: 400px;'
            ].join('');
            
            alert.textContent = message;
            
            document.body.appendChild(alert);
            
            // Auto-remove
            setTimeout(function() {
                alert.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(function() {
                    alert.remove();
                }, 300);
            }, 5000);
        },
        
        /**
         * Show migration preview
         */
        showPreview: function(stats, callback) {
            var self = this;
            
            var preview = document.createElement('div');
            preview.className = 'migration-preview';
            preview.innerHTML = [
                '<div class="preview-content">',
                '  <h2>Ready to Upgrade Your Storage?</h2>',
                '  <div class="preview-stats">',
                '    <div class="stat">',
                '      <span class="stat-value">' + stats.taskCount + '</span>',
                '      <span class="stat-label">Tasks</span>',
                '    </div>',
                '    <div class="stat">',
                '      <span class="stat-value">' + stats.imageCount + '</span>',
                '      <span class="stat-label">Images</span>',
                '    </div>',
                '    <div class="stat">',
                '      <span class="stat-value">' + stats.estimatedTime + 's</span>',
                '      <span class="stat-label">Est. Time</span>',
                '    </div>',
                '  </div>',
                '  <p class="preview-info">Your data will be backed up before migration. The backup will be kept for 30 days for extra safety.</p>',
                '  <div class="preview-actions">',
                '    <button class="btn-primary">Start Upgrade</button>',
                '    <button class="btn-secondary">Not Now</button>',
                '  </div>',
                '</div>'
            ].join('');
            
            // Add preview styles
            var style = document.createElement('style');
            style.textContent = [
                '.migration-preview { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 10000; }',
                '.preview-content { background: white; border-radius: 12px; padding: 32px; max-width: 400px; width: 90%; }',
                '.preview-stats { display: flex; justify-content: space-around; margin: 24px 0; }',
                '.stat { text-align: center; }',
                '.stat-value { display: block; font-size: 32px; font-weight: bold; color: #2b6cb0; }',
                '.stat-label { display: block; font-size: 14px; color: #718096; margin-top: 4px; }',
                '.preview-info { color: #4a5568; margin-bottom: 24px; line-height: 1.5; }',
                '.preview-actions { display: flex; gap: 12px; }',
                '.btn-primary, .btn-secondary { flex: 1; padding: 12px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; }',
                '.btn-primary { background: #3182ce; color: white; }',
                '.btn-secondary { background: #e2e8f0; color: #4a5568; }'
            ].join('');
            document.head.appendChild(style);
            
            // Handle actions
            preview.querySelector('.btn-primary').onclick = function() {
                preview.remove();
                if (callback) callback(true);
            };
            
            preview.querySelector('.btn-secondary').onclick = function() {
                preview.remove();
                if (callback) callback(false);
            };
            
            document.body.appendChild(preview);
        }
    };
    
    // Expose API
    window.StackMapMigrationUI = MigrationUI;
})();