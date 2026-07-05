import { Tabs } from "expo-router";
import {
  Home,
  Search,
  Heart,
  ShoppingBag,
  UserRound,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function TabsLayout() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const iconColor = (focused: boolean) => (focused ? "#FFFFFF" : theme.tabText);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: theme.tabText,
        tabBarActiveBackgroundColor: theme.accent,
        tabBarStyle: {
          position: "absolute",
          left: 22,
          right: 22,
          bottom: insets.bottom + 12,
          height: 66,
          borderRadius: 999,
          borderWidth: 0,
          backgroundColor: theme.tabBar,
          shadowColor: "#6F3328",
          shadowOpacity: 0.16,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
          paddingTop: 9,
          paddingHorizontal: 8,
        },
        tabBarItemStyle: {
          borderRadius: 999,
          marginHorizontal: 2,
          marginVertical: 5,
          overflow: "hidden",
        },
        tabBarLabelStyle: {
          fontSize: 11,
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
        name="discover"
        options={{
          title: "Discover",
          tabBarAccessibilityLabel: "Discover tab",
          tabBarIcon: ({ focused }) => (
            <Search size={21} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Saved",
          tabBarAccessibilityLabel: "Wishlist tab",
          tabBarIcon: ({ focused }) => (
            <Heart size={21} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Bag",
          tabBarAccessibilityLabel: "Cart tab",
          tabBarIcon: ({ focused }) => (
            <ShoppingBag size={21} color={iconColor(focused)} />
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
    </Tabs>
  );
}
