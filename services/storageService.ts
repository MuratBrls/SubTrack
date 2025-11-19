import { User, Subscription } from '../types';

const USERS_KEY = 'subtrack_users';
const CURRENT_USER_KEY = 'subtrack_current_user';
const DATA_PREFIX = 'subtrack_data_';
const VAULT_PIN_PREFIX = 'subtrack_vault_pin_';

interface StoredUser extends User {
  password?: string;
  authType?: 'email' | 'google' | 'apple';
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
      // Allow overwrite if social login, or if authType matches
      if (users[user.email] && user.authType === 'email' && users[user.email].authType === 'email') return false; 
      
      users[user.email] = { ...users[user.email], ...user };
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
      const { password: _, ...safeUser } = user;
      // Check if this user has a vault PIN set
      safeUser.hasVaultPin = !!localStorage.getItem(`${VAULT_PIN_PREFIX}${safeUser.id}`);
      return safeUser;
    }
    return null;
  },

  // Session Methods
  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem(CURRENT_USER_KEY);
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      // Re-check vault status
      user.hasVaultPin = !!localStorage.getItem(`${VAULT_PIN_PREFIX}${user.id}`);
      return user;
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
  },

  // Vault PIN Methods
  setVaultPin: (userId: string, pin: string): void => {
    localStorage.setItem(`${VAULT_PIN_PREFIX}${userId}`, pin);
    // Update current user session to reflect they have a pin
    const currentUser = storageService.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        currentUser.hasVaultPin = true;
        storageService.setCurrentUser(currentUser);
    }
  },

  validateVaultPin: (userId: string, pin: string): boolean => {
    const storedPin = localStorage.getItem(`${VAULT_PIN_PREFIX}${userId}`);
    return storedPin === pin;
  }
};