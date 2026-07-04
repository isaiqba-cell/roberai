import { ScrollView, StyleSheet } from "react-native";
import { BodyProfileWizard } from "../../features/onboarding/BodyProfileWizard";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function BodyProfileScreen() {
  const theme = useThemeTokens();
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
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
    paddingTop: 64,
    paddingBottom: 48
  }
});
