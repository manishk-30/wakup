import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm } from '../types/alarm';

const ALARMS_KEY = '@wakup_alarms';

export const storageService = {
  async getAlarms(): Promise<Alarm[]> {
    try {
      const data = await AsyncStorage.getItem(ALARMS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load alarms', e);
      return [];
    }
  },

  async saveAlarms(alarms: Alarm[]): Promise<void> {
    try {
      await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
    } catch (e) {
      console.error('Failed to save alarms', e);
    }
  },

  async getAlarm(id: string): Promise<Alarm | undefined> {
    const alarms = await this.getAlarms();
    return alarms.find(a => a.id === id);
  },

  async addAlarm(alarm: Alarm): Promise<void> {
    const alarms = await this.getAlarms();
    alarms.push(alarm);
    await this.saveAlarms(alarms);
  },

  async updateAlarm(alarm: Alarm): Promise<void> {
    const alarms = await this.getAlarms();
    const index = alarms.findIndex(a => a.id === alarm.id);
    if (index !== -1) {
      alarms[index] = alarm;
      await this.saveAlarms(alarms);
    }
  },

  async deleteAlarm(id: string): Promise<void> {
    const alarms = await this.getAlarms();
    const newAlarms = alarms.filter(a => a.id !== id);
    await this.saveAlarms(newAlarms);
  }
};
