import { Link, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Apple, Mail } from "lucide-react-native";
import { AppButton } from "../../components/primitives";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function SignInScreen() {
  const theme = useThemeTokens();
  const router = useRouter();
  const setGuestMode = useDemoStore((state) => state.setGuestMode);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <Text style={[styles.logo, { color: theme.text }]}>Rober</Text>
      <Text style={[styles.title, { color: theme.text }]}>Sign in to keep fit memory across brands.</Text>
      <View style={[styles.field, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <Mail size={18} color={theme.textMuted} />
        <TextInput
          accessibilityLabel="Email address"
          placeholder="you@example.com"
          placeholderTextColor={theme.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { color: theme.text }]}
        />
      </View>
      <AppButton
        onPress={() => {
          setGuestMode(false);
          router.push("/(onboarding)/body-profile");
        }}
      >
        Send email OTP
      </AppButton>
      <AppButton variant="secondary" icon={<Apple size={18} color={theme.text} />}>
        Continue with Apple
      </AppButton>
      <AppButton variant="secondary">Continue with Google</AppButton>
      <AppButton
        variant="ghost"
        onPress={() => {
          setGuestMode(true);
          router.push("/(tabs)/home");
        }}
      >
        Browse as guest
      </AppButton>
      <Link href="/(onboarding)/welcome" style={[styles.link, { color: theme.accent }]}>
        Back to welcome
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    padding: 24,
    paddingTop: 88,
    gap: 16
  },
  logo: {
    fontSize: 28,
    fontWeight: "900"
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 38,
    marginBottom: 8
  },
  field: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700"
  },
  link: {
    marginTop: 10,
    fontWeight: "900",
    textAlign: "center"
  }
});
