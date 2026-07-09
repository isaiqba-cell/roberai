import { useMemo } from "react";
import { Link, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  ArrowUpRight,
  Bell,
  ChevronRight,
  Database,
  Search,
  Sparkles,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatCurrency, getJeansIndexStats } from "@rober/api-client";
import { BrandPill, IconButton } from "../../components/primitives";
import { ProductCard } from "../../components/product";
import { Reveal } from "../../components/motion";
import {
  demoBrands,
  demoCatalog,
  jeansProducts,
} from "../../lib/catalog";
import {
  computeGarmentMatches,
  diversifyGarmentMatches,
  pickGarmentCardCategories,
} from "../../lib/garmentCompare";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

const indexStats = getJeansIndexStats();

export default function HomeScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const favorite = useDemoStore((state) => state.knownGoodItems[0]);
  const anchorSpec = favorite?.canonicalSpec;
  const referenceCatalog = useMemo(
    () =>
      favorite?.gender
        ? demoCatalog.filter(
            (product) =>
              product.gender === favorite.gender && product.subcategory === "jeans",
          )
        : demoCatalog.filter((product) => product.subcategory === "jeans"),
    [favorite?.gender],
  );

  const rankedMatches = useMemo(() => {
    if (!anchorSpec) {
      return [];
    }
    return diversifyGarmentMatches(
      computeGarmentMatches(anchorSpec, referenceCatalog),
    ).filter((entry) => entry.product.brand.name !== favorite?.brand);
  }, [anchorSpec, favorite?.brand, referenceCatalog]);

  const fitAngles = useMemo(
    () =>
      anchorSpec
        ? pickGarmentCardCategories(anchorSpec, rankedMatches)
        : [],
    [anchorSpec, rankedMatches],
  );
  const featuredMatch = fitAngles[0]?.entry ?? rankedMatches[0];
  const featuredProduct = featuredMatch?.product ?? jeansProducts[0];
  const topMatchCards = rankedMatches.slice(0, 4).map((entry) => entry.card);

  const sourceStats = [
    { value: `${indexStats.chartSources}`, label: "chart sources" },
    { value: `${indexStats.productStyles}`, label: "jean styles" },
    { value: formatCompact(indexStats.fitReadyVariants), label: "size options" },
  ];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bgCanvas }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 18,
          paddingBottom: insets.bottom + 132,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topbar}>
        <Text style={[styles.logo, { color: theme.text }]}>Rober</Text>
        <View style={styles.topActions}>
          <Link href="/discover" asChild>
            <IconButton accessibilityLabel="Search the jeans index">
              <Search size={21} color={theme.text} />
            </IconButton>
          </Link>
          <IconButton
            accessibilityLabel="Notifications and order updates"
            onPress={() => router.push("/orders")}
          >
            <Bell size={20} color={theme.text} />
          </IconButton>
        </View>
      </View>

      <Reveal delay={65}>
        <View
          style={[
            styles.passport,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.passportHeader}>
            <View>
              <Text style={[styles.kicker, { color: theme.accent }]}>FIT PASSPORT</Text>
              <Text style={[styles.passportTitle, { color: theme.text }]}>
                {favorite
                  ? `${favorite.brand} ${favorite.itemName}`
                  : "Your reference pair"}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit reference jeans"
              onPress={() => router.push("/profile")}
              style={({ pressed }) => [
                styles.passportEdit,
                { borderColor: theme.border, opacity: pressed ? 0.66 : 1 },
              ]}
            >
              <Text style={[styles.passportEditText, { color: theme.text }]}>Edit</Text>
            </Pressable>
          </View>
          <View style={styles.measurements}>
            <PassportMetric
              label="Size"
              value={favorite?.sizeLabel ?? "Add pair"}
            />
            <PassportMetric
              label="Waist"
              value={formatCentimeters(anchorSpec?.waistCm)}
            />
            <PassportMetric
              label="Inseam"
              value={formatCentimeters(anchorSpec?.inseamCm)}
            />
            <PassportMetric
              label="Shape"
              value={formatCut(anchorSpec?.cut)}
            />
          </View>
        </View>
      </Reveal>

      {featuredProduct ? (
        <Reveal delay={115}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open your top fit, ${featuredProduct.brand.name} ${featuredProduct.title}`}
            onPress={() => router.push(`/product/${featuredProduct.id}`)}
            style={({ pressed }) => [
              styles.featured,
              {
                backgroundColor: theme.ink,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={styles.featuredCopy}>
              <Text style={styles.featuredEyebrow}>TOP FIT TODAY</Text>
              <Text numberOfLines={2} style={styles.featuredTitle}>
                {featuredProduct.brand.name} {featuredProduct.title}
              </Text>
              <Text style={styles.featuredDetail}>
                {featuredMatch
                  ? `${featuredMatch.result.confidence}% fit · ${featuredMatch.sizeLabel}`
                  : `Fit-ready sizes from ${formatCurrency(featuredProduct.priceCents)}`}
              </Text>
              <View style={styles.featuredLink}>
                <Text style={styles.featuredLinkText}>See match details</Text>
                <ArrowUpRight size={16} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.featuredImageFrame}>
              <Image
                source={{ uri: featuredProduct.heroImageUrl }}
                style={styles.featuredImage}
                contentFit="contain"
                transition={220}
              />
            </View>
          </Pressable>
        </Reveal>
      ) : null}

      <Reveal delay={165}>
        <View style={styles.fitToolsHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Shop by fit intent</Text>
            <Text style={[styles.sectionBody, { color: theme.textMuted }]}>Start with how you want denim to feel.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open full fit comparison"
            onPress={() => router.push("/compare")}
            style={({ pressed }) => [
              styles.compareButton,
              { backgroundColor: theme.surfaceWarm, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Sparkles size={16} color={theme.accent} />
            <Text style={[styles.compareButtonText, { color: theme.text }]}>Compare</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.intentRail}
        >
          <IntentPill
            label="Closest match"
            onPress={() => router.push({ pathname: "/discover", params: { query: "straight jeans" } })}
          />
          <IntentPill
            label="Under $80"
            onPress={() => router.push({ pathname: "/discover", params: { query: "jeans under $80" } })}
          />
          <IntentPill
            label="More stretch"
            onPress={() => router.push({ pathname: "/discover", params: { query: "stretch jeans" } })}
          />
          <IntentPill
            label="Boot-ready"
            onPress={() => router.push({ pathname: "/discover", params: { query: "bootcut jeans" } })}
          />
        </ScrollView>
      </Reveal>

      <Reveal delay={215}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Explore the Rober jeans fit index"
          onPress={() => router.push("/discover")}
          style={({ pressed }) => [
            styles.indexEvidence,
            {
              backgroundColor: theme.surfaceWarm,
              borderColor: theme.border,
              opacity: pressed ? 0.76 : 1,
            },
          ]}
        >
          <View style={[styles.indexIcon, { backgroundColor: theme.surface }]}>
            <Database size={20} color={theme.accent} />
          </View>
          <View style={styles.indexMainCopy}>
            <Text style={[styles.indexTitle, { color: theme.text }]}>The Rober fit index</Text>
            <Text style={[styles.indexBody, { color: theme.textMuted }]}>Normalized benchmark charts with recommended sizes on every result.</Text>
          </View>
          <ChevronRight size={19} color={theme.textMuted} />
          <View style={styles.indexStats}>
            {sourceStats.map((stat) => (
              <View key={stat.label} style={styles.indexStat}>
                <Text style={[styles.indexStatValue, { color: theme.text }]}>{stat.value}</Text>
                <Text style={[styles.indexStatLabel, { color: theme.textMuted }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Pressable>
      </Reveal>

      <Reveal delay={265}>
        <SectionRow
          title="Best matches"
          action="Browse all"
          onPress={() => router.push("/discover")}
        />
        <View style={styles.productGrid}>
          {topMatchCards.map((product) => (
            <View key={product.id} style={styles.productCell}>
              <ProductCard product={product} />
            </View>
          ))}
        </View>
      </Reveal>

      <Reveal delay={315}>
        <SectionRow
          title="Indexed brands"
          action={`${indexStats.benchmarkBrands} brands`}
          onPress={() => router.push("/discover")}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.brandRail}
        >
          {demoBrands.map((brand, index) => (
            <BrandPill
              key={brand.slug}
              label={brand.name}
              selected={index === 0}
              onPress={() =>
                router.push({ pathname: "/discover", params: { brand: brand.slug } })
              }
            />
          ))}
        </ScrollView>
      </Reveal>
    </ScrollView>
  );
}

function PassportMetric({ label, value }: { label: string; value: string }) {
  const theme = useThemeTokens();
  return (
    <View style={[styles.metric, { backgroundColor: theme.surfaceWarm }]}>
      <Text style={[styles.metricLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text numberOfLines={1} style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function IntentPill({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useThemeTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Shop ${label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.intentPill,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.68 : 1 },
      ]}
    >
      <Text style={[styles.intentPillText, { color: theme.text }]}>{label}</Text>
      <ChevronRight size={15} color={theme.accent} />
    </Pressable>
  );
}

function SectionRow({
  title,
  action,
  onPress,
}: {
  title: string;
  action: string;
  onPress: () => void;
}) {
  const theme = useThemeTokens();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${action} ${title}`}
        onPress={onPress}
        hitSlop={8}
        style={({ pressed }) => ({ opacity: pressed ? 0.62 : 1 })}
      >
        <Text style={[styles.sectionAction, { color: theme.textMuted }]}>{action}</Text>
      </Pressable>
    </View>
  );
}

function formatCentimeters(value?: number) {
  return value ? `${Math.round(value)} cm` : "Synced";
}

function formatCut(value?: string) {
  if (!value) {
    return "Straight";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatCompact(value: number) {
  if (value < 1000) {
    return String(value);
  }
  return `${(value / 1000).toFixed(1)}k`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 18 },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { fontSize: 33, fontWeight: "900" },
  topActions: { flexDirection: "row", gap: 10 },
  passport: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 14 },
  passportHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  kicker: { fontFamily: "Courier", fontSize: 10, fontWeight: "900", letterSpacing: 0.9 },
  passportTitle: { marginTop: 4, fontSize: 21, fontWeight: "900", lineHeight: 25 },
  passportEdit: { minWidth: 48, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center" },
  passportEditText: { fontSize: 12, fontWeight: "900" },
  measurements: { flexDirection: "row", gap: 7 },
  metric: { flex: 1, minWidth: 0, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 8, gap: 3 },
  metricLabel: { fontSize: 9, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.45 },
  metricValue: { fontSize: 12, fontWeight: "900" },
  featured: { minHeight: 192, borderRadius: 24, overflow: "hidden", flexDirection: "row" },
  featuredCopy: { flex: 1.1, padding: 19, justifyContent: "space-between", gap: 9, zIndex: 1 },
  featuredEyebrow: { color: "#F6C5B9", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  featuredTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", lineHeight: 25 },
  featuredDetail: { color: "rgba(255,255,255,0.76)", fontSize: 12, fontWeight: "800", lineHeight: 17 },
  featuredLink: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 },
  featuredLinkText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  featuredImageFrame: { width: "43%", paddingTop: 10, paddingRight: 8, paddingBottom: 8 },
  featuredImage: { width: "100%", height: "100%" },
  fitToolsHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
  sectionTitle: { fontSize: 19, fontWeight: "900", lineHeight: 23 },
  sectionBody: { marginTop: 3, fontSize: 12, fontWeight: "700", lineHeight: 17 },
  compareButton: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  compareButtonText: { fontSize: 12, fontWeight: "900" },
  intentRail: { gap: 8, paddingRight: 18 },
  intentPill: { flexDirection: "row", alignItems: "center", gap: 3, borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 10 },
  intentPillText: { fontSize: 12, fontWeight: "900" },
  indexEvidence: { borderWidth: 1, borderRadius: 20, padding: 14, flexDirection: "row", alignItems: "center", gap: 11, flexWrap: "wrap" },
  indexIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  indexMainCopy: { flex: 1, minWidth: 170 },
  indexTitle: { fontSize: 15, fontWeight: "900" },
  indexBody: { marginTop: 3, fontSize: 11, fontWeight: "700", lineHeight: 15 },
  indexStats: { width: "100%", flexDirection: "row", justifyContent: "space-between", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(16,16,19,0.12)", paddingTop: 11 },
  indexStat: { flex: 1, gap: 2 },
  indexStatValue: { fontSize: 17, fontWeight: "900" },
  indexStatLabel: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.35 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 11 },
  sectionAction: { fontSize: 12, fontWeight: "900" },
  productGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  productCell: { width: "48%", flexGrow: 1 },
  brandRail: { gap: 9, paddingRight: 18 },
});
