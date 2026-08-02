import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, useColorScheme, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Typography, Spacing, Radii, UI } from '../../constants/theme';
import { storageService } from '../../services/storageService';
import { alarmService } from '../../services/alarmService';
import { Alarm } from '../../types/alarm';
import { ALARM_SOUNDS } from '../../constants/sounds';
import { GAMES } from '../../types/games';
import { Ionicons } from '@expo/vector-icons';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const TOTAL_STEPS = 3;

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function AddAlarm() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  const [step, setStep] = useState(1);
  const fadeAnim = useState(new Animated.Value(1))[0];

  const defaultTime = new Date();
  defaultTime.setHours(7, 30, 0, 0);
  const [time, setTime] = useState(defaultTime);
  const [label, setLabel] = useState('Wake Up');
  const [repeatDays, setRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [soundName, setSoundName] = useState(ALARM_SOUNDS[0].id);
  const [gameId, setGameId] = useState('random');

  const toggleDay = (index: number) => {
    if (repeatDays.includes(index)) {
      setRepeatDays(repeatDays.filter(d => d !== index));
    } else {
      setRepeatDays([...repeatDays, index].sort());
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setStep(step + 1);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setStep(step - 1);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    const h = time.getHours();
    const m = time.getMinutes();

    const newAlarm: Alarm = {
      id: generateUUID(),
      hour: h,
      minute: m,
      label,
      enabled: true,
      repeatDays,
      soundName,
      gameId,
    };

    await storageService.addAlarm(newAlarm);
    await alarmService.scheduleAlarm(newAlarm);
    
    router.back();
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: theme.text }]}>When should we wake you?</Text>
      <View style={styles.timePickerContainer}>
        <DateTimePicker
          value={time}
          mode="time"
          display="spinner"
          onChange={(event, selectedDate) => {
            if (selectedDate) setTime(selectedDate);
          }}
          textColor={theme.text}
          themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
          style={{ width: '100%', height: 250 }}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: theme.text }]}>Alarm Details</Text>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Label</Text>
        <TextInput
          style={[styles.labelInput, { color: theme.text, backgroundColor: theme.surface }]}
          value={label}
          onChangeText={setLabel}
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Repeat</Text>
        <View style={styles.daysContainer}>
          {DAYS.map((day, index) => {
            const isSelected = repeatDays.includes(index);
            return (
              <Pressable
                key={index}
                style={[
                  styles.dayCircle,
                  { backgroundColor: isSelected ? theme.primary : theme.surface }
                ]}
                onPress={() => toggleDay(index)}
              >
                <Text style={[
                  styles.dayText, 
                  { color: isSelected ? '#FFF' : theme.text }
                ]}>{day}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Sound</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.soundsContainer}>
          {ALARM_SOUNDS.map((sound) => {
            const isSelected = soundName === sound.id;
            return (
              <Pressable
                key={sound.id}
                style={[
                  styles.soundChip,
                  { 
                    backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  }
                ]}
                onPress={() => setSoundName(sound.id)}
              >
                <Text style={[
                  styles.soundText,
                  { color: isSelected ? theme.primary : theme.text }
                ]}>
                  {sound.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: theme.text }]}>Choose Your Challenge</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted, marginBottom: Spacing.xl }]}>
        Win this game to turn off your alarm. If you pick "Any Game", you'll choose each morning.
      </Text>
      
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxl * 3 }} showsVerticalScrollIndicator={false}>
        <Pressable
          style={[
            styles.gameCardRow,
            { 
              backgroundColor: gameId === 'random' ? 'rgba(139, 92, 246, 0.1)' : theme.surface,
              borderColor: gameId === 'random' ? theme.primary : theme.border,
            }
          ]}
          onPress={() => setGameId('random')}
        >
          <Text style={{ fontSize: 32, marginRight: Spacing.md }}>🎲</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ ...Typography.h3, color: theme.text }}>Any Game</Text>
            <Text style={{ ...Typography.body, color: theme.textMuted }}>Pick when you wake up</Text>
          </View>
          {gameId === 'random' && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
        </Pressable>

        {GAMES.map((game) => {
          const isSelected = gameId === game.id;
          return (
            <Pressable
              key={game.id}
              style={[
                styles.gameCardRow,
                { 
                  backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.1)' : theme.surface,
                  borderColor: isSelected ? theme.primary : theme.border,
                }
              ]}
              onPress={() => setGameId(game.id)}
            >
              <Text style={{ fontSize: 32, marginRight: Spacing.md }}>{game.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ ...Typography.h3, color: theme.text }}>{game.title}</Text>
                <Text style={{ ...Typography.body, color: theme.textMuted }}>{game.description}</Text>
              </View>
              {isSelected && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Step {step} of {TOTAL_STEPS}</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </Animated.View>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.nextButton, { backgroundColor: theme.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>{step === TOTAL_STEPS ? 'Save Alarm' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  stepContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.bodyLarge,
  },
  timePickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    ...Typography.bodyLarge,
  },
  labelInput: {
    ...Typography.bodyLarge,
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  soundsContainer: {
    gap: Spacing.sm,
    paddingRight: Spacing.xl,
  },
  soundChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  soundText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  gameCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  nextButton: {
    height: UI.buttonHeight,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    ...Typography.h3,
    color: '#FFF',
  },
});
