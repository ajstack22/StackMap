# StackMap Share API Setup

## Installation

1. **Copy the example config file**:
   ```bash
   cp config.example.php config.php
   ```

2. **Edit config.php** with your database credentials:
   - DB_HOST (usually 'localhost')
   - DB_NAME (your database name)
   - DB_USER (your database username)
   - DB_PASS (your database password)
   - ENCRYPTION_KEY (generate a random string)

3. **Create the database table**:
   Run the SQL from `share_schema.sql` in your database.

4. **Set permissions**:
   ```bash
   chmod 644 *.php
   ```

## Security Notes

- Never commit config.php to version control
- Use a strong, random ENCRYPTION_KEY
- Ensure your database user has only the necessary permissions
- Consider using environment variables for production

## Testing

After setup, test the share feature:
1. Enable Edit Mode in StackMap
2. Go to Settings > Cross-Device Sync
3. Click "Share Progress"
4. Create a share link