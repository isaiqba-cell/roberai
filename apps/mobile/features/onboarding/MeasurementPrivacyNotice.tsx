import { StyleSheet, Text, View } from "react-native";
import { useThemeTokens } from "../../theme/useThemeTokens";

export function MeasurementPrivacyNotice() {
  const theme = useThemeTokens();
  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceWarm, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>Private by default</Text>
      <Text style={[styles.copy, { color: theme.textMuted }]}>
        Rober uses your measurements only to estimate which sizes are most likely to fit across brands. We do not sell your body measurements, and we do not send raw measurements to analytics tools. You can edit, export, or delete your fit profile anytime.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 8
  },
  title: {
    fontSize: 17,
    fontWeight: "900"
  },
  copy: {
    fontSize: 13,
    lineHeight: 20
  }
});
