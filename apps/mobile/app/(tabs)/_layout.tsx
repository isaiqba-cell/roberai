import { Tabs } from "expo-router";
import { Home, Search, Heart, ShoppingBag, UserRound } from "lucide-react-native";
import { useThemeTokens } from "../../theme/useThemeTokens";

export default function TabsLayout() {
  const theme = useThemeTokens();
  const iconColor = (focused: boolean) => (focused ? theme.accent : theme.tabText);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.tabText,
        tabBarStyle: {
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 16,
          height: 68,
          borderRadius: 999,
          borderWidth: 0,
          backgroundColor: theme.tabBar,
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800"
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarAccessibilityLabel: "Home tab",
          tabBarIcon: ({ focused }) => <Home size={21} color={iconColor(focused)} />
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarAccessibilityLabel: "Discover tab",
          tabBarIcon: ({ focused }) => <Search size={21} color={iconColor(focused)} />
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Saved",
          tabBarAccessibilityLabel: "Wishlist tab",
          tabBarIcon: ({ focused }) => <Heart size={21} color={iconColor(focused)} />
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Bag",
          tabBarAccessibilityLabel: "Cart tab",
          tabBarIcon: ({ focused }) => <ShoppingBag size={21} color={iconColor(focused)} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarAccessibilityLabel: "Profile tab",
          tabBarIcon: ({ focused }) => <UserRound size={21} color={iconColor(focused)} />
        }}
      />
    </Tabs>
  );
}
