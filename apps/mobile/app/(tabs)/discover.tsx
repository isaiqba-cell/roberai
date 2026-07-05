import { useMemo, useState } from "react";
import {
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Bell, Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProductCategory, ProductFilters } from "@rober/api-client";
import {
  CategoryTile,
  Chip,
  EmptyState,
  IconButton,
} from "../../components/primitives";
import { ProductCard } from "../../components/product";
import { useDemoRefresh } from "../../hooks/useDemoRefresh";
import { demoBrands, searchCatalog, toProductCard } from "../../lib/catalog";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function DiscoverScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProductCategory | undefined>(
    "bottoms",
  );
  const [fit, setFit] = useState<ProductFilters["fit"]>();
  const [styleTag, setStyleTag] = useState<string | undefined>();
  const [brand, setBrand] = useState<string | undefined>();
  const [under100, setUnder100] = useState(true);
  const { refreshing, onRefresh } = useDemoRefresh();
  const products = useMemo(
    () =>
      searchCatalog({
        query,
        ...(category ? { category } : {}),
        subcategory: "jeans",
        ...(fit ? { fit } : {}),
        ...(styleTag ? { styleTags: [styleTag] } : {}),
        ...(brand ? { brands: [brand] } : {}),
        ...(under100 ? { priceMax: 100 } : {}),
        sizeAvailabilityRequired: true,
      }),
    [brand, category, fit, query, styleTag, under100],
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.bgCanvas }]}>
      <FlashList
        data={products}
        keyExtractor={(item) => item.id}
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
          paddingTop: insets.top + 30,
          paddingBottom: insets.bottom + 118,
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topbar}>
              <View>
                <Text style={[styles.logo, { color: theme.text }]}>Rober</Text>
                <Text style={[styles.tagline, { color: theme.textMuted }]}>
                  Jeans that fit like your favorite pair
                </Text>
              </View>
              <View style={styles.topActions}>
                <IconButton accessibilityLabel="Search products">
                  <Search size={22} color={theme.text} />
                </IconButton>
                <IconButton accessibilityLabel="Notifications">
                  <Bell size={21} color={theme.text} />
                </IconButton>
              </View>
            </View>
            <View
              style={[
                styles.searchBox,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Search size={19} color={theme.textMuted} />
              <TextInput
                accessibilityLabel="Search products"
                value={query}
                onChangeText={setQuery}
                placeholder="Search straight, curvy, relaxed jeans"
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { color: theme.text }]}
              />
            </View>
            <View style={styles.categoryGrid}>
              <CategoryTile
                title="Straight"
                subtitle="Classic waist-to-hip"
                tone="men"
              />
              <CategoryTile
                title="Curvy"
                subtitle="Extra hip room"
                tone="women"
              />
              <CategoryTile title="Relaxed" subtitle="More ease" tone="kids" />
              <CategoryTile
                title="Rigid"
                subtitle="Tighter tolerance"
                tone="access"
              />
            </View>
            <View style={styles.chips}>
              <Chip
                label="All jeans"
                selected={!fit && !brand && !styleTag}
                onPress={() => {
                  setCategory("bottoms");
                  setFit(undefined);
                  setBrand(undefined);
                  setStyleTag(undefined);
                }}
              />
              <Chip
                label="Straight"
                selected={fit === "regular"}
                onPress={() => {
                  setFit(fit === "regular" ? undefined : "regular");
                  setStyleTag(undefined);
                }}
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
                label="Relaxed"
                selected={fit === "relaxed"}
                onPress={() => {
                  setFit(fit === "relaxed" ? undefined : "relaxed");
                  setStyleTag(undefined);
                }}
              />
              <Chip
                label="Rigid"
                selected={styleTag === "rigid"}
                onPress={() => {
                  setStyleTag(styleTag === "rigid" ? undefined : "rigid");
                  setFit(undefined);
                }}
              />
              <Chip
                label="Under $100"
                selected={under100}
                onPress={() => setUnder100(!under100)}
              />
            </View>
            <View style={styles.brandChips}>
              {demoBrands.slice(0, 6).map((item) => (
                <Chip
                  key={item.slug}
                  label={item.name}
                  selected={brand === item.slug}
                  onPress={() =>
                    setBrand(brand === item.slug ? undefined : item.slug)
                  }
                />
              ))}
            </View>
            <Text style={[styles.resultCount, { color: theme.textMuted }]}>
              {products.length} jeans variants from official size-chart sources
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState
              title="No exact matches"
              body="Try removing a filter or searching for straight, curvy, relaxed, rigid, or stretch denim."
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
            <ProductCard
              product={toProductCard(item, Math.max(54, 91 - (index % 10) * 4))}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    padding: 18,
  },
  header: {
    gap: 16,
    marginBottom: 18,
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
  searchBox: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: "#6F3328",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  brandChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: "800",
  },
  gridCell: {
    marginBottom: 14,
  },
  leftCell: {
    paddingRight: 7,
  },
  rightCell: {
    paddingLeft: 7,
  },
  emptyWrap: {
    marginTop: 12,
  },
});
