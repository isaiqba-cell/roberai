import { Control, Controller, FieldPath, useForm } from "react-hook-form";
import { z } from "zod";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { BodyProfile, FitPreference } from "@rober/fit-engine";
import { AppButton, Chip, SectionHeader } from "../../components/primitives";
import { MeasurementPrivacyNotice } from "./MeasurementPrivacyNotice";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

const fitPreferences: FitPreference[] = ["slim", "regular", "relaxed", "oversized"];

const bodyProfileSchema = z.object({
  heightCm: z.coerce.number().min(120).max(230),
  weightKg: z.coerce.number().min(35).max(180).optional(),
  chestCm: z.coerce.number().min(60).max(160).optional(),
  waistCm: z.coerce.number().min(50).max(160).optional(),
  hipCm: z.coerce.number().min(60).max(170).optional(),
  inseamCm: z.coerce.number().min(40).max(110).optional(),
  shoulderCm: z.coerce.number().min(30).max(70).optional(),
  shoeSizeUs: z.coerce.number().min(3).max(18).optional(),
  fitPreference: z.enum(["slim", "regular", "relaxed", "oversized"])
});

type BodyProfileForm = z.infer<typeof bodyProfileSchema>;

export function BodyProfileWizard() {
  const theme = useThemeTokens();
  const router = useRouter();
  const bodyProfile = useDemoStore((state) => state.bodyProfile);
  const updateBodyProfile = useDemoStore((state) => state.updateBodyProfile);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<BodyProfileForm>({
    defaultValues: bodyProfile
  });
  const selectedFit = watch("fitPreference");

  const onSubmit = (values: BodyProfileForm) => {
    const parsed = bodyProfileSchema.safeParse(values);
    if (!parsed.success) {
      return;
    }
    updateBodyProfile(compactBodyProfile(parsed.data));
    router.push("/(onboarding)/style-quiz");
  };

  return (
    <View style={styles.wrap}>
      <SectionHeader kicker="Step 1" title="Body profile" />
      <MeasurementPrivacyNotice />
      <View style={styles.grid}>
        <MeasurementInput control={control} name="heightCm" label="Height" suffix="cm" error={errors.heightCm?.message} />
        <MeasurementInput control={control} name="chestCm" label="Chest" suffix="cm" error={errors.chestCm?.message} />
        <MeasurementInput control={control} name="waistCm" label="Waist" suffix="cm" error={errors.waistCm?.message} />
        <MeasurementInput control={control} name="hipCm" label="Hip" suffix="cm" error={errors.hipCm?.message} />
        <MeasurementInput control={control} name="shoulderCm" label="Shoulder" suffix="cm" error={errors.shoulderCm?.message} />
        <MeasurementInput control={control} name="inseamCm" label="Inseam" suffix="cm" error={errors.inseamCm?.message} />
      </View>
      <View style={[styles.illustration, { backgroundColor: theme.surfaceWarm, borderColor: theme.border }]}>
        <Text style={[styles.illustrationTitle, { color: theme.text }]}>Guided measurement placeholder</Text>
        <Text style={[styles.illustrationCopy, { color: theme.textMuted }]}>
          In production this step can show camera/photo guidance. The MVP uses manual and garment-reference inputs for safe, repeatable demos.
        </Text>
      </View>
      <Text style={[styles.label, { color: theme.text }]}>Preferred silhouette</Text>
      <View style={styles.fitRow}>
        {fitPreferences.map((preference) => (
          <Chip
            key={preference}
            label={preference}
            selected={selectedFit === preference}
            onPress={() => setValue("fitPreference", preference)}
          />
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Use garment reference instead"
        onPress={() => router.push("/(onboarding)/garment-reference")}
      >
        <Text style={[styles.referenceLink, { color: theme.accent }]}>Use a garment you love instead</Text>
      </Pressable>
      <AppButton onPress={handleSubmit(onSubmit)}>Continue</AppButton>
    </View>
  );
}

function MeasurementInput({
  control,
  name,
  label,
  suffix,
  error
}: {
  control: Control<BodyProfileForm>;
  name: FieldPath<BodyProfileForm>;
  label: string;
  suffix: string;
  error: string | undefined;
}) {
  const theme = useThemeTokens();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur } }) => (
        <View style={styles.inputWrap}>
          <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
          <View style={[styles.inputShell, { borderColor: error ? theme.fitLow : theme.border, backgroundColor: theme.surface }]}>
            <TextInput
              accessibilityLabel={`${label} in ${suffix}`}
              keyboardType="numeric"
              onBlur={onBlur}
              onChangeText={(text) => onChange(text)}
              value={value === undefined ? "" : String(value)}
              placeholder="0"
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text }]}
            />
            <Text style={[styles.suffix, { color: theme.textMuted }]}>{suffix}</Text>
          </View>
          {error ? <Text style={[styles.error, { color: theme.fitLow }]}>Check value</Text> : null}
        </View>
      )}
    />
  );
}

function compactBodyProfile(values: BodyProfileForm): Partial<BodyProfile> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) as Partial<BodyProfile>;
}

const styles = StyleSheet.create({
  wrap: {
    gap: 18
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  inputWrap: {
    width: "47%",
    gap: 7
  },
  label: {
    fontSize: 13,
    fontWeight: "900"
  },
  inputShell: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center"
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800"
  },
  suffix: {
    fontSize: 12,
    fontWeight: "800"
  },
  error: {
    fontSize: 11,
    fontWeight: "800"
  },
  fitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  illustration: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 8
  },
  illustrationTitle: {
    fontSize: 17,
    fontWeight: "900"
  },
  illustrationCopy: {
    fontSize: 13,
    lineHeight: 20
  },
  referenceLink: {
    fontSize: 14,
    fontWeight: "900"
  }
});
