import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CreditCard, Smartphone } from "lucide-react-native";
import { calculateCartTotals, formatCurrency } from "@rober/api-client";
import { AddressCard, AppButton, PromoCodeRow, SectionHeader } from "../../components/primitives";
import { presentDemoPaymentSheet } from "../../lib/stripe";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function CheckoutScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const cartItems = useDemoStore((state) => state.cartItems);
  const createOrderFromCart = useDemoStore((state) => state.createOrderFromCart);
  const totals = useMemo(() => calculateCartTotals(cartItems, "ROBERFIT"), [cartItems]);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <SectionHeader kicker="Checkout" title="Test payment" />
      <View style={[styles.notice, { backgroundColor: theme.surfaceWarm, borderColor: theme.border }]}>
        <Text style={[styles.noticeTitle, { color: theme.text }]}>Stripe test-mode fallback</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          No live payment keys are required. With real Stripe test keys, this same interface can initialize PaymentSheet. Test card: 4242 4242 4242 4242.
        </Text>
      </View>
      <AddressCard />
      <PromoCodeRow />
      <View style={[styles.paymentRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <CreditCard size={20} color={theme.text} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.paymentTitle, { color: theme.text }]}>Demo card ending 4242</Text>
          <Text style={[styles.copy, { color: theme.textMuted }]}>Apple Pay / Google Pay buttons are shown when native Stripe keys are configured.</Text>
        </View>
        <Smartphone size={20} color={theme.textMuted} />
      </View>
      <View style={[styles.summary, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <SummaryRow label="Subtotal" value={formatCurrency(totals.subtotalCents)} />
        <SummaryRow label="Promo" value={`-${formatCurrency(totals.discountCents)}`} />
        <SummaryRow label="Shipping" value={totals.shippingCents ? formatCurrency(totals.shippingCents) : "Free"} />
        <SummaryRow label="Total" value={formatCurrency(totals.totalCents)} strong />
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
        {loading ? "Authorizing..." : `Pay ${formatCurrency(totals.totalCents || 7020)}`}
      </AppButton>
    </ScrollView>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const theme = useThemeTokens();
  return (
    <View style={styles.summaryRow}>
      <Text style={[strong ? styles.summaryStrong : styles.summaryText, { color: theme.text }]}>{label}</Text>
      <Text style={[strong ? styles.summaryStrong : styles.summaryText, { color: theme.text }]}>{value}</Text>
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
    paddingBottom: 44,
    gap: 16
  },
  notice: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 8
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: "900"
  },
  copy: {
    fontSize: 13,
    lineHeight: 19
  },
  paymentRow: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "center"
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: "900"
  },
  summary: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "700"
  },
  summaryStrong: {
    fontSize: 18,
    fontWeight: "900"
  }
});
