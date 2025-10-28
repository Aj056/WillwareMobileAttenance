import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

interface OfflineQueueItem {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  timestamp: number;
  retryCount: number;
}

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

class OfflineManager {
  private static instance: OfflineManager;
  private queue: OfflineQueueItem[] = [];
  private readonly maxRetries = 3;
  private readonly queueKey = 'offline_queue';
  private isProcessing = false;

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  async initialize(): Promise<void> {
    await this.loadQueue();
  }

  async addToQueue(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any
  ): Promise<void> {
    const item: OfflineQueueItem = {
      id: Date.now().toString() + Math.random(),
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.queue.push(item);
    await this.saveQueue();
  }

  async processQueue(apiClient: any): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    const processedItems: string[] = [];

    for (const item of this.queue) {
      try {
        await this.processQueueItem(item, apiClient);
        processedItems.push(item.id);
      } catch (error) {
        item.retryCount++;
        
        if (item.retryCount >= this.maxRetries) {
          processedItems.push(item.id);
          console.error(`Failed to process queue item after ${this.maxRetries} retries:`, error);
        }
      }
    }

    // Remove processed items
    this.queue = this.queue.filter(item => !processedItems.includes(item.id));
    await this.saveQueue();

    this.isProcessing = false;
  }

  private async processQueueItem(item: OfflineQueueItem, apiClient: any): Promise<void> {
    switch (item.method) {
      case 'GET':
        await apiClient.get(item.endpoint);
        break;
      case 'POST':
        await apiClient.post(item.endpoint, item.data);
        break;
      case 'PUT':
        await apiClient.put(item.endpoint, item.data);
        break;
      case 'DELETE':
        await apiClient.delete(item.endpoint);
        break;
    }
  }

  private async loadQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(this.queueKey);
      if (queueData) {
        this.queue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.queueKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await AsyncStorage.removeItem(this.queueKey);
  }
}

// React hook for network status
export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown'
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type
      });
    });

    return unsubscribe;
  }, []);

  return networkState;
};

// React hook for offline management
export const useOfflineManager = (apiClient: any) => {
  const networkState = useNetworkStatus();
  const [queueLength, setQueueLength] = useState(0);
  const offlineManager = OfflineManager.getInstance();

  useEffect(() => {
    offlineManager.initialize();
  }, []);

  useEffect(() => {
    if (networkState.isConnected && networkState.isInternetReachable) {
      offlineManager.processQueue(apiClient);
    }
    setQueueLength(offlineManager.getQueueLength());
  }, [networkState.isConnected, networkState.isInternetReachable, apiClient]);

  const addToOfflineQueue = useCallback(
    async (endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any) => {
      await offlineManager.addToQueue(endpoint, method, data);
      setQueueLength(offlineManager.getQueueLength());
    },
    []
  );

  const clearOfflineQueue = useCallback(async () => {
    await offlineManager.clearQueue();
    setQueueLength(0);
  }, []);

  return {
    isOnline: networkState.isConnected && networkState.isInternetReachable,
    networkType: networkState.type,
    queueLength,
    addToOfflineQueue,
    clearOfflineQueue
  };
};

export default OfflineManager;