/**
 * Data Visualizer for StackMap Analytics
 * Creates charts, graphs, and visual representations of analytics data
 * Story #106 - Progress Analytics & Insights
 */

(function() {
    'use strict';
    
    const DataVisualizer = {
        // Chart instances for cleanup
        chartInstances: {},
        
        // Color schemes for ADHD-friendly design
        colorSchemes: {
            completion: {
                primary: '#48bb78',    // Green
                secondary: '#68d391',
                background: 'rgba(72, 187, 120, 0.1)'
            },
            streak: {
                primary: '#ed8936',    // Orange
                secondary: '#f6ad55',
                background: 'rgba(237, 137, 54, 0.1)'
            },
            distribution: {
                recurring: '#667eea',  // Purple
                frequent: '#4299e1',   // Blue
                singleUse: '#48bb78'   // Green
            },
            productivity: {
                high: '#48bb78',       // Green
                medium: '#ed8936',     // Orange
                low: '#f56565'         // Red
            }
        },
        
        /**
         * Create completion rate chart
         */
        createCompletionChart: function(container, data, options = {}) {
            if (!container || !data) return null;
            
            try {
                // Clear existing chart
                this.clearChart(container);
                
                // Create canvas element
                const canvas = document.createElement('canvas');
                canvas.width = options.width || 400;
                canvas.height = options.height || 200;
                container.appendChild(canvas);
                
                const ctx = canvas.getContext('2d');
                
                // Draw completion rate line chart
                this.drawLineChart(ctx, {
                    data: data.streakHistory || [],
                    width: canvas.width,
                    height: canvas.height,
                    colors: this.colorSchemes.completion,
                    title: 'Daily Completion',
                    showPercentage: true
                });
                
                // Store chart reference
                this.chartInstances[container.id || 'completion-chart'] = {
                    type: 'completion',
                    container: container,
                    canvas: canvas,
                    data: data
                };
                
                return canvas;
                
            } catch (error) {
                console.error('DataVisualizer: Error creating completion chart', error);
                return null;
            }
        },
        
        /**
         * Create streak calendar heatmap
         */
        createStreakCalendar: function(container, data, options = {}) {
            if (!container || !data) return null;
            
            try {
                this.clearChart(container);
                
                const calendar = document.createElement('div');
                calendar.className = 'streak-calendar';
                
                // Create calendar grid for last 30 days
                const streakHistory = data.streakHistory || [];
                const calendarHTML = this.generateCalendarHTML(streakHistory, options);
                calendar.innerHTML = calendarHTML;
                
                container.appendChild(calendar);
                
                this.chartInstances[container.id || 'streak-calendar'] = {
                    type: 'streak',
                    container: container,
                    element: calendar,
                    data: data
                };
                
                return calendar;
                
            } catch (error) {
                console.error('DataVisualizer: Error creating streak calendar', error);
                return null;
            }
        },
        
        /**
         * Create activity type distribution chart
         */
        createTypeDistributionChart: function(container, data, options = {}) {
            if (!container || !data) return null;
            
            try {
                this.clearChart(container);
                
                const canvas = document.createElement('canvas');
                canvas.width = options.width || 300;
                canvas.height = options.height || 300;
                container.appendChild(canvas);
                
                const ctx = canvas.getContext('2d');
                
                // Draw donut chart
                this.drawDonutChart(ctx, {
                    data: data.byType || {},
                    width: canvas.width,
                    height: canvas.height,
                    colors: this.colorSchemes.distribution,
                    title: 'Activity Types'
                });
                
                this.chartInstances[container.id || 'distribution-chart'] = {
                    type: 'distribution',
                    container: container,
                    canvas: canvas,
                    data: data
                };
                
                return canvas;
                
            } catch (error) {
                console.error('DataVisualizer: Error creating distribution chart', error);
                return null;
            }
        },
        
        /**
         * Create productivity heatmap
         */
        createProductivityHeatmap: function(container, data, options = {}) {
            if (!container || !data) return null;
            
            try {
                this.clearChart(container);
                
                const heatmap = document.createElement('div');
                heatmap.className = 'productivity-heatmap';
                
                const heatmapHTML = this.generateHeatmapHTML(data.byHour || {}, options);
                heatmap.innerHTML = heatmapHTML;
                
                container.appendChild(heatmap);
                
                this.chartInstances[container.id || 'productivity-heatmap'] = {
                    type: 'productivity',
                    container: container,
                    element: heatmap,
                    data: data
                };
                
                return heatmap;
                
            } catch (error) {
                console.error('DataVisualizer: Error creating productivity heatmap', error);
                return null;
            }
        },
        
        /**
         * Create progress ring/circle
         */
        createProgressRing: function(container, percentage, options = {}) {
            if (!container || typeof percentage !== 'number') return null;
            
            try {
                this.clearChart(container);
                
                const ring = document.createElement('div');
                ring.className = 'progress-ring';
                
                const size = options.size || 120;
                const strokeWidth = options.strokeWidth || 8;
                const radius = (size - strokeWidth) / 2;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (percentage / 100) * circumference;
                
                ring.innerHTML = `
                    <svg width="${size}" height="${size}" class="progress-ring-svg">
                        <circle
                            class="progress-ring-background"
                            stroke="#e2e8f0"
                            stroke-width="${strokeWidth}"
                            fill="transparent"
                            r="${radius}"
                            cx="${size / 2}"
                            cy="${size / 2}"
                        />
                        <circle
                            class="progress-ring-progress"
                            stroke="${options.color || this.colorSchemes.completion.primary}"
                            stroke-width="${strokeWidth}"
                            stroke-linecap="round"
                            fill="transparent"
                            r="${radius}"
                            cx="${size / 2}"
                            cy="${size / 2}"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${offset}"
                            transform="rotate(-90 ${size / 2} ${size / 2})"
                        />
                    </svg>
                    <div class="progress-ring-text">
                        <div class="progress-ring-percentage">${Math.round(percentage)}%</div>
                        <div class="progress-ring-label">${options.label || 'Complete'}</div>
                    </div>
                `;
                
                container.appendChild(ring);
                
                this.chartInstances[container.id || 'progress-ring'] = {
                    type: 'progress',
                    container: container,
                    element: ring,
                    percentage: percentage
                };
                
                return ring;
                
            } catch (error) {
                console.error('DataVisualizer: Error creating progress ring', error);
                return null;
            }
        },
        
        /**
         * Draw line chart on canvas
         */
        drawLineChart: function(ctx, config) {
            const { data, width, height, colors, title } = config;
            const padding = 40;
            const chartWidth = width - 2 * padding;
            const chartHeight = height - 2 * padding;
            
            // Clear canvas
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            
            if (!data || data.length === 0) {
                this.drawNoDataMessage(ctx, width, height);
                return;
            }
            
            // Draw title
            if (title) {
                ctx.fillStyle = '#2d3748';
                ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(title, width / 2, 20);
            }
            
            // Draw axes
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, height - padding);
            ctx.lineTo(width - padding, height - padding);
            ctx.stroke();
            
            // Calculate data points
            const maxValue = Math.max(...data.map(d => d.count || 0), 1);
            const stepX = chartWidth / (data.length - 1 || 1);
            
            // Draw line
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            data.forEach((point, index) => {
                const x = padding + index * stepX;
                const y = height - padding - (point.count / maxValue) * chartHeight;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // Draw points
            ctx.fillStyle = colors.primary;
            data.forEach((point, index) => {
                const x = padding + index * stepX;
                const y = height - padding - (point.count / maxValue) * chartHeight;
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            });
            
            // Draw area under curve
            ctx.fillStyle = colors.background;
            ctx.beginPath();
            ctx.moveTo(padding, height - padding);
            data.forEach((point, index) => {
                const x = padding + index * stepX;
                const y = height - padding - (point.count / maxValue) * chartHeight;
                ctx.lineTo(x, y);
            });
            ctx.lineTo(width - padding, height - padding);
            ctx.closePath();
            ctx.fill();
        },
        
        /**
         * Draw donut chart on canvas
         */
        drawDonutChart: function(ctx, config) {
            const { data, width, height, colors, title } = config;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 2 - 40;
            const innerRadius = radius * 0.6;
            
            // Clear canvas
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            
            const values = Object.values(data);
            const total = values.reduce((sum, val) => sum + val, 0);
            
            if (total === 0) {
                this.drawNoDataMessage(ctx, width, height);
                return;
            }
            
            // Draw title
            if (title) {
                ctx.fillStyle = '#2d3748';
                ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(title, centerX, 20);
            }
            
            // Draw donut segments
            let currentAngle = -Math.PI / 2;
            
            Object.entries(data).forEach(([key, value]) => {
                if (value > 0) {
                    const segmentAngle = (value / total) * 2 * Math.PI;
                    
                    // Draw segment
                    ctx.fillStyle = colors[key] || '#cbd5e0';
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + segmentAngle);
                    ctx.arc(centerX, centerY, innerRadius, currentAngle + segmentAngle, currentAngle, true);
                    ctx.closePath();
                    ctx.fill();
                    
                    currentAngle += segmentAngle;
                }
            });
            
            // Draw center text
            ctx.fillStyle = '#2d3748';
            ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(total.toString(), centerX, centerY - 5);
            
            ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText('Total', centerX, centerY + 15);
            
            // Draw legend
            this.drawLegend(ctx, data, colors, width, height);
        },
        
        /**
         * Draw legend for charts
         */
        drawLegend: function(ctx, data, colors, width, height) {
            const legendY = height - 30;
            let legendX = 20;
            
            ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'left';
            
            Object.entries(data).forEach(([key, value]) => {
                if (value > 0) {
                    // Draw color box
                    ctx.fillStyle = colors[key] || '#cbd5e0';
                    ctx.fillRect(legendX, legendY - 8, 12, 12);
                    
                    // Draw text
                    ctx.fillStyle = '#4a5568';
                    ctx.fillText(`${key}: ${value}`, legendX + 18, legendY + 2);
                    
                    legendX += ctx.measureText(`${key}: ${value}`).width + 35;
                }
            });
        },
        
        /**
         * Generate calendar HTML for streak visualization
         */
        generateCalendarHTML: function(streakHistory, options = {}) {
            let html = '<div class="calendar-header">Last 30 Days</div>';
            html += '<div class="calendar-grid">';
            
            // Day labels
            const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
            dayLabels.forEach(day => {
                html += `<div class="calendar-day-label">${day}</div>`;
            });
            
            // Calendar days
            for (let i = 0; i < 30; i++) {
                const dayData = streakHistory[i] || { count: 0, hasActivity: false };
                const intensity = Math.min(dayData.count / 5, 1); // Normalize to 0-1
                const className = dayData.hasActivity ? 'has-activity' : 'no-activity';
                const style = dayData.hasActivity ? 
                    `background-color: rgba(72, 187, 120, ${0.2 + intensity * 0.8})` : '';
                
                html += `<div class="calendar-day ${className}" style="${style}" title="${dayData.count} activities"></div>`;
            }
            
            html += '</div>';
            
            // Legend
            html += '<div class="calendar-legend">';
            html += '<span>Less</span>';
            for (let i = 0; i <= 4; i++) {
                const intensity = i / 4;
                html += `<div class="legend-square" style="background-color: rgba(72, 187, 120, ${0.2 + intensity * 0.8})"></div>`;
            }
            html += '<span>More</span>';
            html += '</div>';
            
            return html;
        },
        
        /**
         * Generate heatmap HTML for productivity visualization
         */
        generateHeatmapHTML: function(hourlyData, options = {}) {
            const maxValue = Math.max(...Object.values(hourlyData), 1);
            
            let html = '<div class="heatmap-header">Productivity by Hour</div>';
            html += '<div class="heatmap-grid">';
            
            // Hour labels and bars
            for (let hour = 0; hour < 24; hour++) {
                const value = hourlyData[hour] || 0;
                const intensity = value / maxValue;
                const percentage = (intensity * 100).toFixed(0);
                
                const period = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                const hourLabel = `${displayHour}${period}`;
                
                let colorClass = 'low';
                if (intensity > 0.7) colorClass = 'high';
                else if (intensity > 0.3) colorClass = 'medium';
                
                html += `
                    <div class="heatmap-row">
                        <div class="heatmap-hour-label">${hourLabel}</div>
                        <div class="heatmap-bar">
                            <div class="heatmap-bar-fill ${colorClass}" style="width: ${percentage}%" title="${value} activities at ${hourLabel}"></div>
                        </div>
                        <div class="heatmap-value">${value}</div>
                    </div>
                `;
            }
            
            html += '</div>';
            return html;
        },
        
        /**
         * Draw "no data" message
         */
        drawNoDataMessage: function(ctx, width, height) {
            ctx.fillStyle = '#a0aec0';
            ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', width / 2, height / 2);
        },
        
        /**
         * Create achievement showcase
         */
        createAchievementShowcase: function(container, achievements, options = {}) {
            if (!container || !achievements) return null;
            
            try {
                this.clearChart(container);
                
                const showcase = document.createElement('div');
                showcase.className = 'achievement-showcase';
                
                // Show recent unlocked achievements
                const recentAchievements = achievements
                    .filter(a => a.isUnlocked)
                    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
                    .slice(0, options.limit || 3);
                
                if (recentAchievements.length === 0) {
                    showcase.innerHTML = `
                        <div class="no-achievements">
                            <div class="no-achievements-icon">🏆</div>
                            <div class="no-achievements-text">Complete activities to unlock achievements!</div>
                        </div>
                    `;
                } else {
                    let html = '<div class="achievement-showcase-header">Recent Achievements</div>';
                    html += '<div class="achievement-showcase-grid">';
                    
                    recentAchievements.forEach(achievement => {
                        html += `
                            <div class="achievement-card rarity-${achievement.rarity}">
                                <div class="achievement-card-icon">${achievement.icon}</div>
                                <div class="achievement-card-title">${achievement.title}</div>
                                <div class="achievement-card-points">+${achievement.points} pts</div>
                            </div>
                        `;
                    });
                    
                    html += '</div>';
                    showcase.innerHTML = html;
                }
                
                container.appendChild(showcase);
                
                this.chartInstances[container.id || 'achievement-showcase'] = {
                    type: 'achievements',
                    container: container,
                    element: showcase,
                    data: achievements
                };
                
                return showcase;
                
            } catch (error) {
                console.error('DataVisualizer: Error creating achievement showcase', error);
                return null;
            }
        },
        
        /**
         * Clear existing chart from container
         */
        clearChart: function(container) {
            if (!container) return;
            
            // Remove existing content
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            
            // Clean up chart instance if exists
            const chartId = container.id;
            if (chartId && this.chartInstances[chartId]) {
                delete this.chartInstances[chartId];
            }
        },
        
        /**
         * Update existing chart with new data
         */
        updateChart: function(chartId, newData) {
            const chartInstance = this.chartInstances[chartId];
            if (!chartInstance) return false;
            
            try {
                switch (chartInstance.type) {
                    case 'completion':
                        this.createCompletionChart(chartInstance.container, newData);
                        break;
                    case 'streak':
                        this.createStreakCalendar(chartInstance.container, newData);
                        break;
                    case 'distribution':
                        this.createTypeDistributionChart(chartInstance.container, newData);
                        break;
                    case 'productivity':
                        this.createProductivityHeatmap(chartInstance.container, newData);
                        break;
                    case 'achievements':
                        this.createAchievementShowcase(chartInstance.container, newData);
                        break;
                }
                return true;
            } catch (error) {
                console.error('DataVisualizer: Error updating chart', error);
                return false;
            }
        },
        
        /**
         * Get chart data for export
         */
        exportChart: function(chartId, format = 'png') {
            const chartInstance = this.chartInstances[chartId];
            if (!chartInstance) return null;
            
            try {
                if (chartInstance.canvas) {
                    // Canvas-based chart
                    return chartInstance.canvas.toDataURL(`image/${format}`);
                } else if (chartInstance.element) {
                    // HTML-based chart - would need html2canvas or similar
                    console.warn('DataVisualizer: HTML chart export not implemented');
                    return null;
                }
            } catch (error) {
                console.error('DataVisualizer: Error exporting chart', error);
                return null;
            }
        },
        
        /**
         * Clean up all chart instances
         */
        destroy: function() {
            Object.keys(this.chartInstances).forEach(chartId => {
                this.clearChart(this.chartInstances[chartId].container);
            });
            this.chartInstances = {};
        }
    };
    
    // Export to global scope
    window.DataVisualizer = DataVisualizer;
    
})();