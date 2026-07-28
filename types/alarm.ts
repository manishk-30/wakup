export type Alarm = {
  id: string;
  hour: number;
  minute: number;
  label: string;
  enabled: boolean;
  repeatDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  soundName: string;
};

export type AlarmScheduleResult = {
  success: boolean;
  error?: string;
  alarmId?: string;
};
