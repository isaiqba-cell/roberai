import { Link } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton, SectionHeader, ThemeToggle } from "../../components/primitives";
import { SimilarToFavoriteItemChip } from "../../components/fit";
import { TryOnPhotoManager } from "../../features/tryOn/TryOnPhotoManager";
import { mockNotificationPayload, requestNotificationPermission, routeFromNotificationPayload } from "../../services/notifications";
import { authenticateSensitiveAccess } from "../../services/localAuthentication";
import { useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function ProfileScreen() {
  const theme = useThemeTokens();
  const favorite = useDemoStore((state) => state.knownGoodItems[0]);
  const [status, setStatus] = useState("Notifications and biometric unlock are ready for demo.");
  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.bgCanvas }]} contentContainerStyle={styles.content}>
      <SectionHeader kicker="Account" title="Fit profile" action={<ThemeToggle />} />
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Your reference pair</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          {favorite
            ? `${favorite.brand} ${favorite.itemName} · ${favorite.sizeLabel}. Every match is calibrated against this pair.`
            : "Add a favorite pair to calibrate your matches across brands."}
        </Text>
        <SimilarToFavoriteItemChip label={favorite ? favorite.itemName : "No reference pair yet"} />
      </View>
      <Link href="/(onboarding)/garment-reference" asChild>
        <AppButton variant="secondary">
          {favorite ? "Change my reference pair" : "Add my reference pair"}
        </AppButton>
      </Link>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Try it on</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          Upload a photo to see candidate jeans on you in Compare. Optional,
          private, and deletable anytime.
        </Text>
        <TryOnPhotoManager />
      </View>
      <Link href="/investor-demo" asChild>
        <AppButton>Open investor dashboard</AppButton>
      </Link>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>{status}</Text>
        <AppButton
          variant="secondary"
          onPress={async () => {
            const permission = await requestNotificationPermission();
            setStatus(permission.granted ? "Notifications enabled for price drops, back in stock, and order updates." : "Notification permission was not granted.");
          }}
        >
          Enable notifications
        </AppButton>
        <AppButton
          variant="secondary"
          onPress={async () => {
            const result = await authenticateSensitiveAccess();
            setStatus(result.success ? "Sensitive fit profile unlocked." : "Biometric unlock unavailable or cancelled.");
          }}
        >
          Test biometric unlock
        </AppButton>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          Mock notification route: {routeFromNotificationPayload(mockNotificationPayload())}
        </Text>
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
    paddingBottom: 120,
    gap: 16
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 12
  },
  title: {
    fontSize: 24,
    fontWeight: "900"
  },
  copy: {
    fontSize: 14,
    lineHeight: 21
  }
});
