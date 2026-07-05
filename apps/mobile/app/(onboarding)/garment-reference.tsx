import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FavoriteJeansReferenceForm } from "../../features/onboarding/FavoriteJeansReferenceForm";
import { IconButton } from "../../components/primitives";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function GarmentReferenceScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bgCanvas }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 34, paddingBottom: insets.bottom + 40 },
      ]}
    >
      <View style={styles.topbar}>
        <Link href="/(onboarding)/welcome" asChild>
          <IconButton accessibilityLabel="Back to fit profile options">
            <ArrowLeft size={20} color={theme.text} />
          </IconButton>
        </Link>
        <View style={{ flex: 1 }}>
          <Text style={[styles.logo, { color: theme.text }]}>Rober</Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>
            Favorite jeans baseline
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.hero,
          { backgroundColor: theme.bgWarm, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.kicker, { color: theme.accent }]}>
          THREE FIELDS
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>
          Tell us the jeans that already fit.
        </Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          Brand, size, and one optional fit note are enough to estimate a fit
          profile and unlock recommendations.
        </Text>
      </View>

      <FavoriteJeansReferenceForm />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    fontSize: 24,
    fontWeight: "900",
  },
  tagline: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
  },
  hero: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 20,
    gap: 8,
  },
  kicker: {
    fontFamily: "Courier",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 33,
  },
  copy: {
    fontSize: 14,
    lineHeight: 21,
  },
});
