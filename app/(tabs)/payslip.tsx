import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Loading } from '../../components/ui/Loading';
import { TabSafeContainer } from '../../components/ui/TabSafeContainer';
import { Colors, Typography, Spacing } from '../../constants/theme';
import apiClient from '../../services/apiClient';
import { PayslipResponse, MONTH_NAMES, MonthName } from '../../types/api';
import { useToast } from '../../components/ToastProvider';
import { handleApiError, logError, withRetry } from '../../utils/errorHandling';

export default function PayslipScreen() {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const [payslipData, setPayslipData] = useState<PayslipResponse['data'] | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(moment().month()); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(moment().year());
  const [isLoading, setIsLoading] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Load payslip data when month/year changes
  useEffect(() => {
    loadPayslip();
  }, [selectedMonth, selectedYear]);

  const loadPayslip = async () => {
    try {
      if (!user) {
        showError('User session expired. Please log in again.');
        return;
      }

      setIsLoading(true);
      
      // Clear any existing payslip data first
      setPayslipData(null);
      
      const monthName = MONTH_NAMES[selectedMonth] as MonthName;
      
      // Load with retry mechanism
      const response = await withRetry(
        () => apiClient.getPayslip(user.id, monthName, selectedYear.toString()),
        2
      );
      
      if (response.success) {
        setPayslipData(response.data);
        showSuccess(`Payslip loaded for ${monthName} ${selectedYear}`);
      } else {
        setPayslipData(null);
        showWarning(response.message || `No payslip found for ${monthName} ${selectedYear}`);
      }
    } catch (error) {
      const appError = handleApiError(error);
      logError(appError, 'Payslip loading');
      setPayslipData(null);
      showError(appError.message || 'Failed to load payslip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const handleOpenPayslipWebsite = async () => {
    try {
      if (!user) {
        showError('User session expired. Please log in again.');
        return;
      }

      // Get the selected month name in lowercase
      const monthName = moment().month(selectedMonth).format('MMMM').toLowerCase();
      
      // Build the payslip URL with parameters
      const payslipUrl = `https://willware-timesheet.vercel.app/payslip-download?empId=${user.id}&month=${monthName}&year=${selectedYear}`;
      
      console.log('Opening payslip URL:', payslipUrl);
      
      const supported = await Linking.canOpenURL(payslipUrl);
      if (supported) {
        await Linking.openURL(payslipUrl);
        showSuccess(`Opening payslip download for ${monthName} ${selectedYear}...`);
      } else {
        showError('Cannot open the payslip website. Please try again or contact support.');
      }
    } catch (error) {
      logError(error, 'Payslip browser redirect');
      showError('Failed to open the payslip download. Please check your internet connection.');
    }
  };

  const renderMonthSelector = () => {
    const monthName = moment().month(selectedMonth).format('MMMM');
    
    return (
      <Card style={styles.selectorCard}>
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.monthArrow}
            onPress={() => handleMonthChange('prev')}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.monthDisplay}>
            <Text style={styles.monthText}>{monthName}</Text>
            <Text style={styles.yearText}>{selectedYear}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.monthArrow}
            onPress={() => handleMonthChange('next')}
          >
            <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderPayslipHeader = () => {
    if (!payslipData) return null;

    return (
      <Card style={styles.headerCard}>
        <View style={styles.companyHeader}>
          <View style={styles.logoPlaceholder}>
            <Ionicons name="business" size={32} color={Colors.primary} />
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>WillwareTech</Text>
            <Text style={styles.payslipTitle}>Employee Payslip</Text>
          </View>
        </View>
        
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{payslipData.employeeName}</Text>
          <Text style={styles.employeeId}>ID: {payslipData.employeeId}</Text>
          <Text style={styles.department}>{payslipData.designation} - {payslipData.department}</Text>
          <Text style={styles.location}>{payslipData.workLocation}</Text>
        </View>
      </Card>
    );
  };

  const renderPayslipDetails = () => {
    if (!payslipData) return null;

    return (
      <View>
        {/* Work Summary */}
        <Card title="Work Summary" style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Days Worked:</Text>
            <Text style={styles.detailValue}>{payslipData.workedDays}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>LOP Days:</Text>
            <Text style={styles.detailValue}>{payslipData.lopDays}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Joining Date:</Text>
            <Text style={styles.detailValue}>
              {moment(payslipData.joiningDate).format('DD MMM YYYY')}
            </Text>
          </View>
        </Card>

        {/* Earnings */}
        <Card title="Earnings" style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Basic Pay:</Text>
            <Text style={styles.detailValue}>₹{payslipData.basicPay.toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>HRA:</Text>
            <Text style={styles.detailValue}>₹{payslipData.hra.toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Others:</Text>
            <Text style={styles.detailValue}>₹{payslipData.others.toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Incentive:</Text>
            <Text style={styles.detailValue}>₹{payslipData.incentive.toLocaleString()}</Text>
          </View>
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Earnings:</Text>
            <Text style={styles.totalValue}>₹{payslipData.totalEarnings.toLocaleString()}</Text>
          </View>
        </Card>

        {/* Deductions */}
        <Card title="Deductions" style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PF:</Text>
            <Text style={styles.detailValue}>₹{payslipData.pf.toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ESI:</Text>
            <Text style={styles.detailValue}>₹{payslipData.esi.toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>TDS:</Text>
            <Text style={styles.detailValue}>₹{payslipData.tds.toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Staff Advance:</Text>
            <Text style={styles.detailValue}>₹{payslipData.staffAdvance.toLocaleString()}</Text>
          </View>
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Deductions:</Text>
            <Text style={styles.totalValue}>₹{payslipData.totalDeductions.toLocaleString()}</Text>
          </View>
        </Card>

        {/* Net Pay */}
        <Card style={StyleSheet.flatten([styles.detailCard, styles.netPayCard])}>
          <View style={styles.netPayContainer}>
            <Text style={styles.netPayLabel}>Net Pay</Text>
            <Text style={styles.netPayAmount}>₹{payslipData.netPay.toLocaleString()}</Text>
            <Text style={styles.netPayWords}>{payslipData.amountWords}</Text>
            <Text style={styles.paymentMode}>Payment Mode: {payslipData.paymentMode}</Text>
          </View>
        </Card>

        {/* Bank Details */}
        <Card title="Bank Details" style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account Number:</Text>
            <Text style={styles.detailValue}>
              {payslipData.bankAccount ? 
                `****${payslipData.bankAccount.slice(-4)}` : 
                'Not Available'
              }
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>UAN:</Text>
            <Text style={styles.detailValue}>{payslipData.uan || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ESI Number:</Text>
            <Text style={styles.detailValue}>{payslipData.esiNumber || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PAN:</Text>
            <Text style={styles.detailValue}>{payslipData.pan || 'N/A'}</Text>
          </View>
        </Card>
      </View>
    );
  };

  const renderNoData = () => (
    <Card style={styles.noDataCard}>
      <View style={styles.noDataContainer}>
        <Ionicons name="document-outline" size={64} color={Colors.textDisabled} />
        <Text style={styles.noDataTitle}>No Payslip Available</Text>
        <Text style={styles.noDataText}>
          No payslip found for {moment().month(selectedMonth).format('MMMM')} {selectedYear}.
          Please try a different month or contact HR.
        </Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TabSafeContainer>
        <Text style={styles.title}>Payslip</Text>
        
        {renderMonthSelector()}
        
        {isLoading ? (
          <Loading message="Loading payslip..." />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {payslipData ? (
              <>
                {renderPayslipHeader()}
                {renderPayslipDetails()}
                
                <Button
                  text="Download PDF"
                  icon="download"
                  onPress={handleOpenPayslipWebsite}
                  fullWidth
                  style={styles.downloadButton}
                />
                
                <Text style={styles.downloadNote}>
                  Opens in browser to download your {moment().month(selectedMonth).format('MMMM')} {selectedYear} payslip
                </Text>
              </>
            ) : (
              renderNoData()
            )}
          </ScrollView>
        )}
      </TabSafeContainer>
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

  // Month Selector
  selectorCard: {
    marginBottom: Spacing.md,
  },

  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  monthArrow: {
    padding: Spacing.sm,
  },

  monthDisplay: {
    alignItems: 'center',
  },

  monthText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  yearText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },

  // Header Card
  headerCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
  },

  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },

  companyInfo: {
    flex: 1,
  },

  companyName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  payslipTitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },

  employeeInfo: {
    alignItems: 'center',
  },

  employeeName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  employeeId: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  department: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  location: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Detail Cards
  detailCard: {
    marginBottom: Spacing.md,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },

  detailLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    flex: 1,
  },

  detailValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    textAlign: 'right',
  },

  totalRow: {
    borderBottomWidth: 0,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },

  totalLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    flex: 1,
  },

  totalValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    textAlign: 'right',
  },

  // Net Pay Card
  netPayCard: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
  },

  netPayContainer: {
    alignItems: 'center',
  },

  netPayLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  netPayAmount: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },

  netPayWords: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },

  paymentMode: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // No Data
  noDataCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },

  noDataContainer: {
    alignItems: 'center',
  },

  noDataTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },

  noDataText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Download Button
  downloadButton: {
    marginTop: Spacing.lg,
  },

  downloadNote: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});