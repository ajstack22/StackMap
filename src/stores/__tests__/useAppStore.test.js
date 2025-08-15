import useAppStore from '../useAppStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('useAppStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    useAppStore.setState({
      users: {},
      currentUser: null,
      activities: [],
      currentDay: 'today',
    });
  });

  describe('updateUser with deep merge', () => {
    it('should preserve nested data when updating user', () => {
      // Set up initial state
      useAppStore.getState().setUsers({
        'user1': {
          name: 'Test User',
          icon: '😊',
          settings: { 
            theme: 'blue', 
            celebration: 'rainbow',
            soundEnabled: true 
          },
          days: {
            today: { activities: [{ id: '1', text: 'Task 1' }] },
            tomorrow: { activities: [{ id: '2', text: 'Task 2' }] }
          }
        }
      });

      // Update only today's activities
      useAppStore.getState().updateUser('user1', {
        days: { 
          today: { activities: [{ id: '3', text: 'Task 3' }] } 
        }
      });

      const updatedUser = useAppStore.getState().users.user1;
      
      // Should preserve all other data
      expect(updatedUser.name).toBe('Test User');
      expect(updatedUser.icon).toBe('😊');
      expect(updatedUser.settings).toEqual({ 
        theme: 'blue', 
        celebration: 'rainbow',
        soundEnabled: true 
      });
      expect(updatedUser.days.tomorrow).toEqual({ 
        activities: [{ id: '2', text: 'Task 2' }] 
      });
      expect(updatedUser.days.today).toEqual({ 
        activities: [{ id: '3', text: 'Task 3' }] 
      });
    });

    it('should handle deep nested updates', () => {
      // Set up initial state
      useAppStore.getState().setUsers({
        'user1': {
          name: 'Test User',
          settings: { 
            theme: 'blue', 
            celebration: 'rainbow',
            displayMode: 'numbers'
          }
        }
      });

      // Update only theme
      useAppStore.getState().updateUser('user1', {
        settings: { theme: 'crimson' }
      });

      const updatedUser = useAppStore.getState().users.user1;
      
      // Should preserve other settings
      expect(updatedUser.settings.theme).toBe('crimson');
      expect(updatedUser.settings.celebration).toBe('rainbow');
      expect(updatedUser.settings.displayMode).toBe('numbers');
    });
  });

  describe('updateUserActivities helper', () => {
    it('should update activities for a specific day', () => {
      // Set up initial state
      useAppStore.getState().setUsers({
        'user1': {
          name: 'Test User',
          days: {
            today: { activities: [{ id: '1', text: 'Task 1' }] },
            tomorrow: { activities: [{ id: '2', text: 'Task 2' }] }
          }
        }
      });

      // Update today's activities
      useAppStore.getState().updateUserActivities('user1', 'today', [
        { id: '3', text: 'Task 3' },
        { id: '4', text: 'Task 4' }
      ]);

      const updatedUser = useAppStore.getState().users.user1;
      
      // Should update today's activities
      expect(updatedUser.days.today.activities).toHaveLength(2);
      expect(updatedUser.days.today.activities[0].text).toBe('Task 3');
      
      // Should preserve tomorrow's activities
      expect(updatedUser.days.tomorrow.activities).toHaveLength(1);
      expect(updatedUser.days.tomorrow.activities[0].text).toBe('Task 2');
    });

    it('should handle missing intermediate objects', () => {
      // Set up user without days object
      useAppStore.getState().setUsers({
        'user1': {
          name: 'Test User',
          icon: '😊'
        }
      });

      // Update activities should create missing structure
      useAppStore.getState().updateUserActivities('user1', 'today', [
        { id: '1', text: 'Task 1' }
      ]);

      const updatedUser = useAppStore.getState().users.user1;
      
      // Should create days object and today entry
      expect(updatedUser.days).toBeDefined();
      expect(updatedUser.days.today).toBeDefined();
      expect(updatedUser.days.today.activities).toHaveLength(1);
      expect(updatedUser.days.today.activities[0].text).toBe('Task 1');
    });

    it('should return state unchanged for non-existent user', () => {
      const initialUsers = { 'user1': { name: 'Test User' } };
      useAppStore.setState({ users: initialUsers });

      // Try to update non-existent user
      useAppStore.getState().updateUserActivities('user999', 'today', []);

      // State should remain unchanged
      expect(useAppStore.getState().users).toEqual(initialUsers);
    });
  });
});