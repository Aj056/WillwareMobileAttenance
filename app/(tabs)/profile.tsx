import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { Colors, Typography, Spacing } from '../../constants/theme';
import apiClient from '../../services/apiClient';
import { EmployeeDetailsResponse } from '../../types/api';
import { useToast } from '../../components/ToastProvider';
import { handleApiError, logError, withRetry } from '../../utils/errorHandling';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetailsResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load profile data
  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      if (!user) {
        showError('User session expired. Please log in again.');
        return;
      }

      setIsLoading(true);
      
      // Clear any existing data first
      setEmployeeDetails(null);
      
      // Load with retry mechanism
      const response = await withRetry(
        () => apiClient.getEmployeeView(user.id),
        2
      );
      
      // The /view/ API returns the employee data directly, not wrapped in a 'data' property
      if (response) {
        setEmployeeDetails(response);
      } else {
        throw new Error('No profile data received from server');
      }
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, 'Profile data loading');
      showError(appError.message || 'Failed to load profile data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProfileData();
    setIsRefreshing(false);
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

  const handleEditProfile = async () => {
    const editUrl = 'https://willware-timesheet.vercel.app/employee/profile';
    
    try {
      const supported = await Linking.canOpenURL(editUrl);
      if (supported) {
        await Linking.openURL(editUrl);
        showSuccess('Opening profile editor in browser...');
      } else {
        showError('Cannot open the editing website. Please try again or contact support.');
      }
    } catch (error) {
      logError(error, 'Profile edit browser redirect');
      showError('Failed to open the editing website. Please check your internet connection.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const renderUserData = () => {
    if (!employeeDetails) return null;

    return (
      <>
        {/* Header Card */}
        <Card style={styles.profileCard}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {employeeDetails.employeeName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{employeeDetails.employeeName}</Text>
              <Text style={styles.userEmail}>{employeeDetails.employeeEmail}</Text>
              <Text style={styles.userId}>ID: {employeeDetails._id}</Text>
            </View>
          </View>

          <Button
            text="Edit Profile"
            variant="outline"
            icon="create"
            onPress={handleEditProfile}
            fullWidth
            style={styles.editButton}
          />
        </Card>

        {/* Basic Information */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Username:</Text>
            <Text style={styles.dataValue}>{employeeDetails.username || 'N/A'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Designation:</Text>
            <Text style={styles.dataValue}>{employeeDetails.designation || 'N/A'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Department:</Text>
            <Text style={styles.dataValue}>{employeeDetails.department || 'N/A'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Role:</Text>
            <Text style={styles.dataValue}>{employeeDetails.role || 'N/A'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Joining Date:</Text>
            <Text style={styles.dataValue}>{formatDate(employeeDetails.joinDate)}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Status:</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.dataValue}>
                {employeeDetails.status ? 'Active' : 'Inactive'}
              </Text>
              <View style={[
                styles.statusDot, 
                { backgroundColor: employeeDetails.status ? Colors.success : Colors.warning }
              ]} />
            </View>
          </View>
        </Card>

        {/* Contact Information */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Phone:</Text>
            <Text style={styles.dataValue}>{employeeDetails.phone || 'N/A'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Work Location:</Text>
            <Text style={styles.dataValue}>{employeeDetails.workLocation || 'N/A'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Address:</Text>
            <Text style={[styles.dataValue, styles.addressText]}>
              {employeeDetails.address || 'N/A'}
            </Text>
          </View>
        </Card>

        {/* Financial Information */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Financial & Statutory Details</Text>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Bank Account:</Text>
            <Text style={styles.dataValue}>
              {employeeDetails.bankAccount ? 
                `****${employeeDetails.bankAccount.slice(-4)}` : 
                'N/A'
              }
            </Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>UAN Number:</Text>
            <Text style={styles.dataValue}>{employeeDetails.uanNumber || 'N/A'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>ESI Number:</Text>
            <Text style={styles.dataValue}>{employeeDetails.esiNumber || 'N/A'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>PAN Number:</Text>
            <Text style={styles.dataValue}>{employeeDetails.panNumber || 'N/A'}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Resource Type:</Text>
            <Text style={styles.dataValue}>{employeeDetails.resourceType || 'N/A'}</Text>
          </View>
        </Card>

        {/* Recent Attendance */}
        {employeeDetails.timelog && employeeDetails.timelog.length > 0 && (
          <Card style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Recent Attendance</Text>
            
            {employeeDetails.timelog.slice(0, 3).map((log: any, index: number) => (
              <View key={index} style={styles.attendanceRow}>
                <View style={styles.attendanceDate}>
                  <Text style={styles.dateText}>{log.date}</Text>
                </View>
                <View style={styles.attendanceDetails}>
                  <Text style={styles.timeText}>
                    In: {log.checkin ? new Date(log.checkin).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }) : 'N/A'}
                  </Text>
                  <Text style={styles.timeText}>
                    Out: {log.checkout ? new Date(log.checkout).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }) : 'N/A'}
                  </Text>
                  <Text style={styles.hoursText}>Hours: {log.totalhours || 'N/A'}</Text>
                </View>
              </View>
            ))}
            
            {employeeDetails.timelog.length > 3 && (
              <Text style={styles.moreText}>
                + {employeeDetails.timelog.length - 3} more records
              </Text>
            )}
          </Card>
        )}
      </>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading message="Loading profile..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {employeeDetails ? renderUserData() : (
          <Card style={styles.profileCard}>
            <View style={styles.emptyState}>
              <Ionicons name="person-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>Loading Profile...</Text>
              <Text style={styles.emptyStateText}>
                Pull down to refresh if data doesn&apos;t load
              </Text>
            </View>
          </Card>
        )}
        
        <Card style={styles.logoutCard}>
          <Button
            text="Logout"
            variant="danger"
            icon="log-out"
            onPress={handleLogout}
            fullWidth
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  profileCard: {
    marginBottom: Spacing.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
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

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  userEmail: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },

  userId: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  dataSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },

  dataLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    flex: 1,
  },

  dataValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },

  logoutCard: {
    marginTop: Spacing.md,
  },

  editButton: {
    marginTop: Spacing.md,
  },

  infoCard: {
    marginBottom: Spacing.md,
  },

  addressText: {
    textAlign: 'right',
  },

  attendanceRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },

  attendanceDate: {
    flex: 1,
    justifyContent: 'center',
  },

  dateText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },

  attendanceDetails: {
    flex: 2,
    paddingLeft: Spacing.md,
  },

  timeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },

  hoursText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary,
  },

  moreText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },

  emptyStateTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },

  emptyStateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});