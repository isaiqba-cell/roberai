import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton, SectionHeader } from "../../components/primitives";
import { KnownGoodItemCard } from "../../features/onboarding/KnownGoodItemCard";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function GarmentReferenceScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const knownGoodItems = useDemoStore((state) => state.knownGoodItems);
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <SectionHeader kicker="Alternative path" title="Use a garment you love" />
      <Text style={[styles.copy, { color: theme.textMuted }]}>
        Rober can start with a favorite garment and calibrate from there. The seeded demo includes a favorite overshirt and regular jeans.
      </Text>
      <View style={styles.list}>
        {knownGoodItems.map((item) => (
          <KnownGoodItemCard key={item.id} item={item} />
        ))}
      </View>
      <AppButton onPress={() => router.push("/(onboarding)/style-quiz")}>Continue with closet memory</AppButton>
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
    gap: 18
  },
  copy: {
    fontSize: 14,
    lineHeight: 21
  },
  list: {
    gap: 12
  }
});
