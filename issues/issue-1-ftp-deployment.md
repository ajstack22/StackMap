# Issue: Replace SSH deployments with FTP-Deploy-Action for reliability

## Problem
Our current SSH-based deployments are failing due to:
- NameCheap's non-standard SSH port (21098)
- Connection timeouts
- Authentication issues with VS Code forwarding
- Git command failures on the server

Research shows FTP deployments are significantly more reliable on NameCheap Stellar hosting.

## Solution
Switch to FTP-Deploy-Action which is proven to work reliably with NameCheap infrastructure.

## Implementation Details

### 1. Add GitHub Secrets
```
FTP_SERVER: stackmap.app (or IP address)
FTP_USERNAME: stachblx
FTP_PASSWORD: [secure password]
```

### 2. Update deploy-fast.yml
```yaml
- name: Deploy to Production via FTP
  uses: SamKirkland/FTP-Deploy-Action@v4.3.5
  with:
    server: ${{ secrets.FTP_SERVER }}
    username: ${{ secrets.FTP_USERNAME }}
    password: ${{ secrets.FTP_PASSWORD }}
    local-dir: ./
    server-dir: public_html/
    exclude: |
      **/.git*
      **/.git*/**
      **/node_modules/**
      **/.well-known/**
      **/cgi-bin/**
      **/tests/**
      **/docs/**
      **/scripts/**
      **/*.log
```

### 3. Benefits
- No SSH key management
- Works reliably with NameCheap
- Better error messages
- Automatic retry on failure
- Preserves critical directories

## Testing Plan
1. Create test workflow with dry-run option
2. Deploy to staging first
3. Verify file permissions are preserved
4. Test with small change
5. Monitor deployment time

## Success Criteria
- [ ] Deployment completes in <3 minutes
- [ ] No connection timeouts
- [ ] Clear progress indicators
- [ ] .well-known directory preserved
- [ ] No authentication failures

## References
- Research: [CICD_research.md lines 105-212]
- FTP-Deploy-Action: https://github.com/SamKirkland/FTP-Deploy-Action
- Current SSH failures: Multiple timeout issues in Actions logs