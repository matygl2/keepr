// Ayuda y preguntas frecuentes. Cada pregunta se abre y se cierra al tocarla.
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface Question {
  question: string;
  answer: string;
}

interface Section {
  title: string;
  questions: Question[];
}

const SECTIONS: Section[] = [
  {
    title: 'PRODUCTS',
    questions: [
      {
        question: 'How do I add a product?',
        answer:
          'Tap the red scan button in the middle of the tab bar. Take a photo of the receipt (it is saved with the product) and then fill in the details, or choose "Add without camera" to attach a photo from your gallery or a PDF instead.',
      },
      {
        question: 'Can I edit a product after saving it?',
        answer:
          'Yes. Open the product and tap Edit at the top. You can change the name, store, price, dates and warranty length.',
      },
      {
        question: 'How do I delete a product?',
        answer:
          'In the Products tab, swipe the product to the left and tap Delete. You can also delete it from the product screen. Keepr always asks before deleting.',
      },
      {
        question: 'How do I log a repair or a service?',
        answer:
          'Open the product, go to Maintenance history and tap Add Maintenance. Write what was done, who did it, the date and the cost.',
      },
    ],
  },
  {
    title: 'DOCUMENTS',
    questions: [
      {
        question: 'Which documents can I save?',
        answer:
          'For each product you can save the receipt, the warranty and the manual, either as a photo (camera or gallery) or as a PDF of up to 5 MB.',
      },
      {
        question: 'How do I look at a document quickly?',
        answer:
          'Tap a document to open it. Touch and hold a photo to see a quick preview that closes when you let go. In a photo, pinch to zoom and double tap to go back to normal size.',
      },
    ],
  },
  {
    title: 'WARRANTIES',
    questions: [
      {
        question: 'When is a warranty "expiring soon"?',
        answer:
          'When it has 30 days or less left. Those products show up in the banner on Home and are counted in the summary card.',
      },
      {
        question: 'Can I get reminders before a warranty expires?',
        answer:
          'Yes. Go to Profile, then Notifications, turn on warranty alerts and choose whether you want to be reminded 7, 15 or 30 days before.',
      },
      {
        question: 'Can I share a warranty or sell a product?',
        answer:
          'In the product screen you can export the warranty as a PDF, or create a sale listing in English or Spanish and copy the text to paste it wherever you sell.',
      },
    ],
  },
  {
    title: 'ACCOUNT',
    questions: [
      {
        question: 'Where are my products saved?',
        answer:
          'In your Keepr account on our server, not only on this phone. If you log out or change phones, your products are still there when you log in again.',
      },
      {
        question: 'How do I move between tabs faster?',
        answer:
          'Swipe left or right on Home, Calendar, Warranties or Profile to go to the next tab. You can always tap the tab bar too.',
      },
    ],
  },
];

export default function HelpScreen() {
  // Pregunta abierta ("sección-número"); null = todas cerradas. Solo una abierta a la vez.
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Help & FAQ</Text>
        <Text style={styles.subtitle}>Answers to the most common questions about Keepr.</Text>

        {SECTIONS.map((section) => (
          <View key={section.title}>
            <Text style={styles.groupLabel}>{section.title}</Text>
            <View style={styles.card}>
              {section.questions.map((item, index) => {
                const key = `${section.title}-${index}`;
                const open = openKey === key;
                return (
                  <View key={key} style={index > 0 && styles.rowBorder}>
                    <TouchableOpacity
                      style={styles.questionRow}
                      onPress={() => setOpenKey(open ? null : key)}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                    >
                      <Text style={styles.question}>{item.question}</Text>
                      <Ionicons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                    {open && <Text style={styles.answer}>{item.answer}</Text>}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  backText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  groupLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  question: {
    flex: 1,
    color: colors.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
  answer: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
