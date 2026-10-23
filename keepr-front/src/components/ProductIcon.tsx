import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../constants/theme';

interface Props {
  icon: string;
  size?: number;
}

export default function ProductIcon({ icon, size = 56 }: Props) {
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: radius.md },
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
