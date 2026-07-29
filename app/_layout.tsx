import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';
import { useColorScheme, AppState, AppStateStatus } from 'react-native';
import { useEffect, useRef } from 'react';
import { alarmService } from '../services/alarmService';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const checkPendingGame = async () => {
      try {
        const pendingAlarm = await alarmService.getPendingGameAlarm();
        if (pendingAlarm?.alarmId) {
          console.log(`[App] Found pending alarm challenge (reason: ${pendingAlarm.reason})! Navigating to ringing screen...`);
          router.replace({ pathname: '/alarm/ringing', params: { alarmId: pendingAlarm.alarmId } });
        }
      } catch (e) {
        console.error('Failed to check pending alarm', e);
      }
    };
    
    // Check initially in case app was launched completely from scratch by the intent
    checkPendingGame();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkPendingGame();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
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
        <Stack.Screen name="alarms/new" options={{ title: 'Add Alarm', presentation: 'modal' }} />
        <Stack.Screen name="alarm/ringing" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="alarm/games" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      </Stack>
    </>
  );
}
