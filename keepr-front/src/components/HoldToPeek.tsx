// Toque y "mantener apretado" sobre una miniatura (Gesture Handler).
// - Toque: abre el documento.
// - Mantener apretado: vibra (expo-haptics) y muestra una vista rápida; al soltar se cierra.
// Exclusive: el toque simple solo se activa si el mantener apretado falla.
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-worklets';

interface Props {
  onTap: () => void;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
}

function vibrate() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export default function HoldToPeek({
  onTap,
  onHoldStart,
  onHoldEnd,
  accessibilityLabel,
  children,
}: Props) {
  const gesture = useMemo(() => {
    const hold = Gesture.LongPress()
      .minDuration(350)
      .maxDistance(15)
      .onStart(() => {
        runOnJS(vibrate)();
        runOnJS(onHoldStart)();
      })
      .onEnd((_e, success) => {
        // Solo si el mantener apretado llegó a activarse: si no, el toque no abre la vista rápida.
        if (success) runOnJS(onHoldEnd)();
      });

    const tap = Gesture.Tap().onEnd((_e, success) => {
      if (success) runOnJS(onTap)();
    });

    return Gesture.Exclusive(hold, tap);
  }, [onTap, onHoldStart, onHoldEnd]);

  return (
    <GestureDetector gesture={gesture}>
      {/* Accesibilidad: el gesto no es la única forma; el toque y el botón Change hacen lo mismo. */}
      <View accessible accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
        {children}
      </View>
    </GestureDetector>
  );
}
