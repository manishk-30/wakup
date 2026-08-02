import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';
import { GAMES } from '../../types/games';
import { alarmService } from '../../services/alarmService';
import { storageService } from '../../services/storageService';
import { ALARM_SOUNDS } from '../../constants/sounds';

export default function AlarmRinging() {
  const router = useRouter();
  const params = useLocalSearchParams<{ alarmId?: string }>();
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [currentAlarmId, setCurrentAlarmId] = useState<string>(params.alarmId || 'current');
  const [alarmTime, setAlarmTime] = useState<string>('...');

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    async function resolveAlarmTime() {
      try {
        const alarms = await storageService.getAlarms();
        const now = new Date();
        
        let activeAlarm = alarms.find(a => a.id === currentAlarmId);
        
        if (!activeAlarm) {
          activeAlarm = alarms.find(a => 
            a.enabled && a.hour === now.getHours() && a.minute === now.getMinutes()
          );
        }
        
        if (activeAlarm) {
          setCurrentAlarmId(activeAlarm.id);
          
          let h = activeAlarm.hour;
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12;
          h = h ? h : 12;
          const m = activeAlarm.minute < 10 ? '0' + activeAlarm.minute : activeAlarm.minute;
          const timeStr = `${h}:${m} ${ampm}`;
          
          setAlarmTime(timeStr);
          return activeAlarm;
        } else {
          setAlarmTime('Unknown');
          return null;
        }
      } catch (e) {
        setAlarmTime('Unknown');
        return null;
      }
    }

    async function setupAudio() {
      const activeAlarm = await resolveAlarmTime();

      if (!params.alarmId) {
        await alarmService.configureAudioSession();
        
        try {
          const soundName = activeAlarm?.soundName || ALARM_SOUNDS[0].id;
          const soundConfig = ALARM_SOUNDS.find(s => s.id === soundName) || ALARM_SOUNDS[0];
          
          await alarmService.playForegroundAlarm(soundConfig.file);
        } catch (e) {
          console.warn('Failed to load alarm sound. Did you download it?', e);
        }
      } else {
        console.log('[AlarmRinging] AlarmKit is already handling the audio natively');
      }
      
      // Auto-route if user pre-selected a specific game
      if (activeAlarm?.gameId && activeAlarm.gameId !== 'random') {
        router.push({
          pathname: '/alarm/games',
          params: { 
            gameId: activeAlarm.gameId,
            alarmId: activeAlarm.id
          }
        });
      }
    }

    setupAudio();

    // Stop and unload the sound when they leave this screen entirely just in case
    return () => {
      alarmService.stopForegroundAlarm();
    };
  }, []);

  const handleGameSelect = (gameId: string) => {
    router.push({
      pathname: '/alarm/games',
      params: { 
        gameId,
        alarmId: currentAlarmId
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.Text style={[styles.timeText, { transform: [{ scale: pulseAnim }] }]}>
          {alarmTime}
        </Animated.Text>
        <Text style={styles.title}>WAKE UP</Text>
        <Text style={styles.subtitle}>
          Win any game to stop the alarm.
        </Text>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.chooseText}>Choose your challenge</Text>
      </View>

      <ScrollView contentContainerStyle={styles.gamesList} showsVerticalScrollIndicator={false}>
        {GAMES.map((game) => (
          <Pressable
            key={game.id}
            style={({ pressed }) => [
              styles.gameCard,
              pressed && styles.gameCardPressed
            ]}
            onPress={() => handleGameSelect(game.id)}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.gameIcon}>{game.icon}</Text>
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={styles.gameDesc}>{game.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.dark.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.xxl * 2.5,
    backgroundColor: '#0F111A',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  timeText: {
    fontSize: 72,
    fontWeight: '900',
    color: Colors.dark.primary,
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(139, 92, 246, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  title: {
    ...Typography.h2,
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.dark.textMuted,
    textAlign: 'center',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  chooseText: {
    ...Typography.h3,
    color: '#FFF',
  },
  gamesList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gameCardPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  gameIcon: {
    fontSize: 24,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    ...Typography.h3,
    color: '#FFF',
    marginBottom: 2,
  },
  gameDesc: {
    ...Typography.body,
    color: Colors.dark.textMuted,
  },
});
