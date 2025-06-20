#!/bin/zsh
# StackMap Power Plugin Configuration
# Enhanced commands from newly enabled Oh My Zsh plugins

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo "${PURPLE}⚡ StackMap Power Plugins Activated!${NC}"

# NPM Plugin Enhancements
# Now you have: npmg, npmS, npmD, npmO, npmE, npmls
alias smnpm="echo '${BLUE}NPM Power Commands:${NC}
  npmg <pkg>    - Install package globally
  npmS <pkg>    - Install and save to dependencies  
  npmD <pkg>    - Install and save to devDependencies
  npmO          - Check for outdated packages
  npmE <pkg>    - Edit installed package
  npmls         - List installed packages'"

# Node Plugin Enhancements
alias smnode="echo '${BLUE}Node.js Power Commands:${NC}
  node-docs     - Open Node.js documentation
  node-inspect  - Debug Node.js with inspector'"

# Z Plugin - Smart directory jumping
# After using directories, z learns and lets you jump quickly
alias smz="echo '${BLUE}Z Directory Jumping:${NC}
  z stackmap    - Jump to most frecent stackmap directory
  z -l          - List frecent directories
  z -c          - Jump to subdirectory of current directory
  z -e          - Echo best match, dont cd
  z -r          - Match by rank only
  z -t          - Match by recent access only'"

# FZF Integration - Fuzzy finding everything
alias smfzf="echo '${BLUE}FZF Fuzzy Finding:${NC}
  Ctrl+T        - Fuzzy find files
  Ctrl+R        - Fuzzy search command history
  Alt+C         - Fuzzy change directory
  **<TAB>       - Fuzzy complete paths'"

# Web Search - Search from terminal
alias smweb="echo '${BLUE}Web Search Commands:${NC}
  google        - Search Google
  bing          - Search Bing  
  duckduckgo    - Search DuckDuckGo
  github        - Search GitHub
  stackoverflow - Search Stack Overflow
  
Example: google \"PWA manifest icons\"'"

# GitHub CLI Integration (if gh is installed)
if command -v gh &>/dev/null; then
    alias smgh="echo '${BLUE}GitHub CLI Commands:${NC}
  gh pr create  - Create pull request
  gh pr list    - List pull requests
  gh issue list - List issues
  gh repo view  - View repository
  gh workflow   - Manage workflows'"
fi

# JSONTools - JSON manipulation
alias smjson="echo '${BLUE}JSON Tools:${NC}
  pp_json       - Pretty print JSON
  is_json       - Validate JSON
  urlencode_json - URL encode JSON
  urldecode_json - URL decode JSON
  
Example: cat package.json | pp_json'"

# Extract - Universal archive extractor
alias smextract="echo '${BLUE}Extract Any Archive:${NC}
  extract file.zip
  extract file.tar.gz
  extract file.7z
  extract file.rar
  
Supports: tar.bz2, tar.gz, tar.xz, tar.lz, bz2, rar, gz, tar, tbz2, tgz, zip, Z, 7z, and more!'"

# History - Better history management
alias smhistory="echo '${BLUE}History Power Commands:${NC}
  h             - Show command history
  hs <pattern>  - Search history
  hsi <pattern> - Case-insensitive history search
  
Example: hs \"git commit\"'"

# Sudo - Press ESC twice to add sudo to current command
alias smsudo="echo '${BLUE}Sudo Enhancement:${NC}
  Press ESC ESC - Add sudo to current/last command'"

# Command Not Found - Suggests packages when command not found
alias smcnf="echo '${BLUE}Command Not Found:${NC}
  Automatically suggests package to install when command not found'"

# StackMap-specific power combos using new plugins
alias smsearchcode="google site:github.com"
alias smstackoverflow="stackoverflow"
alias smdocs="google site:developer.mozilla.org"

# Quick JSON operations for StackMap
alias smmanifestcheck="cat manifest.json | pp_json && cat manifest.json | is_json && echo '${GREEN}✅ Manifest is valid JSON${NC}'"
alias smpackageview="cat package.json | pp_json | less"

# Enhanced deployment with GitHub integration
if command -v gh &>/dev/null; then
    smghprdeploy() {
        echo "${BLUE}🚀 GitHub PR Deployment Flow${NC}"
        gh pr create --fill
        gh pr checks
        gh pr merge --auto
    }
fi

# Z-powered quick navigation
alias smzlearn="find ~/StackMap -type d -not -path '*/\.*' -not -path '*/node_modules/*' | while read dir; do z \$dir 2>/dev/null; done && echo '${GREEN}✅ Z database populated with StackMap directories${NC}'"

# Power user tips
smtips() {
    echo "${PURPLE}💡 StackMap Power Plugin Tips:${NC}"
    echo "1. ${YELLOW}Ctrl+R${NC} - Fuzzy search your command history"
    echo "2. ${YELLOW}z stack${NC} - Jump to StackMap directory from anywhere"
    echo "3. ${YELLOW}google \"CSS flexbox\"${NC} - Search Google from terminal"
    echo "4. ${YELLOW}npmO${NC} - Check for outdated packages"
    echo "5. ${YELLOW}extract anything.zip${NC} - Extract any archive format"
    echo "6. ${YELLOW}cat data.json | pp_json${NC} - Pretty print JSON"
    echo "7. ${YELLOW}ESC ESC${NC} - Add sudo to last command"
    echo "8. ${YELLOW}hs deploy${NC} - Search command history for 'deploy'"
    echo "\nRun ${GREEN}alias | grep -E '(npm|node|gh)'${NC} to see all new commands!"
}

# Show tips on load
smtips