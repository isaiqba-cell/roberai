import { Link } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { AddressCard, AppButton, EmptyState, PromoCodeRow, SectionHeader } from "../../components/primitives";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function CartScreen() {
  const theme = useThemeTokens();
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <SectionHeader kicker="Bag" title="Cart" />
      <EmptyState title="Your demo bag is ready soon" body="The commerce phase wires cart items, fit confidence at add-to-cart, totals, and test checkout." />
      <PromoCodeRow />
      <AddressCard compact />
      <Link href="/checkout" asChild>
        <AppButton>Continue to checkout</AppButton>
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
    paddingTop: 64,
    paddingBottom: 120,
    gap: 16
  }
});
