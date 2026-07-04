import { Link } from "expo-router";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Trash2 } from "lucide-react-native";
import { calculateCartTotals, formatCurrency } from "@rober/api-client";
import { AddressCard, AppButton, EmptyState, IconButton, PromoCodeRow, QuantityStepper, SectionHeader } from "../../components/primitives";
import { FitScorePill } from "../../components/fit";
import { getCatalogProduct } from "../../lib/catalog";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function CartScreen() {
  const theme = useThemeTokens();
  const cartItems = useDemoStore((state) => state.cartItems);
  const updateCartQuantity = useDemoStore((state) => state.updateCartQuantity);
  const removeCartItem = useDemoStore((state) => state.removeCartItem);
  const totals = calculateCartTotals(cartItems, "ROBERFIT");

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <SectionHeader kicker="Bag" title="Cart" />
      {cartItems.length ? (
        <View style={styles.items}>
          {cartItems.map((item) => {
            const product = getCatalogProduct(item.productId);
            return (
              <View key={item.variantId} style={[styles.lineItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {product ? <Image source={{ uri: product.heroImageUrl }} style={styles.itemImage} contentFit="cover" /> : null}
                <View style={styles.itemBody}>
                  <Text style={[styles.itemBrand, { color: theme.textMuted }]}>{product?.brand.name ?? "Rober"}</Text>
                  <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={2}>
                    {product?.title ?? item.productId}
                  </Text>
                  <Text style={[styles.itemMeta, { color: theme.textMuted }]}>
                    Size {item.sizeLabel} / {item.color}
                  </Text>
                  <FitScorePill confidence={item.fitConfidenceWhenAdded} />
                  <View style={styles.itemControls}>
                    <QuantityStepper
                      value={item.quantity}
                      onIncrement={() => updateCartQuantity(item.variantId, item.quantity + 1)}
                      onDecrement={() => updateCartQuantity(item.variantId, item.quantity - 1)}
                    />
                    <IconButton accessibilityLabel="Remove item" onPress={() => removeCartItem(item.variantId)}>
                      <Trash2 size={18} color={theme.text} />
                    </IconButton>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <EmptyState title="Your bag is empty" body="Add the best-fit overshirt from Compare, or use checkout to run the seeded fallback order." />
      )}
      <PromoCodeRow />
      <AddressCard compact />
      <View style={[styles.totals, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TotalRow label="Subtotal" value={formatCurrency(totals.subtotalCents)} />
        <TotalRow label="Fit demo discount" value={`-${formatCurrency(totals.discountCents)}`} />
        <TotalRow label="Shipping" value={totals.shippingCents === 0 ? "Free" : formatCurrency(totals.shippingCents)} />
        <TotalRow label="Total" value={formatCurrency(totals.totalCents)} strong />
      </View>
      <Link href="/checkout" asChild>
        <AppButton>{cartItems.length ? "Continue to checkout" : "Checkout seeded demo item"}</AppButton>
      </Link>
    </ScrollView>
  );
}

function TotalRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const theme = useThemeTokens();
  return (
    <View style={styles.totalRow}>
      <Text style={[strong ? styles.totalStrong : styles.totalText, { color: theme.text }]}>{label}</Text>
      <Text style={[strong ? styles.totalStrong : styles.totalText, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: 120,
    gap: 16
  },
  items: {
    gap: 12
  },
  lineItem: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 10,
    flexDirection: "row",
    gap: 12
  },
  itemImage: {
    width: 96,
    borderRadius: 12,
    aspectRatio: 0.8
  },
  itemBody: {
    flex: 1,
    gap: 7
  },
  itemBrand: {
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "900",
    letterSpacing: 0.8
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "900"
  },
  itemMeta: {
    fontSize: 12,
    fontWeight: "700"
  },
  itemControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  totals: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  totalText: {
    fontSize: 14,
    fontWeight: "700"
  },
  totalStrong: {
    fontSize: 18,
    fontWeight: "900"
  }
});
