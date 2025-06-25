# Round 7 Dev 1 - Story #107: User Data Separation

## Story Overview
**Priority**: Critical - Multi-user foundation  
**Developer**: Dev 1  
**Estimated Effort**: 3 days  
**Dependencies**: User system exists, needs data isolation  

## Problem Statement
Activities are currently stored globally without user association. This fundamental flaw breaks multi-user functionality - when User A creates activities, User B sees them too. We need proper data isolation where each user has their own separate activity lists for both today and tomorrow.

## Acceptance Criteria

### ✅ **User-Specific Activity Storage**
- [ ] Each user has separate `activities` array (today)
- [ ] Each user has separate `tomorrowActivities` array
- [ ] Activities include `userId` field for association
- [ ] No activity sharing between users (unless explicitly implemented later)
- [ ] Storage efficiently handles multiple users without duplication

### ✅ **Data Operations Isolation**
- [ ] Create activity adds to current user's list only
- [ ] Read operations filter by current user automatically
- [ ] Update operations verify user ownership
- [ ] Delete operations only affect user's own activities
- [ ] Bulk operations respect user boundaries

### ✅ **User Context Management**
- [ ] Current user ID available throughout application
- [ ] User context passed to all data operations
- [ ] User switching properly loads new user's activities
- [ ] No data leakage between user sessions
- [ ] Guest/no-user mode handling

### ✅ **Custom User Properties**
- [ ] Custom title per user (replaces "StackMap")
- [ ] User-specific activity count tracking
- [ ] User-specific settings persistence
- [ ] Last active timestamp per user
- [ ] User-specific display preferences

### ✅ **Data Migration & Cleanup**
- [ ] Existing activities migrate to current/first user
- [ ] User deletion removes all associated activities
- [ ] Orphaned activities cleanup mechanism
- [ ] Data integrity validation
- [ ] Backup before migration

### ✅ **Performance & Limits**
- [ ] Maintain performance with multiple users
- [ ] 50 activity limit enforced per user
- [ ] Efficient user switching without full reload
- [ ] Lazy loading of user data
- [ ] Memory management for inactive users

## Technical Implementation

### **Database Schema Updates**
```javascript
// Enhanced activity schema
const ActivitySchema = {
  id: 'string',
  userId: 'string', // NEW: User association
  title: 'string',
  description: 'string',
  timeframe: 'today|tomorrow',
  // ... other existing fields
};

// User-specific storage structure
const UserDataSchema = {
  userId: 'string',
  activities: {
    today: [Activity],
    tomorrow: [Activity]
  },
  customTitle: 'string', // Replaces "StackMap"
  activityCount: {
    today: number,
    tomorrow: number,
    total: number
  },
  lastActive: 'timestamp'
};
```

### **Key Functions to Implement**
```javascript
// User data management
UserDataManager.getUserActivities(userId, timeframe)
UserDataManager.setUserActivities(userId, timeframe, activities)
UserDataManager.addActivity(userId, activity, timeframe)
UserDataManager.removeActivity(userId, activityId)
UserDataManager.migrateGlobalActivities(targetUserId)

// Context management
UserContext.getCurrentUserId()
UserContext.switchUser(userId)
UserContext.validateUserAccess(userId, activityId)
```

### **File Changes Required**
- `js/db-schema.js` - Add user association fields
- `js/user-data-manager.js` (NEW) - User-specific data operations
- `js/user-context.js` (NEW) - User context management
- `js/activity-display.js` - Filter by current user
- `js/activity-storage.js` - User-aware storage operations
- `js/user-manager.js` - Enhanced user switching
- `js/data-migration.js` (NEW) - Migration utilities

## User Experience Requirements

### **Seamless Multi-User**
- User switching instantly shows correct activities
- No visible loading when switching users
- Clear indication of current user
- Activity counts shown per user
- Smooth transitions between users

### **Data Integrity**
- Users never see other users' activities
- Deleted users' data properly cleaned up
- No orphaned activities in system
- Clear user attribution for admin
- Audit trail for data operations

### **Migration Experience**
- One-time migration prompt
- Progress indicator during migration
- Rollback option if issues
- Clear success confirmation
- No data loss during process

## Testing Requirements

### **Multi-User Scenarios**
- [ ] Create activities as User A, verify User B doesn't see them
- [ ] Switch users rapidly, verify correct data loads
- [ ] Delete user, verify all data removed
- [ ] Test with 5+ users with 50 activities each
- [ ] Verify performance remains acceptable

### **Data Integrity Tests**
- [ ] Verify userId on all created activities
- [ ] Test user context in all operations
- [ ] Verify no cross-user data access
- [ ] Test migration with various data states
- [ ] Verify cleanup after user deletion

### **Edge Cases**
- [ ] Handle missing userId gracefully
- [ ] Test with corrupted user data
- [ ] Verify limits work per user
- [ ] Test concurrent user operations
- [ ] Handle storage quota per user

## Migration Plan

### **Phase 1: Schema Update**
1. Add userId field to activity schema
2. Create user-specific storage structure
3. Update all data operations to be user-aware

### **Phase 2: Migration Execution**
1. Detect existing global activities
2. Prompt user for migration
3. Assign activities to current/first user
4. Verify migration success
5. Clean up global storage

### **Phase 3: Validation**
1. Verify all activities have userId
2. Ensure no orphaned activities
3. Test user switching thoroughly
4. Monitor for data access issues

## Success Metrics

### **Functional Success**
- [ ] 100% data isolation between users
- [ ] Zero data loss during migration
- [ ] All operations respect user context
- [ ] User deletion cleans all data
- [ ] Performance maintained

### **User Experience Success**
- [ ] Instant user switching
- [ ] Clear user indication
- [ ] Intuitive multi-user flow
- [ ] No confusion about data ownership
- [ ] Smooth migration process

## Risk Mitigation

### **Data Loss Prevention**
- Backup before migration
- Validation at each step
- Rollback capability
- Audit logging
- Recovery mechanisms

### **Performance Impact**
- Index by userId
- Lazy load user data
- Cache active user
- Efficient queries
- Memory management

## Definition of Done

### **Code Complete**
- [ ] User-specific storage implemented
- [ ] All operations user-aware
- [ ] Migration tool created
- [ ] User context management working
- [ ] Custom titles per user

### **Testing Complete**
- [ ] Multi-user scenarios pass
- [ ] Migration tested thoroughly
- [ ] Performance benchmarks met
- [ ] Edge cases handled
- [ ] No data leakage

### **User Experience**
- [ ] Seamless user switching
- [ ] Clear data ownership
- [ ] Successful migration flow
- [ ] No regressions
- [ ] Documentation updated

---

**Story #107 establishes the critical foundation for proper multi-user support in StackMap, ensuring each user's data is properly isolated and managed.**