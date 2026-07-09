import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { getJeansIndexStats } from "@rober/api-client";
import { AppButton, SectionHeader } from "../components/primitives";
import { FitConfidenceRing } from "../components/fit";
import { useDemoStore } from "../stores/useDemoStore";
import { useThemeTokens } from "../theme/useThemeTokens";

const metrics = [
  { label: "Illustrative returns avoided", value: "38", detail: "Via anchor-based matching" },
  { label: "Avg. dimension-level match accuracy", value: "86%", detail: "Vs. anchor garment construction" },
  { label: "Anchor-based match adoption", value: "82%", detail: "Sessions using garment_to_garment" },
  { label: "Reference-item onboarding completion", value: "74%", detail: "Synthetic funnel" },
  { label: "Compare usage", value: "61%", detail: "Sessions opening Best Fit" },
  { label: "Best-fit-card taps", value: "43%", detail: "Compare sessions" },
  { label: "Cart conversion with fit", value: "31%", detail: "Synthetic cohort" },
  { label: "Cart conversion without fit", value: "18%", detail: "Synthetic cohort" },
  { label: "Fit feedback rate", value: "52%", detail: "Post-delivery survey" }
];

const feedback = [
  { label: "True to size", value: 72, color: "#2F9E64" },
  { label: "Too small", value: 14, color: "#D94F4F" },
  { label: "Too large", value: 14, color: "#E0A526" }
];

const indexStats = getJeansIndexStats();

const coverage = [
  { label: "Public chart inputs", value: String(indexStats.chartSources), detail: "Benchmark size-chart sources" },
  { label: "Normalized jean styles", value: String(indexStats.productStyles), detail: "Illustrative demo inventory" },
  { label: "Fit-ready size options", value: indexStats.fitReadyVariants.toLocaleString("en-US"), detail: "In-stock size and inseam variants" },
  { label: "Benchmark brands", value: String(indexStats.benchmarkBrands), detail: "Cross-brand fit translation" }
];

export default function InvestorDemoScreen() {
  const theme = useThemeTokens();
  const orders = useDemoStore((state) => state.orders);
  const saved = useDemoStore((state) => state.savedProductIds.length);
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <View style={[styles.disclosure, { backgroundColor: theme.surfaceWarm, borderColor: theme.border }]}>
        <Text style={[styles.disclosureTitle, { color: theme.text }]}>Demo data disclosure</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          Demo data: synthetic dataset shaped like the production measurement pipeline. These metrics are illustrative and are not production return-rate claims.
        </Text>
      </View>

      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { color: theme.accent }]}>INVESTOR DASHBOARD</Text>
          <Text style={[styles.title, { color: theme.text }]}>A pair a shopper trusts becomes usable fit data.</Text>
          <Text style={[styles.copy, { color: theme.textMuted }]}>
            Rober normalizes a known-good garment against a cross-brand fit index, then recommends a size and explains the construction match. The demo tracks onboarding, comparison, fit-informed checkout, and post-delivery feedback without exposing raw body measurements in analytics.
          </Text>
        </View>
        <FitConfidenceRing confidence={86} size={92} />
      </View>

      <SectionHeader kicker="Index coverage" title="A demo with real choice" />
      <View style={styles.metricGrid}>
        {coverage.map((metric) => (
          <View key={metric.label} style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.metricValue, { color: theme.text }]}>{metric.value}</Text>
            <Text style={[styles.metricLabel, { color: theme.text }]}>{metric.label}</Text>
            <Text style={[styles.metricDetail, { color: theme.textMuted }]}>{metric.detail}</Text>
          </View>
        ))}
      </View>

      <SectionHeader kicker="Impact" title="Synthetic metrics" />
      <View style={styles.metricGrid}>
        {metrics.map((metric) => (
          <View key={metric.label} style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.metricValue, { color: theme.text }]}>{metric.value}</Text>
            <Text style={[styles.metricLabel, { color: theme.text }]}>{metric.label}</Text>
            <Text style={[styles.metricDetail, { color: theme.textMuted }]}>{metric.detail}</Text>
          </View>
        ))}
      </View>

      <SectionHeader kicker="Feedback" title="Fit feedback distribution" />
      <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {feedback.map((row) => (
          <View key={row.label} style={styles.chartRow}>
            <Text style={[styles.chartLabel, { color: theme.text }]}>{row.label}</Text>
            <View style={[styles.chartTrack, { backgroundColor: theme.border }]}>
              <View style={[styles.chartFill, { width: `${row.value}%`, backgroundColor: row.color }]} />
            </View>
            <Text style={[styles.chartValue, { color: theme.textMuted }]}>{row.value}%</Text>
          </View>
        ))}
      </View>

      <SectionHeader kicker="Current demo" title="Local state snapshot" />
      <View style={[styles.snapshot, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.metricLabel, { color: theme.text }]}>Orders: {orders.length}</Text>
        <Text style={[styles.metricLabel, { color: theme.text }]}>Saved items: {saved}</Text>
        <Text style={[styles.metricDetail, { color: theme.textMuted }]}>Sensitive measurements are available only in profile context, not analytics output.</Text>
      </View>

      <View style={styles.actions}>
        <Link href="/compare" asChild>
          <AppButton>Open Best Fit Finder</AppButton>
        </Link>
        <Link href="/admin" asChild>
          <AppButton variant="secondary">Open admin review</AppButton>
        </Link>
      </View>
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
    gap: 18
  },
  disclosure: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 8
  },
  disclosureTitle: {
    fontSize: 18,
    fontWeight: "900"
  },
  heroRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center"
  },
  kicker: {
    fontFamily: "Courier",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 38,
    marginTop: 6,
    marginBottom: 8
  },
  copy: {
    fontSize: 14,
    lineHeight: 21
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  metricCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    minHeight: 132
  },
  metricValue: {
    fontSize: 32,
    fontWeight: "900"
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "900",
    marginTop: 6
  },
  metricDetail: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4
  },
  chartCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 14
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  chartLabel: {
    width: 88,
    fontSize: 12,
    fontWeight: "900"
  },
  chartTrack: {
    height: 10,
    borderRadius: 999,
    flex: 1,
    overflow: "hidden"
  },
  chartFill: {
    height: "100%",
    borderRadius: 999
  },
  chartValue: {
    width: 38,
    textAlign: "right",
    fontWeight: "900"
  },
  snapshot: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16
  },
  actions: {
    gap: 10
  }
});
