import { User, Subscription } from '../types';

const USERS_KEY = 'subtrack_users';
const CURRENT_USER_KEY = 'subtrack_current_user';
const DATA_PREFIX = 'subtrack_data_';

interface StoredUser extends User {
  password?: string;
}

export const storageService = {
  // Auth Methods
  getUsers: (): Record<string, StoredUser> => {
    try {
      const usersStr = localStorage.getItem(USERS_KEY);
      return usersStr ? JSON.parse(usersStr) : {};
    } catch (e) {
      console.error('Error reading users', e);
      return {};
    }
  },

  saveUser: (user: StoredUser): boolean => {
    try {
      const users = storageService.getUsers();
      if (users[user.email]) return false; // User exists
      
      users[user.email] = user;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
    } catch (e) {
      console.error('Error saving user', e);
      return false;
    }
  },

  validateUser: (email: string, password: string): User | null => {
    const users = storageService.getUsers();
    const user = users[email];
    if (user && user.password === password) {
      // Return user without password
      const { password: _, ...safeUser } = user;
      return safeUser;
    }
    return null;
  },

  // Session Methods
  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem(CURRENT_USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser: (user: User | null): void => {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  },

  // Data Methods
  getSubscriptions: (userId: string): Subscription[] => {
    try {
      const data = localStorage.getItem(`${DATA_PREFIX}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading subscriptions', e);
      return [];
    }
  },

  saveSubscriptions: (userId: string, subscriptions: Subscription[]): void => {
    try {
      localStorage.setItem(`${DATA_PREFIX}${userId}`, JSON.stringify(subscriptions));
    } catch (e) {
      console.error('Error saving subscriptions', e);
    }
  }
};
