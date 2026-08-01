import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm } from '../types/alarm';

const ALARMS_KEY = '@wakup_alarms';
const STREAKS_KEY = '@wakup_streaks';
const ONBOARDING_KEY = '@wakup_onboarding';
const ONBOARDING_ANSWERS_KEY = '@wakup_onboarding_answers';

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
  },

  async getStreakDays(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STREAKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load streaks', e);
      return [];
    }
  },

  async addStreakDay(dateString: string): Promise<void> {
    try {
      const days = await this.getStreakDays();
      if (!days.includes(dateString)) {
        days.push(dateString);
        await AsyncStorage.setItem(STREAKS_KEY, JSON.stringify(days));
      }
    } catch (e) {
      console.error('Failed to save streak', e);
    }
  },

  async getStreakLength(): Promise<number> {
    const days = await this.getStreakDays();
    if (days.length === 0) return 0;

    // Sort descending
    const sorted = days.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let currentStreak = 0;
    const today = new Date();
    // Normalize today to start of day
    today.setHours(0, 0, 0, 0);

    // Check if the most recent streak day is today or yesterday
    const mostRecent = new Date(sorted[0]);
    mostRecent.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(today.getTime() - mostRecent.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // If last win was more than 1 day ago (e.g. they missed yesterday), streak is 0
    if (diffDays > 1) {
      return 0;
    }

    // Count backwards
    let expectedDate = new Date(mostRecent);
    
    for (const dStr of sorted) {
      const d = new Date(dStr);
      d.setHours(0,0,0,0);
      if (d.getTime() === expectedDate.getTime()) {
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break; // Streak broken
      }
    }
    return currentStreak;
  },

  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(ONBOARDING_KEY);
      return data === 'true';
    } catch (e) {
      console.error('Failed to get onboarding state', e);
      return false;
    }
  },

  async completeOnboarding(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {
      console.error('Failed to complete onboarding', e);
    }
  },

  async saveOnboardingAnswers(answers: Record<string, string>): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_ANSWERS_KEY, JSON.stringify(answers));
    } catch (e) {
      console.error('Failed to save onboarding answers', e);
    }
  },

  async getOnboardingAnswers(): Promise<Record<string, string>> {
    try {
      const data = await AsyncStorage.getItem(ONBOARDING_ANSWERS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  // Used for debugging/testing
  async clearOnboarding(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      await AsyncStorage.removeItem(ONBOARDING_ANSWERS_KEY);
    } catch (e) {
      console.error('Failed to clear onboarding', e);
    }
  }
};
