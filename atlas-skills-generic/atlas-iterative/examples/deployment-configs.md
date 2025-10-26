# Deployment Configuration Examples

This document provides examples of how to configure Phase 3 (Deploy) for different project types and deployment strategies.

---

## Table of Contents

1. [Simple Web App (Static Hosting)](#simple-web-app-static-hosting)
2. [React/Vue/Angular App (CI/CD)](#reactvueangular-app-cicd)
3. [Node.js Backend (Docker)](#nodejs-backend-docker)
4. [Python Service (SSH Deploy)](#python-service-ssh-deploy)
5. [Mobile App (React Native)](#mobile-app-react-native)
6. [Monorepo (Multiple Services)](#monorepo-multiple-services)
7. [Serverless (AWS Lambda)](#serverless-aws-lambda)
8. [Kubernetes Cluster](#kubernetes-cluster)

---

## Simple Web App (Static Hosting)

### Scenario
Static HTML/CSS/JS site deployed to Netlify, Vercel, or similar.

### Phase 3 Configuration

```bash
# 1. Final validation
npm run build

# 2. Update changelog
# Add to CHANGELOG.md or git commit message

# 3. Deploy
git push origin main  # Triggers auto-deploy on Netlify/Vercel

# Alternative: Direct deploy
netlify deploy --prod
# or
vercel --prod

# 4. Verify
open https://your-site.com
```

### Changelog Format
```markdown
## [Unreleased]
### Changed
- Improved button spacing on landing page
```

---

## React/Vue/Angular App (CI/CD)

### Scenario
SPA with CI/CD pipeline (GitHub Actions, GitLab CI, etc.)

### Phase 3 Configuration

```bash
# 1. Final validation
npm run typecheck
npm test
npm run build

# 2. Update changelog
# Edit CHANGELOG.md

# 3. Deploy via CI/CD
git add .
git commit -m "refactor: improve button spacing for better UX"
git push origin feature/button-spacing

# CI/CD pipeline automatically:
# - Runs tests
# - Builds app
# - Deploys to staging
# - (Optionally) Promotes to production after approval

# 4. Verify
open https://staging.your-app.com
```

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm run deploy:staging
```

---

## Node.js Backend (Docker)

### Scenario
Express/Fastify API deployed via Docker to staging server.

### Phase 3 Configuration

```bash
# 1. Final validation
npm run typecheck
npm test
docker build -t myapp:staging .

# 2. Update changelog
# Edit CHANGELOG.md

# 3. Deploy
./scripts/deploy.sh staging

# What deploy.sh does:
# - Builds Docker image
# - Pushes to registry
# - SSH to server
# - Pulls new image
# - Restarts container

# 4. Verify
curl https://staging-api.your-app.com/health
```

### Deploy Script Example
```bash
#!/bin/bash
# scripts/deploy.sh

ENV=$1

# Build and tag
docker build -t myapp:$ENV .
docker tag myapp:$ENV registry.your-app.com/myapp:$ENV

# Push to registry
docker push registry.your-app.com/myapp:$ENV

# Deploy to server
ssh deploy@$ENV-server << 'EOF'
  docker pull registry.your-app.com/myapp:$ENV
  docker stop myapp || true
  docker rm myapp || true
  docker run -d --name myapp -p 3000:3000 registry.your-app.com/myapp:$ENV
EOF

echo "Deployed to $ENV"
```

---

## Python Service (SSH Deploy)

### Scenario
Flask/Django app deployed to Linux server via SSH.

### Phase 3 Configuration

```bash
# 1. Final validation
mypy .
pytest
pip freeze > requirements.txt

# 2. Update changelog
# Edit CHANGELOG.md

# 3. Deploy
./scripts/deploy.sh staging

# What deploy.sh does:
# - SSH to server
# - Pull latest code
# - Install dependencies
# - Run migrations
# - Restart service

# 4. Verify
curl https://staging-api.your-app.com/health
```

### Deploy Script Example
```bash
#!/bin/bash
# scripts/deploy.sh

ENV=$1
SERVER="deploy@$ENV-server.your-app.com"
APP_DIR="/var/www/myapp"

echo "Deploying to $ENV..."

ssh $SERVER << EOF
  cd $APP_DIR
  git pull origin main
  source venv/bin/activate
  pip install -r requirements.txt
  python manage.py migrate
  sudo systemctl restart myapp
EOF

echo "Deployed to $ENV"
```

---

## Mobile App (React Native)

### Scenario
React Native app with multiple deployment tiers.

### Phase 3 Configuration

```bash
# 1. Final validation
npm run typecheck
npm test

# 2. Update changelog
# Edit CHANGELOG.md or PENDING_CHANGES.md

# 3. Deploy to development environment
./scripts/deploy.sh dev --all

# What deploy.sh does:
# - Updates version numbers
# - iOS: Builds and uploads to TestFlight (dev group)
# - Android: Builds and uploads to Play Console (internal track)

# 4. Verify
# - Check TestFlight for iOS build
# - Check Play Console for Android build
# - Install and test on physical device
```

### Deploy Script Example
```bash
#!/bin/bash
# scripts/deploy.sh

TIER=$1
PLATFORM=$2

case $PLATFORM in
  --all)
    npm run deploy:ios:$TIER
    npm run deploy:android:$TIER
    ;;
  --ios)
    npm run deploy:ios:$TIER
    ;;
  --android)
    npm run deploy:android:$TIER
    ;;
esac
```

---

## Monorepo (Multiple Services)

### Scenario
Monorepo with multiple services (frontend, backend, worker).

### Phase 3 Configuration

```bash
# 1. Final validation
npm run typecheck --workspace=frontend
npm test --workspace=frontend

# 2. Update changelog
# Edit frontend/CHANGELOG.md

# 3. Deploy only changed service
./scripts/deploy.sh frontend staging

# What deploy.sh does:
# - Detects which service changed
# - Runs validation for that service
# - Deploys only that service

# 4. Verify
open https://staging.your-app.com
```

### Deploy Script Example
```bash
#!/bin/bash
# scripts/deploy.sh

SERVICE=$1
ENV=$2

echo "Deploying $SERVICE to $ENV..."

case $SERVICE in
  frontend)
    cd apps/frontend
    npm run build
    npm run deploy:$ENV
    ;;
  backend)
    cd apps/backend
    docker build -t backend:$ENV .
    docker push registry.your-app.com/backend:$ENV
    kubectl set image deployment/backend backend=registry.your-app.com/backend:$ENV
    ;;
  worker)
    cd apps/worker
    docker build -t worker:$ENV .
    docker push registry.your-app.com/worker:$ENV
    kubectl set image deployment/worker worker=registry.your-app.com/worker:$ENV
    ;;
esac
```

---

## Serverless (AWS Lambda)

### Scenario
Serverless functions deployed to AWS Lambda via Serverless Framework.

### Phase 3 Configuration

```bash
# 1. Final validation
npm test
serverless package --stage staging

# 2. Update changelog
# Edit CHANGELOG.md

# 3. Deploy
serverless deploy --stage staging --function userService

# What this does:
# - Packages function
# - Uploads to S3
# - Updates Lambda function
# - Updates API Gateway routes (if needed)

# 4. Verify
curl https://staging-api.your-app.com/users
# or
aws lambda invoke --function-name userService-staging response.json
```

### Serverless Config Example
```yaml
# serverless.yml
service: myapp

provider:
  name: aws
  runtime: nodejs18.x
  stage: ${opt:stage, 'dev'}

functions:
  userService:
    handler: src/users.handler
    events:
      - http:
          path: users
          method: get
```

---

## Kubernetes Cluster

### Scenario
Microservices deployed to Kubernetes cluster.

### Phase 3 Configuration

```bash
# 1. Final validation
npm test
docker build -t myapp:staging .

# 2. Update changelog
# Edit CHANGELOG.md

# 3. Deploy
./scripts/deploy.sh staging

# What deploy.sh does:
# - Builds Docker image
# - Pushes to registry
# - Updates Kubernetes deployment
# - Waits for rollout to complete

# 4. Verify
kubectl get pods -n staging
kubectl logs -f deployment/myapp -n staging
curl https://staging.your-app.com/health
```

### Deploy Script Example
```bash
#!/bin/bash
# scripts/deploy.sh

ENV=$1
IMAGE="registry.your-app.com/myapp:$ENV"

echo "Building image..."
docker build -t $IMAGE .

echo "Pushing to registry..."
docker push $IMAGE

echo "Deploying to Kubernetes..."
kubectl set image deployment/myapp myapp=$IMAGE -n $ENV
kubectl rollout status deployment/myapp -n $ENV

echo "Deployed to $ENV"
```

### Kubernetes Manifest Example
```yaml
# k8s/staging/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: staging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: registry.your-app.com/myapp:staging
        ports:
        - containerPort: 3000
```

---

## Changelog Format Examples

### Keep a Changelog Format
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- User authentication system

### Changed
- Improved button spacing for better UX
- Updated card layout with better visual hierarchy

### Fixed
- Login form validation bug

## [1.2.0] - 2025-01-15
### Added
- Dark mode support
```

### Custom Format (PENDING_CHANGES.md)
```markdown
# Pending Changes

## Title: Improve Button Spacing
### Changes Made:
- Increased button padding from 8px to 16px
- Applied consistently across login and signup screens
- Tested on mobile and desktop breakpoints
- Peer reviewed and approved

---

## Title: Fix Login Validation
### Changes Made:
- Added email format validation
- Fixed password length check
- Added error messages for invalid inputs
```

### Conventional Commits (Git Only)
```bash
# Just use descriptive commit messages
git commit -m "refactor: improve button spacing for better UX

- Increased padding from 8px to 16px
- Tested on mobile and desktop
- Peer reviewed by @reviewer"
```

---

## Environment-Specific Considerations

### Development
- Fast deployment (seconds)
- Skip some validation (optional)
- Can deploy incomplete features
- Frequent deployments (multiple per day)

### Staging
- Full validation required
- Mirrors production config
- Deploy after peer review
- Less frequent (few per day)

### Production
- Strictest validation
- Requires approval
- Rollback plan mandatory
- Scheduled deployments (planned releases)

---

## Rollback Procedures

Always have a rollback plan:

### Docker/Kubernetes
```bash
# Rollback to previous version
kubectl rollout undo deployment/myapp -n staging
```

### Git-based Deploy
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

### Static Hosting
```bash
# Netlify
netlify rollback

# Vercel
vercel rollback
```

### Database Migrations
```bash
# Always test rollback before deploying
python manage.py migrate app_name 0001  # Rollback to specific migration
```

---

## Summary

Choose the deployment configuration that matches your infrastructure:

1. **Static Sites**: Git push → auto-deploy
2. **CI/CD Pipelines**: Git push → automated tests → deploy
3. **Docker**: Build → push → pull → restart
4. **Serverless**: Package → upload → update functions
5. **Kubernetes**: Build → push → update deployment
6. **SSH Deploy**: Pull code → install deps → restart service

Adapt the Phase 3 section of the Iterative workflow to match your deployment process.
