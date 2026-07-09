import { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Bell, Search, X } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProductFilters, ProductRecord } from "@rober/api-client";
import { Chip, EmptyState, IconButton } from "../../components/primitives";
import { ProductCard } from "../../components/product";
import { Reveal } from "../../components/motion";
import { useDemoRefresh } from "../../hooks/useDemoRefresh";
import { demoBrands, searchCatalog, toProductCard } from "../../lib/catalog";
import { computeGarmentMatches, diversifyGarmentMatches } from "../../lib/garmentCompare";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

type CatalogResult = {
  product: ProductRecord;
  confidence?: number;
};

const fitValues = ["slim", "regular", "relaxed", "oversized"] as const;

export default function DiscoverScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    brand?: string;
    query?: string;
    fit?: string;
  }>();
  const routeBrand = typeof params.brand === "string" ? params.brand : undefined;
  const routeQuery = typeof params.query === "string" ? params.query : "";
  const routeFit = parseFit(typeof params.fit === "string" ? params.fit : undefined);
  const [query, setQuery] = useState(routeQuery);
  const [fit, setFit] = useState<ProductFilters["fit"]>(routeFit);
  const [styleTag, setStyleTag] = useState<string | undefined>();
  const [brand, setBrand] = useState<string | undefined>(routeBrand);
  const [priceMax, setPriceMax] = useState<number | undefined>(
    parsePriceCap(routeQuery),
  );
  const favorite = useDemoStore((state) => state.knownGoodItems[0]);
  const anchorSpec = favorite?.canonicalSpec;
  const { refreshing, onRefresh } = useDemoRefresh();

  useEffect(() => {
    setBrand(routeBrand);
  }, [routeBrand]);

  useEffect(() => {
    setQuery(routeQuery);
    setPriceMax(parsePriceCap(routeQuery));
  }, [routeQuery]);

  useEffect(() => {
    setFit(routeFit);
  }, [routeFit]);

  const products = useMemo(() => {
    const matchingProducts = searchCatalog({
        query,
        category: "bottoms",
        subcategory: "jeans",
        ...(fit ? { fit } : {}),
        ...(styleTag ? { styleTags: [styleTag] } : {}),
        ...(brand ? { brands: [brand] } : {}),
        ...(priceMax ? { priceMax } : {}),
        sizeAvailabilityRequired: true,
      });
    return favorite?.gender
      ? matchingProducts.filter((product) => product.gender === favorite.gender)
      : matchingProducts;
  }, [brand, favorite?.gender, fit, priceMax, query, styleTag]);

  const results = useMemo<CatalogResult[]>(() => {
    if (!anchorSpec) {
      return products.map((product) => ({ product }));
    }
    return diversifyGarmentMatches(
      computeGarmentMatches(anchorSpec, products),
    ).map((entry) => ({
      product: entry.product,
      confidence: entry.result.confidence,
    }));
  }, [anchorSpec, products]);

  const fitReadyVariants = useMemo(
    () =>
      products.reduce(
        (total, product) =>
          total + product.variants.filter((variant) => variant.stock > 0).length,
        0,
      ),
    [products],
  );

  const clearFilters = () => {
    setQuery("");
    setFit(undefined);
    setStyleTag(undefined);
    setBrand(undefined);
    setPriceMax(undefined);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bgCanvas }]}>
      <FlashList
        data={results}
        keyExtractor={(item) => item.product.id}
        numColumns={2}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
          />
        }
        contentContainerStyle={{
          ...styles.listContent,
          paddingTop: insets.top + 18,
          paddingBottom: insets.bottom + 132,
        }}
        ListHeaderComponent={
          <Reveal>
            <View style={styles.header}>
              <View style={styles.topbar}>
                <View>
                  <Text style={[styles.logo, { color: theme.text }]}>Rober</Text>
                  <Text style={[styles.kicker, { color: theme.accent }]}>FIT INDEX</Text>
                </View>
                <IconButton
                  accessibilityLabel="Notifications and order updates"
                  onPress={() => router.push("/orders")}
                >
                  <Bell size={20} color={theme.text} />
                </IconButton>
              </View>

              <View>
                <Text style={[styles.title, { color: theme.text }]}>Find your next pair.</Text>
                <Text style={[styles.copy, { color: theme.textMuted }]}>Every result is sized against your saved reference pair.</Text>
              </View>

              <View
                style={[
                  styles.searchBox,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Search size={19} color={theme.textMuted} />
                <TextInput
                  accessibilityLabel="Search the jeans fit index"
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search straight, curvy, relaxed..."
                  placeholderTextColor={theme.textMuted}
                  style={[styles.searchInput, { color: theme.text }]}
                />
                {query ? (
                  <IconButton
                    accessibilityLabel="Clear search"
                    onPress={() => setQuery("")}
                    style={styles.clearSearch}
                  >
                    <X size={16} color={theme.textMuted} />
                  </IconButton>
                ) : null}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRail}>
                <Chip
                  label="All fits"
                  selected={!fit && !styleTag && !brand && !priceMax}
                  onPress={clearFilters}
                />
                <Chip
                  label="Straight"
                  selected={fit === "regular"}
                  onPress={() => toggleFit(setFit, fit, "regular")}
                />
                <Chip
                  label="Slim"
                  selected={fit === "slim"}
                  onPress={() => toggleFit(setFit, fit, "slim")}
                />
                <Chip
                  label="Relaxed"
                  selected={fit === "relaxed"}
                  onPress={() => toggleFit(setFit, fit, "relaxed")}
                />
                <Chip
                  label="Curvy"
                  selected={styleTag === "curvy"}
                  onPress={() => {
                    setStyleTag(styleTag === "curvy" ? undefined : "curvy");
                    setFit(undefined);
                  }}
                />
                <Chip
                  label="Stretch"
                  selected={styleTag === "stretch"}
                  onPress={() => {
                    setStyleTag(styleTag === "stretch" ? undefined : "stretch");
                    setFit(undefined);
                  }}
                />
                <Chip
                  label="Under $80"
                  selected={priceMax === 80}
                  onPress={() => setPriceMax(priceMax === 80 ? undefined : 80)}
                />
              </ScrollView>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandRail}>
                {demoBrands.map((item) => (
                  <Chip
                    key={item.slug}
                    label={item.name}
                    selected={brand === item.slug}
                    onPress={() => setBrand(brand === item.slug ? undefined : item.slug)}
                  />
                ))}
              </ScrollView>

              <View
                style={[
                  styles.resultSummary,
                  { backgroundColor: theme.surfaceWarm, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.resultSummaryText, { color: theme.text }]}>
                  {results.length} styles
                </Text>
                <View style={[styles.summaryDot, { backgroundColor: theme.accent }]} />
                <Text style={[styles.resultSummaryText, { color: theme.textMuted }]}>
                  {formatCompact(fitReadyVariants)} fit-ready size options
                </Text>
                {favorite ? (
                  <Text numberOfLines={1} style={[styles.referenceLabel, { color: theme.textMuted }]}>
                    Sized from {favorite.brand} {favorite.sizeLabel}
                  </Text>
                ) : null}
              </View>
            </View>
          </Reveal>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState
              title="No fit-ready matches"
              body="Try removing a filter or search for straight, curvy, relaxed, or stretch denim."
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.gridCell,
              index % 2 === 0 ? styles.leftCell : styles.rightCell,
            ]}
          >
            <Reveal delay={Math.min(index, 7) * 24}>
              <ProductCard
                product={toProductCard(item.product, item.confidence)}
              />
            </Reveal>
          </View>
        )}
      />
    </View>
  );
}

function parseFit(value?: string): ProductFilters["fit"] {
  return fitValues.includes(value as (typeof fitValues)[number])
    ? (value as ProductFilters["fit"])
    : undefined;
}

function parsePriceCap(value: string) {
  const match = value.match(/under\s+\$?(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

function toggleFit(
  setFit: (value: ProductFilters["fit"] | undefined) => void,
  current: ProductFilters["fit"],
  next: ProductFilters["fit"],
) {
  setFit(current === next ? undefined : next);
}

function formatCompact(value: number) {
  if (value < 1000) {
    return String(value);
  }
  return `${(value / 1000).toFixed(1)}k`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { paddingHorizontal: 18 },
  header: { gap: 17, marginBottom: 20 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: 31, fontWeight: "900", lineHeight: 34 },
  kicker: { marginTop: 2, fontFamily: "Courier", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  title: { fontSize: 27, fontWeight: "900", lineHeight: 31 },
  copy: { marginTop: 5, fontSize: 13, fontWeight: "700", lineHeight: 18 },
  searchBox: { minHeight: 54, borderWidth: 1, borderRadius: 18, paddingLeft: 15, paddingRight: 7, alignItems: "center", flexDirection: "row", gap: 9 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: "800" },
  clearSearch: { width: 32, height: 32, borderRadius: 999, shadowOpacity: 0, elevation: 0 },
  filterRail: { gap: 8, paddingRight: 18 },
  brandRail: { gap: 8, paddingRight: 18, marginTop: -7 },
  resultSummary: { minHeight: 42, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 7 },
  resultSummaryText: { fontSize: 11, fontWeight: "900" },
  summaryDot: { width: 4, height: 4, borderRadius: 99 },
  referenceLabel: { flex: 1, minWidth: 0, textAlign: "right", fontSize: 10, fontWeight: "800" },
  gridCell: { marginBottom: 14 },
  leftCell: { paddingRight: 7 },
  rightCell: { paddingLeft: 7 },
  emptyWrap: { marginTop: 8 },
});
