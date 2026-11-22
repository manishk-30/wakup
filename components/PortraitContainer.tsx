import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, useWindowDimensions } from 'react-native';

interface PortraitContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}

export function useIsFoldedCover() {
  const { width, height } = useWindowDimensions();
  // iPhone Duo / Fold cover display is 466 x 678 pt (aspect ratio ~1.455)
  return width <= 480 && (width >= 420 || (height > 0 && height / width < 1.72));
}

export default function PortraitContainer({
  children,
  style,
  contentStyle,
  backgroundColor,
}: PortraitContainerProps) {
  const { width } = useWindowDimensions();
  const isWide = width > 480; // Activates on unfolded display (626pt) or iPad (768pt+)
  const isFolded = useIsFoldedCover(); // Activates on folded cover display (466pt)

  return (
    <View style={[styles.outer, backgroundColor ? { backgroundColor } : null, style]}>
      <View
        style={[
          styles.inner,
          isWide && styles.centeredColumn,
          isFolded && styles.foldedCoverPadding,
          contentStyle,
        ]}
      >
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
  foldedCoverPadding: {
    paddingRight: 64, // Leaves right strip for camera cutout, clock, and Wi-Fi while keeping the current theme color edge-to-edge
  },
});
