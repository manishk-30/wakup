import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Typography, Radii } from '../../constants/theme';
import {
  generateSundokuPuzzle,
  SundokuPuzzle,
  REGION_COLORS,
} from './sundokuEngine';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_SIZE = 6;
const GAP_SIZE = 4; // Small, consistent white gap
// Responsively compute board dimensions:
// Fits screen width (with 24px safety margins) AND screen height (up to 46% of height)
// so Header + Rules + 6x6 Board fits on ANY iPhone without overlapping Dynamic Island or bottom nav
const maxBoardFromWidth = Math.min(SCREEN_WIDTH - 36, 380);
const maxBoardFromHeight = Math.min(SCREEN_HEIGHT * 0.46, 380);
const BOARD_SIZE = Math.floor(Math.min(maxBoardFromWidth, maxBoardFromHeight));
const CELL_SIZE = Math.floor(
  (BOARD_SIZE - GAP_SIZE * (GRID_SIZE + 1)) / GRID_SIZE
);

const STORAGE_ACTIVE_PUZZLE = '@wakup_sundoku_active';
const DOUBLE_TAP_WINDOW = 320; // Generous window to ensure double-taps never miss
const SINGLE_TAP_DELAY = 230; // Crisp single-tap response time

type CellState = 'empty' | 'cross' | 'sun';

interface SundokuGameProps {
  onWin: () => void;
  onLose: () => void;
  gameState?: 'PLAYING' | 'WON' | 'LOST';
}

// Elegant, refined minimalist exclusion cross mark with smooth rounded pill caps
function ElegantCross({
  size = 20,
  color = '#EF4444',
}: {
  size?: number;
  color?: string;
}) {
  const barThickness = Math.max(2.6, Math.round(size * 0.15));
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: size,
          height: barThickness,
          backgroundColor: color,
          borderRadius: barThickness / 2,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size,
          height: barThickness,
          backgroundColor: color,
          borderRadius: barThickness / 2,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
}

// Memoized individual cell component with native spring animation for 120 FPS buttery-smooth performance
const SudokuCell = React.memo(
  function SudokuCell({
    row,
    col,
    cellColor,
    state,
    cellSize,
    onPress,
  }: {
    row: number;
    col: number;
    cellColor: string;
    state: CellState;
    cellSize: number;
    onPress: (r: number, c: number) => void;
  }) {
    const scaleAnim = useRef(new Animated.Value(state === 'empty' ? 0.3 : 1)).current;

    useEffect(() => {
      if (state !== 'empty') {
        scaleAnim.setValue(0.3);
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 160,
          useNativeDriver: true,
        }).start();
      }
    }, [state, scaleAnim]);

    return (
      <Pressable
        unstable_pressDelay={0}
        hitSlop={2}
        style={({ pressed }) => [
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
            backgroundColor: cellColor,
            transform: [{ scale: pressed ? 0.92 : 1 }],
          },
        ]}
        onPress={() => onPress(row, col)}
      >
        {state === 'sun' && (
          <Animated.Text
            style={[
              styles.sunEmoji,
              {
                fontSize: Math.round(cellSize * 0.54),
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            ☀️
          </Animated.Text>
        )}
        {state === 'cross' && (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <ElegantCross size={Math.round(cellSize * 0.42)} color="#EF4444" />
          </Animated.View>
        )}
      </Pressable>
    );
  },
  (prev, next) =>
    prev.state === next.state &&
    prev.cellColor === next.cellColor &&
    prev.cellSize === next.cellSize
);

const MINI_SYMBOL_CELL_BG = '#9C6E48'; // Rich warm caramel tone for symbol cells (matching reference)
const MINI_EMPTY_CELL_BG = '#E4D5C7';  // Soft warm light beige for empty/other color cells
const MINI_CROSS_COLOR = '#FFFFFF';    // Crisp white cross for maximum contrast and polish

function MiniGridRuleOne() {
  return (
    <View style={styles.miniIllustrationBox}>
      <View style={styles.miniBoard}>
        {/* Row 0: 3 crossed boxes in same color region */}
        <View style={styles.miniGridRow}>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
        </View>
        {/* Row 1: X, 1 Sun in same color region, 1 empty in different color */}
        <View style={styles.miniGridRow}>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <Text style={{ fontSize: 8, lineHeight: 10 }}>☀️</Text>
          </View>
          <View style={[styles.miniCell, { backgroundColor: MINI_EMPTY_CELL_BG }]} />
        </View>
        {/* Row 2: X, 2 empty boxes in different color */}
        <View style={styles.miniGridRow}>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
          <View style={[styles.miniCell, { backgroundColor: MINI_EMPTY_CELL_BG }]} />
          <View style={[styles.miniCell, { backgroundColor: MINI_EMPTY_CELL_BG }]} />
        </View>
      </View>
    </View>
  );
}

function MiniGridRuleTwo() {
  return (
    <View style={styles.miniIllustrationBox}>
      <View style={styles.miniBoard}>
        {/* Row 0: X, Sun at (0,1), X */}
        <View style={styles.miniGridRow}>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <Text style={{ fontSize: 8, lineHeight: 10 }}>☀️</Text>
          </View>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
        </View>
        {/* Row 1: empty, X along column 1, empty */}
        <View style={styles.miniGridRow}>
          <View style={[styles.miniCell, { backgroundColor: MINI_EMPTY_CELL_BG }]} />
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
          <View style={[styles.miniCell, { backgroundColor: MINI_EMPTY_CELL_BG }]} />
        </View>
        {/* Row 2: empty, X along column 1, empty */}
        <View style={styles.miniGridRow}>
          <View style={[styles.miniCell, { backgroundColor: MINI_EMPTY_CELL_BG }]} />
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
          <View style={[styles.miniCell, { backgroundColor: MINI_EMPTY_CELL_BG }]} />
        </View>
      </View>
    </View>
  );
}

function MiniGridRuleThree() {
  return (
    <View style={styles.miniIllustrationBox}>
      <View style={styles.miniBoard}>
        {/* Row 0: all 3 crossed */}
        <View style={styles.miniGridRow}>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
        </View>
        {/* Row 1: X, Sun in center, X */}
        <View style={styles.miniGridRow}>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <Text style={{ fontSize: 8, lineHeight: 10 }}>☀️</Text>
          </View>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
        </View>
        {/* Row 2: all 3 crossed */}
        <View style={styles.miniGridRow}>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
          <View style={[styles.miniCell, { backgroundColor: MINI_SYMBOL_CELL_BG }]}>
            <ElegantCross size={6} color={MINI_CROSS_COLOR} />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function SundokuGame({ onWin, onLose: _onLose }: SundokuGameProps) {
  const [puzzle, setPuzzle] = useState<SundokuPuzzle | null>(null);
  const [gridState, setGridState] = useState<CellState[][]>(
    Array.from({ length: 6 }, () => new Array(6).fill('empty'))
  );
  const [chances, setChances] = useState(3);
  const [isWon, setIsWon] = useState(false);

  const placedSunsCount = useMemo(() => {
    let count = 0;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (gridState[r][c] === 'sun') count++;
      }
    }
    return count;
  }, [gridState]);

  const remainingSuns = Math.max(0, 6 - placedSunsCount);

  // Synchronous refs to guarantee latest state in all callbacks and timeouts
  const gridStateRef = useRef<CellState[][]>(gridState);
  gridStateRef.current = gridState;
  const chancesRef = useRef<number>(chances);
  chancesRef.current = chances;

  // Animations
  const errorAnim = useRef(new Animated.Value(0)).current;

  // Pending single-tap timeout per cell (prevents cross flashing before double-tap sun)
  const pendingTapTimeoutRef = useRef<{ [key: string]: any }>({});
  // Timestamp tracker per cell for 100% reliable double-tap detection
  const lastTapRef = useRef<{ [key: string]: number }>({});

  // Initialize or restore active puzzle
  useEffect(() => {
    initPuzzle();
    return () => {
      Object.values(pendingTapTimeoutRef.current).forEach(t => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initPuzzle = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_ACTIVE_PUZZLE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.puzzle && parsed.gridState && parsed.chances > 0) {
          setPuzzle(parsed.puzzle);
          setGridState(parsed.gridState);
          setChances(parsed.chances);
          return;
        }
      }
    } catch (e) {
      void e;
      // ignore
    }

    startNewPuzzle();
  };

  const startNewPuzzle = (excludeId?: string) => {
    Object.values(pendingTapTimeoutRef.current).forEach(t => clearTimeout(t));
    pendingTapTimeoutRef.current = {};
    lastTapRef.current = {};

    const newPuz = generateSundokuPuzzle(excludeId);
    const newGrid: CellState[][] = Array.from({ length: 6 }, () =>
      new Array(6).fill('empty')
    );
    setPuzzle(newPuz);
    setGridState(newGrid);
    setChances(3);
    setIsWon(false);
    savePuzzleState(newPuz, newGrid, 3);
  };

  const savePuzzleState = (
    puz: SundokuPuzzle,
    gState: CellState[][],
    ch: number
  ) => {
    AsyncStorage.setItem(
      STORAGE_ACTIVE_PUZZLE,
      JSON.stringify({ puzzle: puz, gridState: gState, chances: ch })
    ).catch(e => console.log('[Sundoku] Storage write error:', e));
  };

  const clearSavedState = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_ACTIVE_PUZZLE);
    } catch (e) {
      void e;
    }
  };

  const triggerErrorShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(errorAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(errorAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(errorAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(errorAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(errorAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // Robust tap handler:
  // - Single tap places or toggles a cross.
  // - Double tap tests for sun placement.
  // - If double tap is incorrect, it places a cross permanently, triggers error shake, and never disappears.
  const handleCellPress = (row: number, col: number) => {
    if (!puzzle || isWon || chancesRef.current <= 0) return;

      const currentState = gridStateRef.current[row][col];
      // Locked sun cannot be altered
      if (currentState === 'sun') return;

      const key = `${row}_${col}`;
      const now = Date.now();
      const lastTap = lastTapRef.current[key] || 0;
      const diff = now - lastTap;

      // Double-tap detected (either pending timer is active or taps arrived within window)
      if (pendingTapTimeoutRef.current[key] || (diff > 0 && diff < DOUBLE_TAP_WINDOW)) {
        if (pendingTapTimeoutRef.current[key]) {
          clearTimeout(pendingTapTimeoutRef.current[key]);
          delete pendingTapTimeoutRef.current[key];
        }
        lastTapRef.current[key] = 0; // Reset tap tracker for this cell

        const isCorrectSun = puzzle.suns[row] === col;

        if (isCorrectSun) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setGridState(prev => {
            const updated = prev.map((r, rIdx) =>
              rIdx === row ? r.map((c, cIdx) => (cIdx === col ? 'sun' : c)) : r
            );
            gridStateRef.current = updated;
            savePuzzleState(puzzle, updated, chancesRef.current);

            let sunCount = 0;
            for (let r = 0; r < 6; r++) {
              for (let c = 0; c < 6; c++) {
                if (updated[r][c] === 'sun') sunCount++;
              }
            }

            if (sunCount === 6) {
              setIsWon(true);
              clearSavedState();
              setTimeout(onWin, 350);
            }
            return updated;
          });
        } else {
          // Incorrect sun placement: error feedback, dock chance, and permanently mark with cross
          triggerErrorShake();
          const nextChances = Math.max(0, chancesRef.current - 1);
          setChances(nextChances);
          chancesRef.current = nextChances;

          setGridState(prev => {
            const updated = prev.map((r, rIdx) =>
              rIdx === row ? r.map((c, cIdx) => (cIdx === col ? ('cross' as CellState) : c)) : r
            );
            gridStateRef.current = updated;
            savePuzzleState(puzzle, updated, nextChances);
            return updated;
          });

          if (nextChances <= 0) {
            clearSavedState();
            // Automatically restart with a fresh puzzle without asking
            setTimeout(() => {
              startNewPuzzle(puzzle?.id);
            }, 600);
          }
        }
        return;
      }

      // Tap 1 on this cell: record timestamp and schedule single-tap action
      lastTapRef.current[key] = now;
      pendingTapTimeoutRef.current[key] = setTimeout(() => {
        delete pendingTapTimeoutRef.current[key];
        // Allow a small grace period for lastTapRef so a slower tap 2 is still
        // recognized as a double tap and immediately upgrades to a Sun
        setTimeout(() => {
          if (lastTapRef.current[key] === now) {
            lastTapRef.current[key] = 0;
          }
        }, DOUBLE_TAP_WINDOW - SINGLE_TAP_DELAY);

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        setGridState(prev => {
          const current = prev[row][col];
          if (current === 'sun') return prev;
          const nextState: CellState = current === 'cross' ? 'empty' : 'cross';
          const updated = prev.map((r, rIdx) =>
            rIdx === row ? r.map((c, cIdx) => (cIdx === col ? nextState : c)) : r
          );
          gridStateRef.current = updated;
          savePuzzleState(puzzle, updated, chancesRef.current);
          return updated;
        });
      }, SINGLE_TAP_DELAY);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        canCancelContentTouches={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header & Rules Section */}
        <View style={styles.topSection}>
          {/* Centered Title with Top Gap */}
          <View style={styles.titleContainer}>
            <Text style={styles.gameTitle}>Sundoku ☀️</Text>
          </View>

          {/* Compact In-Game Rules Section with 3 Sub-Cards */}
          <View style={styles.rulesCard}>
            <View style={styles.rulesRow}>
              {/* Card 1: 1 Sun per color */}
              <View style={styles.ruleSegmentCard}>
                <MiniGridRuleOne />
                <View style={styles.ruleTextContainer}>
                  <Text style={styles.ruleSegmentText}>1 Sun per</Text>
                  <Text style={styles.ruleSegmentText}>color</Text>
                </View>
              </View>

              {/* Card 2: 1 Sun per column and row */}
              <View style={styles.ruleSegmentCard}>
                <MiniGridRuleTwo />
                <View style={styles.ruleTextContainer}>
                  <Text style={styles.ruleSegmentText}>1 Sun per</Text>
                  <Text style={styles.ruleSegmentText}>column and</Text>
                  <Text style={styles.ruleSegmentText}>row</Text>
                </View>
              </View>

              {/* Card 3: Suns cannot touch */}
              <View style={styles.ruleSegmentCard}>
                <MiniGridRuleThree />
                <View style={styles.ruleTextContainer}>
                  <Text style={styles.ruleSegmentText}>Suns cannot</Text>
                  <Text style={styles.ruleSegmentText}>touch</Text>
                </View>
              </View>
            </View>

            {/* Micro instruction pill */}
            <View style={styles.instructionPill}>
              <Text style={styles.instructionPillText}>
                👆 Tap: <Text style={{ color: '#EF4444', fontWeight: '800' }}>✕ mark</Text>  •  ✌️ Double tap: <Text style={{ color: '#F59E0B', fontWeight: '800' }}>☀️ place sun</Text>
              </Text>
            </View>
          </View>

          {/* Status Row: Chances (Hearts) & Suns Remaining (side-by-side below rules) */}
          <View style={styles.statusRow}>
            {/* Chances with Heart Symbols */}
            <View style={styles.statusPill}>
              <Text style={styles.statusLabel}>Chances:</Text>
              <View style={styles.statusIconsRow}>
                {[1, 2, 3].map(heartIdx => {
                  const active = heartIdx <= chances;
                  return (
                    <Text
                      key={heartIdx}
                      style={[
                        styles.heartIcon,
                        { opacity: active ? 1 : 0.25, transform: [{ scale: active ? 1 : 0.85 }] },
                      ]}
                    >
                      ❤️
                    </Text>
                  );
                })}
              </View>
            </View>

            {/* Suns Remaining Counter */}
            <View style={styles.statusPill}>
              <Text style={styles.statusLabel}>Suns left:</Text>
              <View style={styles.statusIconsRow}>
                <Text style={styles.sunsCountText}>{remainingSuns}</Text>
                <Text style={styles.sunIconMini}>☀️</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 6x6 Board - Rounded Solid Pastel Square Boxes with White Gaps */}
        {puzzle && (
          <Animated.View
            style={[
              styles.boardContainer,
              { transform: [{ translateX: errorAnim }] },
            ]}
          >
            <View style={styles.boardCard}>
              <View style={styles.gridContainer}>
                {Array.from({ length: 6 }).map((_, r) => (
                  <View key={`row_${r}`} style={styles.gridRow}>
                    {Array.from({ length: 6 }).map((_, c) => (
                      <SudokuCell
                        key={`cell_${r}_${c}`}
                        row={r}
                        col={c}
                        cellColor={REGION_COLORS[puzzle.regions[r][c]]}
                        state={gridState[r][c]}
                        cellSize={CELL_SIZE}
                        onPress={handleCellPress}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Win state handles interaction lockout while universal celebration runs */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gameTitle: {
    ...Typography.h2,
    fontSize: 24,
    color: '#F8FAFC',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  rulesCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 7,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
    marginRight: 6,
  },
  statusIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heartIcon: {
    fontSize: 13,
  },
  sunsCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  sunIconMini: {
    fontSize: 14,
  },
  rulesRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 5,
  },
  ruleSegmentCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#263346',
    gap: 4,
    minHeight: 46,
  },
  miniIllustrationBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBoard: {
    backgroundColor: '#3E2D1D',
    padding: 1.5,
    borderRadius: 3.5,
    gap: 1.5,
  },
  miniGridRow: {
    flexDirection: 'row',
    gap: 1.5,
  },
  miniCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniSunText: {
    fontSize: 8,
    lineHeight: 10,
  },
  ruleTextContainer: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  ruleSegmentText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 11.5,
  },
  instructionPill: {
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 176, 0, 0.08)',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 0, 0.2)',
    alignItems: 'center',
  },
  instructionPillText: {
    fontSize: 11.5,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  boardContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardCard: {
    backgroundColor: '#FFFFFF',
    padding: GAP_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  gridContainer: {
    gap: GAP_SIZE,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GAP_SIZE,
  },
  cell: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunEmoji: {
    textAlign: 'center',
  },
  newPuzzleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radii.full,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  newPuzzleButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
});
