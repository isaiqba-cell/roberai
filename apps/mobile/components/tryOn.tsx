import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { BodyProfile } from "@rober/fit-engine";
import { useThemeTokens } from "../theme/useThemeTokens";

// Instant, no-network-dependency fallback for when a photoreal try-on render
// is pending, failed, or the user hasn't opted into photo upload at all.
// Silhouette proportions are driven by whatever body-profile measurements
// already exist (falls back to reasonable averages when they don't), so
// it's a graceful-degradation path rather than a generic placeholder.
export function StylizedAvatar({ bodyProfile }: { bodyProfile?: BodyProfile }) {
  const theme = useThemeTokens();
  const waistCm = bodyProfile?.waistCm ?? 84;
  const hipCm = bodyProfile?.hipCm ?? 100;
  const inseamCm = bodyProfile?.inseamCm ?? 81;

  // Map real-world cm to SVG units around a 320x420 canvas. Clamp so
  // extreme/missing values never distort the illustration into something
  // broken-looking.
  const legWidth = clamp((hipCm - 80) * 0.6 + 34, 26, 54);
  const legLength = clamp((inseamCm - 70) * 1.6 + 190, 150, 230);
  const waistWidth = clamp((waistCm - 70) * 0.7 + 40, 32, 66);
  const hipTop = 168;
  const legTop = hipTop + 34;
  const legBottom = legTop + legLength;

  return (
    <View
      style={[styles.wrap, { backgroundColor: theme.surfaceWarm, borderColor: theme.border }]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 320 420" preserveAspectRatio="xMidYMid meet">
        <Circle cx="160" cy="58" r="30" fill="none" stroke={theme.text} strokeWidth="6" />
        <Path
          d={`M${160 - waistWidth / 2} 96 C${160 - waistWidth / 2 - 10} 120 ${160 - waistWidth / 2 - 10} 150 ${160 - waistWidth / 2} ${hipTop} L${160 + waistWidth / 2} ${hipTop} C${160 + waistWidth / 2 + 10} 150 ${160 + waistWidth / 2 + 10} 120 ${160 + waistWidth / 2} 96 Z`}
          fill="none"
          stroke={theme.text}
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <Rect
          x={160 - waistWidth / 2 - 6}
          y={hipTop - 6}
          width={waistWidth + 12}
          height={legTop - hipTop + 6}
          rx="14"
          fill={theme.accent}
          opacity={0.85}
        />
        <Rect
          x={160 - legWidth - 6}
          y={legTop}
          width={legWidth}
          height={legBottom - legTop}
          rx="12"
          fill={theme.accent}
          opacity={0.85}
        />
        <Rect
          x={160 + 6}
          y={legTop}
          width={legWidth}
          height={legBottom - legTop}
          rx="12"
          fill={theme.accent}
          opacity={0.85}
        />
      </Svg>
      <Text style={[styles.caption, { color: theme.textMuted }]}>Stylized preview</Text>
    </View>
  );
}

export function TryOnSkeleton() {
  const theme = useThemeTokens();
  return (
    <View
      style={[styles.wrap, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}
      accessibilityLabel="Generating your try-on render"
    >
      <View style={[styles.skeletonBlock, { backgroundColor: theme.surfaceWarm }]} />
      <Text style={[styles.caption, { color: theme.textMuted }]}>Generating try-on...</Text>
    </View>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 8,
  },
  skeletonBlock: {
    width: "70%",
    height: "70%",
    borderRadius: 12,
  },
  caption: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
