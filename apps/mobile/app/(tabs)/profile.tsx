import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton, SectionHeader, ThemeToggle } from "../../components/primitives";
import { SimilarToFavoriteItemChip } from "../../components/fit";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function ProfileScreen() {
  const theme = useThemeTokens();
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <SectionHeader kicker="Account" title="Fit profile" action={<ThemeToggle />} />
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Demo Shopper</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          Height 178 cm, chest 101 cm, waist 84 cm, hip 98 cm, shoulder 46 cm. Measurements stay out of analytics.
        </Text>
        <SimilarToFavoriteItemChip label="Fieldstone chore overshirt" />
      </View>
      <Link href="/(onboarding)/body-profile" asChild>
        <AppButton variant="secondary">Edit body profile</AppButton>
      </Link>
      <Link href="/investor-demo" asChild>
        <AppButton>Open investor dashboard</AppButton>
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
    paddingTop: 64,
    paddingBottom: 120,
    gap: 16
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 12
  },
  title: {
    fontSize: 24,
    fontWeight: "900"
  },
  copy: {
    fontSize: 14,
    lineHeight: 21
  }
});
