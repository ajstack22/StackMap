#!/bin/bash

echo "🎮 Deploying Demo Environment..."
echo "================================"

# Create temporary files with demo customizations
cat > /tmp/demo-banner.html << 'EOF'
<div class="demo-banner" style="background-color: #f59e0b; color: white; text-align: center; padding: 8px 5px; font-weight: bold; position: fixed; top: 0; left: 0; right: 0; z-index: 10000; height: 40px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px;"><span style="white-space: nowrap;">🎮 DEMO - Mushroom Kingdom 🍄</span><a href="#" onclick="localStorage.removeItem('stackMapDemoMode'); window.location.replace('/'); return false;" style="color: white; text-decoration: underline; cursor: pointer; white-space: nowrap; font-size: 12px;">Start Using StackMap</a></div>
EOF

cat > /tmp/demo-styles.css << 'EOF'
<style>
/* Demo banner accommodation styles */
.header-wrapper { top: 40px !important; }
.main-container { padding-top: calc(var(--header-height) + 40px) !important; }
.side-panel { top: 40px !important; height: calc(100% - 40px) !important; }
.floating-nav { top: 60px !important; }
.day-selector-backdrop { top: 40px !important; height: calc(100% - 40px) !important; }

/* Support for mobile header at bottom */
body.mobile-header-bottom .header-wrapper { bottom: 0 !important; top: auto !important; }
body.mobile-header-bottom .main-container { padding-top: 40px !important; padding-bottom: var(--header-height) !important; }

@media (max-width: 768px) {
    .side-panel--slide-bottom { top: 40px !important; height: calc(100% - 40px) !important; }
    .demo-banner { font-size: 12px !important; padding: 6px 5px !important; }
}

@media (max-width: 480px) {
    .demo-banner { font-size: 11px !important; }
    .demo-banner a { font-size: 10px !important; }
}
</style>
EOF

# Copy files to server
scp /tmp/demo-banner.html stackmap-cpanel:/tmp/ >/dev/null 2>&1
scp /tmp/demo-styles.css stackmap-cpanel:/tmp/ >/dev/null 2>&1

# SSH into the server and update demo
ssh stackmap-cpanel << 'ENDSSH'
    cd ~/public_html/demo
    
    # Backup current demo
    if [ -f "index.html" ]; then
        tar -czf ~/backups/demo-backup-$(date +%Y%m%d-%H%M%S).tar.gz .
        echo "✅ Demo backed up"
    fi
    
    # Pull latest changes
    git pull origin main
    
    # Now apply demo-specific modifications to index.html
    echo "Applying demo customizations..."
    
    # 1. Insert demo banner after <body> tag
    if [ -f "/tmp/demo-banner.html" ]; then
        sed -i '/<body[^>]*>/r /tmp/demo-banner.html' index.html
    fi
    
    # 2. Add demo-specific CSS before </head>
    if [ -f "/tmp/demo-styles.css" ]; then
        sed -i '/<\/head>/i\' index.html
        sed -i '/<\/head>/r /tmp/demo-styles.css' index.html
    fi
    
    # 3. Set DEMO_MODE flag
    # Add window.DEMO_MODE = true after the first <script> tag
    sed -i '0,/<script>/{s/<script>/<script>\n    window.DEMO_MODE = true;/}' index.html
    
    # 4. Copy demo data file if it exists
    if [ -f "../demo-mushroom-kingdom.json" ]; then
        cp ../demo-mushroom-kingdom.json .
    fi
    
    # Clean up temp files
    rm -f /tmp/demo-banner.html /tmp/demo-styles.css
    
    echo "✅ Demo customizations applied"
ENDSSH

# Clean up local temp files
rm -f /tmp/demo-banner.html /tmp/demo-styles.css

if [ $? -eq 0 ]; then
    echo "✅ Successfully deployed demo!"
    echo "🔗 Test at: https://stackmap.app/demo/"
else
    echo "❌ Demo deployment failed!"
    exit 1
fi