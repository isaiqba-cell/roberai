import { ReactNode } from "react";
import { Link } from "expo-router";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Heart } from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";
import { Price, IconButton } from "./primitives";
import { FitConfidenceBadge, FitScorePill } from "./fit";
import { useThemeTokens } from "../theme/useThemeTokens";

export type ProductCardModel = {
  id: string;
  brand: string;
  title: string;
  priceCents: number;
  compareAtCents?: number;
  imageUrl: string;
  fitConfidence?: number;
  recommendedSize?: string;
  explanation?: string;
};

export function ProductCard({
  product,
  elevated,
  overrideImageUrl,
  imageOverlay,
}: {
  product: ProductCardModel;
  elevated?: boolean;
  // Additive "try it on" hooks — both optional so the default product-photo
  // rendering is unchanged when neither is passed.
  overrideImageUrl?: string;
  imageOverlay?: ReactNode;
}) {
  const theme = useThemeTokens();
  return (
    <Link href={`/product/${product.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${product.brand} ${product.title}, ${product.fitConfidence ?? "unknown"} percent fit`}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: elevated ? theme.accent : theme.surface,
            opacity: pressed ? 0.88 : 1,
            shadowOpacity: elevated ? 0.18 : 0.09,
          },
        ]}
      >
        <View style={styles.imageWrap}>
          {imageOverlay ?? (
            <Image
              source={{ uri: overrideImageUrl ?? product.imageUrl }}
              style={styles.image}
              contentFit="contain"
              transition={180}
              placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
              accessibilityLabel={`${product.title} product image`}
            />
          )}
          <View style={styles.heartWrap}>
            <IconButton
              accessibilityLabel={`Save ${product.title}`}
              style={styles.heartButton}
            >
              <Heart size={18} color={theme.text} />
            </IconButton>
          </View>
        </View>
        <View style={styles.body}>
          <Text
            numberOfLines={1}
            style={[styles.brand, { color: theme.textMuted }]}
          >
            {product.brand}
          </Text>
          <Text numberOfLines={2} style={[styles.title, { color: theme.text }]}>
            {product.title}
          </Text>
          <Price
            cents={product.priceCents}
            {...(product.compareAtCents
              ? { compareAtCents: product.compareAtCents }
              : {})}
          />
          {product.fitConfidence ? (
            <FitConfidenceBadge confidence={product.fitConfidence} />
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductCardModel[] }) {
  return (
    <FlashList
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ProductCard product={item} />}
      numColumns={2}
      contentContainerStyle={styles.gridContent}
    />
  );
}

export function ProductRail({ products }: { products: ProductCardModel[] }) {
  return (
    <FlashList
      data={products}
      horizontal
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <View
          style={{
            width: 186,
            marginRight: index === products.length - 1 ? 0 : 14,
          }}
        >
          <ProductCard product={item} elevated={index === 0} />
        </View>
      )}
      showsHorizontalScrollIndicator={false}
    />
  );
}

export function CompareBrandCard({
  product,
  best,
  overrideImageUrl,
  imageOverlay,
}: {
  product: ProductCardModel;
  best?: boolean;
  overrideImageUrl?: string;
  imageOverlay?: ReactNode;
}) {
  const theme = useThemeTokens();
  return (
    <View
      style={[
        styles.compareCard,
        {
          backgroundColor: theme.surface,
          borderColor: best ? theme.accent : theme.border,
        },
      ]}
    >
      {best ? (
        <Text style={[styles.bestKicker, { color: theme.accent }]}>
          Best Fit for You
        </Text>
      ) : null}
      <ProductCard
        product={product}
        {...(best ? { elevated: true } : {})}
        {...(overrideImageUrl ? { overrideImageUrl } : {})}
        {...(imageOverlay ? { imageOverlay } : {})}
      />
      <View style={styles.compareFooter}>
        {product.fitConfidence ? (
          <FitScorePill confidence={product.fitConfidence} />
        ) : null}
        {product.recommendedSize ? (
          <Text style={[styles.recommendedSize, { color: theme.text }]}>
            Recommended size {product.recommendedSize}
          </Text>
        ) : null}
        <Text
          style={[styles.compareExplanation, { color: theme.textMuted }]}
          numberOfLines={2}
        >
          {product.explanation ??
            "Normalized size chart is ready for comparison."}
        </Text>
      </View>
    </View>
  );
}

export function BestFitCompareCard({
  product,
  overrideImageUrl,
  imageOverlay,
}: {
  product: ProductCardModel;
  overrideImageUrl?: string;
  imageOverlay?: ReactNode;
}) {
  return (
    <CompareBrandCard
      product={product}
      best
      {...(overrideImageUrl ? { overrideImageUrl } : {})}
      {...(imageOverlay ? { imageOverlay } : {})}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#6F3328",
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  imageWrap: {
    aspectRatio: 1.3,
    position: "relative",
    backgroundColor: "#F8FAFC",
    margin: 8,
    borderRadius: 14,
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  heartWrap: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  heartButton: {
    minHeight: 36,
    minWidth: 36,
  },
  body: {
    paddingHorizontal: 12,
    paddingBottom: 13,
    gap: 5,
  },
  brand: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  title: {
    minHeight: 38,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
  gridContent: {
    paddingBottom: 120,
    gap: 14,
  },
  compareCard: {
    width: 244,
    borderRadius: 22,
    borderWidth: 1,
    padding: 10,
    gap: 10,
  },
  bestKicker: {
    fontFamily: "Courier",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  compareFooter: {
    gap: 8,
  },
  recommendedSize: {
    fontSize: 13,
    fontWeight: "900",
  },
  compareExplanation: {
    fontSize: 12,
    lineHeight: 17,
  },
});
