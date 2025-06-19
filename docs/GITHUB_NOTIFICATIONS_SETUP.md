# GitHub Notifications Setup for CI/CD

## Automatic Notifications

GitHub automatically sends notifications when:
1. A deployment is waiting for approval
2. A workflow fails
3. Someone approves/rejects your deployment

## Enable Notifications

### 1. GitHub Settings
1. Go to: https://github.com/settings/notifications
2. Under "Actions", enable:
   - ✅ Failed workflows only
   - ✅ Workflow runs on your repositories

### 2. Repository Watching
1. Go to: https://github.com/ajstack22/StackMap
2. Click "Watch" → "Custom"
3. Enable:
   - ✅ Releases
   - ✅ Discussions (if used)
   - ✅ Security alerts

### 3. Mobile Notifications
1. Install GitHub mobile app
2. Sign in with your account
3. Enable push notifications
4. You'll get alerts when approval is needed

### 4. Email Notifications
By default, you'll receive emails for:
- Deployment approval requests
- Failed workflows
- Security alerts

## Custom Notifications

### Slack Integration (Optional)
If you use Slack:
1. Add GitHub app to Slack
2. In your repository, go to Settings → Integrations → Slack
3. Subscribe to workflow events

### Desktop Notifications
1. Use GitHub Desktop app
2. Or browser notifications:
   - Chrome: Allow notifications from github.com
   - Safari: Allow in Preferences → Websites → Notifications

## Notification Types You'll Receive

### 1. "Review requested on deployment"
- **When**: Staging is ready for verification
- **Action**: Click link to review and approve

### 2. "Workflow run failed"
- **When**: Tests fail or deployment errors
- **Action**: Check logs and fix issues

### 3. "Deployment approved/rejected"
- **When**: Someone reviews your deployment
- **Action**: Monitor production deployment

## Testing Notifications

After setup, your next push will trigger:
1. Staging deployment
2. Notification that approval is needed
3. You can verify and approve
4. Production deployment proceeds

## Troubleshooting

### Not receiving notifications?
1. Check spam folder for emails
2. Verify GitHub notification settings
3. Check repository watch settings
4. Ensure you're not already "approved" as repo owner

### Too many notifications?
1. Adjust to "Failed workflows only"
2. Unwatch specific activities
3. Set up email filters