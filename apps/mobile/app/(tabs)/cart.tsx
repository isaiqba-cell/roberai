import { Link } from "expo-router";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Trash2 } from "lucide-react-native";
import { calculateCartTotals, formatCurrency } from "@rober/api-client";
import {
  AddressCard,
  AppButton,
  EmptyState,
  IconButton,
  PromoCodeRow,
  QuantityStepper,
} from "../../components/primitives";
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
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bgCanvas }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.headerKicker, { color: theme.accent }]}>
          Your perfect outfit
        </Text>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Bag</Text>
      </View>
      {cartItems.length ? (
        <View style={styles.items}>
          {cartItems.map((item) => {
            const product = getCatalogProduct(item.productId);
            return (
              <View
                key={item.variantId}
                style={[
                  styles.lineItem,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.surface,
                  },
                ]}
              >
                <View
                  style={[
                    styles.imageTile,
                    { backgroundColor: theme.surfaceWarm },
                  ]}
                >
                  {product ? (
                    <Image
                      source={{ uri: product.heroImageUrl }}
                      style={styles.itemImage}
                      contentFit="contain"
                    />
                  ) : null}
                </View>
                <View style={styles.itemBody}>
                  <Text style={[styles.itemBrand, { color: theme.textMuted }]}>
                    {product?.brand.name ?? "Rober"}
                  </Text>
                  <Text
                    style={[styles.itemTitle, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {product?.title ?? item.productId}
                  </Text>
                  <Text style={[styles.itemMeta, { color: theme.textMuted }]}>
                    Size {item.sizeLabel} / {item.color}
                  </Text>
                  <FitScorePill confidence={item.fitConfidenceWhenAdded} />
                  <View style={styles.itemControls}>
                    <QuantityStepper
                      value={item.quantity}
                      onIncrement={() =>
                        updateCartQuantity(item.variantId, item.quantity + 1)
                      }
                      onDecrement={() =>
                        updateCartQuantity(item.variantId, item.quantity - 1)
                      }
                    />
                    <IconButton
                      accessibilityLabel="Remove item"
                      onPress={() => removeCartItem(item.variantId)}
                    >
                      <Trash2 size={18} color={theme.text} />
                    </IconButton>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <EmptyState
          title="Your bag is empty"
          body="Add the best-fit jeans from Compare, or use checkout to run the seeded fallback order."
        />
      )}
      <PromoCodeRow />
      <AddressCard compact />
      <View
        style={[
          styles.totals,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <TotalRow
          label="Subtotal"
          value={formatCurrency(totals.subtotalCents)}
        />
        <TotalRow
          label="Fit demo discount"
          value={`-${formatCurrency(totals.discountCents)}`}
        />
        <TotalRow
          label="Shipping"
          value={
            totals.shippingCents === 0
              ? "Free"
              : formatCurrency(totals.shippingCents)
          }
        />
        <TotalRow
          label="Total"
          value={formatCurrency(totals.totalCents)}
          strong
        />
      </View>
      <Link href="/checkout" asChild>
        <AppButton>
          {cartItems.length
            ? `Shop Now - ${formatCurrency(totals.totalCents)}`
            : "Checkout seeded jeans"}
        </AppButton>
      </Link>
    </ScrollView>
  );
}

function TotalRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  const theme = useThemeTokens();
  return (
    <View style={styles.totalRow}>
      <Text
        style={[
          strong ? styles.totalStrong : styles.totalText,
          { color: theme.text },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          strong ? styles.totalStrong : styles.totalText,
          { color: theme.text },
        ]}
      >
        {value}
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
    paddingTop: 58,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  headerKicker: {
    fontSize: 17,
    fontWeight: "800",
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: "900",
  },
  items: {
    gap: 12,
  },
  lineItem: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 10,
    flexDirection: "row",
    gap: 14,
    shadowColor: "#6F3328",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  imageTile: {
    width: 112,
    minHeight: 128,
    borderRadius: 22,
    overflow: "hidden",
  },
  itemImage: {
    height: "100%",
    width: "100%",
  },
  itemBody: {
    flex: 1,
    gap: 7,
  },
  itemBrand: {
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "900",
  },
  itemMeta: {
    fontSize: 12,
    fontWeight: "700",
  },
  itemControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  totals: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 10,
    shadowColor: "#6F3328",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalText: {
    fontSize: 14,
    fontWeight: "700",
  },
  totalStrong: {
    fontSize: 18,
    fontWeight: "900",
  },
});
