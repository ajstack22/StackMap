#!/bin/zsh
# StackMap GitHub CLI Integration
# Streamlined GitHub workflow directly from terminal

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
RED='\033[0;31m'
NC='\033[0m'

# GitHub CLI is authenticated! Username: ajstack22

# 🚀 Pull Request Workflow
smpr() {
    local action="${1:-create}"
    
    case "$action" in
        create)
            echo "${BLUE}📝 Creating Pull Request...${NC}"
            # Auto-fill title from branch name, open editor for body
            gh pr create --fill
            ;;
        list)
            echo "${BLUE}📋 Open Pull Requests:${NC}"
            gh pr list --state open --limit 10
            ;;
        review)
            echo "${BLUE}👀 PRs needing review:${NC}"
            gh pr list --search "is:open is:pr review:required"
            ;;
        checks)
            echo "${BLUE}🔍 Checking PR status...${NC}"
            gh pr checks
            ;;
        merge)
            echo "${YELLOW}🔀 Merging PR...${NC}"
            gh pr merge --auto --merge
            ;;
        view)
            gh pr view --web
            ;;
        *)
            echo "${YELLOW}Usage: smpr [create|list|review|checks|merge|view]${NC}"
            ;;
    esac
}

# 🐛 Issue Management
smissue() {
    local action="${1:-list}"
    
    case "$action" in
        list)
            echo "${BLUE}🐛 Open Issues:${NC}"
            gh issue list --limit 10
            ;;
        create)
            echo "${BLUE}🆕 Creating Issue...${NC}"
            gh issue create
            ;;
        view)
            local issue_num="$2"
            if [[ -n "$issue_num" ]]; then
                gh issue view "$issue_num"
            else
                echo "${RED}Please provide issue number${NC}"
            fi
            ;;
        close)
            local issue_num="$2"
            if [[ -n "$issue_num" ]]; then
                gh issue close "$issue_num"
                echo "${GREEN}✅ Issue #$issue_num closed${NC}"
            fi
            ;;
        *)
            echo "${YELLOW}Usage: smissue [list|create|view <num>|close <num>]${NC}"
            ;;
    esac
}

# 🔄 Workflow Management
smworkflow() {
    local action="${1:-list}"
    
    case "$action" in
        list)
            echo "${BLUE}⚙️  GitHub Actions Workflows:${NC}"
            gh workflow list
            ;;
        run)
            local workflow="$2"
            if [[ -n "$workflow" ]]; then
                gh workflow run "$workflow"
                echo "${GREEN}✅ Workflow triggered${NC}"
            else
                echo "${YELLOW}Available workflows:${NC}"
                gh workflow list
            fi
            ;;
        view)
            echo "${BLUE}📊 Recent workflow runs:${NC}"
            gh run list --limit 5
            ;;
        logs)
            local run_id="$2"
            if [[ -n "$run_id" ]]; then
                gh run view "$run_id" --log
            else
                gh run view --log
            fi
            ;;
        *)
            echo "${YELLOW}Usage: smworkflow [list|run <name>|view|logs [id]]${NC}"
            ;;
    esac
}

# 📊 Repository Stats
smrepo() {
    echo "${BLUE}📊 StackMap Repository Info${NC}"
    echo "${PURPLE}=========================${NC}"
    gh repo view ajstack22/StackMap
}

# 🚀 Quick Release
smrelease() {
    local version="${1}"
    if [[ -z "$version" ]]; then
        echo "${YELLOW}Current tags:${NC}"
        git tag -l | sort -V | tail -5
        echo -n "${YELLOW}Enter version (e.g., v1.2.3): ${NC}"
        read version
    fi
    
    echo "${BLUE}🚀 Creating release $version...${NC}"
    
    # Create release notes from recent commits
    local notes=$(git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"- %s" | head -20)
    
    gh release create "$version" \
        --title "Release $version" \
        --notes "$notes" \
        --draft
    
    echo "${GREEN}✅ Draft release created! Edit and publish at:${NC}"
    echo "https://github.com/ajstack22/StackMap/releases"
}

# 🔍 Code Search
smghsearch() {
    local query="$*"
    if [[ -z "$query" ]]; then
        echo -n "${YELLOW}Search for: ${NC}"
        read query
    fi
    
    echo "${BLUE}🔍 Searching StackMap for: $query${NC}"
    gh search code "$query" --repo ajstack22/StackMap --limit 10
}

# 📝 Quick Gist
smgist() {
    local file="${1}"
    local desc="${2:-StackMap code snippet}"
    
    if [[ -z "$file" ]]; then
        echo "${YELLOW}Usage: smgist <file> [description]${NC}"
        return 1
    fi
    
    gh gist create "$file" --desc "$desc" --public
    echo "${GREEN}✅ Gist created!${NC}"
}

# 🔔 Notifications
smnotify() {
    echo "${BLUE}🔔 GitHub Notifications:${NC}"
    gh api notifications | jq -r '.[] | "\(.subject.type): \(.subject.title)"' | head -10
}

# 🎯 PR-based Deployment Flow
smshippr() {
    echo "${BLUE}🚀 PR-Based Deployment Flow${NC}"
    echo "${PURPLE}=========================${NC}"
    
    # Check current branch
    local branch=$(git branch --show-current)
    if [[ "$branch" == "main" ]]; then
        echo "${RED}⚠️  You're on main branch! Create a feature branch first.${NC}"
        return 1
    fi
    
    # Run tests
    echo "${BLUE}Running tests...${NC}"
    if npm test; then
        echo "${GREEN}✅ Tests passed${NC}"
    else
        echo "${RED}❌ Tests failed! Fix before creating PR.${NC}"
        return 1
    fi
    
    # Create PR
    echo "${BLUE}Creating pull request...${NC}"
    gh pr create --fill --base main
    
    # Wait for checks
    echo "${BLUE}Waiting for checks...${NC}"
    gh pr checks --watch
    
    # Auto-merge if checks pass
    echo "${GREEN}✅ Ready to merge!${NC}"
    gh pr merge --auto --merge
}

# 📈 Contribution Stats
smcontrib() {
    echo "${BLUE}📈 Your StackMap Contributions${NC}"
    echo "${PURPLE}============================${NC}"
    
    # Recent commits
    echo "${YELLOW}Recent commits:${NC}"
    git log --author="$(git config user.name)" --oneline --since="30 days ago" | head -10
    
    # PR stats
    echo "\n${YELLOW}Your Pull Requests:${NC}"
    gh pr list --author "@me" --state all --limit 5
    
    # Issue stats
    echo "\n${YELLOW}Your Issues:${NC}"
    gh issue list --author "@me" --state all --limit 5
}

# 🎯 Aliases for speed
alias ghpr="smpr"
alias ghissue="smissue" 
alias ghflow="smworkflow"
alias ghsearch="smghsearch"
alias ghship="smshippr"

# Quick status
alias ghstatus="gh pr status && echo && gh issue status"

# Help command
smghhelp() {
    echo "${PURPLE}🐙 StackMap GitHub CLI Commands${NC}"
    echo "${PURPLE}==============================${NC}"
    echo "${GREEN}Pull Requests:${NC}"
    echo "  smpr create    - Create new PR"
    echo "  smpr list      - List open PRs"
    echo "  smpr merge     - Merge current PR"
    echo "  smshippr       - Full PR deployment flow"
    echo ""
    echo "${GREEN}Issues:${NC}"
    echo "  smissue list   - List open issues"
    echo "  smissue create - Create new issue"
    echo ""
    echo "${GREEN}Workflows:${NC}"
    echo "  smworkflow run - Trigger GitHub Action"
    echo "  smworkflow view - View recent runs"
    echo ""
    echo "${GREEN}Other:${NC}"
    echo "  smghsearch     - Search code in repo"
    echo "  smrelease      - Create new release"
    echo "  smcontrib      - View your contributions"
    echo "  ghstatus       - Quick PR & issue status"
}

echo "${GREEN}✅ GitHub CLI Integration loaded! (${NC}ajstack22${GREEN})${NC}"
echo "Type 'smghhelp' for GitHub commands"