// blog/blog-renderer.js - Blog rendering engine
// Follows StackMap patterns: vanilla JS, window globals

window.StackMapBlogRenderer = {
    init() {
        this.data = window.StackMapBlogData;
        this.renderCurrentSession();
        this.renderTimeline();
        this.renderInnovations();
        this.renderSolutions();
        this.renderAIPatterns();
        this.renderMetrics();
        this.setupSearch();
        this.setupNavigation();
    },
    
    renderCurrentSession() {
        const container = document.getElementById('current-session');
        const current = this.data.sessions.find(s => s.status === 'in-progress');
        
        if (!current) {
            container.innerHTML = '<p>No active development session</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="session-card current-session">
                <div class="session-header">
                    <h3>${current.title}</h3>
                    <span class="session-date">${this.formatDate(current.date)}</span>
                    <span class="status-badge status-active">Active</span>
                </div>
                <p class="session-description">${current.description}</p>
                
                ${current.currentTasks ? `
                    <div class="current-tasks">
                        <h4>Current Tasks:</h4>
                        <ul>
                            ${current.currentTasks.map(task => `<li>${task}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${current.metrics ? `
                    <div class="session-metrics">
                        ${this.renderMetricBadges(current.metrics)}
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    renderTimeline() {
        const container = document.getElementById('session-timeline');
        const sessions = [...this.data.sessions].reverse();
        const milestones = this.data.milestones;
        
        // Merge sessions and milestones by date
        const allEvents = [];
        
        sessions.forEach(session => {
            allEvents.push({ type: 'session', ...session });
        });
        
        milestones.forEach(milestone => {
            allEvents.push({ type: 'milestone', ...milestone });
        });
        
        // Sort by date
        allEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        container.innerHTML = `
            <div class="timeline">
                ${allEvents.map(event => this.renderTimelineEvent(event)).join('')}
            </div>
        `;
    },
    
    renderTimelineEvent(event) {
        if (event.type === 'milestone') {
            return `
                <div class="timeline-event milestone-event">
                    <div class="timeline-marker milestone-marker">
                        <span class="milestone-icon">${event.icon}</span>
                    </div>
                    <div class="timeline-content">
                        <h4>${event.title}</h4>
                        <span class="event-date">${this.formatDate(event.date)}</span>
                        <p>${event.description}</p>
                        ${event.community ? `
                            <div class="community-impact">
                                ${event.community.reactions ? `
                                    <span class="reactions">${event.community.reactions.join(' ')}</span>
                                ` : ''}
                                <p>${event.community.engagement || event.community.feedback || ''}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        // Session event
        return `
            <div class="timeline-event session-event" data-session="${event.id}">
                <div class="timeline-marker">
                    <span class="status-indicator status-${event.status}"></span>
                </div>
                <div class="timeline-content">
                    <h4>${event.title}</h4>
                    <div class="event-meta">
                        <span class="event-date">${this.formatDate(event.date)}</span>
                        <span class="event-duration">${event.duration}</span>
                        ${event.story ? `<span class="story-badge">${event.story}</span>` : ''}
                    </div>
                    <p>${event.description}</p>
                    
                    ${event.metrics ? `
                        <div class="session-metrics">
                            ${this.renderMetricBadges(event.metrics)}
                        </div>
                    ` : ''}
                    
                    ${event.highlights && event.highlights.length > 0 ? `
                        <details class="session-details">
                            <summary>Key Features (${event.highlights.length})</summary>
                            <ul class="highlights-list">
                                ${event.highlights.map(h => `<li>${h}</li>`).join('')}
                            </ul>
                        </details>
                    ` : ''}
                    
                    ${event.problems && event.problems.length > 0 ? `
                        <details class="session-details">
                            <summary>Problems Solved (${event.problems.length})</summary>
                            <div class="problems-list">
                                ${event.problems.map(p => `
                                    <div class="problem-solution">
                                        <strong>Issue:</strong> ${p.issue}<br>
                                        <strong>Solution:</strong> ${p.solution}
                                        ${p.pattern ? `<br><em>Pattern: ${p.pattern}</em>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </details>
                    ` : ''}
                    
                    ${event.community ? `
                        <div class="community-response">
                            <h5>Community Impact</h5>
                            ${event.community.feedback ? `<p>📣 ${event.community.feedback}</p>` : ''}
                            ${event.community.testimonial ? `<blockquote>${event.community.testimonial}</blockquote>` : ''}
                            ${event.community.adoption ? `<p>📈 ${event.community.adoption}</p>` : ''}
                            ${event.community.newUsers ? `<p>👥 +${event.community.newUsers} new users</p>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },
    
    renderInnovations() {
        const container = document.getElementById('innovation-grid');
        
        container.innerHTML = this.data.innovations.map(innovation => `
            <div class="innovation-card">
                <h3>${innovation.title}</h3>
                <p>${innovation.description}</p>
                ${innovation.code ? `
                    <pre><code>${this.escapeHtml(innovation.code)}</code></pre>
                ` : ''}
                ${innovation.pattern ? `
                    <p class="pattern-note">Pattern: ${innovation.pattern}</p>
                ` : ''}
                <p class="impact"><strong>Impact:</strong> ${innovation.impact}</p>
                <span class="session-ref">From ${innovation.session.replace('session-', 'Session ')}</span>
            </div>
        `).join('');
    },
    
    renderSolutions() {
        const container = document.getElementById('solutions-grid');
        
        container.innerHTML = this.data.solutions.map(category => `
            <div class="solution-category">
                <h3>${category.category}</h3>
                <div class="problems-container">
                    ${category.problems.map(problem => `
                        <div class="problem-card" data-searchable="${problem.issue.toLowerCase()}">
                            <h4>❌ ${problem.issue}</h4>
                            <p>✅ ${problem.solution}</p>
                            ${problem.code ? `<pre><code>${this.escapeHtml(problem.code)}</code></pre>` : ''}
                            ${problem.pattern ? `<p class="pattern">📋 ${problem.pattern}</p>` : ''}
                            ${problem.guideline ? `<p class="guideline">📏 ${problem.guideline}</p>` : ''}
                            ${problem.breakpoint ? `<p class="breakpoint">📱 ${problem.breakpoint}</p>` : ''}
                            <span class="session-ref">${problem.session.replace('session-', 'Session ')}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },
    
    renderAIPatterns() {
        const container = document.getElementById('collaboration-examples');
        
        container.innerHTML = `
            <div class="ai-patterns-grid">
                ${this.data.aiPatterns.map(pattern => `
                    <div class="ai-pattern-card">
                        <h3>${pattern.pattern}</h3>
                        <p>${pattern.description}</p>
                        <div class="example">
                            <strong>Example:</strong> ${pattern.example}
                        </div>
                        <div class="effectiveness">
                            <strong>Effectiveness:</strong> 
                            <span class="effectiveness-rating">${pattern.effectiveness}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="ai-insights">
                <h3>Key Insights</h3>
                <ul>
                    <li>AI excels at systematic test fixing and comprehensive solutions</li>
                    <li>Community feedback effectively translated to technical requirements</li>
                    <li>Progressive enhancement ensures broad compatibility</li>
                    <li>Test-driven development catches issues early</li>
                </ul>
            </div>
        `;
    },
    
    renderMetrics() {
        const container = document.getElementById('metrics-summary');
        const m = this.data.metrics;
        
        container.innerHTML = `
            <div class="metrics-grid">
                <div class="metric">
                    <span class="metric-value">${m.totalSessions}</span>
                    <span class="metric-label">Sessions</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${m.totalHours}h</span>
                    <span class="metric-label">Dev Time</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${m.totalFeatures}</span>
                    <span class="metric-label">Features</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${m.totalTests}</span>
                    <span class="metric-label">Tests</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${m.averageSuccessRate}</span>
                    <span class="metric-label">Success Rate</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${m.linesOfCode.toLocaleString()}</span>
                    <span class="metric-label">Lines of Code</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${m.communityMembers}</span>
                    <span class="metric-label">Community</span>
                </div>
                <div class="metric">
                    <span class="metric-value">${m.activeUsers}</span>
                    <span class="metric-label">Active Users</span>
                </div>
            </div>
            <p class="last-updated">Last updated: ${this.formatDate(this.data.lastUpdated)}</p>
        `;
    },
    
    renderMetricBadges(metrics) {
        const badges = [];
        if (metrics.features) badges.push(`<span class="metric-badge">✨ ${metrics.features} features</span>`);
        if (metrics.tests) badges.push(`<span class="metric-badge">🧪 ${metrics.tests} tests</span>`);
        if (metrics.successRate) badges.push(`<span class="metric-badge">✅ ${metrics.successRate}</span>`);
        if (metrics.linesOfCode) badges.push(`<span class="metric-badge">📝 ${metrics.linesOfCode} LOC</span>`);
        return badges.join('');
    },
    
    setupSearch() {
        const searchInput = document.getElementById('solution-search');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.problem-card');
            
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(term) ? '' : 'none';
            });
            
            // Also search sessions
            if (term.length > 2) {
                const sessions = document.querySelectorAll('.session-event');
                sessions.forEach(session => {
                    const text = session.textContent.toLowerCase();
                    session.classList.toggle('search-highlight', text.includes(term));
                });
            } else {
                document.querySelectorAll('.search-highlight').forEach(el => {
                    el.classList.remove('search-highlight');
                });
            }
        });
    },
    
    setupNavigation() {
        // Smooth scroll for nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
        
        // Highlight current section
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                    });
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('section[id]').forEach(section => {
            observer.observe(section);
        });
    },
    
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};