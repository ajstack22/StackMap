# Implementation Plan: SQLite Migration Data Safety (Story #34)

## 🎯 Executive Summary

This plan implements bulletproof SQLite migration safety for StackMap users who rely on the app as their external memory system. Building on our existing migration infrastructure, we'll add fail-safe mechanisms that guarantee zero data loss with 5-second rollback capability.

## 📊 Current State Analysis

### ✅ What We Have
1. **Basic Migration System** (`migration-manager.js`)
   - localStorage to SQLite migration
   - 30-day backup retention
   - Basic rollback capability

2. **Safety Features** (`migration-safety.js`)
   - 24-hour verification period
   - Atomic operations
   - Multi-location backups

3. **Error Handling** (`storage-error-handler.js`)
   - RSD-aware messaging
   - Retry mechanisms
   - Recovery strategies

### ❌ What's Missing (Story #34 Requirements)
1. **5-Second Rollback Guarantee**
   - Current rollback isn't time-bounded
   - No savepoint implementation
   - Missing instant recovery path

2. **Pre-Migration Integrity Checks**
   - No corruption detection
   - Missing storage quota validation
   - No battery/network checks

3. **Shadow Table Pattern**
   - Direct migration only
   - No zero-downtime option
   - Missing progressive migration

4. **Platform-Specific Safety**
   - Generic implementation
   - No background task handling
   - Missing file protection levels

## 🏗️ Implementation Architecture

### Phase 1: Enhanced Migration Orchestrator (Week 1)

```javascript
// New file: js/migration-orchestrator.js
class FailSafeMigrationOrchestrator {
    constructor() {
        this.rollbackTimeout = 5000; // 5 seconds
        this.maxRetries = 3;
        this.batchSize = 1000;
    }
    
    async executeMigration(version, operation) {
        const migrationId = `migration_${Date.now()}`;
        const startTime = performance.now();
        
        // Pre-flight checks
        await this.performPreflightChecks();
        
        // Create atomic backup with verification
        const backup = await this.createVerifiedBackup(migrationId);
        
        // Create savepoint for instant rollback
        await this.createSavepoint(migrationId);
        
        try {
            // Execute with monitoring
            const result = await this.executeWithMonitoring(operation);
            
            // Verify integrity
            await this.verifyDataIntegrity();
            
            // Commit changes
            await this.commitMigration(migrationId);
            
            return result;
        } catch (error) {
            // Guaranteed 5-second rollback
            await this.performInstantRollback(migrationId, startTime);
            throw new MigrationError('Safely rolled back', error);
        }
    }
}
```

### Phase 2: Pre-Migration Safety Checks (Week 1)

```javascript
// Enhanced migration-safety.js
class EnhancedMigrationSafety {
    async performPreflightChecks() {
        const checks = {
            storage: await this.checkStorageQuota(),
            battery: await this.checkBatteryLevel(),
            integrity: await this.checkDatabaseIntegrity(),
            memory: await this.checkAvailableMemory()
        };
        
        if (!checks.storage.passed) {
            throw new PreflightError('Insufficient storage space', checks);
        }
        
        if (!checks.battery.passed && this.platform.isMobile) {
            throw new PreflightError('Low battery - please charge device', checks);
        }
        
        return checks;
    }
    
    async checkStorageQuota() {
        const quota = await navigator.storage.estimate();
        const required = await this.estimateRequiredSpace();
        
        return {
            passed: quota.quota - quota.usage > required * 2,
            available: quota.quota - quota.usage,
            required: required
        };
    }
}
```

### Phase 3: Shadow Table Implementation (Week 2)

```javascript
// New file: js/shadow-table-migrator.js
class ShadowTableMigrator {
    async performZeroDowntimeMigration(schema) {
        // Step 1: Create shadow tables
        await this.createShadowTables(schema);
        
        // Step 2: Setup real-time sync triggers
        await this.setupSyncTriggers();
        
        // Step 3: Progressive data backfill
        await this.progressiveBackfill();
        
        // Step 4: Verify data consistency
        await this.verifyConsistency();
        
        // Step 5: Atomic cutover
        await this.performAtomicCutover();
    }
    
    async progressiveBackfill() {
        const totalRows = await this.getTotalRowCount();
        const batchSize = 1000;
        
        for (let offset = 0; offset < totalRows; offset += batchSize) {
            await this.backfillBatch(offset, batchSize);
            
            // Update UI with progress
            this.updateProgress(offset / totalRows * 100);
            
            // Yield to prevent blocking
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
}
```

### Phase 4: Platform-Specific Enhancements (Week 2)

```javascript
// Enhanced platform detection and handling
class PlatformMigrationAdapter {
    async executePlatformSafeMigration(operation) {
        const platform = this.detectPlatform();
        
        switch (platform) {
            case 'capacitor-ios':
                return await this.executeiOSMigration(operation);
            case 'capacitor-android':
                return await this.executeAndroidMigration(operation);
            case 'web':
                return await this.executeWebMigration(operation);
            default:
                return await this.executeGenericMigration(operation);
        }
    }
    
    async executeiOSMigration(operation) {
        // Request background time
        const bgTaskId = await this.requestBackgroundTime();
        
        try {
            // Set file protection
            await this.setFileProtection('CompleteUnlessOpen');
            
            // Execute migration
            return await operation();
        } finally {
            await this.endBackgroundTask(bgTaskId);
        }
    }
}
```

### Phase 5: Enhanced UI Communication (Week 3)

```javascript
// New file: js/migration-ui-controller.js
class MigrationUIController {
    constructor() {
        this.messages = {
            preflight: {
                whatHappening: "Checking if it's safe to update",
                whyImportant: "This protects your tasks from any issues",
                userAction: "Just a moment - no action needed"
            },
            backup: {
                whatHappening: "Creating a safety copy of your tasks",
                whyImportant: "Your data is protected no matter what",
                userAction: "Keep the app open - almost ready"
            },
            migration: {
                whatHappening: "Organizing your tasks in a better way",
                whyImportant: "This makes the app faster and more reliable",
                userAction: "Your tasks are safe - just a bit longer"
            },
            verification: {
                whatHappening: "Double-checking all your tasks are perfect",
                whyImportant: "Making sure nothing was missed",
                userAction: "Almost done - thanks for waiting"
            },
            complete: {
                whatHappening: "✓ Your tasks are updated and ready",
                whyImportant: "Everything worked perfectly",
                userAction: "You can use the app normally now"
            }
        };
    }
    
    showProgress(phase, progress, timeRemaining) {
        const container = document.getElementById('migration-progress');
        if (!container) return;
        
        container.innerHTML = `
            <div class="migration-card">
                <h2 class="migration-title">
                    ${this.messages[phase].whatHappening}
                </h2>
                <p class="migration-why">
                    ${this.messages[phase].whyImportant}
                </p>
                
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                    <span class="progress-text">${Math.round(progress)}%</span>
                </div>
                
                <p class="migration-action">
                    ${this.messages[phase].userAction}
                </p>
                
                ${phase !== 'complete' ? `
                    <p class="time-estimate">
                        About ${Math.ceil(timeRemaining / 60)} minutes remaining
                    </p>
                    <button class="rollback-btn" onclick="migrationController.requestRollback()">
                        Cancel and keep current version
                    </button>
                ` : ''}
            </div>
        `;
    }
}
```

## 📋 Implementation Checklist

### Week 1: Core Safety Infrastructure
- [ ] Implement FailSafeMigrationOrchestrator
- [ ] Add 5-second rollback guarantee
- [ ] Create pre-flight check system
- [ ] Add savepoint support to TaskSQLite
- [ ] Implement instant rollback mechanism
- [ ] Add time-bounded operations
- [ ] Create migration metrics tracking

### Week 2: Advanced Migration Patterns
- [ ] Implement shadow table migrator
- [ ] Add progressive backfill support
- [ ] Create sync trigger system
- [ ] Add atomic cutover mechanism
- [ ] Implement platform-specific adapters
- [ ] Add background task support
- [ ] Create file protection handling

### Week 3: UI and Recovery
- [ ] Build migration UI controller
- [ ] Create calming progress interface
- [ ] Add time estimation with buffer
- [ ] Implement rollback UI
- [ ] Add recovery matrix
- [ ] Create success confirmation
- [ ] Build notification system

### Week 4: Testing and Polish
- [ ] Test 5-second rollback guarantee
- [ ] Simulate quota exhaustion
- [ ] Test force-quit scenarios
- [ ] Verify corruption recovery
- [ ] Test on low-end devices
- [ ] User testing with ADHD/autism participants
- [ ] Performance optimization

## 🧪 Testing Strategy

### Automated Tests
```javascript
describe('Migration Safety', () => {
    it('should rollback within 5 seconds', async () => {
        const start = Date.now();
        await orchestrator.executeMigration(2, failingOperation);
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(5000);
    });
    
    it('should detect and prevent corruption', async () => {
        await corruptDatabase();
        const result = await orchestrator.performPreflightChecks();
        expect(result.integrity.passed).toBe(false);
    });
});
```

### Manual Testing Scenarios
1. **Storage Exhaustion**: Fill device to 90% before migration
2. **Battery Death**: Start migration at 5% battery
3. **Force Quit**: Kill app during each migration phase
4. **Network Loss**: Disconnect during cloud backup
5. **Memory Pressure**: Run migration with many apps open

## 🚀 Rollout Strategy

### Phase 1: Internal Testing (Week 4)
- Team testing on all platforms
- Automated test suite completion
- Performance benchmarking

### Phase 2: Beta Testing (Week 5)
- 10-20 neurodivergent beta testers
- Focus on trust and communication
- Gather feedback on messaging

### Phase 3: Gradual Rollout (Week 6)
- 10% of users initially
- Monitor metrics closely
- Full rollout after 48 hours stable

## 📊 Success Metrics

### Technical Metrics
- **Rollback Time**: < 5 seconds (100% of cases)
- **Data Loss**: 0 incidents
- **Migration Success**: > 99.9%
- **Recovery Success**: 100%

### User Experience Metrics
- **Completion Rate**: > 95%
- **User Cancellations**: < 5%
- **Support Tickets**: < 0.1%
- **Trust Score**: > 4.5/5

## 🎯 Definition of Done

- [ ] Zero data loss in all test scenarios
- [ ] 5-second rollback verified on all platforms
- [ ] All failure modes have recovery paths
- [ ] UI messaging tested with neurodivergent users
- [ ] Performance metrics meet targets
- [ ] Documentation complete
- [ ] Team trained on support procedures

## 🔄 Risk Mitigation

### Technical Risks
1. **SQLite Corruption**: Multi-layer backup strategy
2. **Platform Differences**: Extensive platform testing
3. **Performance Impact**: Progressive migration option

### User Experience Risks
1. **Migration Anxiety**: Clear, calming communication
2. **Trust Loss**: Instant rollback option always visible
3. **Confusion**: Literal, simple language throughout

## 📝 Next Steps

1. **Immediate**: Review plan with team
2. **Week 1**: Begin core implementation
3. **Week 2**: Start platform-specific work
4. **Week 3**: UI implementation and testing
5. **Week 4**: Beta testing preparation

This plan ensures absolute data safety while maintaining user trust through clear communication and instant recovery options. The implementation prioritizes the needs of neurodivergent users who depend on StackMap as their external memory system.