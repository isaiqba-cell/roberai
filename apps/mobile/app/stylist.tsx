import { useRef, useState } from "react";
import { Link, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowLeft, Send, Sparkles } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatCurrency } from "@rober/api-client";
import { AppButton, Chip, IconButton, SectionHeader } from "../components/primitives";
import { FitExplanationCard } from "../components/fit";
import { ProductRail } from "../components/product";
import { getGroundedStylistResponse, StylistResponse } from "../lib/stylist";
import { useDemoStore } from "../stores/useDemoStore";
import { useThemeTokens } from "../theme/useThemeTokens";

type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  response?: StylistResponse;
};

export default function StylistScreen() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const chatScrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState("straight denim jeans under $150");
  const body = useDemoStore((state) => state.bodyProfile);
  const style = useDemoStore((state) => state.styleProfile);
  const favoriteItems = useDemoStore((state) => state.knownGoodItems);
  const wishlistIds = useDemoStore((state) => state.savedProductIds);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: "intro",
      role: "assistant",
      text: "Ask for a style, budget, material, or fit. I only recommend products in the seeded Rober catalog and every suggestion includes a computed fit lookup."
    }
  ]);

  const submit = () => {
    const query = draft.trim();
    if (!query) {
      return;
    }
    const response = getGroundedStylistResponse({ query, body, style, favoriteItems, wishlistIds });
    const assistantId = `assistant-${Date.now()}`;
    setTurns((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text: query },
      { id: assistantId, role: "assistant", text: response.text, response }
    ]);
    setDraft("");

    // Products stay grounded in the fit engine either way; when the
    // server-side OpenAI route is configured, it rewrites only the reply
    // copy around those same candidates. On any failure the deterministic
    // text above simply stands.
    if (response.products.length) {
      const anchor = favoriteItems[0];
      fetch("/api/stylist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query,
          anchor: anchor
            ? `${anchor.brand} ${anchor.itemName} ${anchor.sizeLabel}`
            : undefined,
          candidates: response.products.map((product) => ({
            brand: product.product.brand.name,
            title: product.product.title,
            price: formatCurrency(product.product.priceCents),
            fitConfidence: product.confidence,
            recommendedSize: product.recommendedSize,
          })),
        }),
      })
        .then((aiResponse) => (aiResponse.ok ? aiResponse.json() : Promise.reject()))
        .then(({ text }: { text?: string }) => {
          if (text) {
            setTurns((current) =>
              current.map((turn) =>
                turn.id === assistantId ? { ...turn, text } : turn,
              ),
            );
          }
        })
        .catch(() => undefined);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bgCanvas }]}>
      <ScrollView
        ref={chatScrollRef}
        onContentSizeChange={() =>
          chatScrollRef.current?.scrollToEnd({ animated: true })
        }
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 150 },
        ]}
      >
        <View style={styles.topbar}>
          <IconButton
            accessibilityLabel="Back to home"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/(tabs)/home")
            }
          >
            <ArrowLeft size={20} color={theme.text} />
          </IconButton>
          <Text style={[styles.logo, { color: theme.text }]}>Rober Stylist</Text>
        </View>
        <View style={[styles.hero, { backgroundColor: theme.bgWarm, borderColor: theme.border }]}>
          <Sparkles size={24} color={theme.accent} />
          <Text style={[styles.title, { color: theme.text }]}>Grounded recommendations, not fashion fan fiction.</Text>
          <Text style={[styles.copy, { color: theme.textMuted }]}>
            The stylist calls search and fit-score tools over the jeans catalog. If profile data is missing, confidence drops.
          </Text>
        </View>

        <SectionHeader kicker="Chat" title="Ask Rober" />
        {turns.map((turn) => (
          <View
            key={turn.id}
            style={[
              styles.bubble,
              {
                backgroundColor: turn.role === "user" ? theme.ink : theme.surface,
                borderColor: theme.border,
                alignSelf: turn.role === "user" ? "flex-end" : "stretch"
              }
            ]}
          >
            <Text style={[styles.bubbleText, { color: turn.role === "user" ? "#FFFFFF" : theme.text }]}>{turn.text}</Text>
            {turn.response?.parsedChips.length ? (
              <View style={styles.chips}>
                {turn.response.parsedChips.map((chip) => (
                  <Chip key={chip} label={chip} selected />
                ))}
              </View>
            ) : null}
            {turn.response?.products.length ? (
              <>
                <ProductRail products={turn.response.products.map((product) => product.card)} />
                <FitExplanationCard lines={turn.response.products[0]?.explanation ?? []} />
                <Link href="/compare" asChild>
                  <AppButton variant="secondary">Compare these</AppButton>
                </Link>
              </>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View
        style={[
          styles.composer,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <TextInput
          accessibilityLabel="Message stylist"
          value={draft}
          onChangeText={setDraft}
          placeholder="curvy jeans under $100"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.text }]}
          onSubmitEditing={submit}
        />
        <IconButton accessibilityLabel="Send stylist message" onPress={submit}>
          <Send size={18} color={theme.text} />
        </IconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    padding: 20,
    gap: 18
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  logo: {
    fontSize: 19,
    fontWeight: "900"
  },
  hero: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 8
  },
  title: {
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 25
  },
  copy: {
    fontSize: 13,
    lineHeight: 19
  },
  bubble: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 12,
    maxWidth: "100%"
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700"
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  composer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 12,
    borderWidth: 1,
    borderRadius: 999,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  input: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: "800"
  }
});
