# Database Setup Instructions

## Steps to Set Up the Sync Database

### 1. Access cPanel MySQL
1. Log into your Namecheap cPanel
2. Navigate to **Databases** → **MySQL Databases**

### 2. Create Database
You have two options:

**Option A: Create a new database**
- Database name: `stackmap_sync` (or similar)
- Note the full database name (usually prefixed with your username like `username_stackmap_sync`)

**Option B: Use existing database**
- If you already have a database for StackMap, you can use it
- The sync tables won't interfere with any existing tables

### 3. Create Database User (if needed)
1. Create a new MySQL user (e.g., `stackmap_sync_user`)
2. Set a strong password
3. Note down the credentials - you'll need them for the PHP API

### 4. Grant Permissions
Grant the following permissions to your database user:
- SELECT
- INSERT  
- UPDATE
- DELETE
- CREATE (for initial setup)
- INDEX (for optimization)

### 5. Run Setup Script
1. Go to **Databases** → **phpMyAdmin**
2. Select your database
3. Click on **SQL** tab
4. Copy and paste the contents of `setup.sql`
5. Click **Go** to execute

### 6. Verify Setup
Run these queries to verify:
```sql
SHOW TABLES;
```

You should see:
- sync_data
- sync_devices  
- sync_metrics
- rate_limits
- pairing_sessions

### 7. Test Installation (Optional)
1. Run the contents of `test-data.sql` to insert test data
2. Verify the data appears correctly
3. Clean up test data when done

## Important Notes

- **No impact on existing site**: This creates separate tables that don't interfere with your current setup
- **Character set**: Uses utf8mb4 to support emojis in activity names
- **Indexes**: Optimized for common queries (by sync_id, last_modified)
- **InnoDB engine**: Provides foreign key constraints and better reliability

## Next Steps

After database setup:
1. Note your database credentials
2. We'll create the PHP API configuration file
3. Set up the API endpoints

## Troubleshooting

**"Can't create database"**
- You might need to create it through cPanel's MySQL Databases interface first

**"Access denied"**
- Ensure your database user has the necessary permissions

**"Event scheduler is disabled"**
- The cleanup event is optional. You can run cleanup manually or via cron job instead