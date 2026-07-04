import * as Notifications from "expo-notifications";

export type RoberNotificationPayload = {
  type: "product" | "order" | "compare" | "profile";
  productId?: string;
  orderId?: string;
  query?: string;
};

export async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return current;
  }
  return Notifications.requestPermissionsAsync();
}

export async function registerPushToken() {
  const permission = await requestNotificationPermission();
  if (!permission.granted) {
    return undefined;
  }
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export function routeFromNotificationPayload(payload: RoberNotificationPayload) {
  if (payload.type === "product" && payload.productId) {
    return `/product/${payload.productId}`;
  }
  if (payload.type === "order") {
    return "/orders";
  }
  if (payload.type === "compare") {
    return "/compare";
  }
  return "/(tabs)/profile";
}

export function mockNotificationPayload(): RoberNotificationPayload {
  return {
    type: "product",
    productId: "fieldstone-overshirt-clay"
  };
}
