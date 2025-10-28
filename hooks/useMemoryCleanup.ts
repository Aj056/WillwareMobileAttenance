import { useEffect, useRef } from 'react';

interface UseMemoryCleanupOptions {
  onUnmount?: () => void;
  interval?: number;
}

export const useMemoryCleanup = (options: UseMemoryCleanupOptions = {}) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Set up periodic cleanup if interval is provided
    if (options.interval) {
      intervalRef.current = setInterval(() => {
        if (mountedRef.current && global.gc) {
          global.gc();
        }
      }, options.interval);
    }

    return () => {
      mountedRef.current = false;
      
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Run custom cleanup
      if (options.onUnmount) {
        options.onUnmount();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    };
  }, [options.interval]);

  return {
    isMounted: () => mountedRef.current,
    forceCleanup: () => {
      if (global.gc) {
        global.gc();
      }
    }
  };
};

// Memory optimization utilities
export class MemoryManager {
  private static timers: Set<ReturnType<typeof setTimeout>> = new Set();
  private static intervals: Set<ReturnType<typeof setInterval>> = new Set();
  private static listeners: Map<string, (() => void)[]> = new Map();

  static setTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
    const timer = setTimeout(() => {
      callback();
      MemoryManager.timers.delete(timer);
    }, delay);
    
    MemoryManager.timers.add(timer);
    return timer;
  }

  static setInterval(callback: () => void, delay: number): ReturnType<typeof setInterval> {
    const interval = setInterval(callback, delay);
    MemoryManager.intervals.add(interval);
    return interval;
  }

  static clearTimeout(timer: ReturnType<typeof setTimeout>): void {
    clearTimeout(timer);
    MemoryManager.timers.delete(timer);
  }

  static clearInterval(interval: ReturnType<typeof setInterval>): void {
    clearInterval(interval);
    MemoryManager.intervals.delete(interval);
  }

  static addEventListenerCleanup(key: string, cleanup: () => void): void {
    if (!MemoryManager.listeners.has(key)) {
      MemoryManager.listeners.set(key, []);
    }
    MemoryManager.listeners.get(key)!.push(cleanup);
  }

  static removeEventListenerCleanup(key: string): void {
    const cleanups = MemoryManager.listeners.get(key);
    if (cleanups) {
      cleanups.forEach(cleanup => cleanup());
      MemoryManager.listeners.delete(key);
    }
  }

  static cleanupAll(): void {
    // Clear all timers
    MemoryManager.timers.forEach(timer => clearTimeout(timer));
    MemoryManager.timers.clear();

    // Clear all intervals
    MemoryManager.intervals.forEach(interval => clearInterval(interval));
    MemoryManager.intervals.clear();

    // Run all cleanup functions
    MemoryManager.listeners.forEach(cleanups => {
      cleanups.forEach(cleanup => cleanup());
    });
    MemoryManager.listeners.clear();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  static getMemoryUsage(): {
    timers: number;
    intervals: number;
    listeners: number;
  } {
    return {
      timers: MemoryManager.timers.size,
      intervals: MemoryManager.intervals.size,
      listeners: Array.from(MemoryManager.listeners.values()).reduce(
        (total, cleanups) => total + cleanups.length, 0
      )
    };
  }
}