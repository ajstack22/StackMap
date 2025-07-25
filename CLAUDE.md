## Research Notes

- Exploring sensory preference patterns for users with ADHD and autism in digital interfaces
  - Key research questions:
    * Implement user-controlled sensory settings or automatic adaptive interfaces?
    * Prioritize sensory elements: visual (colors/contrast/animations), auditory (sounds/alerts), or tactile (haptics/vibration)
    * Mobile-first architecture considerations for sensory design

## CRITICAL DEPLOYMENT FACTS (MUST READ)
- Git repository clones DIRECTLY to /public_html/qual/ (not a separate repo directory)
- .cpanel.yml DOES NOT EXECUTE on Namecheap - ignore it completely
- Build files go to web/build/ - the deployment process handles getting them to the right place
- NEVER copy build files to repository root (no `cp -r web/build/* .`)
- Use simple-deploy.sh for qual->prod only
- When building web: must use relative paths (NODE_ENV=production npm run build:web)

### Pre-flight Deployment Checklist
When user mentions deployment:
1. CHECK: Where is git repo cloned? (it's directly in qual/)
2. BUILD: Run NODE_ENV=production npm run build:web (outputs to web/build/)
3. DEPLOY: Push to git - server will use files from web/build/
4. IGNORE: .cpanel.yml automation (doesn't work on Namecheap)
5. NEVER: Copy build output to repository root - keep it clean!

## Recent Changes (December 28, 2024)
- Fixed drag and drop by:
  - Removing automatic sorting that put pinned items first (respects manual order now)
  - Fixed getActivityIdFromCard to use data-activity-id attribute
  - Added null checks to prevent errors
- Added direct delete button to activity cards in edit mode:
  - Red delete icon positioned center-bottom
  - Fixed hover issue by combining transforms properly
  - No confirmation dialog for faster workflow
- Implemented toast notification system:
  - 3-second auto-dismiss timer
  - Undo functionality for deleted activities
  - Toast appears at bottom center of screen