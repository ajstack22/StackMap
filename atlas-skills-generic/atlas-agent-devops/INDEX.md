# DevOps Agent - File Index

Quick reference to all files in this skill.

## Core Files

### SKILL.md (867 lines)
**Purpose:** Complete DevOps agent specification
**Contents:**
- Core responsibilities and principles
- Generic deployment architecture
- Quality gates and validation
- Infrastructure management
- Monitoring and observability
- Security and compliance
- Troubleshooting guide
- Customization instructions

**Use when:** Understanding the DevOps agent's role and capabilities

---

### README.md (468 lines)
**Purpose:** Complete usage guide with examples
**Contents:**
- Overview and quick start
- Feature descriptions
- Customization options
- Project type examples (web, mobile, API, etc.)
- Deployment strategy examples
- Integration examples (AWS, Docker, Kubernetes, etc.)
- Best practices
- Troubleshooting

**Use when:** Implementing the DevOps skill in your project

---

### QUICK_START.md (257 lines)
**Purpose:** 5-minute setup guide
**Contents:**
- Minimal setup steps (5 steps in 5 minutes)
- Common customizations
- Project-specific examples
- Next steps

**Use when:** Getting started quickly without reading full docs

---

## Script Files

### scripts/deploy-all.sh (307 lines, executable)
**Purpose:** Generic deployment wrapper script
**Contents:**
- Quality gate validation
- Environment validation
- Git state checking
- Deployment execution
- Color-coded output
- Error handling

**Usage:**
```bash
./scripts/deploy-all.sh [environment] [options]
```

**Use when:** Running deployments after configuration

---

## Example Files

### examples/deployment.md (184 lines)
**Purpose:** Example deployment strategy documentation
**Contents:**
- Environment definitions
- Quality gates
- Version strategy
- Rollback procedures
- Deployment commands
- Monitoring setup
- Security considerations

**Use when:** Creating your project's deployment documentation

---

### examples/deployment-config.sh (140 lines, executable)
**Purpose:** Example deployment configuration
**Contents:**
- Environment URLs
- Build/test commands
- Deployment functions
- Pre/post deployment hooks
- Example deployment logic for various targets

**Use when:** Creating your project's deployment configuration

---

### examples/deployment-checklist.md (154 lines)
**Purpose:** Example deployment checklist
**Contents:**
- Pre-deployment checks
- Deployment execution checks
- Post-deployment checks
- Environment-specific checks
- Platform-specific checks
- Security checks
- Monitoring checks

**Use when:** Creating your project's deployment checklist

---

## Meta Files

### CONVERSION_SUMMARY.md (283 lines)
**Purpose:** Summary of conversion from StackMap-specific to generic
**Contents:**
- What was removed (StackMap-specific details)
- What was kept (core principles)
- What was added (customization)
- File structure comparison
- Usage comparison
- Migration path

**Use when:** Understanding the generic version or migrating from StackMap

---

### INDEX.md (this file)
**Purpose:** Quick reference to all files
**Contents:**
- File descriptions
- Line counts
- Use cases

**Use when:** Finding the right file for your needs

---

## File Tree

```
atlas-skills-generic/atlas-agent-devops/
├── SKILL.md                      (867 lines) - Agent specification
├── README.md                     (468 lines) - Usage guide
├── QUICK_START.md                (257 lines) - 5-minute setup
├── CONVERSION_SUMMARY.md         (283 lines) - Conversion notes
├── INDEX.md                      (this file) - File reference
├── scripts/
│   └── deploy-all.sh             (307 lines) - Deployment script
└── examples/
    ├── deployment.md             (184 lines) - Example strategy doc
    ├── deployment-config.sh      (140 lines) - Example configuration
    └── deployment-checklist.md   (154 lines) - Example checklist
```

**Total:** 2,660 lines across 8 files

---

## Quick Navigation

### I want to...

**...understand the DevOps agent**
→ Read SKILL.md

**...set up deployment for my project**
→ Follow QUICK_START.md (5 minutes)

**...see detailed examples**
→ Read README.md

**...understand the conversion from StackMap**
→ Read CONVERSION_SUMMARY.md

**...create deployment documentation**
→ Copy examples/deployment.md and customize

**...configure deployment logic**
→ Copy examples/deployment-config.sh and customize

**...create a deployment checklist**
→ Copy examples/deployment-checklist.md and customize

**...run deployments**
→ Use scripts/deploy-all.sh after configuration

---

## Usage Flow

1. **First time setup:**
   - Read QUICK_START.md (5 minutes)
   - Copy scripts/deploy-all.sh to `.atlas/scripts/deploy.sh`
   - Copy examples/deployment-config.sh to `.atlas/`
   - Customize configuration for your project
   - Test with development deployment

2. **Daily usage:**
   - Update code
   - Run `.atlas/scripts/deploy.sh dev` to test
   - Run `.atlas/scripts/deploy.sh staging` for validation
   - Run `.atlas/scripts/deploy.sh prod` for release

3. **Troubleshooting:**
   - Check README.md troubleshooting section
   - Check SKILL.md for detailed guidance
   - Review examples/ for configuration issues

4. **Customization:**
   - Edit `.atlas/deployment-config.sh` for deployment logic
   - Edit `.atlas/deployment.md` for documentation
   - Add hooks in deployment-config.sh for custom behavior

---

## Configuration Files You Create

After setup, your project will have:

```
your-project/
├── .atlas/
│   ├── deployment.md              - Your deployment strategy
│   ├── deployment-config.sh       - Your deployment configuration
│   ├── deployment-checklist.md    - Your deployment checklist
│   └── scripts/
│       └── deploy.sh              - Copy of deploy-all.sh
├── CHANGELOG.md                   - Optional, configurable
└── (your source code)
```

---

## Support

For questions or issues:
1. Check QUICK_START.md for common scenarios
2. Check README.md for detailed examples
3. Check SKILL.md for comprehensive documentation
4. Review examples/ directory for templates

---

## Version

**Generic DevOps Agent v1.0**
- Converted from StackMap-specific version
- Production-ready
- Fully customizable
- Extensively documented

Last updated: 2025-01-18
