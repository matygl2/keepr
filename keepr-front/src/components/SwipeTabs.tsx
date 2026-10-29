// Deslizar a la izquierda o a la derecha para cambiar de pestaña.
// Quedan afuera Products (sus categorías y filas ya se deslizan de costado),
// Map (el dedo mueve el mapa) y Scan (abre la cámara).
import { useRouter, type Href } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-worklets';

export const SWIPE_ORDER = ['index', 'calendar', 'warranties', 'profile'];

export function getNextTab(current: string, step: 1 | -1): string | null {
  const index = SWIPE_ORDER.indexOf(current);
  if (index === -1) return null;
  return SWIPE_ORDER[index + step] ?? null;
}

function tabHref(routeName: string): Href {
  return (routeName === 'index' ? '/' : `/${routeName}`) as Href;
}

interface Props {
  routeName: string;
  children: React.ReactNode;
}

export default function SwipeTabs({ routeName, children }: Props) {
  const router = useRouter();

  const swipe = useMemo(() => {
    const go = (step: 1 | -1) => {
      const next = getNextTab(routeName, step);
      if (next) router.navigate(tabHref(next));
    };

    const toNext = Gesture.Fling()
      .direction(Directions.LEFT)
      .onStart(() => {
        runOnJS(go)(1);
      });

    const toPrevious = Gesture.Fling()
      .direction(Directions.RIGHT)
      .onStart(() => {
        runOnJS(go)(-1);
      });

    return Gesture.Race(toNext, toPrevious);
  }, [routeName, router]);

  if (!SWIPE_ORDER.includes(routeName)) {
    return <>{children}</>;
  }

  return (
    <GestureDetector gesture={swipe}>
      <View style={styles.fill} collapsable={false}>
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
