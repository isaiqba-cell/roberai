import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleQuiz } from "../../features/onboarding/StyleQuiz";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function StyleQuizScreen() {
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
      <StyleQuiz />
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
