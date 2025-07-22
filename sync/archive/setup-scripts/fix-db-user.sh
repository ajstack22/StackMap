#!/bin/bash
# Fix database username with correct prefix

echo "🔧 Fixing database configuration..."

# Update the config file with the correct username format
cat > ~/private/stackmap-db-config.php << 'EOF'
<?php
/**
 * StackMap Sync Database Configuration
 * This file is stored outside public_html for security
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'stachblx_stackmap_sync');
define('DB_USER', 'stachblx_stackmap_sync_user');  // Fixed: added prefix
define('DB_PASS', '8VyqRLfTSXA8');
EOF

# Set correct permissions
chmod 600 ~/private/stackmap-db-config.php

echo "✅ Database configuration updated!"
echo "🧪 Test again at: https://stackmap.app/api/sync/test.php"