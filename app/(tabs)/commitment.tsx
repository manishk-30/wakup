import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, useColorScheme, View, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing, Typography } from '../../constants/theme';
import { storageService } from '../../services/storageService';

import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function CommitmentScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [commitment, setCommitment] = useState<{ reason: string; signatureImage: string; signedAt: number } | null>(null);
  
  useFocusEffect(
    useCallback(() => {
      const loadCommitment = async () => {
        const data = await storageService.getCommitment();
        setCommitment(data);
      };
      loadCommitment();
    }, [])
  );

  const formattedDate = commitment?.signedAt 
    ? new Date(commitment.signedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Your Promise</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            A reminder of the commitment you made to yourself.
          </Text>
        </View>

        {commitment ? (
          <View style={[styles.letterCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.dateText, { color: theme.textMuted }]}>{formattedDate}</Text>
            
            <Text style={[styles.pledgeText, { color: theme.text }]}>
              I am committing to my future self right now.{"\n\n"}
              I will wake up, beat the alarm, and win the morning.{"\n\n"}
              My goals are worth more than sleep.
            </Text>

            <View style={[styles.signatureContainer, { borderColor: theme.border }]}>
              {commitment.signatureImage ? (
                <Image 
                  source={{ uri: commitment.signatureImage }} 
                  style={styles.signatureImage} 
                  contentFit="contain"
                />
              ) : (
                <Text style={{ color: theme.textMuted }}>No signature recorded</Text>
              )}
            </View>
            <Text style={[styles.signatureLabel, { color: theme.textMuted }]}>Signed By You</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: Spacing.md }}>📜</Text>
            <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>
              You haven't made a commitment yet.
            </Text>
          </View>
        )}
      </ScrollView>
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
  header: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyLarge,
  },
  letterCard: {
    padding: Spacing.xl,
    borderRadius: Radii.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  dateText: {
    ...Typography.caption,
    textAlign: 'right',
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  pledgeText: {
    ...Typography.bodyLarge,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 28,
  },
  signatureContainer: {
    height: 120,
    width: '100%',
    borderRadius: Radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    overflow: 'hidden',
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },
  signatureLabel: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyStateText: {
    ...Typography.bodyLarge,
    textAlign: 'center',
  }
});
