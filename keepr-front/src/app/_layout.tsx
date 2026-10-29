import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AuthScreen from "../components/AuthScreen";
import OnboardingScreens from "../components/OnboardingScreens";
import StatusScreen from "../components/StatusScreen";

import { colors } from "../constants/theme";

import { AuthProvider, useAuth } from "../context/AuthContext";
import { NotificationPreferencesProvider } from "../context/NotificationPreferencesContext";
import { ProductsProvider, useProducts } from "../context/ProductsContext";

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Espera a que los productos carguen del servidor antes de mostrar la app. */
function ProductsGate({ children }: { children: React.ReactNode }) {
  const { status, errorMessage, reload } = useProducts();
  const { logout } = useAuth();

  if (status === "loading") {
    return <StatusScreen loading />;
  }

  if (status === "error") {
    return (
      <StatusScreen
        title="Couldn't load your products"
        message={errorMessage}
        actionLabel="Try again"
        onAction={reload}
        secondaryLabel="Log out"
        onSecondary={logout}
      />
    );
  }

  return <>{children}</>;
}

/** Decide qué mostrar: onboarding → iniciar sesión / registrarse → la app. */
function AppGate() {
  const { user, status, hasOnboarded, completeOnboarding, retry } = useAuth();

  // Mantiene el splash visible hasta saber si hay una sesión guardada.
  useEffect(() => {
    if (status !== "loading") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [status]);

  if (status === "loading") {
    return <StatusScreen loading />;
  }

  if (status === "unreachable") {
    return (
      <StatusScreen
        title="Can't reach Keepr"
        message="We couldn't connect to the server. Check your connection and that the server is running, then try again."
        actionLabel="Try again"
        onAction={retry}
      />
    );
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
    // Al cambiar de cuenta se descarta el estado del usuario anterior.
    <NotificationPreferencesProvider key={user.id}>
      <ProductsProvider key={user.id}>
        <ProductsGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="product/new" />
            <Stack.Screen name="product/[id]/index" />
            <Stack.Screen name="product/[id]/maintenance" />

            {/* Pantalla de configuración de notificaciones */}
            <Stack.Screen name="settings/notifications" />
          </Stack>
        </ProductsGate>
      </ProductsProvider>
    </NotificationPreferencesProvider>
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
