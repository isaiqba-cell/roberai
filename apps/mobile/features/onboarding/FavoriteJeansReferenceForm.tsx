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
} from "@rober/api-client";
import { AppButton, Chip } from "../../components/primitives";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

const fitNotes = [
  "Fits true to size",
  "Runs a little small",
  "Runs a little big",
];

export function FavoriteJeansReferenceForm() {
  const theme = useThemeTokens();
  const router = useRouter();
  const updateBodyProfile = useDemoStore((state) => state.updateBodyProfile);
  const addKnownGoodItem = useDemoStore((state) => state.addKnownGoodItem);
  const completeOnboarding = useDemoStore((state) => state.completeOnboarding);
  const [brandQuery, setBrandQuery] = useState(jeansBrands[0]?.name ?? "");
  const [brandSlug, setBrandSlug] = useState(jeansBrands[0]?.slug ?? "");
  const [sizeLabel, setSizeLabel] = useState("29x32");
  const [fitNote, setFitNote] = useState(fitNotes[0] ?? "Fits true to size");
  const [estimate, setEstimate] = useState<{
    waistCm: number;
    hipCm: number;
    inseamCm: number;
    brandName: string;
    baseSizeLabel: string;
  }>();
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
  const matches = estimate
    ? findJeansFitMatches({
        brandSlug,
        sizeLabel,
      }).slice(0, 3)
    : [];

  const submitReference = () => {
    if (!exactEntry) {
      return;
    }
    const favorite = resolveFavoriteJeans({ brandSlug, sizeLabel });
    setEstimate({
      waistCm: favorite.waistCm,
      hipCm: favorite.hipCm,
      inseamCm: favorite.inseamCm,
      brandName: favorite.brandName,
      baseSizeLabel: `${favorite.sizeLabel}x${Math.round(favorite.inseamCm / 2.54)}`,
    });
  };

  const saveBaseline = () => {
    if (!estimate) {
      return;
    }
    updateBodyProfile({
      waistCm: estimate.waistCm,
      hipCm: estimate.hipCm,
      inseamCm: estimate.inseamCm,
      fitPreference: fitNote === "Runs a little small" ? "relaxed" : "regular",
    });
    addKnownGoodItem({
      id: `known-jeans-${brandSlug}-${parsedSize.sizeLabel}`,
      brand: estimate.brandName,
      category: "bottoms",
      itemName: "straight jeans",
      sizeLabel: estimate.baseSizeLabel,
      fitNotes: fitNote,
      measurements: {
        waistCm: estimate.waistCm,
        hipCm: estimate.hipCm,
        inseamCm: estimate.inseamCm,
      },
    });
    completeOnboarding();
    router.push("/(tabs)/home");
  };

  if (estimate) {
    return (
      <View style={styles.wrap}>
        <View
          style={[
            styles.estimateCard,
            { backgroundColor: theme.bgWarm, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.kicker, { color: theme.accent }]}>
            ESTIMATED FROM YOUR JEANS
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Here's what we estimated.
          </Text>
          <Text style={[styles.copy, { color: theme.textMuted }]}>
            Adjust anything that's off, then Rober can recommend matching
            jeans across brands.
          </Text>
        </View>
        <EditableMetric
          label="Waist"
          value={estimate.waistCm}
          onChange={(value) => setEstimate({ ...estimate, waistCm: value })}
        />
        <EditableMetric
          label="Hip"
          value={estimate.hipCm}
          onChange={(value) => setEstimate({ ...estimate, hipCm: value })}
        />
        <EditableMetric
          label="Inseam"
          value={estimate.inseamCm}
          onChange={(value) => setEstimate({ ...estimate, inseamCm: value })}
        />
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
            Pick an indexed brand and size so we can estimate your baseline.
          </Text>
        ) : null}

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
        disabled={!exactEntry}
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
