import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';
import { createTower, TowerRow } from './dragonTowerEngine';

interface GameProps {
  onWin: () => void;
  onLose: () => void;
}

const TOWER_ROWS = 7;

export default function DragonTowerGame({ onWin, onLose }: GameProps) {
  const [tower, setTower] = useState<TowerRow[]>([]);
  const [currentRow, setCurrentRow] = useState(0);
  const [gameState, setGameState] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');

  useEffect(() => {
    setTower(createTower(TOWER_ROWS));
  }, []);

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
      if (currentRow === TOWER_ROWS - 1) {
        setGameState('WON');
        setTimeout(onWin, 1000);
      } else {
        setCurrentRow(currentRow + 1);
      }
    } else {
      setGameState('LOST');
      setTimeout(onLose, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DRAGON TOWER</Text>
        <Text style={styles.headerSubtitle}>
          {gameState === 'PLAYING' ? 'Tap and pick safe tile to climb' : gameState === 'WON' ? 'TOWER COMPLETE 🎉' : 'THE DRAGON GOT YOU'}
        </Text>
      </View>

      <View style={styles.towerContainer}>
        <View style={styles.board}>
          {/* Render from top to bottom (row 7 to 0) */}
          {[...tower].reverse().map((rowObj, reversedIdx) => {
          const originalIdx = TOWER_ROWS - 1 - reversedIdx;
          const isCurrentRow = originalIdx === currentRow && gameState === 'PLAYING';
          const isPast = originalIdx < currentRow;
          
          return (
            <View key={originalIdx} style={[styles.row, { opacity: isCurrentRow || isPast || rowObj.revealed ? 1 : 0.5 }]}>
              {[0, 1, 2].map((colIndex) => {
                const isSelected = rowObj.selected === colIndex;
                const isSafe = !rowObj.dragonIndices.includes(colIndex);
                
                let content = '';
                let tileColor = '#0B1A3A';
                let borderWidth = 0;
                
                if (rowObj.revealed && isSelected) {
                  content = isSafe ? '🥚' : '🐉';
                  tileColor = isSafe ? Colors.dark.success : Colors.dark.danger;
                } else if (gameState === 'LOST' && isSafe && rowObj.revealed === false) {
                  // Show where the safe path was on lose
                  content = '🥚';
                  tileColor = Colors.dark.success;
                } else if (isCurrentRow) {
                  tileColor = '#8A2BE2'; // Purple for active row
                }

                return (
                  <Pressable
                    key={colIndex}
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
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
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
    marginTop: Spacing.sm,
  },
  towerContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  board: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderColor: '#000000',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tile: {
    width: 105,
    height: 60,
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
    fontSize: 28,
    color: Colors.dark.text,
  }
});
