import { ScrollView, StyleSheet, View } from "react-native";
import { CategoryTile, Chip, EmptyState, SectionHeader } from "../../components/primitives";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function DiscoverScreen() {
  const theme = useThemeTokens();
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <SectionHeader kicker="Browse" title="Discover" />
      <View style={styles.categoryGrid}>
        <CategoryTile title="Men" subtitle="Utility, denim, knits" tone="men" />
        <CategoryTile title="Women" subtitle="Soft tailoring, dresses" tone="women" />
        <CategoryTile title="Kids" subtitle="Durable everyday fits" tone="kids" />
        <CategoryTile title="Access" subtitle="Shoes, bags, belts" tone="access" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {["All", "Sports", "Party", "Casual", "Best fit", "Wide feet", "Stretch", "Under $100"].map((chip, index) => (
          <Chip key={chip} label={chip} selected={index === 0} />
        ))}
      </ScrollView>
      <EmptyState
        title="Search data is loading next"
        body="The full seeded catalog, natural-language parsing, and FlashList result grid are added in the catalog phase."
      />
      <View style={{ height: 110 }} />
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
    gap: 22
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  chips: {
    gap: 10
  }
});
