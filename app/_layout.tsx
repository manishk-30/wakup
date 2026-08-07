import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';
import { useColorScheme, AppState, AppStateStatus } from 'react-native';
import { useEffect, useRef } from 'react';
import { alarmService } from '../services/alarmService';
import { storageService } from '../services/storageService';
import { subscriptionService } from '../services/subscriptionService';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Initialize RevenueCat completely asynchronously and non-blocking
    subscriptionService.setup().catch(e => console.error("[RevenueCat] Setup Error:", e));

    const checkPendingGame = async () => {
      try {
        const hasOnboarded = await storageService.hasCompletedOnboarding();
        if (!hasOnboarded) {
          // Add a small delay to ensure router is ready
          setTimeout(() => {
            router.replace('/onboarding');
          }, 100);
          return;
        }

        console.log('[AlarmKit] Checking pending intent from UserDefaults...');
        const pendingAlarm = await alarmService.getPendingGameAlarm();
        if (pendingAlarm?.alarmId) {
          console.log(`[AlarmKit] Alarm reached scheduled time (Cold start)`);
          console.log(`[AlarmKit] Alarm state: pending in UserDefaults`);
          console.log(`[AlarmKit] Received startChallenge from getPendingGameAlarm (reason: ${pendingAlarm.reason})!`);
          console.log(`[AlarmKit] Navigating to Challenge Selection`);
          router.replace({ pathname: '/alarm/ringing', params: { alarmId: pendingAlarm.alarmId } });
        }
      } catch (e) {
        console.error('Failed to check pending alarm', e);
      }
    };
    
    // Cold start check
    checkPendingGame();

    // Warm start / Background event listener
    const eventSubscription = alarmService.addListener('onChallengeRequested', (event) => {
      console.log(`[AlarmKit] Alarm reached scheduled time`);
      console.log(`[AlarmKit] Alarm state: onChallengeRequested (event delivered)`);
      console.log(`[AlarmKit] Received startChallenge from onChallengeRequested event!`);
      if (event?.alarmId) {
        // Clear UserDefaults so it doesn't trigger again on next mount
        alarmService.getPendingGameAlarm(); 
        console.log(`[AlarmKit] Navigating to Challenge Selection`);
        router.replace({ pathname: '/alarm/ringing', params: { alarmId: event.alarmId } });
      }
    });

    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkPendingGame();
      }
      appState.current = nextAppState;
    });

    return () => {
      appStateSubscription.remove();
      if (eventSubscription) eventSubscription.remove();
    };
  }, [router]);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="about" options={{ title: 'About Us' }} />
        <Stack.Screen name="contact" options={{ title: 'Contact Us' }} />
        <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
        <Stack.Screen name="terms" options={{ title: 'Terms of Service' }} />
        <Stack.Screen name="refund" options={{ title: 'Refund Policy' }} />
        <Stack.Screen name="sounds" options={{ title: 'Select Sound', presentation: 'modal' }} />
        <Stack.Screen name="alarms/new" options={{ title: 'Add Alarm', presentation: 'modal' }} />
        <Stack.Screen name="alarm/ringing" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="alarm/games" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }} />
      </Stack>
    </>
  );
}
