import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { AppButton, BrandPill, SectionHeader, ThemeToggle } from "../../components/primitives";
import { FitConfidenceRing } from "../../components/fit";
import { ProductRail } from "../../components/product";
import { closetInspiredProducts, demoBrands, featuredProducts, newArrivalProducts, toProductCard } from "../../lib/catalog";
import { rankHomeFeed } from "../../lib/recommendations";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function HomeScreen() {
  const theme = useThemeTokens();
  const bodyProfile = useDemoStore((state) => state.bodyProfile);
  const styleProfile = useDemoStore((state) => state.styleProfile);
  const favorite = useDemoStore((state) => state.knownGoodItems[0]);
  const rankedFeed = rankHomeFeed(bodyProfile, styleProfile, favorite).slice(0, 8);
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <View style={styles.topbar}>
        <View>
          <Text style={[styles.logo, { color: theme.text }]}>ROBER AI</Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>One Stop, Perfect Fit</Text>
        </View>
        <ThemeToggle />
      </View>

      <View style={[styles.hero, { backgroundColor: theme.bgWarm, borderColor: theme.border }]}>
        <Text style={[styles.heroKicker, { color: theme.accent }]}>FIT INTELLIGENCE</Text>
        <Text style={[styles.heroTitle, { color: theme.text }]}>Search once. See what fits across brands.</Text>
        <Text style={[styles.heroCopy, { color: theme.textMuted }]}>
          Rober normalizes every size chart against your profile, favorite garments, and preferred silhouette.
        </Text>
        <View style={styles.heroActions}>
          <Link href="/compare" asChild>
            <AppButton icon={<Sparkles color="#FFFFFF" size={18} />}>Find Best Fit</AppButton>
          </Link>
          <Link href="/stylist" asChild>
            <AppButton variant="secondary">Ask Stylist</AppButton>
          </Link>
        </View>
      </View>

      <SectionHeader kicker="Profile signal" title="Fit profile" />
      <View style={[styles.fitSummary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <FitConfidenceRing confidence={88} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>Demo profile complete</Text>
          <Text style={[styles.summaryCopy, { color: theme.textMuted }]}>
            Relaxed top fit, regular bottoms, clay and olive palette, favorite overshirt reference item saved.
          </Text>
        </View>
      </View>

      <SectionHeader kicker="Brand rail" title="Popular in your fit" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
        {demoBrands.slice(0, 6).map((brand, index) => (
          <BrandPill key={brand.slug} label={brand.name.split(" ")[0] ?? brand.name} selected={index === 0} />
        ))}
      </ScrollView>

      <SectionHeader kicker="For you" title="Best Fit for You" />
      <ProductRail products={rankedFeed.map((entry) => entry.card)} />

      <SectionHeader kicker="New" title="New arrivals" />
      <ProductRail products={newArrivalProducts.slice(0, 8).map((product, index) => toProductCard(product, 86 - index * 2))} />

      <SectionHeader kicker="Closet signal" title="Because your overshirt fits well" />
      <ProductRail products={closetInspiredProducts.slice(0, 8).map((product, index) => toProductCard(product, 89 - index))} />

      <View style={{ height: 120 }} />
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
    gap: 24
  },
  topbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  logo: {
    fontSize: 26,
    fontWeight: "900"
  },
  tagline: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "700"
  },
  hero: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    gap: 14
  },
  heroKicker: {
    fontFamily: "Courier",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 44
  },
  heroCopy: {
    fontSize: 15,
    lineHeight: 22
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6
  },
  fitSummary: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    gap: 16,
    alignItems: "center"
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 5
  },
  summaryCopy: {
    fontSize: 14,
    lineHeight: 20
  },
  pills: {
    gap: 10
  }
});
