import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { LoginCredentials } from '../types/api';

export default function LoginScreen() {
  const { login, isLoading, error, checkBiometricAuth, isBiometricEnabled } = useAuth();
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Clear field errors when user types
  useEffect(() => {
    if (fieldErrors.username && credentials.username) {
      setFieldErrors(prev => ({ ...prev, username: '' }));
    }
    if (fieldErrors.password && credentials.password) {
      setFieldErrors(prev => ({ ...prev, password: '' }));
    }
  }, [credentials, fieldErrors]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!credentials.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!credentials.password.trim()) {
      errors.password = 'Password is required';
    } else if (credentials.password.length < 4) {
      errors.password = 'Password must be at least 4 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await login(credentials, rememberMe);
    } catch (error) {
      // Error is handled by AuthContext and displayed via error state
      console.error('Login failed:', error);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const success = await checkBiometricAuth();
      if (success) {
        // For now, show success message. In production, you'd have stored credentials
        Alert.alert(
          'Biometric Authentication',
          'Biometric authentication successful! Please enter your credentials to complete login.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Authentication Failed',
          'Biometric authentication was cancelled or failed. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Biometric Error',
        'Biometric authentication is not available on this device.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderLogo = () => (
    <View style={styles.logoContainer}>
      <View style={styles.logoPlaceholder}>
        <Ionicons name="business" size={48} color={Colors.primary} />
      </View>
      <Text style={styles.companyName}>WillwareTech</Text>
      <Text style={styles.subtitle}>Employee Portal</Text>
    </View>
  );

  const renderForm = () => (
    <Card style={styles.formCard} padding="lg">
      <Text style={styles.welcomeText}>Welcome Back!</Text>
      <Text style={styles.instructionText}>Sign in to your employee account</Text>

      {/* Username Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Username</Text>
        <View style={[
          styles.inputContainer,
          fieldErrors.username && styles.inputError
        ]}>
          <Ionicons 
            name="person-outline" 
            size={20} 
            color={Colors.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.textInput}
            value={credentials.username}
            onChangeText={(text) => setCredentials(prev => ({ ...prev, username: text }))}
            placeholder="Enter your username"
            placeholderTextColor={Colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
        {fieldErrors.username && (
          <Text style={styles.errorText}>{fieldErrors.username}</Text>
        )}
      </View>

      {/* Password Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Password</Text>
        <View style={[
          styles.inputContainer,
          fieldErrors.password && styles.inputError
        ]}>
          <Ionicons 
            name="lock-closed-outline" 
            size={20} 
            color={Colors.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.textInput}
            value={credentials.password}
            onChangeText={(text) => setCredentials(prev => ({ ...prev, password: text }))}
            placeholder="Enter your password"
            placeholderTextColor={Colors.textSecondary}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.passwordToggle}
          >
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {fieldErrors.password && (
          <Text style={styles.errorText}>{fieldErrors.password}</Text>
        )}
      </View>

      {/* Remember Me */}
      <TouchableOpacity
        style={styles.rememberContainer}
        onPress={() => setRememberMe(!rememberMe)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
          {rememberMe && (
            <Ionicons name="checkmark" size={14} color={Colors.white} />
          )}
        </View>
        <Text style={styles.rememberText}>Remember me</Text>
      </TouchableOpacity>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={Colors.error} />
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      )}

      {/* Login Button */}
      <Button
        text="Sign In"
        onPress={handleLogin}
        loading={isLoading}
        disabled={isLoading}
        fullWidth
        style={styles.loginButton}
      />

      {/* Biometric Login */}
      {isBiometricEnabled && (
        <View style={styles.biometricContainer}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="finger-print" size={32} color={Colors.primary} />
            <Text style={styles.biometricText}>Use Biometric</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        Need help? Contact your administrator
      </Text>
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Loading message="Signing you in..." fullScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderLogo()}
          {renderForm()}
          {renderFooter()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContainer: {
    flexGrow: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },

  // Logo Section
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },

  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  companyName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },

  // Form Section
  formCard: {
    marginBottom: Spacing.xl,
  },

  welcomeText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },

  instructionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  // Form Fields
  fieldContainer: {
    marginBottom: Spacing.lg,
  },

  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },

  inputError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },

  inputIcon: {
    marginRight: Spacing.sm,
  },

  textInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },

  passwordToggle: {
    padding: Spacing.xs,
  },

  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },

  // Remember Me
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  rememberText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Error Container
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },

  errorMessage: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginLeft: Spacing.sm,
  },

  // Buttons
  loginButton: {
    marginBottom: Spacing.lg,
  },

  // Biometric Section
  biometricContainer: {
    alignItems: 'center',
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    width: '100%',
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },

  dividerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md,
  },

  biometricButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },

  biometricText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginTop: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },

  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  versionText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textDisabled,
  },
});