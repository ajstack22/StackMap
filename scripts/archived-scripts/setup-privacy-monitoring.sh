#!/bin/bash
# Privacy-Compliant Monitoring Setup for StackMap

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[MONITOR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Create privacy-compliant error handler
create_error_handler() {
    print_status "Creating privacy-compliant error handler..."
    
    cat > js/privacy-monitor.js << 'EOF'
/**
 * Privacy-Compliant Monitoring for StackMap
 * This module provides error tracking without collecting any personal information
 */

(function() {
    'use strict';
    
    // Privacy-safe error logging
    window.PrivacyMonitor = {
        // Sanitize error messages to remove any potential PII
        sanitizeError: function(error) {
            const sanitized = {
                type: error.name || 'Unknown',
                // Remove any numbers, emails, or IDs from error messages
                message: (error.message || '')
                    .replace(/[0-9]+/g, 'X')
                    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
                    .replace(/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/g, '[uuid]'),
                timestamp: new Date().toISOString(),
                platform: window.platformInfo ? window.platformInfo.platform : 'unknown',
                appVersion: window.APP_VERSION || 'unknown'
            };
            
            // Only include stack trace in development
            if (window.location.hostname === 'localhost') {
                sanitized.stack = error.stack;
            }
            
            return sanitized;
        },
        
        // Log errors locally for debugging
        logError: function(error) {
            const sanitizedError = this.sanitizeError(error);
            
            // Store in localStorage for local debugging only
            try {
                const errors = JSON.parse(localStorage.getItem('stackmap_errors') || '[]');
                errors.push(sanitizedError);
                
                // Keep only last 50 errors
                if (errors.length > 50) {
                    errors.shift();
                }
                
                localStorage.setItem('stackmap_errors', JSON.stringify(errors));
            } catch (e) {
                // Fail silently if localStorage is not available
            }
            
            // Log to console in development
            if (window.location.hostname === 'localhost') {
                console.error('StackMap Error:', sanitizedError);
            }
        },
        
        // Performance monitoring without user tracking
        measurePerformance: function() {
            if (!window.performance || !window.performance.timing) {
                return;
            }
            
            const timing = window.performance.timing;
            const metrics = {
                // Page load metrics
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                loadComplete: timing.loadEventEnd - timing.navigationStart,
                firstPaint: 0,
                
                // Resource metrics
                totalJSHeapSize: 0,
                usedJSHeapSize: 0
            };
            
            // Get first paint time if available
            if (window.performance.getEntriesByType) {
                const paintEntries = window.performance.getEntriesByType('paint');
                const firstPaintEntry = paintEntries.find(entry => entry.name === 'first-paint');
                if (firstPaintEntry) {
                    metrics.firstPaint = Math.round(firstPaintEntry.startTime);
                }
            }
            
            // Get memory usage if available
            if (window.performance.memory) {
                metrics.totalJSHeapSize = Math.round(window.performance.memory.totalJSHeapSize / 1048576); // Convert to MB
                metrics.usedJSHeapSize = Math.round(window.performance.memory.usedJSHeapSize / 1048576); // Convert to MB
            }
            
            // Store metrics locally
            localStorage.setItem('stackmap_performance', JSON.stringify({
                timestamp: new Date().toISOString(),
                metrics: metrics
            }));
            
            return metrics;
        },
        
        // Initialize monitoring
        init: function() {
            const self = this;
            
            // Global error handler
            window.addEventListener('error', function(event) {
                self.logError(event.error || {
                    name: 'WindowError',
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });
            
            // Unhandled promise rejection handler
            window.addEventListener('unhandledrejection', function(event) {
                self.logError({
                    name: 'UnhandledPromiseRejection',
                    message: event.reason ? event.reason.toString() : 'Unknown promise rejection'
                });
            });
            
            // Measure performance after load
            window.addEventListener('load', function() {
                setTimeout(function() {
                    self.measurePerformance();
                }, 1000);
            });
            
            // Provide method to get error report (for debugging)
            window.getErrorReport = function() {
                const errors = JSON.parse(localStorage.getItem('stackmap_errors') || '[]');
                const performance = JSON.parse(localStorage.getItem('stackmap_performance') || '{}');
                
                return {
                    errors: errors,
                    performance: performance,
                    reportGenerated: new Date().toISOString()
                };
            };
            
            // Clear old errors periodically
            setInterval(function() {
                const errors = JSON.parse(localStorage.getItem('stackmap_errors') || '[]');
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                
                const recentErrors = errors.filter(function(error) {
                    return new Date(error.timestamp) > oneWeekAgo;
                });
                
                localStorage.setItem('stackmap_errors', JSON.stringify(recentErrors));
            }, 86400000); // Once per day
        }
    };
    
    // Auto-initialize
    PrivacyMonitor.init();
})();
EOF
    
    print_success "Privacy monitor created"
}

# Create crash-free monitoring
create_crash_monitoring() {
    print_status "Creating crash-free rate monitoring..."
    
    cat > js/crash-free-monitor.js << 'EOF'
/**
 * Crash-Free Rate Monitoring for StackMap
 * Tracks app stability without collecting user data
 */

(function() {
    'use strict';
    
    window.CrashFreeMonitor = {
        // Track session without user identification
        startSession: function() {
            const session = {
                id: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                startTime: new Date().toISOString(),
                crashes: 0,
                errors: 0
            };
            
            sessionStorage.setItem('stackmap_session', JSON.stringify(session));
        },
        
        // Update session with error count
        recordError: function() {
            try {
                const session = JSON.parse(sessionStorage.getItem('stackmap_session') || '{}');
                session.errors = (session.errors || 0) + 1;
                sessionStorage.setItem('stackmap_session', JSON.stringify(session));
            } catch (e) {
                // Fail silently
            }
        },
        
        // Mark session as crashed
        recordCrash: function() {
            try {
                const session = JSON.parse(sessionStorage.getItem('stackmap_session') || '{}');
                session.crashes = (session.crashes || 0) + 1;
                session.crashTime = new Date().toISOString();
                sessionStorage.setItem('stackmap_session', JSON.stringify(session));
            } catch (e) {
                // Fail silently
            }
        },
        
        // End session and calculate metrics
        endSession: function() {
            try {
                const session = JSON.parse(sessionStorage.getItem('stackmap_session') || '{}');
                session.endTime = new Date().toISOString();
                
                // Calculate session duration
                const duration = new Date(session.endTime) - new Date(session.startTime);
                session.durationMs = duration;
                
                // Store in aggregate metrics
                const metrics = JSON.parse(localStorage.getItem('stackmap_metrics') || '{}');
                const today = new Date().toISOString().split('T')[0];
                
                if (!metrics[today]) {
                    metrics[today] = {
                        totalSessions: 0,
                        crashFreeSessions: 0,
                        totalErrors: 0,
                        totalDurationMs: 0
                    };
                }
                
                metrics[today].totalSessions++;
                metrics[today].totalErrors += session.errors || 0;
                metrics[today].totalDurationMs += session.durationMs || 0;
                
                if (session.crashes === 0) {
                    metrics[today].crashFreeSessions++;
                }
                
                // Keep only last 30 days
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - 30);
                
                Object.keys(metrics).forEach(date => {
                    if (new Date(date) < cutoffDate) {
                        delete metrics[date];
                    }
                });
                
                localStorage.setItem('stackmap_metrics', JSON.stringify(metrics));
                sessionStorage.removeItem('stackmap_session');
            } catch (e) {
                // Fail silently
            }
        },
        
        // Get crash-free rate
        getCrashFreeRate: function(days = 7) {
            try {
                const metrics = JSON.parse(localStorage.getItem('stackmap_metrics') || '{}');
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days);
                
                let totalSessions = 0;
                let crashFreeSessions = 0;
                
                Object.keys(metrics).forEach(date => {
                    if (new Date(date) >= cutoffDate) {
                        totalSessions += metrics[date].totalSessions || 0;
                        crashFreeSessions += metrics[date].crashFreeSessions || 0;
                    }
                });
                
                if (totalSessions === 0) return 100;
                
                return Math.round((crashFreeSessions / totalSessions) * 10000) / 100; // Percentage with 2 decimals
            } catch (e) {
                return null;
            }
        },
        
        // Get performance metrics
        getPerformanceMetrics: function(days = 7) {
            try {
                const metrics = JSON.parse(localStorage.getItem('stackmap_metrics') || '{}');
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days);
                
                let totalSessions = 0;
                let totalErrors = 0;
                let totalDuration = 0;
                
                Object.keys(metrics).forEach(date => {
                    if (new Date(date) >= cutoffDate) {
                        const dayMetrics = metrics[date];
                        totalSessions += dayMetrics.totalSessions || 0;
                        totalErrors += dayMetrics.totalErrors || 0;
                        totalDuration += dayMetrics.totalDurationMs || 0;
                    }
                });
                
                return {
                    crashFreeRate: this.getCrashFreeRate(days),
                    avgSessionDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions / 1000) : 0, // seconds
                    avgErrorsPerSession: totalSessions > 0 ? Math.round(totalErrors / totalSessions * 100) / 100 : 0,
                    totalSessions: totalSessions
                };
            } catch (e) {
                return null;
            }
        },
        
        // Initialize
        init: function() {
            const self = this;
            
            // Start session
            this.startSession();
            
            // Track errors
            window.addEventListener('error', function() {
                self.recordError();
            });
            
            // Track unhandled promise rejections
            window.addEventListener('unhandledrejection', function() {
                self.recordError();
            });
            
            // End session on page unload
            window.addEventListener('beforeunload', function() {
                self.endSession();
            });
            
            // Provide debug method
            window.getAppMetrics = function() {
                return {
                    last7Days: self.getPerformanceMetrics(7),
                    last30Days: self.getPerformanceMetrics(30),
                    detailedMetrics: JSON.parse(localStorage.getItem('stackmap_metrics') || '{}')
                };
            };
        }
    };
    
    // Auto-initialize
    CrashFreeMonitor.init();
})();
EOF
    
    print_success "Crash-free monitor created"
}

# Update index.html to include monitoring
update_index_html() {
    print_status "Updating index.html to include monitoring..."
    
    # Check if monitoring scripts are already included
    if ! grep -q "privacy-monitor.js" index.html; then
        # Add before closing body tag
        sed -i.bak '/<\/body>/i\
    <!-- Privacy-Compliant Monitoring -->\
    <script src="js/privacy-monitor.js"><\/script>\
    <script src="js/crash-free-monitor.js"><\/script>' index.html
        
        print_success "Updated index.html"
    else
        print_status "Monitoring already included in index.html"
    fi
}

# Create monitoring dashboard
create_monitoring_dashboard() {
    print_status "Creating monitoring dashboard..."
    
    cat > monitor-dashboard.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StackMap Monitoring Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #333;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric {
            display: inline-block;
            margin: 10px 20px 10px 0;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #2196F3;
        }
        .metric-label {
            color: #666;
            font-size: 0.9em;
        }
        .good { color: #4CAF50; }
        .warning { color: #FF9800; }
        .bad { color: #F44336; }
        .error-list {
            max-height: 400px;
            overflow-y: auto;
        }
        .error-item {
            background: #f9f9f9;
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.9em;
        }
        .timestamp {
            color: #999;
            font-size: 0.8em;
        }
        button {
            background: #2196F3;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: #1976D2;
        }
        .notice {
            background: #E3F2FD;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>StackMap Monitoring Dashboard</h1>
        
        <div class="notice">
            <strong>Privacy Notice:</strong> This dashboard displays only privacy-compliant metrics. 
            No personal user information is collected or displayed.
        </div>
        
        <div class="card">
            <h2>App Health Metrics</h2>
            <div id="metrics">Loading metrics...</div>
        </div>
        
        <div class="card">
            <h2>Recent Errors</h2>
            <button onclick="clearErrors()">Clear Error Log</button>
            <button onclick="exportErrors()">Export Errors</button>
            <div id="errors" class="error-list">Loading errors...</div>
        </div>
        
        <div class="card">
            <h2>Performance Metrics</h2>
            <div id="performance">Loading performance data...</div>
        </div>
    </div>
    
    <script>
        // Load metrics
        function loadMetrics() {
            try {
                const metrics = window.parent.getAppMetrics ? window.parent.getAppMetrics() : null;
                const metricsDiv = document.getElementById('metrics');
                
                if (!metrics) {
                    metricsDiv.innerHTML = '<p>No metrics available. Open the app to start collecting metrics.</p>';
                    return;
                }
                
                const last7 = metrics.last7Days;
                const last30 = metrics.last30Days;
                
                let html = '<h3>Last 7 Days</h3>';
                html += '<div class="metric"><div class="metric-value ' + 
                    (last7.crashFreeRate >= 99 ? 'good' : last7.crashFreeRate >= 95 ? 'warning' : 'bad') + 
                    '">' + (last7.crashFreeRate || 100) + '%</div><div class="metric-label">Crash-Free Rate</div></div>';
                html += '<div class="metric"><div class="metric-value">' + 
                    last7.avgSessionDuration + 's</div><div class="metric-label">Avg Session Duration</div></div>';
                html += '<div class="metric"><div class="metric-value">' + 
                    last7.avgErrorsPerSession + '</div><div class="metric-label">Errors per Session</div></div>';
                html += '<div class="metric"><div class="metric-value">' + 
                    last7.totalSessions + '</div><div class="metric-label">Total Sessions</div></div>';
                
                html += '<h3>Last 30 Days</h3>';
                html += '<div class="metric"><div class="metric-value ' + 
                    (last30.crashFreeRate >= 99 ? 'good' : last30.crashFreeRate >= 95 ? 'warning' : 'bad') + 
                    '">' + (last30.crashFreeRate || 100) + '%</div><div class="metric-label">Crash-Free Rate</div></div>';
                html += '<div class="metric"><div class="metric-value">' + 
                    last30.totalSessions + '</div><div class="metric-label">Total Sessions</div></div>';
                
                metricsDiv.innerHTML = html;
            } catch (e) {
                document.getElementById('metrics').innerHTML = '<p>Error loading metrics</p>';
            }
        }
        
        // Load errors
        function loadErrors() {
            try {
                const errorReport = window.parent.getErrorReport ? window.parent.getErrorReport() : null;
                const errorsDiv = document.getElementById('errors');
                
                if (!errorReport || !errorReport.errors.length) {
                    errorsDiv.innerHTML = '<p>No errors recorded.</p>';
                    return;
                }
                
                let html = '';
                errorReport.errors.slice(-20).reverse().forEach(error => {
                    html += '<div class="error-item">';
                    html += '<div><strong>' + error.type + ':</strong> ' + error.message + '</div>';
                    html += '<div class="timestamp">' + new Date(error.timestamp).toLocaleString() + '</div>';
                    html += '</div>';
                });
                
                errorsDiv.innerHTML = html;
            } catch (e) {
                document.getElementById('errors').innerHTML = '<p>Error loading error log</p>';
            }
        }
        
        // Load performance
        function loadPerformance() {
            try {
                const perf = JSON.parse(localStorage.getItem('stackmap_performance') || '{}');
                const perfDiv = document.getElementById('performance');
                
                if (!perf.metrics) {
                    perfDiv.innerHTML = '<p>No performance data available.</p>';
                    return;
                }
                
                let html = '';
                html += '<div class="metric"><div class="metric-value">' + 
                    perf.metrics.domContentLoaded + 'ms</div><div class="metric-label">DOM Loaded</div></div>';
                html += '<div class="metric"><div class="metric-value">' + 
                    perf.metrics.loadComplete + 'ms</div><div class="metric-label">Page Loaded</div></div>';
                html += '<div class="metric"><div class="metric-value">' + 
                    perf.metrics.firstPaint + 'ms</div><div class="metric-label">First Paint</div></div>';
                html += '<div class="metric"><div class="metric-value">' + 
                    perf.metrics.usedJSHeapSize + 'MB</div><div class="metric-label">Memory Usage</div></div>';
                html += '<div class="timestamp">Measured: ' + new Date(perf.timestamp).toLocaleString() + '</div>';
                
                perfDiv.innerHTML = html;
            } catch (e) {
                document.getElementById('performance').innerHTML = '<p>Error loading performance data</p>';
            }
        }
        
        // Clear errors
        function clearErrors() {
            if (confirm('Clear all error logs?')) {
                localStorage.removeItem('stackmap_errors');
                loadErrors();
            }
        }
        
        // Export errors
        function exportErrors() {
            const errorReport = window.parent.getErrorReport ? window.parent.getErrorReport() : null;
            if (errorReport) {
                const blob = new Blob([JSON.stringify(errorReport, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'stackmap-errors-' + new Date().toISOString().split('T')[0] + '.json';
                a.click();
            }
        }
        
        // Load all data
        function loadAll() {
            loadMetrics();
            loadErrors();
            loadPerformance();
        }
        
        // Initial load
        loadAll();
        
        // Refresh every 5 seconds
        setInterval(loadAll, 5000);
    </script>
</body>
</html>
EOF
    
    print_success "Monitoring dashboard created"
}

# Main function
main() {
    print_status "Setting up privacy-compliant monitoring for StackMap..."
    
    # Create monitoring scripts
    create_error_handler
    create_crash_monitoring
    
    # Update HTML
    update_index_html
    
    # Create dashboard
    create_monitoring_dashboard
    
    # Sync to mobile platforms
    print_status "Syncing monitoring to mobile platforms..."
    npx cap sync
    
    print_success "Privacy-compliant monitoring setup complete!"
    echo ""
    echo "Monitoring features:"
    echo "  - Error tracking without PII"
    echo "  - Crash-free rate calculation"
    echo "  - Performance metrics"
    echo "  - Local-only data storage"
    echo ""
    echo "To view monitoring data:"
    echo "  1. Open monitor-dashboard.html in a browser"
    echo "  2. Or in the app console: getAppMetrics()"
    echo "  3. Or in the app console: getErrorReport()"
}

# Run main function
main "$@"