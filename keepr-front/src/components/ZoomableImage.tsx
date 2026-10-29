// Foto a pantalla completa: pellizcar para zoom (1x a 5x), arrastrar, doble toque
// para volver al tamaño original y un toque para cerrar.
import { Image, type ImageSource } from 'expo-image';
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

const MIN_SCALE = 1;
const MAX_SCALE = 5;

interface Props {
  source: ImageSource;
  onClose: () => void;
}

export default function ZoomableImage({ source, onClose }: Props) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const gestures = useMemo(() => {
    const pinch = Gesture.Pinch()
      .onUpdate((e) => {
        // Se multiplica sobre la escala guardada; si se asigna, la foto salta.
        scale.value = Math.min(Math.max(savedScale.value * e.scale, MIN_SCALE), MAX_SCALE);
      })
      .onEnd(() => {
        savedScale.value = scale.value;
        if (scale.value === MIN_SCALE) {
          x.value = withSpring(0);
          y.value = withSpring(0);
        }
      });

    const pan = Gesture.Pan()
      .averageTouches(true)
      .onBegin(() => {
        startX.value = x.value;
        startY.value = y.value;
      })
      .onUpdate((e) => {
        if (scale.value <= MIN_SCALE) return; // sin zoom no hay nada que mover
        x.value = startX.value + e.translationX;
        y.value = startY.value + e.translationY;
      });

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(250)
      .onStart(() => {
        scale.value = withSpring(1);
        savedScale.value = 1;
        x.value = withSpring(0);
        y.value = withSpring(0);
      });

    const singleTap = Gesture.Tap().onEnd((_e, success) => {
      if (success) runOnJS(onClose)();
    });

    // El toque simple espera a que falle el doble.
    const manipulate = Gesture.Simultaneous(pan, pinch);
    const taps = Gesture.Exclusive(doubleTap, singleTap);
    return Gesture.Race(manipulate, taps);
  }, [onClose, scale, savedScale, x, y, startX, startY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gestures}>
      <Animated.View
        style={[styles.fill, animatedStyle]}
        accessibilityLabel="Receipt photo. Pinch to zoom, double tap to reset, tap to close."
      >
        <Image source={source} style={styles.fill} contentFit="contain" cachePolicy="disk" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: '100%',
  },
});
