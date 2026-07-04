import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  AddressCard,
  AppButton,
  BrandPill,
  CategoryTile,
  Chip,
  EmptyState,
  IconButton,
  OfflineState,
  PromoCodeRow,
  QuantityStepper,
  RatingBadge,
  SectionHeader,
  SkeletonLoader,
  ThemeToggle
} from "../components/primitives";
import {
  FabricStretchNote,
  FitConfidenceBadge,
  FitDimensionBreakdown,
  FitExplanationCard,
  FitScorePill,
  FitSpectrumSlider,
  LowConfidenceAlternativesPrompt,
  RecommendedSizeCard,
  SilhouetteNote,
  SimilarToFavoriteItemChip,
  SizeChipWithFitScore
} from "../components/fit";
import { ProductCard } from "../components/product";
import { useThemeTokens } from "../theme/useThemeTokens";
import { Heart } from "lucide-react-native";

const product = {
  id: "fieldstone-overshirt-clay",
  brand: "Fieldstone Supply Co.",
  title: "Washed Cotton Utility Overshirt",
  priceCents: 7800,
  compareAtCents: 9800,
  imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
  fitConfidence: 91,
  recommendedSize: "M",
  explanation: "Chest and shoulder range align with your known-good overshirt."
};

export default function ComponentsPlayground() {
  const theme = useThemeTokens();
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <SectionHeader kicker="System" title="Components" action={<ThemeToggle />} />
      <View style={styles.row}>
        <AppButton>Primary</AppButton>
        <AppButton variant="secondary">Secondary</AppButton>
        <IconButton accessibilityLabel="Save sample">
          <Heart size={18} color={theme.text} />
        </IconButton>
      </View>
      <View style={styles.row}>
        <Chip label="Slim" selected />
        <Chip label="Regular" />
        <BrandPill label="Fieldstone" selected />
      </View>
      <View style={styles.categoryRow}>
        <CategoryTile title="Men" subtitle="Outerwear" tone="men" />
        <CategoryTile title="Women" subtitle="Dresses" tone="women" />
      </View>
      <SectionHeader kicker="Commerce" title="Cards and controls" />
      <ProductCard product={product} elevated />
      <RatingBadge rating={4.8} count={214} />
      <QuantityStepper value={1} onIncrement={() => undefined} onDecrement={() => undefined} />
      <PromoCodeRow />
      <AddressCard />
      <SectionHeader kicker="Fit UI" title="Fit intelligence" />
      <RecommendedSizeCard sizeLabel="M" confidence={91} />
      <FitConfidenceBadge confidence={91} />
      <FitScorePill confidence={73} />
      <SizeChipWithFitScore size="M" confidence={91} selected />
      <FitExplanationCard
        lines={[
          "Recommended in M",
          "Chest range matches your profile",
          "Relaxed cut matches your preference",
          "Similar to your favorite overshirt"
        ]}
      />
      <FitDimensionBreakdown scores={{ chest: 94, shoulder: 88, waist: 80 }} />
      <SimilarToFavoriteItemChip label="favorite regular jeans" />
      <FabricStretchNote stretchPct={4} />
      <SilhouetteNote cut="relaxed" />
      <LowConfidenceAlternativesPrompt />
      <FitSpectrumSlider value={55} onChange={() => undefined} />
      <SectionHeader kicker="States" title="Loading, empty, offline" />
      <SkeletonLoader />
      <EmptyState title="Empty state" body="Designed empty states explain what Rober can do next." />
      <OfflineState />
      <Text style={[styles.footer, { color: theme.textMuted }]}>Playground includes the MVP component set used across demo screens.</Text>
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
    gap: 18
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center"
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  footer: {
    fontSize: 13,
    marginBottom: 40
  }
});
