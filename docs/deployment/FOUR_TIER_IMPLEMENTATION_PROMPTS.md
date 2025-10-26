# 4-Tier Deployment Implementation Prompts

**Purpose:** Step-by-step prompts to implement 4-tier deployment system (QUAL → STAGE → BETA → PROD)

**Architecture:**
```
QUAL  → stackmap.app/qual (web) + qual/api → Qual DB
STAGE → stage/api only (no web) → Qual DB
BETA  → stackmap.app/beta (web) + beta/api → Prod DB
PROD  → stackmap.app (web) + /api → Prod DB
```

---

## Prompt 1: Mobile Build Configuration

**Use:** @agent-developer

**Prompt:**
```
Implement mobile app build type detection for the 4-tier deployment system.

## Context
StackMap currently has qual and prod builds. We need to add stage and beta build types, each hitting different API endpoints:
- QUAL → stackmap.app/qual/api
- STAGE → stackmap.app/stage/api
- BETA → stackmap.app/beta/api
- PROD → stackmap.app/api

## Current State
API URL is hardcoded in src/services/sync/syncServiceV2.js (or similar sync file).

## Requirements

1. Create src/config/buildConfig.js:
   - Detect BUILD_TYPE from environment (qual/stage/beta/prod)
   - Export API_URL based on BUILD_TYPE
   - Default to prod if not set
   - Handle both __DEV__ mode and production builds

2. Update sync service:
   - Import API_URL from buildConfig.js
   - Replace hardcoded URLs
   - Maintain backward compatibility

3. Add package.json scripts (if needed):
   - build:qual, build:stage, build:beta, build:prod
   - Each sets BUILD_TYPE environment variable

## Deliverables
- buildConfig.js file
- Updated sync service
- Updated package.json scripts
- Brief usage documentation

## Success Criteria
- ✅ Code compiles without errors
- ✅ API_URL correctly determined for each BUILD_TYPE
- ✅ Backward compatible with existing builds
- ✅ No hardcoded URLs remain in sync service
```

---

## Prompt 2: Review Build Configuration

**Use:** @agent-peer-reviewer

**Prompt:**
```
Review the mobile build configuration implementation for the 4-tier deployment system.

## What Was Implemented
The developer agent created build type detection to route mobile apps to different API endpoints (qual/api, stage/api, beta/api, /api).

## Review Criteria

### Security
- [ ] No API keys or secrets in buildConfig.js
- [ ] Environment variables handled safely
- [ ] Default to production is safe (not dev)

### Code Quality
- [ ] Clear, self-documenting code
- [ ] Proper error handling if BUILD_TYPE invalid
- [ ] Comments explain the 4-tier system
- [ ] No hardcoded URLs

### Edge Cases
- [ ] What happens if BUILD_TYPE is undefined?
- [ ] What happens if BUILD_TYPE is invalid value?
- [ ] Does __DEV__ mode work correctly?
- [ ] Are all API URLs using HTTPS?

### Backward Compatibility
- [ ] Existing qual builds still work
- [ ] Existing prod builds still work
- [ ] No breaking changes to sync service

### Testing Concerns
- [ ] How will we test each build type?
- [ ] Can we verify API_URL at runtime?
- [ ] Any console logging for debugging?

## Deliverables
- Issues/concerns list
- Recommended improvements
- Approval or changes needed
```

---

## Prompt 3: Fastlane Stage Lanes

**Use:** @agent-developer

**Prompt:**
```
Create stage deployment lanes for iOS and Android fastlane.

## Context
StackMap has beta_ios and beta_android lanes for TestFlight/Play Store Internal Testing. We need stage lanes that:
- Use BUILD_TYPE=stage environment variable
- Deploy to Internal Testing (iOS TestFlight Internal, Android Play Internal)
- Use stage/api endpoint (baked into build)

## Current State
Review these existing lanes:
- ios/fastlane/Fastfile: beta_ios lane (lines 367-399)
- android/fastlane/Fastfile: beta_android lane (lines 282-336)

## Requirements

### iOS: Create stage_ios lane
- Based on beta_ios but for Internal Testing only
- Set ENV["BUILD_TYPE"] = "stage" before building
- distribute_external: false (Internal only)
- Skip external groups
- Otherwise same as beta_ios (validation, build, upload, retry logic)

### Android: Create stage_android lane
- Based on beta_android but explicitly for Internal track
- Set ENV["BUILD_TYPE"] = "stage" before building
- Upload to 'internal' track (same as beta currently does)
- Otherwise same as beta_android (validation, build, upload, retry logic)

## Important
- Don't modify existing beta lanes yet
- Set BUILD_TYPE environment variable before React Native bundling
- Maintain all existing safeguards (retry logic, validation, etc.)
- Use same credential system as beta

## Deliverables
- stage_ios lane in ios/fastlane/Fastfile
- stage_android lane in android/fastlane/Fastfile
- Both lanes tested with `fastlane lanes | grep stage`
- Brief description of what each lane does

## Success Criteria
- ✅ Syntax valid (fastlane lanes works)
- ✅ BUILD_TYPE environment variable set correctly
- ✅ Internal testing configured
- ✅ Same quality as beta lanes
```

---

## Prompt 4: Update Beta Lanes for External Testing

**Use:** @agent-developer

**Prompt:**
```
Update beta fastlane lanes to use External/Closed testing and beta/api endpoint.

## Context
Now that STAGE handles Internal Testing, BETA should move to External Testing for wider beta tester groups.

## Current State
- beta_ios: Uses Internal Testing (distribute_external: false)
- beta_android: Uses 'internal' track

## Requirements

### iOS: Update beta_ios lane
- Change distribute_external: true (External Testing)
- Add groups: ["Beta Testers"] (external group)
- Set ENV["BUILD_TYPE"] = "beta" before building
- Keep all other config (retry logic, validation, etc.)

### Android: Update beta_android lane
- Change track from 'internal' to 'closed'
- Set ENV["BUILD_TYPE"] = "beta" before building
- Keep all other config

## Important
- Beta lanes should be for External/Closed testing groups
- BUILD_TYPE=beta ensures beta/api endpoint is used
- Don't break existing functionality
- Keep all safeguards and retry logic

## Deliverables
- Updated beta_ios lane
- Updated beta_android lane
- Comments explaining External vs Internal testing
- Brief migration notes

## Success Criteria
- ✅ Syntax valid
- ✅ BUILD_TYPE=beta set correctly
- ✅ External/Closed testing configured
- ✅ All safeguards maintained
```

---

## Prompt 5: Review Fastlane Changes

**Use:** @agent-peer-reviewer

**Prompt:**
```
Review fastlane lane updates for stage and beta tiers.

## What Was Implemented
1. New stage_ios and stage_android lanes (Internal Testing)
2. Updated beta_ios and beta_android lanes (External/Closed Testing)

## Review Criteria

### Configuration Correctness
- [ ] stage_ios: distribute_external = false
- [ ] beta_ios: distribute_external = true
- [ ] stage_android: track = 'internal'
- [ ] beta_android: track = 'closed'
- [ ] BUILD_TYPE environment variable set in all lanes

### Code Quality
- [ ] No code duplication between stage/beta lanes
- [ ] Comments explain the difference
- [ ] Error handling preserved
- [ ] Retry logic intact

### Testing Strategy
- [ ] Internal vs External testing correctly configured
- [ ] Appropriate for stage (just developer) vs beta (testers)
- [ ] Groups/tracks configured correctly

### Potential Issues
- [ ] What if BUILD_TYPE isn't passed to React Native?
- [ ] Are credentials still secure?
- [ ] Will old beta deployments break?
- [ ] Any iOS/Android platform differences to note?

### Documentation
- [ ] Clear lane descriptions
- [ ] Usage examples provided
- [ ] Migration notes for existing beta testers

## Deliverables
- Issues/concerns list
- Recommended improvements
- Approval or changes needed
```

---

## Prompt 6: Create Stage Deployment Script

**Use:** @agent-developer

**Prompt:**
```
Create scripts/deploy_stage.sh for internal stage testing.

## Context
Stage tier is for internal testing (just the developer) before opening to beta testers. It:
- Deploys to TestFlight Internal + Play Internal Testing
- Uses stage/api endpoint (Qual DB)
- NO web deployment (stage is mobile-only)
- Less strict than beta (warnings vs blocking)

## Template
Base on scripts/deploy_beta.sh but with these changes:

### Key Differences from Beta
1. No web deployment (stage is mobile-only)
2. Can use qual database (less strict data requirements)
3. Validation: Warnings only (not blocking)
4. Audience: Just developer (not external testers)
5. Fastlane: Use stage_ios and stage_android lanes
6. Version: Add "-stage" suffix (or inherit from qual)

### Requirements
- Validate git status (warn only)
- Run smoke + critical tests (warn if fail, don't block)
- Deploy iOS: fastlane stage_ios
- Deploy Android: fastlane stage_android
- Generate deployment report
- Platform flags: --ios, --android, --all

## Deliverables
- scripts/deploy_stage.sh (executable)
- Clear console output with stage tier indication
- Deployment report
- Brief usage documentation

## Success Criteria
- ✅ Syntax valid (bash -n)
- ✅ Executable permissions set
- ✅ Calls correct fastlane lanes
- ✅ Clear differentiation from beta
- ✅ Proper error handling
```

---

## Prompt 7: Update Beta Script for Beta Web + API

**Use:** @agent-developer

**Prompt:**
```
Update scripts/deploy_beta.sh to deploy beta web and use beta/api endpoint.

## Context
Beta tier now needs to:
- Deploy web to stackmap.app/beta (NEW!)
- Use beta/api endpoint (prod DB)
- Deploy to External/Closed testing (updated fastlane lanes)

## Current State
deploy_beta.sh currently:
- Deploys to qual web (needs to change to beta web)
- Uses beta_ios and beta_android lanes (already updated)

## Requirements

### Web Deployment (NEW)
- Deploy to /beta folder on server (similar to /qual)
- Use deploy-with-tracking.sh or similar mechanism
- Create deployment.log in beta folder
- Verify beta web is accessible

### Environment Variable
- Ensure BUILD_TYPE=beta is set for mobile builds
- This makes mobile apps use beta/api endpoint

### Testing
- Stricter than stage (block on critical test failures)
- Require clean git status (block if uncommitted)

### Documentation
- Update comments to reflect beta web deployment
- Add beta.stackmap.app or stackmap.app/beta to output

## Important
- Beta web should be accessible at stackmap.app/beta
- Beta mobile apps use beta/api (connects to prod DB)
- Don't break existing beta functionality

## Deliverables
- Updated deploy_beta.sh with beta web deployment
- Clear output showing beta web URL
- Updated deployment report
- Brief documentation of changes

## Success Criteria
- ✅ Deploys to /beta folder on server
- ✅ Beta web accessible
- ✅ Mobile apps use beta/api
- ✅ Proper error handling
```

---

## Prompt 8: Update Master Deployment Script

**Use:** @agent-developer

**Prompt:**
```
Update scripts/deploy.sh master script to support 4-tier deployment.

## Current State
deploy.sh supports: qual, beta, prod

## Requirements

### Add Stage Tier
- Accept 'stage' as valid tier argument
- Validate: qual|stage|beta|prod
- Delegate to deploy_stage.sh for stage tier

### Update Help Text
- Show all 4 tiers in usage
- Explain what each tier does:
  - QUAL: Local testing (simulators/emulators)
  - STAGE: Internal testing (just me, TestFlight Internal)
  - BETA: Closed testing (beta testers, External/Closed)
  - PROD: Production (everyone, App/Play Store)

### Update Validation
- Tier-specific validation rules:
  - QUAL: Warnings only
  - STAGE: Warnings only
  - BETA: Block on uncommitted changes
  - PROD: Block on any issues

### Integration
- Source common libraries
- Run pre-deployment validation
- Delegate to tier script
- Run post-deployment verification

## Deliverables
- Updated deploy.sh with stage support
- Clear help documentation
- Updated validation logic
- Brief testing notes

## Success Criteria
- ✅ All 4 tiers work: ./scripts/deploy.sh [qual|stage|beta|prod]
- ✅ Help text accurate
- ✅ Validation appropriate per tier
- ✅ Backward compatible
```

---

## Prompt 9: Review Deployment Scripts

**Use:** @agent-peer-reviewer

**Prompt:**
```
Review deployment script updates for 4-tier system.

## What Was Implemented
1. deploy_stage.sh (new)
2. Updated deploy_beta.sh (beta web deployment)
3. Updated deploy.sh (4-tier support)

## Review Criteria

### Script Quality
- [ ] Proper error handling (set -e where appropriate)
- [ ] User-friendly output messages
- [ ] Clear success/failure indicators
- [ ] Deployment reports generated

### Tier Separation
- [ ] QUAL: Local testing, permissive
- [ ] STAGE: Internal testing, warnings only
- [ ] BETA: External testing, strict validation
- [ ] PROD: Production, strictest validation

### Web Deployment
- [ ] Beta web deploys to correct location
- [ ] Server paths correct (/qual, /beta, /)
- [ ] Backup/rollback strategy for beta web

### API Endpoints
- [ ] Mobile apps use correct API per tier
- [ ] BUILD_TYPE propagated correctly
- [ ] Environment variables set properly

### Edge Cases
- [ ] What if deploy_stage.sh called directly vs via deploy.sh?
- [ ] What if beta web deployment fails mid-process?
- [ ] Are all platform flags working (--ios, --android, --all)?
- [ ] Proper cleanup on failure?

### Testing
- [ ] How will we test each script without deploying?
- [ ] Dry-run mode available?
- [ ] Verification steps documented?

## Deliverables
- Issues/concerns list
- Security considerations
- Recommended improvements
- Approval or changes needed
```

---

## Prompt 10: Documentation Update

**Use:** @agent-developer

**Prompt:**
```
Update all deployment documentation for 4-tier system.

## Files to Update

### 1. CLAUDE.md
- Update deployment section (lines 39-62)
- Show all 4 tiers with clear descriptions
- Update command examples
- Add API endpoint reference

### 2. docs/deployment/README.md
- Change from "Three-Tier" to "Four-Tier"
- Add STAGE tier documentation
- Update deployment flow diagram
- Add API endpoint mapping table

### 3. Create docs/deployment/STAGE_DEPLOYMENT_GUIDE.md
- Similar to BETA_DEPLOYMENT_GUIDE.md
- Explain internal testing purpose
- Document fastlane lanes
- Usage examples
- Troubleshooting

### 4. Update docs/deployment/BETA_DEPLOYMENT_GUIDE.md
- Add beta web deployment info
- Explain External vs Internal testing
- Update with beta/api endpoint
- Migration notes from 3-tier

### 5. Create docs/deployment/FOUR_TIER_ARCHITECTURE.md
- Architecture overview diagram
- API endpoint mapping
- Database assignments
- Testing group configurations
- Decision rationale

## Key Messages
- QUAL: Development testing (qual DB)
- STAGE: Internal validation (qual DB, mobile-only)
- BETA: Closed beta testing (prod DB, beta web + mobile)
- PROD: Public release (prod DB)

## Deliverables
- All 5 documentation files updated/created
- Consistent terminology across docs
- Clear diagrams/tables
- Examples for each tier

## Success Criteria
- ✅ All docs mention 4 tiers
- ✅ API endpoints documented
- ✅ Clear usage examples
- ✅ No references to old 3-tier system
```

---

## Prompt 11: Final Review

**Use:** @agent-peer-reviewer

**Prompt:**
```
Final comprehensive review of 4-tier deployment implementation.

## What Was Implemented
Complete 4-tier deployment system:
- QUAL → stackmap.app/qual + qual/api → Qual DB
- STAGE → stage/api → Qual DB (mobile-only)
- BETA → stackmap.app/beta + beta/api → Prod DB
- PROD → stackmap.app + /api → Prod DB

## Review Areas

### Completeness
- [ ] All 4 tiers fully implemented
- [ ] Mobile build configuration complete
- [ ] Fastlane lanes for all tiers
- [ ] Deployment scripts for all tiers
- [ ] Documentation comprehensive

### Consistency
- [ ] Naming conventions consistent (qual/stage/beta/prod)
- [ ] API endpoints follow pattern
- [ ] Deployment scripts similar structure
- [ ] Documentation uses same terminology

### Quality Gates
- [ ] STAGE less strict than BETA (appropriate)
- [ ] BETA blocks on critical failures
- [ ] PROD has strictest validation
- [ ] Error messages helpful

### Architecture Soundness
- [ ] STAGE uses qual DB (appropriate for internal)
- [ ] BETA uses prod DB (appropriate for real users)
- [ ] No data migration needed between tiers
- [ ] API versioning implicitly handled

### Migration Path
- [ ] Existing qual deployments unaffected
- [ ] Existing prod deployments unaffected
- [ ] Clear upgrade path from 3-tier
- [ ] Rollback strategy documented

### Missing Pieces
- [ ] Server API routes (manual cPanel setup documented?)
- [ ] Beta web directory creation (documented?)
- [ ] Testing group configuration (documented?)
- [ ] Any other manual steps?

## Deliverables
- Final issues list
- Deployment readiness assessment
- Recommended next steps
- Sign-off or changes needed

## Success Criteria for Go-Live
- ✅ All code complete and tested
- ✅ Documentation comprehensive
- ✅ No critical issues
- ✅ Manual setup steps documented
- ✅ Rollback plan in place
```

---

## Usage Instructions

### Sequential Execution
Run prompts 1-11 in order, using the specified agent for each:

1. **Prompts 1, 3, 4, 6, 7, 8, 10** → @agent-developer
2. **Prompts 2, 5, 9, 11** → @agent-peer-reviewer

### Parallel Execution (Faster)
Can run some prompts in parallel:

**Batch 1 (Parallel):**
- Prompt 1: Build config (@agent-developer)
- Prompt 3: Stage lanes (@agent-developer)

**Batch 2 (Sequential):**
- Prompt 2: Review build config (@agent-peer-reviewer)
- Prompt 4: Update beta lanes (@agent-developer)
- Prompt 5: Review fastlane (@agent-peer-reviewer)

**Batch 3 (Parallel):**
- Prompt 6: Stage script (@agent-developer)
- Prompt 7: Beta script (@agent-developer)

**Batch 4 (Sequential):**
- Prompt 8: Master script (@agent-developer)
- Prompt 9: Review scripts (@agent-peer-reviewer)
- Prompt 10: Documentation (@agent-developer)
- Prompt 11: Final review (@agent-peer-reviewer)

### After Completion

**Manual server setup required:**
1. Add API routes: /stage/api, /beta/api
2. Create /beta web directory
3. Configure testing groups (TestFlight, Play Console)

See docs/deployment/FOUR_TIER_ARCHITECTURE.md for server setup details.

---

**Total Estimated Time:** 8-12 hours
**Agents Used:** developer (8 prompts), peer-reviewer (4 prompts)
