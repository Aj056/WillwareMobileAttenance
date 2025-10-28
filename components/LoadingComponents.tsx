import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

const theme = Theme;

interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

interface UseLoadingStateReturn {
  loadingState: LoadingState;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  updateProgress: (progress: number) => void;
  setLoadingMessage: (message: string) => void;
}

export const useLoadingState = (initialMessage?: string): UseLoadingStateReturn => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: initialMessage
  });

  const startLoading = useCallback((message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      message: message || prev.message
    }));
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      progress: undefined
    }));
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress))
    }));
  }, []);

  const setLoadingMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      message
    }));
  }, []);

  return {
    loadingState,
    startLoading,
    stopLoading,
    updateProgress,
    setLoadingMessage
  };
};

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  progress?: number;
  transparent?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message,
  progress,
  transparent = false
}) => {
  if (!visible) return null;

  return (
    <View style={[
      styles.overlay,
      { backgroundColor: transparent ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.7)' }
    ]}>
      <View style={styles.container}>
        <ActivityIndicator 
          size="large" 
          color={theme.colors.primary} 
          style={styles.spinner}
        />
        
        {message && (
          <Text style={styles.message}>{message}</Text>
        )}
        
        {typeof progress === 'number' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}
      </View>
    </View>
  );
};

interface InlineLoadingProps {
  visible: boolean;
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  visible,
  message,
  size = 'small',
  color = theme.colors.primary
}) => {
  if (!visible) return null;

  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={[styles.inlineMessage, { color }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  children,
  loadingText = 'Loading...',
  disabled = false
}) => {
  return (
    <View style={[
      styles.buttonContainer,
      (loading || disabled) && styles.buttonDisabled
    ]}>
      {loading ? (
        <View style={styles.buttonContent}>
          <ActivityIndicator 
            size="small" 
            color={theme.colors.surface}
            style={styles.buttonSpinner}
          />
          <Text style={styles.buttonText}>{loadingText}</Text>
        </View>
      ) : (
        children
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 24,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  spinner: {
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.background,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  inlineMessage: {
    marginLeft: 8,
    fontSize: 14,
  },
  buttonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  buttonSpinner: {
    marginRight: 8,
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

// Helper hook for async operations with loading states
export const useAsyncOperation = () => {
  const { loadingState, startLoading, stopLoading, setLoadingMessage } = useLoadingState();

  const executeAsync = useCallback(async (
    operation: () => Promise<any>,
    loadingMessage?: string
  ): Promise<any> => {
    try {
      startLoading(loadingMessage);
      const result = await operation();
      stopLoading();
      return result;
    } catch (error) {
      stopLoading();
      throw error;
    }
  }, [startLoading, stopLoading]);

  return {
    loadingState,
    executeAsync,
    setLoadingMessage
  };
};