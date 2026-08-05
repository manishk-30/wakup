import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, useColorScheme, Easing, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { storageService } from '../services/storageService';
import { alarmService } from '../services/alarmService';
import { Colors, Typography, Spacing, Radii, UI } from '../constants/theme';
import { Alarm } from '../types/alarm';
import { ALARM_SOUNDS } from '../constants/sounds';
import { GAMES } from '../types/games';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const TOTAL_STEPS = 15;

const AlarmComparisonAnimation = ({ theme }: { theme: any }) => {
  const oldAlarms = [
    { time: '7:00 AM', delay: 0 },
    { time: '7:05 AM', delay: 800 },
    { time: '7:10 AM', delay: 1600 },
    { time: '7:15 AM', delay: 2400 },
  ];
  
  const oldAnimValues = useRef(oldAlarms.map(() => new Animated.Value(0))).current;
  const newAnimValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    oldAlarms.forEach((_, i) => {
      Animated.timing(oldAnimValues[i], {
        toValue: 1,
        duration: 400,
        delay: oldAlarms[i].delay,
        useNativeDriver: true,
        easing: Easing.bounce
      }).start();
    });

    Animated.timing(newAnimValue, {
      toValue: 1,
      duration: 600,
      delay: 3500,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.5))
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginVertical: Spacing.xl }}>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ ...Typography.h3, color: theme.textMuted, marginBottom: Spacing.md }}>Other Apps</Text>
        <View style={{ height: 250, width: '100%', alignItems: 'center' }}>
          {oldAlarms.map((a, i) => (
            <Animated.View key={i} style={[styles.comparisonAlarm, { 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              borderColor: '#ef4444',
              opacity: oldAnimValues[i],
              transform: [{ translateY: oldAnimValues[i].interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
            }]}>
              <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>{a.time}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
      
      <View style={{ width: 1, backgroundColor: theme.border, height: '100%' }} />

      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ ...Typography.h3, color: theme.primary, marginBottom: Spacing.md }}>Wakup</Text>
        <View style={{ height: 250, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[styles.comparisonAlarm, { 
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            borderColor: theme.primary,
            transform: [
              { scale: newAnimValue.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
              { translateY: newAnimValue.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }
            ],
            opacity: newAnimValue
          }]}>
            <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 18 }}>7:00 AM</Text>
            <Animated.Text style={{ fontSize: 24, marginTop: 4, transform: [{ scale: pulseAnim }] }}>🎮</Animated.Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Transition animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Continuous bouncing animation for emojis/icons
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -15, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const [alarmTime, setAlarmTime] = useState(new Date(new Date().setHours(7, 30, 0, 0)));
  const [showPicker, setShowPicker] = useState(false);
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

  const handleNext = (nextStepOverride?: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease)
    }).start(() => {
      const nextStep = nextStepOverride ?? step + 1;
      
      if (nextStep > TOTAL_STEPS) {
        finishOnboarding();
        return;
      }
      
      setStep(nextStep);
      
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true
        })
      ]).start();
    });
  };

  const handleAnswer = (questionKey: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionKey]: answer }));
    setTimeout(() => {
      handleNext();
    }, 300); 
  };

  const getOptionStyle = (questionKey: string, answerValue: string) => {
    const isSelected = answers[questionKey] === answerValue;
    return [
      styles.optionCard, 
      { 
        backgroundColor: isSelected ? theme.primary + '20' : theme.surface, 
        borderColor: isSelected ? theme.primary : theme.border 
      }
    ];
  };

  const finishOnboarding = async () => {
    await storageService.saveOnboardingAnswers(answers);
    await storageService.completeOnboarding();
    router.replace('/');
  };

  const handleSetAlarm = async () => {
    const newAlarm: Alarm = {
      id: generateUUID(),
      hour: alarmTime.getHours(),
      minute: alarmTime.getMinutes(),
      enabled: true,
      label,
      repeatDays,
      soundName,
      gameId
    };
    
    await storageService.addAlarm(newAlarm);
    await alarmService.scheduleAlarm(newAlarm);
    
    handleNext();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.centerContainer}>
            <Animated.Text style={{ fontSize: 80, marginBottom: Spacing.xl, transform: [{ scale: pulseAnim }] }}>
              🔔
            </Animated.Text>
            <Text style={[styles.title, { color: theme.text }]}>Wake up.{"\n"}Take your chance.{"\n"}Win your morning.</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Your alarm just got a little more interesting.</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Get Started</Text>
            </Pressable>
          </View>
        );
      case 2:
        return (
          <View style={styles.centerContainer}>
            <Animated.Text style={{ fontSize: 80, marginBottom: Spacing.xl, transform: [{ translateY: bounceAnim }] }}>
              😴
            </Animated.Text>
            <Text style={[styles.title, { color: theme.text }]}>Still hitting snooze?</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Sometimes getting out of bed is the hardest part of the entire day.</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Yep, that's me</Text>
            </Pressable>
          </View>
        );
      case 3:
        return (
          <View style={styles.centerContainer}>
            <Animated.Text style={{ fontSize: 80, marginBottom: Spacing.xl, transform: [{ scale: pulseAnim }] }}>
              📊
            </Animated.Text>
            <Text style={[styles.title, { color: theme.text }]}>Did you know?</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Only 14% of people are naturally morning people. The rest of us need a little push.</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Wow, really?</Text>
            </Pressable>
          </View>
        );
      case 4:
        return (
          <View style={styles.centerContainer}>
            <Animated.Text style={{ fontSize: 80, marginBottom: Spacing.xl, transform: [{ translateY: bounceAnim }] }}>
              🌅
            </Animated.Text>
            <Text style={[styles.title, { color: theme.text }]}>We are going to make you one of them.</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>By gamifying your wake-up routine, we force your brain to engage the moment you open your eyes.</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Show me how</Text>
            </Pressable>
          </View>
        );
      case 5:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>The Old Way vs The New Way</Text>
            <AlarmComparisonAnimation theme={theme} />
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>I prefer Wakup</Text>
            </Pressable>
          </View>
        );
      case 6:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>To personalize your sleep profile, how old are you?</Text>
            <View style={styles.optionsContainer}>
              <Pressable style={getOptionStyle('age', 'under18')} onPress={() => handleAnswer('age', 'under18')}>
                <Text style={[styles.optionText, { color: theme.text }]}>Under 18</Text>
              </Pressable>
              <Pressable style={getOptionStyle('age', '18-24')} onPress={() => handleAnswer('age', '18-24')}>
                <Text style={[styles.optionText, { color: theme.text }]}>18 - 24</Text>
              </Pressable>
              <Pressable style={getOptionStyle('age', '25-34')} onPress={() => handleAnswer('age', '25-34')}>
                <Text style={[styles.optionText, { color: theme.text }]}>25 - 34</Text>
              </Pressable>
              <Pressable style={getOptionStyle('age', '35plus')} onPress={() => handleAnswer('age', '35plus')}>
                <Text style={[styles.optionText, { color: theme.text }]}>35+</Text>
              </Pressable>
            </View>
          </View>
        );
      case 7:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>What is your gender?</Text>
            <View style={styles.optionsContainer}>
              <Pressable style={getOptionStyle('gender', 'male')} onPress={() => handleAnswer('gender', 'male')}>
                <Text style={[styles.optionText, { color: theme.text }]}>👨 Male</Text>
              </Pressable>
              <Pressable style={getOptionStyle('gender', 'female')} onPress={() => handleAnswer('gender', 'female')}>
                <Text style={[styles.optionText, { color: theme.text }]}>👩 Female</Text>
              </Pressable>
              <Pressable style={getOptionStyle('gender', 'other')} onPress={() => handleAnswer('gender', 'other')}>
                <Text style={[styles.optionText, { color: theme.text }]}>👤 Prefer not to say</Text>
              </Pressable>
            </View>
          </View>
        );
      case 8:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Are you naturally a morning person?</Text>
            <View style={styles.optionsContainer}>
              <Pressable style={getOptionStyle('morningPerson', 'owl')} onPress={() => handleAnswer('morningPerson', 'owl')}>
                <Text style={[styles.optionText, { color: theme.text }]}>🦉 I'm a night owl</Text>
              </Pressable>
              <Pressable style={getOptionStyle('morningPerson', 'bird')} onPress={() => handleAnswer('morningPerson', 'bird')}>
                <Text style={[styles.optionText, { color: theme.text }]}>🌅 Early bird</Text>
              </Pressable>
              <Pressable style={getOptionStyle('morningPerson', 'coffee')} onPress={() => handleAnswer('morningPerson', 'coffee')}>
                <Text style={[styles.optionText, { color: theme.text }]}>☕ Depends on the coffee</Text>
              </Pressable>
            </View>
          </View>
        );
      case 9:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>What time do you usually wake up?</Text>
            <View style={styles.optionsContainer}>
              <Pressable style={getOptionStyle('wakeTime', 'before6')} onPress={() => handleAnswer('wakeTime', 'before6')}>
                <Text style={[styles.optionText, { color: theme.text }]}>Before 6:00 AM</Text>
              </Pressable>
              <Pressable style={getOptionStyle('wakeTime', '6to8')} onPress={() => handleAnswer('wakeTime', '6to8')}>
                <Text style={[styles.optionText, { color: theme.text }]}>6:00 AM - 8:00 AM</Text>
              </Pressable>
              <Pressable style={getOptionStyle('wakeTime', 'after8')} onPress={() => handleAnswer('wakeTime', 'after8')}>
                <Text style={[styles.optionText, { color: theme.text }]}>After 8:00 AM</Text>
              </Pressable>
              <Pressable style={getOptionStyle('wakeTime', 'varies')} onPress={() => handleAnswer('wakeTime', 'varies')}>
                <Text style={[styles.optionText, { color: theme.text }]}>It varies wildly</Text>
              </Pressable>
            </View>
          </View>
        );
      case 10:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>What is your ultimate morning goal?</Text>
            <View style={styles.optionsContainer}>
              <Pressable style={getOptionStyle('goal', 'snooze')} onPress={() => handleAnswer('goal', 'snooze')}>
                <Text style={[styles.optionText, { color: theme.text }]}>🛑 Stop hitting snooze</Text>
              </Pressable>
              <Pressable style={getOptionStyle('goal', 'routine')} onPress={() => handleAnswer('goal', 'routine')}>
                <Text style={[styles.optionText, { color: theme.text }]}>📅 Build a consistent routine</Text>
              </Pressable>
              <Pressable style={getOptionStyle('goal', 'energize')} onPress={() => handleAnswer('goal', 'energize')}>
                <Text style={[styles.optionText, { color: theme.text }]}>⚡ Wake up feeling energized</Text>
              </Pressable>
            </View>
          </View>
        );
      case 11:
        return (
          <View style={styles.centerContainer}>
            <Animated.Text style={{ fontSize: 80, marginBottom: Spacing.xl, transform: [{ translateY: bounceAnim }] }}>
              ⏰
            </Animated.Text>
            <Text style={[styles.title, { color: theme.text }]}>Create your first alarm</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Let's set up an alarm you won't be able to ignore.</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Let's Set It Up</Text>
            </Pressable>
          </View>
        );
      case 12:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>When should we wake you?</Text>
            
            <Pressable 
              style={[styles.timePickerDisplay, { backgroundColor: theme.surface, borderColor: theme.border }]} 
              onPress={() => setShowPicker(true)}
            >
              <Text style={[styles.timePickerText, { color: theme.primary }]}>
                {alarmTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </Pressable>

            {showPicker && (
              <DateTimePicker
                value={alarmTime}
                mode="time"
                display="spinner"
                onChange={(event, selectedDate) => {
                  setShowPicker(false);
                  if (selectedDate) setAlarmTime(selectedDate);
                }}
              />
            )}

            <Pressable style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.xxl }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Next</Text>
            </Pressable>
          </View>
        );
      case 13:
        return (
          <View style={[styles.centerContainer, { justifyContent: 'flex-start', paddingTop: 40 }]}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: Spacing.xl, width: '100%' }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.title, { color: theme.text, marginBottom: Spacing.md }]}>Choose Your Challenge</Text>
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
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.md, marginBottom: Spacing.md }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Next</Text>
            </Pressable>
          </View>
        );
      case 14:
        const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Alarm Details</Text>
            
            <View style={[styles.section, { width: '100%', alignItems: 'center' }]}>
              <Text style={[styles.sectionTitle, { color: theme.text, alignSelf: 'flex-start' }]}>Label</Text>
              <TextInput
                style={[styles.labelInput, { color: theme.text, backgroundColor: theme.surface, width: '100%' }]}
                value={label}
                onChangeText={setLabel}
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <View style={[styles.section, { width: '100%' }]}>
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

            <View style={[styles.section, { width: '100%' }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Sound</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.soundsContainer, { alignItems: 'center' }]}>
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

            <Pressable style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.xl }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Next</Text>
            </Pressable>
          </View>
        );
      case 15:
        return (
          <View style={styles.centerContainer}>
            <Animated.Text style={{ fontSize: 80, marginBottom: Spacing.xl, transform: [{ translateY: bounceAnim }] }}>
              🚀
            </Animated.Text>
            <Text style={[styles.title, { color: theme.text }]}>You're all set.</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>We need permission to send notifications so your alarm can actually ring when it's time to wake up!</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.xl }]} onPress={handleSetAlarm}>
              <Text style={styles.buttonText}>Allow Notifications & Finish</Text>
            </Pressable>
          </View>
        );
      default:
        return null;
    }
  };

  const progressPercentage = (step / TOTAL_STEPS) * 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top, paddingBottom: insets.bottom || Spacing.lg }]}>
      {/* Line Loader Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { backgroundColor: theme.primary, width: `${progressPercentage}%` }]} />
      </View>
      
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {renderStep()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    width: '100%',
    position: 'absolute',
    top: 50, // safe area approx
    zIndex: 10,
  },
  progressBarFill: {
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.h1,
    fontSize: 32,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  hugeTitle: {
    ...Typography.h1,
    fontSize: 42,
    textAlign: 'center',
    lineHeight: 52,
  },
  subtitle: {
    ...Typography.bodyLarge,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 26,
  },
  button: {
    width: '100%',
    height: UI.buttonHeight,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  buttonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: '#FFF',
  },
  visualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.xl,
  },
  visualIcon: {
    fontSize: 48,
  },
  flowContainer: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  flowText: {
    ...Typography.h3,
    marginVertical: Spacing.xs,
  },
  flowTitle: {
    ...Typography.h2,
    marginVertical: Spacing.xs,
    letterSpacing: 2,
  },
  flowArrow: {
    marginVertical: Spacing.xs,
  },
  optionsContainer: {
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  optionCard: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    ...Typography.h3,
    fontSize: 18,
  },
  cardsVisual: {
    height: 220,
    alignItems: 'center',
    marginVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  gameCard: {
    width: 140,
    height: 190,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gameCardIcon: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  gameCardName: {
    ...Typography.bodyLarge,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    width: '100%',
  },
  hugeText: {
    fontSize: 56,
    fontWeight: '900',
    marginVertical: Spacing.xl,
    textAlign: 'center',
  },
  interactiveCoin: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xl,
  },
  hugeIcon: {
    fontSize: 80,
  },
  resultContainer: {
    alignItems: 'center',
    width: '100%',
  },
  timePickerDisplay: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radii.xl,
    borderWidth: 1,
    marginVertical: Spacing.xl,
  },
  timePickerText: {
    fontSize: 48,
    fontWeight: '800',
  },
  repeatContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  alarmPreview: {
    alignItems: 'center',
    marginVertical: Spacing.xxl,
  },
  comparisonAlarm: {
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    width: '80%',
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
    width: '100%',
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
    flexGrow: 0,
  },
  soundChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
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
    width: '100%',
  }
});
