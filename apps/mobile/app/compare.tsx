import { ReactElement, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowLeft, ArrowUpRight, SlidersHorizontal } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatCurrency, TryOnPhotoRecord, TryOnRenderRecord } from "@rober/api-client";
import { BodyProfile, parseNaturalLanguageSearch } from "@rober/fit-engine";
import { Chip, EmptyState, IconButton, Sheet } from "../components/primitives";
import { FitDimensionBreakdown, FitSpectrumSlider, RecommendedSizeCard } from "../components/fit";
import { BestFitCompareCard, CompareBrandCard } from "../components/product";
import { Reveal } from "../components/motion";
import { StylizedAvatar, TryOnSkeleton } from "../components/tryOn";
import { TryOnPhotoManager } from "../features/tryOn/TryOnPhotoManager";
import { compareProductsForQuery, parsedToProductFilters } from "../lib/fitEngine";
import {
  computeGarmentMatches,
  diversifyGarmentMatches,
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
  const [spectrum, setSpectrum] = useState(56);
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
  const filters = useMemo(
    () => parsedToProductFilters(query, parsed),
    [query, parsed],
  );
  const anchorSpec = favorite?.canonicalSpec;
  const garmentToGarment = Boolean(anchorSpec);

  const garmentSummaries = useMemo(() => {
    if (!anchorSpec) {
      return [];
    }
    return computeGarmentMatches(
      anchorSpec,
      searchCatalog(filters).filter(
        (product) => !favorite?.gender || product.gender === favorite.gender,
      ),
    ).filter(
      (summary) =>
        !favorite ||
        !(
          summary.product.brand.name === favorite.brand ||
          normalizeProductName(summary.product.title).includes(
            normalizeProductName(favorite.itemName),
          )
        ),
    );
  }, [anchorSpec, favorite, filters]);

  const targetCut = silhouetteCutFromSlider(spectrum);
  const orderedSummaries = useMemo(() => {
    const bySilhouette = rerankBySilhouette(garmentSummaries, targetCut);
    const sorted = priceSortActive ? sortByPrice(bySilhouette) : bySilhouette;
    return diversifyGarmentMatches(sorted);
  }, [garmentSummaries, priceSortActive, targetCut]);

  const fitAngles = useMemo(
    () =>
      anchorSpec
        ? pickGarmentCardCategories(
            anchorSpec,
            diversifyGarmentMatches(garmentSummaries),
          )
        : [],
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
    [bodyProfile, favorite, garmentToGarment, query, spectrum],
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
  const visibleForTryOn = [best, ...alternatives.slice(0, 7)].filter(
    (entry): entry is (typeof results)[number] => Boolean(entry),
  );

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
        garmentDescription: `${entry.product.brand.name} ${entry.product.title}`,
      });
    });
  // The list is keyed by variant so cached generation only runs on real changes.
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
        { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 48 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Reveal>
        <View style={styles.topbar}>
          <IconButton
            accessibilityLabel="Back to home"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/(tabs)/home")
            }
          >
            <ArrowLeft size={20} color={theme.text} />
          </IconButton>
          <Text style={[styles.logo, { color: theme.text }]}>Fit translation</Text>
          <View style={styles.topbarSpacer} />
        </View>
      </Reveal>

      <Reveal delay={60}>
        <View
          style={[
            styles.reference,
            { backgroundColor: theme.surfaceWarm, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.kicker, { color: theme.accent }]}>YOUR REFERENCE PAIR</Text>
          <Text style={[styles.referenceTitle, { color: theme.text }]}>
            {favorite
              ? `${favorite.brand} ${favorite.itemName} · ${favorite.sizeLabel}`
              : "Add a favorite pair to unlock translation"}
          </Text>
          {anchorSpec ? (
            <View style={styles.referenceMetrics}>
              <ReferenceMetric label="Waist" value={formatCm(anchorSpec.waistCm)} />
              <ReferenceMetric label="Thigh" value={formatCm(anchorSpec.thighCm)} />
              <ReferenceMetric label="Rise" value={formatCm(anchorSpec.riseCm)} />
              <ReferenceMetric label="Inseam" value={formatCm(anchorSpec.inseamCm)} />
            </View>
          ) : null}
        </View>
      </Reveal>

      <Reveal delay={110}>
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
        <View style={styles.appliedFilters}>
          {parsed.priceMax ? <AppliedFilter label={`Under $${parsed.priceMax}`} /> : null}
          {parsed.fitIntent ? <AppliedFilter label={formatWord(parsed.fitIntent)} /> : null}
          {parsed.materials.slice(0, 2).map((material) => <AppliedFilter key={material} label={formatWord(material)} />)}
        </View>
      </Reveal>

      <Reveal delay={160}>
        <View style={styles.controlSection}>
          <View style={styles.controlHeader}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>SILHOUETTE</Text>
            <Text style={[styles.controlValue, { color: theme.text }]}>{formatWord(targetCut)}</Text>
          </View>
          <FitSpectrumSlider value={spectrum} onChange={setSpectrum} />
          <View style={styles.chips}>
            <Chip label="Best fit" selected={!priceSortActive} onPress={() => setPriceSortActive(false)} />
            <Chip label="Lowest price" selected={priceSortActive} onPress={() => setPriceSortActive(true)} />
            {garmentToGarment ? (
              <Chip
                label={tryOnEnabled ? "Try on: on" : "Try on"}
                selected={tryOnEnabled}
                accessibilityLabel="Toggle try it on with your photo"
                onPress={handleToggleTryOn}
              />
            ) : null}
          </View>
        </View>
      </Reveal>

      {best ? (
        <>
          <Reveal delay={210}>
            <View style={styles.bestHeading}>
              <View>
                <Text style={[styles.kicker, { color: theme.accent }]}>BEST NEXT PAIR</Text>
                <Text style={[styles.bestTitle, { color: theme.text }]}>Your most reliable match</Text>
              </View>
              <View style={[styles.confidenceBadge, { backgroundColor: theme.ink }]}>
                <Text style={styles.confidenceBadgeText}>{best.confidence}% fit</Text>
              </View>
            </View>
            <RecommendedSizeCard sizeLabel={best.recommendedSize} confidence={best.confidence}>
              <Text style={[styles.sizeContext, { color: theme.textMuted }]}>Buy {best.product.brand.name} in {best.recommendedSize}</Text>
            </RecommendedSizeCard>
          </Reveal>

          <Reveal delay={260}>
            <BestFitCompareCard product={best.card} {...tryOnDisplayFor(best.variantId)} />
            <View
              style={[
                styles.whyCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.whyLabel, { color: theme.textMuted }]}>WHY THIS WORKS</Text>
              <Text style={[styles.whyCopy, { color: theme.text }]}>
                {best.explanation[0] ?? "This construction is the closest match to your reference pair."}
              </Text>
            </View>
            <FitDimensionBreakdown scores={best.dimensionScores} />
          </Reveal>
        </>
      ) : (
        <Reveal delay={210}>
          <EmptyState
            title="No fit-ready matches"
            body="Try straight jeans, relaxed denim, curvy jeans, or remove the price constraint."
          />
        </Reveal>
      )}

      {fitAngles.length ? (
        <Reveal delay={310}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Other ways to shop your fit</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.angleRail}>
            {fitAngles.slice(1).map((row) => <FitAngleCard key={row.label} row={row} />)}
          </ScrollView>
        </Reveal>
      ) : null}

      <Reveal delay={360}>
        <View style={styles.railHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Compare across brands</Text>
          <Text style={[styles.railCount, { color: theme.textMuted }]}>{alternatives.length} options</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compareRail}>
          {alternatives.slice(0, 8).map((entry) => (
            <CompareBrandCard
              key={entry.product.id}
              product={entry.card}
              {...tryOnDisplayFor(entry.variantId)}
            />
          ))}
        </ScrollView>
      </Reveal>

      <Reveal delay={410}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={best ? "Open top product" : "Browse catalog"}
          onPress={() => router.push(best ? `/product/${best.product.id}` : "/discover")}
          style={({ pressed }) => [
            styles.productCta,
            { backgroundColor: theme.accent, opacity: pressed ? 0.78 : 1 },
          ]}
        >
          <Text style={styles.productCtaText}>{best ? "Open top match" : "Browse fit index"}</Text>
          <ArrowUpRight size={18} color="#FFFFFF" />
        </Pressable>
      </Reveal>

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

function ReferenceMetric({ label, value }: { label: string; value: string }) {
  const theme = useThemeTokens();
  return (
    <View style={[styles.referenceMetric, { backgroundColor: theme.surface }]}>
      <Text style={[styles.referenceMetricLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.referenceMetricValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function AppliedFilter({ label }: { label: string }) {
  const theme = useThemeTokens();
  return (
    <View style={[styles.appliedFilter, { backgroundColor: theme.surfaceWarm }]}>
      <Text style={[styles.appliedFilterText, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

function FitAngleCard({ row }: { row: GarmentCardCategory }) {
  const theme = useThemeTokens();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${row.label}: ${row.entry.product.brand.name} ${row.entry.product.title}`}
      onPress={() => router.push(`/product/${row.entry.product.id}`)}
      style={({ pressed }) => [
        styles.angleCard,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <Text style={[styles.angleLabel, { color: theme.accent }]}>{row.label.toUpperCase()}</Text>
      <Text numberOfLines={2} style={[styles.angleTitle, { color: theme.text }]}>
        {row.entry.product.brand.name} {row.entry.product.title}
      </Text>
      <View style={styles.angleMeta}>
        <Text style={[styles.angleMetric, { color: theme.textMuted }]}>{formatCurrency(row.entry.product.priceCents)}</Text>
        <Text style={[styles.angleMetric, { color: theme.textMuted }]}>{row.entry.result.confidence}% fit</Text>
      </View>
    </Pressable>
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

function formatWord(value?: string) {
  if (!value) {
    return "";
  }
  return value
    .split(/[-\s]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCm(value?: number) {
  return value ? `${Math.round(value)} cm` : "Synced";
}

function normalizeProductName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 18 },
  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topbarSpacer: { width: 46 },
  logo: { fontSize: 20, fontWeight: "900" },
  reference: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 12 },
  kicker: { fontFamily: "Courier", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  referenceTitle: { fontSize: 20, fontWeight: "900", lineHeight: 25 },
  referenceMetrics: { flexDirection: "row", gap: 7 },
  referenceMetric: { flex: 1, minWidth: 0, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 8, gap: 3 },
  referenceMetricLabel: { fontSize: 8, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.4 },
  referenceMetricValue: { fontSize: 11, fontWeight: "900" },
  searchBox: { minHeight: 54, borderWidth: 1, borderRadius: 18, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 9 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "800" },
  appliedFilters: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: -9 },
  appliedFilter: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  appliedFilterText: { fontSize: 10, fontWeight: "900" },
  controlSection: { gap: 10 },
  controlHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  controlValue: { fontSize: 13, fontWeight: "900" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bestHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
  bestTitle: { marginTop: 3, fontSize: 22, fontWeight: "900" },
  confidenceBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  confidenceBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  sizeContext: { fontSize: 12, fontWeight: "800" },
  whyCard: { marginTop: 12, borderWidth: 1, borderRadius: 16, padding: 14, gap: 5 },
  whyLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  whyCopy: { fontSize: 13, fontWeight: "800", lineHeight: 19 },
  sectionTitle: { fontSize: 19, fontWeight: "900" },
  angleRail: { gap: 10, paddingTop: 10, paddingRight: 18 },
  angleCard: { width: 188, minHeight: 132, borderWidth: 1, borderRadius: 16, padding: 13, justifyContent: "space-between", gap: 7 },
  angleLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
  angleTitle: { fontSize: 14, fontWeight: "900", lineHeight: 18 },
  angleMeta: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  angleMetric: { fontSize: 10, fontWeight: "900" },
  railHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  railCount: { fontSize: 11, fontWeight: "900" },
  compareRail: { gap: 12, paddingTop: 10, paddingRight: 18 },
  productCta: { minHeight: 54, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  productCtaText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
});
