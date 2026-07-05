import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { calculateCartTotals, formatCurrency } from "@rober/api-client";
import { AddressCard, AppButton } from "../../components/primitives";
import { getCatalogProduct } from "../../lib/catalog";
import { presentDemoPaymentSheet } from "../../lib/stripe";
import { DemoCartItem, useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

const seededCheckoutItem: DemoCartItem = {
  productId: "madewell-perfect-vintage-straight",
  variantId: "madewell-perfect-vintage-straight-29-32",
  sizeLabel: "29x32",
  color: "light blue",
  unitPriceCents: 13800,
  fitConfidenceWhenAdded: 91,
  quantity: 1,
};

export default function CheckoutScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const cartItems = useDemoStore((state) => state.cartItems);
  const createOrderFromCart = useDemoStore(
    (state) => state.createOrderFromCart,
  );
  const checkoutItems = cartItems.length ? cartItems : [seededCheckoutItem];
  const totals = useMemo(
    () => calculateCartTotals(checkoutItems, "ROBERFIT"),
    [checkoutItems],
  );

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bgCanvas }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.headerKicker, { color: theme.accent }]}>
          Checkout
        </Text>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Effortless denim, paid simply
        </Text>
      </View>
      <View style={styles.items}>
        {checkoutItems.slice(0, 2).map((item) => {
          const product = getCatalogProduct(item.productId);
          return (
            <View
              key={item.variantId}
              style={[
                styles.checkoutItem,
                { backgroundColor: theme.surface, borderColor: theme.surface },
              ]}
            >
              <View
                style={[
                  styles.checkoutImageTile,
                  { backgroundColor: theme.surfaceWarm },
                ]}
              >
                {product ? (
                  <Image
                    source={{ uri: product.heroImageUrl }}
                    style={styles.checkoutImage}
                    contentFit="contain"
                  />
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.checkoutTitle, { color: theme.text }]}
                  numberOfLines={2}
                >
                  {product?.title ?? item.productId}
                </Text>
                <Text style={[styles.copy, { color: theme.textMuted }]}>
                  Size {item.sizeLabel}
                </Text>
                <Text style={[styles.checkoutPrice, { color: theme.text }]}>
                  {formatCurrency(item.unitPriceCents)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      <View
        style={[
          styles.notice,
          { backgroundColor: theme.surfaceWarm, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.noticeTitle, { color: theme.text }]}>
          Promo code applied
        </Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          You saved 10% on this investor-demo order. Test card: 4242 4242 4242
          4242.
        </Text>
      </View>
      <AddressCard />
      <View
        style={[
          styles.summary,
          { borderColor: theme.border, backgroundColor: theme.surface },
        ]}
      >
        <SummaryRow
          label="Subtotal"
          value={formatCurrency(totals.subtotalCents)}
        />
        <SummaryRow
          label="Promo"
          value={`-${formatCurrency(totals.discountCents)}`}
        />
        <SummaryRow
          label="Shipping"
          value={
            totals.shippingCents ? formatCurrency(totals.shippingCents) : "Free"
          }
        />
        <SummaryRow
          label="Total"
          value={formatCurrency(totals.totalCents)}
          strong
        />
      </View>
      <AppButton
        disabled={loading}
        onPress={async () => {
          setLoading(true);
          const payment = await presentDemoPaymentSheet(totals);
          if (payment.status === "succeeded") {
            const order = createOrderFromCart();
            router.replace(`/checkout/success?orderId=${order.id}`);
          }
          setLoading(false);
        }}
      >
        {loading
          ? "Authorizing..."
          : `Pay ${formatCurrency(totals.totalCents)}`}
      </AppButton>
    </ScrollView>
  );
}

function SummaryRow({
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
    <View style={styles.summaryRow}>
      <Text
        style={[
          strong ? styles.summaryStrong : styles.summaryText,
          { color: theme.text },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          strong ? styles.summaryStrong : styles.summaryText,
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
    paddingBottom: 44,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  headerKicker: {
    fontSize: 17,
    fontWeight: "800",
  },
  headerTitle: {
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 37,
  },
  items: {
    gap: 12,
  },
  checkoutItem: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 10,
    flexDirection: "row",
    gap: 14,
    shadowColor: "#6F3328",
    shadowOpacity: 0.09,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  checkoutImageTile: {
    width: 98,
    minHeight: 108,
    borderRadius: 18,
    overflow: "hidden",
  },
  checkoutImage: {
    height: "100%",
    width: "100%",
  },
  checkoutTitle: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 21,
  },
  checkoutPrice: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 10,
  },
  notice: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 8,
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  copy: {
    fontSize: 13,
    lineHeight: 19,
  },
  summary: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "700",
  },
  summaryStrong: {
    fontSize: 18,
    fontWeight: "900",
  },
});
