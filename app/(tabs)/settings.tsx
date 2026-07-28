import { View, Text, StyleSheet, useColorScheme, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, UI } from '../../constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>
      
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable style={styles.row}>
            <Text style={[styles.rowText, { color: theme.text }]}>Default Alarm Sound</Text>
            <Text style={[styles.rowValue, { color: theme.primary }]}>Radar</Text>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable style={styles.row}>
            <Text style={[styles.rowText, { color: theme.text }]}>Snooze Duration</Text>
            <Text style={[styles.rowValue, { color: theme.primary }]}>5 mins</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable style={styles.row} onPress={() => router.push('/about')}>
            <Text style={[styles.rowText, { color: theme.text }]}>About Us</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable style={styles.row} onPress={() => router.push('/contact')}>
            <Text style={[styles.rowText, { color: theme.text }]}>Contact Us</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable style={styles.row} onPress={() => router.push('/privacy')}>
            <Text style={[styles.rowText, { color: theme.text }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable style={styles.row} onPress={() => router.push('/terms')}>
            <Text style={[styles.rowText, { color: theme.text }]}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable style={styles.row} onPress={() => router.push('/refund')}>
            <Text style={[styles.rowText, { color: theme.text }]}>Refund Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </Pressable>
        </View>

        <Text style={[styles.versionText, { color: theme.textMuted }]}>Wakup v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.h1,
    fontSize: 36,
  },
  content: {
    flex: 1,
    gap: Spacing.lg,
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 60,
  },
  rowText: {
    ...Typography.bodyLarge,
  },
  rowValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  versionText: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.xl,
    letterSpacing: 1,
  }
});
