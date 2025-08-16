import { useAppStore } from '../stores';
import type { User } from '../types';

/**
 * Cleanup duplicate/ghost users in the store
 * This utility can be run to clean up existing duplicate users
 * by merging their activities and marking duplicates as deleted
 */

// Result types for cleanup operation
interface UserEntry {
  userId: string;
  user: User;
}

interface DuplicateInfo {
  duplicateId: string;
  primaryId: string;
  name: string;
}

interface CleanupResult {
  success: boolean;
  duplicatesRemoved: number;
  details?: DuplicateInfo[];
  message?: string;
}

/**
 * Clean up duplicate/ghost users in the app store
 * Merges activities from duplicates into the primary user
 * @returns Result object with cleanup details
 */
export const cleanupGhostUsers = (): CleanupResult => {
  const state = useAppStore.getState();
  const { users, currentUser } = state;
  
  if (!users || Object.keys(users).length === 0) {
    return {
      success: true,
      duplicatesRemoved: 0,
      message: 'No users to process'
    };
  }
  
  // Track users by name+icon
  const usersByKey = new Map<string, UserEntry[]>();
  const duplicates: DuplicateInfo[] = [];
  
  // Find all duplicates
  Object.entries(users).forEach(([userId, user]) => {
    const typedUser = user as User | null;
    if (typedUser && !(typedUser as any).deleted) {
      const key = `${typedUser.name}|${typedUser.icon}`;
      
      if (!usersByKey.has(key)) {
        usersByKey.set(key, []);
      }
      
      usersByKey.get(key)!.push({ userId, user: typedUser });
    }
  });
  
  // Process duplicates
  const cleanedUsers: Record<string, any> = { ...users };
  let newCurrentUser = currentUser;
  
  usersByKey.forEach((userList, _key) => {
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
          const existingIds = new Set(mergedDays[day].activities.map((a: any) => a.id));
          
          activities.forEach((activity: any) => {
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
  (window as any).cleanupGhostUsers = cleanupGhostUsers;
}