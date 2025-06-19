#!/bin/bash

# Script to check cPanel Git configuration
echo "=== Checking cPanel Git Configuration ==="
echo ""

echo "1. Production Git Repository (/home/stachblx/public_html):"
cd /home/stachblx/public_html 2>/dev/null && {
    echo "   Current branch: $(git branch --show-current 2>/dev/null || echo 'Not a git repo')"
    echo "   Remote URL: $(git remote get-url origin 2>/dev/null || echo 'No remote configured')"
    echo "   Git status:"
    git status --short 2>/dev/null || echo "   Not a git repository"
    echo ""
}

echo "2. Qual Git Repository (/home/stachblx/qual):"
cd /home/stachblx/qual 2>/dev/null && {
    echo "   Current branch: $(git branch --show-current 2>/dev/null || echo 'Not a git repo')"
    echo "   Remote URL: $(git remote get-url origin 2>/dev/null || echo 'No remote configured')"
    echo "   Git status:"
    git status --short 2>/dev/null || echo "   Not a git repository"
    echo ""
}

echo "3. Checking .cpanel.yml in production:"
if [ -f /home/stachblx/public_html/.cpanel.yml ]; then
    echo "   .cpanel.yml exists"
    grep -E "branch:|DEPLOYPATH" /home/stachblx/public_html/.cpanel.yml
else
    echo "   .cpanel.yml NOT FOUND"
fi

echo ""
echo "4. Checking .cpanel.yml in qual:"
if [ -f /home/stachblx/qual/.cpanel.yml ]; then
    echo "   .cpanel.yml exists"
    grep -E "branch:|DEPLOYPATH" /home/stachblx/qual/.cpanel.yml
else
    echo "   .cpanel.yml NOT FOUND"
fi

echo ""
echo "=== End of Git Configuration Check ==="