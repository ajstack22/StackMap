# [ARCHIVED] Mobile Storage Developer Prompt (Simplified)

> **Note**: Research is complete! SQLite won. See SQLITE_DEVELOPER_PROMPT.md for implementation instructions.

## Your Mission
Wait for research results, then implement the recommended storage solution for StackMap's mobile app.

## Context
- Task management app for users with ADHD/autism
- Fresh mobile-first implementation (no migration needed)
- Data: <100MB of tasks + occasional image attachments
- Must work offline and survive app reinstalls

## Current State
- ✅ Storage abstraction layer exists (`/refactor/js/storage-adapter.js`)
- ✅ Blob manager implemented (`/refactor/js/blob-manager.js`)
- ✅ Database schema designed (`/refactor/js/db-schema.js`)
- ⏳ Awaiting research on best storage approach
- ❌ No tests exist

## Next Steps

### 1. Wait for Research Results
The research team is investigating:
- Whether Capacitor Storage/Preferences is sufficient
- If we actually need IndexedDB complexity
- How similar apps handle this successfully
- Real-world failure rates and solutions

### 2. Implement Recommended Solution
Once research is complete, implement their recommended approach:
- Use their working code as starting point
- Adapt to our existing storage abstraction
- Keep it as simple as possible
- Focus on reliability over features

### 3. Test Core Scenarios
- Save/load 1000 tasks
- Handle 50 image attachments  
- Survive app reinstall
- Work offline for extended periods
- Perform well on 512MB devices

## What NOT to Do (Yet)
- Don't implement complex backup systems
- Don't add multi-device sync
- Don't over-engineer for edge cases
- Don't start until research is complete

## Success Criteria
- Works reliably for core use cases
- Simple enough to maintain
- No data loss in normal usage
- Good performance on low-end devices

## Remember
The best solution is probably boring and proven. Wait for research to confirm which boring solution to use.