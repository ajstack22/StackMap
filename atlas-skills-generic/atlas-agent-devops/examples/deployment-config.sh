#!/bin/bash
# Deployment configuration for your project
# Copy to .atlas/deployment-config.sh and customize

# Project settings
PROJECT_NAME="your-project"
VERSION_FILE="package.json"  # or version.txt, etc.

# Environment URLs
DEV_URL="http://localhost:3000"
STAGING_URL="https://staging.example.com"
PROD_URL="https://example.com"

# Build settings
BUILD_DIR="dist"  # or build, out, target, etc.
BUILD_COMMAND="npm run build"

# Test settings
TEST_COMMAND="npm test"
LINT_COMMAND="npm run lint"
TYPECHECK_COMMAND="npm run typecheck"  # or "tsc --noEmit"

# Changelog file (optional)
CHANGELOG_FILE="CHANGELOG.md"  # or PENDING_CHANGES.md, RELEASE_NOTES.md, etc.

# Git settings
REQUIRE_CLEAN_GIT_PROD="true"  # Require clean git state for production

# Deployment function (customize for your project)
run_deployment() {
    local env="$1"
    shift
    local options="$@"

    case "$env" in
        dev|development)
            echo "Deploying to development..."

            # Example: Run development server
            npm run dev

            # Or build and serve
            # npm run build && npm run start
            ;;

        staging|stage)
            echo "Deploying to staging..."

            # Example: Build and deploy to staging server
            npm run build

            # Deploy via SCP
            # scp -r dist/* user@staging-server:/var/www/html

            # Or deploy to cloud (AWS S3 example)
            # aws s3 sync dist/ s3://staging-bucket/ --delete

            # Or deploy container (Docker example)
            # docker build -t myapp:staging .
            # docker push myapp:staging
            # ssh staging-server "docker pull myapp:staging && docker-compose up -d"

            echo "✓ Deployed to staging: $STAGING_URL"
            ;;

        prod|production)
            echo "Deploying to production..."

            # Example: Build and deploy to production server
            npm run build

            # Deploy via SCP
            # scp -r dist/* user@prod-server:/var/www/html

            # Or deploy to cloud (AWS S3 + CloudFront example)
            # aws s3 sync dist/ s3://prod-bucket/ --delete
            # aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"

            # Or deploy container (Kubernetes example)
            # docker build -t myapp:$(cat VERSION) .
            # docker push myapp:$(cat VERSION)
            # kubectl set image deployment/myapp myapp=myapp:$(cat VERSION)

            echo "✓ Deployed to production: $PROD_URL"
            ;;

        *)
            echo "Unknown environment: $env"
            echo "Valid environments: dev, staging, prod"
            exit 1
            ;;
    esac
}

# Optional: Pre-deployment hook
pre_deployment_hook() {
    local env="$1"

    echo "Running pre-deployment checks for $env..."

    # Example: Check if required services are running
    # if ! docker ps | grep -q database; then
    #     echo "Error: Database container not running"
    #     exit 1
    # fi

    # Example: Run database migrations
    # if [ "$env" = "staging" ] || [ "$env" = "prod" ]; then
    #     npm run db:migrate
    # fi
}

# Optional: Post-deployment hook
post_deployment_hook() {
    local env="$1"

    echo "Running post-deployment checks for $env..."

    # Example: Smoke test
    # curl -f $STAGING_URL/health || exit 1

    # Example: Notify team
    # if [ "$env" = "prod" ]; then
    #     curl -X POST -H 'Content-type: application/json' \
    #         --data '{"text":"Deployed to production!"}' \
    #         $SLACK_WEBHOOK_URL
    # fi

    # Example: Tag release
    # if [ "$env" = "prod" ]; then
    #     VERSION=$(node -p "require('./package.json').version")
    #     git tag -a "v$VERSION" -m "Release v$VERSION"
    #     git push --tags
    # fi
}

# Export functions
export -f run_deployment
export -f pre_deployment_hook
export -f post_deployment_hook
