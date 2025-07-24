# StackMap Share API Setup

## Installation

1. **Copy the example config file**:
   ```bash
   cp config.example.php config.php
   ```

2. **Edit config.php** with your StackMap database credentials:
   - DB_HOST (usually 'localhost')
   - DB_NAME (your StackMap database name)
   - DB_USER (your StackMap database username)
   - DB_PASS (your StackMap database password)
   - ENCRYPTION_KEY (generate a random string)

3. **Create the database table**:
   Run the SQL from `share_schema.sql` in your StackMap database.

4. **Set permissions**:
   ```bash
   chmod 644 *.php
   ```

## Important Notes

- This uses StackMap's own database, NOT Manyla's database
- The config.php file should never be committed to git
- Make sure to use your StackMap database credentials, not Manyla's

## Testing

After setup, test the share feature:
1. Enable Edit Mode in StackMap
2. Go to Settings > Cross-Device Sync
3. Click "Share Progress"
4. Create a share link