import { ReactNode } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Database, Ruler, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getJeansIndexStats } from "@rober/api-client";
import { IconButton } from "../../components/primitives";
import { Reveal } from "../../components/motion";
import { useThemeTokens } from "../../theme/useThemeTokens";

const indexStats = getJeansIndexStats();

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
            Your denim fit index
          </Text>
        </View>
        <IconButton
          accessibilityLabel="Browse the jeans fit index"
          onPress={() => router.push("/discover")}
        >
          <Database size={21} color={theme.text} />
        </IconButton>
      </View>

      <Reveal delay={70}>
        <View
          style={[
            styles.hero,
            { backgroundColor: theme.bgWarm, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.kicker, { color: theme.accent }]}>
            START WITH WHAT ALREADY FITS
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            What's your favorite pair of jeans?
          </Text>
          <Text style={[styles.copy, { color: theme.textMuted }]}>
            Add the brand, style, and size. Rober turns that pair into a fit
            reference for the entire index.
          </Text>
          <View style={styles.indexProof}>
            <Text style={[styles.indexProofText, { color: theme.text }]}>
              {indexStats.productStyles} jean styles
            </Text>
            <View style={[styles.proofDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.indexProofText, { color: theme.text }]}>
              {formatCompact(indexStats.fitReadyVariants)} size options
            </Text>
          </View>
        </View>
      </Reveal>

      <Reveal delay={130}>
        <View style={styles.pathGrid}>
          <PathCard
            title="Add my favorite jeans"
            body="Brand, model, and size are enough to create your fit passport."
            icon={<Sparkles size={22} color="#FFFFFF" />}
            primary
            onPress={() => router.push("/(onboarding)/garment-reference")}
          />
          <PathCard
            title="I don't have a reference pair"
            body="Build a fit starting from waist, hip, and inseam instead."
            icon={<Ruler size={21} color={theme.accent} />}
            onPress={() => router.push("/(onboarding)/body-profile")}
          />
        </View>
      </Reveal>
    </ScrollView>
  );
}

function PathCard({
  title,
  body,
  icon,
  primary,
  onPress,
}: {
  title: string;
  body: string;
  icon: ReactNode;
  primary?: boolean;
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
          backgroundColor: primary ? theme.ink : theme.surface,
          borderColor: primary ? theme.ink : theme.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconBubble,
          { backgroundColor: primary ? theme.accent : theme.surfaceWarm },
        ]}
      >
        {icon}
      </View>
      <Text style={[styles.pathTitle, { color: primary ? "#FFFFFF" : theme.text }]}>{title}</Text>
      <Text style={[styles.pathCopy, { color: primary ? "rgba(255,255,255,0.76)" : theme.textMuted }]}>{body}</Text>
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
  indexProof: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 2,
  },
  indexProofText: {
    fontSize: 11,
    fontWeight: "900",
  },
  proofDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
  },
  pathGrid: {
    gap: 14,
  },
  pathCard: {
    minHeight: 138,
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

function formatCompact(value: number) {
  return value < 1000 ? String(value) : `${(value / 1000).toFixed(1)}k`;
}
