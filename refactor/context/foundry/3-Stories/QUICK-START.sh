#!/bin/bash

# StackMap Developer Quick Start Script
# This helps developers find their assignment and start work

echo "==========================================="
echo "   StackMap Developer Quick Start"
echo "==========================================="
echo ""

# Get developer number
echo "Which developer are you?"
echo "1) Developer 1"
echo "2) Developer 2" 
echo "3) Developer 3"
echo ""
read -p "Enter your number (1-3): " dev_num

# Validate input
if [[ ! "$dev_num" =~ ^[1-3]$ ]]; then
    echo "Error: Please enter 1, 2, or 3"
    exit 1
fi

# Get round number
echo ""
echo "Which round are you working on?"
echo "1) Round 1 (Active now - Foundation work)"
echo "2) Round 2 (After Round 1 completes - Header navigation)"
echo ""
read -p "Enter round number (1-2): " round_num

# Validate input
if [[ ! "$round_num" =~ ^[1-2]$ ]]; then
    echo "Error: Please enter 1 or 2"
    exit 1
fi

echo ""
echo "==========================================="
echo "Your Assignment: Developer $dev_num, Round $round_num"
echo "==========================================="
echo ""

# Find their story file
story_file=$(ls r${round_num}_dev${dev_num}_story_*.md 2>/dev/null)

if [ -z "$story_file" ]; then
    echo "Error: No story file found for Developer $dev_num, Round $round_num"
    exit 1
fi

# Extract story info
story_number=$(echo $story_file | grep -o 'story_[0-9]*' | grep -o '[0-9]*')
story_desc=$(echo $story_file | sed 's/.*story_[0-9]*_//' | sed 's/.md//' | tr '_' ' ')

echo "📋 Your Story: #$story_number - $story_desc"
echo "📄 Story File: $story_file"
echo ""

# Show next steps
echo "📌 NEXT STEPS:"
echo ""
echo "1. READ the project context:"
echo "   cat PROJECT-CONTEXT.md"
echo ""
echo "2. READ your complete story:"
echo "   cat $story_file"
echo ""
echo "3. START your research phase"
echo "   - Study the existing code mentioned in your story"
echo "   - Document your findings"
echo ""
echo "4. CREATE your implementation plan:"
echo "   Plan file: 4-PlanReview/r${round_num}_dev${dev_num}_story_${story_number}_plan.md"
echo ""
echo "   touch 4-PlanReview/r${round_num}_dev${dev_num}_story_${story_number}_plan.md"
echo ""
echo "5. SUBMIT your plan for PM review"
echo "   - Make sure it follows the template in your story"
echo "   - Include all required sections"
echo ""

# Quick summary of their story
echo "==========================================="
echo "📖 Story Summary:"
echo "==========================================="
# Extract key info from story file
grep -A 2 "^## User Story" "$story_file" | tail -2
echo ""
grep -A 10 "^## Acceptance Criteria" "$story_file" | head -11
echo ""

echo "==========================================="
echo "⏱️  Time Estimates from your story:"
echo "==========================================="
grep -A 5 "^## Time Estimate" "$story_file" | tail -5
echo ""

echo "==========================================="
echo "⚠️  REMEMBER:"
echo "==========================================="
echo "- NO coding until your plan is approved!"
echo "- Research thoroughly - it prevents bugs"
echo "- Follow the plan template in your story"
echo "- Test on mobile devices"
echo "- Ask questions if you're unsure"
echo ""

# Create plan file if they want
read -p "Would you like to create your plan file now? (y/n): " create_plan

if [[ "$create_plan" == "y" || "$create_plan" == "Y" ]]; then
    plan_file="4-PlanReview/r${round_num}_dev${dev_num}_story_${story_number}_plan.md"
    
    # Create the file with a basic template
    cat > "$plan_file" << EOF
# Implementation Plan: Story #$story_number - $story_desc

**Developer**: $dev_num  
**Round**: $round_num  
**Date**: $(date +%Y-%m-%d)

## Phase 1: Research Findings

### [Research Area 1]
[Your findings here]

### [Research Area 2]
[Your findings here]

## Phase 2: Implementation Order

### Step 1: [First Change]
**File**: path/to/file.js
\`\`\`diff
- old code
+ new code
\`\`\`

### Step 2: [Next Change]
**File**: path/to/file.js
[Continue with detailed changes]

## Phase 3: Testing Plan

- [ ] Test case 1
- [ ] Test case 2
- [ ] Mobile testing
- [ ] Edge cases

## Risks and Mitigation

[Identify any risks and how to handle them]

## Questions for PM

[Any clarifications needed before starting]
EOF

    echo ""
    echo "✅ Plan file created: $plan_file"
    echo "   Edit it with your research findings and implementation details"
fi

echo ""
echo "Good luck with your story! 🚀"
echo "==========================================="