import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { Picker } from '@react-native-picker/picker';

import { useAuth } from '../../contexts/AuthContext';

import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { Colors, Typography, Spacing, Theme } from '../../constants/theme';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/ToastProvider';
import { handleApiError, logError, withRetry } from '../../utils/errorHandling';
import { router } from 'expo-router';

interface AttendanceRecord {
  date: string;
  checkin: string;
  checkout: string;
  totalhours: string;
  autocheckout: boolean;
  _id: string;
}

interface AttendanceStats {
  totalRecords: number;
  presentDays: number;
  totalHours: string;
  avgHoursPerDay: string;
}

export default function AttendanceLogsScreen() {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1); // moment months are 0-indexed
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<AttendanceStats>({
    totalRecords: 0,
    presentDays: 0,
    totalHours: '00:00',
    avgHoursPerDay: '00:00'
  });

  // Load data on component mount and when month/year changes
  useEffect(() => {
    loadAttendanceData();
  }, [selectedMonth, selectedYear]);

  const loadAttendanceData = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        showError('User session expired. Please log in again.');
        return;
      }

      // Load attendance logs for selected month/year with retry
      const response = await withRetry(
        () => apiClient.getAttendanceLogs(user.id, selectedMonth, selectedYear),
        2
      );
      
      const logs = response.data || [];
      setAttendanceData(logs);
      
      // Calculate statistics
      calculateStats(logs);

      if (logs.length === 0) {
        showWarning(`No attendance records found for ${selectedMonth}/${selectedYear}`);
      } else {
        showSuccess(`Loaded ${logs.length} attendance records`);
      }

      setIsLoading(false);
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, 'Attendance logs loading');
      showError(appError.message || 'Failed to load attendance logs. Please try again.');
      setIsLoading(false);
    }
  };

  const calculateStats = (logs: AttendanceRecord[]) => {
    const totalRecords = logs.length;
    const presentDays = logs.filter(log => log.checkin).length;
    
    // Calculate total hours
    let totalMinutes = 0;
    logs.forEach(log => {
      if (log.totalhours && log.totalhours !== '00:00') {
        const [hours, minutes] = log.totalhours.split(':').map(Number);
        totalMinutes += (hours * 60) + minutes;
      }
    });
    
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const totalHoursString = `${totalHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
    
    // Calculate average hours per day
    const avgMinutes = presentDays > 0 ? totalMinutes / presentDays : 0;
    const avgHours = Math.floor(avgMinutes / 60);
    const avgRemainingMinutes = Math.floor(avgMinutes % 60);
    const avgHoursString = `${avgHours.toString().padStart(2, '0')}:${avgRemainingMinutes.toString().padStart(2, '0')}`;
    
    setStats({
      totalRecords,
      presentDays,
      totalHours: totalHoursString,
      avgHoursPerDay: avgHoursString
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAttendanceData();
    setIsRefreshing(false);
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    return moment(timeString).format('hh:mm A');
  };

  const formatDate = (dateString: string) => {
    const date = moment(dateString, 'DD/MM/YYYY');
    return {
      dayName: date.format('ddd').toUpperCase(),
      dayDate: date.format('DD MMM YYYY'),
      fullDay: date.format('dddd')
    };
  };

  const getMonthName = (month: number) => {
    return moment().month(month - 1).format('MMMM');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        <Text style={styles.backButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={styles.title}>My Attendance Records</Text>
      <Text style={styles.subtitle}>View your check-in and check-out times</Text>
    </View>
  );

  const renderFilters = () => (
    <Card style={styles.filtersCard}>
      <View style={styles.filtersRow}>
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Month:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedMonth}
              onValueChange={(itemValue) => setSelectedMonth(itemValue)}
              style={styles.picker}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <Picker.Item
                  key={i + 1}
                  label={moment().month(i).format('MMMM')}
                  value={i + 1}
                />
              ))}
            </Picker>
          </View>
        </View>
        
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Year:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedYear}
              onValueChange={(itemValue) => setSelectedYear(itemValue)}
              style={styles.picker}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = moment().year() - 2 + i;
                return (
                  <Picker.Item
                    key={year}
                    label={year.toString()}
                    value={year}
                  />
                );
              })}
            </Picker>
          </View>
        </View>
      </View>
    </Card>
  );

  const renderStats = () => (
    <Card style={styles.statsCard}>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalRecords}</Text>
          <Text style={styles.statLabel}>Total Records</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.presentDays}</Text>
          <Text style={styles.statLabel}>Present Days</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalHours}</Text>
          <Text style={styles.statLabel}>Total Hours</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.avgHoursPerDay}</Text>
          <Text style={styles.statLabel}>Avg Hours/Day</Text>
        </View>
      </View>
    </Card>
  );

  const renderAttendanceList = () => (
    <Card style={styles.listCard}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          Attendance Records - {getMonthName(selectedMonth)} {selectedYear}
        </Text>
        <Text style={styles.listSubtitle}>Detailed check-in and check-out records</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.dateColumn]}>Date</Text>
        <Text style={[styles.tableHeaderText, styles.timeColumn]}>Check In</Text>
        <Text style={[styles.tableHeaderText, styles.timeColumn]}>Check Out</Text>
        <Text style={[styles.tableHeaderText, styles.hoursColumn]}>Total Hours</Text>
        <Text style={[styles.tableHeaderText, styles.statusColumn]}>Status</Text>
      </View>

      {attendanceData.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyStateText}>No attendance records found</Text>
          <Text style={styles.emptyStateSubtext}>
            No records for {getMonthName(selectedMonth)} {selectedYear}
          </Text>
        </View>
      ) : (
        attendanceData.map((record, index) => {
          const dateInfo = formatDate(record.date);
          return (
            <View key={record._id} style={styles.tableRow}>
              <View style={styles.dateColumn}>
                <Text style={styles.dayName}>{dateInfo.dayName}</Text>
                <Text style={styles.dateText}>{dateInfo.dayDate}</Text>
                <Text style={styles.fullDayText}>{dateInfo.fullDay}</Text>
              </View>
              
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>{formatTime(record.checkin)}</Text>
              </View>
              
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>
                  {record.checkout ? formatTime(record.checkout) : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.hoursColumn}>
                <Text style={styles.hoursText}>{record.totalhours}</Text>
              </View>
              
              <View style={styles.statusColumn}>
                <Text style={styles.statusText}>Manual</Text>
              </View>
            </View>
          );
        })
      )}
    </Card>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading message="Loading attendance records..." />
      </SafeAreaView>
    );
  }

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
        {renderTitle()}
        {renderFilters()}
        {renderStats()}
        {renderAttendanceList()}
      </ScrollView>
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

  header: {
    marginBottom: Spacing.lg,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },

  backButtonText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },

  titleContainer: {
    marginBottom: Spacing.lg,
  },

  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },

  filtersCard: {
    marginBottom: Spacing.md,
  },

  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },

  filterItem: {
    flex: 1,
  },

  filterLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.surface,
  },

  picker: {
    height: 50,
  },

  statsCard: {
    marginBottom: Spacing.md,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },

  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  listCard: {
    marginBottom: Spacing.md,
  },

  listHeader: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  listTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  listSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  tableHeader: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  tableHeaderText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },

  dateColumn: {
    flex: 2,
    paddingRight: Spacing.sm,
  },

  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },

  hoursColumn: {
    flex: 1,
    alignItems: 'center',
  },

  statusColumn: {
    flex: 1,
    alignItems: 'center',
  },

  dayName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },

  dateText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginTop: 2,
  },

  fullDayText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  timeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },

  hoursText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },

  statusText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },

  emptyStateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },

  emptyStateSubtext: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});