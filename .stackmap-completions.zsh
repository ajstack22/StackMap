#!/bin/zsh
# StackMap Advanced Auto-completions for Oh My Zsh
# This file provides intelligent tab completion for all StackMap commands

# Enable advanced completion features
autoload -U compinit && compinit
zmodload -i zsh/complist

# Define StackMap project structure for smart completions
_stackmap_dirs=(
    "js:JavaScript source files"
    "css:Stylesheets"
    "images:Image assets"
    "data:Data files and JSON"
    "includes:PHP and API files"
    "builds:Build outputs"
    "scripts:Utility scripts"
    "test:Test files"
)

_stackmap_js_files=(
    "configuration.js:Main configuration"
    "stackmap.js:Core functionality"
    "background.js:Extension background"
    "content.js:Content scripts"
    "popup.js:Extension popup"
)

# Smart completion for smfind - suggests common search patterns
_smfind_complete() {
    local -a search_suggestions
    search_suggestions=(
        "'TODO':Find all TODOs"
        "'FIXME':Find all FIXMEs"
        "'console.log':Find console statements"
        "'debugger':Find debugger statements"
        "'function':Find function definitions"
        "'class':Find class definitions"
        "'import':Find import statements"
        "'export':Find export statements"
        "'api/':Find API references"
        "'http':Find HTTP requests"
        "'error':Find error handling"
        "'test(':Find test cases"
    )
    _describe 'search patterns' search_suggestions
}

# Smart completion for git commit messages
_smcommit_complete() {
    local -a commit_prefixes
    commit_prefixes=(
        "'feat: ':New feature"
        "'fix: ':Bug fix"
        "'docs: ':Documentation"
        "'style: ':Code style"
        "'refactor: ':Code refactoring"
        "'test: ':Test updates"
        "'chore: ':Maintenance"
        "'perf: ':Performance"
        "'ci: ':CI/CD changes"
        "'build: ':Build changes"
    )
    _describe 'commit types' commit_prefixes
}

# Completion for branch creation
_branch_name_complete() {
    local -a suggestions
    suggestions=(
        'user-auth:User authentication'
        'api-integration:API integration'
        'ui-update:UI improvements'
        'performance:Performance optimization'
        'bug-fix:General bug fixes'
        'mobile-responsive:Mobile responsiveness'
        'data-sync:Data synchronization'
        'security-patch:Security updates'
    )
    _describe 'branch names' suggestions
}

# File-specific completions
_sm_file_complete() {
    local dir="$1"
    _files -W "~/StackMap/StackMap/$dir" -g '*'
}

# Dynamic completion based on current directory
_stackmap_context_complete() {
    local current_dir=$(pwd)
    case "$current_dir" in
        */js)
            _files -g '*.js'
            ;;
        */css)
            _files -g '*.css'
            ;;
        */test)
            _files -g '*.test.js'
            ;;
        *)
            _files
            ;;
    esac
}

# Register completions
compdef _smfind_complete smfind
compdef _smfind_complete smfindjs
compdef _smfind_complete smfindcss
compdef _smcommit_complete smcommit
compdef _branch_name_complete smfeature
compdef _branch_name_complete smbugfix
compdef '_sm_file_complete js' smconf
compdef '_sm_file_complete css' smcss

# Advanced completion with descriptions
_stackmap_main() {
    local -a commands
    commands=(
        # Navigation
        'sm:Navigate to StackMap root directory'
        'smjs:Navigate to JavaScript directory'
        'smcss:Navigate to CSS directory'
        'smapi:Navigate to API directory'
        'smimg:Navigate to images directory'
        
        # Building
        'smbuildall:Build all targets (extension + mobile)'
        'smbuildext:Build browser extension only'
        'smbuildmobile:Build mobile apps (iOS + Android)'
        'smwatch:Start file watcher for development'
        
        # Development
        'smserve:Start local development server on port 8000'
        'smtest:Run all test suites'
        'smlint:Run code linting'
        'smtypecheck:Run TypeScript type checking'
        
        # Git Operations
        'smstatus:Show git status'
        'smlog:Show git log with graph'
        'smdiff:Show git diff'
        'smcommit:Add all and commit with message'
        'smpush:Push to remote'
        'smpull:Pull from remote'
        'smundo:Undo last commit'
        
        # Deployment
        'smdeploy:Deploy to production via git-ftp'
        'smdeploycheck:Run pre-deployment checks'
        'smship:Full deployment pipeline (check + deploy)'
        
        # Search
        'smfind:Search in all files'
        'smfindjs:Search in JavaScript files only'
        'smfindcss:Search in CSS files only'
        
        # Utilities
        'smstats:Show project statistics'
        'smmenu:Interactive command menu'
        'smrebuild:Clean and rebuild everything'
        'smfresh:Pull latest and rebuild'
        
        # Mobile
        'smandroid:Build and open Android app'
        'smios:Build and open iOS app'
    )
    
    _describe 'stackmap commands' commands
}

# Set up main completion
compdef _stackmap_main sm

# Enable menu selection for completions
zstyle ':completion:*:*:sm*:*' menu select
zstyle ':completion:*:descriptions' format '%B%d%b'
zstyle ':completion:*:messages' format '%d'
zstyle ':completion:*:warnings' format 'No matches for: %d'

# Group completions by category
zstyle ':completion:*' group-name ''
zstyle ':completion:*:*:sm*:*' group-order \
    'navigation' 'building' 'development' 'git-operations' \
    'deployment' 'search' 'utilities' 'mobile'

# Color completions
zstyle ':completion:*:*:sm*:*' list-colors \
    'di=34' 'ln=35' 'so=32' 'ex=31' 'bd=46;34' 'cd=43;34'

# Case-insensitive completion
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'

# Faster completion
zstyle ':completion:*' accept-exact '*(N)'
zstyle ':completion:*' use-cache on
zstyle ':completion:*' cache-path ~/.zsh/cache

echo "🎯 StackMap auto-completions loaded! Press TAB after any 'sm' command."