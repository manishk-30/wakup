import { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Pressable, useColorScheme, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';

export default function ContactScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = async () => {
    if (!name.trim() || !subject.trim() || !description.trim()) {
      Alert.alert('Missing Fields', 'Please fill out all fields before sending.');
      return;
    }

    const email = 'karansingh240403@gmail.com';
    const emailSubject = encodeURIComponent(subject);
    const emailBody = encodeURIComponent(`From: ${name}\n\n${description}`);
    const mailtoUrl = `mailto:${email}?subject=${emailSubject}&body=${emailBody}`;

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
    } catch (error) {
      Alert.alert('Error', 'There was a problem opening your email app.');
    }
  };

  const headerHeight = useHeaderHeight();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView style={styles.container}>
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
          style={[
            styles.input, 
            styles.textArea,
            { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }
          ]}
          value={description}
          onChangeText={setDescription}
          placeholder="Write your message here..."
          placeholderTextColor={theme.textMuted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <Pressable 
          style={[styles.sendButton, { backgroundColor: theme.primary, opacity: isSubmitting ? 0.7 : 1 }]}
          onPress={handleSend}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.sendButtonText}>Send Message</Text>
          )}
        </Pressable>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
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
    paddingBottom: Spacing.xxl * 2,
  },
  label: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    ...Typography.bodyLarge,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 120,
    paddingTop: Spacing.md,
  },
  sendButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    minHeight: 56,
  },
  sendButtonText: {
    ...Typography.h3,
    color: '#FFF',
  },
});
