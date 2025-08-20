# StackMap Sync Documentation Index

## 📚 Complete Sync Documentation

### 🏠 Start Here
- **[README.md](./README.md)** - **Complete consolidated sync documentation** (start here for everything sync-related)

### 📋 Core Documentation
- **[SYNC_API_REFERENCE.md](./SYNC_API_REFERENCE.md)** - API endpoints, request/response formats, error codes
- **[ZERO_KNOWLEDGE_SYNC_ARCHITECTURE.md](./ZERO_KNOWLEDGE_SYNC_ARCHITECTURE.md)** - Security architecture and privacy design
- **[SYNC_SECURITY_IMPLEMENTATION_GUIDE.md](./SYNC_SECURITY_IMPLEMENTATION_GUIDE.md)** - Implementation guide for security features
- **[data-sync-service.md](./data-sync-service.md)** - Service architecture and data flow

### 🔧 Troubleshooting & Debugging
- **[troubleshooting.md](./troubleshooting.md)** - Common sync issues and solutions
- **[sync-reversion-troubleshooting.md](./sync-reversion-troubleshooting.md)** - Specific troubleshooting for sync reversion issues
- **[initialization-debug.md](./initialization-debug.md)** - Sync service initialization debugging
- **[deep-debug.md](./deep-debug.md)** - Advanced debugging techniques

### 📖 Additional Resources
- **[SYNC_MIGRATION_GUIDE.md](./SYNC_MIGRATION_GUIDE.md)** - Migration guide (currently outdated - sync was reverted to complex version)
- **[sync-queue-indicator.md](./sync-queue-indicator.md)** - Sync queue indicator documentation

## 🔗 Quick Links

### For Developers
- **New to sync?** → [README.md](./README.md)
- **Need API details?** → [SYNC_API_REFERENCE.md](./SYNC_API_REFERENCE.md)
- **Implementing security?** → [SYNC_SECURITY_IMPLEMENTATION_GUIDE.md](./SYNC_SECURITY_IMPLEMENTATION_GUIDE.md)
- **Having sync issues?** → [troubleshooting.md](./troubleshooting.md)

### For Users
- **Understanding privacy?** → [ZERO_KNOWLEDGE_SYNC_ARCHITECTURE.md](./ZERO_KNOWLEDGE_SYNC_ARCHITECTURE.md)
- **Sync not working?** → [troubleshooting.md](./troubleshooting.md)

## ⚠️ Important Notes

1. **Current Implementation**: StackMap uses the complex sync architecture (reverted from simplified version in August 2025)
2. **Field Conventions**: Activities use `text` (not name/title) and `icon` (not emoji)
3. **Recovery Phrase**: 32-character hexadecimal format
4. **Zero-Knowledge**: Server never sees unencrypted data

## 📍 Navigation

- **Back to main docs**: [../README.md](../README.md)
- **Project overview**: [../../CLAUDE.md](../../CLAUDE.md)
- **Field conventions**: [../../prompts/core/field-conventions.md](../../prompts/core/field-conventions.md)