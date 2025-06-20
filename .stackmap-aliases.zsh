#!/bin/zsh
# StackMap Productivity Aliases - Supercharge your development with Oh My Zsh!
# Source this file in your .zshrc: source ~/StackMap/StackMap/.stackmap-aliases.zsh

# 🚀 NAVIGATION SHORTCUTS - Jump anywhere instantly
alias sm="cd ~/StackMap/StackMap"
alias smjs="cd ~/StackMap/StackMap/js"
alias smcss="cd ~/StackMap/StackMap/css"
alias smapi="cd ~/StackMap/StackMap/includes/api"
alias smimg="cd ~/StackMap/StackMap/images"
alias smdata="cd ~/StackMap/StackMap/data"
alias smbuild="cd ~/StackMap/StackMap/builds"
alias smtest="cd ~/StackMap/StackMap/test"

# 🎯 QUICK FILE ACCESS - Open key files instantly
alias smconf="$EDITOR ~/StackMap/StackMap/js/configuration.js"
alias smmanifest="$EDITOR ~/StackMap/StackMap/manifest.json"
alias smindex="$EDITOR ~/StackMap/StackMap/index.html"
alias smpackage="$EDITOR ~/StackMap/StackMap/package.json"

# 🛠️ BUILD & DEVELOPMENT - One command, multiple actions
alias smbuildall="cd ~/StackMap/StackMap && npm run build:extension && npm run build:android && npm run build:ios"
alias smbuildext="cd ~/StackMap/StackMap && npm run build:extension"
alias smbuildmobile="cd ~/StackMap/StackMap && npm run build:android && npm run build:ios"
alias smwatch="cd ~/StackMap/StackMap && npm run watch"
alias smserve="cd ~/StackMap/StackMap && python -m http.server 8000"

# 🚀 DEPLOYMENT MAGIC - Ship it with style
alias smdeploy="cd ~/StackMap/StackMap && gaa && gcmsg 'Deploy' && gp && git-ftp push"
alias smdeploydry="cd ~/StackMap/StackMap && git-ftp push --dry-run"
alias smdeploycheck="cd ~/StackMap/StackMap && ./scripts/pre-deploy-check.sh"
alias smship="smdeploycheck && smdeploy"

# 🔍 SMART SEARCH - Find anything instantly
alias smfind="cd ~/StackMap/StackMap && rg"
alias smfindjs="cd ~/StackMap/StackMap && rg --type js"
alias smfindcss="cd ~/StackMap/StackMap && rg --type css"
alias smfindhtml="cd ~/StackMap/StackMap && rg --type html"

# 📊 GIT PRODUCTIVITY - Git on steroids
alias smstatus="cd ~/StackMap/StackMap && gst"
alias smlog="cd ~/StackMap/StackMap && glg"
alias smdiff="cd ~/StackMap/StackMap && gd"
alias smcommit="cd ~/StackMap/StackMap && gaa && gcmsg"
alias smpush="cd ~/StackMap/StackMap && gp"
alias smpull="cd ~/StackMap/StackMap && gl"
alias smundo="cd ~/StackMap/StackMap && git reset HEAD~1"

# 🧪 TESTING & QUALITY - Test like a pro
alias smtest="cd ~/StackMap/StackMap && npm test"
alias smlint="cd ~/StackMap/StackMap && npm run lint"
alias smtypecheck="cd ~/StackMap/StackMap && npm run typecheck"
alias smaudit="cd ~/StackMap/StackMap && npm audit"
alias smlighthouse="lighthouse http://localhost:8000 --view"

# 🐛 DEBUGGING HELPERS - Debug at light speed
alias smconsole="cd ~/StackMap/StackMap && tail -f logs/*.log"
alias smclean="cd ~/StackMap/StackMap && rm -rf node_modules dist builds/temp"
alias smreset="cd ~/StackMap/StackMap && git clean -fd && git reset --hard"
alias smrebuild="smclean && cd ~/StackMap/StackMap && npm install && smbuildall"

# 📦 PACKAGE MANAGEMENT - Manage dependencies like a boss
alias smadd="cd ~/StackMap/StackMap && npm install"
alias smupdate="cd ~/StackMap/StackMap && npm update"
alias smoutdated="cd ~/StackMap/StackMap && npm outdated"
alias smfix="cd ~/StackMap/StackMap && npm audit fix"

# 🎨 CSS & STYLING - Style with confidence
alias smcssmin="cd ~/StackMap/StackMap && npm run minify:css"
alias smcsswatch="cd ~/StackMap/StackMap && npm run watch:css"
alias smcsslint="cd ~/StackMap/StackMap && npm run lint:css"

# 📱 MOBILE DEVELOPMENT - iOS & Android shortcuts
alias smandroid="cd ~/StackMap/StackMap && npm run build:android && npm run open:android"
alias smios="cd ~/StackMap/StackMap && npm run build:ios && npm run open:ios"
alias smmobile="cd ~/StackMap/StackMap && npm run build:mobile && npm run test:mobile"

# 🔥 POWER COMBOS - Complex workflows in one command
alias smfresh="smpull && smrebuild && smtest"
alias smhotfix="gco -b hotfix/quick-fix && smfresh"
alias smrelease="smtest && smlint && smtypecheck && smbuildall && smdeploycheck"

# 💡 SMART FUNCTIONS - Intelligent helpers

# Quick commit with auto-generated message based on changes
smcommitai() {
    cd ~/StackMap/StackMap
    local changes=$(git diff --cached --stat | head -20)
    local message="Update: $changes"
    gaa && gcmsg "$message"
}

# Find and replace across all JS files
smreplace() {
    cd ~/StackMap/StackMap
    if [ $# -ne 2 ]; then
        echo "Usage: smreplace 'old_text' 'new_text'"
        return 1
    fi
    rg -l "$1" --type js | xargs sed -i '' "s/$1/$2/g"
}

# Quick branch creation with prefix
smfeature() {
    cd ~/StackMap/StackMap
    gco -b "feature/$1"
}

smbugfix() {
    cd ~/StackMap/StackMap
    gco -b "bugfix/$1"
}

# Show project stats
smstats() {
    cd ~/StackMap/StackMap
    echo "📊 StackMap Project Stats:"
    echo "JS Files: $(find . -name "*.js" -not -path "./node_modules/*" | wc -l)"
    echo "CSS Files: $(find . -name "*.css" -not -path "./node_modules/*" | wc -l)"
    echo "Total LOC: $(find . -name "*.js" -o -name "*.css" -not -path "./node_modules/*" | xargs wc -l | tail -1)"
    echo "Last Deploy: $(git log -1 --grep="Deploy" --format="%ar")"
}

# Interactive menu for common tasks
smmenu() {
    echo "🚀 StackMap Quick Actions:"
    echo "1) Build all"
    echo "2) Run tests"
    echo "3) Deploy"
    echo "4) Start dev server"
    echo "5) Check git status"
    echo "6) Pull latest changes"
    echo -n "Choose action (1-6): "
    read choice
    case $choice in
        1) smbuildall ;;
        2) smtest ;;
        3) smship ;;
        4) smserve ;;
        5) smstatus ;;
        6) smpull ;;
        *) echo "Invalid choice" ;;
    esac
}

# Auto-completion for StackMap commands (if using zsh-completions)
if type compdef &>/dev/null; then
    _stackmap_complete() {
        local -a commands
        commands=(
            'sm:Go to StackMap root'
            'smbuildall:Build everything'
            'smdeploy:Deploy to production'
            'smtest:Run tests'
            'smfind:Search in project'
            'smstatus:Git status'
            'smmenu:Interactive menu'
        )
        _describe 'stackmap commands' commands
    }
    compdef _stackmap_complete sm smbuildall smdeploy smtest smfind smstatus smmenu
fi

echo "⚡ StackMap aliases loaded! Type 'alias | grep sm' to see all commands."