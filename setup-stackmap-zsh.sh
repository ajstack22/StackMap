#!/bin/bash
# StackMap Oh My Zsh Setup Script
# One command to activate all productivity features

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}🚀 StackMap Oh My Zsh Productivity Setup${NC}"
echo -e "${PURPLE}=======================================${NC}\n"

# Check if Oh My Zsh is installed
if [[ ! -d "$HOME/.oh-my-zsh" ]]; then
    echo -e "${RED}❌ Oh My Zsh is not installed!${NC}"
    echo -e "${YELLOW}Install it with:${NC}"
    echo "sh -c \"\$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)\""
    exit 1
fi

# Check if running in StackMap directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
EXPECTED_DIR="$HOME/StackMap/StackMap"

if [[ "$SCRIPT_DIR" != "$EXPECTED_DIR" ]]; then
    echo -e "${YELLOW}⚠️  This script should be run from $EXPECTED_DIR${NC}"
    echo -e "${YELLOW}Current directory: $SCRIPT_DIR${NC}"
fi

# Make all shell scripts executable
echo -e "${BLUE}Setting permissions...${NC}"
chmod +x "$SCRIPT_DIR/.stackmap-aliases.zsh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/.stackmap-completions.zsh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/.stackmap-deploy.zsh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/.stackmap-navigate.zsh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/.stackmap-debug.zsh" 2>/dev/null || true

# Backup existing .zshrc
if [[ -f "$HOME/.zshrc" ]]; then
    echo -e "${BLUE}Backing up existing .zshrc...${NC}"
    cp "$HOME/.zshrc" "$HOME/.zshrc.backup-$(date +%Y%m%d-%H%M%S)"
fi

# Check if StackMap aliases are already added
if grep -q "StackMap Oh My Zsh Integration" "$HOME/.zshrc" 2>/dev/null; then
    echo -e "${YELLOW}StackMap integration already exists in .zshrc${NC}"
    echo -n "Update existing integration? (y/N): "
    read update_existing
    if [[ "$update_existing" != "y" ]]; then
        echo -e "${YELLOW}Skipping .zshrc update${NC}"
        exit 0
    fi
    # Remove existing integration
    sed -i '' '/# StackMap Oh My Zsh Integration/,/# End StackMap Integration/d' "$HOME/.zshrc"
fi

# Add StackMap integration to .zshrc
echo -e "${BLUE}Adding StackMap integration to .zshrc...${NC}"
cat >> "$HOME/.zshrc" << 'EOF'

# StackMap Oh My Zsh Integration
# Added by setup-stackmap-zsh.sh
export STACKMAP_HOME="$HOME/StackMap/StackMap"

# Load StackMap productivity modules
[[ -f "$STACKMAP_HOME/.stackmap-aliases.zsh" ]] && source "$STACKMAP_HOME/.stackmap-aliases.zsh"
[[ -f "$STACKMAP_HOME/.stackmap-completions.zsh" ]] && source "$STACKMAP_HOME/.stackmap-completions.zsh"
[[ -f "$STACKMAP_HOME/.stackmap-deploy.zsh" ]] && source "$STACKMAP_HOME/.stackmap-deploy.zsh"
[[ -f "$STACKMAP_HOME/.stackmap-navigate.zsh" ]] && source "$STACKMAP_HOME/.stackmap-navigate.zsh"
[[ -f "$STACKMAP_HOME/.stackmap-debug.zsh" ]] && source "$STACKMAP_HOME/.stackmap-debug.zsh"

# Quick StackMap help
smhelp() {
    echo "🚀 StackMap Quick Commands:"
    echo "  sm         - Jump to StackMap root"
    echo "  smmenu     - Interactive command menu"
    echo "  smjump     - Navigate directories with fuzzy search"
    echo "  smdeploy   - Smart deployment system"
    echo "  smdebug    - Toggle debug mode"
    echo "  smstats    - Show project statistics"
    echo "  smhelp     - Show this help"
    echo ""
    echo "Type 'alias | grep sm' to see all commands"
}
# End StackMap Integration
EOF

# Install recommended tools if not present
echo -e "\n${BLUE}Checking for recommended tools...${NC}"

# Check for fzf
if ! command -v fzf &> /dev/null; then
    echo -e "${YELLOW}fzf not found (required for smart navigation)${NC}"
    echo -n "Install fzf? (y/N): "
    read install_fzf
    if [[ "$install_fzf" == "y" ]]; then
        if [[ "$OSTYPE" == "darwin"* ]] && command -v brew &> /dev/null; then
            brew install fzf
            $(brew --prefix)/opt/fzf/install --all
        else
            git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
            ~/.fzf/install --all
        fi
    fi
else
    echo -e "${GREEN}✅ fzf is installed${NC}"
fi

# Check for ripgrep
if ! command -v rg &> /dev/null; then
    echo -e "${YELLOW}ripgrep not found (required for fast searching)${NC}"
    echo -n "Install ripgrep? (y/N): "
    read install_rg
    if [[ "$install_rg" == "y" ]]; then
        if [[ "$OSTYPE" == "darwin"* ]] && command -v brew &> /dev/null; then
            brew install ripgrep
        else
            echo -e "${YELLOW}Please install ripgrep manually: https://github.com/BurntSushi/ripgrep${NC}"
        fi
    fi
else
    echo -e "${GREEN}✅ ripgrep is installed${NC}"
fi

# Check for bat (better cat)
if ! command -v bat &> /dev/null; then
    echo -e "${YELLOW}bat not found (enhances file preview)${NC}"
    echo -n "Install bat? (y/N): "
    read install_bat
    if [[ "$install_bat" == "y" ]]; then
        if [[ "$OSTYPE" == "darwin"* ]] && command -v brew &> /dev/null; then
            brew install bat
        else
            echo -e "${YELLOW}Please install bat manually: https://github.com/sharkdp/bat${NC}"
        fi
    fi
else
    echo -e "${GREEN}✅ bat is installed${NC}"
fi

# Enable additional Oh My Zsh plugins
echo -e "\n${BLUE}Updating Oh My Zsh plugins...${NC}"
current_plugins=$(grep "^plugins=" "$HOME/.zshrc" | sed 's/plugins=(//' | sed 's/)//')

recommended_plugins="git z extract history web-search"
new_plugins=""

for plugin in $recommended_plugins; do
    if [[ ! "$current_plugins" =~ "$plugin" ]]; then
        new_plugins="$new_plugins $plugin"
    fi
done

if [[ -n "$new_plugins" ]]; then
    echo -e "${YELLOW}Recommended plugins to add:$new_plugins${NC}"
    echo -n "Add these plugins? (y/N): "
    read add_plugins
    if [[ "$add_plugins" == "y" ]]; then
        # Update plugins line
        sed -i '' "s/^plugins=.*/plugins=($current_plugins$new_plugins)/" "$HOME/.zshrc"
        echo -e "${GREEN}✅ Plugins updated${NC}"
    fi
else
    echo -e "${GREEN}✅ All recommended plugins already enabled${NC}"
fi

# Create example custom configuration
echo -e "\n${BLUE}Creating example custom configuration...${NC}"
cat > "$SCRIPT_DIR/.stackmap-custom.example" << 'EOF'
#!/bin/zsh
# StackMap Custom Configuration Example
# Copy this to .stackmap-custom.zsh and add your own customizations

# Your custom aliases here
alias myalias="echo 'My custom command'"

# Your custom functions here
myfunction() {
    echo "My custom function"
}

# Project-specific environment variables
export MY_CUSTOM_VAR="value"

# Personal workflow shortcuts
alias workflow1="smtest && smlint && smdeploy"

echo "💫 Custom StackMap configuration loaded!"
EOF

echo -e "${GREEN}✅ Example custom configuration created: .stackmap-custom.example${NC}"

# Final instructions
echo -e "\n${GREEN}🎉 StackMap Oh My Zsh integration complete!${NC}"
echo -e "${PURPLE}=======================================${NC}"
echo -e "\n${YELLOW}To activate the changes:${NC}"
echo -e "  1. Run: ${GREEN}source ~/.zshrc${NC}"
echo -e "  2. Or open a new terminal\n"
echo -e "${BLUE}Quick start:${NC}"
echo -e "  - Type ${GREEN}sm${NC} to jump to StackMap directory"
echo -e "  - Type ${GREEN}smmenu${NC} for interactive command menu"
echo -e "  - Type ${GREEN}smhelp${NC} to see available commands"
echo -e "  - Type ${GREEN}alias | grep sm${NC} to see all shortcuts\n"
echo -e "${PURPLE}Happy coding with StackMap + Oh My Zsh! 🚀${NC}"