/**
 * Cleanup duplicate/ghost users in the store
 * This utility can be run to clean up existing duplicate users
 */

import { useAppStore } from '../stores';

export const cleanupGhostUsers = () => {
  const state = useAppStore.getState();
  const { users, currentUser } = state;
  
  if (!users || Object.keys(users).length === 0) {
    return;
  }
  
  // Track users by name+emoji
  const usersByKey = new Map();
  const duplicates = [];
  
  // Find all duplicates
  Object.entries(users).forEach(([userId, user]) => {
    if (user && !user.deleted) {
      const key = `${user.name}|${user.icon}`;
      
      if (!usersByKey.has(key)) {
        usersByKey.set(key, []);
      }
      
      usersByKey.get(key).push({ userId, user });
    }
  });
  
  // Process duplicates
  const cleanedUsers = { ...users };
  let newCurrentUser = currentUser;
  
  usersByKey.forEach((userList, key) => {
    if (userList.length > 1) {

      // Sort by user ID timestamp to find the oldest
      const sorted = userList.sort((a, b) => {
        const aTimestamp = parseInt(a.userId.split('_')[1]) || 0;
        const bTimestamp = parseInt(b.userId.split('_')[1]) || 0;
        return aTimestamp - bTimestamp;
      });
      
      const primaryUser = sorted[0];
      const primaryUserId = primaryUser.userId;
      
      // Merge all activities into the primary user
      const mergedDays = JSON.parse(JSON.stringify(primaryUser.user.days || {}));
      
      // Process each duplicate
      sorted.slice(1).forEach(dup => {
        const dupDays = dup.user.days || {};
        
        // Merge activities from duplicate
        Object.keys(dupDays).forEach(day => {
          if (!mergedDays[day]) {
            mergedDays[day] = { activities: [] };
          }
          
          const activities = dupDays[day]?.activities || [];
          const existingIds = new Set(mergedDays[day].activities.map(a => a.id));
          
          activities.forEach(activity => {
            if (!existingIds.has(activity.id) && !activity.deleted) {
              mergedDays[day].activities.push(activity);
            }
          });
        });
        
        // Mark duplicate as deleted
        cleanedUsers[dup.userId] = {
          ...dup.user,
          deleted: true,
          deletedAt: Date.now(),
          deletedReason: 'duplicate_cleanup'
        };
        
        // If current user is a duplicate, update it
        if (currentUser === dup.userId) {
          newCurrentUser = primaryUserId;
        }
        
        duplicates.push({
          duplicateId: dup.userId,
          primaryId: primaryUserId,
          name: dup.user.name
        });
      });
      
      // Update primary user with merged data
      cleanedUsers[primaryUserId] = {
        ...primaryUser.user,
        days: mergedDays
      };
    }
  });
  
  if (duplicates.length > 0) {

    // Update the store
    useAppStore.setState({
      users: cleanedUsers,
      currentUser: newCurrentUser
    });
    
    return {
      success: true,
      duplicatesRemoved: duplicates.length,
      details: duplicates
    };
  }
  
  return {
    success: true,
    duplicatesRemoved: 0,
    message: 'No duplicate users found'
  };
};

// Export a function that can be called from the console
if (typeof window !== 'undefined') {
  window.cleanupGhostUsers = cleanupGhostUsers;
}