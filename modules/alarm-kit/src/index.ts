import { requireNativeModule } from 'expo-modules-core';

interface AlarmKitModule {
  requestAuthorization(): Promise<boolean>;
  scheduleAlarm(options: { id: string, hour: number, minute: number, repeatDays: number[], label: string }): Promise<{ success: boolean, alarmId?: string, error?: string }>;
  cancelAlarm(id: string): Promise<boolean>;
  stopAlarm(id: string): Promise<boolean>;
  snoozeAlarm(id: string): Promise<boolean>;
  configureAudioSession(): Promise<boolean>;
}

let AlarmKit: AlarmKitModule | null = null;

try {
  AlarmKit = requireNativeModule<AlarmKitModule>('AlarmKit');
} catch (e) {
  console.warn('AlarmKit native module not found. This is expected if you are running in Expo Go.');
}

export default AlarmKit;
