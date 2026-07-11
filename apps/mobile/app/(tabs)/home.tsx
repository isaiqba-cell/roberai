import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ArrowRight, Bell, Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "../../components/primitives";
import { ProductCard } from "../../components/product";
import { Reveal } from "../../components/motion";
import { demoCatalog } from "../../lib/catalog";
import {
  computeGarmentMatches,
  diversifyGarmentMatches,
} from "../../lib/garmentCompare";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

// One idea per screen: you told us the pair that fits, here are the pairs
// to buy. Everything else (silhouette control, price, try-on) lives one tap
// away in Compare.
export default function HomeScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const favorite = useDemoStore((state) => state.knownGoodItems[0]);
  const anchorSpec = favorite?.canonicalSpec;

  const rankedMatches = useMemo(() => {
    if (!anchorSpec) {
      return [];
    }
    const catalog = favorite?.gender
      ? demoCatalog.filter(
          (product) =>
            product.gender === favorite.gender &&
            product.subcategory === "jeans",
        )
      : demoCatalog.filter((product) => product.subcategory === "jeans");
    return diversifyGarmentMatches(
      computeGarmentMatches(anchorSpec, catalog),
    ).filter((entry) => entry.product.brand.name !== favorite?.brand);
  }, [anchorSpec, favorite?.brand, favorite?.gender]);

  const matchCards = rankedMatches.slice(0, 6).map((entry) => entry.card);
  const topConfidence = rankedMatches[0]?.result.confidence;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bgCanvas }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 18,
          paddingBottom: insets.bottom + 132,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topbar}>
        <Text style={[styles.logo, { color: theme.text }]}>Rober</Text>
        <View style={styles.topActions}>
          <IconButton
            accessibilityLabel="Search jeans"
            onPress={() => router.push("/discover")}
          >
            <Search size={21} color={theme.text} />
          </IconButton>
          <IconButton
            accessibilityLabel="Notifications and order updates"
            onPress={() => router.push("/orders")}
          >
            <Bell size={20} color={theme.text} />
          </IconButton>
        </View>
      </View>

      <Reveal delay={60}>
        <View
          style={[
            styles.hero,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            {favorite ? "Your next pair is ready." : "Tell us the pair that fits."}
          </Text>
          <Text style={[styles.heroBody, { color: theme.textMuted }]}>
            {favorite
              ? `${rankedMatches.length} jeans matched to your ${favorite.brand} ${favorite.itemName}${topConfidence ? `, up to ${topConfidence}% fit` : ""}.`
              : "One favorite pair is enough — we match its exact construction across brands."}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={favorite ? "See your matches" : "Add your favorite pair"}
            onPress={() =>
              router.push(favorite ? "/compare" : "/(onboarding)/garment-reference")
            }
            style={({ pressed }) => [
              styles.primaryCta,
              { backgroundColor: theme.accent, opacity: pressed ? 0.82 : 1 },
            ]}
          >
            <Text style={styles.primaryCtaText}>
              {favorite ? "SEE YOUR MATCHES" : "ADD YOUR PAIR"}
            </Text>
            <ArrowRight size={17} color="#FFFFFF" />
          </Pressable>
          <View style={[styles.sizeRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.sizeRowText, { color: theme.text }]}>
              {favorite
                ? `${favorite.sizeLabel}  |  ${formatCut(anchorSpec?.cut)}  |  ${favorite.brand}`
                : "No reference pair yet"}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit fit profile"
              onPress={() => router.push("/profile")}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={[styles.sizeRowEdit, { color: theme.accent }]}>
                EDIT PROFILE
              </Text>
            </Pressable>
          </View>
        </View>
      </Reveal>

      {matchCards.length ? (
        <Reveal delay={130}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Your matches
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Browse all matches"
              onPress={() => router.push("/compare")}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={[styles.sectionAction, { color: theme.textMuted }]}>
                See all
              </Text>
            </Pressable>
          </View>
          <View style={styles.productGrid}>
            {matchCards.map((product) => (
              <View key={product.id} style={styles.productCell}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        </Reveal>
      ) : null}
    </ScrollView>
  );
}

function formatCut(value?: string) {
  if (!value) {
    return "Straight";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 20 },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { fontSize: 33, fontWeight: "900" },
  topActions: { flexDirection: "row", gap: 10 },
  hero: { borderWidth: 1, borderRadius: 24, padding: 20, gap: 12 },
  heroTitle: { fontSize: 26, fontWeight: "900", lineHeight: 31 },
  heroBody: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  primaryCta: {
    minHeight: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  primaryCtaText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  sizeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingTop: 13,
    marginTop: 2,
  },
  sizeRowText: { fontSize: 13, fontWeight: "800" },
  sizeRowEdit: { fontSize: 12, fontWeight: "900", letterSpacing: 0.4 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: "900" },
  sectionAction: { fontSize: 13, fontWeight: "800" },
  productGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  productCell: { width: "48%", flexGrow: 1 },
});
