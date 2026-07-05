import { ReactNode } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Database, Ruler, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconButton } from "../../components/primitives";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function WelcomeScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bgCanvas }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 34, paddingBottom: insets.bottom + 40 },
      ]}
    >
      <View style={styles.topbar}>
        <View>
          <Text style={[styles.logo, { color: theme.text }]}>Rober</Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>
            Jeans that fit like your favorite pair
          </Text>
        </View>
        <IconButton accessibilityLabel="Fit profile database">
          <Database size={21} color={theme.text} />
        </IconButton>
      </View>

      <View
        style={[
          styles.hero,
          { backgroundColor: theme.bgWarm, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.kicker, { color: theme.accent }]}>
          BUILD YOUR FIT PROFILE
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>
          How do you want to start?
        </Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          One path is enough. Add exact measurements or tell us the jeans you
          already love, then Rober can recommend your closest matching sizes.
        </Text>
      </View>

      <View style={styles.pathGrid}>
        <PathCard
          title="I have a favorite pair of jeans"
          body="Enter brand, size, and one fit note. We estimate waist, hip, and inseam from indexed size-chart data."
          icon={<Sparkles size={22} color={theme.accent} />}
          onPress={() => router.push("/(onboarding)/garment-reference")}
        />
        <PathCard
          title="I know my measurements"
          body="Use bigger stepper controls for waist, hip, and inseam. Height, chest, and shoulder stay optional."
          icon={<Ruler size={22} color={theme.accent} />}
          onPress={() => router.push("/(onboarding)/body-profile")}
        />
      </View>
    </ScrollView>
  );
}

function PathCard({
  title,
  body,
  icon,
  onPress,
}: {
  title: string;
  body: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  const theme = useThemeTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pathCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <View style={[styles.iconBubble, { backgroundColor: theme.surfaceWarm }]}>
        {icon}
      </View>
      <Text style={[styles.pathTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.pathCopy, { color: theme.textMuted }]}>{body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 18,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: 30,
    fontWeight: "900",
  },
  tagline: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
  },
  hero: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    gap: 10,
  },
  kicker: {
    fontFamily: "Courier",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 39,
  },
  copy: {
    fontSize: 14,
    lineHeight: 21,
  },
  pathGrid: {
    gap: 14,
  },
  pathCard: {
    minHeight: 172,
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    gap: 10,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pathTitle: {
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26,
  },
  pathCopy: {
    fontSize: 13,
    lineHeight: 19,
  },
});
