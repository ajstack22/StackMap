#!/bin/bash
# StackMap Git Hooks Setup
# Automated quality checks on every commit

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🔧 Setting up StackMap Git Hooks${NC}"
echo -e "${PURPLE}===============================${NC}\n"

# Create hooks directory if it doesn't exist
HOOKS_DIR=".git/hooks"
mkdir -p "$HOOKS_DIR"

# Pre-commit hook
echo -e "${BLUE}Creating pre-commit hook...${NC}"
cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/sh
# StackMap Pre-commit Hook
# Runs quality checks before allowing commit

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "${BLUE}🔍 StackMap Pre-commit Checks${NC}"
echo "============================="

# Check for debugging code
echo "${YELLOW}Checking for debug code...${NC}"
DEBUG_COUNT=$(git diff --cached --name-only --diff-filter=ACM | xargs grep -l "console\.log\|debugger" 2>/dev/null | wc -l)
if [ $DEBUG_COUNT -gt 0 ]; then
    echo "${YELLOW}⚠️  Found console.log or debugger statements:${NC}"
    git diff --cached --name-only --diff-filter=ACM | xargs grep -n "console\.log\|debugger" 2>/dev/null | head -5
    echo "${YELLOW}Remove debug code or use --no-verify to skip${NC}"
    # Just warn, don't block
fi

# Check for large files
echo "${YELLOW}Checking file sizes...${NC}"
LARGE_FILES=$(git diff --cached --name-only --diff-filter=ACM | xargs -I {} find {} -size +1M 2>/dev/null)
if [ ! -z "$LARGE_FILES" ]; then
    echo "${RED}❌ Large files detected (>1MB):${NC}"
    echo "$LARGE_FILES"
    echo "${RED}Consider using Git LFS or excluding these files${NC}"
    exit 1
fi

# Run linting if available
if [ -f "package.json" ] && grep -q "\"lint\"" package.json; then
    echo "${YELLOW}Running linter...${NC}"
    npm run lint --silent
    if [ $? -ne 0 ]; then
        echo "${RED}❌ Linting failed! Fix errors or use --no-verify${NC}"
        exit 1
    fi
    echo "${GREEN}✅ Linting passed${NC}"
fi

# Check for merge conflicts
echo "${YELLOW}Checking for merge conflicts...${NC}"
if git diff --cached --name-only --diff-filter=ACM | xargs grep -l "<<<<<<< HEAD\|=======" 2>/dev/null; then
    echo "${RED}❌ Merge conflict markers found!${NC}"
    exit 1
fi

# Check for sensitive data
echo "${YELLOW}Checking for sensitive data...${NC}"
SENSITIVE=$(git diff --cached --name-only --diff-filter=ACM | xargs grep -E "(api[_-]?key|secret|password|token).*=.*['\"]" 2>/dev/null | grep -v "example\|demo\|test" || true)
if [ ! -z "$SENSITIVE" ]; then
    echo "${RED}⚠️  Possible sensitive data detected:${NC}"
    echo "$SENSITIVE" | head -5
    echo "${YELLOW}Review carefully before committing${NC}"
fi

echo "${GREEN}✅ Pre-commit checks passed!${NC}"
EOF

chmod +x "$HOOKS_DIR/pre-commit"
echo -e "${GREEN}✅ Pre-commit hook installed${NC}"

# Pre-push hook
echo -e "\n${BLUE}Creating pre-push hook...${NC}"
cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/bin/sh
# StackMap Pre-push Hook
# Final checks before pushing to remote

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "${BLUE}🚀 StackMap Pre-push Checks${NC}"
echo "=========================="

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Protect main branch
if [ "$BRANCH" = "main" ]; then
    echo "${YELLOW}⚠️  Pushing to main branch${NC}"
    echo -n "Are you sure? (y/N): "
    read confirm < /dev/tty
    if [ "$confirm" != "y" ]; then
        echo "${RED}Push cancelled${NC}"
        exit 1
    fi
fi

# Run tests if available
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo "${YELLOW}Running tests...${NC}"
    npm test --silent
    if [ $? -ne 0 ]; then
        echo "${RED}❌ Tests failed! Fix before pushing${NC}"
        exit 1
    fi
    echo "${GREEN}✅ Tests passed${NC}"
fi

# Check for TODO/FIXME in changed files
echo "${YELLOW}Checking for unresolved TODOs...${NC}"
TODO_COUNT=$(git diff origin/$BRANCH..$BRANCH --name-only | xargs grep -c "TODO\|FIXME" 2>/dev/null | awk -F: '{sum+=$2} END {print sum}')
if [ "$TODO_COUNT" -gt 0 ]; then
    echo "${YELLOW}📝 Found $TODO_COUNT TODO/FIXME items in changed files${NC}"
fi

echo "${GREEN}✅ Pre-push checks passed!${NC}"
EOF

chmod +x "$HOOKS_DIR/pre-push"
echo -e "${GREEN}✅ Pre-push hook installed${NC}"

# Commit-msg hook
echo -e "\n${BLUE}Creating commit-msg hook...${NC}"
cat > "$HOOKS_DIR/commit-msg" << 'EOF'
#!/bin/sh
# StackMap Commit Message Hook
# Ensures good commit message format

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

commit_regex='^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .{1,50}'
merge_regex='^Merge '

if ! head -1 "$1" | grep -qE "($commit_regex|$merge_regex)"; then
    echo "${RED}❌ Invalid commit message format!${NC}"
    echo "${YELLOW}Format: <type>(<scope>): <subject>${NC}"
    echo "${YELLOW}Example: feat(navigation): add fuzzy search${NC}"
    echo ""
    echo "Types: feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert"
    exit 1
fi

# Check message length
if [ $(head -1 "$1" | wc -c) -gt 72 ]; then
    echo "${YELLOW}⚠️  Commit message too long (>72 chars)${NC}"
fi

echo "${GREEN}✅ Commit message format OK${NC}"
EOF

chmod +x "$HOOKS_DIR/commit-msg"
echo -e "${GREEN}✅ Commit-msg hook installed${NC}"

# Post-commit hook
echo -e "\n${BLUE}Creating post-commit hook...${NC}"
cat > "$HOOKS_DIR/post-commit" << 'EOF'
#!/bin/sh
# StackMap Post-commit Hook
# Actions after successful commit

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Show commit info
echo "${GREEN}✅ Committed successfully!${NC}"
echo "${BLUE}$(git log -1 --oneline)${NC}"

# Update stats file (if exists)
if [ -f ".stats" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $(git log -1 --oneline)" >> .stats
fi

# Reminder for PR
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
    echo "${PURPLE}💡 Ready to create a PR? Run: smpr create${NC}"
fi
EOF

chmod +x "$HOOKS_DIR/post-commit"
echo -e "${GREEN}✅ Post-commit hook installed${NC}"

# Post-merge hook
echo -e "\n${BLUE}Creating post-merge hook...${NC}"
cat > "$HOOKS_DIR/post-merge" << 'EOF'
#!/bin/sh
# StackMap Post-merge Hook
# Auto-install dependencies after merge

# Colors
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Check if package.json changed
if git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep -q "package.json"; then
    echo "${YELLOW}📦 package.json changed, installing dependencies...${NC}"
    npm install
    echo "${GREEN}✅ Dependencies updated${NC}"
fi

# Check if any build files changed
if git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep -E "\.(js|css|html)$" > /dev/null; then
    echo "${YELLOW}🔨 Source files changed, rebuilding...${NC}"
    if [ -f "package.json" ] && grep -q "\"build\"" package.json; then
        npm run build
        echo "${GREEN}✅ Build completed${NC}"
    fi
fi
EOF

chmod +x "$HOOKS_DIR/post-merge"
echo -e "${GREEN}✅ Post-merge hook installed${NC}"

# Create hook management aliases
echo -e "\n${BLUE}Creating hook management commands...${NC}"
cat > ".git-hooks-config" << 'EOF'
# StackMap Git Hooks Configuration

# Disable specific hooks temporarily
alias hookoff="mv .git/hooks .git/hooks.disabled && echo 'Git hooks disabled'"
alias hookon="mv .git/hooks.disabled .git/hooks && echo 'Git hooks enabled'"

# Skip hooks for single command
alias gitskip="git -c core.hooksPath=/dev/null"

# Update hooks
alias hookupdate="./scripts/setup-git-hooks.sh"
EOF

# Summary
echo -e "\n${GREEN}🎉 Git Hooks Setup Complete!${NC}"
echo -e "${PURPLE}=========================${NC}"
echo -e "\n${YELLOW}Installed hooks:${NC}"
echo -e "  ${GREEN}pre-commit${NC}    - Lint, check for debug code, file sizes"
echo -e "  ${GREEN}pre-push${NC}      - Run tests, protect main branch"
echo -e "  ${GREEN}commit-msg${NC}    - Enforce commit message format"
echo -e "  ${GREEN}post-commit${NC}   - Show commit info, PR reminder"
echo -e "  ${GREEN}post-merge${NC}    - Auto-install deps, rebuild"
echo -e "\n${YELLOW}Usage tips:${NC}"
echo -e "  Skip hooks once:     ${GREEN}git commit --no-verify${NC}"
echo -e "  Disable all hooks:   ${GREEN}hookoff${NC}"
echo -e "  Re-enable hooks:     ${GREEN}hookon${NC}"
echo -e "\n${BLUE}Commit format: ${GREEN}<type>(<scope>): <subject>${NC}"
echo -e "Example: ${GREEN}feat(navigation): add fuzzy search${NC}"