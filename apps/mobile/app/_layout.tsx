import "react-native-gesture-handler";
import "react-native-reanimated";

import { ReactNode } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useThemePreference } from "../theme/ThemeProvider";
import { initializeSentry } from "../lib/sentry";

const queryClient = new QueryClient();
initializeSentry();
const iPhoneWidth = 393;
const iPhoneHeight = 852;
const webPreviewMetrics = {
  frame: { x: 0, y: 0, width: iPhoneWidth, height: iPhoneHeight },
  insets: { top: 54, left: 0, right: 0, bottom: 28 },
};

function RootNavigator() {
  const { colorScheme } = useThemePreference();

  return (
    <IPhonePreviewFrame>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </IPhonePreviewFrame>
  );
}

function IPhonePreviewFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  const scale = 0.78;

  return (
    <View style={styles.webStage}>
      <View
        style={[
          styles.phoneScaleBox,
          { width: iPhoneWidth * scale, height: iPhoneHeight * scale },
        ]}
      >
        <View
          style={[
            styles.phoneShadow,
            {
              width: iPhoneWidth,
              height: iPhoneHeight,
              transform: [{ scale }],
            },
          ]}
        >
          <View style={styles.phoneActionButton} />
          <View style={styles.phoneVolumeUp} />
          <View style={styles.phoneVolumeDown} />
          <View style={styles.phonePowerButton} />
          <View style={styles.phoneShell}>
            <View style={styles.dynamicIsland} />
            <View style={styles.islandCamera} />
            <View style={styles.phoneScreen}>{children}</View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider
        initialMetrics={
          Platform.OS === "web" ? webPreviewMetrics : null
        }
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  webStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9E4DF",
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingVertical: 44,
  },
  phoneScaleBox: {
    position: "relative",
    overflow: "visible",
  },
  phoneShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    shadowColor: "#000",
    shadowOpacity: 0.36,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 20 },
    transformOrigin: "top left",
  },
  phoneShell: {
    flex: 1,
    borderRadius: 56,
    backgroundColor: "#0B0B0D",
    padding: 10,
    borderWidth: 1,
    borderColor: "#242429",
  },
  phoneScreen: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 45,
    backgroundColor: "#FFFFFF",
  },
  dynamicIsland: {
    position: "absolute",
    zIndex: 4,
    top: 24,
    alignSelf: "center",
    width: 116,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#000000",
  },
  islandCamera: {
    position: "absolute",
    zIndex: 5,
    top: 34,
    right: "38%",
    width: 13,
    height: 13,
    borderRadius: 999,
    backgroundColor: "#151821",
    borderWidth: 1,
    borderColor: "#24283A",
  },
  phoneActionButton: {
    position: "absolute",
    left: -3,
    top: 112,
    width: 4,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#151519",
  },
  phoneVolumeUp: {
    position: "absolute",
    left: -3,
    top: 172,
    width: 4,
    height: 66,
    borderRadius: 999,
    backgroundColor: "#151519",
  },
  phoneVolumeDown: {
    position: "absolute",
    left: -3,
    top: 252,
    width: 4,
    height: 66,
    borderRadius: 999,
    backgroundColor: "#151519",
  },
  phonePowerButton: {
    position: "absolute",
    right: -3,
    top: 222,
    width: 4,
    height: 96,
    borderRadius: 999,
    backgroundColor: "#151519",
  },
});
