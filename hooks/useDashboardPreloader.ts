import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import CacheManager from '../services/cacheManager';

interface DashboardData {
  employeeDetails: any;
  todayAttendance: any;
  currentQuote: any;
  isLoading: boolean;
  error: string | null;
}

export const useDashboardPreloader = (employeeId: string | undefined) => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    employeeDetails: null,
    todayAttendance: null,
    currentQuote: null,
    isLoading: true,
    error: null
  });

  const cache = CacheManager.getInstance();
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [forceRefresh, setForceRefresh] = useState<boolean>(false);

  useEffect(() => {
    if (employeeId) {
      preloadDashboardData(employeeId, false);
    }
  }, [employeeId]);

  const preloadDashboardData = async (empId: string, isManualRefresh: boolean = false) => {
    try {
      // Prevent frequent API calls - only allow new calls every 30 seconds unless manual refresh
      const now = Date.now();
      if (!isManualRefresh && (now - lastFetchTime) < 30000 && dashboardData.employeeDetails) {
        console.log('🚫 API call prevented - using cached data (rate limit protection)');
        return;
      }

      setDashboardData(prev => ({ ...prev, isLoading: true, error: null }));
      setLastFetchTime(now);

      // Load data in parallel with optimized caching
      const [employeeDetails, currentQuote] = await Promise.allSettled([
        // Employee details - main API call (cached for 2 minutes normally, 30 seconds after check-in/out)
        cache.getOrSet(
          `employee_view_${empId}`,
          () => apiClient.getEmployeeView(empId),
          isManualRefresh || forceRefresh ? 0 : 2 * 60 * 1000 // 2 minutes cache, bypass if manual refresh
        ),
        
        // Motivational quote (cached for 4 hours - quotes don't change often)
        cache.getOrSet(
          'daily_quote',
          () => apiClient.getMotivationalQuote(),
          4 * 60 * 60 * 1000 // 4 hours cache
        )
      ]);

      const employeeData = employeeDetails.status === 'fulfilled' ? employeeDetails.value : null;
      const quoteData = currentQuote.status === 'fulfilled' ? currentQuote.value : null;

      setDashboardData({
        employeeDetails: employeeData,
        todayAttendance: null, // Not needed anymore - we process directly in render
        currentQuote: quoteData,
        isLoading: false,
        error: employeeDetails.status === 'rejected' && !employeeData ? 
               'Unable to fetch attendance data. Please check your connection.' : null
      });

      // Reset force refresh flag
      setForceRefresh(false);

    } catch (error) {
      console.error('📡 Dashboard preload failed:', error);
      setDashboardData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Server error - Please try again later'
      }));
    }
  };

  const refreshDashboardData = async (isManualRefresh: boolean = true) => {
    if (employeeId) {
      if (isManualRefresh) {
        // Clear relevant cache for manual refresh
        await cache.remove(`employee_view_${employeeId}`);
      }
      await preloadDashboardData(employeeId, isManualRefresh);
    }
  };

  const forceRefreshAfterCheckInOut = async () => {
    setForceRefresh(true);
    if (employeeId) {
      // Clear cache and force immediate refresh
      await cache.remove(`employee_view_${employeeId}`);
      await preloadDashboardData(employeeId, true);
    }
  };

  const refreshQuoteOnly = async () => {
    try {
      // Clear quote cache
      await cache.remove('daily_quote');
      
      // Get new quote
      const newQuote = await apiClient.getMotivationalQuote();
      
      // Update only the quote in dashboard data
      setDashboardData(prev => ({
        ...prev,
        currentQuote: newQuote
      }));
      
      return newQuote;
    } catch (error) {
      console.error('Quote refresh failed:', error);
      throw error;
    }
  };

  return {
    ...dashboardData,
    refreshDashboardData,
    forceRefreshAfterCheckInOut,
    refreshQuoteOnly
  };
};