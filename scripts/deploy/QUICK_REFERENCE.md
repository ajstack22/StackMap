# Deployment Quick Reference

## Master Deployment Command

```bash
./scripts/deploy.sh [tier] [options]
```

## Tiers

| Tier | Environment | Purpose |
|------|-------------|---------|
| `qual` | Development/Testing | Local testing, QA validation |
| `beta` | Staging/Pre-Production | Beta testing, stakeholder review |
| `prod` | Production | Public release |

## Platform Options

| Option | Description |
|--------|-------------|
| `--web` | Deploy web only |
| `--ios` | Deploy iOS only |
| `--android` | Deploy Android only |
| `--all` | Deploy all platforms (default) |

## Common Commands

### Deploy to Qual (All Platforms)
```bash
./scripts/deploy.sh qual
# or
./scripts/deploy.sh qual --all
```

### Deploy to Beta (iOS Only)
```bash
./scripts/deploy.sh beta --ios
```

### Deploy to Production (All Platforms)
```bash
./scripts/deploy.sh prod --all
```

### Deploy to Qual (Web Only)
```bash
./scripts/deploy.sh qual --web
```

## Backward Compatibility

Old commands still work:

```bash
# Qual deployment
./scripts/qual_deploy.sh
./scripts/qual_deploy.sh --all
./scripts/qual_deploy.sh --web --ios

# Beta deployment
./scripts/deploy_beta.sh
./scripts/deploy_beta.sh --ios

# Production deployment
./scripts/prod_deploy.sh all
./scripts/prod_deploy.sh web
./scripts/prod_deploy.sh rollback
```

## Validation Levels by Tier

### QUAL (Permissive)
- ⚠️ Uncommitted changes allowed (warning)
- ⚠️ Missing optional tools allowed
- ✅ Requires: node, npm, git
- ℹ️ No credentials required

### BETA (Strict)
- ❌ Uncommitted changes **blocked**
- ❌ Missing fastlane **blocked**
- ❌ Missing credentials **blocked**
- ✅ All QUAL requirements + credentials

### PROD (Strictest)
- ❌ Any validation failure **blocks** deployment
- ❌ Missing SSH access **blocked**
- ❌ Version mismatches **blocked**
- ✅ All BETA requirements + SSH + strict validation

## Deployment Flow

```
1. Parse tier and options
2. Load library functions
3. Display deployment plan
   ↓
4. Run pre-deployment validation
   ✅ Environment check
   ✅ Git status check
   ✅ Credential check (beta/prod)
   ✅ Version check
   ✅ Dependency check
   ↓
5. Confirm deployment (beta/prod only)
   ↓
6. Delegate to tier script
   → qual_deploy.sh
   → deploy_beta.sh
   → prod_deploy.sh
   ↓
7. Run post-deployment verification
   ✅ Web health check
   ✅ Mobile builds check
   ✅ Version update check
   ✅ Git commit check
   ↓
8. Generate deployment report
   → deployments/YYYYMMDD-HHMMSS-{tier}-report.txt
   ↓
9. Display summary and next steps
```

## Deployment Reports

Reports saved to: `deployments/YYYYMMDD-HHMMSS-{tier}-report.txt`

### View Latest Report
```bash
# Any tier
ls -t deployments/*.txt | head -1 | xargs cat

# Specific tier
ls -t deployments/*-beta-report.txt | head -1 | xargs cat
```

### List Recent Deployments
```bash
ls -t deployments/*-report.txt | head -10
```

## Troubleshooting

### "Invalid tier" Error
```bash
# Error
./scripts/deploy.sh invalid

# Fix
./scripts/deploy.sh qual    # or beta, or prod
```

### Validation Failure (BETA/PROD)
```bash
# Error: "Uncommitted changes detected"

# Fix
git add -A
git commit -m "Your message"

# Or stash
git stash

# Then deploy
./scripts/deploy.sh beta
```

### Missing Credentials
```bash
# Error: "iOS API key not found"

# Fix
# Ensure ~/.fastlane/AuthKey_BJAC3957M4.p8 exists
# See docs/deployment/README.md for credential setup
```

### SSH Access Denied (PROD)
```bash
# Error: "Cannot connect to stackmap-cpanel"

# Fix
# Ensure SSH config exists in ~/.ssh/config
# Test: ssh stackmap-cpanel "exit"
```

## Environment Setup

### First-Time Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install Fastlane (for beta/prod mobile)**
   ```bash
   # macOS
   brew install fastlane

   # Or via Bundler
   gem install fastlane
   ```

3. **Setup iOS Credentials** (for beta/prod iOS)
   - Place API key at: `~/.fastlane/AuthKey_BJAC3957M4.p8`
   - See: `ios/fastlane/README.md`

4. **Setup Android Credentials** (for beta/prod Android)
   - Credentials stored in macOS Keychain
   - See: `android/fastlane/README.md`

5. **Setup SSH Access** (for prod web)
   - Add to `~/.ssh/config`:
     ```
     Host stackmap-cpanel
         HostName your-server.com
         User your-username
         IdentityFile ~/.ssh/id_rsa
     ```

## Library Functions

Libraries are available at `scripts/lib/`:

- `common.sh` - Logging, utilities, version management
- `validation.sh` - Pre-deployment validation
- `verification.sh` - Post-deployment verification
- `reporting.sh` - Report generation

See `scripts/lib/README.md` for details.

## Next Steps by Tier

### After QUAL Deployment
1. Test changes on qual environment
2. Run manual QA checks
3. When ready: `./scripts/deploy.sh beta --all`

### After BETA Deployment
1. Test beta builds on devices
2. Gather tester feedback
3. Monitor for issues
4. When ready: `./scripts/deploy.sh prod --all`

### After PROD Deployment
1. Monitor production health
2. Check error logs
3. Verify user feedback
4. Document release in changelog

## Emergency Rollback

### Web Rollback
```bash
./scripts/prod_deploy.sh rollback
```

### Mobile Rollback
- **iOS**: Use App Store Connect to select previous build
- **Android**: Use Play Console to roll back version

## Help and Documentation

- **Master Script Help**: `./scripts/deploy.sh invalid`
- **Library Documentation**: `scripts/lib/README.md`
- **Deployment Guide**: `docs/deployment/README.md`
- **Three-Tier Plan**: `docs/deployment/THREE_TIER_DEPLOYMENT_PLAN.md`
- **Phase 2 Summary**: `android/PHASE_2_IMPLEMENTATION_SUMMARY.md`

---

**Quick Tip:** Start with qual to test, promote to beta for wider testing, then deploy to prod for release.
