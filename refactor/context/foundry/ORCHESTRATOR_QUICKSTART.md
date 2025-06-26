# 🚀 Orchestrator Quick Start Guide

## Overview
The enhanced foundry workflow transforms the orchestrator from a manual coordinator to a strategic overseer with powerful automation tools.

## Key Commands

### 1. Launch Orchestrator Dashboard
```bash
./workflow-enhanced.sh orchestrator
```
This opens an interactive dashboard showing:
- Real-time team status (Active/Review/Blocked/Idle)
- Critical alerts (reviews > 24h)
- Review queue with priorities
- Round progress visualization

### 2. Start Review Monitor
```bash
./review-notifier.sh monitor
```
Runs continuous monitoring that:
- Checks for overdue reviews every 5 minutes
- Sends notifications for new review requests
- Alerts PMs about critical delays

### 3. View Web Dashboard
```bash
open dashboard.html
```
Visual browser-based dashboard with:
- Live team status indicators
- Review queue management
- Round progress tracking
- One-click actions

## Daily Orchestrator Workflow

### Morning (5 minutes)
1. Check orchestrator dashboard: `./workflow-enhanced.sh orch`
2. Process any critical alerts (red indicators)
3. Run auto-advance for completed reviews: Press `2` in dashboard

### Throughout the Day
- Review monitor runs in background
- Check dashboard when notified
- Handle only exceptions and blockers

### End of Day (5 minutes)
1. Generate PM summaries: `./review-notifier.sh summary`
2. Check performance metrics: `./workflow-enhanced.sh perf`
3. Plan next day's assignments

## Automation Features

### Auto-Assignment
```bash
# Assign all round 9 stories to teams automatically
./workflow-enhanced.sh bulk-assign 9
```
Balances load across teams based on current workload.

### Template Generation
```bash
# Generate plan template for a story
./workflow-enhanced.sh gen plan r9_story_120_feature.md

# Generate close report template
./workflow-enhanced.sh gen review r9_story_120_feature.md
```

### Pre-Review Checks
```bash
# Run automated checks before review
./workflow-enhanced.sh pre-check file.md 4-PlanReview
```
Catches missing sections, formatting issues, etc.

### Conflict Detection
```bash
# Check for team conflicts
./workflow-enhanced.sh conflicts
```
Identifies when multiple teams work on overlapping features.

## Quick Actions Menu

When in orchestrator dashboard, use number keys:
- `1` - Process review queue (see all pending reviews)
- `2` - Auto-advance ready files
- `3` - Bulk assign round
- `4` - Team performance report
- `5` - Conflict detection
- `6` - Export metrics
- `R` - Refresh display
- `Q` - Quit

## Benefits vs Manual Process

| Task | Before | After |
|------|--------|-------|
| Check team status | 10-15 min manual checking | 5 sec dashboard view |
| Find overdue reviews | Search through folders | Automatic alerts |
| Assign stories | Manual file renaming | One command bulk assign |
| Track round progress | Count files manually | Visual progress bar |
| Coordinate teams | Constant communication | Exception-based alerts |

## Troubleshooting

### Missing data files
Run any command once to auto-create:
```bash
./workflow-enhanced.sh status
```

### Review not showing in queue
Check if file follows naming convention:
```
r[round]_dev[team]_story_[id]_description.md
```

### Dashboard not updating
- Ensure JSON files are writable
- Check file permissions
- Restart review monitor

## Advanced Usage

### Custom Review Priorities
Edit `.review-queue.json` to set priority:
- `critical` - Shows at top, red alerts
- `high` - Yellow warnings
- `normal` - Standard queue order

### Metrics Export
```bash
./workflow-enhanced.sh orch
# Press 6 to export metrics
```
Creates `metrics-export.json` for analysis.

### Integration Points
The system creates these files for integration:
- `.file-ownership.json` - File/team registry
- `.review-queue.json` - Pending reviews
- `.workflow-metrics.json` - Performance data
- `.notifications.log` - Alert history

## Next Steps

1. **Set up monitoring**: Run `./review-notifier.sh monitor` in a screen/tmux session
2. **Bookmark dashboard**: Keep `dashboard.html` open in a browser tab
3. **Configure notifications**: Extend `review-notifier.sh` for Slack/email
4. **Train PMs**: Show them their new streamlined workflow
5. **Collect feedback**: Iterate on automation rules

The goal is to reduce orchestrator overhead from hours to minutes per day while improving visibility and preventing bottlenecks.