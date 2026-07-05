import { ScrollView, StyleSheet, Text, View } from "react-native";
import { translateFavoriteJeansFit } from "@rober/api-client";
import { EmptyState, SectionHeader } from "../../components/primitives";
import { ProductRail } from "../../components/product";
import { closetInspiredProducts, toProductCard } from "../../lib/catalog";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function WishlistScreen() {
  const theme = useThemeTokens();
  const knownGoodItems = useDemoStore((state) => state.knownGoodItems);
  const orders = useDemoStore((state) => state.orders);
  const translation = translateFavoriteJeansFit({
    anchorStyleId: "levis-501-original",
    taggedSize: "32x32",
  });

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bgCanvas }]}
      contentContainerStyle={styles.content}
    >
      <SectionHeader kicker="Saved" title="Fit memory" />
      <EmptyState
        title="Saved with fit memory"
        body="Saved jeans keep their recommended size, match reason, and whether they are closer, roomier, slimmer, stretchier, or better for boots."
      />

      <SectionHeader kicker="Wishlist" title="Jeans to revisit" />
      <ProductRail
        products={closetInspiredProducts
          .slice(0, 6)
          .map((product, index) => toProductCard(product, 90 - index * 3))}
      />

      <SectionHeader kicker="Comparisons" title="Saved against your 501" />
      <View
        style={[
          styles.panel,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {translation.recommendations.slice(0, 4).map((item) => (
          <MemoryRow
            key={item.style.id}
            label={item.style.brandName}
            title={item.style.styleName}
            meta={`${item.overallScore}% match`}
          />
        ))}
      </View>

      <SectionHeader kicker="Anchors" title="Favorite jeans" />
      <View
        style={[
          styles.panel,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {knownGoodItems.map((item) => (
          <MemoryRow
            key={item.id}
            label={item.brand}
            title={`${item.itemName} - ${item.sizeLabel}`}
            meta="Pinned anchor"
          />
        ))}
      </View>

      <SectionHeader kicker="Feedback" title="Tried fit history" />
      <View
        style={[
          styles.panel,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {orders.flatMap((order) =>
          order.items.map((item) => (
            <MemoryRow
              key={item.id}
              label={order.status}
              title={`${item.sizeLabel} - ${item.color}`}
              meta={item.fitFeedback?.replaceAll("_", " ") ?? "Awaiting fit"}
            />
          )),
        )}
      </View>
    </ScrollView>
  );
}

function MemoryRow({
  label,
  title,
  meta,
}: {
  label: string;
  title: string;
  meta: string;
}) {
  const theme = useThemeTokens();
  return (
    <View style={[styles.memoryRow, { borderColor: theme.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.memoryLabel, { color: theme.textMuted }]}>
          {label}
        </Text>
        <Text style={[styles.memoryTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <Text style={[styles.memoryMeta, { color: theme.accent }]}>{meta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: 120,
    gap: 18,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 22,
    overflow: "hidden",
  },
  memoryRow: {
    minHeight: 66,
    borderBottomWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memoryLabel: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  memoryTitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "900",
  },
  memoryMeta: {
    maxWidth: 96,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize",
  },
});
