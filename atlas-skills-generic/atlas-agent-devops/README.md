# Atlas Agent: DevOps (Generic)

Generic, portable DevOps agent skill for any deployment pipeline.

## Overview

This skill provides DevOps expertise for deployment, CI/CD, infrastructure, and automation. It's completely customizable for any project's deployment needs.

## What's Included

### Core Files

1. **SKILL.md** - Complete DevOps agent specification
   - Core responsibilities and principles
   - Generic deployment strategy
   - Quality gates and validation
   - Troubleshooting guide
   - Customization instructions

2. **scripts/deploy-all.sh** - Generic deployment wrapper script
   - Validates prerequisites
   - Runs quality gates
   - Executes custom deployment logic
   - Color-coded output
   - Error handling

### Example Files

3. **examples/deployment.md** - Example deployment strategy documentation
4. **examples/deployment-config.sh** - Example deployment configuration
5. **examples/deployment-checklist.md** - Example deployment checklist

## Quick Start

### 1. Copy Files to Your Project

```bash
# Create .atlas directory in your project
mkdir -p .atlas/scripts

# Copy deployment script
cp atlas-skills-generic/atlas-agent-devops/scripts/deploy-all.sh .atlas/scripts/deploy.sh
chmod +x .atlas/scripts/deploy.sh

# Copy example configuration files
cp atlas-skills-generic/atlas-agent-devops/examples/deployment.md .atlas/
cp atlas-skills-generic/atlas-agent-devops/examples/deployment-config.sh .atlas/
cp atlas-skills-generic/atlas-agent-devops/examples/deployment-checklist.md .atlas/
```

### 2. Customize Configuration

Edit `.atlas/deployment-config.sh` with your deployment logic:

```bash
#!/bin/bash

# Define your environments
DEV_URL="http://localhost:3000"
STAGING_URL="https://staging.example.com"
PROD_URL="https://example.com"

# Define your build/test commands
BUILD_COMMAND="npm run build"
TEST_COMMAND="npm test"
LINT_COMMAND="npm run lint"

# Define deployment logic
run_deployment() {
    local env="$1"

    case "$env" in
        dev)
            npm run dev
            ;;
        staging)
            npm run build
            scp -r dist/* user@staging:/var/www
            ;;
        prod)
            npm run build
            scp -r dist/* user@prod:/var/www
            ;;
    esac
}

export -f run_deployment
```

### 3. Document Your Strategy

Edit `.atlas/deployment.md` with:
- Your environment definitions
- Deployment procedures
- Quality gates
- Rollback procedures
- Monitoring setup

### 4. Deploy

```bash
# Deploy to development
.atlas/scripts/deploy.sh dev

# Deploy to staging
.atlas/scripts/deploy.sh staging

# Deploy to production
.atlas/scripts/deploy.sh prod
```

## Features

### Quality Gates

The deployment script automatically runs:
- Tests (configurable)
- Linting (configurable)
- Type checking (configurable)
- Build validation (configurable)

Skip quality gates with flags:
```bash
.atlas/scripts/deploy.sh staging --skip-tests
.atlas/scripts/deploy.sh staging --skip-build
```

### Git State Validation

Production deployments require clean git state by default:
```bash
# This will fail if you have uncommitted changes
.atlas/scripts/deploy.sh prod
```

Skip confirmation with:
```bash
.atlas/scripts/deploy.sh prod --force
```

### Color-Coded Output

- **Green:** Success messages
- **Yellow:** Warnings
- **Red:** Errors
- **Blue:** Information

## Customization Options

### Environment Variables

Define in `.atlas/deployment-config.sh`:

```bash
# Build settings
BUILD_DIR="dist"
BUILD_COMMAND="npm run build"

# Test settings
TEST_COMMAND="npm test"
LINT_COMMAND="npm run lint"
TYPECHECK_COMMAND="npm run typecheck"

# Changelog (optional)
CHANGELOG_FILE="CHANGELOG.md"

# Git settings
REQUIRE_CLEAN_GIT_PROD="true"
```

### Deployment Hooks

Add pre/post deployment hooks:

```bash
# .atlas/deployment-config.sh

pre_deployment_hook() {
    local env="$1"
    echo "Running pre-deployment checks..."
    # Run database migrations, start services, etc.
}

post_deployment_hook() {
    local env="$1"
    echo "Running post-deployment checks..."
    # Smoke tests, notifications, tagging, etc.
}

export -f pre_deployment_hook
export -f post_deployment_hook
```

### Custom Environments

Add custom environments to `run_deployment()`:

```bash
run_deployment() {
    local env="$1"

    case "$env" in
        dev|staging|prod)
            # Standard environments
            ;;
        qa)
            # Custom QA environment
            npm run build:qa
            deploy_to_qa_server
            ;;
        uat)
            # Custom UAT environment
            npm run build:uat
            deploy_to_uat_server
            ;;
    esac
}
```

## Project Types

This skill works with any project type:

### Web Applications
```bash
# Example: React/Vue/Angular
BUILD_COMMAND="npm run build"
run_deployment() {
    npm run build
    scp -r dist/* user@server:/var/www
}
```

### Mobile Applications
```bash
# Example: React Native
BUILD_COMMAND="npm run build:ios && npm run build:android"
run_deployment() {
    fastlane ios beta
    fastlane android beta
}
```

### Backend/API
```bash
# Example: Node.js API
BUILD_COMMAND="npm run build"
run_deployment() {
    docker build -t api:$VERSION .
    docker push api:$VERSION
    kubectl set image deployment/api api=api:$VERSION
}
```

### Static Sites
```bash
# Example: Static site generator
BUILD_COMMAND="npm run build"
run_deployment() {
    npm run build
    aws s3 sync dist/ s3://my-bucket/ --delete
}
```

### Multi-Platform
```bash
# Example: Monorepo with web + mobile
run_deployment() {
    case "$env" in
        staging)
            # Deploy web
            npm run build:web
            deploy_web

            # Deploy mobile
            npm run build:mobile
            deploy_mobile
            ;;
    esac
}
```

## Deployment Strategies

### Blue-Green Deployment
```bash
run_deployment() {
    # Deploy to blue environment
    deploy_to_blue

    # Run smoke tests
    test_blue_environment

    # Switch traffic to blue
    switch_traffic_to_blue

    # Keep green as backup for rollback
}
```

### Canary Deployment
```bash
run_deployment() {
    # Deploy to 10% of servers
    deploy_canary

    # Monitor metrics for 30 minutes
    monitor_canary

    # If successful, roll out to 100%
    deploy_full
}
```

### Rolling Deployment
```bash
run_deployment() {
    # Deploy to servers one at a time
    for server in $SERVERS; do
        deploy_to_server $server
        health_check $server
        sleep 30  # Wait between deployments
    done
}
```

## Integration Examples

### AWS S3 + CloudFront
```bash
run_deployment() {
    npm run build
    aws s3 sync dist/ s3://my-bucket/ --delete
    aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/*"
}
```

### Docker + Kubernetes
```bash
run_deployment() {
    VERSION=$(cat VERSION)
    docker build -t myapp:$VERSION .
    docker push myapp:$VERSION
    kubectl set image deployment/myapp myapp=myapp:$VERSION
    kubectl rollout status deployment/myapp
}
```

### Heroku
```bash
run_deployment() {
    git push heroku main
    heroku run npm run db:migrate
}
```

### Netlify/Vercel
```bash
run_deployment() {
    case "$env" in
        staging)
            netlify deploy --dir=dist
            ;;
        prod)
            netlify deploy --dir=dist --prod
            ;;
    esac
}
```

## Best Practices

### 1. Always Test First
Deploy to dev/staging before production:
```bash
.atlas/scripts/deploy.sh dev      # Test locally
.atlas/scripts/deploy.sh staging  # Test on staging
.atlas/scripts/deploy.sh prod     # Deploy to production
```

### 2. Keep Changelog Updated
Update changelog before deployment for better commit messages and release notes.

### 3. Clean Git State for Production
Commit all changes before production deployment to ensure code review.

### 4. Monitor After Deployment
Set up monitoring and check metrics after deployment:
- Error rates
- Response times
- User sessions
- Critical flows

### 5. Have Rollback Plan
Always have a rollback plan ready:
```bash
# Tag releases for easy rollback
git tag -a v1.2.3 -m "Release 1.2.3"

# Rollback to previous version
git revert HEAD
.atlas/scripts/deploy.sh prod
```

### 6. Document Everything
Keep `.atlas/deployment.md` updated with:
- Current deployment process
- Environment configurations
- Known issues
- Rollback procedures

## Troubleshooting

### Deployment Script Not Found
```bash
# Make sure script is executable
chmod +x .atlas/scripts/deploy.sh

# Check script location
ls -la .atlas/scripts/deploy.sh
```

### Quality Gates Failing
```bash
# Run quality gates locally
npm test
npm run lint
npm run build

# Skip failing gates (not recommended for production)
.atlas/scripts/deploy.sh staging --skip-tests
```

### Configuration Not Loaded
```bash
# Check configuration file exists
ls -la .atlas/deployment-config.sh

# Check configuration file is valid bash
bash -n .atlas/deployment-config.sh

# Source configuration manually to test
source .atlas/deployment-config.sh
```

### Deployment Function Not Found
```bash
# Make sure run_deployment() is defined and exported
export -f run_deployment

# Test function directly
source .atlas/deployment-config.sh
run_deployment dev
```

## Support

For issues or questions:
1. Check examples in `examples/` directory
2. Review SKILL.md for detailed documentation
3. Check troubleshooting section above
4. Customize for your specific needs

## License

This skill is part of the Atlas Framework and is freely usable and customizable for any project.
