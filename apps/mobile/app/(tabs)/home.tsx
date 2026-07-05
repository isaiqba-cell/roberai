import { Link } from "expo-router";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowUpRight, Bell, Search, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AppButton,
  BrandPill,
  IconButton,
  SectionHeader,
} from "../../components/primitives";
import { FitConfidenceRing } from "../../components/fit";
import { ProductCard, ProductRail } from "../../components/product";
import {
  closetInspiredProducts,
  demoBrands,
  demoFavoriteJeans,
  featuredProducts,
  jeansProducts,
  newArrivalProducts,
  toProductCard,
} from "../../lib/catalog";
import { summarizeProductFit } from "../../lib/fitEngine";
import { rankHomeFeed } from "../../lib/recommendations";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function HomeScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const bodyProfile = useDemoStore((state) => state.bodyProfile);
  const styleProfile = useDemoStore((state) => state.styleProfile);
  const favorite = useDemoStore((state) => state.knownGoodItems[0]);
  const favoriteReferenceItem = favorite
    ? {
        itemName: favorite.itemName,
        category: favorite.category,
        sizeLabel: favorite.sizeLabel,
        fitNotes: favorite.fitNotes,
        measurements: favorite.measurements,
      }
    : undefined;
  const rankedFeed = rankHomeFeed(
    bodyProfile,
    styleProfile,
    favoriteReferenceItem,
  ).slice(
    0,
    8,
  );
  const heroProduct = jeansProducts[0] ?? featuredProducts[0];
  const arrivalCards = jeansProducts
    .slice(0, 4)
    .map((product) =>
      summarizeProductFit(product, bodyProfile, favoriteReferenceItem).card,
    );

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bgCanvas }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 118 },
      ]}
    >
      <View style={styles.topbar}>
        <View>
          <Text style={[styles.logo, { color: theme.text }]}>Rober</Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>
            Jeans that fit like your favorite pair
          </Text>
        </View>
        <View style={styles.topActions}>
          <Link href="/(tabs)/discover" asChild>
            <IconButton accessibilityLabel="Search">
              <Search size={22} color={theme.text} />
            </IconButton>
          </Link>
          <IconButton accessibilityLabel="Notifications">
            <Bell size={21} color={theme.text} />
          </IconButton>
        </View>
      </View>

      {heroProduct ? (
        <View
          style={[
            styles.hero,
            { backgroundColor: theme.surface, borderColor: theme.surface },
          ]}
        >
          <Image
            source={{ uri: heroProduct.heroImageUrl }}
            style={styles.heroImage}
            contentFit="contain"
            transition={180}
          />
          <View style={styles.heroScrim} />
          <View style={styles.heroCopyBlock}>
            <Text style={styles.heroTitle}>Find jeans that fit</Text>
            <Text style={styles.heroSubtitle}>
              Calibrated from your {demoFavoriteJeans.brandName}{" "}
              {demoFavoriteJeans.sizeLabel}x
              {Math.round(demoFavoriteJeans.inseamCm / 2.54)} baseline.
            </Text>
          </View>
          <Link href="/(tabs)/discover" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open collection"
              style={styles.heroArrow}
            >
              <ArrowUpRight size={24} color={theme.text} />
            </Pressable>
          </Link>
        </View>
      ) : null}

      <View style={styles.dots} accessibilityLabel="Carousel position 1 of 3">
        <View style={[styles.dotActive, { backgroundColor: theme.accent }]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <View>
        <InlineHeader title="Indexed Jeans Brands" action="See All" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
        >
          {demoBrands.slice(0, 5).map((brand, index) => (
            <BrandPill
              key={brand.slug}
              label={brand.name}
              selected={index === 0}
            />
          ))}
        </ScrollView>
      </View>

      <View>
        <InlineHeader title="Best Jeans Matches" action="See All" />
        <View style={styles.productGrid}>
          {arrivalCards.map((product) => (
            <View key={product.id} style={styles.gridCell}>
              <ProductCard product={product} />
            </View>
          ))}
        </View>
      </View>

      <View
        style={[
          styles.fitSummary,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <FitConfidenceRing confidence={88} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            Favorite jeans profile is active
          </Text>
          <Text style={[styles.summaryCopy, { color: theme.textMuted }]}>
            Waist {demoFavoriteJeans.waistCm}cm, hip {demoFavoriteJeans.hipCm}
            cm, inseam {demoFavoriteJeans.inseamCm}cm from official chart data.
          </Text>
        </View>
      </View>

      <View style={styles.fitActions}>
        <Link href="/compare" asChild>
          <AppButton icon={<Sparkles color="#FFFFFF" size={18} />}>
            Compare Jeans
          </AppButton>
        </Link>
        <Link href="/stylist" asChild>
          <AppButton variant="secondary">Ask Stylist</AppButton>
        </Link>
      </View>

      <SectionHeader kicker="For you" title="Jeans Across Price Points" />
      <ProductRail products={rankedFeed.map((entry) => entry.card)} />

      <SectionHeader
        kicker="Closet signal"
        title="Because your favorite jeans fit well"
      />
      <ProductRail
        products={closetInspiredProducts
          .slice(0, 8)
          .map((product, index) => toProductCard(product, 89 - index))}
      />
      <View style={{ height: 12 }} />
    </ScrollView>
  );
}

function InlineHeader({ title, action }: { title: string; action: string }) {
  const theme = useThemeTokens();
  return (
    <View style={styles.inlineHeader}>
      <Text style={[styles.inlineTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.inlineAction, { color: theme.textMuted }]}>
        {action}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 18,
    gap: 18,
  },
  topbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topActions: {
    flexDirection: "row",
    gap: 10,
  },
  logo: {
    fontSize: 29,
    fontWeight: "900",
  },
  tagline: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
  },
  hero: {
    minHeight: 230,
    borderRadius: 30,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#6F3328",
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  heroImage: {
    height: "100%",
    width: "100%",
    position: "absolute",
  },
  heroScrim: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    backgroundColor: "rgba(7, 18, 32, 0.28)",
  },
  heroCopyBlock: {
    position: "absolute",
    left: 22,
    right: 88,
    bottom: 22,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 30,
    textTransform: "uppercase",
  },
  heroSubtitle: {
    color: "rgba(255, 255, 255, 0.86)",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
    fontWeight: "700",
  },
  heroArrow: {
    position: "absolute",
    right: 22,
    bottom: 24,
    height: 58,
    width: 58,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: -5,
  },
  dotActive: {
    width: 34,
    height: 4,
    borderRadius: 999,
  },
  dot: {
    width: 34,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(89, 100, 116, 0.22)",
  },
  inlineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  inlineTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  inlineAction: {
    fontSize: 13,
    fontWeight: "800",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridCell: {
    width: "48%",
    flexGrow: 1,
  },
  fitSummary: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 5,
  },
  summaryCopy: {
    fontSize: 14,
    lineHeight: 20,
  },
  fitActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pills: {
    gap: 10,
  },
});
