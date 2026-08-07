import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { ALARM_SOUNDS } from '../constants/sounds';
import { Colors, Radii, Spacing, Typography, UI } from '../constants/theme';
import { useProStatus } from '../hooks/useProStatus';
import { alarmService } from '../services/alarmService';
import { storageService } from '../services/storageService';
import { subscriptionService } from '../services/subscriptionService';
import { Alarm } from '../types/alarm';
import { GAMES } from '../types/games';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const TOTAL_STEPS = 20;

const MOCK_PACKAGES: any[] = [
  {
    isMock: true,
    identifier: '$rc_annual',
    packageType: 'ANNUAL',
    product: { identifier: 'wakup_yearly', priceString: '₹2499' },
  },
  {
    isMock: true,
    identifier: '$rc_monthly',
    packageType: 'MONTHLY',
    product: { identifier: 'wakup_monthly', priceString: '₹499' },
  },
];

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
            backgroundColor: 'rgba(255, 176, 0, 0.15)',
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

  // Paywall State
  const [packages, setPackages] = useState<PurchasesPackage[] | any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('$rc_annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { isPro } = useProStatus();

  // Commitment State
  const [commitmentReason, setCommitmentReason] = useState('');
  const signatureRef = useRef<SignatureViewRef>(null);

  // Transition animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Continuous bouncing animation for emojis/icons
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();

    async function loadOfferings() {
      try {
        const offerings = await subscriptionService.getOfferings();
        if (offerings && offerings.length > 0) {
          setPackages(offerings);
          const annual = offerings.find((p: any) => p.packageType === 'ANNUAL');
          if (annual) setSelectedPackage(annual.identifier);
        } else {
          setPackages(MOCK_PACKAGES);
        }
      } catch (e) {
        console.warn("Failed to load offerings, using mock packages", e);
        setPackages(MOCK_PACKAGES);
      }
    }
    loadOfferings();

    async function loadSavedStep() {
      const savedStep = await storageService.getOnboardingStep();
      if (savedStep > 1 && savedStep <= TOTAL_STEPS) {
        setStep(savedStep);
      }
    }
    loadSavedStep();
  }, []);

  const mascotTransform = { transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }] };

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
      storageService.saveOnboardingStep(nextStep);

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

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    setIsPurchasing(true);
    const pkg = packages.find(p => p.identifier === selectedPackage);

    if (pkg && (pkg as any).isMock) {
      setTimeout(() => {
        setIsPurchasing(false);
        finishOnboarding();
      }, 1500);
      return;
    }
    if (pkg) {
      const { success, customerInfo, error } = await subscriptionService.purchasePackage(pkg as PurchasesPackage);
      setIsPurchasing(false);
      if (success) {
        finishOnboarding();
      } else if (error !== 'User cancelled') {
        Alert.alert("Purchase Failed", error || "Unknown error occurred.");
      }
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    const { success, customerInfo, error } = await subscriptionService.restorePurchases();
    setIsPurchasing(false);
    if (success) {
      const isPremium = typeof customerInfo?.entitlements.active['Pro'] !== 'undefined';
      if (isPremium) {
        Alert.alert("Restored", "Your purchases have been restored.");
        finishOnboarding();
      } else {
        Alert.alert("Restored", "No active premium subscription found.");
      }
    } else {
      Alert.alert("Restore Failed", error || "Could not restore purchases.");
    }
  };

  const getPrice = (type: 'ANNUAL' | 'MONTHLY') => {
    const pkg = packages.find(p => p.packageType === type || p.identifier.includes(type.toLowerCase()));
    if (pkg) return pkg.product.priceString;
    return type === 'ANNUAL' ? '₹2499' : '₹499';
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

    handleNext(); // Goes to step 15
  };

  const handleSignatureOK = async (signature: string) => {
    await storageService.saveCommitment(commitmentReason || "A better tomorrow", signature);
    handleNext(); // Goes to step 17
  };

  // Removed auto-advance for step 16

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
            <Pressable 
              style={[styles.button, { backgroundColor: theme.primary, opacity: answers['age'] ? 1 : 0.5, marginTop: Spacing.xl }]} 
              onPress={() => answers['age'] && handleNext()}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </Pressable>
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
            <Pressable 
              style={[styles.button, { backgroundColor: theme.primary, opacity: answers['gender'] ? 1 : 0.5, marginTop: Spacing.xl }]} 
              onPress={() => answers['gender'] && handleNext()}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </Pressable>
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
            <Pressable 
              style={[styles.button, { backgroundColor: theme.primary, opacity: answers['morningPerson'] ? 1 : 0.5, marginTop: Spacing.xl }]} 
              onPress={() => answers['morningPerson'] && handleNext()}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </Pressable>
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
            <Pressable 
              style={[styles.button, { backgroundColor: theme.primary, opacity: answers['wakeTime'] ? 1 : 0.5, marginTop: Spacing.xl }]} 
              onPress={() => answers['wakeTime'] && handleNext()}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </Pressable>
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
            <Pressable 
              style={[styles.button, { backgroundColor: theme.primary, opacity: answers['goal'] ? 1 : 0.5, marginTop: Spacing.xl }]} 
              onPress={() => answers['goal'] && handleNext()}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </Pressable>
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
                textColor={theme.text}
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
                    backgroundColor: gameId === 'random' ? 'rgba(255, 176, 0, 0.1)' : theme.surface,
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
                        backgroundColor: isSelected ? 'rgba(255, 176, 0, 0.1)' : theme.surface,
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
                          backgroundColor: isSelected ? 'rgba(255, 176, 0, 0.15)' : theme.surface,
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
            <Text style={[styles.title, { color: theme.text }]}>One small promise.</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              You're not making a promise to us.{"\n"}
              You're making it to the version of yourself that wants a better tomorrow.
            </Text>

            <View style={{
              backgroundColor: theme.background,
              padding: Spacing.lg,
              borderRadius: Radii.xl,
              borderWidth: 1,
              borderColor: theme.border,
              width: '100%',
              marginTop: Spacing.xl,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
            }}>
              <Text style={{ ...Typography.bodyLarge, color: theme.text, textAlign: 'center', marginBottom: Spacing.md }}>
                I am committing to my future self right now.{"\n\n"}
                I will wake up, beat the alarm, and win the morning.{"\n\n"}
                My goals are worth more than sleep.
              </Text>
              <View style={{ position: 'relative', height: 120, width: '100%', marginTop: Spacing.sm, borderRadius: Radii.md, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
                <SignatureScreen
                  ref={signatureRef}
                  onOK={handleSignatureOK}
                  descriptionText="Sign here"
                  clearText="Clear"
                  confirmText="Save"
                  webStyle={`.m-signature-pad {box-shadow: none; border: none; background-color: transparent;} 
                              .m-signature-pad--body {border: none;}
                              .m-signature-pad--footer {display: none; margin: 0px;}`}
                  backgroundColor="transparent"
                />
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }} pointerEvents="none">
                  <Text style={{ color: theme.textMuted, opacity: 0.4, fontSize: 18 }}>Your signature here</Text>
                </View>
              </View>
              <Pressable 
                onPress={() => signatureRef.current?.clearSignature()} 
                style={{ 
                  alignSelf: 'center', 
                  marginTop: 16,
                  backgroundColor: 'transparent',
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: theme.primary
                }}>
                <Text style={{ ...Typography.body, color: theme.primary, fontWeight: '700' }}>Retry Signature</Text>
              </Pressable>
            </View>

            <Pressable style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.xl }]} onPress={() => signatureRef.current?.readSignature()}>
              <Text style={styles.buttonText}>I'm Committed</Text>
            </Pressable>
          </View>
        );
      case 16:
        return (
          <View style={styles.centerContainer}>
            <Animated.Text style={{ fontSize: 80, marginBottom: Spacing.xl, transform: [{ scale: pulseAnim }] }}>
              ✅
            </Animated.Text>
            <Animated.View style={mascotTransform}>
              <Image source={require('../assets/images/mascot_happy.png')} style={{ width: 150, height: 150, marginBottom: 20 }} contentFit="contain" />
            </Animated.View>
            <Text style={[styles.title, { color: theme.text }]}>Promise accepted. ☀️</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Tomorrow starts with this decision.</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.xl }]} onPress={() => handleNext()}>
              <Text style={styles.buttonText}>Continue</Text>
            </Pressable>
          </View>
        );
      case 17:
        return (
          <View style={styles.centerContainer}>
            <Animated.Text style={{ fontSize: 80, marginBottom: Spacing.xl, transform: [{ translateY: bounceAnim }] }}>
              🚀
            </Animated.Text>
            <Text style={[styles.title, { color: theme.text }]}>You're all set.</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>We need permission to send notifications so your alarm can actually ring when it's time to wake up!</Text>
            <Pressable style={[styles.button, { backgroundColor: theme.primary, marginTop: Spacing.xl }]} onPress={handleSetAlarm}>
              <Text style={styles.buttonText}>Allow Notifications & Continue</Text>
            </Pressable>
          </View>
        );
      case 18:
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.pwHeader}>
              <Text style={[styles.headline, { color: theme.text }]}>Wake up feeling in control.</Text>
              <Text style={[styles.pwSubtitle, { color: theme.textMuted }]}>Tomorrow's version of you starts with one better morning.</Text>
            </View>

            <View style={styles.illustrationArea}>
              <Animated.View style={mascotTransform}>
                <Image source={require('../assets/images/mascot_happy.png')} style={[styles.mascotImage, { width: 240, height: 240 }]} contentFit="contain" />
              </Animated.View>
            </View>

            <View style={styles.contentArea}>
              <View style={styles.benefitCard}>
                <Text style={styles.benefitIcon}>☀️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>Beat the Snooze Button</Text>
                  <Text style={styles.benefitDesc}>Wake up by completing fun challenges.</Text>
                </View>
              </View>
              <View style={styles.benefitCard}>
                <Text style={styles.benefitIcon}>🎯</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>Stay Consistent</Text>
                  <Text style={styles.benefitDesc}>Build a routine you'll actually enjoy.</Text>
                </View>
              </View>
              <View style={styles.benefitCard}>
                <Text style={styles.benefitIcon}>🌅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>Start Every Morning Better</Text>
                  <Text style={styles.benefitDesc}>Small improvements every single day.</Text>
                </View>
              </View>
            </View>

            <Pressable style={[styles.pwButton, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.pwButtonText}>Continue ➔</Text>
            </Pressable>
          </ScrollView>
        );
      case 19:
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.pwHeader}>
              <Text style={[styles.headline, { color: theme.text }]}>Everything you need for better mornings.</Text>
            </View>

            <View style={styles.illustrationArea}>
              <Animated.View style={mascotTransform}>
                <Image source={require('../assets/images/mascot_confident.png')} style={[styles.mascotImage, { width: 240, height: 240 }]} contentFit="contain" />
              </Animated.View>
            </View>

            <View style={styles.contentArea}>
              <View style={styles.premiumCard}>
                <Text style={styles.premiumCardTitle}>☀️ Unlimited Smart Alarms</Text>
                <Text style={styles.premiumCardDesc}>Never miss an important morning.</Text>
              </View>
              <View style={styles.premiumCard}>
                <Text style={styles.premiumCardTitle}>🎮 All Wake-up Games</Text>
                <Text style={styles.premiumCardDesc}>Blackjack, Dragon Tower, Dice, Roulette, Higher/Lower, Mines. All future games included.</Text>
              </View>
            </View>

            <Pressable style={[styles.pwButton, { backgroundColor: theme.primary }]} onPress={() => handleNext()}>
              <Text style={styles.pwButtonText}>Try it for free</Text>
            </Pressable>
          </ScrollView>
        );
      case 20:
        return (
          <View style={{ flex: 1, width: '100%' }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.pwHeader}>
                <Text style={[styles.headline, { color: theme.text }]}>Start your 3-day free trial.</Text>
                <Text style={[styles.pwSubtitle, { color: theme.text, opacity: 0.8 }]}>Wake up better. Cancel anytime.</Text>
              </View>

              <View style={[styles.illustrationArea, { height: 110, marginVertical: 0 }]}>
                <Animated.View style={mascotTransform}>
                  <Image source={require('../assets/images/mascot_peace.png')} style={styles.mascotImage} contentFit="contain" />
                </Animated.View>
              </View>

              <View style={styles.contentArea}>
                {isPro ? (
                  <View style={[styles.premiumCard, { alignItems: 'center', paddingVertical: 40, backgroundColor: theme.surface }]}>
                    <Text style={{ fontSize: 40, marginBottom: 16 }}>⭐</Text>
                    <Text style={[styles.premiumCardTitle, { textAlign: 'center', color: theme.text }]}>You're already a Wakup Pro member.</Text>
                    <Text style={[styles.premiumCardDesc, { textAlign: 'center', marginTop: 8, color: theme.textMuted }]}>Enjoy every morning.</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.timeline}>
                      <View style={styles.timelineRow}>
                        <Text style={styles.timelineIcon}>☀️</Text>
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineTitle}>TODAY</Text>
                          <Text style={styles.timelineDesc}>Unlock every Pro feature</Text>
                        </View>
                      </View>
                      <View style={styles.timelineLine} />
                      <View style={styles.timelineRow}>
                        <Text style={styles.timelineIcon}>🔔</Text>
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineTitle}>DAY 2</Text>
                          <Text style={styles.timelineDesc}>We'll remind you before your trial ends.</Text>
                        </View>
                      </View>
                      <View style={styles.timelineLine} />
                      <View style={styles.timelineRow}>
                        <Text style={styles.timelineIcon}>💛</Text>
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineTitle}>DAY 3</Text>
                          <Text style={styles.timelineDesc}>Your subscription renews automatically unless cancelled.</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.pricingContainer}>
                      {packages.map((pkg, idx) => {
                        const isYear = pkg.packageType === 'ANNUAL';
                        const isSelected = selectedPackage === pkg.identifier;

                        return (
                          <View key={pkg.identifier} style={{ width: '48%' }}>
                            <Pressable
                              style={[
                                styles.pricingCard,
                                isSelected && { borderColor: '#FFB000', backgroundColor: '#FFF8E6', shadowColor: '#FFB000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 }
                              ]}
                              onPress={() => setSelectedPackage(pkg.identifier)}
                            >
                              {isYear && <View style={styles.bestValueBadge}><Text style={styles.badgeText}>🔥 BEST VALUE</Text></View>}
                              {isSelected && <View style={styles.checkIcon}><Ionicons name="checkmark-circle" size={24} color={'#FFB000'} /></View>}

                              <Text style={styles.planName}>{isYear ? 'Yearly' : 'Monthly'}</Text>
                              <Text style={styles.planPrice}>{isYear ? '$24.99' : '$4.99'}/{isYear ? 'year' : 'mo'}</Text>
                              {isYear && <Text style={styles.planSavings}>Save over 70%</Text>}
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}
              </View>
            </ScrollView>

            <View style={{ paddingHorizontal: Spacing.xl, paddingBottom: 0, paddingTop: 10, backgroundColor: theme.background }}>
              <Pressable
                style={[styles.pwButton, { backgroundColor: theme.primary, opacity: isPurchasing ? 0.7 : 1, marginBottom: 8, marginTop: 0 }]}
                onPress={isPro ? finishOnboarding : handlePurchase}
                disabled={isPurchasing}
              >
                <Text style={styles.pwButtonText}>{isPro ? "Finish" : "🌅 Start 3-Day Free Trial"}</Text>
              </Pressable>

              {!isPro && (
                <Text style={[styles.trialInfoText, { marginTop: 0, marginBottom: 8 }]}>3 days free, then $24.99/year</Text>
              )}

              {isPro ? null : (
                <View style={styles.footerLinksRow}>
                  <Pressable onPress={handleRestore}><Text style={styles.footerLink}>Restore Purchases</Text></Pressable>
                  <Text style={styles.footerLinkDot}> • </Text>
                  <Pressable onPress={() => router.push('/privacy')}><Text style={styles.footerLink}>Privacy Policy</Text></Pressable>
                  <Text style={styles.footerLinkDot}> • </Text>
                  <Pressable onPress={() => router.push('/terms')}><Text style={styles.footerLink}>Terms</Text></Pressable>
                </View>
              )}
            </View>
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
  labelInput: {
    ...Typography.bodyLarge,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
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
  },
  pwHeader: {
    marginBottom: 24,
    paddingTop: 40,
    position: 'relative',
    zIndex: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    right: 0,
    zIndex: 10,
    padding: 8,
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: '#16233B',
    lineHeight: 40,
    fontFamily: 'System',
    marginBottom: 8,
    width: '85%',
  },
  pwSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  illustrationArea: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  mascotImage: {
    width: 200,
    height: 200,
  },
  contentArea: {
    flex: 1,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // Theme.gray / theme.surface
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16233B',
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  premiumCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 16,
    shadowColor: '#16233B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  premiumCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16233B',
    marginBottom: 6,
  },
  premiumCardDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  ratingCard: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    padding: Spacing.lg,
  },
  stars: {
    fontSize: 24,
    color: '#FFB000',
    marginBottom: Spacing.sm,
  },
  ratingTitle: {
    ...Typography.h3,
    marginBottom: 2,
  },
  pwButton: {
    backgroundColor: '#FFB000',
    height: 56,
    borderRadius: 28, // Theme.radius
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFB000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
    marginTop: 24,
    marginBottom: 24,
  },
  pwButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  timeline: {
    marginBottom: 24,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIcon: {
    fontSize: 20,
    marginRight: 16,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16233B',
    marginBottom: 4,
  },
  timelineDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: '#F3F4F6',
    marginLeft: 11,
    marginVertical: 4,
  },
  pricingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pricingCard: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    position: 'relative',
    height: 110,
    justifyContent: 'center',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    left: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16233B',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16233B',
  },
  planSavings: {
    fontSize: 12,
    color: '#FFB000',
    fontWeight: '600',
    marginTop: 8,
  },
  trialInfoText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6B7280',
    marginTop: 16,
  },
  footerLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  footerLink: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footerLinkDot: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 8,
  }
});
