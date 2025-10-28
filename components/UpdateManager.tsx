import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import * as Updates from 'expo-updates';
import { Button } from './ui/Button';
import { Colors, Typography, Spacing } from '../constants/theme';

interface UpdateStatus {
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
  error: string | null;
}

export const UpdateManager: React.FC = () => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    isChecking: false,
    isDownloading: false,
    isUpdateAvailable: false,
    isUpdatePending: false,
    error: null,
  });

  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    checkForUpdates();
    
    // Check for updates every 30 minutes when app is active
    const interval = setInterval(checkForUpdates, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const checkForUpdates = async () => {
    if (!Updates.isEnabled) {
      console.log('Updates are not enabled in this build');
      return;
    }

    try {
      setUpdateStatus(prev => ({ ...prev, isChecking: true, error: null }));
      
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        setUpdateStatus(prev => ({ 
          ...prev, 
          isUpdateAvailable: true,
          isChecking: false 
        }));
        setShowUpdateModal(true);
      } else {
        setUpdateStatus(prev => ({ ...prev, isChecking: false }));
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      setUpdateStatus(prev => ({ 
        ...prev, 
        isChecking: false,
        error: 'Failed to check for updates'
      }));
    }
  };

  const downloadAndApplyUpdate = async () => {
    try {
      setUpdateStatus(prev => ({ ...prev, isDownloading: true, error: null }));
      
      const update = await Updates.fetchUpdateAsync();
      
      if (update.isNew) {
        setUpdateStatus(prev => ({ 
          ...prev, 
          isDownloading: false,
          isUpdatePending: true 
        }));
        
        Alert.alert(
          'Update Downloaded',
          'The update has been downloaded successfully. The app will restart to apply the update.',
          [
            {
              text: 'Restart Now',
              onPress: () => Updates.reloadAsync(),
            },
            {
              text: 'Later',
              style: 'cancel',
              onPress: () => {
                setShowUpdateModal(false);
                // The update will be applied next time the app starts
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error downloading update:', error);
      setUpdateStatus(prev => ({ 
        ...prev, 
        isDownloading: false,
        error: 'Failed to download update'
      }));
      
      Alert.alert(
        'Update Failed',
        'Failed to download the update. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const skipUpdate = () => {
    setShowUpdateModal(false);
    setUpdateStatus(prev => ({ ...prev, isUpdateAvailable: false }));
  };

  if (!Updates.isEnabled) {
    return null;
  }

  return (
    <>
      <Modal
        visible={showUpdateModal}
        transparent
        animationType="fade"
        onRequestClose={skipUpdate}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Available</Text>
            <Text style={styles.modalText}>
              A new version of WillwareTech Attendance is available. 
              This update includes bug fixes and improvements.
            </Text>
            
            {updateStatus.isDownloading && (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.progressText}>Downloading update...</Text>
              </View>
            )}
            
            {updateStatus.error && (
              <Text style={styles.errorText}>{updateStatus.error}</Text>
            )}
            
            <View style={styles.buttonContainer}>
              <Button
                text="Update Now"
                onPress={downloadAndApplyUpdate}
                disabled={updateStatus.isDownloading}
                style={styles.updateButton}
              />
              <Button
                text="Later"
                onPress={skipUpdate}
                variant="outline"
                disabled={updateStatus.isDownloading}
                style={styles.skipButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  modalText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  progressText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  updateButton: {
    flex: 1,
  },
  skipButton: {
    flex: 1,
  },
});

export default UpdateManager;