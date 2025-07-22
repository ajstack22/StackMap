#!/bin/bash
# Quick deployment for StackMap Sync API

echo "🚀 Deploying StackMap Sync API..."

# Create API directories
mkdir -p ~/public_html/api/{sync,config,utils,logs}
chmod 755 ~/public_html/api
chmod 700 ~/public_html/api/logs

# Create test file first to verify
cat > ~/public_html/api/sync/hello.php << 'EOF'
<?php
header("Content-Type: application/json");
echo json_encode(["message" => "Hello from StackMap Sync API!", "time" => date("Y-m-d H:i:s")]);
EOF

echo "✅ Basic structure created!"
echo "🧪 Test it at: https://stackmap.app/api/sync/hello.php"
echo ""
echo "If that works, run: ./deploy-api.sh for the full setup"