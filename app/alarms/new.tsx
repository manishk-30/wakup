import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, useColorScheme, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Typography, Spacing, Radii } from '../../constants/theme';
import { storageService } from '../../services/storageService';
import { alarmService } from '../../services/alarmService';
import { Alarm } from '../../types/alarm';
import { ALARM_SOUNDS } from '../../constants/sounds';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function AddAlarm() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  const defaultTime = new Date();
  defaultTime.setHours(7, 30, 0, 0);
  const [time, setTime] = useState(defaultTime);
  const [label, setLabel] = useState('Wake Up');
  const [repeatDays, setRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [soundName, setSoundName] = useState(ALARM_SOUNDS[0].id);

  const toggleDay = (index: number) => {
    if (repeatDays.includes(index)) {
      setRepeatDays(repeatDays.filter(d => d !== index));
    } else {
      setRepeatDays([...repeatDays, index].sort());
    }
  };

  const handleSave = async () => {
    const h = time.getHours();
    const m = time.getMinutes();

    const newAlarm: Alarm = {
      id: generateUUID(),
      hour: h,
      minute: m,
      label,
      enabled: true,
      repeatDays,
      soundName,
    };

    await storageService.addAlarm(newAlarm);
    await alarmService.scheduleAlarm(newAlarm);
    
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.timePickerContainer}>
        <DateTimePicker
          value={time}
          mode="time"
          display="spinner"
          onChange={(event, selectedDate) => {
            if (selectedDate) setTime(selectedDate);
          }}
          textColor={theme.text}
          themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
          style={{ width: '100%', height: 200 }}
        />
      </View>

      <View style={styles.section}>
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

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Label</Text>
        <TextInput
          style={[styles.labelInput, { color: theme.text, backgroundColor: theme.surface }]}
          value={label}
          onChangeText={setLabel}
          placeholderTextColor={theme.textMuted}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Sound</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.soundsContainer}>
          {ALARM_SOUNDS.map((sound) => {
            const isSelected = soundName === sound.id;
            return (
              <Pressable
                key={sound.id}
                style={[
                  styles.soundChip,
                  { 
                    backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : theme.surface,
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
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Games</Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          Choose any game when your alarm rings. Win once to stop it.
        </Text>
      </View>

      <Pressable 
        style={[styles.saveButton, { backgroundColor: theme.primary }]}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>Save Alarm</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xl,
  },
  timeInput: {
    ...Typography.h1,
    width: 90,
    height: 90,
    textAlign: 'center',
    borderRadius: Radii.lg,
  },
  colon: {
    ...Typography.h1,
    marginHorizontal: Spacing.sm,
  },
  ampmContainer: {
    marginLeft: Spacing.lg,
    gap: Spacing.sm,
  },
  ampmButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.full,
  },
  ampmText: {
    ...Typography.bodyLarge,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  labelInput: {
    ...Typography.bodyLarge,
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  soundsContainer: {
    gap: Spacing.sm,
    paddingRight: Spacing.xl,
  },
  soundChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  soundText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  helpText: {
    ...Typography.body,
    lineHeight: 24,
  },
  saveButton: {
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl * 2,
  },
  saveButtonText: {
    ...Typography.h3,
    color: '#FFF',
  },
});
