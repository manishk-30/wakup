import { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, useColorScheme, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Typography, Spacing, Radii, UI } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Alarm } from '../../types/alarm';
import { storageService } from '../../services/storageService';
import { alarmService } from '../../services/alarmService';

export default function Home() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  const loadAlarms = async () => {
    const data = await storageService.getAlarms();
    setAlarms(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadAlarms();
    }, [])
  );

  const toggleAlarm = async (alarm: Alarm) => {
    const updatedAlarm = { ...alarm, enabled: !alarm.enabled };
    await storageService.updateAlarm(updatedAlarm);
    
    if (updatedAlarm.enabled) {
      await alarmService.scheduleAlarm(updatedAlarm);
    } else {
      await alarmService.cancelAlarm(updatedAlarm.id);
    }
    
    setAlarms(alarms.map(a => (a.id === alarm.id ? updatedAlarm : a)));
  };

  const deleteAlarm = (alarm: Alarm) => {
    Alert.alert(
      "Delete Alarm",
      "Are you sure you want to delete this alarm?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await alarmService.cancelAlarm(alarm.id);
            await storageService.deleteAlarm(alarm.id);
            setAlarms(alarms.filter(a => a.id !== alarm.id));
          }
        }
      ]
    );
  };

  const formatTime = (hour: number, minute: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    const m = minute.toString().padStart(2, '0');
    return { time: `${h}:${m}`, ampm };
  };

  const getDaysString = (days: number[]) => {
    if (days.length === 0) return 'Never';
    if (days.length === 7) return 'Every day';
    const isWeekdays = days.length === 5 && !days.includes(0) && !days.includes(6);
    if (isWeekdays) return 'Weekdays';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(d => dayNames[d]).join(' ');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textMuted }]}>Wakup</Text>
          <Text style={[styles.title, { color: theme.text }]}>Alarms</Text>
        </View>
        <Pressable 
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/alarms/new')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {alarms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏰</Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              No alarms set.
            </Text>
          </View>
        ) : (
          alarms.map((alarm) => {
            const { time, ampm } = formatTime(alarm.hour, alarm.minute);
            return (
              <Pressable 
                key={alarm.id} 
                style={[
                  styles.alarmCard, 
                  { 
                    backgroundColor: alarm.enabled ? theme.surface : 'transparent',
                    borderColor: alarm.enabled ? theme.primary : theme.border,
                    opacity: alarm.enabled ? 1 : 0.6
                  }
                ]}
                onPress={() => toggleAlarm(alarm)}
              >
                <View style={styles.alarmInfo}>
                  <View style={styles.timeRow}>
                    <Text style={[styles.timeText, { color: alarm.enabled ? theme.text : theme.textMuted }]}>
                      {time}
                    </Text>
                    <Text style={[styles.ampmText, { color: alarm.enabled ? theme.primary : theme.textMuted }]}>
                      {ampm}
                    </Text>
                  </View>
                  <Text style={[styles.labelText, { color: theme.text }]}>{alarm.label}</Text>
                  <Text style={[styles.daysText, { color: theme.textMuted }]}>
                    {getDaysString(alarm.repeatDays)}
                  </Text>
                </View>
                <View style={styles.actionsColumn}>
                  <Switch 
                    value={alarm.enabled} 
                    onValueChange={() => toggleAlarm(alarm)} 
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={theme.surface}
                    style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }], marginBottom: Spacing.md }}
                  />
                  <Pressable onPress={() => deleteAlarm(alarm)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={24} color={Colors.dark.danger || '#ef4444'} />
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
      

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.bodyLarge,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.h1,
    fontSize: 36,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFF',
    lineHeight: 32,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
    opacity: 0.5,
  },
  emptyText: {
    ...Typography.bodyLarge,
  },
  alarmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
    borderRadius: Radii.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  alarmInfo: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timeText: {
    ...Typography.h1,
    fontSize: 42,
    letterSpacing: -1,
  },
  ampmText: {
    ...Typography.h3,
    marginLeft: Spacing.sm,
    fontWeight: '800',
  },
  labelText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  daysText: {
    ...Typography.caption,
    marginTop: 4,
    letterSpacing: 1,
  },
  devButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    padding: Spacing.md,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  actionsColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    padding: Spacing.xs,
    opacity: 0.8,
  }
});
