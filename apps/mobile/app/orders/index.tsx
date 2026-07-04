import { ScrollView, StyleSheet, Text, View } from "react-native";
import { formatCurrency } from "@rober/api-client";
import { AppButton, SectionHeader } from "../../components/primitives";
import { FitScorePill } from "../../components/fit";
import { FitFeedback, useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

const feedbackOptions: { label: string; value: FitFeedback }[] = [
  { label: "Too small", value: "too_small" },
  { label: "True to size", value: "true_to_size" },
  { label: "Too large", value: "too_large" }
];

export default function OrdersScreen() {
  const theme = useThemeTokens();
  const orders = useDemoStore((state) => state.orders);
  const submitFitFeedback = useDemoStore((state) => state.submitFitFeedback);
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <SectionHeader kicker="History" title="Orders" />
      {orders.map((order) => (
        <View key={order.id} style={[styles.order, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={[styles.orderId, { color: theme.text }]}>{order.id}</Text>
              <Text style={[styles.meta, { color: theme.textMuted }]}>{new Date(order.createdAt).toLocaleDateString()} / {order.status}</Text>
            </View>
            <Text style={[styles.total, { color: theme.text }]}>{formatCurrency(order.totals.totalCents)}</Text>
          </View>
          {order.items.map((item) => (
            <View key={item.id} style={[styles.feedbackCard, { borderColor: theme.border }]}>
              <View style={styles.feedbackHeader}>
                <Text style={[styles.itemText, { color: theme.text }]}>Size {item.sizeLabel} / Qty {item.quantity}</Text>
                <FitScorePill confidence={item.fitConfidenceWhenAdded} />
              </View>
              <Text style={[styles.meta, { color: theme.textMuted }]}>Did it fit?</Text>
              <View style={styles.feedbackRow}>
                {feedbackOptions.map((option) => (
                  <AppButton
                    key={option.value}
                    variant={item.fitFeedback === option.value ? "primary" : "secondary"}
                    onPress={() => submitFitFeedback(item.id, option.value)}
                  >
                    {option.label}
                  </AppButton>
                ))}
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
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
  order: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 14
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  orderId: {
    fontSize: 16,
    fontWeight: "900"
  },
  meta: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  },
  total: {
    fontSize: 17,
    fontWeight: "900"
  },
  feedbackCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 10
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10
  },
  itemText: {
    fontSize: 14,
    fontWeight: "900"
  },
  feedbackRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  }
});
