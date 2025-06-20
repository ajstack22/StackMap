#!/bin/bash
# Enhanced Oh My Zsh Setup for StackMap
# Enables additional productivity plugins and integrations

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🚀 Enhanced StackMap Oh My Zsh Setup${NC}"
echo -e "${PURPLE}====================================${NC}\n"

# Backup .zshrc
echo -e "${BLUE}Backing up .zshrc...${NC}"
cp ~/.zshrc ~/.zshrc.backup-enhanced-$(date +%Y%m%d-%H%M%S)

# Get current plugins
current_plugins=$(grep "^plugins=" ~/.zshrc | sed 's/plugins=(//' | sed 's/)//')

# Enhanced plugin list
enhanced_plugins="git npm node docker docker-compose vscode git-auto-fetch z fzf web-search colored-man-pages extract httpie github"

echo -e "${BLUE}Current plugins:${NC} $current_plugins"
echo -e "${BLUE}Adding enhanced plugins...${NC}"

# Create new plugins line
all_plugins=""
for plugin in $current_plugins; do
    all_plugins="$all_plugins $plugin"
done

for plugin in $enhanced_plugins; do
    if [[ ! "$all_plugins" =~ "$plugin" ]]; then
        all_plugins="$all_plugins $plugin"
    fi
done

# Remove leading space
all_plugins=$(echo $all_plugins | xargs)

# Update plugins in .zshrc
sed -i '' "s/^plugins=.*/plugins=($all_plugins)/" ~/.zshrc

echo -e "${GREEN}✅ Plugins updated!${NC}"

# Create enhanced StackMap aliases
echo -e "\n${BLUE}Creating enhanced aliases...${NC}"

cat > ~/.stackmap-enhanced.zsh << 'EOF'
#!/bin/zsh
# Enhanced StackMap Productivity Aliases

# Quick deployment with notification (macOS)
deploy-notify() {
    npm run deploy && osascript -e 'display notification "Deployment complete!" with title "StackMap"' 2>/dev/null || npm run deploy
}

# Smart git commit with branch name
gcb() {
    local branch=$(git branch --show-current)
    local ticket=$(echo $branch | grep -oE '[A-Z]+-[0-9]+' || echo "")
    if [[ -n "$ticket" ]]; then
        git commit -m "[$ticket] $1"
    else
        git commit -m "$1"
    fi
}

# Quick performance check
perf() {
    if command -v lighthouse &> /dev/null; then
        lighthouse ${1:-http://localhost:5500} --view
    else
        echo "Installing lighthouse..."
        npm install -g lighthouse
        lighthouse ${1:-http://localhost:5500} --view
    fi
}

# Find and fix common issues
fix() {
    case "$1" in
        "console") 
            echo "Removing console.log statements..."
            find . -name "*.js" -not -path "*/node_modules/*" -not -path "*/tests/*" \
                -exec sed -i '' '/console\.log/d' {} \;
            echo "✅ Console logs removed"
            ;;
        "lint") 
            echo "Running ESLint with auto-fix..."
            npm run lint -- --fix || npx eslint . --fix
            ;;
        "format")
            echo "Formatting code..."
            npx prettier --write "**/*.{js,jsx,json,css,md}" --ignore-path .gitignore
            ;;
        "test") 
            npm test -- --updateSnapshot
            ;;
        "all")
            fix console && fix lint && fix format
            ;;
        *) 
            echo "Available fixes: console, lint, format, test, all"
            ;;
    esac
}

# Enhanced navigation
alias smjs='cd $STACKMAP_HOME && cd js'
alias smcss='cd $STACKMAP_HOME && cd styles'
alias smtest='cd $STACKMAP_HOME && cd tests'
alias smdocs='cd $STACKMAP_HOME && cd docs'
alias smscripts='cd $STACKMAP_HOME && cd scripts'

# Quick file operations
alias smedit='code $STACKMAP_HOME'
alias smserve='cd $STACKMAP_HOME && npm run serve'
alias smwatch='cd $STACKMAP_HOME && npm run test:watch'

# Git shortcuts
alias gpr='gh pr create --fill --web'
alias gprv='gh pr view --web'
alias gprs='gh pr status'
alias giss='gh issue create --web'
alias gissv='gh issue view --web'

# Docker shortcuts (if using Docker)
alias dcu='docker-compose up'
alias dcd='docker-compose down'
alias dcb='docker-compose build'
alias dclogs='docker-compose logs -f'

# Testing shortcuts
alias smt='cd $STACKMAP_HOME && npm test'
alias smtc='cd $STACKMAP_HOME && npm run test:critical'
alias smtd='cd $STACKMAP_HOME && npm run test:debug'
alias smtw='cd $STACKMAP_HOME && npm run test:watch'

# Deployment shortcuts
alias smdq='cd $STACKMAP_HOME && npm run deploy:qual'
alias smdp='cd $STACKMAP_HOME && npm run deploy:prod'
alias smroll='cd $STACKMAP_HOME && npm run rollback'

# Quick status checks
smstatus() {
    echo -e "\n${BLUE}📊 StackMap Project Status${NC}"
    echo -e "${PURPLE}=========================${NC}\n"
    
    cd $STACKMAP_HOME
    
    # Git status
    echo -e "${YELLOW}Git Status:${NC}"
    git status -sb
    echo ""
    
    # File counts
    echo -e "${YELLOW}Project Stats:${NC}"
    echo "JavaScript files: $(find . -name "*.js" -not -path "*/node_modules/*" | wc -l)"
    echo "CSS files: $(find . -name "*.css" -not -path "*/node_modules/*" | wc -l)"
    echo "Test files: $(find tests -name "*.js" | wc -l)"
    echo ""
    
    # Recent commits
    echo -e "${YELLOW}Recent Commits:${NC}"
    git log --oneline -5
    echo ""
    
    # Node modules status
    if [[ -f "package-lock.json" ]]; then
        echo -e "${YELLOW}Dependencies:${NC}"
        echo "Last updated: $(stat -f "%Sm" package-lock.json 2>/dev/null || stat -c "%y" package-lock.json 2>/dev/null | cut -d' ' -f1)"
    fi
}

# Interactive menu for common tasks
smmenu() {
    echo -e "\n${BLUE}🎮 StackMap Interactive Menu${NC}"
    echo -e "${PURPLE}===========================${NC}\n"
    
    PS3="Select an action: "
    options=(
        "📁 Jump to directory"
        "🚀 Deploy to Qual"
        "🌐 Deploy to Production"
        "🧪 Run Tests"
        "🔍 Search in files"
        "📊 Show project status"
        "🛠️ Fix common issues"
        "📝 Create new issue"
        "🔄 Pull latest changes"
        "❌ Exit"
    )
    
    select opt in "${options[@]}"; do
        case $opt in
            "📁 Jump to directory")
                smjump
                break
                ;;
            "🚀 Deploy to Qual")
                smdq
                break
                ;;
            "🌐 Deploy to Production")
                smdp
                break
                ;;
            "🧪 Run Tests")
                smt
                break
                ;;
            "🔍 Search in files")
                echo -n "Search for: "
                read search_term
                smsearch "$search_term"
                break
                ;;
            "📊 Show project status")
                smstatus
                break
                ;;
            "🛠️ Fix common issues")
                fix all
                break
                ;;
            "📝 Create new issue")
                giss
                break
                ;;
            "🔄 Pull latest changes")
                git pull
                break
                ;;
            "❌ Exit")
                break
                ;;
            *)
                echo "Invalid option"
                ;;
        esac
    done
}

# Load additional custom configurations if they exist
[[ -f "$STACKMAP_HOME/.stackmap-custom.zsh" ]] && source "$STACKMAP_HOME/.stackmap-custom.zsh"

echo "💫 Enhanced StackMap configuration loaded!"
EOF

chmod +x ~/.stackmap-enhanced.zsh

# Add to .zshrc if not already there
if ! grep -q "stackmap-enhanced.zsh" ~/.zshrc; then
    echo -e "\n# Enhanced StackMap Configuration" >> ~/.zshrc
    echo "[[ -f ~/.stackmap-enhanced.zsh ]] && source ~/.stackmap-enhanced.zsh" >> ~/.zshrc
fi

# Install additional tools if needed
echo -e "\n${BLUE}Checking for additional tools...${NC}"

# Check for GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}GitHub CLI not found${NC}"
    echo -n "Install GitHub CLI for PR/Issue commands? (y/N): "
    read install_gh
    if [[ "$install_gh" == "y" ]]; then
        if [[ "$OSTYPE" == "darwin"* ]] && command -v brew &> /dev/null; then
            brew install gh
        else
            echo "Please install GitHub CLI from: https://cli.github.com/"
        fi
    fi
else
    echo -e "${GREEN}✅ GitHub CLI installed${NC}"
fi

# Check for lighthouse
if ! command -v lighthouse &> /dev/null; then
    echo -e "${YELLOW}Lighthouse CLI not found${NC}"
    echo -n "Install Lighthouse for performance testing? (y/N): "
    read install_lighthouse
    if [[ "$install_lighthouse" == "y" ]]; then
        npm install -g lighthouse
    fi
else
    echo -e "${GREEN}✅ Lighthouse installed${NC}"
fi

# Check for prettier
if ! command -v prettier &> /dev/null; then
    echo -e "${YELLOW}Prettier not found${NC}"
    echo -n "Install Prettier for code formatting? (y/N): "
    read install_prettier
    if [[ "$install_prettier" == "y" ]]; then
        npm install -g prettier
    fi
else
    echo -e "${GREEN}✅ Prettier installed${NC}"
fi

# Create VS Code settings if not exists
if [[ ! -f "$STACKMAP_HOME/.vscode/settings.json" ]]; then
    echo -e "\n${BLUE}Creating VS Code settings...${NC}"
    mkdir -p "$STACKMAP_HOME/.vscode"
    cat > "$STACKMAP_HOME/.vscode/settings.json" << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  },
  "files.exclude": {
    "node_modules": true,
    "test-results": true,
    "android-twa/build": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/bower_components": true,
    "**/*.code-search": true
  },
  "typescript.suggest.paths": false,
  "javascript.suggest.paths": false,
  "terminal.integrated.defaultProfile.osx": "zsh",
  "terminal.integrated.profiles.osx": {
    "zsh": {
      "path": "zsh",
      "args": ["-l"]
    }
  }
}
EOF
    echo -e "${GREEN}✅ VS Code settings created${NC}"
fi

# Final summary
echo -e "\n${GREEN}🎉 Enhanced StackMap Setup Complete!${NC}"
echo -e "${PURPLE}====================================${NC}\n"

echo -e "${YELLOW}New features enabled:${NC}"
echo "  ✅ Enhanced Oh My Zsh plugins"
echo "  ✅ Smart git commits (gcb)"
echo "  ✅ Performance testing (perf)"
echo "  ✅ Auto-fix commands (fix)"
echo "  ✅ Interactive menu (smmenu)"
echo "  ✅ Project status (smstatus)"
echo "  ✅ GitHub integration (gpr, giss)"

echo -e "\n${BLUE}Quick Start:${NC}"
echo "  1. Run: ${GREEN}source ~/.zshrc${NC}"
echo "  2. Try: ${GREEN}smmenu${NC} for interactive menu"
echo "  3. Try: ${GREEN}smstatus${NC} for project overview"
echo "  4. Try: ${GREEN}fix all${NC} to clean up code"

echo -e "\n${PURPLE}Happy coding with enhanced productivity! 🚀${NC}"