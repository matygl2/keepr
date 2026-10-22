import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthScreen from '../components/AuthScreen';
import OnboardingScreens from '../components/OnboardingScreens';
import { colors } from '../constants/theme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ProductsProvider } from '../context/ProductsContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Decides what to show: onboarding → sign in / sign up → the app. */
function AppGate() {
  const { user, loading, hasOnboarded, completeOnboarding } = useAuth();

  // Keep the splash visible until the saved session has been read.
  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading]);

  if (loading) {
    return null;
  }

  if (!hasOnboarded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <OnboardingScreens onFinish={completeOnboarding} />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    // key={user.id}: switching accounts remounts the provider, so one
    // account's products never leak into another's.
    <ProductsProvider key={user.id} userId={user.id}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/new" />
        <Stack.Screen name="product/[id]/index" />
        <Stack.Screen name="product/[id]/maintenance" />
      </Stack>
    </ProductsProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
