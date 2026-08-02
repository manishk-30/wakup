import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, useColorScheme, Easing, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { storageService } from '../services/storageService';
import { alarmService } from '../services/alarmService';
import { Colors, Typography, Spacing, Radii, UI } from '../constants/theme';
import { Alarm } from '../types/alarm';

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
  
  // Fade animation for transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Coin flip animation state
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<string | null>(null);

  // Alarm settings state for step 13
  const [alarmTime, setAlarmTime] = useState(new Date(new Date().setHours(7, 30, 0, 0)));
  const [showPicker, setShowPicker] = useState(false);

  const handleNext = (nextStepOverride?: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150, // simple smooth fade out
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease)
    }).start(() => {
      const nextStep = nextStepOverride ?? step + 1;
      
      if (nextStep > TOTAL_STEPS) {
        finishOnboarding();
        return;
      }
      
      setStep(nextStep);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200, // simple smooth fade in
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease)
      }).start();
    });
  };

  const handleAnswer = (questionKey: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionKey]: answer }));
    setTimeout(() => {
      handleNext();
    }, 400); // Small delay so the user can see their selection highlighted
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
      id: Date.now().toString(),
      hour: alarmTime.getHours(),
      minute: alarmTime.getMinutes(),
      enabled: true,
      label: 'Wake Up',
      repeatDays: [0, 1, 2, 3, 4, 5, 6], // Everyday default
      soundName: 'default'
    };
    
    // Save to storage and schedule natively
    await storageService.addAlarm(newAlarm);
    await alarmService.scheduleAlarm(newAlarm);
    
    handleNext();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.centerContainer}>
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
            <Text style={[styles.title, { color: theme.text }]}>Still hitting snooze? 😴</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Sometimes getting out of bed is the hardest part of the morning.</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Yep, that's me</Text>
            </Pressable>
          </View>
        );
      case 3:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>The Old Way vs The New Way</Text>
            <AlarmComparisonAnimation theme={theme} />
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>I prefer Wakup</Text>
            </Pressable>
          </View>
        );
      case 4:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>What if your alarm gave you something to play for?</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>When your alarm rings, you choose a game and play to turn it off.</Text>
            <View style={styles.visualRow}>
              <Text style={styles.visualIcon}>🔔</Text>
              <Ionicons name="arrow-forward" size={24} color={theme.textMuted} />
              <Text style={styles.visualIcon}>🎮</Text>
              <Ionicons name="arrow-forward" size={24} color={theme.textMuted} />
              <Text style={styles.visualIcon}>☀️</Text>
            </View>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Show me how</Text>
            </Pressable>
          </View>
        );
      case 5:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>It's simple.</Text>
            <View style={styles.flowContainer}>
              <Text style={[styles.flowText, { color: theme.text }]}>Alarm rings</Text>
              <Ionicons name="arrow-down" size={20} color={theme.textMuted} style={styles.flowArrow} />
              <Text style={[styles.flowText, { color: theme.text }]}>Choose your game</Text>
              <Ionicons name="arrow-down" size={20} color={theme.textMuted} style={styles.flowArrow} />
              <Text style={[styles.flowText, { color: theme.text }]}>Play</Text>
              <Ionicons name="arrow-down" size={20} color={theme.textMuted} style={styles.flowArrow} />
              <Text style={[styles.flowText, { color: theme.text }]}>Complete it</Text>
              <Ionicons name="arrow-down" size={20} color={theme.textMuted} style={styles.flowArrow} />
              <Text style={[styles.flowText, { color: theme.text }]}>Start your morning</Text>
            </View>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>No complicated routines. Just wake up and play.</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Continue</Text>
            </Pressable>
          </View>
        );
      case 6:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Choice Is Yours</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>You choose how you wake up.{"\n\n"}Pick the game that feels right when your alarm goes off.{"\n\n"}Your alarm. Your choice.</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Got it</Text>
            </Pressable>
          </View>
        );
      case 7:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>How do you usually wake up?</Text>
            <View style={styles.optionsContainer}>
              <Pressable style={getOptionStyle('wakeupHabit', 'snooze')} onPress={() => handleAnswer('wakeupHabit', 'snooze')}>
                <Text style={[styles.optionText, { color: theme.text }]}>😴 I hit snooze</Text>
              </Pressable>
              <Pressable style={getOptionStyle('wakeupHabit', 'eventually')} onPress={() => handleAnswer('wakeupHabit', 'eventually')}>
                <Text style={[styles.optionText, { color: theme.text }]}>😐 I eventually get up</Text>
              </Pressable>
              <Pressable style={getOptionStyle('wakeupHabit', 'awake')} onPress={() => handleAnswer('wakeupHabit', 'awake')}>
                <Text style={[styles.optionText, { color: theme.text }]}>⚡ I'm already awake</Text>
              </Pressable>
              <Pressable style={getOptionStyle('wakeupHabit', 'depends')} onPress={() => handleAnswer('wakeupHabit', 'depends')}>
                <Text style={[styles.optionText, { color: theme.text }]}>🎯 Depends on the day</Text>
              </Pressable>
            </View>
          </View>
        );
      case 8:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>What sounds more fun to you?</Text>
            <View style={styles.optionsContainer}>
              <Pressable style={getOptionStyle('funStyle', 'luck')} onPress={() => handleAnswer('funStyle', 'luck')}>
                <Text style={[styles.optionText, { color: theme.text }]}>🎲 A little luck</Text>
              </Pressable>
              <Pressable style={getOptionStyle('funStyle', 'strategic')} onPress={() => handleAnswer('funStyle', 'strategic')}>
                <Text style={[styles.optionText, { color: theme.text }]}>🧠 Something strategic</Text>
              </Pressable>
              <Pressable style={getOptionStyle('funStyle', 'unpredictable')} onPress={() => handleAnswer('funStyle', 'unpredictable')}>
                <Text style={[styles.optionText, { color: theme.text }]}>🎰 Something unpredictable</Text>
              </Pressable>
              <Pressable style={getOptionStyle('funStyle', 'surprise')} onPress={() => handleAnswer('funStyle', 'surprise')}>
                <Text style={[styles.optionText, { color: theme.text }]}>🔀 Surprise me</Text>
              </Pressable>
            </View>
          </View>
        );
      case 9:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>How do you want your mornings to feel?</Text>
            <View style={styles.optionsContainer}>
              <Pressable style={getOptionStyle('morningFeel', 'energized')} onPress={() => handleAnswer('morningFeel', 'energized')}>
                <Text style={[styles.optionText, { color: theme.text }]}>⚡ Energized</Text>
              </Pressable>
              <Pressable style={getOptionStyle('morningFeel', 'focused')} onPress={() => handleAnswer('morningFeel', 'focused')}>
                <Text style={[styles.optionText, { color: theme.text }]}>🎯 Focused</Text>
              </Pressable>
              <Pressable style={getOptionStyle('morningFeel', 'relaxed')} onPress={() => handleAnswer('morningFeel', 'relaxed')}>
                <Text style={[styles.optionText, { color: theme.text }]}>😎 Relaxed</Text>
              </Pressable>
              <Pressable style={getOptionStyle('morningFeel', 'different')} onPress={() => handleAnswer('morningFeel', 'different')}>
                <Text style={[styles.optionText, { color: theme.text }]}>🎲 Different every day</Text>
              </Pressable>
            </View>
          </View>
        );
      case 10:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>No fixed game.</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Choose a different game whenever you want—or stick with your favorite.</Text>
            <Text style={[styles.subtitle, { color: theme.primary, fontWeight: 'bold' }]}>Tap any game below to try it out!</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, maxHeight: 260 }}
              contentContainerStyle={styles.cardsVisual}
              snapToInterval={156} // card width (140) + gap (16)
              decelerationRate="fast"
            >
              {[
                { id: 'blackjack', name: 'Blackjack', icon: '🃏', color: '#EF4444' },
                { id: 'dragon-tower', name: 'Dragon Tower', icon: '🐉', color: '#10B981' },
                { id: 'mines', name: 'Mines', icon: '💣', color: '#6366F1' },
                { id: 'dice', name: 'Dice', icon: '🎲', color: '#3B82F6' },
                { id: 'roulette', name: 'Roulette', icon: '🎰', color: '#F59E0B' },
                { id: 'higher-lower', name: 'Higher / Lower', icon: '📈', color: '#EC4899' },
                { id: 'coin-flip', name: 'Coin Flip', icon: '🪙', color: '#8B5CF6' },
                { id: 'card-guess', name: 'Card Guess', icon: '❓', color: '#14B8A6' },
              ].map((game, i) => (
                <Pressable 
                  key={i} 
                  style={[styles.gameCard, { backgroundColor: game.color }]}
                  onPress={() => router.push(`/alarm/games?gameId=${game.id}&isPreview=true`)}
                >
                  <Text style={styles.gameCardIcon}>{game.icon}</Text>
                  <Text style={styles.gameCardName} numberOfLines={1} adjustsFontSizeToFit>{game.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>I Like That</Text>
            </Pressable>
          </View>
        );
      case 11:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>One thing stands between you and your morning.</Text>
            <Text style={[styles.hugeText, { color: theme.primary }]}>THE GAME.</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>When your alarm rings, complete the game you choose to finish your alarm.</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Got It</Text>
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

            <View style={styles.repeatContainer}>
              <Text style={[styles.optionText, { color: theme.text, marginBottom: Spacing.sm }]}>Repeat</Text>
              <View style={[styles.optionCard, { backgroundColor: theme.surface, borderColor: theme.primary, borderWidth: 2 }]}>
                <Text style={[styles.optionText, { color: theme.text }]}>Every day</Text>
              </View>
            </View>

            <Pressable style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.xxl }]} onPress={handleSetAlarm}>
              <Text style={styles.buttonText}>Set My First Alarm</Text>
            </Pressable>
          </View>
        );
      case 13:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Your first challenge is waiting.</Text>
            <View style={styles.alarmPreview}>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>Tomorrow</Text>
              <Text style={[styles.hugeText, { color: theme.text }]}>{alarmTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} 🔔</Text>
            </View>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>When it rings, pick your game and take your chance.</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Continue</Text>
            </Pressable>
          </View>
        );
      case 14:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.title, { color: theme.text }]}>One last thing.</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>When your alarm rings, you'll choose a game before starting your morning.</Text>
            <View style={styles.flowContainer}>
              <Text style={[styles.flowTitle, { color: theme.text }]}>🔔 ALARM</Text>
              <Ionicons name="arrow-down" size={20} color={theme.textMuted} style={styles.flowArrow} />
              <Text style={[styles.flowTitle, { color: theme.text }]}>🎮 CHOOSE</Text>
              <Ionicons name="arrow-down" size={20} color={theme.textMuted} style={styles.flowArrow} />
              <Text style={[styles.flowTitle, { color: theme.text }]}>🏆 PLAY</Text>
              <Ionicons name="arrow-down" size={20} color={theme.textMuted} style={styles.flowArrow} />
              <Text style={[styles.flowTitle, { color: theme.primary }]}>☀️ WAKE UP</Text>
            </View>
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>I'm Ready</Text>
            </Pressable>
          </View>
        );
      case 15:
        return (
          <View style={styles.centerContainer}>
            <Text style={[styles.hugeTitle, { color: theme.text }]}>Wake up.{"\n"}Take your chance.{"\n"}Win your morning.</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted, marginTop: Spacing.xl }]}>Your first alarm is set.</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.xl }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Let's Wake Up →</Text>
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
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderStep()}
      </Animated.View>
    </View>
  );
}
import { ActivityIndicator } from 'react-native';

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
  }
});
