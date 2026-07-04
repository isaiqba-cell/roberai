import { useMemo, useState } from "react";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowLeft, SlidersHorizontal } from "lucide-react-native";
import { parseNaturalLanguageSearch } from "@rober/fit-engine";
import { AppButton, Chip, IconButton, SectionHeader } from "../components/primitives";
import { FitDimensionBreakdown, FitExplanationCard, FitSpectrumSlider, RecommendedSizeCard } from "../components/fit";
import { BestFitCompareCard, CompareBrandCard } from "../components/product";
import { compareProductsForQuery } from "../lib/fitEngine";
import { useDemoStore } from "../stores/useDemoStore";
import { useThemeTokens } from "../theme/useThemeTokens";

const defaultQuery = "olive cotton overshirt under $100 relaxed";

export default function CompareScreen() {
  const theme = useThemeTokens();
  const [query, setQuery] = useState(defaultQuery);
  const [spectrum, setSpectrum] = useState(62);
  const bodyProfile = useDemoStore((state) => state.bodyProfile);
  const favorite = useDemoStore((state) => state.knownGoodItems[0]);
  const parsed = useMemo(() => parseNaturalLanguageSearch(query), [query]);
  const results = useMemo(
    () =>
      compareProductsForQuery(query, bodyProfile, spectrum, favorite ? {
        itemName: favorite.itemName,
        category: favorite.category,
        sizeLabel: favorite.sizeLabel,
        fitNotes: favorite.fitNotes,
        measurements: favorite.measurements
      } : undefined),
    [bodyProfile, favorite, query, spectrum]
  );
  const [best, ...alternatives] = results;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <View style={styles.topbar}>
        <Link href="/(tabs)/home" asChild>
          <IconButton accessibilityLabel="Back to home">
            <ArrowLeft size={20} color={theme.text} />
          </IconButton>
        </Link>
        <Text style={[styles.logo, { color: theme.text }]}>Best Fit Finder</Text>
      </View>

      <View style={[styles.hero, { backgroundColor: theme.bgWarm, borderColor: theme.border }]}>
        <Text style={[styles.kicker, { color: theme.accent }]}>CROSS-BRAND FIT</Text>
        <Text style={[styles.title, { color: theme.text }]}>One query, every size chart normalized.</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          Rober compares variants across fictional merchants and elevates the size most likely to fit your body and preference.
        </Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <SlidersHorizontal size={18} color={theme.textMuted} />
        <TextInput
          accessibilityLabel="Natural language compare search"
          value={query}
          onChangeText={setQuery}
          placeholder="green cotton overshirt under $80, slim fit"
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <View style={styles.chips}>
        {parsed.category ? <Chip label={`category: ${parsed.category}`} selected /> : null}
        {parsed.colors.map((color) => (
          <Chip key={color} label={`color: ${color}`} selected />
        ))}
        {parsed.materials.map((material) => (
          <Chip key={material} label={`material: ${material}`} selected />
        ))}
        {parsed.priceMax ? <Chip label={`under $${parsed.priceMax}`} selected /> : null}
        {parsed.fitIntent ? <Chip label={`fit: ${parsed.fitIntent}`} selected /> : null}
      </View>

      <FitSpectrumSlider value={spectrum} onChange={setSpectrum} />

      {best ? (
        <>
          <SectionHeader kicker="Best fit" title="Rober recommendation" />
          <RecommendedSizeCard sizeLabel={best.recommendedSize} confidence={best.confidence}>
            <Text style={[styles.sizeContext, { color: theme.textMuted }]}>{best.product.brand.name}</Text>
          </RecommendedSizeCard>
          <BestFitCompareCard product={best.card} />
          <FitExplanationCard lines={best.explanation} />
          <FitDimensionBreakdown scores={best.dimensionScores} />
        </>
      ) : (
        <View style={[styles.empty, { backgroundColor: theme.surfaceWarm, borderColor: theme.border }]}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No fit-ready matches</Text>
          <Text style={[styles.copy, { color: theme.textMuted }]}>Try overshirt, jeans, blazer, knit, boots, or remove the price constraint.</Text>
        </View>
      )}

      <SectionHeader kicker="Alternatives" title="Cross-brand comparison" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compareRail}>
        {alternatives.slice(0, 8).map((entry) => (
          <CompareBrandCard key={entry.product.id} product={entry.card} />
        ))}
      </ScrollView>

      <Link href={best ? `/product/${best.product.id}` : "/(tabs)/discover"} asChild>
        <AppButton>{best ? "Open product detail" : "Browse catalog"}</AppButton>
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
    paddingTop: 60,
    paddingBottom: 44,
    gap: 18
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  logo: {
    fontSize: 19,
    fontWeight: "900"
  },
  hero: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    gap: 10
  },
  kicker: {
    fontFamily: "Courier",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 37
  },
  copy: {
    fontSize: 14,
    lineHeight: 21
  },
  searchBox: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800"
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  sizeContext: {
    fontSize: 12,
    fontWeight: "800"
  },
  compareRail: {
    gap: 12
  },
  empty: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 8
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900"
  }
});
