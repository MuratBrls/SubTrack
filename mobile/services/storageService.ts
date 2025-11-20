import AsyncStorage from '@react-native-async-storage/async-storage';
import { Subscription } from '../types';

const DATA_KEY = 'subtrack_mobile_data_v1';

export const storageService = {
  getSubscriptions: async (): Promise<Subscription[]> => {
    try {
      const data = await AsyncStorage.getItem(DATA_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Read error', e);
      return [];
    }
  },

  saveSubscriptions: async (subscriptions: Subscription[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(DATA_KEY, JSON.stringify(subscriptions));
    } catch (e) {
      console.error('Save error', e);
    }
  },

  addSubscription: async (sub: Subscription): Promise<Subscription[]> => {
    const current = await storageService.getSubscriptions();
    const updated = [...current, sub];
    await storageService.saveSubscriptions(updated);
    return updated;
  },

  deleteSubscription: async (id: string): Promise<Subscription[]> => {
    const current = await storageService.getSubscriptions();
    const updated = current.filter(s => s.id !== id);
    await storageService.saveSubscriptions(updated);
    return updated;
  }
};