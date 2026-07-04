import { StyleSheet, Text, View } from "react-native";
import { KnownGoodItem } from "../../stores/useDemoStore";
import { SimilarToFavoriteItemChip } from "../../components/fit";
import { useThemeTokens } from "../../theme/useThemeTokens";

export function KnownGoodItemCard({ item }: { item: KnownGoodItem }) {
  const theme = useThemeTokens();
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.brand, { color: theme.textMuted }]}>{item.brand}</Text>
      <Text style={[styles.title, { color: theme.text }]}>{item.itemName}</Text>
      <Text style={[styles.copy, { color: theme.textMuted }]}>
        Size {item.sizeLabel}. {item.fitNotes}
      </Text>
      <SimilarToFavoriteItemChip label={item.category} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 8
  },
  brand: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "900"
  },
  title: {
    fontSize: 18,
    fontWeight: "900"
  },
  copy: {
    fontSize: 13,
    lineHeight: 19
  }
});
