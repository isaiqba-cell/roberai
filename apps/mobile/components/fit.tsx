import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Minus, Plus } from "lucide-react-native";
import { FitDescriptor } from "@rober/fit-engine";
import { IconButton } from "./primitives";
import { useThemeTokens } from "../theme/useThemeTokens";

export function getFitBand(confidence: number) {
  if (confidence >= 85) {
    return { label: "Great fit", color: "#2F9E64" };
  }
  if (confidence >= 60) {
    return { label: "Good fit - check notes", color: "#E0A526" };
  }
  return { label: "Uncertain - see alternatives", color: "#D94F4F" };
}

export function FitConfidenceBadge({ confidence }: { confidence: number }) {
  const band = getFitBand(confidence);
  return (
    <View style={[styles.badge, { backgroundColor: band.color }]}>
      <Text style={styles.badgeText}>
        {confidence}% {band.label}
      </Text>
    </View>
  );
}

export function FitScorePill({ confidence }: { confidence: number }) {
  const band = getFitBand(confidence);
  return (
    <View style={[styles.pill, { borderColor: band.color }]}>
      <Text style={[styles.pillText, { color: band.color }]}>
        {confidence}% fit
      </Text>
    </View>
  );
}

export function FitConfidenceRing({
  confidence,
  size = 76,
}: {
  confidence: number;
  size?: number;
}) {
  const theme = useThemeTokens();
  const band = getFitBand(confidence);
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence / 100) * circumference;

  return (
    <View
      style={{
        height: size,
        width: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg height={size} width={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.border}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={band.color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[styles.ringValue, { color: theme.text }]}>
        {confidence}
      </Text>
      <Text style={[styles.ringLabel, { color: theme.textMuted }]}>fit</Text>
    </View>
  );
}

export function RecommendedSizeCard({
  sizeLabel,
  confidence,
  children,
}: {
  sizeLabel: string;
  confidence: number;
  children?: ReactNode;
}) {
  const theme = useThemeTokens();
  return (
    <View
      style={[
        styles.recommendedCard,
        { backgroundColor: theme.surfaceWarm, borderColor: theme.border },
      ]}
    >
      <View>
        <Text style={[styles.recommendedKicker, { color: theme.accent }]}>
          Recommended size
        </Text>
        <Text style={[styles.recommendedSize, { color: theme.text }]}>
          {sizeLabel}
        </Text>
      </View>
      <FitConfidenceRing confidence={confidence} />
      {children}
    </View>
  );
}

export function FitExplanationCard({ lines }: { lines: string[] }) {
  const theme = useThemeTokens();
  return (
    <View
      style={[
        styles.explainCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.explainTitle, { color: theme.text }]}>
        Why this fits you
      </Text>
      {lines.map((line) => (
        <Text
          key={line}
          style={[styles.explainLine, { color: theme.textMuted }]}
        >
          - {line}
        </Text>
      ))}
    </View>
  );
}

export function FitDimensionBreakdown({
  scores,
}: {
  scores: Record<string, number>;
}) {
  const theme = useThemeTokens();
  return (
    <View style={styles.dimensionList}>
      {Object.entries(scores).map(([name, score]) => (
        <View key={name} style={styles.dimensionRow}>
          <Text style={[styles.dimensionName, { color: theme.text }]}>
            {name}
          </Text>
          <View
            style={[styles.dimensionTrack, { backgroundColor: theme.border }]}
          >
            <View
              style={[
                styles.dimensionFill,
                {
                  width: `${Math.max(4, score)}%`,
                  backgroundColor: getFitBand(score).color,
                },
              ]}
            />
          </View>
          <Text style={[styles.dimensionValue, { color: theme.textMuted }]}>
            {Math.round(score)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function SizeChipWithFitScore({
  size,
  confidence,
  selected,
  onPress,
}: {
  size: string;
  confidence: number;
  selected?: boolean;
  onPress?: () => void;
}) {
  const theme = useThemeTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      accessibilityLabel={`Size ${size}, ${confidence} percent fit confidence`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.sizeChip,
        {
          backgroundColor: selected ? theme.ink : theme.surface,
          borderColor: selected ? theme.ink : getFitBand(confidence).color,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <Text
        style={[styles.sizeText, { color: selected ? "#FFFFFF" : theme.text }]}
      >
        {size}
      </Text>
      <Text
        style={[
          styles.sizeScore,
          { color: selected ? "#FFFFFF" : getFitBand(confidence).color },
        ]}
      >
        {confidence}%
      </Text>
    </Pressable>
  );
}

export function SimilarToFavoriteItemChip({ label }: { label: string }) {
  const theme = useThemeTokens();
  return (
    <View
      style={[
        styles.favoriteChip,
        { backgroundColor: theme.bgWarm, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.favoriteChipText, { color: theme.text }]}>
        Like {label}
      </Text>
    </View>
  );
}

export function FabricStretchNote({ stretchPct }: { stretchPct: number }) {
  const theme = useThemeTokens();
  return (
    <Text style={[styles.noteText, { color: theme.textMuted }]}>
      Fabric stretch adds about {stretchPct}% tolerance.
    </Text>
  );
}

export function SilhouetteNote({ cut }: { cut: string }) {
  const theme = useThemeTokens();
  return (
    <Text style={[styles.noteText, { color: theme.textMuted }]}>
      Silhouette: {cut}, calibrated against your fit preference.
    </Text>
  );
}

export function LowConfidenceAlternativesPrompt() {
  const theme = useThemeTokens();
  return (
    <View
      style={[
        styles.lowPrompt,
        { backgroundColor: theme.surfaceWarm, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.lowPromptText, { color: theme.text }]}>
        Confidence is low. Rober will surface nearby cuts and brands with better
        data.
      </Text>
    </View>
  );
}

export function FitSpectrumSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const theme = useThemeTokens();
  const left = Math.max(0, Math.min(100, value));
  return (
    <View
      style={[
        styles.sliderCard,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, { color: theme.text }]}>
          Skinnier
        </Text>
        <Text style={[styles.sliderValue, { color: theme.accent }]}>
          {value}
        </Text>
        <Text style={[styles.sliderLabel, { color: theme.text }]}>Baggier</Text>
      </View>
      <View style={[styles.sliderTrack, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.sliderFill,
            { width: `${left}%`, backgroundColor: theme.accent },
          ]}
        />
      </View>
      <View style={styles.sliderButtons}>
        <IconButton
          accessibilityLabel="Prefer a skinnier fit"
          onPress={() => onChange(Math.max(0, value - 10))}
        >
          <Minus size={18} color={theme.text} />
        </IconButton>
        <IconButton
          accessibilityLabel="Prefer a baggier fit"
          onPress={() => onChange(Math.min(100, value + 10))}
        >
          <Plus size={18} color={theme.text} />
        </IconButton>
      </View>
    </View>
  );
}

export function descriptorToCopy(descriptor: FitDescriptor) {
  return descriptor.replaceAll("_", " ");
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    minHeight: 28,
    justifyContent: "center",
  },
  pillText: {
    fontSize: 12,
    fontWeight: "900",
  },
  ringValue: {
    fontSize: 22,
    fontWeight: "900",
  },
  ringLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  recommendedCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  recommendedKicker: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  recommendedSize: {
    fontSize: 42,
    fontWeight: "900",
  },
  explainCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  explainTitle: {
    fontSize: 17,
    fontWeight: "900",
  },
  explainLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  dimensionList: {
    gap: 12,
  },
  dimensionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dimensionName: {
    width: 72,
    textTransform: "capitalize",
    fontWeight: "800",
  },
  dimensionTrack: {
    height: 8,
    borderRadius: 999,
    flex: 1,
    overflow: "hidden",
  },
  dimensionFill: {
    height: "100%",
    borderRadius: 999,
  },
  dimensionValue: {
    width: 34,
    textAlign: "right",
    fontWeight: "800",
  },
  sizeChip: {
    minHeight: 54,
    minWidth: 72,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeText: {
    fontSize: 16,
    fontWeight: "900",
  },
  sizeScore: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  favoriteChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 32,
    justifyContent: "center",
  },
  favoriteChipText: {
    fontSize: 12,
    fontWeight: "800",
  },
  noteText: {
    fontSize: 13,
    lineHeight: 19,
  },
  lowPrompt: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  lowPromptText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  sliderCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: "900",
  },
  sliderTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
  },
  sliderButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
