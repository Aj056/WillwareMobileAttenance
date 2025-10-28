import React, { useState, useEffect, useMemo } from 'react';
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
import { TabSafeContainer } from '../../components/ui/TabSafeContainer';
import { useMemoryCleanup } from '../../hooks/useMemoryCleanup';
import { useLoadingState, LoadingOverlay } from '../../components/LoadingComponents';
import { useDashboardPreloader } from '../../hooks/useDashboardPreloader';
import { Card } from '../../components/ui/Card';
import { Colors, Typography, Spacing, Theme } from '../../constants/theme';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/ToastProvider';
import { handleApiError, logError, withRetry } from '../../utils/errorHandling';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { loadingState, startLoading, stopLoading } = useLoadingState();
  const { showSuccess, showError, showWarning } = useToast();
  const [currentTime, setCurrentTime] = useState(moment());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    checkedInToday: 0,
    myTotalHours: '0:00',
    todayHours: '0:00'
  });

  // Use preloader for faster dashboard loading with smart caching
  const {
    employeeDetails,
    todayAttendance,
    currentQuote,
    isLoading: preloaderLoading,
    error: preloaderError,
    refreshDashboardData,
    forceRefreshAfterCheckInOut
  } = useDashboardPreloader(user?.id);

  // Memory cleanup
  useMemoryCleanup({
    onUnmount: () => {
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

  // Update dashboard stats when preloader finishes
  useEffect(() => {
    if (employeeDetails?.timelog && !preloaderLoading) {
      const timelog = employeeDetails.timelog || [];
      setDashboardStats({
        totalEmployees: 0,
        activeEmployees: 0,
        checkedInToday: 0,
        myTotalHours: calculateTotalHours(timelog),
        todayHours: calculateTodayHours(timelog)
      });
    }
  }, [employeeDetails, preloaderLoading]);

  // Show appropriate error toasts based on error type
  useEffect(() => {
    if (preloaderError) {
      if (preloaderError.includes('Server error')) {
        showError('Server error - Please try again later');
      } else if (preloaderError.includes('connection')) {
        showWarning('Connection issue - Data may be outdated');
      } else {
        showError('Data fetch failed - Please try refreshing');
      }
    }
  }, [preloaderError]);



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
  // Removed getTodayAttendance - now handled directly in renderCheckInStatus

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Manual refresh bypasses cache
      await refreshDashboardData(true);
      showSuccess('Attendance data refreshed');
    } catch (error) {
      showError('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };



  const handleCheckInOut = async () => {
    try {
      if (!user) {
        showError('User not found. Please log in again.');
        return;
      }

      // Show loading state
      startLoading('Processing check-in/out...');

      // Use memoized today's record to determine check-in/out action
      const isCheckedIn = !!(todayAttendanceRecord && todayAttendanceRecord.checkin && !todayAttendanceRecord.checkout);
      
      const action = isCheckedIn ? 'checkout' : 'checkin';
      console.log(`🔄 Performing ${action} for user:`, user.id);

      // Make API call with retry mechanism
      const response = await withRetry(
        () => isCheckedIn ? apiClient.checkOut(user.id) : apiClient.checkIn(user.id),
        2 // max 2 retries
      );

      if (response && response.message) {
        // Show success message first
        showSuccess(response.message);
        
        // Force refresh to get updated state immediately (bypasses cache)
        await forceRefreshAfterCheckInOut();
        
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

  // Memoize clock display to optimize rendering
  const clockDisplay = useMemo(() => ({
    time: currentTime.format('HH:mm:ss'),
    date: currentTime.format('dddd, MMMM Do YYYY')
  }), [currentTime.unix()]); // Only update when actual time changes (by second)

  const renderClock = () => (
    <Card style={styles.clockCard}>
      <View style={styles.clockContainer}>
        <Text style={styles.timeText}>
          {clockDisplay.time}
        </Text>
        <Text style={styles.dateText}>
          {clockDisplay.date}
        </Text>
      </View>
    </Card>
  );

  // Memoize today's attendance record to prevent excessive recalculation
  const todayAttendanceRecord = useMemo(() => {
    if (!employeeDetails?.timelog) return null;
    
    const today = moment().format('DD/MM/YYYY');
    const record = employeeDetails.timelog.find((log: any) => log.date === today);
    
    // Only log once when record changes, not on every render
    if (record) {
      console.log('📊 Today\'s attendance loaded:', { date: today, hours: record.totalhours, checkedIn: !!record.checkin, checkedOut: !!record.checkout });
    }
    
    return record;
  }, [employeeDetails?.timelog]);

  const renderCheckInStatus = () => {
    // Show loading or error state while waiting for API data
    if (preloaderLoading) {
      return (
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Ionicons name="hourglass-outline" size={24} color={Colors.textSecondary} />
              <Text style={[styles.statusText, { color: Colors.textSecondary }]}>
                Loading attendance...
              </Text>
            </View>
          </View>
        </Card>
      );
    }

    // Show error state if API failed and we have no cached data
    if (preloaderError && (!employeeDetails || !employeeDetails.timelog)) {
      return (
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Ionicons name="warning-outline" size={24} color={Colors.warning} />
              <Text style={[styles.statusText, { color: Colors.warning }]}>
                Unable to load attendance
              </Text>
            </View>
          </View>
          
          <Button
            text="Retry"
            variant="outline"
            icon="refresh"
            onPress={() => refreshDashboardData(true)}
            fullWidth
            style={styles.checkInButton}
          />
        </Card>
      );
    }

    // Don't show check-in section if we have no attendance data
    if (!employeeDetails || !employeeDetails.timelog) {
      return null;
    }

    // Use memoized today's record
    const todayRecord = todayAttendanceRecord;
    
    // Show status based on what API actually returned
    if (!todayRecord) {
      // No record for today - show Check In button
      return (
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Ionicons name="time-outline" size={24} color={Colors.warning} />
              <Text style={[styles.statusText, { color: Colors.warning }]}>
                Not Started
              </Text>
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.todayHours}>Hours: 0:00</Text>
            </View>
          </View>
          
          <Button
            text="Check In"
            variant="primary"
            icon="log-in"
            onPress={handleCheckInOut}
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
    }

    // We have today's record - show status based on check-in/out times
    const hasCheckedIn = !!todayRecord.checkin;
    const hasCheckedOut = !!todayRecord.checkout;
    
    const checkInTime = hasCheckedIn ? moment(todayRecord.checkin).format('hh:mm A') : null;
    const checkOutTime = hasCheckedOut ? moment(todayRecord.checkout).format('hh:mm A') : null;
    const totalHours = todayRecord.totalhours || '0:00';

    if (hasCheckedIn && hasCheckedOut) {
      // Completed for the day
      return (
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Ionicons name="checkmark-done-circle" size={24} color={Colors.info} />
              <Text style={[styles.statusText, { color: Colors.info }]}>
                Completed Today
              </Text>
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.smallTimeText}>In: {checkInTime}</Text>
              <Text style={styles.smallTimeText}>Out: {checkOutTime}</Text>
              <Text style={styles.todayHours}>Hours: {totalHours}</Text>
            </View>
          </View>
          
          <Button
            text="Completed"
            variant="secondary"
            icon="checkmark"
            onPress={() => {}}
            disabled={true}
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
    } else if (hasCheckedIn && !hasCheckedOut) {
      // Checked in, waiting for checkout
      return (
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text style={[styles.statusText, { color: Colors.success }]}>
                Checked In
              </Text>
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.smallTimeText}>In: {checkInTime}</Text>
              <Text style={styles.todayHours}>Hours: {totalHours}</Text>
            </View>
          </View>
          
          <Button
            text="Check Out"
            variant="danger"
            icon="log-out"
            onPress={handleCheckInOut}
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
    }

    return null; // Fallback
  };

  const refreshQuote = async () => {
    try {
      startLoading('Refreshing quote...');
      // Clear only quote cache - don't refresh attendance data
      const cacheManager = (await import('../../services/cacheManager')).default;
      const cache = cacheManager.getInstance();
      await cache.remove('daily_quote');
      
      // Get new quote without refreshing attendance data
      const newQuote = await apiClient.getMotivationalQuote();
      
      // Update only the quote in the dashboard data (if needed)
      showSuccess('Quote refreshed!');
    } catch (error) {
      showError('Failed to refresh quote');
    } finally {
      stopLoading();
    }
  };

  // Memoize quote processing to prevent recalculation on every render
  const processedQuote = useMemo(() => {
    // Fallback quotes when API fails
    const fallbackQuotes = [
      { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
      { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
      { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
      { text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.", author: "Steve Jobs" },
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" }
    ];

    if (currentQuote) {
      // Handle different quote API response formats
      return {
        text: currentQuote.text || currentQuote.Quote || fallbackQuotes[0].text,
        author: currentQuote.author || currentQuote.Author || fallbackQuotes[0].author,
        isOnline: true
      };
    } else {
      // Use random fallback quote when API fails (consistent until quote changes)
      const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
      return {
        text: fallbackQuotes[randomIndex].text,
        author: fallbackQuotes[randomIndex].author,
        isOnline: false
      };
    }
  }, [currentQuote]);

  const renderQuote = () => {

    return (
      <Card style={styles.quoteCard}>
        <TouchableOpacity onPress={refreshQuote} style={styles.quoteRefresh}>
          <Ionicons 
            name="refresh" 
            size={20} 
            color={processedQuote.isOnline ? Colors.textSecondary : Colors.warning} 
          />
        </TouchableOpacity>
        {!processedQuote.isOnline && (
          <View style={styles.offlineIndicator}>
            <Ionicons name="cloud-offline-outline" size={16} color={Colors.warning} />
            <Text style={styles.offlineText}>Offline Quote</Text>
          </View>
        )}
        <Text style={styles.quoteText}>&ldquo;{processedQuote.text}&rdquo;</Text>
        <Text style={styles.quoteAuthor}>— {processedQuote.author}</Text>
      </Card>
    );
  };

  // Dashboard Overview stats removed as requested
  
  return (
    <SafeAreaView style={styles.container}>
      <TabSafeContainer>
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
      </TabSafeContainer>
      
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

  // Offline indicator styles
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },

  offlineText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.warning,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
