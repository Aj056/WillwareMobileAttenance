import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiryTime: number;
}

interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size in items
}

class CacheManager {
  private static instance: CacheManager;
  private config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 50
  };

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private getCacheKey(key: string): string {
    return `cache_${key}`;
  }

  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    try {
      const expiryTime = Date.now() + (ttlMs || this.config.defaultTTL);
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiryTime
      };

      await AsyncStorage.setItem(this.getCacheKey(key), JSON.stringify(cacheItem));
      await this.cleanupExpiredItems();
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(this.getCacheKey(key));
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() > cacheItem.expiryTime) {
        await this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getCacheKey(key));
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  private async cleanupExpiredItems(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const cacheItem: CacheItem<any> = JSON.parse(cached);
          if (Date.now() > cacheItem.expiryTime) {
            await AsyncStorage.removeItem(key);
          }
        }
      }

      // Limit cache size
      if (cacheKeys.length > this.config.maxSize) {
        const itemsToRemove = cacheKeys.slice(0, cacheKeys.length - this.config.maxSize);
        await AsyncStorage.multiRemove(itemsToRemove);
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  // Cache strategies for common patterns
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttlMs?: number
  ): Promise<T> {
    let cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    await this.set(key, data, ttlMs);
    return data;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const matchingKeys = keys.filter(key => 
        key.startsWith('cache_') && key.includes(pattern)
      );
      await AsyncStorage.multiRemove(matchingKeys);
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
    }
  }
}

export default CacheManager;

// Cache keys constants
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  ATTENDANCE_TODAY: 'attendance_today',
  ATTENDANCE_SUMMARY: 'attendance_summary',
  PAYSLIP_LIST: 'payslip_list',
  PAYSLIP: (employeeId: string, month: string, year: string) => `payslip_${employeeId}_${month}_${year}`,
  QUOTES: 'motivational_quotes',
  DASHBOARD_STATS: 'dashboard_stats'
} as const;