import { ReactElement, useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowLeft, SlidersHorizontal } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatCurrency, TryOnPhotoRecord, TryOnRenderRecord } from "@rober/api-client";
import { BodyProfile, parseNaturalLanguageSearch } from "@rober/fit-engine";
import {
  AppButton,
  Chip,
  IconButton,
  SectionHeader,
  Sheet,
} from "../components/primitives";
import {
  FitDimensionBreakdown,
  FitExplanationCard,
  FitSpectrumSlider,
  RecommendedSizeCard,
} from "../components/fit";
import { BestFitCompareCard, CompareBrandCard } from "../components/product";
import { StylizedAvatar, TryOnSkeleton } from "../components/tryOn";
import { TryOnPhotoManager } from "../features/tryOn/TryOnPhotoManager";
import { compareProductsForQuery, parsedToProductFilters } from "../lib/fitEngine";
import {
  computeGarmentMatches,
  GarmentCardCategory,
  pickGarmentCardCategories,
  rerankBySilhouette,
  silhouetteCutFromSlider,
  sortByPrice,
} from "../lib/garmentCompare";
import { searchCatalog } from "../lib/catalog";
import { ensureTryOnRender } from "../lib/tryOn";
import { useDemoStore } from "../stores/useDemoStore";
import { useThemeTokens } from "../theme/useThemeTokens";

const defaultQuery = "straight denim jeans under $150";

export default function CompareScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [spectrum, setSpectrum] = useState(62);
  const [priceSortActive, setPriceSortActive] = useState(false);
  const [tryOnEnabled, setTryOnEnabled] = useState(false);
  const [tryOnPromptVisible, setTryOnPromptVisible] = useState(false);
  const bodyProfile = useDemoStore((state) => state.bodyProfile);
  const favorite = useDemoStore((state) => state.knownGoodItems[0]);
  const activeTryOnPhoto = useDemoStore((state) =>
    state.tryOnPhotos.find((photo) => photo.status === "active"),
  );
  const tryOnRenders = useDemoStore((state) => state.tryOnRenders);
  const parsed = useMemo(() => parseNaturalLanguageSearch(query), [query]);
  const filters = useMemo(() => parsedToProductFilters(query, parsed), [query, parsed]);

  const anchorSpec = favorite?.canonicalSpec;
  const garmentToGarment = Boolean(anchorSpec);

  const garmentSummaries = useMemo(() => {
    if (!anchorSpec) {
      return [];
    }
    return computeGarmentMatches(anchorSpec, searchCatalog(filters));
  }, [anchorSpec, filters]);

  const targetCut = silhouetteCutFromSlider(spectrum);
  const rerankedSummaries = useMemo(
    () => rerankBySilhouette(garmentSummaries, targetCut),
    [garmentSummaries, targetCut],
  );
  const orderedSummaries = priceSortActive
    ? sortByPrice(rerankedSummaries)
    : rerankedSummaries;

  const passportCategories: GarmentCardCategory[] = useMemo(
    () => (anchorSpec ? pickGarmentCardCategories(anchorSpec, garmentSummaries) : []),
    [anchorSpec, garmentSummaries],
  );

  const fallbackResults = useMemo(
    () =>
      garmentToGarment
        ? []
        : compareProductsForQuery(
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
    [garmentToGarment, query, bodyProfile, spectrum, favorite],
  );

  const results = garmentToGarment
    ? orderedSummaries.map((summary) => ({
        product: summary.product,
        card: summary.card,
        confidence: summary.result.confidence,
        recommendedSize: summary.sizeLabel,
        explanation: summary.result.explanation,
        dimensionScores: summary.result.dimensionScores,
        variantId: summary.variantId as string | undefined,
      }))
    : fallbackResults.map((summary) => ({
        product: summary.product,
        card: summary.card,
        confidence: summary.confidence,
        recommendedSize: summary.recommendedSize,
        explanation: summary.explanation,
        dimensionScores: summary.dimensionScores,
        variantId: undefined as string | undefined,
      }));
  const [best, ...alternatives] = results;
  const visibleForTryOn = [best, ...alternatives.slice(0, 8)].filter(
    (entry): entry is (typeof results)[number] => Boolean(entry),
  );

  // Kick off generation for whatever's currently visible. ensureTryOnRender
  // is cache-first (never regenerates an existing photo/variant pair), so
  // re-running this on every relevant change is cheap — repeat calls for an
  // already-requested pair just return the cached row.
  useEffect(() => {
    if (!tryOnEnabled || !activeTryOnPhoto) {
      return;
    }
    visibleForTryOn.forEach((entry) => {
      if (!entry.variantId) {
        return;
      }
      ensureTryOnRender({
        tryOnPhotoId: activeTryOnPhoto.id,
        variantId: entry.variantId,
        photoUri: activeTryOnPhoto.storagePath,
        garmentImageUrl: entry.product.heroImageUrl,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tryOnEnabled, activeTryOnPhoto, visibleForTryOn.map((entry) => entry.variantId).join(",")]);

  const handleToggleTryOn = () => {
    if (tryOnEnabled) {
      setTryOnEnabled(false);
      return;
    }
    if (!activeTryOnPhoto) {
      setTryOnPromptVisible(true);
      return;
    }
    setTryOnEnabled(true);
  };

  const tryOnDisplayFor = (variantId?: string) =>
    resolveTryOnDisplay({
      tryOnEnabled,
      ...(activeTryOnPhoto ? { activeTryOnPhoto } : {}),
      tryOnRenders,
      ...(variantId ? { variantId } : {}),
      bodyProfile,
    });

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bgCanvas }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 42 },
      ]}
    >
      <View style={styles.topbar}>
        <IconButton
          accessibilityLabel="Back to home"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/(tabs)/home")
          }
        >
          <ArrowLeft size={20} color={theme.text} />
        </IconButton>
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
          GARMENT-TO-GARMENT MATCHING
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>
          One favorite pair, every brand's construction compared.
        </Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          Rober matches your anchor garment's actual thigh, rise, inseam, and
          leg-opening measurements against every other brand's size chart, not
          your body.
        </Text>
      </View>

      {favorite ? (
        <>
          <SectionHeader
            kicker="Fit passport"
            title={`You wear ${favorite.brand} ${favorite.itemName}, ${favorite.sizeLabel}`}
          />
          <View
            style={[
              styles.translationTable,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {passportCategories.length ? (
              passportCategories.map((row) => (
                <GarmentCategoryRow key={row.label} row={row} />
              ))
            ) : (
              <View style={styles.emptyPassport}>
                <Text style={[styles.copy, { color: theme.textMuted }]}>
                  No garment-construction matches for this search yet.
                </Text>
              </View>
            )}
          </View>
        </>
      ) : null}

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
      </View>

      <FitSpectrumSlider value={spectrum} onChange={setSpectrum} />

      <View style={styles.sortRow}>
        <Text style={[styles.sortLabel, { color: theme.textMuted }]}>
          Sort by
        </Text>
        <View style={styles.chips}>
          <Chip
            label="Best match"
            selected={!priceSortActive}
            onPress={() => setPriceSortActive(false)}
          />
          <Chip
            label="Price: low to high"
            selected={priceSortActive}
            onPress={() => setPriceSortActive(true)}
          />
        </View>
      </View>

      {garmentToGarment ? (
        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, { color: theme.textMuted }]}>
            Try it on
          </Text>
          <View style={styles.chips}>
            <Chip
              label={tryOnEnabled ? "Try it on: on" : "Try it on: off"}
              selected={tryOnEnabled}
              accessibilityLabel="Toggle try it on with your photo"
              onPress={handleToggleTryOn}
            />
          </View>
        </View>
      ) : null}

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
          <BestFitCompareCard product={best.card} {...tryOnDisplayFor(best.variantId)} />
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
          <CompareBrandCard
            key={entry.product.id}
            product={entry.card}
            {...tryOnDisplayFor(entry.variantId)}
          />
        ))}
      </ScrollView>

      <Link
        href={best ? `/product/${best.product.id}` : "/discover"}
        asChild
      >
        <AppButton>{best ? "Open product detail" : "Browse catalog"}</AppButton>
      </Link>

      <Sheet
        title="Try it on with your photo"
        visible={tryOnPromptVisible}
        onClose={() => setTryOnPromptVisible(false)}
      >
        <TryOnPhotoManager
          onPhotoReady={() => {
            setTryOnPromptVisible(false);
            setTryOnEnabled(true);
          }}
        />
      </Sheet>
    </ScrollView>
  );
}

function resolveTryOnDisplay({
  tryOnEnabled,
  activeTryOnPhoto,
  tryOnRenders,
  variantId,
  bodyProfile,
}: {
  tryOnEnabled: boolean;
  activeTryOnPhoto?: TryOnPhotoRecord;
  tryOnRenders: TryOnRenderRecord[];
  variantId?: string;
  bodyProfile: BodyProfile;
}): { overrideImageUrl?: string; imageOverlay?: ReactElement } {
  if (!tryOnEnabled || !activeTryOnPhoto || !variantId) {
    return {};
  }
  const render = tryOnRenders.find(
    (item) => item.tryOnPhotoId === activeTryOnPhoto.id && item.variantId === variantId,
  );
  if (render?.status === "ready" && render.storagePath) {
    return { overrideImageUrl: render.storagePath };
  }
  if (render?.status === "failed") {
    return { imageOverlay: <StylizedAvatar bodyProfile={bodyProfile} /> };
  }
  return { imageOverlay: <TryOnSkeleton /> };
}

function formatChipLabel(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function GarmentCategoryRow({ row }: { row: GarmentCardCategory }) {
  const theme = useThemeTokens();
  const { label, entry } = row;
  return (
    <View style={[styles.translationRow, { borderColor: theme.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.translationBrand, { color: theme.textMuted }]}>
          {label}
        </Text>
        <Text style={[styles.translationTitle, { color: theme.text }]}>
          {entry.card.brand} {entry.product.title}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.translationWhy, { color: theme.textMuted }]}
        >
          {entry.result.explanation[0]}
        </Text>
      </View>
      <View style={styles.translationMetrics}>
        <Text style={[styles.translationScore, { color: theme.accent }]}>
          {entry.result.confidence}
        </Text>
        <Text style={[styles.translationMeta, { color: theme.textMuted }]}>
          {formatCurrency(entry.product.priceCents)}
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
  emptyPassport: {
    padding: 18,
  },
  translationRow: {
    minHeight: 100,
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
  sortRow: {
    gap: 8,
  },
  sortLabel: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
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
