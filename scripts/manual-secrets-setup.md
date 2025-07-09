# Manual GitHub Secrets Setup

Since GitHub CLI is not installed, please add these secrets manually:

## Steps:

1. Go to: https://github.com/ajstack22/StackMap/settings/secrets/actions

2. Click "New repository secret" for each of these:

### Secret 1: CPANEL_HOST
- Name: `CPANEL_HOST`
- Value: `199.188.200.57`

### Secret 2: CPANEL_USER
- Name: `CPANEL_USER`
- Value: `stachblx`

### Secret 3: CPANEL_PORT
- Name: `CPANEL_PORT`
- Value: `21098`

### Secret 4: CPANEL_SSH_KEY
- Name: `CPANEL_SSH_KEY`
- Value: Copy the entire contents of your private key:

```
-----BEGIN OPENSSH PRIVATE KEY-----
[Your private key content - copy from ~/.ssh/id_rsa_cpanel]
-----END OPENSSH PRIVATE KEY-----
```

To get your private key content, run:
```bash
cat ~/.ssh/id_rsa_cpanel
```

## Important Notes:

- Copy the ENTIRE private key including the BEGIN and END lines
- Make sure there are no extra spaces or line breaks
- The key should be pasted exactly as it appears in the file

## Alternative: Install GitHub CLI

If you want to automate this process, install GitHub CLI:

### On macOS:
```bash
# Install Homebrew first if needed:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install GitHub CLI:
brew install gh

# Authenticate:
gh auth login

# Run the setup script:
./scripts/setup-ci-cd.sh
```

### Using curl (alternative):
```bash
# Download and install GitHub CLI
curl -L https://github.com/cli/cli/releases/download/v2.40.1/gh_2.40.1_macOS_amd64.tar.gz -o gh.tar.gz
tar -xzf gh.tar.gz
sudo mv gh_2.40.1_macOS_amd64/bin/gh /usr/local/bin/
rm -rf gh.tar.gz gh_2.40.1_macOS_amd64

# Authenticate:
gh auth login
```