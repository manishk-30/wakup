import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer } from 'expo-audio';
import { ALARM_SOUNDS } from '../constants/sounds';
import { soundSelectionStore } from '../services/soundSelectionStore';
import { Colors, Typography, Spacing, Radii, UI } from '../constants/theme';
import PortraitContainer from '../components/PortraitContainer';

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
      } catch (e) {
        void e;
      }
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
      <PortraitContainer>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

          <Pressable
            style={[styles.cancelButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => {
              stopPreview();
              router.back();
            }}
          >
            <Ionicons name="close" size={20} color={theme.text} />
            <Text style={[styles.cancelButtonText, { color: theme.text }]}>Close</Text>
          </Pressable>
        </ScrollView>
      </PortraitContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl * 2,
  },
  title: {
    ...Typography.h1,
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyLarge,
    marginBottom: Spacing.xl,
  },
  list: {
    gap: Spacing.md,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  soundLabel: {
    ...Typography.bodyLarge,
    flex: 1,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: UI.buttonHeight,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  cancelButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
});
