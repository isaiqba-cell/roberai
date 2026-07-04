import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton, SectionHeader } from "../../components/primitives";
import { FitConfidenceRing } from "../../components/fit";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function FinishScreen() {
  const theme = useThemeTokens();
  const bodyProfile = useDemoStore((state) => state.bodyProfile);
  const styleProfile = useDemoStore((state) => state.styleProfile);
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <SectionHeader kicker="Ready" title="Your fit brain is live" />
      <View style={[styles.card, { backgroundColor: theme.surfaceWarm, borderColor: theme.border }]}>
        <FitConfidenceRing confidence={88} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>Rober has enough signal to compare brands.</Text>
          <Text style={[styles.copy, { color: theme.textMuted }]}>
            Fit preference: {bodyProfile.fitPreference}. Style memory: {styleProfile.styleTags.slice(0, 3).join(", ")}.
          </Text>
        </View>
      </View>
      <Link href="/compare" asChild>
        <AppButton>Open Best Fit Finder</AppButton>
      </Link>
      <Link href="/(tabs)/home" asChild>
        <AppButton variant="secondary">Go to home</AppButton>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    padding: 20,
    paddingTop: 72,
    gap: 18
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    gap: 16,
    alignItems: "center"
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 25
  },
  copy: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21
  }
});
