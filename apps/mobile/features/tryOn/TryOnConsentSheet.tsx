import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { AppButton, Sheet } from "../../components/primitives";
import { useThemeTokens } from "../../theme/useThemeTokens";

// Consent is required before the first photo upload and is never a default
// onboarding step. This copy states, in plain language, exactly what the
// photo is used for, that it's private, and that it can be deleted anytime
// (which cascades to every render derived from it) — see BUILD_BRIEF.md for
// the full privacy rationale.
export function TryOnConsentSheet({
  visible,
  onAccept,
  onClose,
}: {
  visible: boolean;
  onAccept: () => void;
  onClose: () => void;
}) {
  const theme = useThemeTokens();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Sheet title="Try it on with your photo" visible={visible} onClose={onClose}>
      <View style={styles.wrap}>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          Try-on is optional. If you upload a photo, Rober uses it only to
          generate try-on visuals of you wearing candidate jeans. It's stored
          privately, never used for analytics or ML training beyond your own
          renders, and never shared. You can delete your photo anytime, which
          also deletes every try-on image generated from it.
        </Text>
        <Text style={[styles.copy, { color: theme.textMuted }]}>
          The photo must be of you, the account holder. Do not upload a photo
          of someone else.
        </Text>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}
          accessibilityLabel="I confirm I am 18 or older and this is a photo of myself"
          onPress={() => setConfirmed((current) => !current)}
          style={styles.checkboxRow}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: theme.border,
                backgroundColor: confirmed ? theme.ink : "transparent",
              },
            ]}
          >
            {confirmed ? <Check size={14} color="#FFFFFF" /> : null}
          </View>
          <Text style={[styles.checkboxLabel, { color: theme.text }]}>
            I confirm I am 18+ and this is a photo of myself.
          </Text>
        </Pressable>
        <AppButton disabled={!confirmed} onPress={onAccept}>
          Continue to upload
        </AppButton>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
    paddingBottom: 8,
  },
  copy: {
    fontSize: 13,
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
});
