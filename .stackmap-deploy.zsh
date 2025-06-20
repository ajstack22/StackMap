#!/bin/zsh
# StackMap Intelligent Deployment System
# Advanced deployment shortcuts with safety checks and automation

# Color codes for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Deployment configuration
STACKMAP_ROOT="$HOME/StackMap/StackMap"
DEPLOY_BRANCH="main"
STAGING_BRANCH="staging"

# 🚀 Smart deployment with comprehensive checks
smartdeploy() {
    cd "$STACKMAP_ROOT"
    
    echo "${BLUE}🚀 StackMap Smart Deploy System${NC}"
    echo "${PURPLE}================================${NC}"
    
    # 1. Check current branch
    local current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "$DEPLOY_BRANCH" ]]; then
        echo "${YELLOW}⚠️  Warning: You're on branch '$current_branch', not '$DEPLOY_BRANCH'${NC}"
        echo -n "Continue anyway? (y/N): "
        read confirm
        [[ "$confirm" != "y" ]] && return 1
    fi
    
    # 2. Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        echo "${RED}❌ Uncommitted changes detected!${NC}"
        git status --short
        echo -n "${YELLOW}Commit all changes? (y/N): ${NC}"
        read commit_changes
        if [[ "$commit_changes" == "y" ]]; then
            echo -n "Commit message: "
            read commit_msg
            git add -A && git commit -m "$commit_msg"
        else
            return 1
        fi
    fi
    
    # 3. Run tests
    echo "${BLUE}🧪 Running tests...${NC}"
    if npm test &>/dev/null; then
        echo "${GREEN}✅ Tests passed!${NC}"
    else
        echo "${RED}❌ Tests failed!${NC}"
        echo -n "${YELLOW}Deploy anyway? (y/N): ${NC}"
        read deploy_anyway
        [[ "$deploy_anyway" != "y" ]] && return 1
    fi
    
    # 4. Check lint
    echo "${BLUE}🔍 Running linter...${NC}"
    if npm run lint &>/dev/null; then
        echo "${GREEN}✅ Linting passed!${NC}"
    else
        echo "${RED}⚠️  Linting warnings detected${NC}"
    fi
    
    # 5. Build check
    echo "${BLUE}🏗️  Building project...${NC}"
    if npm run build:all &>/dev/null; then
        echo "${GREEN}✅ Build successful!${NC}"
    else
        echo "${RED}❌ Build failed!${NC}"
        return 1
    fi
    
    # 6. Deploy
    echo "${BLUE}📤 Deploying to production...${NC}"
    git push origin "$current_branch"
    
    if command -v git-ftp &>/dev/null; then
        git-ftp push
        echo "${GREEN}✅ FTP deployment complete!${NC}"
    fi
    
    # 7. Tag release
    local version=$(node -p "require('./package.json').version")
    echo "${BLUE}🏷️  Tagging release v${version}...${NC}"
    git tag -a "v${version}" -m "Release v${version}"
    git push origin "v${version}"
    
    echo "${GREEN}🎉 Deployment complete!${NC}"
    echo "${PURPLE}================================${NC}"
    
    # Show deployment summary
    echo "${BLUE}📊 Deployment Summary:${NC}"
    echo "  Branch: $current_branch"
    echo "  Version: v${version}"
    echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "  Last commit: $(git log -1 --pretty=format:'%h - %s')"
}

# 🔄 Rollback to previous version
smrollback() {
    cd "$STACKMAP_ROOT"
    
    echo "${RED}⚠️  Rollback System${NC}"
    echo "${PURPLE}==================${NC}"
    
    # Show recent tags
    echo "${BLUE}Recent releases:${NC}"
    git tag -l "v*" | sort -V | tail -5 | nl
    
    echo -n "${YELLOW}Select version to rollback to (number): ${NC}"
    read version_num
    
    local target_tag=$(git tag -l "v*" | sort -V | tail -5 | sed -n "${version_num}p")
    
    if [[ -z "$target_tag" ]]; then
        echo "${RED}Invalid selection${NC}"
        return 1
    fi
    
    echo "${YELLOW}Rolling back to ${target_tag}...${NC}"
    git checkout "$target_tag"
    
    if command -v git-ftp &>/dev/null; then
        git-ftp push --force
    fi
    
    echo "${GREEN}✅ Rollback complete!${NC}"
}

# 📦 Create release package
smpackage() {
    cd "$STACKMAP_ROOT"
    
    echo "${BLUE}📦 Creating release package...${NC}"
    
    local version=$(node -p "require('./package.json').version")
    local release_dir="releases/v${version}"
    
    # Create release directory
    mkdir -p "$release_dir"
    
    # Build everything
    npm run build:all
    
    # Create archives
    echo "${BLUE}Creating extension package...${NC}"
    zip -r "$release_dir/stackmap-extension-v${version}.zip" \
        manifest.json js/ css/ images/ icons/ \
        -x "*/.*" "*/node_modules/*" "*/test/*"
    
    echo "${BLUE}Creating Android package...${NC}"
    cp "builds/android/stackmap.apk" "$release_dir/stackmap-v${version}.apk" 2>/dev/null || true
    
    echo "${BLUE}Creating iOS package...${NC}"
    cp "builds/ios/stackmap.ipa" "$release_dir/stackmap-v${version}.ipa" 2>/dev/null || true
    
    # Generate changelog
    echo "${BLUE}Generating changelog...${NC}"
    git log --pretty=format:"- %s" $(git describe --tags --abbrev=0)..HEAD > "$release_dir/CHANGELOG.md"
    
    echo "${GREEN}✅ Release package created in $release_dir${NC}"
    ls -la "$release_dir"
}

# 🚦 Staging deployment
smstaging() {
    cd "$STACKMAP_ROOT"
    
    echo "${YELLOW}🚦 Deploying to staging...${NC}"
    
    # Switch to staging branch
    git checkout "$STAGING_BRANCH" || git checkout -b "$STAGING_BRANCH"
    
    # Merge current changes
    git merge "$DEPLOY_BRANCH"
    
    # Deploy to staging
    echo "${BLUE}Deploying to staging server...${NC}"
    # Add your staging deployment command here
    
    echo "${GREEN}✅ Staging deployment complete!${NC}"
    echo "Staging URL: https://staging.stackmap.app"
}

# 🏃 Quick deploy (skip non-critical checks)
smquickdeploy() {
    cd "$STACKMAP_ROOT"
    
    echo "${YELLOW}⚡ Quick Deploy (minimal checks)${NC}"
    
    # Only check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        gaa && gcmsg "Quick deploy"
    fi
    
    # Push and deploy
    gp && git-ftp push
    
    echo "${GREEN}✅ Quick deploy complete!${NC}"
}

# 📊 Deployment status
smdeploystatus() {
    cd "$STACKMAP_ROOT"
    
    echo "${BLUE}📊 Deployment Status${NC}"
    echo "${PURPLE}==================${NC}"
    
    # Current version
    local version=$(node -p "require('./package.json').version")
    echo "Current version: ${GREEN}v${version}${NC}"
    
    # Last deployment
    echo "Last deployment: $(git log -1 --grep="Deploy" --format="%ar by %an")"
    
    # Current branch
    echo "Current branch: $(git branch --show-current)"
    
    # Uncommitted changes
    local changes=$(git status --porcelain | wc -l)
    if [[ $changes -gt 0 ]]; then
        echo "Uncommitted changes: ${RED}$changes files${NC}"
    else
        echo "Uncommitted changes: ${GREEN}None${NC}"
    fi
    
    # Remote status
    git fetch origin &>/dev/null
    local behind=$(git rev-list HEAD..origin/$(git branch --show-current) --count)
    local ahead=$(git rev-list origin/$(git branch --show-current)..HEAD --count)
    
    echo "Remote status: ${GREEN}↑$ahead${NC} ahead, ${RED}↓$behind${NC} behind"
    
    # Recent deployments
    echo "\n${BLUE}Recent deployments:${NC}"
    git log --grep="Deploy\|Release" --pretty=format:"%h - %s (%ar)" -5
}

# 🛡️ Pre-deployment security check
smsecuritycheck() {
    cd "$STACKMAP_ROOT"
    
    echo "${BLUE}🛡️  Security Check${NC}"
    echo "${PURPLE}=================${NC}"
    
    # Check for exposed secrets
    echo "${BLUE}Checking for exposed secrets...${NC}"
    if rg -i "(api[_-]?key|secret|password|token)" --type js | grep -v "// " | grep -v "example"; then
        echo "${RED}⚠️  Potential secrets detected!${NC}"
    else
        echo "${GREEN}✅ No secrets detected${NC}"
    fi
    
    # Check dependencies
    echo "${BLUE}Checking for vulnerable dependencies...${NC}"
    npm audit --audit-level=high
    
    # Check for debug code
    echo "${BLUE}Checking for debug code...${NC}"
    local debug_count=$(rg "console\.(log|debug)|debugger" --type js | wc -l)
    if [[ $debug_count -gt 0 ]]; then
        echo "${YELLOW}⚠️  Found $debug_count debug statements${NC}"
    else
        echo "${GREEN}✅ No debug code found${NC}"
    fi
}

# 🎯 Deployment aliases
alias smdep="smartdeploy"
alias smqdep="smquickdeploy"
alias smstage="smstaging"
alias smpkg="smpackage"
alias smroll="smrollback"
alias smdepstat="smdeploystatus"
alias smsec="smsecuritycheck"

# Deployment combo commands
alias smshipit="smsec && smartdeploy"
alias smsafedeploy="smtest && smlint && smsec && smartdeploy"
alias smhotdeploy="git stash && gco $DEPLOY_BRANCH && git stash pop && smquickdeploy"

echo "🚀 StackMap Intelligent Deployment System loaded!"