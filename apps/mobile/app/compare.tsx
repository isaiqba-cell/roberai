import { ReactElement, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, ArrowUpRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TryOnPhotoRecord, TryOnRenderRecord } from "@rober/api-client";
import { BodyProfile } from "@rober/fit-engine";
import { Chip, EmptyState, IconButton, Sheet } from "../components/primitives";
import {
  FitDimensionBreakdown,
  FitSpectrumSlider,
  RecommendedSizeCard,
} from "../components/fit";
import { BestFitCompareCard, CompareBrandCard } from "../components/product";
import { Reveal } from "../components/motion";
import { StylizedAvatar, TryOnSkeleton } from "../components/tryOn";
import { TryOnPhotoManager } from "../features/tryOn/TryOnPhotoManager";
import { compareProductsForQuery } from "../lib/fitEngine";
import {
  computeGarmentMatches,
  diversifyGarmentMatches,
  rerankBySilhouette,
  silhouetteCutFromSlider,
  sortByPrice,
} from "../lib/garmentCompare";
import { demoCatalog } from "../lib/catalog";
import { ensureTryOnRender } from "../lib/tryOn";
import { useDemoStore } from "../stores/useDemoStore";
import { useThemeTokens } from "../theme/useThemeTokens";

const PRICE_CAP_CENTS = 10000;

// The consumer flow in one screen: your pair at the top, one slider for
// skinnier/baggier, price chips, then the pair to buy — with a reason.
export default function CompareScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [spectrum, setSpectrum] = useState(56);
  const [priceSortActive, setPriceSortActive] = useState(false);
  const [priceCapActive, setPriceCapActive] = useState(false);
  const [tryOnEnabled, setTryOnEnabled] = useState(false);
  const [tryOnPromptVisible, setTryOnPromptVisible] = useState(false);
  const bodyProfile = useDemoStore((state) => state.bodyProfile);
  const favorite = useDemoStore((state) => state.knownGoodItems[0]);
  const activeTryOnPhoto = useDemoStore((state) =>
    state.tryOnPhotos.find((photo) => photo.status === "active"),
  );
  const tryOnRenders = useDemoStore((state) => state.tryOnRenders);
  const anchorSpec = favorite?.canonicalSpec;
  const garmentToGarment = Boolean(anchorSpec);

  const garmentSummaries = useMemo(() => {
    if (!anchorSpec) {
      return [];
    }
    const catalog = demoCatalog.filter(
      (product) =>
        product.subcategory === "jeans" &&
        (!favorite?.gender || product.gender === favorite.gender),
    );
    return computeGarmentMatches(anchorSpec, catalog).filter(
      (summary) =>
        !favorite ||
        !(
          summary.product.brand.name === favorite.brand ||
          normalizeProductName(summary.product.title).includes(
            normalizeProductName(favorite.itemName),
          )
        ),
    );
  }, [anchorSpec, favorite]);

  const targetCut = silhouetteCutFromSlider(spectrum);
  const orderedSummaries = useMemo(() => {
    const priced = priceCapActive
      ? garmentSummaries.filter(
          (summary) => summary.product.priceCents <= PRICE_CAP_CENTS,
        )
      : garmentSummaries;
    const bySilhouette = rerankBySilhouette(priced, targetCut);
    const sorted = priceSortActive ? sortByPrice(bySilhouette) : bySilhouette;
    return diversifyGarmentMatches(sorted);
  }, [garmentSummaries, priceCapActive, priceSortActive, targetCut]);

  const fallbackResults = useMemo(
    () =>
      garmentToGarment
        ? []
        : compareProductsForQuery(
            "jeans",
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
    [bodyProfile, favorite, garmentToGarment, spectrum],
  );

  const results = garmentToGarment
    ? orderedSummaries.map((summary) => ({
        product: summary.product,
        card: summary.card,
        confidence: summary.result.confidence,
        recommendedSize: summary.sizeLabel,
        reason: summary.card.explanation,
        dimensionScores: summary.result.dimensionScores,
        variantId: summary.variantId as string | undefined,
      }))
    : fallbackResults.map((summary) => ({
        product: summary.product,
        card: summary.card,
        confidence: summary.confidence,
        recommendedSize: summary.recommendedSize,
        reason: summary.explanation[0],
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
          <Text style={[styles.logo, { color: theme.text }]}>Your matches</Text>
          <View style={styles.topbarSpacer} />
        </View>
      </Reveal>

      <Reveal delay={50}>
        <View style={[styles.anchorRow, { borderColor: theme.border }]}>
          <Text numberOfLines={1} style={[styles.anchorText, { color: theme.textMuted }]}>
            {favorite
              ? `Matched to your ${favorite.brand} ${favorite.itemName} · ${favorite.sizeLabel}`
              : "Add a favorite pair to unlock matching"}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit reference pair"
            onPress={() => router.push(favorite ? "/profile" : "/(onboarding)/garment-reference")}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={[styles.anchorEdit, { color: theme.accent }]}>
              {favorite ? "Edit" : "Add"}
            </Text>
          </Pressable>
        </View>
      </Reveal>

      <Reveal delay={100}>
        <View style={styles.controlSection}>
          <View style={styles.controlHeader}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>FIT</Text>
            <Text style={[styles.controlValue, { color: theme.text }]}>
              {formatWord(targetCut)}
            </Text>
          </View>
          <FitSpectrumSlider value={spectrum} onChange={setSpectrum} />
          <View style={styles.chips}>
            <Chip
              label="Best match"
              selected={!priceSortActive}
              onPress={() => setPriceSortActive(false)}
            />
            <Chip
              label="Lowest price"
              selected={priceSortActive}
              onPress={() => setPriceSortActive(true)}
            />
            <Chip
              label="Under $100"
              selected={priceCapActive}
              onPress={() => setPriceCapActive((current) => !current)}
            />
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
          <Reveal delay={150}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Buy this one
            </Text>
            <RecommendedSizeCard
              sizeLabel={best.recommendedSize}
              confidence={best.confidence}
            >
              <Text style={[styles.sizeContext, { color: theme.textMuted }]}>
                {best.product.brand.name} · {best.reason ?? "closest to your pair"}
              </Text>
            </RecommendedSizeCard>
          </Reveal>

          <Reveal delay={200}>
            <BestFitCompareCard product={best.card} {...tryOnDisplayFor(best.variantId)} />
            <FitDimensionBreakdown scores={best.dimensionScores} />
          </Reveal>
        </>
      ) : (
        <Reveal delay={150}>
          <EmptyState
            title="No matches at this price"
            body="Remove the price cap or slide the fit back toward your own silhouette."
          />
        </Reveal>
      )}

      {alternatives.length ? (
        <Reveal delay={250}>
          <View style={styles.railHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              More options
            </Text>
            <Text style={[styles.railCount, { color: theme.textMuted }]}>
              {alternatives.length} jeans
            </Text>
          </View>
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
        </Reveal>
      ) : null}

      {best ? (
        <Reveal delay={300}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open top match"
            onPress={() => router.push(`/product/${best.product.id}`)}
            style={({ pressed }) => [
              styles.productCta,
              { backgroundColor: theme.accent, opacity: pressed ? 0.78 : 1 },
            ]}
          >
            <Text style={styles.productCtaText}>
              Buy {best.product.brand.name} in {best.recommendedSize}
            </Text>
            <ArrowUpRight size={18} color="#FFFFFF" />
          </Pressable>
        </Reveal>
      ) : null}

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

function normalizeProductName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 18 },
  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topbarSpacer: { width: 46 },
  logo: { fontSize: 20, fontWeight: "900" },
  anchorRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  anchorText: { flex: 1, fontSize: 13, fontWeight: "700" },
  anchorEdit: { fontSize: 13, fontWeight: "900" },
  controlSection: { gap: 10 },
  controlHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  controlValue: { fontSize: 13, fontWeight: "900" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "900", marginBottom: 10 },
  sizeContext: { fontSize: 12, fontWeight: "800" },
  railHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  railCount: { fontSize: 11, fontWeight: "900" },
  compareRail: { gap: 12, paddingTop: 10, paddingRight: 18 },
  productCta: { minHeight: 54, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  productCtaText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
});
