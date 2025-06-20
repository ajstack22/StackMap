#!/bin/bash
# StackMap Integration Setup
# One command to activate all productivity integrations

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🚀 StackMap Productivity Integration Setup${NC}"
echo -e "${PURPLE}========================================${NC}\n"

# Update .zshrc to source all StackMap scripts
echo -e "${BLUE}Updating .zshrc...${NC}"

# Check if StackMap integration already exists
if ! grep -q "StackMap Power Integrations" "$HOME/.zshrc"; then
    cat >> "$HOME/.zshrc" << 'EOF'

# StackMap Power Integrations
[[ -f "$HOME/StackMap/StackMap/.stackmap-power-plugins.zsh" ]] && source "$HOME/StackMap/StackMap/.stackmap-power-plugins.zsh"
[[ -f "$HOME/StackMap/StackMap/.stackmap-github.zsh" ]] && source "$HOME/StackMap/StackMap/.stackmap-github.zsh"

# Git hooks aliases
alias hookoff="mv .git/hooks .git/hooks.disabled && echo 'Git hooks disabled'"
alias hookon="mv .git/hooks.disabled .git/hooks && echo 'Git hooks enabled'"
alias hookupdate="cd ~/StackMap/StackMap && ./scripts/setup-git-hooks.sh"
EOF
    echo -e "${GREEN}✅ Updated .zshrc with integrations${NC}"
else
    echo -e "${YELLOW}Integration already in .zshrc${NC}"
fi

# Set up Git hooks
echo -e "\n${BLUE}Setting up Git hooks...${NC}"
cd ~/StackMap/StackMap
./scripts/setup-git-hooks.sh

# Create quick reference card
echo -e "\n${BLUE}Creating quick reference...${NC}"
cat > "QUICK_REFERENCE.md" << 'EOF'
# 🚀 StackMap Quick Reference

## ⚡ New Power Commands

### Oh My Zsh Plugins
- **Ctrl+T** - Fuzzy find files
- **Ctrl+R** - Fuzzy search command history  
- **Alt+C** - Fuzzy change directory
- **z stackmap** - Jump to StackMap directory
- **npmO** - Check outdated packages
- **extract file.zip** - Extract any archive
- **google "search term"** - Search from terminal

### GitHub CLI
- **smpr create** - Create pull request
- **smpr list** - List open PRs
- **smissue create** - Create issue
- **ghstatus** - Quick PR & issue status
- **smshippr** - Full PR deployment flow

### Git Hooks
- **Automatic on commit**: Lint check, debug code warning, file size check
- **Automatic on push**: Test run, main branch protection
- **Skip once**: `git commit --no-verify`
- **Disable all**: `hookoff`
- **Re-enable**: `hookon`

### VS Code Tasks (Cmd+Shift+P → "Tasks: Run Task")
- 🏗️ Build All
- 🚀 Quick Deploy
- 🧪 Run Tests
- 🌐 Start Dev Server
- 📝 Create PR
- 🔍 Search Code

### VS Code Snippets
- **smlog** - Console log
- **smfunc** - Function with JSDoc
- **smapi** - API call template
- **smchrome** - Chrome API call
- **smtest** - Test template

## 🎯 Workflow Examples

### Morning Start
```bash
sm && smpull && smfresh
```

### Feature Development
```bash
smfeature "new-feature" && smdebug on
```

### Quick Deploy
```bash
smship  # Tests + Lint + Security + Deploy
```

### PR Workflow
```bash
smpr create && smpr checks && smpr merge
```

## 💡 Pro Tips
1. Your VS Code window is now green-themed for StackMap!
2. Git commits now require format: `feat(scope): message`
3. Use `smmenu` for interactive command menu
4. Type `smhelp` for command help

Happy coding! 🚀
EOF

echo -e "${GREEN}✅ Created QUICK_REFERENCE.md${NC}"

# Summary
echo -e "\n${GREEN}🎉 All Integrations Activated!${NC}"
echo -e "${PURPLE}=============================${NC}"
echo -e "\n${YELLOW}What's New:${NC}"
echo -e "  ${GREEN}✅${NC} 12 Oh My Zsh plugins enabled"
echo -e "  ${GREEN}✅${NC} GitHub CLI integrated (logged in as ajstack22)"
echo -e "  ${GREEN}✅${NC} Git hooks protecting code quality"
echo -e "  ${GREEN}✅${NC} VS Code tasks for one-click actions"
echo -e "  ${GREEN}✅${NC} Custom workspace theme (green = StackMap!)"
echo -e "  ${GREEN}✅${NC} Code snippets for faster development"
echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "  1. Run: ${GREEN}source ~/.zshrc${NC}"
echo -e "  2. Try: ${GREEN}Ctrl+R${NC} for command history search"
echo -e "  3. Try: ${GREEN}z stack${NC} to jump to StackMap"
echo -e "  4. In VS Code: ${GREEN}Cmd+Shift+P${NC} → 'Tasks: Run Task'"
echo -e "\n${PURPLE}Your productivity just went 🚀${NC}"