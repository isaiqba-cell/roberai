import {
  Link,
  useRouter,
  type Href,
} from "expo-router";
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
import { formatCurrency } from "@rober/api-client";
import {
  closetInspiredProducts,
  demoBrands,
  demoCatalog,
  demoFavoriteJeans,
  featuredProducts,
  jeansProducts,
  newArrivalProducts,
  toProductCard,
} from "../../lib/catalog";
import { summarizeProductFit } from "../../lib/fitEngine";
import {
  computeGarmentMatches,
  GarmentCardCategory,
  pickGarmentCardCategories,
} from "../../lib/garmentCompare";
import { rankHomeFeed } from "../../lib/recommendations";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function HomeScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomClearance = 112;
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
  const anchorSpec = favorite?.canonicalSpec;
  const garmentMatches = anchorSpec ? computeGarmentMatches(anchorSpec, demoCatalog) : [];
  const passportCategories = anchorSpec
    ? pickGarmentCardCategories(anchorSpec, garmentMatches)
    : [];
  const matchConfidenceByProduct = new Map(
    garmentMatches.map((match) => [match.product.id, match.result.confidence]),
  );
  const anchorConfidence = passportCategories[0]?.entry.result.confidence;
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
        {
          paddingTop: insets.top + 28,
          paddingBottom: insets.bottom + bottomClearance + 28,
        },
      ]}
    >
      <View style={styles.topbar}>
        <View>
          <Text style={[styles.logo, { color: theme.text }]}>Rober</Text>
        </View>
        <View style={styles.topActions}>
          <Link href="/discover" asChild>
            <IconButton accessibilityLabel="Search">
              <Search size={22} color={theme.text} />
            </IconButton>
          </Link>
          <IconButton
            accessibilityLabel="Notifications and order updates"
            onPress={() => router.push("/orders")}
          >
            <Bell size={21} color={theme.text} />
          </IconButton>
        </View>
      </View>

      <View
        style={[
          styles.passport,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.passportKicker, { color: theme.accent }]}>
          YOUR FIT, TRANSLATED
        </Text>
        <Text style={[styles.passportTitle, { color: theme.text }]}>
          {favorite
            ? `${favorite.brand} ${favorite.itemName} · ${favorite.sizeLabel}`
            : "Add a reference pair to unlock matches"}
        </Text>
        {anchorSpec ? (
          <View style={styles.dimensionChips}>
            {[
              ["Waist", anchorSpec.waistCm],
              ["Thigh", anchorSpec.thighCm],
              ["Rise", anchorSpec.riseCm],
              ["Inseam", anchorSpec.inseamCm],
            ]
              .filter((pair): pair is [string, number] => pair[1] !== undefined)
              .map(([label, value]) => (
                <View
                  key={label}
                  style={[
                    styles.dimensionChip,
                    {
                      backgroundColor: theme.surfaceWarm,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.dimensionChipLabel, { color: theme.textMuted }]}
                  >
                    {label}
                  </Text>
                  <Text style={[styles.dimensionChipValue, { color: theme.text }]}>
                    {value}cm
                  </Text>
                </View>
              ))}
          </View>
        ) : null}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.passportCardRail}
        >
          {passportCategories.map((row) => (
            <PassportMatchCard
              key={row.entry.product.id}
              label={row.label}
              entry={row.entry}
            />
          ))}
        </ScrollView>
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
              {favorite
                ? `Calibrated from your ${favorite.brand} ${favorite.sizeLabel} baseline.`
                : "Add a reference pair to calibrate your matches."}
            </Text>
          </View>
          <Link href="/discover" asChild>
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
        <InlineHeader
          title="Indexed Jeans Brands"
          action="See All"
          href="/discover"
          testID="indexed-brands-see-all"
        />
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
              onPress={() =>
                router.push({
                  pathname: "/discover",
                  params: { brand: brand.slug },
                })
              }
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.productSection}>
        <InlineHeader
          title="Best Jeans Matches"
          action="See All"
          testID="best-matches-see-all"
          href={{
            pathname: "/discover",
            params: { query: "jeans" },
          }}
        />
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
        <FitConfidenceRing confidence={anchorConfidence ?? 88} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            {favorite
              ? `${favorite.brand} ${favorite.sizeLabel} anchor is active`
              : "Add a reference pair to activate matching"}
          </Text>
          <Text style={[styles.summaryCopy, { color: theme.textMuted }]}>
            {anchorSpec
              ? `Waist ${anchorSpec.waistCm}cm, thigh ${anchorSpec.thighCm}cm, inseam ${anchorSpec.inseamCm}cm from official chart data. Ring shows your best available match.`
              : `Waist ${demoFavoriteJeans.waistCm}cm, hip ${demoFavoriteJeans.hipCm}cm, inseam ${demoFavoriteJeans.inseamCm}cm from official chart data.`}
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
          .map((product) =>
            toProductCard(product, matchConfidenceByProduct.get(product.id)),
          )}
      />
      <View style={{ height: 12 }} />
    </ScrollView>
  );
}

function InlineHeader({
  title,
  action,
  href,
  testID,
}: {
  title: string;
  action: string;
  href?: Href;
  testID?: string;
}) {
  const theme = useThemeTokens();
  const actionText = (
    <Text style={[styles.inlineAction, { color: theme.textMuted }]}>
      {action}
    </Text>
  );

  return (
    <View style={styles.inlineHeader}>
      <Text style={[styles.inlineTitle, { color: theme.text }]}>{title}</Text>
      {href ? (
        <Link href={href} asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${action} ${title}`}
            hitSlop={8}
            testID={testID}
          >
            {actionText}
          </Pressable>
        </Link>
      ) : (
        actionText
      )}
    </View>
  );
}

function PassportMatchCard({
  label,
  entry,
}: {
  label: string;
  entry: GarmentCardCategory["entry"];
}) {
  const theme = useThemeTokens();
  return (
    <Link href={`/product/${entry.product.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${entry.card.brand} ${entry.product.title}, ${entry.result.confidence} percent fit`}
        style={({ pressed }) => [
          styles.passportCard,
          {
            backgroundColor: theme.surfaceRaised,
            borderColor: theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={styles.passportCardImageWrap}>
          <Image
            source={{ uri: entry.card.imageUrl }}
            style={styles.passportCardImage}
            contentFit="contain"
            transition={150}
          />
          <View style={[styles.passportCardFit, { backgroundColor: theme.accent }]}>
            <Text style={styles.passportCardFitText}>
              {entry.result.confidence}%
            </Text>
          </View>
        </View>
        <Text style={[styles.passportCardLabel, { color: theme.accent }]}>
          {label.toUpperCase()}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.passportCardTitle, { color: theme.text }]}
        >
          {entry.card.brand} {entry.product.title}
        </Text>
        <Text style={[styles.passportCardPrice, { color: theme.textMuted }]}>
          {formatCurrency(entry.product.priceCents)} · size {entry.sizeLabel}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 18,
    gap: 13,
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
  passport: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    shadowColor: "#6F3328",
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 3,
  },
  passportKicker: {
    fontFamily: "Courier",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  passportTitle: {
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 25,
  },
  dimensionChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dimensionChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    gap: 1,
  },
  dimensionChipLabel: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dimensionChipValue: {
    fontSize: 13,
    fontWeight: "900",
  },
  passportCardRail: {
    gap: 10,
    paddingTop: 4,
  },
  passportCard: {
    width: 152,
    borderWidth: 1,
    borderRadius: 18,
    padding: 10,
    gap: 4,
  },
  passportCardImageWrap: {
    height: 96,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    position: "relative",
  },
  passportCardImage: {
    width: "100%",
    height: "100%",
  },
  passportCardFit: {
    position: "absolute",
    top: 6,
    right: 6,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  passportCardFitText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  passportCardLabel: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  passportCardTitle: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    minHeight: 32,
  },
  passportCardPrice: {
    fontSize: 11,
    fontWeight: "800",
  },
  logo: {
    fontSize: 34,
    fontWeight: "900",
  },
  hero: {
    minHeight: 150,
    borderRadius: 26,
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
    left: 20,
    right: 82,
    bottom: 20,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 22,
    textTransform: "uppercase",
  },
  heroSubtitle: {
    color: "rgba(255, 255, 255, 0.86)",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 5,
    fontWeight: "700",
  },
  heroArrow: {
    position: "absolute",
    right: 20,
    bottom: 20,
    height: 50,
    width: 50,
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
  productSection: {
    marginTop: 6,
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
    alignItems: "center",
  },
});
