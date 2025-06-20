#!/bin/zsh
# StackMap Advanced Debugging & Log Analysis System
# Powerful shortcuts for debugging, monitoring, and analyzing your application

# Color configuration
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

STACKMAP_ROOT="$HOME/StackMap/StackMap"

# 🐛 Live console monitoring with filtering
smconsole() {
    cd "$STACKMAP_ROOT"
    echo "${BLUE}🐛 StackMap Console Monitor${NC}"
    echo "${PURPLE}==========================${NC}"
    
    local filter="${1:-}"
    
    if [[ -n "$filter" ]]; then
        echo "${YELLOW}Filtering for: $filter${NC}"
        tail -f logs/*.log 2>/dev/null | grep --color=always -i "$filter"
    else
        # Color-coded log monitoring
        tail -f logs/*.log 2>/dev/null | sed \
            -e "s/ERROR/${RED}ERROR${NC}/g" \
            -e "s/WARN/${YELLOW}WARN${NC}/g" \
            -e "s/INFO/${BLUE}INFO${NC}/g" \
            -e "s/DEBUG/${PURPLE}DEBUG${NC}/g" \
            -e "s/SUCCESS/${GREEN}SUCCESS${NC}/g"
    fi
}

# 🔍 Smart log search with context
smlogsearch() {
    local query="${1:-}"
    if [[ -z "$query" ]]; then
        echo -n "${YELLOW}Search logs for: ${NC}"
        read query
    fi
    
    cd "$STACKMAP_ROOT"
    echo "${BLUE}🔍 Searching logs for: $query${NC}"
    echo "${PURPLE}========================${NC}"
    
    # Search with context and highlighting
    rg -C 3 --color=always "$query" logs/ 2>/dev/null | less -R
}

# 📊 Log analysis dashboard
smlogstats() {
    cd "$STACKMAP_ROOT"
    echo "${BLUE}📊 Log Analysis Dashboard${NC}"
    echo "${PURPLE}========================${NC}"
    
    if [[ -d logs ]]; then
        echo "${GREEN}Error Summary:${NC}"
        grep -i "error" logs/*.log 2>/dev/null | wc -l | xargs echo "  Total errors:"
        grep -i "error" logs/*.log 2>/dev/null | awk '{print $1}' | sort | uniq -c | sort -rn | head -5
        
        echo "\n${YELLOW}Warning Summary:${NC}"
        grep -i "warn" logs/*.log 2>/dev/null | wc -l | xargs echo "  Total warnings:"
        
        echo "\n${BLUE}Recent Activity:${NC}"
        tail -20 logs/*.log 2>/dev/null | grep -E "(ERROR|WARN|SUCCESS)" | tail -5
        
        echo "\n${PURPLE}Log File Sizes:${NC}"
        ls -lh logs/*.log 2>/dev/null | awk '{print "  " $9 ": " $5}'
    else
        echo "${RED}No logs directory found${NC}"
    fi
}

# 🚨 Debug mode toggle
smdebug() {
    cd "$STACKMAP_ROOT"
    local mode="${1:-on}"
    
    echo "${YELLOW}🚨 Debug Mode: $mode${NC}"
    
    case "$mode" in
        on|enable)
            # Enable debug mode in configuration
            if [[ -f js/configuration.js ]]; then
                sed -i '' 's/debug: false/debug: true/g' js/configuration.js
                echo "${GREEN}✅ Debug mode enabled${NC}"
            fi
            # Set environment variable
            export STACKMAP_DEBUG=true
            ;;
        off|disable)
            # Disable debug mode
            if [[ -f js/configuration.js ]]; then
                sed -i '' 's/debug: true/debug: false/g' js/configuration.js
                echo "${GREEN}✅ Debug mode disabled${NC}"
            fi
            unset STACKMAP_DEBUG
            ;;
        status)
            # Check debug status
            if grep -q "debug: true" js/configuration.js 2>/dev/null; then
                echo "${GREEN}Debug mode is ON${NC}"
            else
                echo "${RED}Debug mode is OFF${NC}"
            fi
            ;;
    esac
}

# 🔬 Performance profiler
smprofile() {
    cd "$STACKMAP_ROOT"
    echo "${BLUE}🔬 Performance Profiler${NC}"
    echo "${PURPLE}======================${NC}"
    
    # Start local server if not running
    if ! lsof -i:8000 &>/dev/null; then
        echo "${YELLOW}Starting local server...${NC}"
        python -m http.server 8000 &
        sleep 2
    fi
    
    # Run lighthouse performance test
    if command -v lighthouse &>/dev/null; then
        lighthouse http://localhost:8000 \
            --only-categories=performance \
            --output=json \
            --output-path=./logs/performance-$(date +%Y%m%d-%H%M%S).json
        
        echo "${GREEN}✅ Performance report generated${NC}"
        
        # Extract key metrics
        local report=$(ls -t logs/performance-*.json | head -1)
        if [[ -f "$report" ]]; then
            echo "\n${BLUE}Key Metrics:${NC}"
            jq '.categories.performance.score' "$report" | xargs printf "Performance Score: %.0f%%\n"
        fi
    else
        echo "${RED}Lighthouse not installed. Run: npm install -g lighthouse${NC}"
    fi
}

# 🕵️ Code inspector - find problematic patterns
sminspect() {
    cd "$STACKMAP_ROOT"
    echo "${BLUE}🕵️ Code Inspector${NC}"
    echo "${PURPLE}=================${NC}"
    
    # Check for console.log statements
    echo "${YELLOW}Console statements:${NC}"
    rg "console\.(log|debug|warn|error)" --type js -c | head -10
    
    # Check for debugger statements
    echo "\n${YELLOW}Debugger statements:${NC}"
    rg "debugger" --type js -n
    
    # Check for TODO/FIXME
    echo "\n${YELLOW}TODO/FIXME items:${NC}"
    rg "TODO|FIXME" --type js -n | head -10
    
    # Check for hardcoded values
    echo "\n${YELLOW}Potential hardcoded values:${NC}"
    rg "(localhost|127\.0\.0\.1|http://)" --type js -n | grep -v "test" | head -5
    
    # Check for long functions
    echo "\n${YELLOW}Long functions (>50 lines):${NC}"
    awk '/function|=>/ {fname=$0; count=0} {count++} /^}/ {if(count>50) print FILENAME":"NR" "fname" ("count" lines)"}' js/*.js 2>/dev/null | head -5
}

# 🎯 Breakpoint manager
smbreak() {
    local action="${1:-list}"
    local file="${2:-}"
    local line="${3:-}"
    
    cd "$STACKMAP_ROOT"
    local breakpoints_file=".breakpoints"
    
    case "$action" in
        add)
            if [[ -n "$file" && -n "$line" ]]; then
                echo "$file:$line" >> "$breakpoints_file"
                echo "${GREEN}✅ Breakpoint added at $file:$line${NC}"
                # Insert debugger statement
                sed -i '' "${line}i\\
debugger; // BREAKPOINT" "$file"
            else
                echo "${RED}Usage: smbreak add <file> <line>${NC}"
            fi
            ;;
        remove)
            if [[ -n "$file" && -n "$line" ]]; then
                sed -i '' "/$file:$line/d" "$breakpoints_file"
                # Remove debugger statement
                sed -i '' "${line}d" "$file"
                echo "${GREEN}✅ Breakpoint removed${NC}"
            fi
            ;;
        list)
            if [[ -f "$breakpoints_file" ]]; then
                echo "${BLUE}Active breakpoints:${NC}"
                cat "$breakpoints_file" | nl
            else
                echo "${YELLOW}No breakpoints set${NC}"
            fi
            ;;
        clear)
            # Remove all debugger statements
            find js -name "*.js" -exec sed -i '' '/debugger; \/\/ BREAKPOINT/d' {} \;
            rm -f "$breakpoints_file"
            echo "${GREEN}✅ All breakpoints cleared${NC}"
            ;;
    esac
}

# 📸 State snapshot for debugging
smsnap() {
    cd "$STACKMAP_ROOT"
    local snapshot_name="${1:-snapshot-$(date +%Y%m%d-%H%M%S)}"
    local snapshot_dir="logs/snapshots/$snapshot_name"
    
    echo "${BLUE}📸 Creating debug snapshot: $snapshot_name${NC}"
    
    mkdir -p "$snapshot_dir"
    
    # Capture current state
    echo "Git status:" > "$snapshot_dir/git-status.txt"
    git status >> "$snapshot_dir/git-status.txt"
    
    echo "Git diff:" > "$snapshot_dir/git-diff.txt"
    git diff >> "$snapshot_dir/git-diff.txt"
    
    # Copy current logs
    cp logs/*.log "$snapshot_dir/" 2>/dev/null
    
    # System info
    echo "Date: $(date)" > "$snapshot_dir/system-info.txt"
    echo "Node: $(node -v)" >> "$snapshot_dir/system-info.txt"
    echo "NPM: $(npm -v)" >> "$snapshot_dir/system-info.txt"
    
    # Package versions
    cp package.json "$snapshot_dir/"
    
    echo "${GREEN}✅ Snapshot saved to: $snapshot_dir${NC}"
}

# 🔧 Quick fix common issues
smfix() {
    cd "$STACKMAP_ROOT"
    local issue="${1:-}"
    
    echo "${BLUE}🔧 StackMap Quick Fix${NC}"
    echo "${PURPLE}===================${NC}"
    
    case "$issue" in
        cache)
            echo "${YELLOW}Clearing caches...${NC}"
            rm -rf node_modules/.cache
            rm -rf dist
            rm -rf builds/temp
            echo "${GREEN}✅ Caches cleared${NC}"
            ;;
        deps)
            echo "${YELLOW}Fixing dependencies...${NC}"
            rm -rf node_modules package-lock.json
            npm install
            echo "${GREEN}✅ Dependencies reinstalled${NC}"
            ;;
        permissions)
            echo "${YELLOW}Fixing permissions...${NC}"
            chmod +x scripts/*.sh
            chmod 644 js/*.js css/*.css
            echo "${GREEN}✅ Permissions fixed${NC}"
            ;;
        lint)
            echo "${YELLOW}Auto-fixing lint issues...${NC}"
            npm run lint -- --fix
            echo "${GREEN}✅ Lint issues fixed${NC}"
            ;;
        *)
            echo "${YELLOW}Available fixes:${NC}"
            echo "  smfix cache       - Clear all caches"
            echo "  smfix deps        - Reinstall dependencies"
            echo "  smfix permissions - Fix file permissions"
            echo "  smfix lint        - Auto-fix lint issues"
            ;;
    esac
}

# 🚦 Real-time error monitoring
smerrors() {
    cd "$STACKMAP_ROOT"
    echo "${RED}🚦 Real-time Error Monitor${NC}"
    echo "${PURPLE}========================${NC}"
    echo "${YELLOW}Watching for errors... (Ctrl+C to stop)${NC}\n"
    
    # Monitor multiple sources
    tail -f logs/*.log 2>/dev/null | grep -E "(ERROR|FAIL|Exception|Uncaught)" --color=always | 
    while read line; do
        echo "${RED}[$(date '+%H:%M:%S')]${NC} $line"
        # Optional: Play sound on error (macOS)
        # afplay /System/Library/Sounds/Basso.aiff 2>/dev/null
    done
}

# 📈 Memory usage tracker
smmemory() {
    cd "$STACKMAP_ROOT"
    echo "${BLUE}📈 Memory Usage Analysis${NC}"
    echo "${PURPLE}======================${NC}"
    
    if [[ -f "node_modules/.bin/webpack-bundle-analyzer" ]]; then
        npm run build:analyze
    else
        echo "${YELLOW}Bundle size analysis:${NC}"
        find dist -name "*.js" -exec ls -lh {} \; 2>/dev/null | awk '{print "  " $9 ": " $5}'
        
        echo "\n${YELLOW}Source file sizes:${NC}"
        find js -name "*.js" -exec wc -l {} \; | sort -rn | head -10
    fi
}

# 🎯 Debugging aliases
alias smc="smconsole"
alias smls="smlogsearch"
alias smlog="smlogstats"
alias smdebugon="smdebug on"
alias smdebugoff="smdebug off"
alias smperf="smprofile"
alias smi="sminspect"
alias smb="smbreak"
alias sme="smerrors"
alias smm="smmemory"

# Quick debugging combos
alias smtrouble="sminspect && smlogstats && smerrors"
alias smdiagnose="smlog && smmemory && smperf"
alias smcleanlog="rm -f logs/*.log && echo '✅ Logs cleared'"

echo "🐛 StackMap Debug & Analysis System loaded! Type 'smdebug status' to check debug mode."