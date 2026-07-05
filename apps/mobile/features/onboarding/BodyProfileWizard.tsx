import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { ArrowRight } from "lucide-react-native";
import { FitPreference } from "@rober/fit-engine";
import { AppButton, Chip, SectionHeader } from "../../components/primitives";
import { MeasurementPrivacyNotice } from "./MeasurementPrivacyNotice";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

const fitPreferences: FitPreference[] = [
  "slim",
  "regular",
  "relaxed",
  "oversized",
];
const primaryFields = [
  { key: "waistCm", label: "Waist", min: 50, max: 160 },
  { key: "hipCm", label: "Hip", min: 60, max: 170 },
  { key: "inseamCm", label: "Inseam", min: 40, max: 110 },
] as const;
const optionalFields = [
  { key: "heightCm", label: "Height", min: 120, max: 230 },
  { key: "chestCm", label: "Chest", min: 60, max: 160 },
  { key: "shoulderCm", label: "Shoulder", min: 30, max: 70 },
] as const;

type MeasurementKey =
  | (typeof primaryFields)[number]["key"]
  | (typeof optionalFields)[number]["key"];
type Unit = "cm" | "in";

export function BodyProfileWizard() {
  const theme = useThemeTokens();
  const router = useRouter();
  const bodyProfile = useDemoStore((state) => state.bodyProfile);
  const updateBodyProfile = useDemoStore((state) => state.updateBodyProfile);
  const completeOnboarding = useDemoStore((state) => state.completeOnboarding);
  const [unit, setUnit] = useState<Unit>("cm");
  const [values, setValues] = useState<Record<MeasurementKey, number>>({
    waistCm: bodyProfile.waistCm ?? 77,
    hipCm: bodyProfile.hipCm ?? 102,
    inseamCm: bodyProfile.inseamCm ?? 81,
    heightCm: bodyProfile.heightCm ?? 178,
    chestCm: bodyProfile.chestCm ?? 101,
    shoulderCm: bodyProfile.shoulderCm ?? 46,
  });
  const [fitPreference, setFitPreference] = useState<FitPreference>(
    bodyProfile.fitPreference,
  );

  const setValue = (key: MeasurementKey, value: number) => {
    setValues((current) => ({ ...current, [key]: Math.round(value) }));
  };

  const saveProfile = () => {
    updateBodyProfile({
      heightCm: values.heightCm,
      chestCm: values.chestCm,
      waistCm: values.waistCm,
      hipCm: values.hipCm,
      inseamCm: values.inseamCm,
      shoulderCm: values.shoulderCm,
      fitPreference,
    });
    completeOnboarding();
    router.push("/(tabs)/home");
  };

  return (
    <View style={styles.wrap}>
      <SectionHeader kicker="Manual path" title="Enter measurements" />
      <MeasurementPrivacyNotice />
      <View
        style={[
          styles.unitToggle,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {(["cm", "in"] as const).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: unit === option }}
            onPress={() => setUnit(option)}
            style={[
              styles.unitButton,
              { backgroundColor: unit === option ? theme.ink : "transparent" },
            ]}
          >
            <Text
              style={[
                styles.unitText,
                { color: unit === option ? "#FFFFFF" : theme.text },
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <MeasurementIllustration />

      <Text style={[styles.groupTitle, { color: theme.text }]}>
        Required for jeans
      </Text>
      <View style={styles.measurements}>
        {primaryFields.map((field) => (
          <MeasurementStepper
            key={field.key}
            label={field.label}
            unit={unit}
            valueCm={values[field.key]}
            min={field.min}
            max={field.max}
            onChange={(value) => setValue(field.key, value)}
          />
        ))}
      </View>

      <Text style={[styles.groupTitle, { color: theme.text }]}>
        Optional — improves accuracy later
      </Text>
      <View style={styles.measurements}>
        {optionalFields.map((field) => (
          <MeasurementStepper
            key={field.key}
            label={field.label}
            unit={unit}
            valueCm={values[field.key]}
            min={field.min}
            max={field.max}
            onChange={(value) => setValue(field.key, value)}
          />
        ))}
      </View>

      <View
        style={[
          styles.referenceCard,
          { backgroundColor: theme.bgWarm, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.referenceTitle, { color: theme.text }]}>
          Prefer not to measure?
        </Text>
        <Text style={[styles.referenceCopy, { color: theme.textMuted }]}>
          Tell us your favorite pair instead - we'll estimate the rest.
        </Text>
        <Link href="/(onboarding)/garment-reference" asChild>
          <Pressable accessibilityRole="button">
            <Text style={[styles.referenceLink, { color: theme.accent }]}>
              Add favorite jeans
            </Text>
          </Pressable>
        </Link>
      </View>

      <Text style={[styles.groupTitle, { color: theme.text }]}>
        Preferred silhouette
      </Text>
      <View style={styles.fitRow}>
        {fitPreferences.map((preference) => (
          <Chip
            key={preference}
            label={preference}
            selected={fitPreference === preference}
            onPress={() => setFitPreference(preference)}
          />
        ))}
      </View>
      <AppButton icon={<ArrowRight size={18} color="#FFFFFF" />} onPress={saveProfile}>
        Build my recommendations
      </AppButton>
    </View>
  );
}

function MeasurementStepper({
  label,
  valueCm,
  unit,
  min,
  max,
  onChange,
}: {
  label: string;
  valueCm: number;
  unit: Unit;
  min: number;
  max: number;
  onChange: (valueCm: number) => void;
}) {
  const theme = useThemeTokens();
  const displayValue = unit === "cm" ? valueCm : valueCm / 2.54;
  const stepCm = unit === "cm" ? 1 : 2.54;
  return (
    <View
      style={[
        styles.stepperRow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.measureLabel, { color: theme.text }]}>
          {label}
        </Text>
        <Text style={[styles.measureHint, { color: theme.textMuted }]}>
          {unit === "cm" ? "centimeters" : "inches"}
        </Text>
      </View>
      <View style={styles.stepperControls}>
        <RoundControl
          label={`Decrease ${label}`}
          onPress={() => onChange(Math.max(min, valueCm - stepCm))}
        >
          -
        </RoundControl>
        <Text style={[styles.valueText, { color: theme.text }]}>
          {unit === "cm" ? Math.round(displayValue) : displayValue.toFixed(1)}
        </Text>
        <RoundControl
          label={`Increase ${label}`}
          onPress={() => onChange(Math.min(max, valueCm + stepCm))}
        >
          +
        </RoundControl>
      </View>
    </View>
  );
}

function RoundControl({
  label,
  children,
  onPress,
}: {
  label: string;
  children: string;
  onPress: () => void;
}) {
  const theme = useThemeTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.roundControl, { borderColor: theme.border }]}
    >
      <Text style={[styles.roundText, { color: theme.text }]}>{children}</Text>
    </Pressable>
  );
}

function MeasurementIllustration() {
  const theme = useThemeTokens();
  return (
    <View
      style={[
        styles.illustration,
        { backgroundColor: theme.surfaceWarm, borderColor: theme.border },
      ]}
    >
      <Svg width="100%" height="170" viewBox="0 0 320 170">
        <Circle cx="160" cy="32" r="16" fill="none" stroke={theme.text} strokeWidth="5" />
        <Path
          d="M128 67 C137 52 183 52 192 67 L204 135 C188 145 132 145 116 135 Z"
          fill="none"
          stroke={theme.text}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <Line x1="112" y1="92" x2="208" y2="92" stroke={theme.accent} strokeWidth="5" strokeLinecap="round" />
        <Line x1="120" y1="120" x2="200" y2="120" stroke={theme.accent} strokeWidth="5" strokeLinecap="round" />
        <Line x1="162" y1="138" x2="162" y2="160" stroke={theme.accent} strokeWidth="5" strokeLinecap="round" />
        <SvgText x="214" y="95" fill={theme.textMuted} fontSize="12" fontWeight="700">
          waist
        </SvgText>
        <SvgText x="206" y="124" fill={theme.textMuted} fontSize="12" fontWeight="700">
          hip
        </SvgText>
        <SvgText x="170" y="160" fill={theme.textMuted} fontSize="12" fontWeight="700">
          inseam
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
  },
  unitToggle: {
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
    flexDirection: "row",
  },
  unitButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  unitText: {
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  illustration: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  measurements: {
    gap: 10,
  },
  stepperRow: {
    minHeight: 74,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  measureLabel: {
    fontSize: 16,
    fontWeight: "900",
  },
  measureHint: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  roundControl: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  roundText: {
    fontSize: 20,
    fontWeight: "900",
  },
  valueText: {
    minWidth: 46,
    textAlign: "center",
    fontSize: 21,
    fontWeight: "900",
  },
  referenceCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 8,
  },
  referenceTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  referenceCopy: {
    fontSize: 13,
    lineHeight: 19,
  },
  referenceLink: {
    fontSize: 14,
    fontWeight: "900",
  },
  fitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});
