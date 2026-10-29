import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import SwipeTabs from '../../components/SwipeTabs';
import { colors } from '../../constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Íconos de @expo/vector-icons en vez de emojis: se ven igual en iPhone y Android.
// Pestaña activa: ícono lleno y verde; inactiva: contorno y gris (mismos colores que el texto).
function TabIcon({ icon, focused }: { icon: IconName; focused: boolean }) {
  const name = (focused ? icon : `${icon}-outline`) as IconName;
  return <Ionicons name={name} size={22} color={focused ? colors.secondary : colors.textMuted} />;
}

function ScanButton({ focused }: { focused: boolean }) {
  return (
    <View style={styles.scanButtonWrap}>
      <View style={[styles.scanButton, focused && styles.scanButtonFocused]}>
        <Ionicons name="scan" size={24} color={colors.white} />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      // Envuelve cada pestaña con el gesto de deslizar.
      screenLayout={({ route, children }) => (
        <SwipeTabs routeName={route.name}>{children}</SwipeTabs>
      )}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.textMuted,
        // Sin alto fijo: la librería suma sola la zona segura de abajo (rayita del iPhone /
        // barra de Android), así nada queda tapado por las esquinas curvas de la pantalla.
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="albums" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="calendar" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <ScanButton focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="map" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="warranties"
        options={{
          title: 'Warranties',
          // "Warranties" no entra en el ancho de una de las 7 pestañas.
          tabBarLabel: 'Warranty',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="shield-checkmark" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabItem: {
    // Por defecto cada pestaña pega el contenido arriba (flex-start); así queda centrado.
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  scanButtonWrap: {
    top: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  scanButtonFocused: {
    backgroundColor: colors.primaryDark,
  },
});
