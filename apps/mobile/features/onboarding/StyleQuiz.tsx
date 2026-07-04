import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton, Chip, SectionHeader } from "../../components/primitives";
import { KnownGoodItemCard } from "./KnownGoodItemCard";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

const styleTags = ["utility", "minimal", "business casual", "denim", "soft tailoring", "athletic"];
const colors = ["clay", "olive", "cream", "black", "light blue", "forest"];
const materials = ["cotton", "denim", "linen", "wool", "stretch twill"];
const budgets = [
  { label: "Under $80", min: 20, max: 80 },
  { label: "$80-$160", min: 80, max: 160 },
  { label: "Investment", min: 160, max: 320 }
];

export function StyleQuiz() {
  const theme = useThemeTokens();
  const router = useRouter();
  const styleProfile = useDemoStore((state) => state.styleProfile);
  const knownGoodItems = useDemoStore((state) => state.knownGoodItems);
  const updateStyleProfile = useDemoStore((state) => state.updateStyleProfile);
  const completeOnboarding = useDemoStore((state) => state.completeOnboarding);

  const toggle = (key: "styleTags" | "colorPreferences" | "materialPreferences", value: string) => {
    const current = styleProfile[key];
    updateStyleProfile({
      [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    });
  };

  return (
    <View style={styles.wrap}>
      <SectionHeader kicker="Step 2" title="Style memory" />
      <Text style={[styles.copy, { color: theme.textMuted }]}>
        Pick what feels like you. These preferences blend with fit confidence so the feed is not ranked by price alone.
      </Text>
      <PreferenceBlock title="Style">
        {styleTags.map((tag) => (
          <Chip key={tag} label={tag} selected={styleProfile.styleTags.includes(tag)} onPress={() => toggle("styleTags", tag)} />
        ))}
      </PreferenceBlock>
      <PreferenceBlock title="Colors">
        {colors.map((color) => (
          <Chip
            key={color}
            label={color}
            selected={styleProfile.colorPreferences.includes(color)}
            onPress={() => toggle("colorPreferences", color)}
          />
        ))}
      </PreferenceBlock>
      <PreferenceBlock title="Materials">
        {materials.map((material) => (
          <Chip
            key={material}
            label={material}
            selected={styleProfile.materialPreferences.includes(material)}
            onPress={() => toggle("materialPreferences", material)}
          />
        ))}
      </PreferenceBlock>
      <PreferenceBlock title="Price comfort">
        {budgets.map((budget) => (
          <Chip
            key={budget.label}
            label={budget.label}
            selected={styleProfile.priceMin === budget.min && styleProfile.priceMax === budget.max}
            onPress={() =>
              updateStyleProfile({
                priceMin: budget.min,
                priceMax: budget.max,
                budgetLabel: budget.label
              })
            }
          />
        ))}
      </PreferenceBlock>
      <View style={styles.knownGood}>
        <SectionHeader kicker="Closet memory" title="Known-good items" />
        {knownGoodItems.map((item) => (
          <KnownGoodItemCard key={item.id} item={item} />
        ))}
      </View>
      <AppButton
        onPress={() => {
          completeOnboarding();
          router.push("/(onboarding)/finish");
        }}
      >
        Build my recommendations
      </AppButton>
    </View>
  );
}

function PreferenceBlock({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useThemeTokens();
  return (
    <View style={styles.block}>
      <Text style={[styles.blockTitle, { color: theme.text }]}>{title}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 18
  },
  copy: {
    fontSize: 14,
    lineHeight: 21
  },
  block: {
    gap: 10
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: "900"
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  knownGood: {
    gap: 12
  }
});
