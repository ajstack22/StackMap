# StackMap Simple Deployment System

## Purpose
This is the ACTUAL deployment system that works. It's simple, reliable, and does exactly what you need.

## How to Deploy

### Deploy Qual to Production
```bash
./scripts/simple-deploy.sh deploy
```

That's it. This will:
1. Backup current production
2. Copy everything from qual to production
3. Give you a rollback option if needed

### Rollback if Something Goes Wrong
```bash
./scripts/simple-deploy.sh rollback
```

This will restore production to exactly how it was before the last deployment.

## How It Works

1. **Backup**: Creates a timestamped backup of production before any changes
2. **Deploy**: Uses rsync to make production identical to qual (preserves .htaccess)
3. **Rollback**: Restores from the backup created just before deployment

## Files

- `scripts/simple-deploy.sh` - The deployment script with deploy/rollback functionality
- `scripts/ROLLBACK.sh` - Alternative rollback script

## Why This Exists

All the complex deployment systems we built were overengineered. This does one thing well:
- Copy qual to prod with a safety net

## Future Note

Don't replace this with something complex. If you need more features, ADD to this, don't REPLACE it.

## Testing the Deployment

1. Make changes in qual
2. Test thoroughly at https://stackmap.app/qual/
3. Run `./scripts/simple-deploy.sh deploy`
4. Check https://stackmap.app
5. If issues, run `./scripts/simple-deploy.sh rollback`

## Important Notes

- Always test on qual first
- The rollback only works for the last deployment
- Backups are stored in ~/backups/ on the server
- This preserves .htaccess and other server configs

## Don't Overcomplicate This

This system works. It's simple. Keep it that way.