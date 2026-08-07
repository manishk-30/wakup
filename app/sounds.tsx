import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer } from 'expo-audio';
import { ALARM_SOUNDS } from '../constants/sounds';
import { soundSelectionStore } from '../services/soundSelectionStore';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';

export default function SoundSelectionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [selectedSoundId, setSelectedSoundId] = soundSelectionStore.useSound(ALARM_SOUNDS[0].id);
  
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const previewPlayerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  const stopPreview = () => {
    if (previewPlayerRef.current) {
      try {
        previewPlayerRef.current.pause();
        if (typeof previewPlayerRef.current.release === 'function') {
          previewPlayerRef.current.release();
        }
      } catch (e) {}
      previewPlayerRef.current = null;
    }
    setPlayingSoundId(null);
  };

  const togglePlay = (soundId: string) => {
    const soundConfig = ALARM_SOUNDS.find(s => s.id === soundId);
    if (!soundConfig) return;

    if (playingSoundId === soundId) {
      stopPreview();
    } else {
      stopPreview();
      try {
        const player = createAudioPlayer(soundConfig.file);
        player.play();
        previewPlayerRef.current = player;
        setPlayingSoundId(soundId);
      } catch (e) {
        console.warn('Failed to preview sound:', e);
      }
    }
  };

  const handleSelect = (soundId: string) => {
    stopPreview();
    setSelectedSoundId(soundId);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.text }]}>Alarm Sound</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Choose the sound you want to wake up to.
        </Text>
        
        <View style={styles.list}>
          {ALARM_SOUNDS.map((sound) => {
            const isSelected = selectedSoundId === sound.id;
            const isPlaying = playingSoundId === sound.id;

            return (
              <Pressable
                key={sound.id}
                style={[
                  styles.soundRow,
                  { 
                    backgroundColor: isSelected ? 'rgba(255, 176, 0, 0.1)' : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  }
                ]}
                onPress={() => handleSelect(sound.id)}
              >
                <Pressable
                  style={[
                    styles.playButton,
                    { backgroundColor: isPlaying ? theme.primary : (isSelected ? 'rgba(255, 176, 0, 0.2)' : theme.background) }
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    togglePlay(sound.id);
                  }}
                >
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={24} 
                    color={isPlaying ? "#FFF" : theme.primary} 
                  />
                </Pressable>
                
                <Text style={[
                  styles.soundLabel,
                  { color: isSelected ? theme.primary : theme.text }
                ]}>
                  {sound.label}
                </Text>

                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  list: {
    gap: Spacing.sm,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: Radii.lg,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  soundLabel: {
    ...Typography.h3,
    flex: 1,
  },
});
