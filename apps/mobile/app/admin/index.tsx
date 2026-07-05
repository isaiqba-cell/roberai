import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { normalizeRawSizeChartFallback } from "@rober/api-client";
import { AppButton, Chip, SectionHeader } from "../../components/primitives";
import { FitScorePill } from "../../components/fit";
import { demoBrands } from "../../lib/catalog";
import { useThemeTokens } from "../../theme/useThemeTokens";

const sampleChart = `S chest 34-37 in waist 28-31 in regular
M chest 38-40 in waist 32-34 in relaxed stretch
L chest 41-43 in waist 35-37 in relaxed stretch`;

export default function AdminScreen() {
  const theme = useThemeTokens();
  const [raw, setRaw] = useState(sampleChart);
  const [approved, setApproved] = useState<string[]>(["M"]);
  const entries = useMemo(() => normalizeRawSizeChartFallback(raw), [raw]);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <SectionHeader kicker="Protected" title="Admin ops" />
      <View style={[styles.banner, { backgroundColor: theme.surfaceWarm, borderColor: theme.border }]}>
        <Text style={[styles.bannerTitle, { color: theme.text }]}>Demo admin route</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          In production this route checks `user_roles` and writes through service-role edge functions. Demo mode keeps everything local.
        </Text>
      </View>

      <SectionHeader kicker="Ingestion" title="Raw size chart" />
      <TextInput
        accessibilityLabel="Raw size chart source"
        multiline
        value={raw}
        onChangeText={setRaw}
        style={[styles.textarea, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
      />
      <View style={styles.row}>
        <Chip label="Manual seed provider" selected />
        <Chip label="CSV provider" />
        <Chip label="Mock Shopify provider" />
      </View>

      <SectionHeader kicker="Review" title="Normalized entries" />
      {entries.map((entry) => {
        const isApproved = approved.includes(entry.sizeLabel);
        return (
          <View key={entry.sizeLabel} style={[styles.tableRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.size, { color: theme.text }]}>Size {entry.sizeLabel}</Text>
              <Text style={[styles.copy, { color: theme.textMuted }]}>
                Chest {entry.canonicalSpec.chestMinCm ?? "-"}-{entry.canonicalSpec.chestMaxCm ?? "-"} cm / Waist{" "}
                {entry.canonicalSpec.waistMinCm ?? "-"}-{entry.canonicalSpec.waistMaxCm ?? "-"} cm / {entry.canonicalSpec.cut}
              </Text>
              <Text style={[styles.note, { color: theme.textMuted }]}>{entry.sourceNotes}</Text>
            </View>
            <AppButton
              variant={isApproved ? "primary" : "secondary"}
              onPress={() =>
                setApproved((current) =>
                  current.includes(entry.sizeLabel)
                    ? current.filter((size) => size !== entry.sizeLabel)
                    : [entry.sizeLabel, ...current]
                )
              }
            >
              {isApproved ? "Approved" : "Approve"}
            </AppButton>
          </View>
        );
      })}

      <SectionHeader kicker="Inspect" title="Recommendation score" />
      <View style={[styles.inspector, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.size, { color: theme.text }]}>Marlow Denim straight jean / Variant 29x32</Text>
        <View style={styles.row}>
          <FitScorePill confidence={91} />
          <Chip label="style 88" selected />
          <Chip label="chart verified" selected />
        </View>
      </View>

      <SectionHeader kicker="Jobs" title="Import jobs" />
      {demoBrands.slice(0, 4).map((brand, index) => (
        <View key={brand.slug} style={[styles.job, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.size, { color: theme.text }]}>{brand.name}</Text>
          <Text style={[styles.copy, { color: theme.textMuted }]}>
            {index === 0 ? "completed" : index === 1 ? "pending review" : "mock provider ready"} / {brand.sizeChartConfidence}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: 44,
    gap: 16
  },
  banner: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 8
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "900"
  },
  copy: {
    fontSize: 13,
    lineHeight: 19
  },
  textarea: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    fontSize: 14,
    fontWeight: "700",
    textAlignVertical: "top"
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center"
  },
  tableRow: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12
  },
  size: {
    fontSize: 16,
    fontWeight: "900"
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4
  },
  inspector: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 12
  },
  job: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14
  }
});
