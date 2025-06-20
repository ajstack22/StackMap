# GitHub Actions Setup

## Required Secret: SSH_PRIVATE_KEY

To enable automated deployments, you need to add the SSH private key to GitHub secrets:

1. Go to: https://github.com/ajstack22/StackMap/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SSH_PRIVATE_KEY`
4. Value: Contents of `~/.ssh/id_rsa_cpanel` (the entire file including BEGIN/END lines)
5. Click "Add secret"

## Workflows

### deploy-staging.yml
- **Trigger**: Every push to main branch
- **Action**: Deploys to qual/staging automatically
- **URL**: https://stackmap.app/qual/

### deploy-production.yml  
- **Trigger**: Manual only (workflow_dispatch)
- **Action**: Deploys to production with confirmation
- **URL**: https://stackmap.app/

### deploy.yaml (OLD - to be removed)
- Legacy cPanel deployment
- Should be deleted once new workflows are confirmed working