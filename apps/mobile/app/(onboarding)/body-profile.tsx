import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BodyProfileWizard } from "../../features/onboarding/BodyProfileWizard";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function BodyProfileScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bgCanvas }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 42 },
      ]}
    >
      <BodyProfileWizard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    padding: 20,
  }
});
