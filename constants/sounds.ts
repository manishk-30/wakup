export interface AlarmSound {
  id: string;
  label: string;
  file: any;
}

// Map the filenames (which must exactly match the .wav files in assets/sounds) 
// to their display names and require() paths for expo-av.
export const ALARM_SOUNDS: AlarmSound[] = [
  { 
    id: 'alarm.wav', 
    label: 'Classic Bell', 
    file: require('../assets/sounds/alarm.wav') 
  },
  { 
    id: 'radar.wav', 
    label: 'Radar', 
    file: require('../assets/sounds/radar.wav') 
  },
];
