#!/bin/bash
# Enhanced Foundry Workflow Manager - Orchestrator-focused automation

FOUNDRY_DIR="$(cd "$(dirname "$0")" && pwd)"
REGISTRY_FILE="$FOUNDRY_DIR/.file-ownership.json"
METRICS_FILE="$FOUNDRY_DIR/.workflow-metrics.json"
REVIEW_QUEUE="$FOUNDRY_DIR/.review-queue.json"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Initialize data files if they don't exist
init_data_files() {
    [ ! -f "$REGISTRY_FILE" ] && echo '{}' > "$REGISTRY_FILE"
    [ ! -f "$METRICS_FILE" ] && echo '{"teams": {}, "reviews": {}}' > "$METRICS_FILE"
    [ ! -f "$REVIEW_QUEUE" ] && echo '[]' > "$REVIEW_QUEUE"
}

# Get team from filename (r7_dev2_story_108 -> 2)
get_team_from_file() {
    echo "$1" | grep -oE 'dev[0-9]+' | grep -oE '[0-9]+'
}

# Get PM for developer (dev1 -> pm1)
get_pm_for_dev() {
    echo "pm$1"
}

# Calculate time difference in hours
time_diff_hours() {
    local start=$1
    local end=$2
    echo $(( (end - start) / 3600 ))
}

# Add to review queue
add_to_review_queue() {
    local file=$1
    local stage=$2
    local team=$3
    local priority=${4:-"normal"}
    local timestamp=$(date +%s)
    
    # Add to queue
    local queue=$(cat "$REVIEW_QUEUE")
    local new_item=$(cat <<EOF
{
    "file": "$file",
    "stage": "$stage",
    "team": "$team",
    "pm": "$(get_pm_for_dev $team)",
    "priority": "$priority",
    "submitted": $timestamp,
    "status": "pending"
}
EOF
)
    
    echo "$queue" | jq ". += [$new_item]" > "$REVIEW_QUEUE"
}

# Orchestrator dashboard view
orchestrator_view() {
    clear
    echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║           FOUNDRY ORCHESTRATOR DASHBOARD                   ║${NC}"
    echo -e "${MAGENTA}╠════════════════════════════════════════════════════════════╣${NC}"
    
    # Team Status Overview
    echo -e "${CYAN}║ TEAM STATUS OVERVIEW                                       ║${NC}"
    echo -e "${CYAN}╟────────────────────────────────────────────────────────────╢${NC}"
    
    for team in 1 2 3; do
        echo -ne "║ Team $team (PM$team/Dev$team): "
        
        # Count files per stage for this team
        local in_progress=0
        local blocked=0
        local review_pending=0
        
        for stage in "3-Stories" "4-PlanReview" "5-ReadyToDevelop" "6-CodeReview"; do
            local count=$(ls -1 "$FOUNDRY_DIR/$stage" 2>/dev/null | grep -E "r[0-9]+_dev${team}_" | wc -l | tr -d ' ')
            in_progress=$((in_progress + count))
            
            if [[ "$stage" == *"Review"* ]]; then
                review_pending=$((review_pending + count))
            fi
        done
        
        # Check for blocked items (in review > 24 hours)
        local old_reviews=$(cat "$REVIEW_QUEUE" | jq -r ".[] | select(.team == \"$team\" and .status == \"pending\")" | jq -r '.submitted' | while read ts; do
            local hours=$(time_diff_hours $ts $(date +%s))
            [ $hours -gt 24 ] && echo "1"
        done | wc -l | tr -d ' ')
        
        [ $old_reviews -gt 0 ] && blocked=$old_reviews
        
        # Status display
        if [ $blocked -gt 0 ]; then
            echo -e "${RED}⚠ BLOCKED ($blocked items > 24h)${NC}"
        elif [ $review_pending -gt 0 ]; then
            echo -e "${YELLOW}◐ Review Pending ($review_pending items)${NC}"
        elif [ $in_progress -gt 0 ]; then
            echo -e "${GREEN}● Active ($in_progress items)${NC}"
        else
            echo -e "${BLUE}○ Idle${NC}"
        fi
        
        # Add spacing
        printf "%-20s║\n" ""
    done
    
    echo -e "${CYAN}╟────────────────────────────────────────────────────────────╢${NC}"
    
    # Critical Alerts
    echo -e "${RED}║ CRITICAL ALERTS                                            ║${NC}"
    echo -e "${RED}╟────────────────────────────────────────────────────────────╢${NC}"
    
    local alerts=0
    
    # Check for reviews pending > 24 hours
    local old_reviews=$(cat "$REVIEW_QUEUE" | jq -r '.[] | select(.status == "pending")' | while read -r item; do
        local file=$(echo "$item" | jq -r '.file')
        local submitted=$(echo "$item" | jq -r '.submitted')
        local team=$(echo "$item" | jq -r '.team')
        local hours=$(time_diff_hours $submitted $(date +%s))
        
        if [ $hours -gt 24 ]; then
            echo -e "║ ${RED}⚠${NC} Review overdue ${RED}${hours}h${NC}: $file (Team $team)           ║"
            ((alerts++))
        fi
    done)
    
    if [ -n "$old_reviews" ]; then
        echo "$old_reviews"
    else
        echo -e "║ ${GREEN}✓ No critical alerts${NC}                                       ║"
    fi
    
    echo -e "${CYAN}╟────────────────────────────────────────────────────────────╢${NC}"
    
    # Review Queue Summary
    echo -e "${YELLOW}║ REVIEW QUEUE                                               ║${NC}"
    echo -e "${YELLOW}╟────────────────────────────────────────────────────────────╢${NC}"
    
    local pending_count=$(cat "$REVIEW_QUEUE" | jq '[.[] | select(.status == "pending")] | length')
    echo -e "║ Pending Reviews: ${YELLOW}$pending_count${NC}                                         ║"
    
    # Show top 3 priority reviews
    cat "$REVIEW_QUEUE" | jq -r '.[] | select(.status == "pending") | "\(.file)|\(.team)|\(.submitted)"' | head -3 | while IFS='|' read -r file team submitted; do
        local hours=$(time_diff_hours $submitted $(date +%s))
        printf "║   • %-30s Team %s (%2dh ago)    ║\n" "$file" "$team" "$hours"
    done
    
    echo -e "${CYAN}╟────────────────────────────────────────────────────────────╢${NC}"
    
    # Round Progress
    echo -e "${GREEN}║ ROUND PROGRESS                                             ║${NC}"
    echo -e "${GREEN}╟────────────────────────────────────────────────────────────╢${NC}"
    
    # Count files by round
    local current_round=$(ls -1 "$FOUNDRY_DIR"/3-Stories "$FOUNDRY_DIR"/4-PlanReview "$FOUNDRY_DIR"/5-ReadyToDevelop "$FOUNDRY_DIR"/6-CodeReview 2>/dev/null | grep -oE 'r[0-9]+' | sort -u | tail -1 | grep -oE '[0-9]+')
    
    if [ -n "$current_round" ]; then
        echo -e "║ Current Round: ${GREEN}$current_round${NC}                                          ║"
        
        # Progress bar for current round
        local total_stories=$(ls -1 "$FOUNDRY_DIR"/3-Stories 2>/dev/null | grep -E "r${current_round}_" | wc -l | tr -d ' ')
        local completed=$(ls -1 "$FOUNDRY_DIR"/7-Complete 2>/dev/null | grep -E "r${current_round}_" | wc -l | tr -d ' ')
        local in_progress=$((total_stories - completed))
        
        if [ $total_stories -gt 0 ]; then
            local percent=$((completed * 100 / total_stories))
            printf "║ Progress: ["
            
            # Draw progress bar (30 chars wide)
            local bar_width=30
            local filled=$((percent * bar_width / 100))
            local empty=$((bar_width - filled))
            
            printf "%${filled}s" | tr ' ' '█'
            printf "%${empty}s" | tr ' ' '░'
            printf "] %3d%% (%d/%d)     ║\n" "$percent" "$completed" "$total_stories"
        fi
    fi
    
    echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"
    
    # Quick actions menu
    echo ""
    echo -e "${CYAN}Quick Actions:${NC}"
    echo "  [1] Process review queue    [4] Team performance report"
    echo "  [2] Auto-advance ready      [5] Conflict detection"
    echo "  [3] Bulk assign round       [6] Export metrics"
    echo "  [R] Refresh                 [Q] Quit"
    echo ""
    echo -n "Select action: "
}

# Team-specific status
team_status() {
    local team=$1
    
    echo -e "${CYAN}=== Team $team Status (PM$team + Dev$team) ===${NC}"
    echo ""
    
    # Show files in each stage
    for stage in "3-Stories" "4-PlanReview" "5-ReadyToDevelop" "6-CodeReview" "7-Complete"; do
        local files=$(ls -1 "$FOUNDRY_DIR/$stage" 2>/dev/null | grep -E "r[0-9]+_dev${team}_")
        local count=$(echo "$files" | grep -v '^$' | wc -l | tr -d ' ')
        
        if [ $count -gt 0 ]; then
            echo -e "${YELLOW}$stage${NC}: $count files"
            echo "$files" | sed 's/^/  - /'
            
            # Show review status if applicable
            if [[ "$stage" == *"Review"* ]]; then
                echo "$files" | while read -r file; do
                    [ -z "$file" ] && continue
                    local queue_info=$(cat "$REVIEW_QUEUE" | jq -r ".[] | select(.file == \"$file\" and .status == \"pending\")")
                    if [ -n "$queue_info" ]; then
                        local submitted=$(echo "$queue_info" | jq -r '.submitted')
                        local hours=$(time_diff_hours $submitted $(date +%s))
                        if [ $hours -gt 24 ]; then
                            echo -e "    ${RED}⚠ Overdue: ${hours}h${NC}"
                        else
                            echo -e "    ${YELLOW}⏳ Pending: ${hours}h${NC}"
                        fi
                    fi
                done
            fi
        else
            echo -e "${BLUE}$stage${NC}: empty"
        fi
        echo ""
    done
    
    # Team metrics
    echo -e "${GREEN}Team Metrics:${NC}"
    local metrics=$(cat "$METRICS_FILE" | jq -r ".teams.team$team // {}")
    if [ "$metrics" != "{}" ]; then
        echo "$metrics" | jq -r 'to_entries | .[] | "  \(.key): \(.value)"'
    else
        echo "  No metrics recorded yet"
    fi
}

# Auto-advance files that are ready
auto_advance() {
    echo -e "${GREEN}=== Auto-advancing ready files ===${NC}"
    
    local advanced=0
    
    # Check each review stage
    for stage in "4-PlanReview" "6-CodeReview"; do
        local files=$(ls -1 "$FOUNDRY_DIR/$stage" 2>/dev/null | grep -v -E "(archive|TEMPLATE|\.DS_Store)")
        
        echo "$files" | while read -r file; do
            [ -z "$file" ] && continue
            
            # Check if review is completed in queue
            local review_status=$(cat "$REVIEW_QUEUE" | jq -r ".[] | select(.file == \"$file\" and .status == \"completed\") | .status")
            
            if [ "$review_status" = "completed" ]; then
                echo -e "${GREEN}✓ Auto-advancing $file from $stage${NC}"
                advance "$file" "$stage"
                ((advanced++))
            fi
        done
    done
    
    echo -e "${BLUE}Advanced $advanced files${NC}"
}

# Process review queue with priority
process_review_queue() {
    echo -e "${YELLOW}=== Processing Review Queue ===${NC}"
    
    # Get pending reviews sorted by priority and age
    local pending=$(cat "$REVIEW_QUEUE" | jq -r '.[] | select(.status == "pending") | "\(.priority)|\(.submitted)|\(.file)|\(.team)|\(.stage)"' | sort -t'|' -k1,1r -k2,2n)
    
    if [ -z "$pending" ]; then
        echo -e "${BLUE}No pending reviews${NC}"
        return
    fi
    
    echo "$pending" | while IFS='|' read -r priority submitted file team stage; do
        local hours=$(time_diff_hours $submitted $(date +%s))
        local pm=$(get_pm_for_dev $team)
        
        echo ""
        echo -e "${CYAN}Review needed:${NC} $file"
        echo -e "  Team: $team (assigned to $pm)"
        echo -e "  Stage: $stage"
        echo -e "  Priority: $priority"
        echo -e "  Age: ${hours}h"
        
        if [ $hours -gt 24 ]; then
            echo -e "  ${RED}⚠ OVERDUE - Needs immediate attention${NC}"
        fi
        
        echo -e "  ${YELLOW}Action: PM$team should review $file in $stage${NC}"
    done
}

# Enhanced advance function with automation
advance() {
    local file=$1
    local from=$2
    
    # Original advance logic
    case "$from" in
        "3-Stories")
            to="4-PlanReview"
            # Auto-add to review queue
            local team=$(get_team_from_file "$file")
            add_to_review_queue "$file" "$to" "$team" "normal"
            echo -e "${YELLOW}✓ Added to PM$team's review queue${NC}"
            ;;
        "4-PlanReview")
            to="5-ReadyToDevelop"
            # Mark review as completed
            cat "$REVIEW_QUEUE" | jq "map(if .file == \"$file\" then .status = \"completed\" else . end)" > "$REVIEW_QUEUE.tmp"
            mv "$REVIEW_QUEUE.tmp" "$REVIEW_QUEUE"
            ;;
        "5-ReadyToDevelop")
            to="6-CodeReview"
            # Auto-add to review queue with high priority
            local team=$(get_team_from_file "$file")
            add_to_review_queue "$file" "$to" "$team" "high"
            echo -e "${YELLOW}✓ Added to PM$team's code review queue (high priority)${NC}"
            ;;
        "6-CodeReview")
            to="7-Complete"
            # Mark review as completed
            cat "$REVIEW_QUEUE" | jq "map(if .file == \"$file\" then .status = \"completed\" else . end)" > "$REVIEW_QUEUE.tmp"
            mv "$REVIEW_QUEUE.tmp" "$REVIEW_QUEUE"
            
            # Update team metrics
            local team=$(get_team_from_file "$file")
            local timestamp=$(date +%s)
            cat "$METRICS_FILE" | jq ".teams.team$team.completed = (.teams.team$team.completed // 0) + 1 | .teams.team$team.last_completion = $timestamp" > "$METRICS_FILE.tmp"
            mv "$METRICS_FILE.tmp" "$METRICS_FILE"
            ;;
    esac
    
    # Move the file
    if [ -f "$FOUNDRY_DIR/$from/$file" ]; then
        mv "$FOUNDRY_DIR/$from/$file" "$FOUNDRY_DIR/$to/"
        echo -e "${GREEN}✓ Moved $file from $from to $to${NC}"
        
        # Update file ownership registry
        local team=$(get_team_from_file "$file")
        cat "$REGISTRY_FILE" | jq ".\"$file\" = {team: \"$team\", stage: \"$to\", updated: $(date +%s)}" > "$REGISTRY_FILE.tmp"
        mv "$REGISTRY_FILE.tmp" "$REGISTRY_FILE"
    else
        echo -e "${RED}File not found: $from/$file${NC}"
    fi
}

# Bulk assign stories to teams for a round
bulk_assign() {
    local round=$1
    
    echo -e "${CYAN}=== Bulk Assignment for Round $round ===${NC}"
    
    # Find all unassigned stories for this round
    local stories=$(ls -1 "$FOUNDRY_DIR/3-Stories" 2>/dev/null | grep -E "r${round}_" | grep -v -E "dev[0-9]+")
    local count=$(echo "$stories" | grep -v '^$' | wc -l | tr -d ' ')
    
    if [ $count -eq 0 ]; then
        echo -e "${BLUE}No unassigned stories found for round $round${NC}"
        return
    fi
    
    echo "Found $count unassigned stories"
    echo ""
    
    # Calculate team loads
    local team1_load=$(ls -1 "$FOUNDRY_DIR"/3-Stories "$FOUNDRY_DIR"/4-PlanReview "$FOUNDRY_DIR"/5-ReadyToDevelop "$FOUNDRY_DIR"/6-CodeReview 2>/dev/null | grep -E "dev1_" | wc -l | tr -d ' ')
    local team2_load=$(ls -1 "$FOUNDRY_DIR"/3-Stories "$FOUNDRY_DIR"/4-PlanReview "$FOUNDRY_DIR"/5-ReadyToDevelop "$FOUNDRY_DIR"/6-CodeReview 2>/dev/null | grep -E "dev2_" | wc -l | tr -d ' ')
    local team3_load=$(ls -1 "$FOUNDRY_DIR"/3-Stories "$FOUNDRY_DIR"/4-PlanReview "$FOUNDRY_DIR"/5-ReadyToDevelop "$FOUNDRY_DIR"/6-CodeReview 2>/dev/null | grep -E "dev3_" | wc -l | tr -d ' ')
    
    echo "Current team loads:"
    echo "  Team 1: $team1_load active items"
    echo "  Team 2: $team2_load active items"
    echo "  Team 3: $team3_load active items"
    echo ""
    
    # Assign stories to balance load
    local i=0
    echo "$stories" | while read -r story; do
        [ -z "$story" ] && continue
        
        # Find team with lowest load
        local target_team=1
        local min_load=$team1_load
        
        if [ $team2_load -lt $min_load ]; then
            target_team=2
            min_load=$team2_load
        fi
        
        if [ $team3_load -lt $min_load ]; then
            target_team=3
            min_load=$team3_load
        fi
        
        # Rename file with team assignment
        local new_name=$(echo "$story" | sed "s/r${round}_/r${round}_dev${target_team}_/")
        mv "$FOUNDRY_DIR/3-Stories/$story" "$FOUNDRY_DIR/3-Stories/$new_name"
        
        echo -e "${GREEN}✓ Assigned $story → Team $target_team${NC}"
        
        # Update load count
        case $target_team in
            1) ((team1_load++)) ;;
            2) ((team2_load++)) ;;
            3) ((team3_load++)) ;;
        esac
        
        # Update registry
        cat "$REGISTRY_FILE" | jq ".\"$new_name\" = {team: \"$target_team\", stage: \"3-Stories\", assigned: $(date +%s)}" > "$REGISTRY_FILE.tmp"
        mv "$REGISTRY_FILE.tmp" "$REGISTRY_FILE"
        
        ((i++))
    done
    
    echo ""
    echo -e "${GREEN}Assigned $i stories across teams${NC}"
}

# Detect and resolve conflicts
conflict_detection() {
    echo -e "${CYAN}=== Conflict Detection ===${NC}"
    
    # Check for files being edited by multiple teams
    local conflicts=0
    
    # Get all active files
    local active_files=$(ls -1 "$FOUNDRY_DIR"/4-PlanReview "$FOUNDRY_DIR"/5-ReadyToDevelop "$FOUNDRY_DIR"/6-CodeReview 2>/dev/null | grep -v -E "(archive|TEMPLATE|\.DS_Store)")
    
    # Check each file for potential conflicts
    echo "$active_files" | while read -r file1; do
        [ -z "$file1" ] && continue
        local team1=$(get_team_from_file "$file1")
        
        echo "$active_files" | while read -r file2; do
            [ -z "$file2" ] && continue
            [ "$file1" = "$file2" ] && continue
            
            local team2=$(get_team_from_file "$file2")
            
            # Check if files might conflict (same feature area)
            local base1=$(echo "$file1" | sed 's/.*story_[0-9]*_//' | sed 's/\.md$//')
            local base2=$(echo "$file2" | sed 's/.*story_[0-9]*_//' | sed 's/\.md$//')
            
            if [ "$team1" != "$team2" ] && [[ "$base1" == *"$base2"* || "$base2" == *"$base1"* ]]; then
                echo -e "${YELLOW}⚠ Potential conflict:${NC}"
                echo "  Team $team1: $file1"
                echo "  Team $team2: $file2"
                echo "  ${RED}Both teams working on similar features${NC}"
                ((conflicts++))
            fi
        done
    done
    
    if [ $conflicts -eq 0 ]; then
        echo -e "${GREEN}✓ No conflicts detected${NC}"
    else
        echo ""
        echo -e "${YELLOW}Found $conflicts potential conflicts${NC}"
        echo "Recommendation: Orchestrator should review and coordinate teams"
    fi
}

# Generate pre-filled templates
generate_template() {
    local type=$1
    local story_file=$2
    
    if [ ! -f "$FOUNDRY_DIR/3-Stories/$story_file" ]; then
        echo -e "${RED}Story file not found: $story_file${NC}"
        return
    fi
    
    local story_id=$(echo "$story_file" | grep -oE 'story_[0-9]+' | grep -oE '[0-9]+')
    local team=$(get_team_from_file "$story_file")
    local feature=$(echo "$story_file" | sed 's/.*story_[0-9]*_//' | sed 's/\.md$//')
    
    case "$type" in
        "plan")
            local plan_file="${story_file%.md}_plan.md"
            cat > "$FOUNDRY_DIR/4-PlanReview/$plan_file" << EOF
# Implementation Plan: ${feature}

**Story**: $story_file
**Team**: $team (PM$team + Dev$team)
**Generated**: $(date +"%Y-%m-%d %H:%M")

## Overview
[Brief description of the implementation approach]

## Technical Approach

### 1. File Structure
\`\`\`
/refactor/
├── js/
│   └── ${feature}.js         # Main implementation
├── css/
│   └── ${feature}.css        # Styles
└── tests/
    └── ${feature}.test.js    # Tests
\`\`\`

### 2. Key Components
- **Component A**: [Description]
- **Component B**: [Description]

### 3. Data Model
\`\`\`javascript
// Define data structures
\`\`\`

### 4. API Design
\`\`\`javascript
// Public API
\`\`\`

## Implementation Steps
1. [ ] Create file structure
2. [ ] Implement core functionality
3. [ ] Add styles
4. [ ] Write tests
5. [ ] Integration testing
6. [ ] Documentation

## Testing Strategy
- Unit tests for core functions
- Integration tests with existing features
- Platform-specific testing (mobile, TV)

## Risk Mitigation
- **Risk 1**: [Description] → [Mitigation]
- **Risk 2**: [Description] → [Mitigation]

## Dependencies
- Existing modules: [List]
- External libraries: None (vanilla JS)

## Success Criteria
- [ ] All tests pass
- [ ] No regression in existing features
- [ ] Works on all platforms
- [ ] Performance targets met

---
*This plan requires PM$team review before proceeding to development*
EOF
            echo -e "${GREEN}✓ Generated plan template: $plan_file${NC}"
            echo "  Location: 4-PlanReview/$plan_file"
            
            # Add to review queue
            add_to_review_queue "$plan_file" "4-PlanReview" "$team" "normal"
            ;;
            
        "review")
            local review_file="${story_file%.md}_close.md"
            cat > "$FOUNDRY_DIR/7-Complete/$review_file" << EOF
# Close Report: ${feature}

**Story**: $story_file
**Team**: $team
**Completed**: $(date +"%Y-%m-%d %H:%M")

## Implementation Summary
[What was built]

## Files Changed
- \`js/${feature}.js\` - [Description]
- \`css/${feature}.css\` - [Description]
- \`tests/${feature}.test.js\` - [Description]

## Testing Completed
- [x] Unit tests pass
- [x] Integration tests pass
- [x] Manual testing on:
  - [ ] Web browser
  - [ ] Mobile (iOS/Android)
  - [ ] TV navigation
  - [ ] Safe mode

## Performance Impact
- Load time: [No regression / +Xms]
- Memory usage: [No change / +XMB]
- Bundle size: [+X KB]

## Known Issues
- None identified

## Follow-up Tasks
- [ ] Monitor for user feedback
- [ ] Performance optimization (if needed)

## Lessons Learned
[Any insights for future development]

---
*Reviewed and approved by PM$team*
EOF
            echo -e "${GREEN}✓ Generated close report template: $review_file${NC}"
            echo "  Location: 7-Complete/$review_file"
            ;;
            
        *)
            echo -e "${RED}Unknown template type: $type${NC}"
            echo "Available types: plan, review"
            ;;
    esac
}

# Pre-review automated checks
pre_review_check() {
    local file=$1
    local stage=$2
    
    echo -e "${CYAN}=== Pre-Review Checks: $file ===${NC}"
    
    local issues=0
    
    # Check file exists
    if [ ! -f "$FOUNDRY_DIR/$stage/$file" ]; then
        echo -e "${RED}✗ File not found${NC}"
        return 1
    fi
    
    # Stage-specific checks
    case "$stage" in
        "4-PlanReview")
            echo "Checking plan requirements..."
            
            # Check required sections
            for section in "Overview" "Technical Approach" "Implementation Steps" "Testing Strategy" "Success Criteria"; do
                if ! grep -q "## $section" "$FOUNDRY_DIR/$stage/$file"; then
                    echo -e "${YELLOW}⚠ Missing section: $section${NC}"
                    ((issues++))
                fi
            done
            
            # Check for TODOs
            local todos=$(grep -c "\[ \]" "$FOUNDRY_DIR/$stage/$file")
            if [ $todos -eq 0 ]; then
                echo -e "${YELLOW}⚠ No checkboxes found for tracking${NC}"
                ((issues++))
            fi
            ;;
            
        "6-CodeReview")
            echo "Checking code requirements..."
            
            # Check for test files mentioned
            if ! grep -qi "test" "$FOUNDRY_DIR/$stage/$file"; then
                echo -e "${YELLOW}⚠ No mention of tests${NC}"
                ((issues++))
            fi
            
            # Check for platform considerations
            if ! grep -qi "mobile\|tv\|platform" "$FOUNDRY_DIR/$stage/$file"; then
                echo -e "${YELLOW}⚠ No platform-specific considerations mentioned${NC}"
                ((issues++))
            fi
            ;;
    esac
    
    # File size check
    local size=$(stat -f%z "$FOUNDRY_DIR/$stage/$file" 2>/dev/null || stat -c%s "$FOUNDRY_DIR/$stage/$file" 2>/dev/null)
    if [ $size -lt 500 ]; then
        echo -e "${YELLOW}⚠ File seems too small (<500 bytes)${NC}"
        ((issues++))
    fi
    
    if [ $issues -eq 0 ]; then
        echo -e "${GREEN}✓ All pre-review checks passed${NC}"
        return 0
    else
        echo -e "${YELLOW}Found $issues potential issues${NC}"
        echo "PM should review these before approval"
        return 1
    fi
}

# Performance report
performance_report() {
    echo -e "${CYAN}=== Team Performance Report ===${NC}"
    echo ""
    
    for team in 1 2 3; do
        echo -e "${GREEN}Team $team (PM$team + Dev$team)${NC}"
        
        # Get metrics
        local completed=$(cat "$METRICS_FILE" | jq -r ".teams.team$team.completed // 0")
        local last_completion=$(cat "$METRICS_FILE" | jq -r ".teams.team$team.last_completion // 0")
        
        echo "  Completed stories: $completed"
        
        if [ "$last_completion" -ne 0 ]; then
            local days_ago=$(( ($(date +%s) - last_completion) / 86400 ))
            echo "  Last completion: $days_ago days ago"
        fi
        
        # Review performance
        local reviews=$(cat "$REVIEW_QUEUE" | jq -r "[.[] | select(.team == \"$team\")] | length")
        local overdue=$(cat "$REVIEW_QUEUE" | jq -r "[.[] | select(.team == \"$team\" and .status == \"pending\")] | map(select(($(date +%s) - .submitted) > 86400)) | length")
        
        echo "  Total reviews: $reviews"
        echo "  Overdue reviews: $overdue"
        
        # Calculate velocity (stories per week)
        if [ $completed -gt 0 ]; then
            # Rough estimate based on foundry age
            local velocity=$(( completed * 7 / 30 )) # Assuming 30 days of operation
            echo "  Velocity: ~$velocity stories/week"
        fi
        
        echo ""
    done
    
    # Overall metrics
    echo -e "${BLUE}Overall Metrics${NC}"
    local total_completed=$(cat "$METRICS_FILE" | jq '[.teams[].completed // 0] | add // 0')
    local total_pending=$(cat "$REVIEW_QUEUE" | jq '[.[] | select(.status == "pending")] | length')
    
    echo "  Total completed: $total_completed stories"
    echo "  Reviews pending: $total_pending"
    echo "  File registry size: $(cat "$REGISTRY_FILE" | jq 'length') files tracked"
}

# Initialize data files
init_data_files

# Enhanced main menu
case "$1" in
    "orchestrator"|"orch")
        while true; do
            orchestrator_view
            read -n 1 action
            echo ""
            
            case "$action" in
                1) process_review_queue ;;
                2) auto_advance ;;
                3) 
                    echo -n "Enter round number: "
                    read round
                    bulk_assign "$round"
                    ;;
                4) performance_report ;;
                5) conflict_detection ;;
                6) 
                    echo "Exporting metrics to metrics-export.json"
                    cp "$METRICS_FILE" "$FOUNDRY_DIR/metrics-export.json"
                    echo -e "${GREEN}✓ Exported${NC}"
                    ;;
                r|R) continue ;;
                q|Q) break ;;
                *) echo "Invalid option" ;;
            esac
            
            echo ""
            echo "Press any key to continue..."
            read -n 1
        done
        ;;
        
    "team-status")
        if [ -z "$2" ]; then
            echo "Usage: $0 team-status <team-number>"
            exit 1
        fi
        team_status "$2"
        ;;
        
    "auto-advance")
        auto_advance
        ;;
        
    "bulk-assign")
        if [ -z "$2" ]; then
            echo "Usage: $0 bulk-assign <round-number>"
            exit 1
        fi
        bulk_assign "$2"
        ;;
        
    "review-queue"|"queue")
        process_review_queue
        ;;
        
    "conflicts")
        conflict_detection
        ;;
        
    "pre-check")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 pre-check <file> <stage>"
            exit 1
        fi
        pre_review_check "$2" "$3"
        ;;
        
    "generate-template"|"gen")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 generate-template <plan|review> <story-file>"
            exit 1
        fi
        generate_template "$2" "$3"
        ;;
        
    "advance"|"a")
        advance "$2" "$3"
        ;;
        
    "performance"|"perf")
        performance_report
        ;;
        
    *)
        echo "Enhanced Foundry Workflow Manager - Orchestrator Edition"
        echo ""
        echo "Orchestrator Commands:"
        echo "  orchestrator (orch)          - Interactive orchestrator dashboard"
        echo "  team-status <team>           - Detailed status for specific team"
        echo "  review-queue (queue)         - Process pending reviews"
        echo "  auto-advance                 - Advance completed reviews"
        echo "  bulk-assign <round>          - Auto-assign stories to teams"
        echo "  conflicts                    - Detect team conflicts"
        echo "  performance (perf)           - Team performance report"
        echo ""
        echo "Automation Commands:"
        echo "  pre-check <file> <stage>     - Run automated pre-review checks"
        echo "  generate-template <type> <story> - Generate plan/review templates"
        echo ""
        echo "Original Commands:"
        echo "  advance <file> <stage>       - Move file to next stage"
        echo "  status                       - Show basic workflow status"
        echo ""
        echo "Examples:"
        echo "  $0 orchestrator              # Launch dashboard"
        echo "  $0 team-status 2             # Check Team 2 status"
        echo "  $0 bulk-assign 9             # Assign round 9 stories"
        echo "  $0 generate-template plan r9_story_120.md"
        ;;
esac