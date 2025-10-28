import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { router } from 'expo-router';

import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { useMemoryCleanup } from '../../hooks/useMemoryCleanup';
import { useLoadingState, LoadingOverlay } from '../../components/LoadingComponents';
import { Card } from '../../components/ui/Card';
import { Colors, Typography, Spacing, Theme } from '../../constants/theme';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/ToastProvider';
import { handleApiError, logError, withRetry } from '../../utils/errorHandling';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { loadingState, startLoading, stopLoading } = useLoadingState();
  const { showSuccess, showError, showWarning } = useToast();
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [currentQuote, setCurrentQuote] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(moment());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    checkedInToday: 0,
    myTotalHours: '0:00',
    todayHours: '0:00'
  });
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  // Memory cleanup
  useMemoryCleanup({
    onUnmount: () => {
      setEmployeeDetails(null);
      setCurrentQuote(null);
      setDashboardStats({ totalEmployees: 0, activeEmployees: 0, checkedInToday: 0, myTotalHours: '0:00', todayHours: '0:00' });
    },
  });

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

    const loadDashboardData = async () => {
    try {
      startLoading('Loading dashboard...');
      
      if (!user?.id) {
        showError('User session expired. Please log in again.');
        return;
      }

      // Load required data in parallel with retry mechanism
      const [employeeViewData, quoteData] = await Promise.allSettled([
        withRetry(() => apiClient.getEmployeeView(user.id), 2),
        withRetry(() => apiClient.getRandomQuote(), 1) // Less critical, fewer retries
      ]);

      // Handle employee data
      if (employeeViewData.status === 'fulfilled') {
        const data = employeeViewData.value;
        
        // Set dashboard statistics for hours display only
        setDashboardStats({
          totalEmployees: 0, // Not used anymore
          activeEmployees: 0, // Not used anymore
          checkedInToday: 0, // Not used anymore
          myTotalHours: calculateTotalHours(data.timelog || []),
          todayHours: calculateTodayHours(data.timelog || [])
        });

        // Set employee details and today's attendance
        setEmployeeDetails(data);
        setTodayAttendance(getTodayAttendance(data.timelog || []));
      } else {
        const error = handleApiError(employeeViewData.reason);
        logError(error, 'Employee data loading');
        showError('Failed to load employee data. Please try again.');
      }

      // Handle quote data (non-critical)
      if (quoteData.status === 'fulfilled') {
        setCurrentQuote(quoteData.value);
      } else {
        logError(quoteData.reason, 'Quote loading');
        // Don't show error for quotes as it's not critical
      }

      stopLoading();
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, 'Dashboard data loading');
      showError('Failed to load dashboard. Please check your connection and try again.');
      stopLoading();
    }
  };

  // Helper function to calculate total working hours
  const calculateTotalHours = (timelog: any[]) => {
    if (!timelog || timelog.length === 0) return '0:00';
    
    let totalMinutes = 0;
    timelog.forEach(log => {
      if (log.totalhours) {
        const [hours, minutes] = log.totalhours.split(':').map(Number);
        totalMinutes += (hours * 60) + minutes;
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  // Helper function to calculate today's hours
  const calculateTodayHours = (timelog: any[]) => {
    const today = moment().format('DD/MM/YYYY');
    const todayLog = timelog.find(log => log.date === today);
    return todayLog?.totalhours || '0:00';
  };

  // Helper function to get today's attendance
  const getTodayAttendance = (timelog: any[]) => {
    const today = moment().format('DD/MM/YYYY');
    return timelog.find(log => log.date === today) || null;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const calculateWorkingHours = (timelog: any[]) => {
    const today = moment().format('YYYY-MM-DD');
    const thisWeekStart = moment().startOf('week');
    const thisMonthStart = moment().startOf('month');

    let todayHours = 0;
    let weekHours = 0;
    let monthHours = 0;

    timelog.forEach((log) => {
      const logDate = moment(log.date);
      const hours = parseFloat(log.totalhours || '0');

      if (log.date === today) {
        todayHours = hours;
      }

      if (logDate.isSameOrAfter(thisWeekStart)) {
        weekHours += hours;
      }

      if (logDate.isSameOrAfter(thisMonthStart)) {
        monthHours += hours;
      }
    });

    // Working hours are now handled in loadDashboardData via dashboardStats
  };

  const handleCheckInOut = async () => {
    try {
      if (!user) {
        showError('User not found. Please log in again.');
        return;
      }

      // Show loading state
      startLoading('Processing check-in/out...');

      // Determine if user is currently checked in based on today's attendance
      const today = moment().format('DD/MM/YYYY');
      const todayRecord = employeeDetails?.timelog?.find((log: any) => log.date === today);
      const isCheckedIn = !!(todayRecord && todayRecord.checkin && !todayRecord.checkout);
      
      const action = isCheckedIn ? 'checkout' : 'checkin';
      console.log(`Performing ${action} for user:`, user.id);

      // Make API call with retry mechanism
      const response = await withRetry(
        () => isCheckedIn ? apiClient.checkOut(user.id) : apiClient.checkIn(user.id),
        2 // max 2 retries
      );

      if (response.message) {
        // Clear cache to ensure fresh data
        await clearDashboardCache();
        
        // Update UI immediately with optimistic update
        if (response.timelog && response.timelog.length > 0) {
          const newRecord = response.timelog[0];
          updateEmployeeDetailsOptimistically(newRecord);
        }
        
        // Show success message with toast
        showSuccess(response.message);
        
        // Then refresh all dashboard data in background
        setTimeout(async () => {
          try {
            await loadDashboardData();
          } catch (refreshError) {
            logError(refreshError, 'Dashboard refresh after check-in/out');
            showWarning('Data refreshed but some information may be outdated');
          }
        }, 500);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, 'Check-in/out operation');
      showError(appError.message);
    } finally {
      stopLoading();
    }
  };

  // Helper function to clear dashboard cache
  const clearDashboardCache = async () => {
    try {
      // Clear relevant cache entries
      const cacheManager = (await import('../../services/cacheManager')).default;
      const cache = cacheManager.getInstance();
      
      if (user) {
        await cache.remove(`employee_view_${user.id}`);
        await cache.remove('all_employees_dashboard');
        await cache.remove('dashboard_stats');
        // Also invalidate any patterns that might be related
        await cache.invalidatePattern(user.id.toString());
      }
    } catch (error) {
      console.log('Cache clear failed:', error);
    }
  };

  // Optimistic UI update
  const updateEmployeeDetailsOptimistically = (newRecord: any) => {
    if (!employeeDetails) return;
    
    const today = moment().format('DD/MM/YYYY');
    const updatedTimelog = [...(employeeDetails.timelog || [])];
    
    // Find existing record for today
    const existingIndex = updatedTimelog.findIndex((log: any) => log.date === today);
    
    if (existingIndex >= 0) {
      // Update existing record with new data
      updatedTimelog[existingIndex] = { 
        ...updatedTimelog[existingIndex], 
        ...newRecord,
        date: today // Ensure date is preserved
      };
    } else {
      // Add new record at the beginning
      updatedTimelog.unshift({
        ...newRecord,
        date: today
      });
    }
    
    // Update employee details state immediately
    setEmployeeDetails({
      ...employeeDetails,
      timelog: updatedTimelog
    });
    
    console.log('Optimistically updated employee details with new record:', newRecord);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout 
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>Welcome back,</Text>
          <Text style={styles.userFullName}>{user?.name || 'User'}</Text>
          <Text style={styles.userRole}>{user?.designation || 'Employee'}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderClock = () => (
    <Card style={styles.clockCard}>
      <View style={styles.clockContainer}>
        <Text style={styles.timeText}>
          {currentTime.format('HH:mm:ss')}
        </Text>
        <Text style={styles.dateText}>
          {currentTime.format('dddd, MMMM Do YYYY')}
        </Text>
      </View>
    </Card>
  );

  const renderCheckInStatus = () => {
    const isCheckedIn = !!(todayAttendance && todayAttendance.checkin && !todayAttendance.checkout);
    const hasCheckedOut = !!(todayAttendance && todayAttendance.checkout);
    const statusColor = isCheckedIn ? Colors.success : hasCheckedOut ? Colors.info : Colors.warning;
    const statusIcon = isCheckedIn ? 'checkmark-circle' : hasCheckedOut ? 'checkmark-done-circle' : 'time-outline';
    const statusText = isCheckedIn ? 'Checked In' : hasCheckedOut ? 'Completed Today' : 'Not Started';

    const checkInTime = todayAttendance?.checkin ? moment(todayAttendance.checkin).format('hh:mm A') : null;
    const checkOutTime = todayAttendance?.checkout ? moment(todayAttendance.checkout).format('hh:mm A') : null;

    return (
      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusInfo}>
            <Ionicons name={statusIcon} size={24} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
          <View style={styles.timeInfo}>
            {checkInTime && (
              <Text style={styles.smallTimeText}>In: {checkInTime}</Text>
            )}
            {checkOutTime && (
              <Text style={styles.smallTimeText}>Out: {checkOutTime}</Text>
            )}
            <Text style={styles.todayHours}>
              Hours: {dashboardStats.todayHours}
            </Text>
          </View>
        </View>
        
        <Button
          text={isCheckedIn ? 'Check Out' : hasCheckedOut ? 'Completed' : 'Check In'}
          variant={isCheckedIn ? 'danger' : hasCheckedOut ? 'secondary' : 'primary'}
          icon={isCheckedIn ? 'log-out' : hasCheckedOut ? 'checkmark' : 'log-in'}
          onPress={hasCheckedOut ? () => {} : handleCheckInOut}
          disabled={hasCheckedOut}
          fullWidth
          style={styles.checkInButton}
        />
        
        <Button
          text="View All Records"
          variant="outline"
          icon="calendar"
          onPress={() => router.push('/logs')}
          fullWidth
          style={styles.viewRecordsButton}
        />
      </Card>
    );
  };

  const renderQuote = () => {
    if (!currentQuote) return null;

    return (
      <Card style={styles.quoteCard}>
        <TouchableOpacity onPress={loadDashboardData} style={styles.quoteRefresh}>
          <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.quoteText}>&ldquo;{currentQuote.text || currentQuote.Quote}&rdquo;</Text>
        <Text style={styles.quoteAuthor}>— {currentQuote.author || currentQuote.Author}</Text>
      </Card>
    );
  };

  // Dashboard Overview stats removed as requested
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderClock()}
        {renderCheckInStatus()}
        {renderQuote()}
      </ScrollView>
      
      <LoadingOverlay 
        visible={loadingState.isLoading}
        message={loadingState.message}
        transparent={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },

  avatarText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },

  userDetails: {
    flex: 1,
  },

  userName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  userFullName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
  },

  userRole: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  logoutButton: {
    padding: Spacing.sm,
  },

  // Clock Card
  clockCard: {
    marginBottom: Spacing.md,
  },

  clockContainer: {
    alignItems: 'center',
  },

  timeText: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },

  dateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },

  // Status Card
  statusCard: {
    marginBottom: Spacing.md,
  },

  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    marginLeft: Spacing.sm,
  },

  todayHours: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },

  timeInfo: {
    alignItems: 'flex-end',
  },

  smallTimeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },

  checkInButton: {
    marginTop: Spacing.sm,
  },

  // Quote Card
  quoteCard: {
    marginBottom: Spacing.md,
    position: 'relative',
  },

  quoteRefresh: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 1,
  },

  quoteText: {
    fontSize: Typography.fontSize.base,
    fontStyle: 'italic',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    paddingRight: Spacing.xl,
  },

  quoteAuthor: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Stats Card
  statsCard: {
    marginBottom: Spacing.md,
  },

  // Removed duplicate - using new one below

  statItem: {
    alignItems: 'center',
  },

  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },

  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Stats Grid
  statsContainer: {
    marginBottom: Spacing.lg,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },

  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
    ...Theme.shadows.sm,
  },

  // Team Stats
  teamStatsContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Theme.borderRadius.md,
    ...Theme.shadows.sm,
  },

  teamStatsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  teamStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  teamStatItem: {
    alignItems: 'center',
  },

  teamStatValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },

  teamStatLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },

  viewRecordsButton: {
    marginTop: Spacing.sm,
  },
});
