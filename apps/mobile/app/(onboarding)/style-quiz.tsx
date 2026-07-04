import { ScrollView, StyleSheet } from "react-native";
import { StyleQuiz } from "../../features/onboarding/StyleQuiz";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function StyleQuizScreen() {
  const theme = useThemeTokens();
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
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
    paddingTop: 64,
    paddingBottom: 48
  }
});
