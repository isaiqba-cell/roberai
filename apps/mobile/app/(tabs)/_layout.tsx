import { Tabs } from "expo-router";
import {
  Bookmark,
  GitCompareArrows,
  Home,
  Search,
  UserRound,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function TabsLayout() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const dockHeight = 74 + insets.bottom;
  const iconColor = (focused: boolean) => (focused ? "#FFFFFF" : theme.tabText);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: theme.tabText,
        tabBarActiveBackgroundColor: theme.accent,
        sceneStyle: {
          backgroundColor: theme.bgCanvas,
          overflow: "hidden",
        },
        tabBarStyle: {
          position: "relative",
          height: dockHeight,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          backgroundColor: "#FFFFFF",
          shadowColor: "#6F3328",
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -6 },
          elevation: 10,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          paddingHorizontal: 8,
        },
        tabBarItemStyle: {
          borderRadius: 20,
          marginHorizontal: 2,
          marginVertical: 2,
          paddingVertical: 3,
          overflow: "hidden",
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarAccessibilityLabel: "Home tab",
          tabBarIcon: ({ focused }) => (
            <Home size={21} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          title: "Compare",
          tabBarAccessibilityLabel: "Compare tab",
          tabBarIcon: ({ focused }) => (
            <GitCompareArrows size={21} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Search",
          tabBarAccessibilityLabel: "Search tab",
          tabBarIcon: ({ focused }) => (
            <Search size={21} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Saved",
          tabBarAccessibilityLabel: "Saved tab",
          tabBarIcon: ({ focused }) => (
            <Bookmark size={21} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarAccessibilityLabel: "Profile tab",
          tabBarIcon: ({ focused }) => (
            <UserRound size={21} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen name="cart" options={{ href: null }} />
    </Tabs>
  );
}
