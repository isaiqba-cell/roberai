import { Link, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import { formatCurrency } from "@rober/api-client";
import { AppButton, SectionHeader } from "../../components/primitives";
import { FitScorePill } from "../../components/fit";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function CheckoutSuccessScreen() {
  const theme = useThemeTokens();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const order = useDemoStore((state) => state.orders.find((item) => item.id === orderId) ?? state.orders[0]);
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <View style={[styles.success, { backgroundColor: theme.surfaceWarm, borderColor: theme.border }]}>
        <CheckCircle2 size={44} color={theme.fitHigh} />
        <Text style={[styles.title, { color: theme.text }]}>Order confirmed</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>Mock payment succeeded and fit confidence was stored at purchase.</Text>
      </View>
      {order ? (
        <View style={[styles.receipt, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SectionHeader kicker="Receipt" title={order.id.slice(-8)} />
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={[styles.itemText, { color: theme.text }]}>Size {item.sizeLabel} x {item.quantity}</Text>
              <FitScorePill confidence={item.fitConfidenceWhenAdded} />
            </View>
          ))}
          <Text style={[styles.total, { color: theme.text }]}>Total {formatCurrency(order.totals.totalCents)}</Text>
        </View>
      ) : null}
      <Link href="/orders" asChild>
        <AppButton>View orders</AppButton>
      </Link>
      <Link href="/(tabs)/home" asChild>
        <AppButton variant="secondary">Back home</AppButton>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    padding: 20,
    paddingTop: 72,
    gap: 18
  },
  success: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    gap: 12
  },
  title: {
    fontSize: 34,
    fontWeight: "900"
  },
  copy: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center"
  },
  receipt: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 12
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  itemText: {
    fontWeight: "900"
  },
  total: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "right"
  }
});
