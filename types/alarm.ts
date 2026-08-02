export type Alarm = {
  id: string;
  hour: number;
  minute: number;
  label: string;
  enabled: boolean;
  repeatDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  soundName: string;
  gameId?: string; // If undefined or 'random', the user chooses the game when the alarm rings
};

export type AlarmScheduleResult = {
  success: boolean;
  error?: string;
  alarmId?: string;
};
