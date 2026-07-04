import { useMemo, useState } from "react";
import { RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { ProductCategory, ProductFilters } from "@rober/api-client";
import { CategoryTile, Chip, EmptyState, SectionHeader } from "../../components/primitives";
import { ProductCard } from "../../components/product";
import { useDemoRefresh } from "../../hooks/useDemoRefresh";
import { demoBrands, searchCatalog, toProductCard } from "../../lib/catalog";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function DiscoverScreen() {
  const theme = useThemeTokens();
  const [query, setQuery] = useState("green cotton overshirt under $80");
  const [category, setCategory] = useState<ProductCategory | undefined>();
  const [fit, setFit] = useState<ProductFilters["fit"]>();
  const [brand, setBrand] = useState<string | undefined>();
  const [under100, setUnder100] = useState(true);
  const { refreshing, onRefresh } = useDemoRefresh();
  const products = useMemo(
    () =>
      searchCatalog({
        query,
        ...(category ? { category } : {}),
        ...(fit ? { fit } : {}),
        ...(brand ? { brands: [brand] } : {}),
        ...(under100 ? { priceMax: 100 } : {}),
        sizeAvailabilityRequired: true
      }),
    [brand, category, fit, query, under100]
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.bgCanvas }]}>
      <FlashList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <SectionHeader kicker="Browse" title="Discover" />
            <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TextInput
                accessibilityLabel="Search products"
                value={query}
                onChangeText={setQuery}
                placeholder="Try: black boots that fit wide feet"
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { color: theme.text }]}
              />
            </View>
            <View style={styles.categoryGrid}>
              <CategoryTile title="Men" subtitle="Utility, denim, knits" tone="men" />
              <CategoryTile title="Women" subtitle="Soft tailoring, dresses" tone="women" />
              <CategoryTile title="Kids" subtitle="Durable everyday fits" tone="kids" />
              <CategoryTile title="Access" subtitle="Shoes, bags, belts" tone="access" />
            </View>
            <View style={styles.chips}>
              <Chip label="All" selected={!category} onPress={() => setCategory(undefined)} />
              <Chip label="Tops" selected={category === "tops"} onPress={() => setCategory("tops")} />
              <Chip label="Bottoms" selected={category === "bottoms"} onPress={() => setCategory("bottoms")} />
              <Chip label="Outerwear" selected={category === "outerwear"} onPress={() => setCategory("outerwear")} />
              <Chip label="Best fit" selected={fit === "regular"} onPress={() => setFit(fit === "regular" ? undefined : "regular")} />
              <Chip label="Relaxed" selected={fit === "relaxed"} onPress={() => setFit(fit === "relaxed" ? undefined : "relaxed")} />
              <Chip label="Under $100" selected={under100} onPress={() => setUnder100(!under100)} />
            </View>
            <View style={styles.brandChips}>
              {demoBrands.slice(0, 6).map((item) => (
                <Chip
                  key={item.slug}
                  label={item.name.split(" ")[0] ?? item.name}
                  selected={brand === item.slug}
                  onPress={() => setBrand(brand === item.slug ? undefined : item.slug)}
                />
              ))}
            </View>
            <Text style={[styles.resultCount, { color: theme.textMuted }]}>
              {products.length} fictional products across normalized brand charts
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState title="No exact matches" body="Try removing a filter or searching for overshirts, jeans, knits, boots, or summer office." />
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={[styles.gridCell, index % 2 === 0 ? styles.leftCell : styles.rightCell]}>
            <ProductCard product={toProductCard(item, Math.max(54, 91 - (index % 10) * 4))} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  listContent: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: 120
  },
  header: {
    gap: 18,
    marginBottom: 18
  },
  searchBox: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    justifyContent: "center"
  },
  searchInput: {
    fontSize: 16,
    fontWeight: "800"
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  brandChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  resultCount: {
    fontSize: 13,
    fontWeight: "800"
  },
  gridCell: {
    marginBottom: 14
  },
  leftCell: {
    paddingRight: 7
  },
  rightCell: {
    paddingLeft: 7
  },
  emptyWrap: {
    marginTop: 12
  }
});
