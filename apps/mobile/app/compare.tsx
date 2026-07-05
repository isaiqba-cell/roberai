import { useMemo, useState } from "react";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowLeft, SlidersHorizontal } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  translateFavoriteJeansFit,
  type JeansTranslationRecommendation,
} from "@rober/api-client";
import { parseNaturalLanguageSearch } from "@rober/fit-engine";
import {
  AppButton,
  Chip,
  IconButton,
  SectionHeader,
} from "../components/primitives";
import {
  FitDimensionBreakdown,
  FitExplanationCard,
  FitSpectrumSlider,
  RecommendedSizeCard,
} from "../components/fit";
import { BestFitCompareCard, CompareBrandCard } from "../components/product";
import { compareProductsForQuery } from "../lib/fitEngine";
import { useDemoStore } from "../stores/useDemoStore";
import { useThemeTokens } from "../theme/useThemeTokens";

const defaultQuery = "straight denim jeans under $150";

export default function CompareScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState(defaultQuery);
  const [spectrum, setSpectrum] = useState(62);
  const bodyProfile = useDemoStore((state) => state.bodyProfile);
  const favorite = useDemoStore((state) => state.knownGoodItems[0]);
  const parsed = useMemo(() => parseNaturalLanguageSearch(query), [query]);
  const translation = useMemo(
    () =>
      translateFavoriteJeansFit({
        anchorStyleId: "levis-501-original",
        taggedSize: "32x32",
      }),
    [],
  );
  const results = useMemo(
    () =>
      compareProductsForQuery(
        query,
        bodyProfile,
        spectrum,
        favorite
          ? {
              itemName: favorite.itemName,
              category: favorite.category,
              sizeLabel: favorite.sizeLabel,
              fitNotes: favorite.fitNotes,
              measurements: favorite.measurements,
            }
          : undefined,
      ),
    [bodyProfile, favorite, query, spectrum],
  );
  const [best, ...alternatives] = results;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bgCanvas }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 42 },
      ]}
    >
      <View style={styles.topbar}>
        <Link href="/(tabs)/home" asChild>
          <IconButton accessibilityLabel="Back to home">
            <ArrowLeft size={20} color={theme.text} />
          </IconButton>
        </Link>
        <Text style={[styles.logo, { color: theme.text }]}>
          Best Fit Finder
        </Text>
      </View>

      <View
        style={[
          styles.hero,
          { backgroundColor: theme.bgWarm, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.kicker, { color: theme.accent }]}>
          JEANS SIZE-CHART MATCHING
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>
          One favorite pair, every brand size normalized.
        </Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          Rober compares official jeans waist, hip, and inseam charts, then
          recommends the closest size across price points.
        </Text>
      </View>

      <SectionHeader
        kicker="Fit passport"
        title={`${translation.anchor.brandName} ${translation.anchor.styleName} vs alternatives`}
      />
      <View
        style={[
          styles.translationTable,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View
          style={[
            styles.anchorRow,
            { backgroundColor: theme.surfaceWarm, borderColor: theme.border },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.anchorKicker, { color: theme.accent }]}>
              Anchor
            </Text>
            <Text style={[styles.anchorTitle, { color: theme.text }]}>
              {translation.anchor.styleName} in {translation.recommendedSize}
            </Text>
          </View>
          <Text style={[styles.anchorMeta, { color: theme.textMuted }]}>
            {translation.anchor.taxonomy.fitFamily}
          </Text>
        </View>
        {translation.recommendations.slice(0, 5).map((item) => (
          <TranslationComparisonRow key={item.style.id} item={item} />
        ))}
      </View>

      <View
        style={[
          styles.searchBox,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <SlidersHorizontal size={18} color={theme.textMuted} />
        <TextInput
          accessibilityLabel="Natural language compare search"
          value={query}
          onChangeText={setQuery}
          placeholder="straight jeans under $100"
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <View style={styles.chips}>
        {parsed.category ? (
          <Chip label={formatChipLabel(parsed.category)} selected />
        ) : null}
        {parsed.colors.map((color) => (
          <Chip key={color} label={formatChipLabel(color)} selected />
        ))}
        {parsed.materials.map((material) => (
          <Chip key={material} label={formatChipLabel(material)} selected />
        ))}
        {parsed.priceMax ? (
          <Chip label={`Under $${parsed.priceMax}`} selected />
        ) : null}
        {parsed.fitIntent ? (
          <Chip label={`${formatChipLabel(parsed.fitIntent)} fit`} selected />
        ) : null}
      </View>

      <FitSpectrumSlider value={spectrum} onChange={setSpectrum} />

      {best ? (
        <>
          <SectionHeader kicker="Best fit" title="Rober recommendation" />
          <RecommendedSizeCard
            sizeLabel={best.recommendedSize}
            confidence={best.confidence}
          >
            <Text style={[styles.sizeContext, { color: theme.textMuted }]}>
              {best.product.brand.name}
            </Text>
          </RecommendedSizeCard>
          <BestFitCompareCard product={best.card} />
          <FitExplanationCard lines={best.explanation} />
          <FitDimensionBreakdown scores={best.dimensionScores} />
        </>
      ) : (
        <View
          style={[
            styles.empty,
            { backgroundColor: theme.surfaceWarm, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No fit-ready matches
          </Text>
          <Text style={[styles.copy, { color: theme.textMuted }]}>
            Try straight jeans, relaxed denim, curvy jeans, or remove the price
            constraint.
          </Text>
        </View>
      )}

      <SectionHeader kicker="Alternatives" title="Cross-brand comparison" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.compareRail}
      >
        {alternatives.slice(0, 8).map((entry) => (
          <CompareBrandCard key={entry.product.id} product={entry.card} />
        ))}
      </ScrollView>

      <Link
        href={best ? `/product/${best.product.id}` : "/discover"}
        asChild
      >
        <AppButton>{best ? "Open product detail" : "Browse catalog"}</AppButton>
      </Link>
    </ScrollView>
  );
}

function formatChipLabel(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function TranslationComparisonRow({
  item,
}: {
  item: JeansTranslationRecommendation;
}) {
  const theme = useThemeTokens();
  return (
    <View style={[styles.translationRow, { borderColor: theme.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.translationBrand, { color: theme.textMuted }]}>
          {item.style.brandName}
        </Text>
        <Text style={[styles.translationTitle, { color: theme.text }]}>
          {item.style.styleName}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.translationWhy, { color: theme.textMuted }]}
        >
          {item.explanation}
        </Text>
      </View>
      <View style={styles.translationMetrics}>
        <Text style={[styles.translationScore, { color: theme.accent }]}>
          {item.overallScore}
        </Text>
        <Text style={[styles.translationMeta, { color: theme.textMuted }]}>
          {item.style.taxonomy.seatRoom}/{item.style.taxonomy.thighRoom}
        </Text>
        <Text style={[styles.translationMeta, { color: theme.textMuted }]}>
          {item.style.taxonomy.hemBehavior}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 18,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    fontSize: 19,
    fontWeight: "900",
  },
  hero: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    gap: 10,
  },
  kicker: {
    fontFamily: "Courier",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 37,
  },
  copy: {
    fontSize: 14,
    lineHeight: 21,
  },
  translationTable: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  anchorRow: {
    borderBottomWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  anchorKicker: {
    fontFamily: "Courier",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  anchorTitle: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: "900",
  },
  anchorMeta: {
    fontSize: 12,
    fontWeight: "900",
    maxWidth: 96,
    textAlign: "right",
  },
  translationRow: {
    minHeight: 112,
    borderBottomWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  translationBrand: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  translationTitle: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: "900",
  },
  translationWhy: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
  },
  translationMetrics: {
    width: 94,
    alignItems: "flex-end",
    gap: 4,
  },
  translationScore: {
    fontSize: 27,
    fontWeight: "900",
  },
  translationMeta: {
    fontSize: 10,
    fontWeight: "800",
    textAlign: "right",
  },
  searchBox: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sizeContext: {
    fontSize: 12,
    fontWeight: "800",
  },
  compareRail: {
    gap: 12,
  },
  empty: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
});
