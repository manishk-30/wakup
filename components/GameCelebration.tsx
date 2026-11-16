import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#FFB000', // Gold/Sun
  '#FF4757', // Coral
  '#2ED573', // Mint Green
  '#1E90FF', // Sky Blue
  '#FFA502', // Orange
  '#9B59B6', // Purple
  '#FF69B4', // Hot Pink
];

interface ConfettiPieceProps {
  delay: number;
  startX: number;
  color: string;
  size: number;
}

function ConfettiPiece({ delay, startX, color, size }: ConfettiPieceProps) {
  const fallAnim = useRef(new Animated.Value(0)).current;
  const swingAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fallAnim, {
          toValue: height + 60,
          duration: 2400 + Math.random() * 800,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(swingAnim, {
              toValue: 24 + Math.random() * 20,
              duration: 350 + Math.random() * 200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(swingAnim, {
              toValue: -24 - Math.random() * 20,
              duration: 350 + Math.random() * 200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 600 + Math.random() * 400,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: startX,
          width: size,
          height: size * (Math.random() > 0.5 ? 1.4 : 1),
          backgroundColor: color,
          borderRadius: Math.random() > 0.5 ? size / 2 : 2,
          transform: [
            { translateY: fallAnim },
            { translateX: swingAnim },
            { rotateZ: spin },
            { rotateY: spin },
          ],
        },
      ]}
    />
  );
}

interface GameCelebrationProps {
  title?: string;
  subtitle?: string;
  onFinish?: () => void;
}

export default function GameCelebration({
  title = 'Challenge Completed!',
  subtitle = 'Alarm Beaten • Great Job!',
  onFinish,
}: GameCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const sunburstRotate = useRef(new Animated.Value(0)).current;

  // Generate 45 confetti pieces
  const pieces = useRef(
    Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      startX: Math.random() * width,
      delay: Math.random() * 600,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 8 + Math.random() * 8,
    }))
  ).current;

  useEffect(() => {
    // Pop in the banner
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotate sunburst
    Animated.loop(
      Animated.timing(sunburstRotate, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Call onFinish after celebration runs for ~2.6 seconds
    const timer = setTimeout(() => {
      onFinish?.();
    }, 2600);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sunSpin = sunburstRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[StyleSheet.absoluteFill, styles.celebrationWrapper]} pointerEvents="none">
      {/* Darkened overlay backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />

      {/* Confetti raining down */}
      {pieces.map((p) => (
        <ConfettiPiece
          key={p.id}
          delay={p.delay}
          startX={p.startX}
          color={p.color}
          size={p.size}
        />
      ))}

      {/* Center Hero Celebration Banner */}
      <View style={styles.centerContainer}>
        <Animated.View
          style={[
            styles.bannerCard,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Animated Sunburst */}
          <Animated.View style={[styles.sunContainer, { transform: [{ rotate: sunSpin }] }]}>
            <Text style={styles.sunEmoji}>☀️</Text>
          </Animated.View>

          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.subText}>{subtitle}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  celebrationWrapper: {
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 1,
  },
  confetti: {
    position: 'absolute',
    top: -30,
    zIndex: 9999,
  },
  centerContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10000,
  },
  bannerCard: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFB000',
    shadowColor: '#FFB000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  sunContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 176, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sunEmoji: {
    fontSize: 54,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
});

