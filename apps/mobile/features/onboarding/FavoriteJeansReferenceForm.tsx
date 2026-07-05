import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowRight, Search } from "lucide-react-native";
import {
  findJeansFitMatches,
  jeansBrands,
  jeansSizeChartEntries,
  parseJeansSizeInput,
  resolveFavoriteJeans,
  resolveGarmentReference,
  type GarmentReferenceResolution,
} from "@rober/api-client";
import { AppButton, Chip } from "../../components/primitives";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

const fitNotes = [
  "Fits true to size",
  "Runs a little small",
  "Runs a little big",
];

const categories: Array<{ label: string; value: "jeans" | "chinos" | "pants" }> = [
  { label: "Jeans", value: "jeans" },
  { label: "Chinos", value: "chinos" },
  { label: "Pants", value: "pants" },
];

export function FavoriteJeansReferenceForm() {
  const theme = useThemeTokens();
  const router = useRouter();
  const updateBodyProfile = useDemoStore((state) => state.updateBodyProfile);
  const addKnownGoodItem = useDemoStore((state) => state.addKnownGoodItem);
  const completeOnboarding = useDemoStore((state) => state.completeOnboarding);
  const [brandQuery, setBrandQuery] = useState(jeansBrands[0]?.name ?? "");
  const [brandSlug, setBrandSlug] = useState(jeansBrands[0]?.slug ?? "");
  const [modelName, setModelName] = useState("501");
  const [category, setCategory] = useState<"jeans" | "chinos" | "pants">("jeans");
  const [sizeLabel, setSizeLabel] = useState("29x32");
  const [fitNote, setFitNote] = useState(fitNotes[0] ?? "Fits true to size");
  const [resolution, setResolution] = useState<GarmentReferenceResolution>();
  const parsedSize = parseJeansSizeInput(sizeLabel);
  const exactEntry = jeansSizeChartEntries.find(
    (entry) =>
      entry.brandSlug === brandSlug && entry.sizeLabel === parsedSize.sizeLabel,
  );
  const brandMatches = useMemo(() => {
    const query = brandQuery.trim().toLowerCase();
    return jeansBrands
      .filter((brand) => !query || brand.name.toLowerCase().includes(query))
      .slice(0, 5);
  }, [brandQuery]);
  const matches = resolution
    ? findJeansFitMatches({
        brandSlug,
        sizeLabel,
      }).slice(0, 3)
    : [];

  const submitReference = () => {
    setResolution(resolveGarmentReference({ brandSlug, modelName, sizeLabel, category }));
  };

  const saveBaseline = () => {
    if (!resolution) {
      return;
    }
    const { spec } = resolution;
    const fullSizeLabel = spec.inseamCm
      ? `${resolution.sizeLabel}x${Math.round(spec.inseamCm / 2.54)}`
      : resolution.sizeLabel;
    updateBodyProfile({
      ...(spec.waistCm !== undefined ? { waistCm: spec.waistCm } : {}),
      ...(spec.inseamCm !== undefined ? { inseamCm: spec.inseamCm } : {}),
      fitPreference: fitNote === "Runs a little small" ? "relaxed" : "regular",
    });
    addKnownGoodItem({
      id: `known-jeans-${brandSlug}-${parsedSize.sizeLabel}`,
      brand: resolution.brandName,
      category: "bottoms",
      itemName: resolution.modelName,
      sizeLabel: fullSizeLabel,
      fitNotes: fitNote,
      measurements: {
        ...(spec.waistCm !== undefined ? { waistCm: spec.waistCm } : {}),
        ...(spec.inseamCm !== undefined ? { inseamCm: spec.inseamCm } : {}),
      },
      canonicalSpec: spec,
      resolvedFromCatalog: resolution.resolvedFromCatalog,
      matchPath: "garment_to_garment",
    });
    completeOnboarding();
    router.push("/(tabs)/home");
  };

  if (resolution) {
    const { spec } = resolution;
    return (
      <View style={styles.wrap}>
        <View
          style={[
            styles.estimateCard,
            { backgroundColor: theme.bgWarm, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.kicker, { color: theme.accent }]}>
            MATCHED FROM YOUR JEANS' CONSTRUCTION
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Here's your fit anchor.
          </Text>
          <Text style={[styles.copy, { color: theme.textMuted }]}>
            {resolution.resolvedFromCatalog
              ? `Waist, inseam, thigh, and rise pulled from ${resolution.brandName} ${resolution.modelName}'s own size chart. Rober compares this against every other brand's construction, not your body.`
              : "This brand/model/size combination isn't indexed yet, so we used a self-reported estimate. Flagged for review."}
          </Text>
        </View>
        <EditableMetric
          label="Waist"
          value={spec.waistCm ?? 0}
          onChange={(value) =>
            setResolution({ ...resolution, spec: { ...spec, waistCm: value } })
          }
        />
        <EditableMetric
          label="Inseam"
          value={spec.inseamCm ?? 0}
          onChange={(value) =>
            setResolution({ ...resolution, spec: { ...spec, inseamCm: value } })
          }
        />
        {spec.thighCm !== undefined && spec.riseCm !== undefined ? (
          <View
            style={[
              styles.matchCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.matchTitle, { color: theme.text }]}>
                Thigh {spec.thighCm}cm &middot; Rise {spec.riseCm}cm
              </Text>
              <Text style={[styles.copy, { color: theme.textMuted }]}>
                Construction measurements from the matched garment
              </Text>
            </View>
          </View>
        ) : null}
        <View style={styles.matchList}>
          {matches.map((match) => (
            <View
              key={`${match.productId}-${match.sizeToBuy}`}
              style={[
                styles.matchCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.matchTitle, { color: theme.text }]}>
                  {match.brandName} {match.sizeToBuy}
                </Text>
                <Text style={[styles.copy, { color: theme.textMuted }]}>
                  {(match.priceCents / 100).toLocaleString("en-US", {
                    currency: "USD",
                    style: "currency",
                  })}
                </Text>
              </View>
              <Text style={[styles.score, { color: theme.accent }]}>
                {match.fitScore}%
              </Text>
            </View>
          ))}
        </View>
        <AppButton icon={<ArrowRight size={18} color="#FFFFFF" />} onPress={saveBaseline}>
          Build my recommendations
        </AppButton>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.referenceCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.fieldLabel, { color: theme.text }]}>Brand</Text>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.surfaceRaised, borderColor: theme.border },
          ]}
        >
          <Search size={16} color={theme.textMuted} />
          <TextInput
            accessibilityLabel="Favorite jeans brand"
            value={brandQuery}
            onChangeText={setBrandQuery}
            placeholder="Search brand"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.text }]}
          />
        </View>
        <View style={styles.chips}>
          {brandMatches.map((brand) => (
            <Chip
              key={brand.slug}
              label={brand.name}
              selected={brand.slug === brandSlug}
              onPress={() => {
                setBrandSlug(brand.slug);
                setBrandQuery(brand.name);
              }}
            />
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.text }]}>
          Model / style name
        </Text>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.surfaceRaised, borderColor: theme.border },
          ]}
        >
          <TextInput
            accessibilityLabel="Favorite jeans model or style name"
            value={modelName}
            onChangeText={setModelName}
            placeholder="501, 505 Regular Straight"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.text }]}
          />
        </View>

        <Text style={[styles.fieldLabel, { color: theme.text }]}>Size</Text>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.surfaceRaised, borderColor: theme.border },
          ]}
        >
          <TextInput
            accessibilityLabel="Favorite jeans size"
            value={sizeLabel}
            onChangeText={setSizeLabel}
            placeholder="29x32, 10, M"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="characters"
            style={[styles.input, { color: theme.text }]}
          />
        </View>
        {!exactEntry ? (
          <Text style={[styles.error, { color: theme.fitLow }]}>
            Pick an indexed brand and size so we can match your garment's
            construction. Otherwise we'll fall back to a self-reported
            estimate.
          </Text>
        ) : null}

        <Text style={[styles.fieldLabel, { color: theme.text }]}>
          Category
        </Text>
        <View style={styles.chips}>
          {categories.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={category === option.value}
              onPress={() => setCategory(option.value)}
            />
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.text }]}>
          Fit note
        </Text>
        <View style={styles.chips}>
          {fitNotes.map((note) => (
            <Chip
              key={note}
              label={note}
              selected={fitNote === note}
              onPress={() => setFitNote(note)}
            />
          ))}
        </View>
      </View>
      <AppButton
        icon={<ArrowRight size={18} color="#FFFFFF" />}
        disabled={!brandSlug || !sizeLabel.trim()}
        onPress={submitReference}
      >
        Use this as my baseline
      </AppButton>
    </View>
  );
}

function EditableMetric({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const theme = useThemeTokens();
  return (
    <View
      style={[
        styles.metricRow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View>
        <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>cm</Text>
      </View>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          onPress={() => onChange(Math.max(30, value - 1))}
          style={[styles.stepperButton, { borderColor: theme.border }]}
        >
          <Text style={[styles.stepperSymbol, { color: theme.text }]}>-</Text>
        </Pressable>
        <Text style={[styles.metricValue, { color: theme.text }]}>
          {value}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          onPress={() => onChange(value + 1)}
          style={[styles.stepperButton, { borderColor: theme.border }]}
        >
          <Text style={[styles.stepperSymbol, { color: theme.text }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  referenceCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  estimateCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 8,
  },
  kicker: {
    fontFamily: "Courier",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32,
  },
  copy: {
    fontSize: 13,
    lineHeight: 19,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  searchBox: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  error: {
    fontSize: 12,
    fontWeight: "800",
  },
  metricRow: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperSymbol: {
    fontSize: 20,
    fontWeight: "900",
  },
  metricValue: {
    minWidth: 38,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "900",
  },
  matchList: {
    gap: 8,
  },
  matchCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
  score: {
    fontSize: 18,
    fontWeight: "900",
  },
});
