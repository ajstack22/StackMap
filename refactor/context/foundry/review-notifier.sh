#!/bin/bash
# Review Notification System - Alerts PMs when reviews are needed

FOUNDRY_DIR="$(cd "$(dirname "$0")" && pwd)"
REVIEW_QUEUE="$FOUNDRY_DIR/.review-queue.json"
NOTIFICATION_LOG="$FOUNDRY_DIR/.notifications.log"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

# Initialize files
[ ! -f "$REVIEW_QUEUE" ] && echo '[]' > "$REVIEW_QUEUE"
[ ! -f "$NOTIFICATION_LOG" ] && touch "$NOTIFICATION_LOG"

# Send notification (can be extended to use actual notification systems)
send_notification() {
    local pm=$1
    local message=$2
    local priority=$3
    
    # Log notification
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $priority: $pm - $message" >> "$NOTIFICATION_LOG"
    
    # Display notification
    case "$priority" in
        "CRITICAL")
            echo -e "${RED}🚨 CRITICAL ALERT for $pm: $message${NC}"
            ;;
        "HIGH")
            echo -e "${YELLOW}⚠️  HIGH PRIORITY for $pm: $message${NC}"
            ;;
        "NORMAL")
            echo -e "${CYAN}📋 $pm: $message${NC}"
            ;;
    esac
    
    # In a real implementation, this could:
    # - Send Slack/Discord messages
    # - Send emails
    # - Create desktop notifications
    # - Update a web dashboard
}

# Check for overdue reviews
check_overdue_reviews() {
    local current_time=$(date +%s)
    local found_overdue=0
    
    # Read review queue
    cat "$REVIEW_QUEUE" | jq -c '.[] | select(.status == "pending")' | while read -r review; do
        local file=$(echo "$review" | jq -r '.file')
        local team=$(echo "$review" | jq -r '.team')
        local pm="PM$team"
        local submitted=$(echo "$review" | jq -r '.submitted')
        local hours=$(( (current_time - submitted) / 3600 ))
        
        if [ $hours -gt 24 ]; then
            send_notification "$pm" "Review overdue ${hours}h: $file" "CRITICAL"
            ((found_overdue++))
        elif [ $hours -gt 12 ]; then
            send_notification "$pm" "Review pending ${hours}h: $file" "HIGH"
        fi
    done
    
    return $found_overdue
}

# Check for new reviews
check_new_reviews() {
    local last_check_file="$FOUNDRY_DIR/.last-review-check"
    local last_check=0
    
    [ -f "$last_check_file" ] && last_check=$(cat "$last_check_file")
    
    # Find reviews added since last check
    cat "$REVIEW_QUEUE" | jq -c '.[] | select(.status == "pending")' | while read -r review; do
        local file=$(echo "$review" | jq -r '.file')
        local team=$(echo "$review" | jq -r '.team')
        local pm="PM$team"
        local submitted=$(echo "$review" | jq -r '.submitted')
        
        if [ $submitted -gt $last_check ]; then
            send_notification "$pm" "New review request: $file" "NORMAL"
        fi
    done
    
    # Update last check time
    date +%s > "$last_check_file"
}

# Generate daily summary for each PM
generate_pm_summary() {
    echo -e "${CYAN}=== Daily PM Summary ===${NC}"
    echo ""
    
    for team in 1 2 3; do
        local pm="PM$team"
        echo -e "${GREEN}$pm Summary:${NC}"
        
        # Count pending reviews
        local pending=$(cat "$REVIEW_QUEUE" | jq "[.[] | select(.team == \"$team\" and .status == \"pending\")] | length")
        echo "  Pending reviews: $pending"
        
        # List reviews with age
        cat "$REVIEW_QUEUE" | jq -r ".[] | select(.team == \"$team\" and .status == \"pending\") | \"\(.file)|\(.submitted)\"" | while IFS='|' read -r file submitted; do
            local hours=$(( ($(date +%s) - submitted) / 3600 ))
            if [ $hours -gt 24 ]; then
                echo -e "    ${RED}• $file (${hours}h overdue)${NC}"
            else
                echo "    • $file (${hours}h)"
            fi
        done
        
        # Check team progress
        local in_dev=$(ls -1 "$FOUNDRY_DIR/5-ReadyToDevelop" 2>/dev/null | grep -cE "dev${team}_")
        local in_code_review=$(ls -1 "$FOUNDRY_DIR/6-CodeReview" 2>/dev/null | grep -cE "dev${team}_")
        
        echo "  Dev$team status:"
        echo "    In development: $in_dev"
        echo "    In code review: $in_code_review"
        echo ""
    done
}

# Monitor mode - continuous checking
monitor_mode() {
    echo -e "${CYAN}Starting review monitor...${NC}"
    echo "Checking every 5 minutes. Press Ctrl+C to stop."
    echo ""
    
    while true; do
        # Check for overdue reviews
        check_overdue_reviews
        
        # Check for new reviews
        check_new_reviews
        
        # Show brief status
        local total_pending=$(cat "$REVIEW_QUEUE" | jq '[.[] | select(.status == "pending")] | length')
        local overdue=$(cat "$REVIEW_QUEUE" | jq "[.[] | select(.status == \"pending\" and (($(date +%s) - .submitted) > 86400))] | length")
        
        echo -e "[$(date '+%H:%M')] Status: ${YELLOW}$total_pending pending${NC}, ${RED}$overdue overdue${NC}"
        
        # Sleep for 5 minutes
        sleep 300
    done
}

# Send test notification
test_notification() {
    echo -e "${CYAN}Testing notification system...${NC}"
    
    send_notification "PM1" "This is a test notification" "NORMAL"
    send_notification "PM2" "This is a high priority test" "HIGH"
    send_notification "PM3" "This is a critical test alert" "CRITICAL"
    
    echo ""
    echo -e "${GREEN}✓ Test notifications sent${NC}"
    echo "Check $NOTIFICATION_LOG for history"
}

# Main menu
case "$1" in
    "check")
        check_overdue_reviews
        check_new_reviews
        ;;
        
    "summary")
        generate_pm_summary
        ;;
        
    "monitor")
        monitor_mode
        ;;
        
    "test")
        test_notification
        ;;
        
    "log")
        if [ -f "$NOTIFICATION_LOG" ]; then
            echo -e "${CYAN}=== Recent Notifications ===${NC}"
            tail -20 "$NOTIFICATION_LOG"
        else
            echo "No notifications logged yet"
        fi
        ;;
        
    *)
        echo "Review Notification System"
        echo ""
        echo "Commands:"
        echo "  check    - Check for overdue/new reviews and notify"
        echo "  summary  - Generate daily summary for each PM"
        echo "  monitor  - Run continuous monitoring (5 min intervals)"
        echo "  test     - Send test notifications"
        echo "  log      - Show recent notifications"
        echo ""
        echo "Examples:"
        echo "  $0 check     # One-time check"
        echo "  $0 monitor   # Continuous monitoring"
        echo "  $0 summary   # Daily PM summary"
        ;;
esac