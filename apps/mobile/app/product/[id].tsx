import { useEffect, useMemo, useState } from "react";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { ArrowLeft, Heart, Share2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatCurrency } from "@rober/api-client";
import { computeFitScore } from "@rober/fit-engine";
import {
  AppButton,
  IconButton,
  Price,
  RatingBadge,
  SectionHeader,
  StickyCTA,
} from "../../components/primitives";
import {
  FabricStretchNote,
  FitDimensionBreakdown,
  FitExplanationCard,
  RecommendedSizeCard,
  SilhouetteNote,
  SizeChipWithFitScore,
} from "../../components/fit";
import { ProductRail } from "../../components/product";
import {
  closetInspiredProducts,
  getCatalogProduct,
  toProductCard,
} from "../../lib/catalog";
import { summarizeProductFit } from "../../lib/fitEngine";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function ProductDetailScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = getCatalogProduct(id);
  const bodyProfile = useDemoStore((state) => state.bodyProfile);
  const favorite = useDemoStore((state) => state.knownGoodItems[0]);
  const addToCart = useDemoStore((state) => state.addToCart);
  const toggleSavedProduct = useDemoStore((state) => state.toggleSavedProduct);
  const savedProductIds = useDemoStore((state) => state.savedProductIds);
  const favoriteReferenceItem = useMemo(
    () =>
      favorite
        ? {
            itemName: favorite.itemName,
            category: favorite.category,
            sizeLabel: favorite.sizeLabel,
            fitNotes: favorite.fitNotes,
            measurements: favorite.measurements,
          }
        : undefined,
    [favorite],
  );
  const fit = useMemo(
    () =>
      product
        ? summarizeProductFit(product, bodyProfile, favoriteReferenceItem)
        : undefined,
    [bodyProfile, favoriteReferenceItem, product],
  );
  const recommendedVariantId =
    fit?.product.variants.find(
      (variant) => variant.sizeLabel === fit.recommendedSize,
    )?.id;
  const [selectedVariantId, setSelectedVariantId] = useState(
    recommendedVariantId,
  );
  useEffect(() => {
    if (recommendedVariantId && !selectedVariantId) {
      setSelectedVariantId(recommendedVariantId);
    }
  }, [recommendedVariantId, selectedVariantId]);
  const selectedVariant =
    product?.variants.find((variant) => variant.id === selectedVariantId) ??
    product?.variants[0];

  if (!product || !fit) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bgCanvas }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          Product not found
        </Text>
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
        ...(favoriteReferenceItem ? { favoriteReferenceItem } : {}),
      })
    : undefined;
  const variantScores = product.variants.map((variant, index) => ({
    variant,
    index,
    score: computeFitScore(bodyProfile, variant.spec, {
      category: product.category,
      sizeLabel: variant.sizeLabel,
      ...(favoriteReferenceItem ? { favoriteReferenceItem } : {}),
    }),
  }));
  const orderedVariantScores = variantScores.slice().sort((a, b) => {
    if (a.variant.id === recommendedVariantId) {
      return -1;
    }
    if (b.variant.id === recommendedVariantId) {
      return 1;
    }
    return b.score.confidence - a.score.confidence || a.index - b.index;
  });
  const galleryImages = product.galleryImageUrls?.length
    ? product.galleryImageUrls
    : [product.heroImageUrl];

  return (
    <View style={[styles.screen, { backgroundColor: theme.bgCanvas }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 142 },
        ]}
      >
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: galleryImages[0] ?? product.heroImageUrl }}
            style={styles.heroImage}
            contentFit="contain"
            transition={180}
          />
          <View style={[styles.overlayTop, { top: insets.top + 18 }]}>
            <IconButton accessibilityLabel="Back" onPress={() => router.back()}>
              <ArrowLeft size={20} color={theme.text} />
            </IconButton>
            <View style={styles.overlayActions}>
              <IconButton accessibilityLabel="Share product">
                <Share2 size={18} color={theme.text} />
              </IconButton>
              <IconButton
                accessibilityLabel="Save product"
                onPress={() => toggleSavedProduct(product.id)}
              >
                <Heart
                  size={18}
                  color={
                    savedProductIds.includes(product.id)
                      ? theme.accent
                      : theme.text
                  }
                />
              </IconButton>
            </View>
          </View>
          <View
            style={[styles.thumbnailStrip, { backgroundColor: theme.surface }]}
          >
            {galleryImages.slice(0, 3).map((thumbnailUrl, index) => (
              <View
                key={`${thumbnailUrl}-${index}`}
                style={[
                  styles.thumbnailFrame,
                  { borderColor: index === 0 ? theme.accent : theme.border },
                ]}
              >
                <Image
                  source={{ uri: thumbnailUrl }}
                  style={styles.thumbnailImage}
                  contentFit="contain"
                />
              </View>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.details,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.titleBlock}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>
                {product.title}
              </Text>
              <Text style={[styles.brand, { color: theme.textMuted }]}>
                By {product.brand.name}
              </Text>
            </View>
            <RatingBadge rating={product.rating} count={product.reviewCount} />
          </View>
          <View style={styles.priceRow}>
            <Price
              cents={product.priceCents}
              {...(product.compareAtPriceCents
                ? { compareAtCents: product.compareAtPriceCents }
                : {})}
            />
            <Text style={[styles.fitText, { color: theme.accent }]}>
              {fit.confidence}% fit in {fit.recommendedSize}
            </Text>
          </View>

          <View style={styles.sizeHeader}>
            <Text style={[styles.sizeTitle, { color: theme.text }]}>Size</Text>
            <Text style={[styles.sizeGuide, { color: theme.textMuted }]}>
              Size Guide
            </Text>
          </View>
          <View style={styles.sizes}>
            {orderedVariantScores.map(({ variant, score }) => (
              <SizeChipWithFitScore
                key={variant.id}
                size={variant.sizeLabel}
                confidence={score.confidence}
                selected={selectedVariant?.id === variant.id}
                onPress={() => setSelectedVariantId(variant.id)}
              />
            ))}
          </View>

          <View
            style={[
              styles.tabs,
              { backgroundColor: theme.surfaceWarm, borderColor: theme.border },
            ]}
          >
            <View style={styles.tabRow}>
              <Text
                style={[
                  styles.tabTitle,
                  { color: theme.text, borderBottomColor: theme.text },
                ]}
              >
                About
              </Text>
              <Text style={[styles.tabLabel, { color: theme.textMuted }]}>
                Reviews
              </Text>
              <Text style={[styles.tabLabel, { color: theme.textMuted }]}>
                Material
              </Text>
              <Text style={[styles.tabLabel, { color: theme.textMuted }]}>
                Brand
              </Text>
            </View>
            <Text style={[styles.copy, { color: theme.textMuted }]}>
              {product.description}
            </Text>
            <FabricStretchNote
              stretchPct={selectedVariant?.spec.stretchPct ?? 0}
            />
            <SilhouetteNote
              cut={selectedVariant?.spec.cut ?? product.fitTags[0] ?? "regular"}
            />
          </View>

          <RecommendedSizeCard
            sizeLabel={fit.recommendedSize}
            confidence={fit.confidence}
          />
          <FitExplanationCard
            lines={selectedFit?.explanation ?? fit.explanation}
          />
          <FitDimensionBreakdown
            scores={selectedFit?.dimensionScores ?? fit.dimensionScores}
          />

          <SectionHeader kicker="Alternatives" title="Similar with fit data" />
          <ProductRail
            products={closetInspiredProducts
              .slice(0, 6)
              .map((item, index) => toProductCard(item, 88 - index * 2))}
          />
        </View>
      </ScrollView>
      <StickyCTA
        price={`Total ${formatCurrency(selectedVariant?.priceCents ?? product.priceCents)}`}
        label="Add to Bag"
        onPress={() => {
          Haptics.selectionAsync().catch(() => undefined);
          addToCart({
            productId: product.id,
            variantId:
              selectedVariant?.id ??
              product.variants[0]?.id ??
              `${product.id}-os`,
            sizeLabel: selectedVariant?.sizeLabel ?? fit.recommendedSize,
            color: selectedVariant?.color ?? product.colors[0] ?? "default",
            unitPriceCents: selectedVariant?.priceCents ?? product.priceCents,
            fitConfidenceWhenAdded: selectedFit?.confidence ?? fit.confidence,
          });
          router.push("/(tabs)/cart");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 142,
  },
  imageWrap: {
    height: 460,
    position: "relative",
    backgroundColor: "#F7FAFF",
  },
  heroImage: {
    height: "100%",
    width: "100%",
  },
  overlayTop: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overlayActions: {
    flexDirection: "row",
    gap: 8,
  },
  thumbnailStrip: {
    position: "absolute",
    left: 86,
    right: 86,
    bottom: 18,
    minHeight: 72,
    borderRadius: 18,
    padding: 7,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#6F3328",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  thumbnailFrame: {
    width: 58,
    borderRadius: 12,
    borderWidth: 2,
    overflow: "hidden",
  },
  thumbnailImage: {
    height: "100%",
    width: "100%",
  },
  details: {
    marginTop: -28,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    padding: 20,
    gap: 18,
  },
  titleBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  brand: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 6,
  },
  title: {
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 31,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  fitText: {
    fontSize: 13,
    fontWeight: "900",
  },
  sizeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sizeTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  sizeGuide: {
    fontSize: 13,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  sizes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tabs: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 10,
  },
  tabRow: {
    flexDirection: "row",
    gap: 22,
    alignItems: "center",
  },
  tabTitle: {
    fontSize: 15,
    fontWeight: "900",
    borderBottomWidth: 1,
    paddingBottom: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  copy: {
    fontSize: 14,
    lineHeight: 21,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
});
