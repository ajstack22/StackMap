#!/bin/zsh
# StackMap Lightning Navigation System
# Jump to any file or directory instantly using smart fuzzy search

# Required: Install fzf for advanced features
# brew install fzf

# Color configuration
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

# StackMap root directory
export STACKMAP_ROOT="$HOME/StackMap/StackMap"

# 🚀 Smart jump to any StackMap directory
smjump() {
    local selected
    selected=$(find "$STACKMAP_ROOT" -type d -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/build/*" 2>/dev/null | 
        sed "s|$STACKMAP_ROOT/||" | 
        fzf --preview "ls -la $STACKMAP_ROOT/{}" \
            --preview-window=right:50% \
            --header="Jump to directory" \
            --prompt="📁 > ")
    
    if [[ -n "$selected" ]]; then
        cd "$STACKMAP_ROOT/$selected"
        echo "${GREEN}📍 Jumped to: $selected${NC}"
        ls -la
    fi
}

# 📄 Quick file opener with preview
smopen() {
    local selected
    selected=$(find "$STACKMAP_ROOT" -type f \
        -not -path "*/node_modules/*" \
        -not -path "*/.git/*" \
        -not -path "*/dist/*" \
        -not -path "*/build/*" \
        -not -name "*.log" \
        -not -name "*.map" \
        -not -name ".DS_Store" 2>/dev/null | 
        sed "s|$STACKMAP_ROOT/||" | 
        fzf --preview "cat $STACKMAP_ROOT/{}" \
            --preview-window=right:60% \
            --header="Open file" \
            --prompt="📄 > ")
    
    if [[ -n "$selected" ]]; then
        ${EDITOR:-code} "$STACKMAP_ROOT/$selected"
        echo "${GREEN}📝 Opened: $selected${NC}"
    fi
}

# 🔍 Search file contents and jump to location
smsearch() {
    local query="${1:-}"
    if [[ -z "$query" ]]; then
        echo -n "${YELLOW}Search for: ${NC}"
        read query
    fi
    
    local selected
    selected=$(rg --line-number --no-heading "$query" "$STACKMAP_ROOT" \
        --glob "!node_modules" \
        --glob "!dist" \
        --glob "!build" \
        --glob "!*.log" \
        --glob "!*.map" 2>/dev/null |
        fzf --delimiter=: \
            --preview 'bat --color=always {1} --highlight-line {2}' \
            --preview-window=right:60%:+{2}-10 \
            --header="Search results for: $query" \
            --prompt="🔍 > ")
    
    if [[ -n "$selected" ]]; then
        local file=$(echo "$selected" | cut -d: -f1)
        local line=$(echo "$selected" | cut -d: -f2)
        ${EDITOR:-code} "$file:$line"
        echo "${GREEN}📍 Jumped to: $file:$line${NC}"
    fi
}

# 📊 Quick stats viewer
smtree() {
    cd "$STACKMAP_ROOT"
    echo "${BLUE}📊 StackMap Project Structure${NC}"
    echo "${PURPLE}=============================${NC}"
    
    # Use tree if available, otherwise custom implementation
    if command -v tree &>/dev/null; then
        tree -L 3 -I 'node_modules|dist|build|*.log|.git' --dirsfirst
    else
        # Custom tree implementation
        find . -type d -not -path "*/node_modules/*" -not -path "*/.git/*" -maxdepth 3 | 
        sed 's|[^/]*/|- |g' | sort
    fi
}

# 🎯 Recent files navigator
smrecent() {
    local selected
    selected=$(git ls-files --others --exclude-standard --cached | 
        xargs -I {} stat -f "%m {}" {} 2>/dev/null | 
        sort -rn | head -20 | cut -d' ' -f2- |
        fzf --preview "cat {}" \
            --preview-window=right:60% \
            --header="Recent files" \
            --prompt="🕐 > ")
    
    if [[ -n "$selected" ]]; then
        ${EDITOR:-code} "$selected"
        echo "${GREEN}📝 Opened: $selected${NC}"
    fi
}

# 🏷️ Jump to git branches
smbranch() {
    cd "$STACKMAP_ROOT"
    local branch
    branch=$(git branch -a | 
        grep -v HEAD | 
        sed 's/^[* ]*//' | 
        fzf --preview 'git log --oneline --graph --date=short --pretty="format:%C(auto)%cd %h%d %s" {}' \
            --preview-window=right:50% \
            --header="Switch branch" \
            --prompt="🌿 > ")
    
    if [[ -n "$branch" ]]; then
        git checkout "$(echo "$branch" | sed 's/remotes\/origin\///')"
        echo "${GREEN}✅ Switched to: $branch${NC}"
    fi
}

# 📦 Navigate to specific file types
smfiletype() {
    local type="${1:-js}"
    local selected
    
    case "$type" in
        js|javascript)
            local pattern="*.js"
            ;;
        css|style*)
            local pattern="*.css"
            ;;
        html)
            local pattern="*.html"
            ;;
        json)
            local pattern="*.json"
            ;;
        md|markdown)
            local pattern="*.md"
            ;;
        *)
            local pattern="*.$type"
            ;;
    esac
    
    selected=$(find "$STACKMAP_ROOT" -name "$pattern" -not -path "*/node_modules/*" 2>/dev/null | 
        sed "s|$STACKMAP_ROOT/||" |
        fzf --preview "cat $STACKMAP_ROOT/{}" \
            --preview-window=right:60% \
            --header="$type files" \
            --prompt="📄 > ")
    
    if [[ -n "$selected" ]]; then
        ${EDITOR:-code} "$STACKMAP_ROOT/$selected"
        echo "${GREEN}📝 Opened: $selected${NC}"
    fi
}

# 🎨 Smart component navigator
smcomponent() {
    echo "${BLUE}🎨 Component Navigator${NC}"
    local component_type
    
    select component_type in "JavaScript" "CSS" "HTML" "API" "Test" "Config"; do
        case $component_type in
            JavaScript)
                smfiletype js
                ;;
            CSS)
                smfiletype css
                ;;
            HTML)
                smfiletype html
                ;;
            API)
                smjump && cd includes/api
                ;;
            Test)
                smjump && cd test
                ;;
            Config)
                smopen && find . -name "*config*" -o -name ".*rc" -o -name "*.json"
                ;;
        esac
        break
    done
}

# 🗺️ Visual project map
smmap() {
    cd "$STACKMAP_ROOT"
    echo "${BLUE}🗺️  StackMap Project Map${NC}"
    echo "${PURPLE}======================${NC}"
    echo
    echo "${GREEN}📁 Core Directories:${NC}"
    echo "  js/         - JavaScript source files"
    echo "  css/        - Stylesheets"
    echo "  images/     - Image assets"
    echo "  data/       - Data files"
    echo "  includes/   - Server-side includes"
    echo "  test/       - Test suites"
    echo
    echo "${YELLOW}📄 Key Files:${NC}"
    echo "  manifest.json      - Extension manifest"
    echo "  package.json       - Project configuration"
    echo "  index.html         - Main entry point"
    echo
    echo "${PURPLE}🚀 Quick Commands:${NC}"
    echo "  smjump     - Jump to any directory"
    echo "  smopen     - Open any file"
    echo "  smsearch   - Search in files"
    echo "  smrecent   - Recent files"
    echo "  smbranch   - Switch branches"
}

# 🏃 Quick navigation aliases
alias sj="smjump"
alias so="smopen"
alias ss="smsearch"
alias sr="smrecent"
alias sb="smbranch"
alias sft="smfiletype"

# File type specific shortcuts
alias sjsfiles="smfiletype js"
alias scssfiles="smfiletype css"
alias shtmlfiles="smfiletype html"
alias sjsonfiles="smfiletype json"

# Direct navigation shortcuts (even faster!)
alias smroot="cd $STACKMAP_ROOT"
alias smj="cd $STACKMAP_ROOT/js"
alias smc="cd $STACKMAP_ROOT/css"
alias smi="cd $STACKMAP_ROOT/images"
alias smd="cd $STACKMAP_ROOT/data"
alias sma="cd $STACKMAP_ROOT/includes/api"
alias smt="cd $STACKMAP_ROOT/test"

# Smart back navigation
alias smback="cd -"
alias sm..="cd .."
alias sm...="cd ../.."

# Initialize z for directory jumping (if available)
if command -v z &>/dev/null; then
    # Pre-populate z database with StackMap directories
    find "$STACKMAP_ROOT" -type d -not -path "*/node_modules/*" -not -path "*/.git/*" -maxdepth 3 | 
    while read -r dir; do
        z "$dir" 2>/dev/null
    done
fi

echo "⚡ StackMap Lightning Navigation loaded! Type 'smmap' for navigation guide."