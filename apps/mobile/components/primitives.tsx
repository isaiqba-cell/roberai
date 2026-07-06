import { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Minus, Plus, SunMoon, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { categoryGradients } from "../theme/tokens";
import { useThemeTokens } from "../theme/useThemeTokens";
import { useThemePreference } from "../theme/ThemeProvider";

type PressableBase = {
  accessibilityLabel?: string;
  accessibilityState?: {
    busy?: boolean;
    checked?: boolean | "mixed";
    disabled?: boolean;
    expanded?: boolean;
    selected?: boolean;
  };
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
};

export function AppButton({
  children,
  variant = "primary",
  icon,
  accessibilityLabel,
  accessibilityState,
  disabled,
  onPress,
}: PressableBase & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
}) {
  const theme = useThemeTokens();
  const isPrimary = variant === "primary";
  const isGhost = variant === "ghost";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary
            ? theme.accent
            : isGhost
              ? "transparent"
              : theme.surface,
          borderColor: isPrimary
            ? theme.accent
            : isGhost
              ? "transparent"
              : theme.surface,
          opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
        },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.buttonText,
          {
            color: isPrimary ? "#FFFFFF" : theme.text,
          },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  children,
  accessibilityLabel,
  accessibilityState,
  disabled,
  onPress,
  style,
}: PressableBase & PropsWithChildren & { style?: StyleProp<ViewStyle> }) {
  const theme = useThemeTokens();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      disabled={disabled}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: theme.surface,
          borderColor: theme.surface,
          opacity: pressed ? 0.76 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const theme = useThemeTokens();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.ink : theme.surfaceRaised,
          borderColor: selected ? theme.ink : theme.surface,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[styles.chipText, { color: selected ? "#FFFFFF" : theme.text }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function FilterChip(props: Parameters<typeof Chip>[0]) {
  return <Chip {...props} />;
}

export function BrandPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const theme = useThemeTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      accessibilityLabel={`${label} brand filter`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.brandPill,
        {
          borderColor: selected ? theme.accent : theme.border,
          backgroundColor: selected ? theme.surfaceWarm : theme.surface,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <Text numberOfLines={1} style={[styles.brandPillText, { color: theme.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SectionHeader({
  kicker,
  title,
  action,
}: {
  kicker: string;
  title: string;
  action?: ReactNode;
}) {
  const theme = useThemeTokens();
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.kicker, { color: theme.accent }]}>{kicker}</Text>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {title}
          </Text>
          <View style={[styles.rule, { backgroundColor: theme.border }]} />
        </View>
      </View>
      {action}
    </View>
  );
}

export function CategoryTile({
  title,
  subtitle,
  tone,
}: {
  title: string;
  subtitle: string;
  tone: keyof typeof categoryGradients;
}) {
  const gradient = categoryGradients[tone];
  return (
    <LinearGradient colors={gradient} style={styles.categoryTile}>
      <Text style={styles.categoryTitle}>{title}</Text>
      <Text style={styles.categorySubtitle}>{subtitle}</Text>
    </LinearGradient>
  );
}

export function Price({
  cents,
  compareAtCents,
}: {
  cents: number;
  compareAtCents?: number;
}) {
  const theme = useThemeTokens();
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.price, { color: theme.text }]}>
        {formatPrice(cents)}
      </Text>
      {compareAtCents ? (
        <Text style={[styles.comparePrice, { color: theme.textMuted }]}>
          {formatPrice(compareAtCents)}
        </Text>
      ) : null}
    </View>
  );
}

export function RatingBadge({
  rating,
  count,
}: {
  rating: number;
  count?: number;
}) {
  const theme = useThemeTokens();
  return (
    <View
      style={[
        styles.ratingBadge,
        { backgroundColor: theme.surfaceRaised, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.ratingText, { color: theme.text }]}>
        {rating.toFixed(1)}
      </Text>
      {count ? (
        <Text style={[styles.ratingCount, { color: theme.textMuted }]}>
          ({count})
        </Text>
      ) : null}
    </View>
  );
}

export function QuantityStepper({
  value,
  onIncrement,
  onDecrement,
}: {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const theme = useThemeTokens();
  return (
    <View
      style={[
        styles.stepper,
        {
          backgroundColor: theme.surfaceRaised,
          borderColor: theme.surfaceRaised,
        },
      ]}
    >
      <IconButton
        accessibilityLabel="Decrease quantity"
        onPress={onDecrement}
        style={styles.stepperButton}
      >
        <Minus size={18} color={theme.text} />
      </IconButton>
      <Text
        accessibilityLabel={`Quantity ${value}`}
        style={[styles.stepperValue, { color: theme.text }]}
      >
        {value}
      </Text>
      <IconButton
        accessibilityLabel="Increase quantity"
        onPress={onIncrement}
        style={styles.stepperButton}
      >
        <Plus size={18} color={theme.text} />
      </IconButton>
    </View>
  );
}

export function PromoCodeRow({ code = "ROBERFIT" }: { code?: string }) {
  const theme = useThemeTokens();
  return (
    <View
      style={[
        styles.infoRow,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <Text style={[styles.infoLabel, { color: theme.textMuted }]}>
        Promo code
      </Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{code}</Text>
    </View>
  );
}

export function AddressCard({ compact }: { compact?: boolean }) {
  const theme = useThemeTokens();
  return (
    <View
      style={[
        styles.addressCard,
        { borderColor: theme.border, backgroundColor: theme.surface },
      ]}
    >
      <Text style={[styles.addressName, { color: theme.text }]}>
        Demo Shopper
      </Text>
      <Text style={[styles.addressLine, { color: theme.textMuted }]}>
        {compact ? "New York, NY" : "25 Mercer Street, New York, NY 10013"}
      </Text>
    </View>
  );
}

export function StickyCTA({
  price,
  label,
  onPress,
}: {
  price?: string;
  label: string;
  onPress?: () => void;
}) {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const buttonProps = onPress ? { onPress } : {};
  return (
    <View
      style={[
        styles.stickyCta,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      {price ? (
        <Text style={[styles.stickyPrice, { color: theme.text }]}>{price}</Text>
      ) : null}
      <AppButton {...buttonProps} accessibilityLabel={label}>
        {label}
      </AppButton>
    </View>
  );
}

export function ThemeToggle() {
  const theme = useThemeTokens();
  const { mode, setMode } = useThemePreference();
  const nextMode =
    mode === "dark" ? "light" : mode === "light" ? "system" : "dark";
  return (
    <IconButton
      accessibilityLabel="Toggle theme"
      onPress={() => setMode(nextMode)}
    >
      <SunMoon size={20} color={theme.text} />
    </IconButton>
  );
}

export function Sheet({
  title,
  visible,
  children,
  onClose,
}: PropsWithChildren<{
  title: string;
  visible: boolean;
  onClose: () => void;
}>) {
  const theme = useThemeTokens();
  return (
    <RNModal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {title}
            </Text>
            <IconButton accessibilityLabel="Close sheet" onPress={onClose}>
              <X size={18} color={theme.text} />
            </IconButton>
          </View>
          <ScrollView>{children}</ScrollView>
        </View>
      </View>
    </RNModal>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  const theme = useThemeTokens();
  return (
    <View
      style={[
        styles.stateCard,
        { backgroundColor: theme.surfaceWarm, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.stateTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.stateBody, { color: theme.textMuted }]}>{body}</Text>
      {action}
    </View>
  );
}

export function ErrorState({
  title = "Something slipped",
  body,
}: {
  title?: string;
  body: string;
}) {
  return <EmptyState title={title} body={body} />;
}

export function OfflineState() {
  return (
    <EmptyState
      title="Offline mode"
      body="Demo catalog is cached locally. Live payments and syncing resume when connected."
    />
  );
}

export function SkeletonLoader({ rows = 3 }: { rows?: number }) {
  const theme = useThemeTokens();
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={index}
          style={[styles.skeleton, { backgroundColor: theme.surfaceRaised }]}
        />
      ))}
    </View>
  );
}

export function Modal({
  visible,
  children,
  onClose,
}: PropsWithChildren<{ visible: boolean; onClose: () => void }>) {
  return (
    <Sheet title="Rober" visible={visible} onClose={onClose}>
      {children}
    </Sheet>
  );
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(cents / 100);
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
    shadowColor: "#8F3E2F",
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "900",
  },
  iconButton: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6F3328",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  chip: {
    minHeight: 40,
    minWidth: 72,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    shadowColor: "#6F3328",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "700",
    maxWidth: 148,
  },
  brandPill: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 76,
    maxWidth: 148,
    paddingHorizontal: 18,
    shadowColor: "#6F3328",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  brandPillText: {
    fontSize: 15,
    fontWeight: "900",
    maxWidth: 118,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 14,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 6,
    textTransform: "none",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  rule: {
    height: 1,
    flex: 1,
  },
  categoryTile: {
    minHeight: 94,
    minWidth: 148,
    flexGrow: 1,
    flexBasis: "45%",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  categoryTitle: {
    color: "#101013",
    fontWeight: "900",
    fontSize: 16,
    textTransform: "uppercase",
  },
  categorySubtitle: {
    color: "rgba(16, 16, 19, 0.62)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
  },
  comparePrice: {
    fontSize: 13,
    textDecorationLine: "line-through",
  },
  ratingBadge: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontWeight: "800",
  },
  ratingCount: {
    fontSize: 12,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    padding: 2,
    gap: 8,
  },
  stepperButton: {
    minHeight: 36,
    minWidth: 36,
    borderWidth: 0,
  },
  stepperValue: {
    minWidth: 24,
    textAlign: "center",
    fontWeight: "800",
  },
  infoRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  infoValue: {
    fontWeight: "900",
  },
  addressCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  addressName: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 13,
  },
  stickyCta: {
    borderTopWidth: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
    gap: 12,
    shadowColor: "#6F3328",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 8,
  },
  stickyPrice: {
    fontSize: 18,
    fontWeight: "900",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.34)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "900",
  },
  stateCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
  stateBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  skeleton: {
    height: 112,
    borderRadius: 18,
  },
});
