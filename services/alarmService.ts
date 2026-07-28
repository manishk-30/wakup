import { Alarm, AlarmScheduleResult } from '../types/alarm';
import * as AlarmKit from '../modules/alarm-kit/src';
import { storageService } from './storageService';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

// For Expo Go compatibility during UI development, we provide a mock fallback
const isNativeModuleAvailable = Platform.OS === 'ios' && AlarmKit !== null;

let foregroundSound: Audio.Sound | null = null;

export const alarmService = {
  async requestAuthorization(): Promise<boolean> {
    if (isNativeModuleAvailable && AlarmKit.default?.requestAuthorization) {
      return await AlarmKit.default!.requestAuthorization();
    }
    console.log('[AlarmService] Mock: requestAuthorization');
    return true;
  },

  async scheduleAlarm(alarm: Alarm): Promise<AlarmScheduleResult> {
    if (isNativeModuleAvailable && AlarmKit.default?.scheduleAlarm) {
      return await AlarmKit.default!.scheduleAlarm(alarm);
    }
    console.log('[AlarmService] Mock: scheduleAlarm', alarm);
    return { success: true, alarmId: alarm.id };
  },

  async cancelAlarm(id: string): Promise<boolean> {
    if (isNativeModuleAvailable && AlarmKit.default?.cancelAlarm) {
      return await AlarmKit.default!.cancelAlarm(id);
    }
    console.log('[AlarmService] Mock: cancelAlarm', id);
    return true;
  },

  async stopAlarm(id: string): Promise<boolean> {
    await this.stopForegroundAlarm();
    
    // Cancel the rest of today's machine gun chain immediately
    await this.cancelAlarm(id);
    
    // Handle rescheduling or disabling the alarm
    try {
      const alarms = await storageService.getAlarms();
      const alarm = alarms.find(a => a.id === id);
      
      if (alarm) {
        if (alarm.repeatDays.length > 0) {
          // If it repeats, reschedule the 10-chain for the next occurrence
          await this.scheduleAlarm(alarm);
        } else {
          // One-time alarm: turn it off completely
          alarm.enabled = false;
          await storageService.updateAlarm(alarm);
        }
      }
    } catch (e) {
      console.warn('Failed to handle alarm repeat logic', e);
    }
    
    if (isNativeModuleAvailable && AlarmKit.default?.stopAlarm) {
      return await AlarmKit.default!.stopAlarm(id);
    }
    console.log('[AlarmService] Mock: stopAlarm completed', id);
    return true;
  },
  
  async playForegroundAlarm(file: any): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      const { sound } = await Audio.Sound.createAsync(file, {
        shouldPlay: true,
        isLooping: true,
        volume: 1.0,
      });
      foregroundSound = sound;
    } catch (e) {
      console.warn('Foreground audio failed', e);
    }
  },

  async stopForegroundAlarm(): Promise<void> {
    if (foregroundSound) {
      try {
        await foregroundSound.stopAsync();
        await foregroundSound.unloadAsync();
      } catch (e) {
        // ignore errors on unload
      }
      foregroundSound = null;
    }
  },
  
  async snoozeAlarm(id: string): Promise<boolean> {
    if (isNativeModuleAvailable && AlarmKit.default?.snoozeAlarm) {
      return await AlarmKit.default!.snoozeAlarm(id);
    }
    console.log('[AlarmService] Mock: snoozeAlarm', id);
    return true;
  },

  async configureAudioSession(): Promise<boolean> {
    if (isNativeModuleAvailable && AlarmKit.default?.configureAudioSession) {
      return await AlarmKit.default!.configureAudioSession();
    }
    return true; // Mock success
  }
};
