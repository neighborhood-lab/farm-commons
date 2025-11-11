/**
 * Storage Adapter for React Native
 *
 * Provides a simple interface for persisting data in React Native
 * using AsyncStorage or similar storage mechanisms.
 */

import type { StorageAdapter } from './api';

/**
 * In-Memory Storage Adapter
 * Useful for testing or as a fallback
 */
export class InMemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}

/**
 * AsyncStorage Adapter for React Native
 *
 * Usage:
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * const storage = new AsyncStorageAdapter(AsyncStorage);
 */
export class AsyncStorageAdapter implements StorageAdapter {
  constructor(private asyncStorage: any) {}

  async getItem(key: string): Promise<string | null> {
    try {
      return await this.asyncStorage.getItem(key);
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.asyncStorage.setItem(key, value);
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.asyncStorage.removeItem(key);
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.asyncStorage.clear();
    } catch (error) {
      console.error('AsyncStorage clear error:', error);
      throw error;
    }
  }
}

/**
 * SecureStore Adapter for React Native Expo
 *
 * For sensitive data like auth tokens
 *
 * Usage:
 * import * as SecureStore from 'expo-secure-store';
 * const storage = new SecureStoreAdapter(SecureStore);
 */
export class SecureStoreAdapter implements StorageAdapter {
  constructor(private secureStore: any) {}

  async getItem(key: string): Promise<string | null> {
    try {
      return await this.secureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.secureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.secureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
      throw error;
    }
  }
}

export default InMemoryStorageAdapter;
