# Foundry Workflow

Issue-based workflow for PM/Developer communication and task tracking.

## Quick Start

```bash
# PM: Check your round tasks
./workflow.sh round

# Check full status
./workflow.sh status

# Create new research prompt (requires issue number)
./workflow.sh new 62 notification-strategies

# Move file to next stage
./workflow.sh advance 62-notification-strategies.md 4-PlanReview

# Archive completed work
./workflow.sh archive 58-sqlite-testing.md 7-Completed
```

## PM Round Tasks

Each round, the PM should:

1. **Submit research requests** for GitHub issues that need research
2. **Review research reports** and create technical stories  
3. **Adversarially review plans** in 4-PlanReview → move to 5-ReadyToDevelop
4. **Adversarially review code** in 6-CodeReview → move to 7-Completed

Run `./workflow.sh round` to see your current tasks!

## Workflow Stages

### 1. ResearchPrompt → 2. ResearchReports
**PM**: Create research prompt using issue number
```bash
./workflow.sh new 62 notification-strategies
```
**Researcher**: Create report with same filename in 2-ResearchReports/

### 2. ResearchReports → 3. Stories  
**PM**: Review research, create technical story in 3-Stories/
```bash
./workflow.sh archive 62-notification-strategies.md 2-ResearchReports
```

### 3. Stories → 4. PlanReview
**Dev**: Take story, create plan in 4-PlanReview/

### 4. PlanReview → 5. ReadyToDevelop
**PM**: Adversarial review of plan, then:
```bash
./workflow.sh advance 62-notification-strategies.md 4-PlanReview
```

### 5. ReadyToDevelop → 6. CodeReview  
**Dev**: Implement feature, create review doc in 6-CodeReview/

### 6. CodeReview → 7. Completed
**PM**: Adversarial code review, then:
```bash
./workflow.sh advance 62-notification-strategies.md 6-CodeReview
```

### 7. Completed → Archive
When truly done:
```bash
./workflow.sh archive 62-notification-strategies.md 7-Completed
```

## File Naming Convention

All files use: `<issue#>-<description>.md`

Example: `62-notification-strategies.md`

This same filename follows through all stages (no renaming needed).

## GitHub Integration

- Always create GitHub issue FIRST
- Use issue number in all filenames
- Script checks if issue exists when creating prompts
- Keep issue updated with progress

## Templates

Each folder has a TEMPLATE.md file showing the expected format.

## Tips

- One GitHub issue = One foundry workflow
- Use consistent filenames throughout stages
- Archive only when completely done
- Check `./workflow.sh round` at start of each session