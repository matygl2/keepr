import React, { useRef, useState } from 'react';
import {
    Dimensions,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';

const { width } = Dimensions.get('window');

interface Slide {
  key: string;
  headline: string;
  subtitle: string;
  buttonLabel: string;
  content: React.ReactNode;
}

interface Props {
  onFinish: () => void;
}

function IconGrid() {
  const icons = ['💻', '📷', '📱', '🎧'];
  return (
    <View style={styles.iconGrid}>
      {icons.map((icon) => (
        <View key={icon} style={styles.iconTile}>
          <Text style={styles.iconTileText}>{icon}</Text>
        </View>  
      ))}
    </View>
  );
}

function ScanPreviewCard() {
  const checks = [
    'Merchant detected',
    'Purchase date detected',
    'Product detected',
    'Warranty found',
  ];
  return (
    <View style={styles.previewCard}>
      <View style={styles.aiBadge}>
        <Text style={styles.aiBadgeText}>AI Reading</Text>
      </View>
      <Text style={styles.previewMeta}>FRÁVEGA · AUG 13, 2026</Text>
      <Text style={styles.previewTitle}>HP Victus 16</Text>
      <View style={styles.previewDivider} />
      {checks.map((check) => (
        <Text key={check} style={styles.checkItem}>
          ✓ {check}
        </Text>
      ))}
    </View>
  );
}

function WarrantyPreviewCard() {
  return (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View style={styles.alertIconWrap}>
          <Text style={{ fontSize: 18 }}>🛡️</Text>
        </View>
        <View>
          <Text style={styles.alertEyebrow}>WARRANTY ALERT</Text>
          <Text style={styles.alertTitle}>Warranty expiring soon</Text>
        </View>
      </View>
      <View style={styles.alertMessageBox}>
        <Text style={styles.alertMessage}>
          Your <Text style={{ fontWeight: '700', color: colors.white }}>HP Victus</Text>{' '}
          warranty expires in{' '}
          <Text style={{ fontWeight: '700', color: '#E0B45B' }}>30</Text> days.
        </Text>
      </View>
      <View style={styles.alertActions}>
        <View style={styles.alertPrimaryButton}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>
            View Product
          </Text>
        </View>
        <View style={styles.alertSecondaryButton}>
          <Text style={{ color: colors.white, fontWeight: '700' }}>Later</Text>
        </View>
      </View>
    </View>
  );
}

const slides: Slide[] = [
  {
    key: 'slide1',
    headline: 'Everything you own has a story.',
    subtitle: 'Keep your receipts, warranties and product history in one place.',
    buttonLabel: 'Get Started',
    content: <IconGrid />,
  },
  {
    key: 'slide2',
    headline: 'Scan. Save. Forget about paperwork.',
    subtitle: '',
    buttonLabel: 'Next',
    content: <ScanPreviewCard />,
  },
  {
    key: 'slide3',
    headline: 'Your products. Always protected.',
    subtitle: 'Get reminders before warranties expire. Never miss a service date.',
    buttonLabel: 'Create my account',
    content: <WarrantyPreviewCard />,
  },
];

const TAGS = ['Product', 'Price', 'Date', 'Store', 'Warranty', 'Serial No.'];

export default function OnboardingScreens({ onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(newIndex);
  };

  const handleNext = () => {
    if (index < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
      setIndex(index + 1);
    } else {
      onFinish();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
      >
        {slides.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]}>
            <View style={styles.contentArea}>{slide.content}</View>

            <Text style={styles.headline}>{slide.headline}</Text>
            {!!slide.subtitle && (
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            )}

            {slide.key === 'slide2' && (
              <View style={styles.tagsWrap}>
                {TAGS.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <View
              key={slide.key}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>{slides[index].buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    alignItems: 'center',
  },
  contentArea: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    gap: spacing.md,
    justifyContent: 'center',
  },
  iconTile: {
    width: 108,
    height: 108,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileText: {
    fontSize: 40,
  },
  headline: {
    fontFamily: fonts.serif,
    fontSize: 30,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  tag: {
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  tagText: {
    color: colors.primary,
    fontWeight: '600',
  },
  previewCard: {
    width: 260,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  aiBadge: {
    alignSelf: 'flex-end',
    backgroundColor: '#E0C88A',
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  previewMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  previewTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  previewDivider: {
    height: 2,
    backgroundColor: '#E0C88A',
    marginBottom: spacing.sm,
  },
  checkItem: {
    color: colors.secondary,
    fontSize: 13,
    marginBottom: 6,
  },
  alertCard: {
    width: 280,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertEyebrow: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  alertTitle: {
    color: colors.white,
    fontFamily: fonts.serif,
    fontSize: 15,
  },
  alertMessageBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  alertMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 19,
  },
  alertActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  alertPrimaryButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  alertSecondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.secondary,
  },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
