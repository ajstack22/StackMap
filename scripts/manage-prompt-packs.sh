#!/bin/bash

# Manage Prompt Packs Script for StackMap
# Interactive management of prompt packs with story IDs
# Handles listing, prioritization, archiving, and viewing

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROMPTS_DIR="$PROJECT_ROOT/docs/prompts"
ACTIVE_DIR="$PROMPTS_DIR/active"
ARCHIVE_DIR="$PROMPTS_DIR/archive"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to display header
show_header() {
    clear
    echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}${BOLD}       StackMap Prompt Pack Management System          ${NC}"
    echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

# Function to extract metadata from prompt pack
get_pack_metadata() {
    local file=$1
    local filename=$(basename "$file")
    
    # Extract from filename (PP-SSS-name.md format)
    local priority_num=$(echo "$filename" | cut -d'-' -f1)
    local story_id=$(echo "$filename" | cut -d'-' -f2)
    local slug=$(echo "$filename" | sed -E 's/^[0-9]{2}-[0-9]{3}-(.*)\.md$/\1/')
    
    # Get priority label
    local priority_label=""
    case $priority_num in
        01) priority_label="critical" ;;
        02) priority_label="high" ;;
        03) priority_label="medium" ;;
        04) priority_label="low" ;;
        *) priority_label="unknown" ;;
    esac
    
    # Try to get status from file
    local status="pending"
    if [ -f "$file" ]; then
        local status_line=$(grep "^- \*\*Status\*\*:" "$file" 2>/dev/null || echo "")
        if [ ! -z "$status_line" ]; then
            status=$(echo "$status_line" | sed 's/.*Status\*\*: *//' | tr '[:upper:]' '[:lower:]')
        fi
    fi
    
    # Try to get assigned to from file
    local assigned="unassigned"
    if [ -f "$file" ]; then
        local assigned_line=$(grep "^- \*\*Assigned To\*\*:" "$file" 2>/dev/null || echo "")
        if [ ! -z "$assigned_line" ]; then
            assigned=$(echo "$assigned_line" | sed 's/.*Assigned To\*\*: *//')
        fi
    fi
    
    echo "$priority_num|$story_id|$priority_label|$status|$assigned|$slug"
}

# Function to list all active prompt packs
list_prompt_packs() {
    show_header
    echo -e "${CYAN}${BOLD}Active Prompt Packs:${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════════════════${NC}"
    printf "${BOLD}%-8s %-10s %-12s %-12s %-15s %-25s${NC}\n" "Story" "Priority" "Status" "Assigned" "Name"
    echo -e "${YELLOW}────────────────────────────────────────────────────────────────────────────${NC}"
    
    if [ ! -d "$ACTIVE_DIR" ] || [ -z "$(ls -A "$ACTIVE_DIR" 2>/dev/null)" ]; then
        echo -e "${YELLOW}No active prompt packs found${NC}"
    else
        # Create array of packs
        local packs=()
        for file in "$ACTIVE_DIR"/*.md; do
            if [ -f "$file" ]; then
                packs+=("$(get_pack_metadata "$file")|$file")
            fi
        done
        
        # Sort by priority number then story ID
        IFS=$'\n' sorted_packs=($(printf '%s\n' "${packs[@]}" | sort -t'|' -k1,1n -k2,2n))
        
        # Display sorted packs
        for pack_info in "${sorted_packs[@]}"; do
            IFS='|' read -r priority_num story_id priority_label status assigned slug filepath <<< "$pack_info"
            
            # Color code by priority
            local color=""
            case $priority_num in
                01) color=$RED ;;
                02) color=$YELLOW ;;
                03) color=$GREEN ;;
                04) color=$CYAN ;;
            esac
            
            # Color code status
            local status_color=""
            case $status in
                pending) status_color=$YELLOW ;;
                in-progress) status_color=$BLUE ;;
                completed) status_color=$GREEN ;;
                blocked) status_color=$RED ;;
                *) status_color=$NC ;;
            esac
            
            printf "${color}%-8s${NC} ${color}%-10s${NC} ${status_color}%-12s${NC} %-12s %-25s\n" \
                "#$story_id" "$priority_label" "$status" "$assigned" "$slug"
        done
    fi
    echo -e "${YELLOW}════════════════════════════════════════════════════════════════════════════${NC}"
}

# Function to create new prompt pack
create_prompt_pack() {
    "$SCRIPT_DIR/create-prompt-pack.sh"
}

# Function to change priority of a pack
change_priority() {
    show_header
    echo -e "${CYAN}${BOLD}Change Prompt Pack Priority${NC}"
    echo ""
    
    # List current packs with numbers
    local i=1
    declare -A pack_map
    
    for file in "$ACTIVE_DIR"/*.md; do
        if [ -f "$file" ]; then
            local metadata=$(get_pack_metadata "$file")
            IFS='|' read -r priority_num story_id priority_label status assigned slug <<< "$metadata"
            echo "  $i) Story #$story_id - $slug (currently: $priority_label)"
            pack_map[$i]="$file"
            ((i++))
        fi
    done
    
    if [ ${#pack_map[@]} -eq 0 ]; then
        echo -e "${YELLOW}No active prompt packs to reprioritize${NC}"
        return
    fi
    
    echo ""
    read -p "Select pack to reprioritize (1-$((i-1))): " selection
    
    if [ -z "${pack_map[$selection]}" ]; then
        echo -e "${RED}Invalid selection${NC}"
        return
    fi
    
    local old_file="${pack_map[$selection]}"
    local old_filename=$(basename "$old_file")
    local story_id=$(echo "$old_filename" | cut -d'-' -f2)
    local slug=$(echo "$old_filename" | sed -E 's/^[0-9]{2}-[0-9]{3}-(.*)\.md$/\1/')
    
    echo ""
    echo "Select new priority:"
    echo "  1) 01-critical"
    echo "  2) 02-high"
    echo "  3) 03-medium"
    echo "  4) 04-low"
    read -p "Choice (1-4): " priority_choice
    
    case $priority_choice in
        1) new_priority="01" ;;
        2) new_priority="02" ;;
        3) new_priority="03" ;;
        4) new_priority="04" ;;
        *) echo -e "${RED}Invalid choice${NC}"; return ;;
    esac
    
    # Create new filename with same story ID
    local new_filename="${new_priority}-${story_id}-${slug}.md"
    local new_file="$ACTIVE_DIR/$new_filename"
    
    # Check if already at this priority
    if [ "$old_file" = "$new_file" ]; then
        echo -e "${YELLOW}Pack already at this priority${NC}"
        return
    fi
    
    # Move the file
    mv "$old_file" "$new_file"
    
    # Update priority in file content
    case $new_priority in
        01) priority_text="01-critical" ;;
        02) priority_text="02-high" ;;
        03) priority_text="03-medium" ;;
        04) priority_text="04-low" ;;
    esac
    
    sed -i '' "s/\*\*Priority\*\*: .*/\*\*Priority\*\*: $priority_text/" "$new_file"
    
    echo -e "${GREEN}✅ Changed priority of Story #$story_id to $priority_text${NC}"
}

# Function to archive completed pack
archive_pack() {
    show_header
    echo -e "${CYAN}${BOLD}Archive Completed Prompt Pack${NC}"
    echo ""
    
    # List current packs
    local i=1
    declare -A pack_map
    
    for file in "$ACTIVE_DIR"/*.md; do
        if [ -f "$file" ]; then
            local metadata=$(get_pack_metadata "$file")
            IFS='|' read -r priority_num story_id priority_label status assigned slug <<< "$metadata"
            local status_indicator=""
            if [ "$status" = "completed" ]; then
                status_indicator=" ${GREEN}[COMPLETED]${NC}"
            fi
            echo -e "  $i) Story #$story_id - $slug$status_indicator"
            pack_map[$i]="$file"
            ((i++))
        fi
    done
    
    if [ ${#pack_map[@]} -eq 0 ]; then
        echo -e "${YELLOW}No active prompt packs to archive${NC}"
        return
    fi
    
    echo ""
    read -p "Select pack to archive (1-$((i-1))): " selection
    
    if [ -z "${pack_map[$selection]}" ]; then
        echo -e "${RED}Invalid selection${NC}"
        return
    fi
    
    local file="${pack_map[$selection]}"
    local filename=$(basename "$file")
    
    # Create archive directory if needed
    mkdir -p "$ARCHIVE_DIR"
    
    # Add completion date to file
    local date=$(date '+%Y-%m-%d %H:%M')
    echo "" >> "$file"
    echo "---" >> "$file"
    echo "*Archived: $date*" >> "$file"
    
    # Move to archive
    mv "$file" "$ARCHIVE_DIR/$filename"
    
    echo -e "${GREEN}✅ Archived: $filename${NC}"
}

# Function to view specific pack
view_pack() {
    show_header
    echo -e "${CYAN}${BOLD}View Prompt Pack${NC}"
    echo ""
    
    # List all packs (active and archived)
    local i=1
    declare -A pack_map
    
    echo -e "${YELLOW}Active Packs:${NC}"
    for file in "$ACTIVE_DIR"/*.md; do
        if [ -f "$file" ]; then
            local metadata=$(get_pack_metadata "$file")
            IFS='|' read -r priority_num story_id priority_label status assigned slug <<< "$metadata"
            echo "  $i) Story #$story_id - $slug"
            pack_map[$i]="$file"
            ((i++))
        fi
    done
    
    echo ""
    echo -e "${YELLOW}Archived Packs:${NC}"
    for file in "$ARCHIVE_DIR"/*.md; do
        if [ -f "$file" ]; then
            local metadata=$(get_pack_metadata "$file")
            IFS='|' read -r priority_num story_id priority_label status assigned slug <<< "$metadata"
            echo "  $i) Story #$story_id - $slug ${GREEN}[ARCHIVED]${NC}"
            pack_map[$i]="$file"
            ((i++))
        fi
    done
    
    if [ ${#pack_map[@]} -eq 0 ]; then
        echo -e "${YELLOW}No prompt packs found${NC}"
        return
    fi
    
    echo ""
    read -p "Select pack to view (1-$((i-1))): " selection
    
    if [ -z "${pack_map[$selection]}" ]; then
        echo -e "${RED}Invalid selection${NC}"
        return
    fi
    
    local file="${pack_map[$selection]}"
    
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    cat "$file"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
}

# Function to update pack status
update_status() {
    show_header
    echo -e "${CYAN}${BOLD}Update Prompt Pack Status${NC}"
    echo ""
    
    # List current packs
    local i=1
    declare -A pack_map
    
    for file in "$ACTIVE_DIR"/*.md; do
        if [ -f "$file" ]; then
            local metadata=$(get_pack_metadata "$file")
            IFS='|' read -r priority_num story_id priority_label status assigned slug <<< "$metadata"
            echo "  $i) Story #$story_id - $slug (current: $status)"
            pack_map[$i]="$file"
            ((i++))
        fi
    done
    
    if [ ${#pack_map[@]} -eq 0 ]; then
        echo -e "${YELLOW}No active prompt packs${NC}"
        return
    fi
    
    echo ""
    read -p "Select pack to update (1-$((i-1))): " selection
    
    if [ -z "${pack_map[$selection]}" ]; then
        echo -e "${RED}Invalid selection${NC}"
        return
    fi
    
    local file="${pack_map[$selection]}"
    
    echo ""
    echo "Select new status:"
    echo "  1) Pending"
    echo "  2) In-Progress"
    echo "  3) Completed"
    echo "  4) Blocked"
    read -p "Choice (1-4): " status_choice
    
    case $status_choice in
        1) new_status="Pending" ;;
        2) new_status="In-Progress" ;;
        3) new_status="Completed" ;;
        4) new_status="Blocked" ;;
        *) echo -e "${RED}Invalid choice${NC}"; return ;;
    esac
    
    # Update status in file
    sed -i '' "s/\*\*Status\*\*: .*/\*\*Status\*\*: $new_status/" "$file"
    
    echo -e "${GREEN}✅ Updated status to: $new_status${NC}"
}

# Main menu loop
main_menu() {
    while true; do
        show_header
        echo -e "${CYAN}${BOLD}Main Menu:${NC}"
        echo ""
        echo "  1) List all prompt packs"
        echo "  2) Create new prompt pack"
        echo "  3) Change pack priority"
        echo "  4) Update pack status"
        echo "  5) Archive completed pack"
        echo "  6) View specific pack"
        echo "  7) Exit"
        echo ""
        read -p "Select option (1-7): " choice
        
        case $choice in
            1) list_prompt_packs; echo ""; read -p "Press Enter to continue..." ;;
            2) create_prompt_pack; echo ""; read -p "Press Enter to continue..." ;;
            3) change_priority; echo ""; read -p "Press Enter to continue..." ;;
            4) update_status; echo ""; read -p "Press Enter to continue..." ;;
            5) archive_pack; echo ""; read -p "Press Enter to continue..." ;;
            6) view_pack; echo ""; read -p "Press Enter to continue..." ;;
            7) echo -e "${GREEN}Goodbye!${NC}"; exit 0 ;;
            *) echo -e "${RED}Invalid option${NC}"; sleep 1 ;;
        esac
    done
}

# Run main menu
main_menu