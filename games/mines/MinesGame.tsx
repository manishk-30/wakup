import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';
import { createMinesGrid, MineTile } from './minesEngine';

interface GameProps {
  onWin: () => void;
  onLose: () => void;
}

export default function MinesGame({ onWin, onLose }: GameProps) {
  const [grid, setGrid] = useState<MineTile[]>([]);
  const [safeCount, setSafeCount] = useState(0);
  const [gameState, setGameState] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');

  useEffect(() => {
    setGrid(createMinesGrid());
  }, []);

  const handleTilePress = (id: number) => {
    if (gameState !== 'PLAYING') return;
    
    const tile = grid.find(t => t.id === id);
    if (!tile || tile.isRevealed) return;

    const newGrid = grid.map(t => t.id === id ? { ...t, isRevealed: true } : t);
    setGrid(newGrid);

    if (tile.isMine) {
      setGameState('LOST');
      
      // Reveal all mines on loss
      setGrid(newGrid.map(t => t.isMine ? { ...t, isRevealed: true } : t));
      
      setTimeout(onLose, 1000);
    } else {
      const newSafeCount = safeCount + 1;
      setSafeCount(newSafeCount);
      
      if (newSafeCount === 5) {
        setGameState('WON');
        setTimeout(onWin, 1000);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MINES</Text>
        <Text style={styles.headerSubtitle}>
          {gameState === 'PLAYING' 
            ? `Find ${5 - safeCount} safe tiles` 
            : gameState === 'WON' ? 'SAFE! YOU WIN 🎉' : 'BOOM! YOU LOST'}
        </Text>
      </View>

      <View style={styles.board}>
        <View style={styles.gridContainer}>
          {[0, 1, 2, 3].map(rowIndex => (
            <View key={rowIndex} style={styles.row}>
              {grid.slice(rowIndex * 4, rowIndex * 4 + 4).map((tile) => (
                <Pressable
                  key={tile.id}
                  style={[
                    styles.tile, 
                    { 
                      backgroundColor: tile.isRevealed ? (tile.isMine ? Colors.dark.danger : Colors.dark.success) : 'rgba(255, 255, 255, 0.1)',
                      borderColor: tile.isRevealed ? (tile.isMine ? Colors.dark.danger : Colors.dark.success) : 'rgba(255, 255, 255, 0.2)'
                    }
                  ]}
                  onPress={() => handleTilePress(tile.id)}
                >
                  <Text style={styles.tileText}>
                    {tile.isRevealed ? (tile.isMine ? '💣' : '💎') : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
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
  board: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  gridContainer: {
    gap: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tile: {
    width: 65,
    height: 65,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tileText: {
    fontSize: 32,
    color: Colors.dark.text,
  }
});
