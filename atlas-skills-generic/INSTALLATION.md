# Atlas Skills Installation Guide

Complete guide for installing and using Atlas Skills in your project.

## Table of Contents

- [Quick Install (5 minutes)](#quick-install-5-minutes)
- [Installation Options](#installation-options)
- [Project Customization](#project-customization)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## Quick Install (5 minutes)

### Step 1: Install Skills

Choose one of these methods:

#### Option A: Copy to Claude Skills Directory (Recommended)

```bash
# Copy all skills to Claude environment
cp -r atlas-skills-generic ~/.claude/skills/atlas
```

#### Option B: Symlink for Easy Updates

```bash
# Create symlink (easier to update)
ln -s /path/to/atlas-skills-generic ~/.claude/skills/atlas
```

### Step 2: Start Using Atlas

That's it! You can now use Atlas in any project:

```
"Fix the login bug. Use Atlas workflow."
```

Atlas will automatically:
- Choose the right workflow tier
- Apply generic best practices
- Guide you through each phase

## Installation Options

### For Individual Developer

Best for: Personal projects, learning, experimentation

```bash
# Install to your local Claude environment
cp -r atlas-skills-generic ~/.claude/skills/atlas
```

**Pros:**
- Quick setup
- No project configuration needed
- Works across all your projects

**Cons:**
- Not shared with team
- No project-specific customization

### For Team/Project

Best for: Team projects, production applications

```bash
# 1. Install skills globally
cp -r atlas-skills-generic ~/.claude/skills/atlas

# 2. Add project customization
cd /path/to/your/project
mkdir .atlas
cp ~/.claude/skills/atlas/templates/conventions.md .atlas/
cp ~/.claude/skills/atlas/templates/validation.sh .atlas/
chmod +x .atlas/validation.sh

# 3. Customize for your project
# Edit .atlas/conventions.md with your rules
# Edit .atlas/validation.sh with your checks

# 4. Commit to version control
git add .atlas/
git commit -m "Add Atlas project configuration"
```

**Pros:**
- Shared conventions across team
- Project-specific customization
- Version controlled
- Consistent quality standards

**Cons:**
- Requires initial setup time
- Need to maintain configuration

## Project Customization

### No Customization (Default)

Atlas works immediately with generic best practices:

```
"Add user authentication. Use Atlas workflow."
```

**Best for:**
- Quick prototypes
- Generic projects
- Learning Atlas
- Projects without specific conventions

### Minimal Customization (15 minutes)

Create `.atlas/conventions.md` with your key rules:

```bash
mkdir .atlas
cat > .atlas/conventions.md << 'EOF'
# Project Conventions

## State Management
- Use Redux Toolkit
- Update via dispatch(updateAction(data))
- Never mutate state directly

## Naming
- Components: PascalCase
- Functions: camelCase
- Files: kebab-case

## Testing
- Framework: Jest
- Coverage: 80% minimum
EOF
```

**Best for:**
- Small teams
- Established projects
- Clear conventions

### Full Customization (1-2 hours)

Use example configurations as starting points:

```bash
# For React Native project
cp -r ~/.claude/skills/atlas/templates/examples/react-native-config/* .atlas/

# For Django project
cp -r ~/.claude/skills/atlas/templates/examples/django-config/* .atlas/

# For Next.js project
cp -r ~/.claude/skills/atlas/templates/examples/nextjs-config/* .atlas/

# Customize to your specific needs
chmod +x .atlas/validation.sh
```

**Best for:**
- Large teams
- Production applications
- Complex projects
- Established tech stacks

## Verification

### 1. Verify Installation

Check skills are installed:

```bash
ls -la ~/.claude/skills/atlas
```

You should see:
```
atlas-meta/
atlas-quick/
atlas-iterative/
atlas-standard/
atlas-full/
atlas-agent-developer/
atlas-agent-devops/
atlas-agent-peer-reviewer/
atlas-agent-product-manager/
atlas-agent-security/
templates/
```

### 2. Test Atlas

Try a simple task:

```
"Fix typo in README: change 'teh' to 'the'. Use Atlas Quick workflow."
```

Claude should:
1. Acknowledge using Atlas Quick workflow
2. Make the change
3. Follow the Quick tier process (2 phases)

### 3. Verify Project Configuration (If Customized)

Test Atlas reads your conventions:

```
"Create a new component following our naming conventions. Use Atlas workflow."
```

Claude should mention your conventions:
```
"Based on your .atlas/conventions.md, I'll use PascalCase for the component name..."
```

### 4. Test Validation Script (If Customized)

Run validation manually:

```bash
cd /path/to/your/project
./.atlas/validation.sh
```

Should output pass/fail for each check.

## Directory Structure

After full installation with project customization:

```
~/.claude/
  skills/
    atlas/                          # Atlas skills (installed globally)
      atlas-meta/
      atlas-quick/
      atlas-iterative/
      atlas-standard/
      atlas-full/
      atlas-agent-*/
      templates/
      README.md
      CUSTOMIZATION_GUIDE.md

/path/to/your/project/
  .atlas/                           # Project-specific config (optional)
    conventions.md                  # Your project conventions
    validation.sh                   # Your validation checks
    deployment.md                   # Your deployment process
    deployment-config.sh            # Your deployment config
    story-template.md               # Your story format
    security-checklist.md           # Your security requirements
```

## Troubleshooting

### Problem: "Skills not found" or Atlas not responding

**Solution:**
1. Verify installation path: `ls ~/.claude/skills/atlas`
2. Check directory name is exactly `atlas` (not `atlas-skills-generic`)
3. Try restarting Claude

### Problem: Atlas ignoring my conventions

**Solution:**
1. Verify `.atlas/conventions.md` exists: `ls .atlas/conventions.md`
2. Verify file has content: `cat .atlas/conventions.md`
3. Mention conventions explicitly: "Following my .atlas/conventions.md, add feature X"

### Problem: Validation script not running

**Solution:**
1. Make script executable: `chmod +x .atlas/validation.sh`
2. Check for syntax errors: `bash -n .atlas/validation.sh`
3. Test manually: `./.atlas/validation.sh`

### Problem: Skills working but slow

**Solution:**
1. Skills are large - initial load may be slow
2. Consider using Quick tier for simple tasks
3. Symptoms are expected for first-time use

### Problem: Want to update skills

**Solution:**

If installed via copy:
```bash
# Remove old version
rm -rf ~/.claude/skills/atlas

# Copy new version
cp -r /path/to/atlas-skills-generic ~/.claude/skills/atlas
```

If installed via symlink:
```bash
# Pull updates
cd /path/to/atlas-skills-generic
git pull

# Symlink automatically uses latest
```

## Next Steps

### For Individuals

1. Try different workflow tiers:
   - Quick: "Fix typo. Use Atlas Quick workflow."
   - Standard: "Add user validation. Use Atlas workflow."
   - Full: "Implement payment system. Use Atlas Full workflow."

2. Learn the patterns:
   - Research before coding
   - Plan before implementing
   - Review before deploying

3. Explore agents:
   - "Design the API. Use atlas-product-manager."
   - "Review this code. Use atlas-peer-reviewer."
   - "Set up deployment. Use atlas-devops."

### For Teams

1. Customize for your project:
   - Document your conventions
   - Create validation checks
   - Define deployment process

2. Integrate with workflow:
   - Add validation to CI/CD
   - Use pre-commit hooks
   - Create team guidelines

3. Train team:
   - Share this documentation
   - Do example walkthroughs
   - Establish team patterns

### For Project Leads

1. Establish conventions:
   - Review existing patterns
   - Document best practices
   - Get team consensus

2. Set up automation:
   - CI/CD integration
   - Quality gates
   - Deployment automation

3. Monitor and improve:
   - Track quality metrics
   - Update conventions
   - Refine validation checks

## Additional Resources

- **README.md** - Overview and features
- **CUSTOMIZATION_GUIDE.md** - Detailed customization instructions
- **templates/README.md** - Template documentation
- **templates/examples/** - Example configurations
- Each skill's README.md - Skill-specific documentation

## Support

### Documentation
- Main README: Overview and quick start
- Customization Guide: Detailed customization
- Template README: Template usage
- Example READMEs: Tech-specific examples

### Community
- GitHub Issues: Bug reports and feature requests
- Discussions: Questions and sharing
- Wiki: Additional documentation

### Getting Help

1. Check documentation (especially CUSTOMIZATION_GUIDE.md)
2. Review examples for your tech stack
3. Test with simple tasks first
4. Report issues with details (what you tried, what happened, what you expected)

## License

MIT License - Use freely, customize for your needs, share with your team.

---

**Ready to start?**

```
"Help me understand Atlas workflows. Use Atlas workflow."
```
