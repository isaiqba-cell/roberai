import { useState } from "react";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Camera, Trash2 } from "lucide-react-native";
import { TryOnPhotoRecord } from "@rober/api-client";
import { AppButton, IconButton } from "../../components/primitives";
import { checkPersonPresence } from "../../lib/tryOnSafety";
import { DEMO_USER_ID, useDemoStore } from "../../stores/useDemoStore";
import { useThemeTokens } from "../../theme/useThemeTokens";
import { TryOnConsentSheet } from "./TryOnConsentSheet";

export function TryOnPhotoManager({
  onPhotoReady,
}: {
  onPhotoReady?: (photo: TryOnPhotoRecord) => void;
}) {
  const theme = useThemeTokens();
  const consentAccepted = useDemoStore((state) => state.tryOnConsentAccepted);
  const acceptTryOnConsent = useDemoStore((state) => state.acceptTryOnConsent);
  const photos = useDemoStore((state) => state.tryOnPhotos);
  const addTryOnPhoto = useDemoStore((state) => state.addTryOnPhoto);
  const deleteTryOnPhoto = useDemoStore((state) => state.deleteTryOnPhoto);
  const [consentVisible, setConsentVisible] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const activePhoto = photos.find((photo) => photo.status === "active");

  const startUpload = () => {
    setError(undefined);
    if (!consentAccepted) {
      setConsentVisible(true);
      return;
    }
    void pickAndUploadPhoto();
  };

  const pickAndUploadPhoto = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const ImagePicker = await import("expo-image-picker");
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Photo library access is required to try this on.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) {
        return;
      }
      const asset = result.assets[0];
      const presenceCheck = await checkPersonPresence(asset);
      if (!presenceCheck.passed) {
        setError(presenceCheck.reason ?? "This photo couldn't be used.");
        return;
      }
      // Demo mode: no live Supabase Storage bucket to upload to, so the
      // local asset URI stands in for storage_path. In production this
      // would upload to the private try-on-assets bucket under
      // photos/{user_id}/... and store only that path, never the raw URI.
      const photo: TryOnPhotoRecord = {
        id: `try-on-photo-${Date.now()}`,
        userId: DEMO_USER_ID,
        storagePath: asset.uri,
        status: "active",
        createdAt: new Date().toISOString(),
      };
      addTryOnPhoto(photo);
      onPhotoReady?.(photo);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {activePhoto ? (
        <View style={styles.photoRow}>
          <Image
            source={{ uri: activePhoto.storagePath }}
            style={styles.thumbnail}
            contentFit="cover"
            accessibilityLabel="Your try-on reference photo"
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>
              Reference photo saved
            </Text>
            <Text style={[styles.copy, { color: theme.textMuted }]}>
              Used only to generate your try-on renders.
            </Text>
          </View>
          <IconButton
            accessibilityLabel="Delete try-on photo"
            onPress={() => deleteTryOnPhoto(activePhoto.id)}
          >
            <Trash2 size={18} color={theme.fitLow} />
          </IconButton>
        </View>
      ) : (
        <AppButton
          icon={<Camera size={18} color="#FFFFFF" />}
          disabled={busy}
          onPress={startUpload}
        >
          {busy ? "Uploading..." : "Add a photo — optional"}
        </AppButton>
      )}
      {error ? (
        <Text style={[styles.error, { color: theme.fitLow }]}>{error}</Text>
      ) : null}
      <TryOnConsentSheet
        visible={consentVisible}
        onAccept={() => {
          acceptTryOnConsent();
          setConsentVisible(false);
          void pickAndUploadPhoto();
        }}
        onClose={() => setConsentVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: "900",
  },
  copy: {
    fontSize: 12,
    lineHeight: 17,
  },
  error: {
    fontSize: 12,
    fontWeight: "800",
  },
});
