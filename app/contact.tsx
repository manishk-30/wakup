import { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Pressable, useColorScheme, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, UI } from '../constants/theme';
import PortraitContainer from '../components/PortraitContainer';

export default function ContactScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleSend = async () => {
    if (!name.trim() || !subject.trim() || !description.trim()) {
      Alert.alert('Missing Fields', 'Please fill out all fields before sending.');
      return;
    }

    const email = 'karansingh240403@gmail.com';
    const emailSubject = encodeURIComponent(subject);
    const emailBody = encodeURIComponent(`From: ${name}\n\n${description}`);
    const mailtoUrl = `mailto:${email}?subject=${emailSubject}&body=${emailBody}`;

    setIsSubmitting(true);
    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        setName('');
        setSubject('');
        setDescription('');
      } else {
        Alert.alert('Error', 'No email app is installed or configured on your device.');
      }
    } catch (e) {
      void e;
      Alert.alert('Error', 'There was a problem opening your email app.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerHeight = useHeaderHeight();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <PortraitContainer>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <Text style={[styles.header, { color: theme.text }]}>Contact Us</Text>
          <Text style={[styles.paragraph, { color: theme.textMuted }]}>
            Have a question, feedback, or need support? Fill out the form below and we'll get in touch.
          </Text>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.text }]}>Name</Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
              value={name}
              onChangeText={setName}
              placeholder="Your Name"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[styles.label, { color: theme.text }]}>Subject</Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
              value={subject}
              onChangeText={setSubject}
              placeholder="What is this regarding?"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[styles.label, { color: theme.text }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us more about your inquiry..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Pressable
              style={[styles.button, { backgroundColor: theme.primary }, isSubmitting && styles.buttonDisabled]}
              onPress={handleSend}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Send Message</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
              <Text style={[styles.backButtonText, { color: theme.text }]}>Back to Previous Screen</Text>
            </Pressable>
          </View>
        </ScrollView>
      </PortraitContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl * 2,
  },
  header: {
    ...Typography.h1,
    fontSize: 28,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  paragraph: {
    ...Typography.bodyLarge,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.md,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  button: {
    height: 48,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: UI.buttonHeight,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  backButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
});
