# DevOps Agent Quick Start

Get up and running with the generic DevOps agent in 5 minutes.

## 1. Copy Files (1 minute)

```bash
# In your project root
mkdir -p .atlas/scripts

# Copy deployment script
cp atlas-skills-generic/atlas-agent-devops/scripts/deploy-all.sh .atlas/scripts/deploy.sh
chmod +x .atlas/scripts/deploy.sh

# Copy configuration template
cp atlas-skills-generic/atlas-agent-devops/examples/deployment-config.sh .atlas/
```

## 2. Customize Configuration (2 minutes)

Edit `.atlas/deployment-config.sh`:

```bash
#!/bin/bash

# Your build/test commands
BUILD_COMMAND="npm run build"     # Change to your build command
TEST_COMMAND="npm test"           # Change to your test command
LINT_COMMAND="npm run lint"       # Change to your lint command

# Deployment logic for your project
run_deployment() {
    local env="$1"

    case "$env" in
        dev)
            # How do you run development?
            npm run dev
            ;;
        staging)
            # How do you deploy to staging?
            npm run build
            # scp -r dist/* user@staging:/var/www
            ;;
        prod)
            # How do you deploy to production?
            npm run build
            # scp -r dist/* user@prod:/var/www
            ;;
    esac
}

export -f run_deployment
```

## 3. Test Deployment (1 minute)

```bash
# Deploy to development
.atlas/scripts/deploy.sh dev

# Output shows:
# ✓ Loading project configuration
# ✓ Running tests
# ✓ Running build
# ✓ Deployment succeeded
```

## 4. Document Strategy (1 minute)

Copy and customize deployment documentation:

```bash
cp atlas-skills-generic/atlas-agent-devops/examples/deployment.md .atlas/
cp atlas-skills-generic/atlas-agent-devops/examples/deployment-checklist.md .atlas/
```

Edit `.atlas/deployment.md` with your environments and procedures.

## 5. Deploy to Staging/Production

```bash
# Deploy to staging
.atlas/scripts/deploy.sh staging

# Deploy to production (requires clean git state)
.atlas/scripts/deploy.sh prod
```

## Common Customizations

### Change Environment Names
```bash
# In deployment-config.sh
run_deployment() {
    case "$env" in
        local)        # Instead of "dev"
            ;;
        test)         # Instead of "staging"
            ;;
        live)         # Instead of "prod"
            ;;
    esac
}
```

### Add Custom Environments
```bash
run_deployment() {
    case "$env" in
        dev|staging|prod)
            # Standard environments
            ;;
        qa)
            # Custom QA environment
            npm run build:qa
            deploy_to_qa
            ;;
    esac
}
```

### Skip Quality Gates
```bash
# Skip tests (faster iteration)
.atlas/scripts/deploy.sh dev --skip-tests

# Skip build (if already built)
.atlas/scripts/deploy.sh dev --skip-build

# Skip production confirmation
.atlas/scripts/deploy.sh prod --force
```

### Change Quality Gates
```bash
# In deployment-config.sh

# Use different commands
TEST_COMMAND="pytest"                    # Python
TEST_COMMAND="cargo test"                # Rust
TEST_COMMAND="./gradlew test"            # Java/Gradle

# Disable optional gates
LINT_COMMAND=""                          # No linting
TYPECHECK_COMMAND=""                     # No type checking

# Change changelog file
CHANGELOG_FILE="RELEASE_NOTES.md"
```

### Add Deployment Hooks
```bash
# In deployment-config.sh

pre_deployment_hook() {
    echo "Running database migrations..."
    npm run db:migrate
}

post_deployment_hook() {
    echo "Sending Slack notification..."
    curl -X POST $SLACK_WEBHOOK -d '{"text":"Deployed!"}'
}

export -f pre_deployment_hook
export -f post_deployment_hook
```

## Project-Specific Examples

### React/Vue/Angular Web App
```bash
BUILD_COMMAND="npm run build"
run_deployment() {
    case "$env" in
        staging)
            npm run build
            aws s3 sync dist/ s3://staging-bucket/
            ;;
        prod)
            npm run build
            aws s3 sync dist/ s3://prod-bucket/
            ;;
    esac
}
```

### Node.js API
```bash
BUILD_COMMAND="npm run build"
run_deployment() {
    case "$env" in
        staging)
            docker build -t api:staging .
            docker push api:staging
            ssh staging "docker pull api:staging && docker-compose up -d"
            ;;
    esac
}
```

### Static Site (Jekyll/Hugo/etc.)
```bash
BUILD_COMMAND="hugo"
run_deployment() {
    case "$env" in
        prod)
            hugo
            rsync -avz public/ user@server:/var/www/
            ;;
    esac
}
```

### Python Application
```bash
TEST_COMMAND="pytest"
LINT_COMMAND="flake8 ."
BUILD_COMMAND="python setup.py build"

run_deployment() {
    case "$env" in
        prod)
            python setup.py build
            python setup.py install
            systemctl restart myapp
            ;;
    esac
}
```

## Next Steps

1. **Customize for your needs** - Edit `.atlas/deployment-config.sh`
2. **Document your process** - Update `.atlas/deployment.md`
3. **Test thoroughly** - Deploy to dev/staging before production
4. **Monitor deployments** - Set up logging and metrics
5. **Iterate and improve** - Update process as project evolves

## Help

- Full documentation: See `SKILL.md`
- Examples: See `examples/` directory
- Troubleshooting: See README.md troubleshooting section
- Integration examples: See README.md integration examples

## Summary

You now have:
- ✅ Generic deployment script (`.atlas/scripts/deploy.sh`)
- ✅ Custom configuration (`.atlas/deployment-config.sh`)
- ✅ Documentation templates (`.atlas/deployment.md`)
- ✅ Quality gates (tests, linting, build)
- ✅ Environment validation (git state, etc.)

Deploy with confidence!
