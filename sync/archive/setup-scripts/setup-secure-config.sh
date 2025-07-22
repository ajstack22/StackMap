#!/bin/bash
# Setup secure configuration for StackMap Sync

echo "🔒 Setting up secure configuration..."

# OPTION 1: Environment Variables in .htaccess
cat >> ~/public_html/api/.htaccess << 'EOF'

# Set environment variables (UPDATE THESE VALUES)
SetEnv DB_HOST "localhost"
SetEnv DB_NAME "stachblx_stackmap_sync"
SetEnv DB_USER "your_database_user"
SetEnv DB_PASS "your_database_password"
SetEnv APP_ENV "production"
EOF

# OPTION 2: Create private config directory outside public_html
mkdir -p ~/private
chmod 700 ~/private

cat > ~/private/db-config.php << 'EOF'
<?php
// Database configuration - stored outside public directory
define('DB_HOST', 'localhost');
define('DB_NAME', 'stachblx_stackmap_sync');
define('DB_USER', 'your_database_user');  // UPDATE THIS
define('DB_PASS', 'your_database_password');  // UPDATE THIS
EOF

chmod 600 ~/private/db-config.php

# OPTION 3: Create .env file (if you want to use phpdotenv)
cat > ~/.env << 'EOF'
DB_HOST=localhost
DB_NAME=stachblx_stackmap_sync
DB_USER=your_database_user
DB_PASS=your_database_password
APP_ENV=production
EOF

chmod 600 ~/.env

echo "✅ Secure configuration templates created!"
echo ""
echo "Choose one of these methods:"
echo "1. Environment variables in .htaccess (easiest)"
echo "2. Config file in ~/private/ (most secure)"
echo "3. .env file with phpdotenv library"
echo ""
echo "⚠️  Remember to update the credentials in whichever method you choose!"