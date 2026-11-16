import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, useWindowDimensions } from 'react-native';

interface PortraitContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}

export default function PortraitContainer({
  children,
  style,
  contentStyle,
  backgroundColor,
}: PortraitContainerProps) {
  const { width } = useWindowDimensions();
  const isWide = width > 480; // Only activates on unfolded display (626pt) or iPad (768pt+)

  return (
    <View style={[styles.outer, backgroundColor ? { backgroundColor } : null, style]}>
      <View style={[styles.inner, isWide && styles.centeredColumn, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    width: '100%',
  },
  inner: {
    flex: 1,
    width: '100%',
  },
  centeredColumn: {
    maxWidth: 440,
    alignSelf: 'center',
  },
});
