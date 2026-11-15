import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';
import { createTower, TowerRow } from './dragonTowerEngine';

interface GameProps {
  onWin: () => void;
  onLose: () => void;
}

const TOWER_ROWS = 7;
const MEMORIZE_DURATION = 6;
const LIGHT_PREVIEW_GREEN = '#86EFAC'; // Soft light pastel green for memorization
const LIGHT_PREVIEW_RED = '#FCA5A5';   // Soft light pastel red for memorization

export default function DragonTowerGame({ onWin, onLose }: GameProps) {
  const [tower, setTower] = useState<TowerRow[]>([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [gameState, setGameState] = useState<'MEMORIZING' | 'PLAYING' | 'WON' | 'LOST'>('MEMORIZING');
  const [memorizeTimeLeft, setMemorizeTimeLeft] = useState(MEMORIZE_DURATION);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const winTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startNewGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);

    setTower(createTower(TOWER_ROWS));
    setCurrentRow(0);
    setGameState('MEMORIZING');
    setMemorizeTimeLeft(MEMORIZE_DURATION);

    let remaining = MEMORIZE_DURATION;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setMemorizeTimeLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setGameState('PLAYING');
      }
    }, 1000);
  }, []);

  useEffect(() => {
    startNewGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
    };
  }, [startNewGame]);

  const handleTilePress = (rowIndex: number, colIndex: number) => {
    if (gameState !== 'PLAYING') return;
    if (rowIndex !== currentRow) return;

    const newTower = [...tower];
    const isSafe = !newTower[rowIndex].dragonIndices.includes(colIndex);

    newTower[rowIndex] = {
      ...newTower[rowIndex],
      revealed: true,
      selected: colIndex,
    };

    setTower(newTower);

    if (isSafe) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (currentRow === TOWER_ROWS - 1) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setGameState('WON');
        winTimeoutRef.current = setTimeout(onWin, 1000);
      } else {
        setCurrentRow(prev => prev + 1);
      }
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setGameState('LOST');
      restartTimeoutRef.current = setTimeout(() => {
        onLose();
        startNewGame();
      }, 800);
    }
  };

  const getSubtitle = () => {
    switch (gameState) {
      case 'MEMORIZING':
        return `Memorize the path (${memorizeTimeLeft}s)`;
      case 'PLAYING':
        return `Climb to the top (${currentRow + 1}/${TOWER_ROWS})`;
      case 'WON':
        return 'TOWER COMPLETE 🎉';
      case 'LOST':
        return 'DRAGON HIT! RESTARTING...';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TOWER CLIMB</Text>
        <Text style={styles.headerSubtitle}>{getSubtitle()}</Text>
      </View>

      <View style={styles.towerContainer}>
        <View style={styles.board}>
          {/* Render from top to bottom (row 6 down to row 0) */}
          {[...tower].reverse().map((rowObj, reversedIdx) => {
            const originalIdx = TOWER_ROWS - 1 - reversedIdx;
            const isCurrentRow = originalIdx === currentRow && gameState === 'PLAYING';
            const isPast = originalIdx < currentRow;
            const isMemorizing = gameState === 'MEMORIZING';

            const rowOpacity = isMemorizing
              ? 1
              : isCurrentRow || isPast || rowObj.revealed
              ? 1
              : 0.5;

            return (
              <View key={originalIdx} style={[styles.row, { opacity: rowOpacity }]}>
                {[0, 1, 2].map((colIndex) => {
                  const isSafe = !rowObj.dragonIndices.includes(colIndex);

                  let content = '';
                  let tileColor = '#0B1A3A';
                  const borderWidth = 0;

                  if (isMemorizing) {
                    // Show all safe in light green (egg) and wrong in light red (dragon)
                    content = isSafe ? '🥚' : '🐉';
                    tileColor = isSafe ? LIGHT_PREVIEW_GREEN : LIGHT_PREVIEW_RED;
                  } else if (isPast && rowObj.selected === colIndex) {
                    content = '🥚';
                    tileColor = Colors.dark.success;
                  } else if (gameState === 'LOST' && originalIdx === currentRow && rowObj.selected === colIndex) {
                    content = '🐉';
                    tileColor = Colors.dark.danger;
                  } else if (gameState === 'WON' && rowObj.selected === colIndex) {
                    content = '🥚';
                    tileColor = Colors.dark.success;
                  } else if (isCurrentRow) {
                    tileColor = '#8A2BE2'; // Purple for active row
                  }

                  return (
                    <Pressable
                      key={colIndex}
                      disabled={isMemorizing || gameState !== 'PLAYING' || originalIdx !== currentRow}
                      style={[styles.tile, { backgroundColor: tileColor, borderWidth }]}
                      onPress={() => handleTilePress(originalIdx, colIndex)}
                    >
                      <Text style={styles.tileText}>{content}</Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
    letterSpacing: 2,
  },
  headerSubtitle: {
    ...Typography.bodyLarge,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  towerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  board: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderColor: '#000000',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  tile: {
    width: 98,
    height: 56,
    borderRadius: Radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  tileText: {
    fontSize: 27,
    color: Colors.dark.text,
  }
});
