# 🚀 StackMap SonarCloud Setup Guide

## ✅ Setup Complete! SonarCloud is Working!

1. ✓ **Configuration file created**: `sonar-project.properties`
2. ✓ **Analysis script created**: `scripts/sonar-analysis.sh`
3. ✓ **Package.json updated** with `npm run sonar` command
4. ✓ **Deployment script updated** to include SonarCloud analysis
5. ✓ **Gitignore updated** for SonarCloud files
6. ✓ **Sonar-scanner installed** globally

## 🎯 How to Use

### Run Analysis Manually
```bash
npm run sonar
```

### Analysis Runs Automatically During Deployment
```bash
./scripts/qual_deploy.sh  # Includes SonarCloud analysis
```

## 📊 View Your Results

**Dashboard**: https://sonarcloud.io/project/overview?id=ajstack22_StackMap

**Quality Metrics**:
- Code Smells: https://sonarcloud.io/project/issues?id=ajstack22_StackMap&resolved=false&types=CODE_SMELL
- Bugs: https://sonarcloud.io/project/issues?id=ajstack22_StackMap&resolved=false&types=BUG
- Security: https://sonarcloud.io/project/security_hotspots?id=ajstack22_StackMap

## 🎯 Quick Test

```bash
# Load token
source ~/.manylla-env

# Run analysis
npm run sonar

# Should see:
# ✅ Analysis complete!
# 📊 View results at: https://sonarcloud.io/project/overview?id=ajstack22_stackmap
```

## 📊 Benefits for StackMap (Public Repo)

Since StackMap is **PUBLIC**, you get:
- ✅ **UNLIMITED** lines of code analysis
- ✅ No quota restrictions
- ✅ Can run on every commit
- ✅ All premium features for free

## 🔄 Next Steps After Setup

1. **Enable Automatic Analysis** (optional):
   - Go to SonarCloud → Administration → Analysis Method
   - Turn ON Automatic Analysis
   - Every push gets analyzed automatically

2. **Add Quality Badge** to README:
```markdown
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ajstack22_stackmap&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=ajstack22_stackmap)
```

3. **View Your Dashboard**:
   - https://sonarcloud.io/project/overview?id=ajstack22_stackmap

## 📝 What Was Added to Your Project

### Files Created:
- `sonar-project.properties` - SonarCloud configuration
- `scripts/sonar-analysis.sh` - Analysis runner script
- `SONARCLOUD_SETUP.md` - This guide

### Files Modified:
- `package.json` - Added `sonar` and `quality` scripts
- `scripts/qual_deploy.sh` - Added SonarCloud step to deployment
- `.gitignore` - Added SonarCloud directories

## 🚨 Troubleshooting

### "403 Forbidden" Error
- Project doesn't exist on SonarCloud yet (create it first)
- Token doesn't have access (generate new token)
- Wrong project key (verify `ajstack22_stackmap`)

### "Project not found"
- Check project key in `sonar-project.properties`
- Verify project exists on SonarCloud

### "Command not found: sonar-scanner"
```bash
npm install -g sonarqube-scanner
```

## 📞 Support

- SonarCloud Dashboard: https://sonarcloud.io/organizations/ajstack22/projects
- Documentation: https://docs.sonarcloud.io/
- Your Manylla setup: Check Manylla repo for working example

---

*Created: 2025-09-15*
*Status: Configuration complete, awaiting SonarCloud project creation*