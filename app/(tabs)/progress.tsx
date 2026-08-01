import { useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';
import { storageService } from '../../services/storageService';

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  const [streakDays, setStreakDays] = useState<string[]>([]);
  const [streakLength, setStreakLength] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const calendarRef = useRef<View>(null);

  const loadStreaks = async () => {
    const days = await storageService.getStreakDays();
    const length = await storageService.getStreakLength();
    setStreakDays(days);
    setStreakLength(length);
  };

  useFocusEffect(
    useCallback(() => {
      loadStreaks();
    }, [])
  );

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthName = today.toLocaleString('default', { month: 'long' });

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month); // 0 (Sun) to 6 (Sat)
  
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Format date to YYYY-MM-DD
  const formatDate = (dayNum: number) => {
    const mStr = (month + 1).toString().padStart(2, '0');
    const dStr = dayNum.toString().padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  };

  const shareCalendar = async () => {
    try {
      setIsSharing(true);
      // Small delay to ensure UI updates if needed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      alert("Note: To use the share feature, the iOS app must be rebuilt on your Mac to include the new react-native-view-shot native code.");
      
      // Temporarily disabled until native rebuild:
      /*
      const { captureRef } = require('react-native-view-shot');
      const localUri = await captureRef(calendarRef, {
        format: 'png',
        quality: 1,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(localUri, {
          dialogTitle: 'Check out my Wakeup streak!',
          mimeType: 'image/png',
        });
      }
      */
    } catch (e) {
      console.error('Failed to capture and share', e);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Your Progress</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Keep waking up on time.</Text>
      </View>
      
      <View style={styles.content}>
        
        {/* We wrap the streak header and calendar in a single ref for the snapshot */}
        {/* Using a solid background ensures the snapshot isn't transparent */}
        <View 
          ref={calendarRef} 
          style={{ width: '100%', alignItems: 'center', backgroundColor: theme.background, padding: Spacing.md, borderRadius: Radii.xl }}
        >
          {/* Streak Header */}
          <View style={styles.streakHeader}>
            <Text style={styles.streakFlame}>☀️</Text>
            <Text style={[styles.streakNumber, { color: theme.primary }]}>{streakLength}</Text>
            <Text style={[styles.streakLabel, { color: theme.textMuted }]}>Day Streak</Text>
          </View>

          {/* Monthly Calendar View */}
          <View style={[styles.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.calendarTitle, { color: theme.text }]}>{monthName} {year}</Text>
          
          {/* Days of Week Header */}
          <View style={styles.weekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <View key={`header-${index}`} style={styles.dayColumn}>
                <Text style={[styles.dayName, { color: theme.textMuted }]}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.gridContainer}>
            {calendarDays.map((dayNum, index) => {
              if (dayNum === null) {
                return <View key={`empty-${index}`} style={styles.dayBox} />;
              }
              
              const dayStr = formatDate(dayNum);
              const isStreak = streakDays.includes(dayStr);
              const isToday = dayNum === today.getDate();
              
              return (
                <View key={`day-${dayNum}`} style={styles.dayBox}>
                  <View style={[
                    styles.dayCircle,
                    isStreak ? { backgroundColor: 'rgba(250, 204, 21, 0.2)', borderColor: 'rgba(250, 204, 21, 0.5)' } 
                    : isToday ? { borderColor: theme.primary, borderWidth: 1 } 
                    : { borderColor: 'transparent', borderWidth: 1 }
                  ]}>
                    {isStreak ? (
                      <Text style={styles.sunSymbol}>☀️</Text>
                    ) : (
                      <Text style={[
                        styles.dayNumText, 
                        { color: isToday ? theme.primary : theme.textMuted },
                        isToday && { fontWeight: 'bold' }
                      ]}>
                        {dayNum}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          </View>
        </View>

        <Pressable 
          style={[styles.sharePillButton, { backgroundColor: theme.primary }]}
          onPress={shareCalendar}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="share-outline" size={20} color="#FFF" />
              <Text style={styles.sharePillText}>Share Progress</Text>
            </>
          )}
        </Pressable>

        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          Wake up to your next alarm to keep your streak alive.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    fontSize: 36,
  },
  subtitle: {
    ...Typography.bodyLarge,
    marginTop: Spacing.xs,
  },
  sharePillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.full,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sharePillText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    paddingBottom: Spacing.xxl * 2,
  },
  streakHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  streakFlame: {
    fontSize: 48,
    marginBottom: Spacing.xs,
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 70,
  },
  streakLabel: {
    ...Typography.h3,
    letterSpacing: 2,
  },
  calendarCard: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    marginBottom: Spacing.xxl,
  },
  calendarTitle: {
    ...Typography.h3,
    marginBottom: Spacing.lg,
    paddingLeft: Spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.sm,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
  },
  dayColumn: {
    width: '14.28%',
    alignItems: 'center',
  },
  dayBox: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayName: {
    ...Typography.caption,
    fontWeight: '600',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunSymbol: {
    fontSize: 16,
  },
  dayNumText: {
    ...Typography.caption,
    fontSize: 12,
  },
  emptyText: {
    ...Typography.bodyLarge,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: 24,
  }
});
