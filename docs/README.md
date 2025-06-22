# StackMap Documentation

Welcome to the comprehensive documentation for StackMap, a visual routine management application designed for families with special needs children.

## 📚 Documentation Index

### Core Documentation
- **[Comprehensive Application Documentation](./STACKMAP_COMPREHENSIVE_DOCUMENTATION.md)** - Complete guide covering all aspects of StackMap
- **[Architecture Overview](../context/architecture.md)** - System design and technical architecture
- **[README](../README.md)** - Quick start guide and project overview

### Technical Guides
- **[Component Interaction Diagrams](./COMPONENT_INTERACTION_DIAGRAMS.md)** - Visual representations of component communication
- **[Error Handling Patterns](./ERROR_HANDLING_PATTERNS.md)** - Comprehensive error handling strategies
- **[Migration Guide](./MIGRATION_GUIDE.md)** - Version migration and data upgrade procedures
- **[Accessibility Implementation](./ACCESSIBILITY_IMPLEMENTATION.md)** - Detailed accessibility features and guidelines

### Development Resources
- **[CLAUDE.md](./CLAUDE.md)** - AI assistant context and development guidelines
- **[Testing Framework](./TESTING_FRAMEWORK.md)** - Testing strategies and implementation
- **[Component Inventory](../context/component-inventory.md)** - Complete list of UI components
- **[CSS Module Map](../context/css-module-map.md)** - Style organization guide

### Deployment & Operations
- **[Deployment Verification Checklist](./DEPLOYMENT_VERIFICATION_CHECKLIST.md)** - Pre-deployment validation
- **[CI/CD Setup](./CI_CD_SETUP.md)** - Continuous integration configuration
- **[Version Sync Protocol](./VERSION_SYNC_PROTOCOL.md)** - Version management procedures
- **[Mobile App Workflow](./MOBILE_APP_WORKFLOW.md)** - Mobile development guide

### API & Integration
- **[Operation Log System](./operation-log-system.md)** - Sync and state tracking
- **[Google Drive Sync](../drive-sync.js)** - Cloud synchronization implementation
- **[PWA Configuration](./internal/PWA_CONFIGURATION.md)** - Progressive Web App setup

### User Guides
- **[Import/Export Guide](./IMPORT_EXPORT_QA_GUIDE.md)** - Data management for users
- **[UAT Testing Guide](./UAT_TESTING_GUIDE.md)** - User acceptance testing procedures
- **[Mobile Testing Checklist](../mobile-testing-checklist.md)** - Mobile-specific testing

## 🚀 Getting Started

### For New Developers

1. **Start with the basics**:
   - Read the [README](../README.md) for project overview
   - Review [Architecture Overview](../context/architecture.md)
   - Understand [Development Constraints](../context/constraints.md)

2. **Dive into technical details**:
   - Study the [Comprehensive Documentation](./STACKMAP_COMPREHENSIVE_DOCUMENTATION.md)
   - Explore [Component Interaction Diagrams](./COMPONENT_INTERACTION_DIAGRAMS.md)
   - Review [Error Handling Patterns](./ERROR_HANDLING_PATTERNS.md)

3. **Set up development environment**:
   - Follow [Development Guidelines](./STACKMAP_COMPREHENSIVE_DOCUMENTATION.md#11-development-guidelines)
   - Configure testing with [Testing Framework](./TESTING_FRAMEWORK.md)
   - Set up CI/CD using [CI/CD Setup](./CI_CD_SETUP.md)

### For Contributing

1. **Understand the codebase**:
   - Review [Component Inventory](../context/component-inventory.md)
   - Check [CSS Module Map](../context/css-module-map.md)
   - Read [CLAUDE.md](./CLAUDE.md) for AI-assisted development

2. **Follow best practices**:
   - Adhere to [Accessibility Guidelines](./ACCESSIBILITY_IMPLEMENTATION.md)
   - Implement proper [Error Handling](./ERROR_HANDLING_PATTERNS.md)
   - Write tests following [Testing Framework](./TESTING_FRAMEWORK.md)

3. **Deploy safely**:
   - Use [Deployment Checklist](./DEPLOYMENT_VERIFICATION_CHECKLIST.md)
   - Follow [Version Sync Protocol](./VERSION_SYNC_PROTOCOL.md)
   - Test with [UAT Guide](./UAT_TESTING_GUIDE.md)

## 📋 Quick Reference

### Key Technologies
- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: Modular CSS with CSS Variables
- **Storage**: LocalStorage + Google Drive
- **Mobile**: Capacitor for iOS/Android
- **PWA**: Service Worker for offline support

### Important Files
- **Main App**: `/app/StackMapApp.js`
- **State Management**: `/state.js`
- **UI Rendering**: `/renderer.js`
- **Configuration**: `/config/constants.js`
- **Service Worker**: `/sw.js`

### Key Features
- Visual activity cards with emojis
- Multi-user support (up to 6 users)
- Day-specific schedules
- Offline-first design
- Google Drive sync
- Accessibility-focused
- Mobile apps (iOS/Android)

## 🎯 Design Philosophy

1. **Special Needs First**: Every feature designed for accessibility
2. **Offline Resilient**: Works without internet connection
3. **Simple & Reliable**: No frameworks, minimal dependencies
4. **Family-Friendly**: Easy for parents to understand and use

## 📞 Support

- **Bug Reports**: [GitHub Issues](https://github.com/stackmap/stackmap/issues)
- **Documentation Issues**: Update relevant `.md` files
- **Questions**: contact@stackmap.app

## 🔄 Documentation Maintenance

This documentation is actively maintained. When making changes:

1. Update relevant documentation files
2. Keep examples current with code
3. Test all code snippets
4. Update the modification date
5. Ensure cross-references are valid

Last Updated: June 21, 2025

---

*StackMap - Helping families build consistent routines through visual learning*