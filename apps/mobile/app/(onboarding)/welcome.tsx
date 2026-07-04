import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { AppButton, SectionHeader } from "../../components/primitives";
import { FitConfidenceBadge } from "../../components/fit";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function WelcomeScreen() {
  const theme = useThemeTokens();
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <View style={[styles.logoMark, { backgroundColor: theme.bgWarm, borderColor: theme.border }]}>
        <Text style={[styles.logo, { color: theme.text }]}>ROBER AI</Text>
        <Text style={[styles.tagline, { color: theme.textMuted }]}>One Stop, Perfect Fit</Text>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>A shopping app that knows which size to buy before you buy it.</Text>
      <Text style={[styles.copy, { color: theme.textMuted }]}>
        Build a private fit profile, search naturally, compare fictional brands, and let Rober explain the best size.
      </Text>
      <View style={[styles.demoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <SectionHeader kicker="Demo preview" title="Cross-brand fit" />
        <View style={styles.fitPreviewRow}>
          <Text style={[styles.previewLabel, { color: theme.text }]}>Fieldstone overshirt</Text>
          <FitConfidenceBadge confidence={91} />
        </View>
        <View style={styles.fitPreviewRow}>
          <Text style={[styles.previewLabel, { color: theme.text }]}>Northgate denim shirt</Text>
          <FitConfidenceBadge confidence={74} />
        </View>
        <View style={styles.fitPreviewRow}>
          <Text style={[styles.previewLabel, { color: theme.text }]}>Marlowe cropped jacket</Text>
          <FitConfidenceBadge confidence={52} />
        </View>
      </View>
      <Link href="/(auth)/sign-in" asChild>
        <AppButton icon={<ArrowRight size={18} color="#FFFFFF" />}>Start demo</AppButton>
      </Link>
      <Link href="/(tabs)/home" asChild>
        <AppButton variant="secondary">Skip to app</AppButton>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    padding: 24,
    paddingTop: 78,
    gap: 20
  },
  logoMark: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  logo: {
    fontSize: 28,
    fontWeight: "900"
  },
  tagline: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2
  },
  title: {
    fontSize: 44,
    fontWeight: "900",
    lineHeight: 47
  },
  copy: {
    fontSize: 16,
    lineHeight: 24
  },
  demoCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 12
  },
  fitPreviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  previewLabel: {
    flex: 1,
    fontWeight: "800"
  }
});
