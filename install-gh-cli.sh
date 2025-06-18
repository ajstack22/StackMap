#!/bin/bash

# GitHub CLI Installation Script for macOS (Apple Silicon)
# Official tool by GitHub: https://cli.github.com/

echo "GitHub CLI Installation Options:"
echo "================================"
echo ""
echo "Option 1: Install via Homebrew (Recommended)"
echo "--------------------------------------------"
echo "If you don't have Homebrew, install it first:"
echo ""
echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
echo ""
echo "Then add Homebrew to your PATH:"
echo 'echo '\''eval "$(/opt/homebrew/bin/brew shellenv)"'\'' >> ~/.zprofile'
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"'
echo ""
echo "Finally, install GitHub CLI:"
echo "brew install gh"
echo ""
echo "Option 2: Direct Download (No Homebrew)"
echo "---------------------------------------"
echo "Download and install manually:"
echo ""
echo "1. Download from: https://github.com/cli/cli/releases/latest"
echo "2. Look for: gh_*_macOS_arm64.tar.gz"
echo "3. Extract and move 'gh' to /usr/local/bin/"
echo ""
echo "Option 3: MacPorts (If you use MacPorts)"
echo "-----------------------------------------"
echo "sudo port install gh"
echo ""
echo "After installation, authenticate with:"
echo "======================================="
echo "gh auth login"
echo ""
echo "Choose:"
echo "- GitHub.com"
echo "- HTTPS"
echo "- Authenticate with browser"
echo ""
echo "Verify installation with:"
echo "gh --version"