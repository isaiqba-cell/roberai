import { useMemo, useState } from "react";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, Heart, Share2 } from "lucide-react-native";
import { computeFitScore } from "@rober/fit-engine";
import { AppButton, IconButton, Price, RatingBadge, SectionHeader, StickyCTA } from "../../components/primitives";
import {
  FabricStretchNote,
  FitDimensionBreakdown,
  FitExplanationCard,
  RecommendedSizeCard,
  SilhouetteNote,
  SizeChipWithFitScore
} from "../../components/fit";
import { ProductRail } from "../../components/product";
import { closetInspiredProducts, getCatalogProduct, toProductCard } from "../../lib/catalog";
import { summarizeProductFit } from "../../lib/fitEngine";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function ProductDetailScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = getCatalogProduct(id);
  const bodyProfile = useDemoStore((state) => state.bodyProfile);
  const favorite = useDemoStore((state) => state.knownGoodItems[0]);
  const addToCart = useDemoStore((state) => state.addToCart);
  const toggleSavedProduct = useDemoStore((state) => state.toggleSavedProduct);
  const savedProductIds = useDemoStore((state) => state.savedProductIds);
  const fit = useMemo(() => (product ? summarizeProductFit(product, bodyProfile, favorite) : undefined), [bodyProfile, favorite, product]);
  const [selectedVariantId, setSelectedVariantId] = useState(fit?.product.variants.find((variant) => variant.sizeLabel === fit.recommendedSize)?.id);
  const selectedVariant = product?.variants.find((variant) => variant.id === selectedVariantId) ?? product?.variants[0];

  if (!product || !fit) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bgCanvas }]}>
        <Text style={[styles.title, { color: theme.text }]}>Product not found</Text>
        <Link href="/(tabs)/discover" asChild>
          <AppButton>Back to discover</AppButton>
        </Link>
      </View>
    );
  }

  const selectedFit = selectedVariant
    ? computeFitScore(bodyProfile, selectedVariant.spec, {
        category: product.category,
        sizeLabel: selectedVariant.sizeLabel,
        ...(favorite
          ? {
              favoriteReferenceItem: {
                itemName: favorite.itemName,
                category: favorite.category,
                sizeLabel: favorite.sizeLabel,
                fitNotes: favorite.fitNotes,
                measurements: favorite.measurements
              }
            }
          : {})
      })
    : undefined;

  return (
    <View style={[styles.screen, { backgroundColor: theme.bgCanvas }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: product.heroImageUrl }} style={styles.heroImage} contentFit="cover" transition={180} />
          <View style={styles.overlayTop}>
            <IconButton accessibilityLabel="Back" onPress={() => router.back()}>
              <ArrowLeft size={20} color={theme.text} />
            </IconButton>
            <View style={styles.overlayActions}>
              <IconButton accessibilityLabel="Share product">
                <Share2 size={18} color={theme.text} />
              </IconButton>
              <IconButton accessibilityLabel="Save product" onPress={() => toggleSavedProduct(product.id)}>
                <Heart size={18} color={savedProductIds.includes(product.id) ? theme.accent : theme.text} />
              </IconButton>
            </View>
          </View>
        </View>

        <View style={styles.details}>
          <Text style={[styles.brand, { color: theme.textMuted }]}>{product.brand.name}</Text>
          <Text style={[styles.title, { color: theme.text }]}>{product.title}</Text>
          <View style={styles.priceRow}>
            <Price cents={product.priceCents} {...(product.compareAtPriceCents ? { compareAtCents: product.compareAtPriceCents } : {})} />
            <RatingBadge rating={product.rating} count={product.reviewCount} />
          </View>

          <RecommendedSizeCard sizeLabel={fit.recommendedSize} confidence={fit.confidence} />
          <FitExplanationCard lines={selectedFit?.explanation ?? fit.explanation} />
          <FitDimensionBreakdown scores={selectedFit?.dimensionScores ?? fit.dimensionScores} />

          <SectionHeader kicker="Sizes" title="Choose size" />
          <View style={styles.sizes}>
            {product.variants.map((variant) => {
              const score = computeFitScore(bodyProfile, variant.spec, { category: product.category, sizeLabel: variant.sizeLabel });
              return (
                <SizeChipWithFitScore
                  key={variant.id}
                  size={variant.sizeLabel}
                  confidence={score.confidence}
                  selected={selectedVariant?.id === variant.id}
                  onPress={() => setSelectedVariantId(variant.id)}
                />
              );
            })}
          </View>

          <View style={[styles.tabs, { borderColor: theme.border }]}>
            <Text style={[styles.tabTitle, { color: theme.text }]}>About</Text>
            <Text style={[styles.copy, { color: theme.textMuted }]}>{product.description}</Text>
            <FabricStretchNote stretchPct={selectedVariant?.spec.stretchPct ?? 0} />
            <SilhouetteNote cut={selectedVariant?.spec.cut ?? product.fitTags[0] ?? "regular"} />
          </View>

          <SectionHeader kicker="Alternatives" title="Similar with fit data" />
          <ProductRail products={closetInspiredProducts.slice(0, 6).map((item, index) => toProductCard(item, 88 - index * 2))} />
        </View>
      </ScrollView>
      <StickyCTA
        price={`${fit.confidence}% fit in ${selectedVariant?.sizeLabel ?? fit.recommendedSize}`}
        label="Add to Bag"
        onPress={() => {
          addToCart({
            productId: product.id,
            variantId: selectedVariant?.id ?? product.variants[0]?.id ?? `${product.id}-os`,
            sizeLabel: selectedVariant?.sizeLabel ?? fit.recommendedSize,
            color: selectedVariant?.color ?? product.colors[0] ?? "default",
            unitPriceCents: selectedVariant?.priceCents ?? product.priceCents,
            fitConfidenceWhenAdded: selectedFit?.confidence ?? fit.confidence
          });
          router.push("/(tabs)/cart");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    paddingBottom: 132
  },
  imageWrap: {
    height: 520,
    position: "relative",
    backgroundColor: "#F4EEE9"
  },
  heroImage: {
    height: "100%",
    width: "100%"
  },
  overlayTop: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 58,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  overlayActions: {
    flexDirection: "row",
    gap: 8
  },
  details: {
    padding: 20,
    gap: 18
  },
  brand: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 38
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  sizes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  tabs: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 10
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: "900"
  },
  copy: {
    fontSize: 14,
    lineHeight: 21
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16
  }
});
