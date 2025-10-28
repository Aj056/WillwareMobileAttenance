import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ToastProvider } from '../components/ToastProvider';
import UpdateManager from '../components/UpdateManager';
import WillwareTechIntro from '../components/WillwareTechIntro';
import { Colors } from '../constants/theme';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading, showIntro, completeIntro } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Always call all hooks first (Rules of Hooks)
  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const currentPath = segments.join('/');

    if (!isAuthenticated && currentPath !== 'login') {
      // Redirect to login if not authenticated
      router.push('/login' as any);
    } else if (isAuthenticated && !inTabsGroup && currentPath !== 'modal') {
      // Redirect to main app if authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // Show intro loader after all hooks are called
  if (showIntro) {
    console.log('🚀 Showing WillwareTech intro animation...');
    return <WillwareTechIntro onComplete={completeIntro} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ 
        presentation: 'modal', 
        title: 'Modal',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
      }} />
    </Stack>
  );
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RootLayoutNav />
        <UpdateManager />
        <StatusBar style="auto" backgroundColor={Colors.surface} />
      </ToastProvider>
    </AuthProvider>
  );
}
