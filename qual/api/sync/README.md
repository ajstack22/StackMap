# StackMap Share API Setup

## Dual Environment Setup

The share API is deployed to both environments:
- **Qual/Testing**: `/public_html/qual/api/sync/`
- **Production**: `/public_html/api/sync/`

Share links always use the production API (`https://stackmap.app/api/sync/`) regardless of where they're created from.

## Installation

### For Each Environment:

1. **Navigate to the API directory**:
   ```bash
   # For qual:
   cd /public_html/qual/api/sync/
   
   # For production:
   cd /public_html/api/sync/
   ```

2. **Copy the example config file**:
   ```bash
   cp config.example.php config.php
   ```

3. **Edit config.php** with environment-specific credentials:
   - The config template auto-detects qual vs prod
   - Fill in BOTH sets of database credentials:
     - Qual database info in the qual section
     - Prod database info in the prod section
   - Use the same ENCRYPTION_KEY in both environments

4. **Create the database table**:
   Run the SQL from `share_schema.sql` in each database:
   ```bash
   mysql -u username -p database_name < share_schema.sql
   ```

5. **Set permissions**:
   ```bash
   chmod 644 *.php
   ```

## Important Notes

- Share URLs always point to `https://stackmap.app?share=TOKEN` (root domain)
- The share API at root (`/api/sync/`) handles all share access
- Qual environment is for testing other features
- Never commit config.php to git
- Use StackMap databases, not Manyla's

## Testing

After setup, test the share feature:
1. Enable Edit Mode in StackMap
2. Go to Settings > Cross-Device Sync  
3. Click "Share Progress"
4. Create a share link
5. Test the link in an incognito window