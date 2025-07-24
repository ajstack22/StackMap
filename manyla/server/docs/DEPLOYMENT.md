# Server Deployment Guide

## Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- HTTPS certificate (required for production)
- cPanel or similar hosting control panel

## Step 1: Database Setup

1. **Log into cPanel** and open phpMyAdmin

2. **Create database** (if not exists):
   ```sql
   CREATE DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Select your database** from the dropdown in phpMyAdmin

4. **Run the setup script**:
   - Copy contents of `database/setup.sql`
   - Paste into SQL query box
   - Click "Go" to execute

5. **Verify tables created**:
   ```sql
   SHOW TABLES;
   ```
   
   You should see:
   - sync_data
   - sync_devices
   - rate_limits
   - cleanup_log

## Step 2: Configure API

1. **Copy configuration template**:
   ```bash
   cp api/config/config.example.php api/config/config.php
   ```

2. **Edit config.php** with your values:
   ```php
   // Database Configuration
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'your_database_name');
   define('DB_USER', 'your_database_user');
   define('DB_PASS', 'your_database_password');
   
   // Update allowed origins
   define('CORS_ALLOWED_ORIGINS', [
       'https://your-app-domain.com',
       'https://www.your-app-domain.com'
   ]);
   ```

3. **Set production mode**:
   ```php
   define('API_DEBUG', false);
   ```

## Step 3: Upload Files

1. **Create API directory** in your web root:
   ```
   /public_html/api/sync/
   ```

2. **Upload all PHP files** from `api/` folder:
   ```
   /public_html/api/sync/
   ├── config/
   │   ├── config.php (your edited version)
   │   └── database.php
   ├── utils/
   │   ├── validation.php
   │   ├── rate-limiter.php
   │   └── cors.php
   ├── create.php
   ├── push.php
   ├── pull.php
   ├── delete.php
   ├── health.php
   └── cleanup.php
   ```

3. **Set file permissions**:
   - PHP files: 644
   - Directories: 755
   - config.php: 600 (more restrictive for security)

## Step 4: Configure Web Server

### For Apache (.htaccess)

Create `/public_html/api/sync/.htaccess`:

```apache
# Protect config files
<FilesMatch "\.(php|sql|log|md)$">
    Order Deny,Allow
    Deny from all
</FilesMatch>

# Allow API endpoints
<FilesMatch "^(create|push|pull|delete|health|cleanup)\.php$">
    Order Allow,Deny
    Allow from all
</FilesMatch>

# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Prevent directory listing
Options -Indexes

# Security headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "DENY"
Header set X-XSS-Protection "1; mode=block"
```

### For Nginx

Add to your server block:

```nginx
location /api/sync/ {
    # Allow only specific PHP files
    location ~ ^/api/sync/(create|push|pull|delete|health|cleanup)\.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
    
    # Deny access to other PHP files
    location ~ \.php$ {
        deny all;
    }
    
    # Deny access to config directory
    location ~ /api/sync/config/ {
        deny all;
    }
}
```

## Step 5: Set Up Automated Cleanup

### Option A: cPanel Cron Job

1. Go to cPanel → Cron Jobs
2. Add new cron job:
   - **Command**: `/usr/bin/php /home/username/public_html/api/sync/cleanup.php`
   - **Schedule**: Daily at 3 AM
   - **Setting**: `0 3 * * *`

### Option B: MySQL Events

Enable the cleanup event in MySQL:

```sql
SET GLOBAL event_scheduler = ON;
```

The database setup script already created the daily cleanup event.

### Option C: Web-based Cleanup

Call the cleanup endpoint periodically:

```bash
# Add to external monitoring service
curl -X POST https://your-domain.com/api/sync/cleanup.php \
  -H "X-Cleanup-Key: your-secret-cleanup-key"
```

## Step 6: Test the Installation

1. **Check health endpoint**:
   ```bash
   curl https://your-domain.com/api/sync/health.php
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "stackmap-sync",
     "version": "1.0.0",
     "timestamp": "2024-01-20 12:34:56"
   }
   ```

2. **Test create endpoint**:
   ```bash
   curl -X POST https://your-domain.com/api/sync/create.php \
     -H "Content-Type: application/json" \
     -d '{
       "sync_id": "a1b2c3d4e5f6789012345678901234567",
       "encrypted_blob": "SGVsbG8gV29ybGQh",
       "device_id": "f1e2d3c4b5a6987654321098765432109"
     }'
   ```

3. **Verify rate limiting**:
   ```bash
   # Run 35 times quickly
   for i in {1..35}; do
     curl https://your-domain.com/api/sync/health.php
   done
   ```
   
   Should see 429 error after 30 requests.

## Step 7: Security Hardening

1. **Remove setup files**:
   ```bash
   rm -f database/setup.sql
   rm -f docs/*
   rm -f tests/*
   rm -f README.md
   ```

2. **Restrict database user**:
   ```sql
   -- Create specific user for sync
   CREATE USER 'sync_user'@'localhost' IDENTIFIED BY 'strong_password';
   
   -- Grant only necessary permissions
   GRANT SELECT, INSERT, UPDATE, DELETE ON your_database.sync_data TO 'sync_user'@'localhost';
   GRANT SELECT, INSERT, UPDATE, DELETE ON your_database.sync_devices TO 'sync_user'@'localhost';
   GRANT SELECT, INSERT, UPDATE, DELETE ON your_database.rate_limits TO 'sync_user'@'localhost';
   GRANT INSERT ON your_database.cleanup_log TO 'sync_user'@'localhost';
   
   -- Apply changes
   FLUSH PRIVILEGES;
   ```

3. **Enable MySQL SSL** (if supported):
   ```sql
   -- Check SSL status
   SHOW VARIABLES LIKE '%ssl%';
   ```

4. **Monitor error logs**:
   - Check PHP error log: `/home/username/public_html/error_log`
   - Set up log rotation to prevent large files

## Step 8: Update Client Configuration

Update your React Native app:

```javascript
// src/services/sync/syncService.js
const API_BASE_URL = 'https://your-domain.com/api/sync';
```

## Monitoring

1. **Set up uptime monitoring** for health endpoint
2. **Monitor disk usage** (encrypted blobs can be large)
3. **Check cleanup logs** monthly
4. **Review rate limit hits** for abuse

## Troubleshooting

### Database Connection Failed

1. Verify credentials in config.php
2. Check database exists and user has access
3. Test with simple PHP script:
   ```php
   <?php
   require_once 'config/database.php';
   $db = Database::getInstance();
   echo "Connected successfully";
   ?>
   ```

### 500 Internal Server Error

1. Check PHP error log
2. Verify file permissions (644 for PHP files)
3. Check .htaccess syntax
4. Ensure PHP version is 7.4+

### CORS Errors

1. Verify your domain is in CORS_ALLOWED_ORIGINS
2. Check browser developer console
3. Test with curl to bypass CORS

### Rate Limiting Issues

1. Check rate_limits table for entries
2. Verify cleanup is running
3. Adjust limits in config.php if needed

## Performance Optimization

1. **Enable PHP OPcache**:
   ```ini
   opcache.enable=1
   opcache.memory_consumption=128
   opcache.max_accelerated_files=4000
   ```

2. **MySQL query optimization**:
   ```sql
   -- Check slow queries
   SHOW PROCESSLIST;
   
   -- Analyze table performance
   ANALYZE TABLE sync_data;
   ```

3. **Consider CDN** for API responses (if applicable)

## Backup Strategy

1. **Database backups**:
   - Daily automated backups via cPanel
   - Keep 7 days of backups minimum
   - Test restoration procedure

2. **Important**: Never backup encryption keys or recovery phrases

## Success Checklist

- [ ] Database tables created successfully
- [ ] config.php updated with correct values
- [ ] All files uploaded to correct locations
- [ ] File permissions set correctly
- [ ] HTTPS working properly
- [ ] Health endpoint responding
- [ ] Rate limiting functioning
- [ ] Cleanup job scheduled
- [ ] Client app connecting successfully
- [ ] Error logging configured
- [ ] Monitoring in place
- [ ] Backup strategy implemented