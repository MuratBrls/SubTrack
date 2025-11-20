import { User, Subscription } from '../types';

const getPlatform = () => {
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
  if (/Android/.test(userAgent)) return 'Android';
  if (/Win/.test(userAgent)) return 'Windows';
  if (/Mac/.test(userAgent)) return 'MacOS';
  return 'LocalDevice';
};

// Define namespaces for local storage
const NAMESPACE = 'subtrack_local_storage';
const USERS_KEY = `${NAMESPACE}_users`;
const CURRENT_USER_KEY = `${NAMESPACE}_current_session`;
const DATA_PREFIX = `${NAMESPACE}_data_`;
const VAULT_PIN_PREFIX = `${NAMESPACE}_vault_pin_`;

interface StoredUser extends User {
  password?: string;
  authType?: 'email' | 'google' | 'apple';
  platform?: string;
}

export const storageService = {
  // Detect platform for metadata
  getPlatform,

  // Auth Methods
  getUsers: (): Record<string, StoredUser> => {
    try {
      const usersStr = localStorage.getItem(USERS_KEY);
      return usersStr ? JSON.parse(usersStr) : {};
    } catch (e) {
      console.error('Local Storage Read Error (Users)', e);
      return {};
    }
  },

  saveUser: (user: StoredUser): boolean => {
    try {
      const users = storageService.getUsers();
      // Add platform info to user record
      const userWithPlatform = { ...user, platform: getPlatform() };
      
      // Allow overwrite if social login, or if authType matches
      if (users[user.email] && user.authType === 'email' && users[user.email].authType === 'email') return false; 
      
      users[user.email] = { ...users[user.email], ...userWithPlatform };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
    } catch (e) {
      console.error('Local Storage Write Error (User)', e);
      return false;
    }
  },

  validateUser: (email: string, password: string): User | null => {
    const users = storageService.getUsers();
    const user = users[email];
    if (user && user.password === password) {
      const { password: _, ...safeUser } = user;
      // Check if this user has a vault PIN set locally
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
      // Re-check vault status against local device storage
      user.hasVaultPin = !!localStorage.getItem(`${VAULT_PIN_PREFIX}${user.id}`);
      return user;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser: (user: User | null): void => {
    try {
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (e) {
      console.error('Local Session Error', e);
    }
  },

  // Data Methods (Subscriptions)
  getSubscriptions: (userId: string): Subscription[] => {
    try {
      const key = `${DATA_PREFIX}${userId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading local subscription data', e);
      return [];
    }
  },

  saveSubscriptions: (userId: string, subscriptions: Subscription[]): void => {
    try {
      const key = `${DATA_PREFIX}${userId}`;
      localStorage.setItem(key, JSON.stringify(subscriptions));
    } catch (e) {
      console.error('Error saving subscription data to local device', e);
    }
  },

  // Vault PIN Methods (Device Specific)
  setVaultPin: (userId: string, pin: string): void => {
    try {
      localStorage.setItem(`${VAULT_PIN_PREFIX}${userId}`, pin);
      
      // Update current user session to reflect they have a pin
      const currentUser = storageService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
          currentUser.hasVaultPin = true;
          storageService.setCurrentUser(currentUser);
      }
    } catch (e) {
      console.error('Error saving vault PIN locally', e);
    }
  },

  validateVaultPin: (userId: string, pin: string): boolean => {
    try {
      const storedPin = localStorage.getItem(`${VAULT_PIN_PREFIX}${userId}`);
      return storedPin === pin;
    } catch (e) {
      return false;
    }
  }
};