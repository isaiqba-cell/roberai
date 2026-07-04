import { ScrollView, StyleSheet } from "react-native";
import { EmptyState, SectionHeader } from "../../components/primitives";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function WishlistScreen() {
  const theme = useThemeTokens();
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <SectionHeader kicker="Saved" title="Wishlist" />
      <EmptyState
        title="Saved with fit memory"
        body="Saved products will show price drops, recommended sizes, and whether confidence improved after profile updates."
      />
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
    paddingBottom: 120
  }
});
